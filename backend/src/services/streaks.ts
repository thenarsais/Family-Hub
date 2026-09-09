import { query } from '../database/connection';

/**
 * FR-035 (v1 half) — a "show up every day" bonus that rides on both chore and
 * habit completions. The streak is the number of consecutive family-local days,
 * ending today, on which the user completed *something* (a chore or a habit).
 *
 * Multiplier: ×1 below 3 days, ×1.1 at 3–6, ×1.2 at 7+. Applied to the base
 * points_value at completion time; the awarded amount is what lands in both the
 * completion row and the activity_points ledger.
 */
export function pointsMultiplier(streakLen: number): number {
  if (streakLen >= 7) return 1.2;
  if (streakLen >= 3) return 1.1;
  return 1;
}

export function applyMultiplier(base: number, streakLen: number): number {
  return Math.round(base * pointsMultiplier(streakLen));
}

/**
 * Consecutive family-local days up to and including today with ≥1 completion in
 * either `chore_completions` or `habit_completions`. Call it AFTER inserting the
 * completion being scored so today counts. `tz` is the family timezone.
 */
export async function getDailyStreak(userId: string, tz: string): Promise<number> {
  const res = await query<{ len: string }>(
    `WITH days AS (
       SELECT DISTINCT (completed_at AT TIME ZONE $2)::date AS d
       FROM chore_completions WHERE user_id = $1
       UNION
       SELECT DISTINCT (completed_at AT TIME ZONE $2)::date AS d
       FROM habit_completions WHERE user_id = $1
     ),
     ranked AS (
       SELECT d,
              (now() AT TIME ZONE $2)::date - d AS gap,
              row_number() OVER (ORDER BY d DESC) - 1 AS rn
       FROM days
       WHERE d <= (now() AT TIME ZONE $2)::date
     )
     SELECT count(*) AS len FROM ranked WHERE gap = rn`,
    [userId, tz],
  );
  return parseInt(res.rows[0]?.len ?? '0', 10);
}
