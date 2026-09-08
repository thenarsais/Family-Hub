import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';
import { applyMultiplier, getDailyStreak } from './streaks';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  weeklyTarget: number;
  pointsValue: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A habit plus this week's progress — what the board section renders. */
export interface HabitWithStatus extends Habit {
  assigneeName?: string;
  /** Completions counted in the family-local current week (Mon–Sun). */
  weekCompletions: number;
  /** True if there is a completion for the family-local today. */
  completedToday: boolean;
  /** The id of today's completion, so the client can offer "undo". */
  completionId?: string;
  /** Consecutive family-local weeks (ending this week) that met weeklyTarget. */
  weekStreak: number;
}

export type MoodValue = 'great' | 'good' | 'ok' | 'low' | 'sad';
export const MOOD_VALUES: MoodValue[] = ['great', 'good', 'ok', 'low', 'sad'];

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodValue;
  emoji?: string;
  note?: string;
  recordedAt: Date;
}

/** One day's mood for one member — the shape the FR-149 heatmap reads. */
export interface MoodDay {
  userId: string;
  assigneeName: string | null;
  day: string; // YYYY-MM-DD in the family timezone
  mood: MoodValue;
  emoji: string | null;
}

interface HabitRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  weekly_target: number;
  points_value: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface MoodRow {
  id: string;
  user_id: string;
  mood: MoodValue;
  emoji: string | null;
  note: string | null;
  recorded_at: string;
}

// PATCH /api/habits/:id passes req.body through with only this column whitelist.
const UPDATABLE_COLUMNS = ['title', 'description', 'weekly_target', 'points_value', 'enabled'];

export class HabitService {
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

  /**
   * Create a habit. `assigneeId` (default: the caller) is stored as user_id.
   * Throws 'bad-assignee' when it isn't a family member.
   */
  async createHabit(
    creatorId: string,
    title: string,
    description: string | undefined,
    weeklyTarget: number,
    pointsValue: number,
    assigneeId?: string,
  ): Promise<Habit> {
    const assignee = assigneeId ?? creatorId;
    if (assignee !== creatorId && !(await this.sharesFamily(creatorId, assignee))) {
      throw new Error('bad-assignee');
    }
    const result = await queryOne<HabitRow>(
      `INSERT INTO habits (user_id, title, description, weekly_target, points_value, enabled)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, user_id, title, description, weekly_target, points_value, enabled, created_at, updated_at`,
      [assignee, title, description || null, weeklyTarget, pointsValue],
    );
    if (!result) throw new Error('Failed to create habit');
    return this.mapHabit(result);
  }

  /**
   * Edit a habit's whitelisted fields. The caller must share a family with the
   * habit's assignee. Returns the updated habit, or null when nothing matched.
   */
  async updateHabit(
    callerId: string,
    habitId: string,
    updates: Record<string, unknown>,
  ): Promise<Habit | null> {
    const habit = await queryOne<HabitRow>(`SELECT * FROM habits WHERE id = $1`, [habitId]);
    if (!habit || !(await this.sharesFamily(callerId, habit.user_id))) return null;

    const columns = Object.keys(updates || {}).filter((k) => UPDATABLE_COLUMNS.includes(k));
    if (columns.length === 0) return this.mapHabit(habit);

    const setClauses = columns.map((col, i) => `${col} = $${i + 2}`);
    const values = columns.map((col) => updates[col]);
    const updated = await queryOne<HabitRow>(
      `UPDATE habits SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id, title, description, weekly_target, points_value, enabled, created_at, updated_at`,
      [habitId, ...values],
    );
    return updated ? this.mapHabit(updated) : null;
  }

