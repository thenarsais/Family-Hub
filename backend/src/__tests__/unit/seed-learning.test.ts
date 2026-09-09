import fs from 'fs';
import path from 'path';

// seed-learning.ts imports the pg pool at module load; the flatten helper is
// pure, so stub the connection out.
jest.mock('../../database/connection', () => ({ pool: { query: jest.fn(), end: jest.fn() } }));

import { flattenCurriculum } from '../../scripts/seed-learning';

const raw = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../seed-data/gujarati-curriculum.json'), 'utf8'),
);

describe('flattenCurriculum', () => {
  const rows = flattenCurriculum(raw);

  it('produces 177 lessons (47 alphabet + 10 numbers + 120 vocabulary)', () => {
    const byCat = (c: string) => rows.filter((r) => r.category === c).length;
    expect(byCat('alphabet')).toBe(47);
    expect(byCat('numbers')).toBe(10);
    expect(byCat('vocabulary')).toBe(120);
    expect(rows).toHaveLength(177);
  });

  it('gives every row a normalised content shape and a slot', () => {
    for (const r of rows) {
      expect(r.content.text.length).toBeGreaterThan(0);
      expect(typeof r.content.romanization).toBe('string');
      expect(typeof r.content.english).toBe('string');
      expect(r.subcategory.length).toBeGreaterThan(0);
      expect(Number.isInteger(r.sequenceOrder)).toBe(true);
      expect(r.pointsValue).toBe(10);
    }
  });

  it('every (phase, subcategory, sequence_order) slot is unique', () => {
    const seen = new Set(rows.map((r) => `${r.phase}|${r.subcategory}|${r.sequenceOrder}`));
    expect(seen.size).toBe(rows.length);
  });

  it('numbers carry the Gujarati spelled-out word', () => {
    const nums = rows.filter((r) => r.category === 'numbers');
    expect(nums.every((r) => typeof r.content.word === 'string')).toBe(true);
  });
});
