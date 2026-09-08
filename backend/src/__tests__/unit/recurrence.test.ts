import { nextOccurrence, partsInTz, zonedWallTimeToUtc, isRecurring } from '../../services/recurrence';

const NY = 'America/New_York';

/** Wall-clock 'YYYY-MM-DD HH:mm' of a Date as seen in tz. */
function wall(d: Date | null, tz = NY): string | null {
  if (!d) return null;
  const p = partsInTz(d, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')} ` +
    `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

describe('isRecurring', () => {
  it('is true only for daily/weekly/monthly', () => {
    expect(isRecurring('daily')).toBe(true);
    expect(isRecurring('weekly')).toBe(true);
    expect(isRecurring('monthly')).toBe(true);
    expect(isRecurring('once')).toBe(false);
    expect(isRecurring(null)).toBe(false);
    expect(isRecurring(undefined)).toBe(false);
  });
});

describe('zonedWallTimeToUtc', () => {
  it('round-trips a wall time through the timezone', () => {
    const d = zonedWallTimeToUtc({ year: 2026, month: 7, day: 15, hour: 8, minute: 0 }, NY);
    expect(wall(d)).toBe('2026-07-15 08:00');
    // July in New York is UTC-4
    expect(d.toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });
});

describe('nextOccurrence', () => {
  const base = new Date('2026-07-15T12:00:00Z'); // 08:00 NY

  it('returns null for non-recurring', () => {
    expect(nextOccurrence(base, 'once', NY, base, null)).toBeNull();
    expect(nextOccurrence(base, null, NY, base, null)).toBeNull();
  });

  it('daily: next day, same wall-clock time', () => {
    const n = nextOccurrence(base, 'daily', NY, base, null);
    expect(wall(n)).toBe('2026-07-16 08:00');
  });

  it('weekly: +7 days', () => {
    const n = nextOccurrence(base, 'weekly', NY, base, null);
    expect(wall(n)).toBe('2026-07-22 08:00');
  });

  it('monthly: same day next month', () => {
    const n = nextOccurrence(base, 'monthly', NY, base, null);
    expect(wall(n)).toBe('2026-08-15 08:00');
  });

  it('monthly clamps Jan 31 to the last day of February', () => {
    const jan31 = zonedWallTimeToUtc({ year: 2027, month: 1, day: 31, hour: 9, minute: 0 }, NY);
    const n = nextOccurrence(jan31, 'monthly', NY, jan31, null);
    expect(wall(n)).toBe('2027-02-28 09:00');
  });

  it('catches up across many missed daily periods to the next future one', () => {
    const old = new Date('2026-01-01T13:00:00Z'); // 08:00 NY, months ago
    const now = new Date('2026-03-10T18:00:00Z'); // 13:00-ish NY on Mar 10
    const n = nextOccurrence(old, 'daily', NY, now, null);
    // First 08:00 NY strictly after `now` is Mar 11.
    expect(wall(n)).toBe('2026-03-11 08:00');
  });

  it('keeps the wall-clock time stable across the spring-forward DST jump', () => {
    // DST 2026: clocks spring forward Sun Mar 8. 08:00 is well clear of the 2am gap.
    const mar7 = zonedWallTimeToUtc({ year: 2026, month: 3, day: 7, hour: 8, minute: 0 }, NY);
    const n = nextOccurrence(mar7, 'daily', NY, mar7, null);
    expect(wall(n)).toBe('2026-03-08 08:00');
    // UTC offset changed from -5 to -4, so the instant differs by 23h not 24h.
    expect(n!.getTime() - mar7.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it('keeps the wall-clock time stable across the fall-back DST jump', () => {
    // Clocks fall back Sun Nov 1, 2026.
    const oct31 = zonedWallTimeToUtc({ year: 2026, month: 10, day: 31, hour: 8, minute: 0 }, NY);
    const n = nextOccurrence(oct31, 'daily', NY, oct31, null);
    expect(wall(n)).toBe('2026-11-01 08:00');
    expect(n!.getTime() - oct31.getTime()).toBe(25 * 60 * 60 * 1000);
  });

  it('stops when the next date would fall after recurrence_end_date', () => {
    const n = nextOccurrence(base, 'daily', NY, base, '2026-07-15'); // ends the same day
    expect(n).toBeNull();
  });

  it('allows an occurrence exactly on recurrence_end_date', () => {
    const n = nextOccurrence(base, 'daily', NY, base, '2026-07-16');
    expect(wall(n)).toBe('2026-07-16 08:00');
  });

  it('accepts a Date recurrence_end_date (as node-postgres returns a DATE column)', () => {
    // node-postgres parses DATE to a local-midnight Date.
    const endAsDate = new Date(2026, 6, 15); // 2026-07-15 local
    expect(nextOccurrence(base, 'daily', NY, base, endAsDate)).toBeNull();
    const endNextDay = new Date(2026, 6, 16);
    expect(wall(nextOccurrence(base, 'daily', NY, base, endNextDay))).toBe('2026-07-16 08:00');
  });
});