  /**
   * The board view — one user's enabled habits with this week's progress and
   * streak. `scope: 'family'` is the parent Manage panel: every family member's
   * habits including disabled, with the assignee's name.
   */
  async getHabits(
    viewerId: string,
    scope: 'mine' | 'family' = 'mine',
  ): Promise<HabitWithStatus[]> {
    const tz = await this.familyTz(viewerId);
    let whereClause: string;
    let params: unknown[];

    if (scope === 'family') {
      const fid = await this.familyId(viewerId);
      if (!fid) return [];
      whereClause = `h.user_id IN (
        SELECT user_id FROM family_members WHERE family_id = $2 AND is_active = true
      )`;
      params = [tz, fid];
    } else {
      whereClause = `h.user_id = $2 AND h.enabled = true`;
      params = [tz, viewerId];
    }

    const rows = await query<
      HabitRow & {
        assignee_name: string | null;
        completion_id: string | null;
        week_completions: string;
        week_streak: string;
      }
    >(
      `SELECT h.id, h.user_id, h.title, h.description, h.weekly_target, h.points_value,
              h.enabled, h.created_at, h.updated_at,
              u.name AS assignee_name,
              comp.id AS completion_id,
              wk.n AS week_completions,
              streak.len AS week_streak
       FROM habits h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN LATERAL (
         SELECT id FROM habit_completions
         WHERE habit_id = h.id
           AND (completed_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
         ORDER BY completed_at DESC
         LIMIT 1
       ) comp ON true
       LEFT JOIN LATERAL (
         SELECT count(*) AS n FROM habit_completions
         WHERE habit_id = h.id
           AND date_trunc('week', completed_at AT TIME ZONE $1)
               = date_trunc('week', now() AT TIME ZONE $1)
       ) wk ON true
       LEFT JOIN LATERAL (
         WITH weeks AS (
           SELECT date_trunc('week', completed_at AT TIME ZONE $1) AS wk, count(*) AS n
           FROM habit_completions WHERE habit_id = h.id
           GROUP BY 1
         ),
         ranked AS (
           SELECT round(EXTRACT(EPOCH FROM
                    (date_trunc('week', now() AT TIME ZONE $1) - wk)) / 604800)::int AS gap,
                  (row_number() OVER (ORDER BY wk DESC))::int - 1 AS rn
           FROM weeks
           WHERE n >= h.weekly_target
             AND wk <= date_trunc('week', now() AT TIME ZONE $1)
         )
         SELECT count(*)::int AS len FROM ranked WHERE gap = rn
       ) streak ON true
       WHERE ${whereClause}
       ORDER BY h.title`,
      params,
    );

    return rows.rows.map((r) => ({
      ...this.mapHabit(r),
      assigneeName: r.assignee_name ?? undefined,
      weekCompletions: parseInt(r.week_completions ?? '0', 10),
      completedToday: !!r.completion_id,
      completionId: r.completion_id ?? undefined,
      weekStreak: parseInt(r.week_streak ?? '0', 10),
    }));
  }

