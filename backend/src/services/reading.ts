import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';

/**
 * Reading challenges (FR-027 / T-21). One dated, one-shot log per family-local
 * day (like homework — no daily-reset completions table). `goal_minutes` /
 * `goal_met` / `points_earned` are snapshotted on the log row at write time so a
 * later goal edit never rewrites history. Points are flat — NO streak
 * multiplier, unlike chores/habits.
 */

export interface ReadingGoals {
  dailyMinutes: number;
  weeklyMinutes: number;
  pointsValue: number;
}

export interface ReadingLog {
  minutes: number;
  goalMet: boolean;
  pointsEarned: number;
}

export interface ReadingToday {
  goals: ReadingGoals;
  log: ReadingLog | null;
  /** Sum of minutes logged this family-local Monday–Sunday week. */
  weekMinutes: number;
  /** Consecutive family-local days ending today with goalMet. */
  streak: number;
}

const DEFAULT_GOALS: ReadingGoals = { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 };

interface GoalsRow {
  user_id: string;
  daily_minutes: number;
  weekly_minutes: number;
  points_value: number;
}

const UPDATABLE_GOAL_COLUMNS = ['daily_minutes', 'weekly_minutes', 'points_value'];

export class ReadingService {
  private async familyId(userId: string): Promise<string | null> {
    const row = await queryOne<{ family_id: string }>(
      `SELECT family_id FROM family_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId],
    );
    return row?.family_id ?? null;
  }

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

  /** A user's reading goals, defaulting to 20 min/day · 100 min/week · 10 pts. */
  async getGoals(userId: string): Promise<ReadingGoals> {
    const row = await queryOne<GoalsRow>(
      `SELECT * FROM reading_goals WHERE user_id = $1`,
      [userId],
    );
    if (!row) return { ...DEFAULT_GOALS };
    return {
      dailyMinutes: row.daily_minutes,
      weeklyMinutes: row.weekly_minutes,
      pointsValue: row.points_value,
    };
  }

  /** Every active family member's goals — the parent Manage panel. */
  async getFamilyGoals(
    viewerId: string,
  ): Promise<Array<{ userId: string; name: string | null } & ReadingGoals>> {
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
    const goalRows = await query<GoalsRow>(
      `SELECT * FROM reading_goals WHERE user_id = ANY($1)`,
      [members.rows.map((m) => m.user_id)],
    );
    const byUser = new Map(goalRows.rows.map((r) => [r.user_id, r]));
    return members.rows.map((m) => {
      const r = byUser.get(m.user_id);
      return {
        userId: m.user_id,
        name: m.name,
        dailyMinutes: r?.daily_minutes ?? DEFAULT_GOALS.dailyMinutes,
        weeklyMinutes: r?.weekly_minutes ?? DEFAULT_GOALS.weeklyMinutes,
        pointsValue: r?.points_value ?? DEFAULT_GOALS.pointsValue,
      };
    });
  }

  /**
   * Upsert a user's goals. The caller must share a family with `targetUserId`
   * (or be editing their own). Throws 'bad-assignee' otherwise.
   */
  async setGoals(
    callerId: string,
    targetUserId: string,
    updates: Record<string, unknown>,
  ): Promise<ReadingGoals> {
    if (!(await this.sharesFamily(callerId, targetUserId))) {
      throw new Error('bad-assignee');
    }
    const columns = Object.keys(updates || {}).filter((k) =>
      UPDATABLE_GOAL_COLUMNS.includes(k),
    );
    const current = await this.getGoals(targetUserId);
    const next = {
      daily_minutes: (updates.daily_minutes as number) ?? current.dailyMinutes,
      weekly_minutes: (updates.weekly_minutes as number) ?? current.weeklyMinutes,
      points_value: (updates.points_value as number) ?? current.pointsValue,
    };
    if (columns.length === 0) return current;

    const row = await queryOne<GoalsRow>(
      `INSERT INTO reading_goals (user_id, daily_minutes, weekly_minutes, points_value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         daily_minutes = $2, weekly_minutes = $3, points_value = $4,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [targetUserId, next.daily_minutes, next.weekly_minutes, next.points_value],
    );
    if (!row) throw new Error('Failed to save reading goals');
    return {
      dailyMinutes: row.daily_minutes,
      weeklyMinutes: row.weekly_minutes,
      pointsValue: row.points_value,
    };
  }

  /** This user's today: goals, today's log (if any), the week's total, streak. */
  async getToday(userId: string): Promise<ReadingToday> {
    const [goals, tz] = await Promise.all([this.getGoals(userId), this.familyTz(userId)]);

    const logRow = await queryOne<{ minutes: number; goal_met: boolean; points_earned: number }>(
      `SELECT minutes, goal_met, points_earned FROM reading_logs
       WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date`,
      [userId, tz],
    );

    const weekRow = await queryOne<{ total: string | null }>(
      `SELECT COALESCE(SUM(minutes), 0) AS total FROM reading_logs
       WHERE user_id = $1
         AND date_trunc('week', log_date::timestamp)
             = date_trunc('week', (now() AT TIME ZONE $2))`,
      [userId, tz],
    );

    const streakRow = await queryOne<{ len: number }>(
      `WITH days AS (
         SELECT log_date AS d FROM reading_logs WHERE user_id = $1 AND goal_met
       ),
       ranked AS (
         SELECT d,
                (now() AT TIME ZONE $2)::date - d AS gap,
                row_number() OVER (ORDER BY d DESC) - 1 AS rn
         FROM days
         WHERE d <= (now() AT TIME ZONE $2)::date
       )
       SELECT count(*)::int AS len FROM ranked WHERE gap = rn`,
      [userId, tz],
    );

    return {
      goals,
      log: logRow
        ? { minutes: logRow.minutes, goalMet: logRow.goal_met, pointsEarned: logRow.points_earned }
        : null,
      weekMinutes: parseInt(weekRow?.total ?? '0', 10),
      streak: streakRow?.len ?? 0,
    };
  }

  /**
   * Log today's reading. Throws 'bad-minutes' for a non-finite / negative value,
   * 'already-logged' when today already has a row.
   */
  async logToday(userId: string, minutes: number): Promise<ReadingToday> {
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
      throw new Error('bad-minutes');
    }
    const tz = await this.familyTz(userId);
    const goals = await this.getGoals(userId);

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM reading_logs
       WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date`,
      [userId, tz],
    );
    if (existing) throw new Error('already-logged');

    const goalMet = minutes >= goals.dailyMinutes;
    const pointsEarned = goalMet ? goals.pointsValue : 0;

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO reading_logs
         (user_id, log_date, minutes, goal_minutes, goal_met, points_earned)
       VALUES ($1, (now() AT TIME ZONE $2)::date, $3, $4, $5, $6)
       RETURNING id`,
      [userId, tz, Math.floor(minutes), goals.dailyMinutes, goalMet, pointsEarned],
    );

    if (pointsEarned > 0 && inserted) {
      await PointsRepository.addPoints(userId, pointsEarned, 'reading', `Reading: ${inserted.id}`);
    }

    return this.getToday(userId);
  }

  /**
   * Undo today's log — removes it and reverses any points it earned. Returns
   * false when there was nothing to undo.
   */
  async undoToday(userId: string): Promise<boolean> {
    const tz = await this.familyTz(userId);

    const removed = await queryOne<{ id: string; points_earned: number }>(
      `DELETE FROM reading_logs
       WHERE user_id = $1 AND log_date = (now() AT TIME ZONE $2)::date
       RETURNING id, points_earned`,
      [userId, tz],
    );
    if (!removed) return false;

    if (removed.points_earned > 0) {
      await PointsRepository.removePoints(userId, 'reading', `Reading: ${removed.id}`);
    }
    return true;
  }
}

let readingService: ReadingService | null = null;

export function getReadingService(): ReadingService {
  if (!readingService) {
    readingService = new ReadingService();
  }
  return readingService;
}
