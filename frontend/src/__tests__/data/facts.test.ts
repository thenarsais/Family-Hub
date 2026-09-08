import { FACTS, factOfDay } from '@/data/facts';
import { FACT_MORE } from '@/data/factDetails';

describe('FACTS data', () => {
  it('every fact has non-empty text; sourceLabel is a string when present', () => {
    for (const f of FACTS) {
      expect(typeof f.text).toBe('string');
      expect(f.text.length).toBeGreaterThan(0);
      if (f.sourceLabel !== undefined) expect(typeof f.sourceLabel).toBe('string');
    }
  });

  it('FACT_MORE is indexed 1:1 with FACTS and holds strings', () => {
    expect(FACT_MORE).toHaveLength(FACTS.length);
    for (const m of FACT_MORE) expect(typeof m).toBe('string');
  });
});

describe('factOfDay', () => {
  it('returns a fact with its list index', () => {
    const f = factOfDay(new Date(2026, 8, 3, 12));
    expect(typeof f.text).toBe('string');
    expect(f.index).toBeGreaterThanOrEqual(0);
    expect(FACTS[f.index].text).toBe(f.text);
  });

  it('is stable across a single local calendar day', () => {
    const a = factOfDay(new Date(2026, 8, 3, 0, 5));
    const b = factOfDay(new Date(2026, 8, 3, 23, 55));
    expect(a.index).toBe(b.index);
  });

  it('advances with the day of year and wraps around the list', () => {
    const day1 = factOfDay(new Date(2026, 0, 1, 12));
    const day2 = factOfDay(new Date(2026, 0, 2, 12));
    expect(day1.index).not.toBe(day2.index);

    const base = new Date(2026, 2, 1, 12);
    const later = new Date(2026, 2, 1, 12);
    later.setDate(later.getDate() + FACTS.length);
    expect(factOfDay(later).index).toBe(factOfDay(base).index);
  });

  it('defaults to the current date', () => {
    expect(typeof factOfDay().text).toBe('string');
  });
});
