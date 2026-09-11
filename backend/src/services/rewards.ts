import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';
import { CHORE_TIERS } from './chores';

/**
 * Reward fulfilment (FR-142 / T-24). Two independent milestones drive
 * eligibility off the existing activity_points ledger: a per-kid weekly points
 * goal, and the pre-existing monthly bronze/silver/gold tiers (CHORE_TIERS).
 * Hitting either creates a pending reward_earned row; a parent later fulfills
 * it by picking a reward_library item. Fulfilling never touches points.
 *
 * Weekly/monthly boundaries are deliberately UTC-anchored (not family-tz-aware)
 * — monthly reuses PointsRepository.getPointsThisMonth's existing UTC-month
 * convention (the same one the pre-existing tier bar already used); weekly uses
 * a fresh calendar-week (Monday-Sunday) query, NOT getPointsThisWeek (which is a
 * rolling 7-day window — a different concept with no stable period to key on).
 */

export type MilestoneType = 'weekly' | 'bronze' | 'silver' | 'gold';

export interface RewardSettings {
  weeklyGoal: number;
}

export interface RewardLibraryItem {
  id: string;
  title: string;
  description: string | null;
  cashAmount: number | null;
  active: boolean;
}

export interface RewardEarned {
  id: string;
  userId: string;
  assigneeName?: string;
  milestoneType: MilestoneType;
  periodKey: string;
  earnedAt: string;
  fulfilledAt: string | null;
  libraryItem: RewardLibraryItem | null;
  fulfillmentNote: string | null;
}

export interface RewardsToday {
  weeklyGoal: number;
  weekPoints: number;
  monthPoints: number;
  tiers: { name: string; points: number; reached: boolean }[];
  justEarned: MilestoneType[];
}

const DEFAULT_WEEKLY_GOAL = 50;

interface SettingsRow {
  user_id: string;
  weekly_goal: number;
}

interface LibraryRow {
  id: string;
  title: string;
  description: string | null;
  cash_amount: string | null; // NUMERIC comes back as a string
  active: boolean;
  family_id: string;
}

const UPDATABLE_LIBRARY_COLUMNS = ['title', 'description', 'cash_amount', 'active'];

function mapLibraryItem(row: LibraryRow): RewardLibraryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    cashAmount: row.cash_amount === null ? null : parseFloat(row.cash_amount),
    active: row.active,
  };
}

export class RewardService {
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  private async sharesFamily(caller: string, other: string): Promise<boolean> {
    if (caller === other) return true;
    const fid = await this.familyId(caller);
    if (!fid) return false;
    const row = await queryOne<{ ok: number }>(
      `SELECT 1 AS ok FROM family_members
       WHERE user_id = $1 AND family_id = $2 AND is_active = true LIMIT 1`,
      [other, fid],
    );
    return !!row;
  }

  async getSettings(userId: string): Promise<RewardSettings> {
    const row = await queryOne<SettingsRow>(
      `SELECT * FROM reward_settings WHERE user_id = $1`,
      [userId],
    );
    return { weeklyGoal: row?.weekly_goal ?? DEFAULT_WEEKLY_GOAL };
  }

  async getFamilySettings(
    viewerId: string,
  ): Promise<Array<{ userId: string; name: string | null; weeklyGoal: number }>> {
    const fid = await this.familyId(viewerId);
    if (!fid) return [];
    const members = await query<{ user_id: string; name: string | null }>(
      `SELECT fm.user_id, u.name
       FROM family_members fm
       LEFT JOIN users u ON u.id = fm.user_id
       WHERE fm.family_id = $1 AND fm.is_active = true
       ORDER BY u.name`,
      [fid],
    );
    const rows = await query<SettingsRow>(
      `SELECT * FROM reward_settings WHERE user_id = ANY($1)`,
      [members.rows.map((m) => m.user_id)],
    );
    const byUser = new Map(rows.rows.map((r) => [r.user_id, r]));
    return members.rows.map((m) => ({
      userId: m.user_id,
      name: m.name,
      weeklyGoal: byUser.get(m.user_id)?.weekly_goal ?? DEFAULT_WEEKLY_GOAL,
    }));
  }

