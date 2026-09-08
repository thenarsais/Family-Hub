import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';
import type { ActivityPoints } from '../database/repositories/PointsRepository';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Chore {
  id: string;
  userId: string;
  name: string;
  description?: string;
  timeSlot: TimeSlot;
  pointsValue: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A chore plus today's state — what the board and the manage panel render. */
export interface ChoreWithStatus extends Chore {
  /** Display name of `userId` (the assignee). */
  assigneeName?: string;
  /** True if this chore already has a completion for the family's local today. */
  completedToday: boolean;
  /** The id of today's completion, so the client can offer "undo". */
  completionId?: string;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  userId: string;
  completedAt: Date;
  pointsEarned: number;
}

/** Monthly-points reward tiers (FR-022). Hardcoded for v1; family-configurable later. */
export const CHORE_TIERS = [
  { name: 'bronze', points: 200 },
  { name: 'silver', points: 300 },
  { name: 'gold', points: 400 },
] as const;

interface ChoreRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  time_slot: TimeSlot;
  points_value: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ChoreCompletionRow {
  id: string;
  chore_id: string;
  user_id: string;
  completed_at: string;
  points_earned: number;
}

interface ChoreProgressRow {
  total_completed: string | null;
  this_week: string | null;
  this_month: string | null;
  points_earned: string | null;
}

// PATCH /api/chores/:id passes req.body through with only this column whitelist.
const UPDATABLE_COLUMNS = ['name', 'description', 'time_slot', 'points_value', 'enabled'];

export class ChoreService {
  /** The caller's active family id, or null when they aren't in one. */
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

  /** The family's timezone for the daily-reset boundary (default the family's home region). */
  private async familyTz(userId: string): Promise<string> {
    const row = await queryOne<{ timezone: string | null }>(
      `SELECT fs.timezone
       FROM family_members fm
       LEFT JOIN family_settings fs ON fs.family_id = fm.family_id
       WHERE fm.user_id = $1 AND fm.is_active = true
       LIMIT 1`,
      [userId],
    );
    return row?.timezone || 'America/Denver';
  }

  /** Whether `other` is an active member of `caller`'s family (true for self). */
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

  /**
   * Create a chore. `assigneeId` (default: the caller) is stored as user_id —
   * "whose chore". Throws 'bad-assignee' when it isn't a family member.
   */
  async createChore(
    creatorId: string,
    name: string,
    description: string | undefined,
    timeSlot: string,
    pointsValue: number,
    assigneeId?: string,
  ): Promise<Chore> {
    const assignee = assigneeId ?? creatorId;
    if (assignee !== creatorId && !(await this.sharesFamily(creatorId, assignee))) {
      throw new Error('bad-assignee');
    }

    const result = await queryOne<ChoreRow>(
      `INSERT INTO chores (user_id, name, description, time_slot, points_value, enabled)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, user_id, name, description, time_slot, points_value, enabled, created_at, updated_at`,
      [assignee, name, description || null, timeSlot, pointsValue],
    );
    if (!result) throw new Error('Failed to create chore');
    return this.mapChore(result);
  }

  /**
   * Edit a chore's whitelisted fields. The caller must share a family with the
   * chore's assignee. Returns the updated chore, or null when nothing matched.
   */
  async updateChore(
    callerId: string,
    choreId: string,
    updates: Record<string, unknown>,
  ): Promise<Chore | null> {
    const chore = await queryOne<ChoreRow>(`SELECT * FROM chores WHERE id = $1`, [choreId]);
    if (!chore || !(await this.sharesFamily(callerId, chore.user_id))) return null;

    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_COLUMNS.includes(k));
    if (columns.length === 0) return this.mapChore(chore);

    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<ChoreRow>(
      `UPDATE chores SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id, name, description, time_slot, points_value, enabled, created_at, updated_at`,
      [choreId, ...values],
    );
    return updated ? this.mapChore(updated) : null;
  }

  /**
   * The board view — one user's enabled chores, each with today's completion
   * state. `scope: 'family'` is the parent Manage panel: every family member's
   * chores including disabled ones, with the assignee's name.
   */
  async getChores(
    viewerId: string,
    scope: 'mine' | 'family' = 'mine',
  ): Promise<ChoreWithStatus[]> {
    const tz = await this.familyTz(viewerId);
    let whereClause: string;
    let params: unknown[];

    if (scope === 'family') {
      const fid = await this.familyId(viewerId);
      if (!fid) return [];
      whereClause = `c.user_id IN (
        SELECT user_id FROM family_members WHERE family_id = $2 AND is_active = true
      )`;
      params = [tz, fid];
    } else {
      whereClause = `c.user_id = $2 AND c.enabled = true`;
      params = [tz, viewerId];
    }

    const rows = await query<
      ChoreRow & { assignee_name: string | null; completion_id: string | null }
    >(
      `SELECT c.id, c.user_id, c.name, c.description, c.time_slot, c.points_value,
              c.enabled, c.created_at, c.updated_at,
              u.name AS assignee_name,
              comp.id AS completion_id
       FROM chores c
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN LATERAL (
         SELECT id FROM chore_completions
         WHERE chore_id = c.id
           AND (completed_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
         ORDER BY completed_at DESC
         LIMIT 1
       ) comp ON true
       WHERE ${whereClause}
       ORDER BY c.time_slot, c.name`,
      params,
    );

    return rows.rows.map((r) => ({
      ...this.mapChore(r),
      assigneeName: r.assignee_name ?? undefined,
      completedToday: !!r.completion_id,
      completionId: r.completion_id ?? undefined,
    }));
  }

  /** @deprecated use getChores(userId, 'mine'). Kept for callers not yet migrated. */
  async getUserChores(userId: string): Promise<ChoreWithStatus[]> {
    return this.getChores(userId, 'mine');
  }

  /**
   * Complete one of the caller's own chores and award its points. Guarded to
   * one completion per family-local day — throws 'already-completed-today'.
   */
  async completeChore(userId: string, choreId: string): Promise<ChoreCompletion> {
    const chore = await queryOne<Pick<ChoreRow, 'points_value'>>(
      'SELECT points_value FROM chores WHERE id = $1 AND user_id = $2',
      [choreId, userId],
    );
    if (!chore) throw new Error('Chore not found');

    const tz = await this.familyTz(userId);
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM chore_completions
       WHERE chore_id = $1 AND user_id = $2
         AND (completed_at AT TIME ZONE $3)::date = (now() AT TIME ZONE $3)::date
       LIMIT 1`,
      [choreId, userId, tz],
    );
    if (existing) throw new Error('already-completed-today');

    const completion = await queryOne<ChoreCompletionRow>(
      `INSERT INTO chore_completions (chore_id, user_id, points_earned)
       VALUES ($1, $2, $3)
       RETURNING id, chore_id, user_id, completed_at, points_earned`,
      [choreId, userId, chore.points_value],
    );
    if (!completion) throw new Error('Failed to record chore completion');

    // The one real points ledger (activity_points) -- see 002_chores_and_learning_schema.sql.
    await PointsRepository.addPoints(userId, chore.points_value, 'chore', `Completed: ${choreId}`);

    return {
      id: completion.id,
      choreId: completion.chore_id,
      userId: completion.user_id,
      completedAt: new Date(completion.completed_at),
      pointsEarned: completion.points_earned,
    };
  }

  /**
   * Undo today's completion of one of the caller's own chores — removes the
   * completion row and reverses the points award. Returns false when there was
   * nothing to undo today.
   */
  async undoCompletion(userId: string, choreId: string): Promise<boolean> {
    const tz = await this.familyTz(userId);
    const removed = await queryOne<{ id: string }>(
      `DELETE FROM chore_completions
       WHERE id = (
         SELECT id FROM chore_completions
         WHERE chore_id = $1 AND user_id = $2
           AND (completed_at AT TIME ZONE $3)::date = (now() AT TIME ZONE $3)::date
         ORDER BY completed_at DESC
         LIMIT 1
       )
       RETURNING id`,
      [choreId, userId, tz],
    );
    if (!removed) return false;

    await PointsRepository.removePoints(userId, 'chore', `Completed: ${choreId}`);
    return true;
  }

  /**
   * Get chore progress/statistics for user
   */
  async getChoreProgress(userId: string): Promise<{
    totalCompleted: number;
    thisWeek: number;
    thisMonth: number;
    pointsEarned: number;
  }> {
    const results = await queryOne<ChoreProgressRow>(
      `SELECT
        COUNT(*) as total_completed,
        SUM(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week,
        SUM(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as this_month,
        SUM(points_earned) as points_earned
       FROM chore_completions WHERE user_id = $1`,
      [userId],
    );

    return {
      totalCompleted: parseInt(results?.total_completed || '0'),
      thisWeek: parseInt(results?.this_week || '0'),
      thisMonth: parseInt(results?.this_month || '0'),
      pointsEarned: parseInt(results?.points_earned || '0'),
    };
  }

  /**
   * Get user's points summary (delegates to the one real points ledger,
   * activity_points, via PointsRepository -- see
   * 002_chores_and_learning_schema.sql for why this used to be a separate,
   * disconnected ledger that never showed up anywhere real)
   */
  async getPointsSummary(userId: string): Promise<{
    totalPoints: number;
    dailyPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
  }> {
    const [totalPoints, dailyPoints, weeklyPoints, monthlyPoints] = await Promise.all([
      PointsRepository.getTotalPoints(userId),
      PointsRepository.getPointsToday(userId),
      PointsRepository.getPointsThisWeek(userId),
      PointsRepository.getPointsThisMonth(userId),
    ]);

    return { totalPoints, dailyPoints, weeklyPoints, monthlyPoints };
  }

  /**
   * Get point transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<ActivityPoints[]> {
    return PointsRepository.getPointsHistory(userId, limit);
  }

  private mapChore(row: ChoreRow): Chore {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      timeSlot: row.time_slot,
      pointsValue: row.points_value,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

let choreService: ChoreService | null = null;

export function getChoreService(): ChoreService {
  if (!choreService) {
    choreService = new ChoreService();
  }
  return choreService;
}
