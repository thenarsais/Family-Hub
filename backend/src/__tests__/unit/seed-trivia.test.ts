import fs from 'fs';
import path from 'path';

jest.mock('../../database/connection', () => ({ pool: { query: jest.fn(), end: jest.fn() } }));

import { parseTriviaBank } from '../../scripts/seed-trivia';

const raw = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../seed-data/trivia-questions-phase1.json'), 'utf8'),
);

describe('parseTriviaBank', () => {
  const rows = parseTriviaBank(raw);

  it('produces one row per question (111)', () => {
    expect(rows).toHaveLength(111);
  });

  it('each row has 3 incorrect answers, and the correct one is not among them', () => {
    for (const r of rows) {
      expect(r.incorrectAnswers).toHaveLength(3);
      expect(r.incorrectAnswers).not.toContain(r.correctAnswer);
      expect(r.correctAnswer.length).toBeGreaterThan(0);
      expect(r.question.length).toBeGreaterThan(0);
    }
  });

  it('points scale with difficulty (10 / 20 / 30)', () => {
    const byDiff = { easy: 10, medium: 20, hard: 30 } as const;
    for (const r of rows) {
      expect(r.pointsValue).toBe(byDiff[r.difficulty]);
    }
  });

  it('legacyId and sortOrder are unique', () => {
    expect(new Set(rows.map((r) => r.legacyId)).size).toBe(rows.length);
    expect(new Set(rows.map((r) => r.sortOrder)).size).toBe(rows.length);
  });

  it('falls back cleanly for an unknown difficulty', () => {
    const [one] = parseTriviaBank([
      { legacyId: 'x', category: 'Test', difficulty: 'impossible', question: 'q?', options: ['a', 'b', 'c', 'd'], correct: 'a' },
    ]);
    expect(one.difficulty).toBe('easy');
    expect(one.incorrectAnswers).toEqual(['b', 'c', 'd']);
  });
});
