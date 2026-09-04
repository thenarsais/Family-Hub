import { FACTS, factOfDay } from '@/data/facts';

describe('factOfDay', () => {
  it('returns a fact from the list', () => {
    expect(FACTS).toContain(factOfDay(new Date(2026, 8, 3, 12)));
  });

  it('is stable across a single local calendar day', () => {
    const a = factOfDay(new Date(2026, 8, 3, 0, 5));
    const b = factOfDay(new Date(2026, 8, 3, 23, 55));
    expect(a).toBe(b);
  });

  it('advances with the day of year and wraps around the list', () => {
    const day1 = factOfDay(new Date(2026, 0, 1, 12));
    const day2 = factOfDay(new Date(2026, 0, 2, 12));
    expect(day1).not.toBe(day2);

    const base = new Date(2026, 2, 1, 12);
    const later = new Date(2026, 2, 1, 12);
    later.setDate(later.getDate() + FACTS.length);
    expect(factOfDay(later)).toBe(factOfDay(base));
  });

  it('defaults to the current date', () => {
    expect(typeof factOfDay()).toBe('string');
  });
});
