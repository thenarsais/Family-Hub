/**
 * Reminder recurrence math (migration 012 / FR-094).
 *
 * There is no cron/job runner yet, so recurring reminders roll forward lazily
 * when the reminders API is read. This module computes the next occurrence in
 * the family's timezone so the wall-clock time stays put across DST — e.g. a
 * "daily 8:00 AM" reminder is 8:00 local every day, not a fixed UTC instant.
 *
 * No date library is available, so timezone conversion is done with Intl.
 */

export type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly' | null;

const RECURRING = new Set(['daily', 'weekly', 'monthly']);

export function isRecurring(r: unknown): r is 'daily' | 'weekly' | 'monthly' {
  return typeof r === 'string' && RECURRING.has(r);
}

interface WallParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number;
  minute: number;
}

/** The wall-clock fields of `date` as observed in `tz`. */
export function partsInTz(date: Date, tz: string): WallParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    // Intl can emit "24" for midnight in some environments.
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
  };
}

/**
 * A Date (UTC instant) for the given wall-clock time in `tz`. Converges in two
 * passes; during a spring-forward gap (a nonexistent local time) it lands just
 * after the gap, which is the sensible behaviour for a reminder.
 */
export function zonedWallTimeToUtc(w: WallParts, tz: string): Date {
  const targetUtcMs = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  let guess = new Date(targetUtcMs);
  for (let i = 0; i < 3; i += 1) {
    const p = partsInTz(guess, tz);
    const seenUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const drift = targetUtcMs - seenUtcMs;
    if (drift === 0) break;
    guess = new Date(guess.getTime() + drift);
  }
  return guess;
}

function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

function ymd(w: WallParts): string {
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/**
 * Normalise a recurrence_end_date to a 'YYYY-MM-DD' string. Postgres DATE columns
 * come back from node-postgres as a local-midnight Date; a plain string is passed
 * through as-is (first 10 chars).
 */
function endDateToYmd(endDate: string | Date | null): string | null {
  if (endDate == null) return null;
  if (endDate instanceof Date) {
    return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  }
  return endDate.slice(0, 10);
}

/** Advance a wall date by one step of the recurrence (Jan 31 + month -> Feb 28/29). */
function step(w: WallParts, recurrence: 'daily' | 'weekly' | 'monthly'): WallParts {
  if (recurrence === 'daily' || recurrence === 'weekly') {
    const add = recurrence === 'daily' ? 1 : 7;
    const d = new Date(w.year, w.month - 1, w.day + add);
    return { ...w, year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  // monthly
  let month = w.month + 1;
  let year = w.year;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  const day = Math.min(w.day, daysInMonth(year, month));
  return { ...w, year, month, day };
}

/**
 * The first occurrence strictly after `after`, or null when there is no next
 * one — recurrence is 'once'/none, or the next date would fall after `endDate`
 * (a 'YYYY-MM-DD' string, inclusive).
 */
export function nextOccurrence(
  base: Date,
  recurrence: Recurrence,
  tz: string,
  after: Date,
  endDate: string | Date | null,
): Date | null {
  if (!isRecurring(recurrence)) return null;

  const end = endDateToYmd(endDate);
  let wall = partsInTz(base, tz);
  for (let i = 0; i < 4000; i += 1) {
    wall = step(wall, recurrence);
    if (end && ymd(wall) > end) return null;
    const occ = zonedWallTimeToUtc(wall, tz);
    if (occ.getTime() > after.getTime()) return occ;
  }
  return null; // safety cap — should never hit for real data
}