  async setSettings(callerId: string, targetUserId: string, weeklyGoal: number): Promise<RewardSettings> {
    if (!(await this.sharesFamily(callerId, targetUserId))) {
      throw new Error('bad-assignee');
    }
    const row = await queryOne<SettingsRow>(
      `INSERT INTO reward_settings (user_id, weekly_goal)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET weekly_goal = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [targetUserId, weeklyGoal],
    );
    if (!row) throw new Error('Failed to save reward settings');
    return { weeklyGoal: row.weekly_goal };
  }

  /** All (active + retired) library items for the viewer's family. */
  async getLibrary(viewerId: string): Promise<RewardLibraryItem[]> {
    const fid = await this.familyId(viewerId);
    if (!fid) return [];
    const rows = await query<LibraryRow>(
      `SELECT * FROM reward_library WHERE family_id = $1 ORDER BY active DESC, title`,
      [fid],
    );
    return rows.rows.map(mapLibraryItem);
  }

  async addLibraryItem(
    callerId: string,
    input: { title: string; description?: string; cashAmount?: number },
  ): Promise<RewardLibraryItem> {
    const familyId = await this.familyId(callerId);
    if (!familyId) throw new Error('no-family');

    const row = await queryOne<LibraryRow>(
      `INSERT INTO reward_library (family_id, title, description, cash_amount, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [familyId, input.title, input.description || null, input.cashAmount ?? null, callerId],
    );
    if (!row) throw new Error('Failed to add reward');
    return mapLibraryItem(row);
  }

  async updateLibraryItem(
    callerId: string,
    itemId: string,
    updates: Record<string, unknown>,
  ): Promise<RewardLibraryItem | null> {
    const item = await queryOne<LibraryRow>(`SELECT * FROM reward_library WHERE id = $1`, [itemId]);
    if (!item) return null;
    const callerFamily = await this.familyId(callerId);
    if (!callerFamily || callerFamily !== item.family_id) return null;

    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_LIBRARY_COLUMNS.includes(k));
    if (columns.length === 0) return mapLibraryItem(item);

    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<LibraryRow>(
      `UPDATE reward_library SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      [itemId, ...values],
    );
    return updated ? mapLibraryItem(updated) : null;
  }

  /**
   * Checks the weekly goal + monthly tiers against the current points totals
   * and records any newly-crossed milestone as a pending reward_earned row.
   * Idempotent within a period via UNIQUE(user_id, milestone_type, period_key).
   */
  async checkAndRecord(userId: string): Promise<RewardsToday> {
    const keys = await queryOne<{ week_key: string; month_key: string }>(
      `SELECT to_char(date_trunc('week', now()), 'YYYY-MM-DD') AS week_key,
              to_char(now(), 'YYYY-MM') AS month_key`,
    );
    const weekKey = keys?.week_key ?? '';
    const monthKey = keys?.month_key ?? '';

    const settings = await this.getSettings(userId);

    const weekRow = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(points), 0) AS total FROM activity_points
       WHERE user_id = $1 AND date_trunc('week', created_at) = date_trunc('week', now())`,
      [userId],
    );
    const weekPoints = parseInt(weekRow?.total ?? '0', 10);
    const monthPoints = await PointsRepository.getPointsThisMonth(userId);

    const justEarned: MilestoneType[] = [];

    if (weekPoints >= settings.weeklyGoal) {
      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO reward_earned (user_id, milestone_type, period_key)
         VALUES ($1, 'weekly', $2)
         ON CONFLICT (user_id, milestone_type, period_key) DO NOTHING
         RETURNING id`,
        [userId, weekKey],
      );
      if (inserted) justEarned.push('weekly');
    }

    const tiers = [];
    for (const tier of CHORE_TIERS) {
      const reached = monthPoints >= tier.points;
      if (reached) {
        const inserted = await queryOne<{ id: string }>(
          `INSERT INTO reward_earned (user_id, milestone_type, period_key)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, milestone_type, period_key) DO NOTHING
           RETURNING id`,
          [userId, tier.name, monthKey],
        );
        if (inserted) justEarned.push(tier.name as MilestoneType);
      }
      tiers.push({ name: tier.name, points: tier.points, reached });
    }

    return { weeklyGoal: settings.weeklyGoal, weekPoints, monthPoints, tiers, justEarned };
  }

  /** Every reward_earned row for a user (mine) or a whole family (family). */
  async getEarned(viewerId: string, scope: 'mine' | 'family' = 'mine'): Promise<RewardEarned[]> {
    let whereClause: string;
    let params: unknown[];

    if (scope === 'family') {
      const fid = await this.familyId(viewerId);
      if (!fid) return [];
      whereClause = `re.user_id IN (
        SELECT user_id FROM family_members WHERE family_id = $1 AND is_active = true
      )`;
      params = [fid];
    } else {
      whereClause = `re.user_id = $1`;
      params = [viewerId];
    }

    const rows = await query<{
      id: string;
      user_id: string;
      assignee_name: string | null;
      milestone_type: MilestoneType;
      period_key: string;
      earned_at: string;
      fulfilled_at: string | null;
      fulfillment_note: string | null;
      lib_id: string | null;
      lib_title: string | null;
      lib_description: string | null;
      lib_cash_amount: string | null;
      lib_active: boolean | null;
    }>(
      `SELECT re.id, re.user_id, u.name AS assignee_name, re.milestone_type, re.period_key,
              re.earned_at, re.fulfilled_at, re.fulfillment_note,
              rl.id AS lib_id, rl.title AS lib_title, rl.description AS lib_description,
              rl.cash_amount AS lib_cash_amount, rl.active AS lib_active
       FROM reward_earned re
       LEFT JOIN users u ON u.id = re.user_id
       LEFT JOIN reward_library rl ON rl.id = re.library_item_id
       WHERE ${whereClause}
       ORDER BY re.earned_at DESC`,
      params,
    );

    return rows.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      assigneeName: r.assignee_name ?? undefined,
      milestoneType: r.milestone_type,
      periodKey: r.period_key,
      earnedAt: r.earned_at,
      fulfilledAt: r.fulfilled_at,
      fulfillmentNote: r.fulfillment_note,
      libraryItem: r.lib_id
        ? {
            id: r.lib_id,
            title: r.lib_title as string,
            description: r.lib_description,
            cashAmount: r.lib_cash_amount === null ? null : parseFloat(r.lib_cash_amount),
            active: !!r.lib_active,
          }
        : null,
    }));
  }

  async fulfillReward(
    callerId: string,
    rewardId: string,
    libraryItemId: string,
    note?: string,
  ): Promise<RewardEarned> {
    const reward = await queryOne<{ user_id: string; fulfilled_at: string | null }>(
      `SELECT user_id, fulfilled_at FROM reward_earned WHERE id = $1`,
      [rewardId],
    );
    if (!reward) throw new Error('not-found');
    if (!(await this.sharesFamily(callerId, reward.user_id))) throw new Error('bad-assignee');
    if (reward.fulfilled_at) throw new Error('already-fulfilled');

    const item = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM reward_library WHERE id = $1`,
      [libraryItemId],
    );
    const callerFamily = await this.familyId(callerId);
    if (!item || !callerFamily || item.family_id !== callerFamily) {
      throw new Error('bad-library-item');
    }

    await query(
      `UPDATE reward_earned
       SET fulfilled_at = now(), library_item_id = $1, fulfillment_note = $2
       WHERE id = $3`,
      [libraryItemId, note || null, rewardId],
    );

    const rows = await this.getEarned(reward.user_id, 'mine');
    const found = rows.find((r) => r.id === rewardId);
    if (!found) throw new Error('Failed to load fulfilled reward');
    return found;
  }
}

let rewardService: RewardService | null = null;

export function getRewardService(): RewardService {
  if (!rewardService) {
    rewardService = new RewardService();
  }
  return rewardService;
}