  /**
   * Complete one of the caller's own habits for today and award its points
   * (scaled by the daily streak, FR-035). One completion per family-local day —
   * throws 'already-completed-today'.
   */
  async completeHabit(userId: string, habitId: string): Promise<{ pointsEarned: number }> {
    const habit = await queryOne<Pick<HabitRow, 'points_value'>>(
      'SELECT points_value FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, userId],
    );
    if (!habit) throw new Error('Habit not found');

    const tz = await this.familyTz(userId);
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM habit_completions
       WHERE habit_id = $1 AND user_id = $2
         AND (completed_at AT TIME ZONE $3)::date = (now() AT TIME ZONE $3)::date
       LIMIT 1`,
      [habitId, userId, tz],
    );
    if (existing) throw new Error('already-completed-today');

    const completion = await queryOne<{ id: string }>(
      `INSERT INTO habit_completions (habit_id, user_id, points_earned)
       VALUES ($1, $2, $3) RETURNING id`,
      [habitId, userId, habit.points_value],
    );
    if (!completion) throw new Error('Failed to record habit completion');

    const streak = await getDailyStreak(userId, tz);
    const earned = applyMultiplier(habit.points_value, streak);
    if (earned !== habit.points_value) {
      await query(`UPDATE habit_completions SET points_earned = $1 WHERE id = $2`, [
        earned,
        completion.id,
      ]);
    }
    await PointsRepository.addPoints(userId, earned, 'habit', `Habit: ${habitId}`);
    return { pointsEarned: earned };
  }

  /**
   * Undo today's completion of one of the caller's own habits — removes the row
   * and reverses the points. Returns false when there was nothing to undo.
   */
  async undoHabitCompletion(userId: string, habitId: string): Promise<boolean> {
    const tz = await this.familyTz(userId);
    const removed = await queryOne<{ id: string }>(
      `DELETE FROM habit_completions
       WHERE id = (
         SELECT id FROM habit_completions
         WHERE habit_id = $1 AND user_id = $2
           AND (completed_at AT TIME ZONE $3)::date = (now() AT TIME ZONE $3)::date
         ORDER BY completed_at DESC
         LIMIT 1
       )
       RETURNING id`,
      [habitId, userId, tz],
    );
    if (!removed) return false;
    await PointsRepository.removePoints(userId, 'habit', `Habit: ${habitId}`);
    return true;
  }

  // ---- Daily mood check-in (FR-028) ----

  /** The caller's mood for the family-local today, if they've logged one. */
  async getTodayMood(userId: string): Promise<MoodEntry | null> {
    const tz = await this.familyTz(userId);
    const row = await queryOne<MoodRow>(
      `SELECT * FROM mood_entries
       WHERE user_id = $1
         AND (recorded_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
       ORDER BY recorded_at DESC LIMIT 1`,
      [userId, tz],
    );
    return row ? this.mapMood(row) : null;
  }

  /**
   * Record (or replace) the caller's mood for today. Changing your mind before
   * the family-local midnight overwrites the existing entry.
   */
  async setMood(
    userId: string,
    mood: MoodValue,
    emoji?: string,
    note?: string,
  ): Promise<MoodEntry> {
    const tz = await this.familyTz(userId);
    const fid = await this.familyId(userId);
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM mood_entries
       WHERE user_id = $1
         AND (recorded_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
       LIMIT 1`,
      [userId, tz],
    );

    const row = existing
      ? await queryOne<MoodRow>(
          `UPDATE mood_entries
           SET mood = $2, emoji = $3, note = $4, recorded_at = now()
           WHERE id = $1 RETURNING *`,
          [existing.id, mood, emoji ?? null, note ?? null],
        )
      : await queryOne<MoodRow>(
          `INSERT INTO mood_entries (user_id, family_id, mood, emoji, note)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [userId, fid, mood, emoji ?? null, note ?? null],
        );
    if (!row) throw new Error('Failed to record mood');
    return this.mapMood(row);
  }

  /**
   * One row per member per day for the last `days` days — the parent mood
   * heatmap (FR-149). Family-scoped and parent/admin-only; throws 'not-parent'
   * otherwise (mood history is more sensitive than the board data).
   */
  async getFamilyMoodHistory(callerId: string, days = 35): Promise<MoodDay[]> {
    const caller = await queryOne<{ family_id: string; role: string }>(
      `SELECT family_id, role FROM family_members
       WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [callerId],
    );
    if (!caller) return [];
    if (!['parent', 'admin'].includes(caller.role)) throw new Error('not-parent');
    const fid = caller.family_id;
    const tz = await this.familyTz(callerId);
    const span = Math.min(Math.max(Math.trunc(days) || 35, 1), 180);
    const rows = await query<{
      user_id: string;
      assignee_name: string | null;
      day: string;
      mood: MoodValue;
      emoji: string | null;
    }>(
      `SELECT DISTINCT ON (m.user_id, (m.recorded_at AT TIME ZONE $1)::date)
              m.user_id,
              u.name AS assignee_name,
              (m.recorded_at AT TIME ZONE $1)::date AS day,
              m.mood, m.emoji
       FROM mood_entries m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.family_id = $2
         AND m.recorded_at >= now() - make_interval(days => $3)
       ORDER BY m.user_id, (m.recorded_at AT TIME ZONE $1)::date, m.recorded_at DESC`,
      [tz, fid, span],
    );
    return rows.rows.map((r) => ({
      userId: r.user_id,
      assigneeName: r.assignee_name,
      day: typeof r.day === 'string' ? r.day : new Date(r.day).toISOString().slice(0, 10),
      mood: r.mood,
      emoji: r.emoji,
    }));
  }

  private mapHabit(row: HabitRow): Habit {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description ?? undefined,
      weeklyTarget: row.weekly_target,
      pointsValue: row.points_value,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapMood(row: MoodRow): MoodEntry {
    return {
      id: row.id,
      userId: row.user_id,
      mood: row.mood,
      emoji: row.emoji ?? undefined,
      note: row.note ?? undefined,
      recordedAt: new Date(row.recorded_at),
    };
  }
}

let habitService: HabitService | null = null;

export function getHabitService(): HabitService {
  if (!habitService) habitService = new HabitService();
  return habitService;
}
