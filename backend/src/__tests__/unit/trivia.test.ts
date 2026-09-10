import { TriviaService } from '../../services/trivia';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const QROW = {
  id: 'q-1',
  legacy_id: 'q-sci-001',
  question: 'What is the largest planet?',
  category: 'Space',
  difficulty: 'easy' as const,
  correct_answer: 'Jupiter',
  incorrect_answers: ['Saturn', 'Uranus', 'Neptune'],
  hint: 'Starts with J',
  fun_fact: '1,300 Earths fit inside.',
  points_value: 10,
  sort_order: 0,
};

/** getToday / submitToday queue: familyTz, count, dayIndex, pick, attempt, streak, stats */
function primeGetToday(opts: { attempt?: unknown; streak?: number; stats?: unknown; question?: unknown } = {}) {
  mockQueryOne
    .mockResolvedValueOnce({ timezone: 'America/New_York' }) // familyTz
    .mockResolvedValueOnce({ c: 111 }) // count
    .mockResolvedValueOnce({ d: 253 }) // dayIndex
    .mockResolvedValueOnce(opts.question === undefined ? QROW : opts.question) // pickDailyQuestion
    .mockResolvedValueOnce(opts.attempt ?? null) // today's attempt
    .mockResolvedValueOnce({ len: opts.streak ?? 0 }) // streak
    .mockResolvedValueOnce(opts.stats ?? { answered: 0, correct: 0 }); // stats
}

describe('TriviaService', () => {
  let service: TriviaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TriviaService();
    (PointsRepository.addPoints as jest.Mock).mockResolvedValue({});
  });

  describe('getToday', () => {
    it('returns the daily question with 4 stably-ordered options and no answer key', async () => {
      primeGetToday();
      const out = await service.getToday('u1');

      expect(out.question).toMatchObject({
        id: 'q-1',
        question: QROW.question,
        difficulty: 'easy',
        hint: 'Starts with J',
        pointsValue: 10,
      });
      expect(out.question!.options).toHaveLength(4);
      expect([...out.question!.options].sort()).toEqual(
        ['Jupiter', 'Neptune', 'Saturn', 'Uranus'],
      );
      // no answer key before answering
      expect(out.attempt).toBeNull();
      expect(JSON.stringify(out.question)).not.toContain('correctAnswer');
    });

    it('option order is deterministic for a given question id', async () => {
      primeGetToday();
      const a = await service.getToday('u1');
      primeGetToday();
      const b = await service.getToday('u1');
      expect(a.question!.options).toEqual(b.question!.options);
    });

    it('picks by (dayIndex mod count) against the sorted bank', async () => {
      primeGetToday();
      await service.getToday('u1');
      const offsetCall = mockQueryOne.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('OFFSET $1 LIMIT 1'),
      );
      expect(offsetCall[1]).toEqual([253 % 111]);
    });

    it('reveals correctAnswer + funFact once an attempt exists', async () => {
      primeGetToday({
        attempt: { selected_answer: 'Saturn', is_correct: false, points_earned: 0 },
        streak: 3,
        stats: { answered: 5, correct: 3 },
      });
      const out = await service.getToday('u1');
      expect(out.attempt).toEqual({
        selectedAnswer: 'Saturn',
        isCorrect: false,
        pointsEarned: 0,
        correctAnswer: 'Jupiter',
        funFact: '1,300 Earths fit inside.',
      });
      expect(out.streak).toBe(3);
      expect(out.stats).toEqual({ answered: 5, correct: 3 });
    });

    it('returns nulls when the question bank is empty', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'UTC' }) // familyTz
        .mockResolvedValueOnce({ c: 0 }); // count → 0
      const out = await service.getToday('u1');
      expect(out).toEqual({
        question: null,
        attempt: null,
        streak: 0,
        stats: { answered: 0, correct: 0 },
      });
    });
  });

  describe('submitToday', () => {
    /** queue for submit: familyTz, count, dayIndex, pick, existing-attempt-check, [insert], [points], then a full getToday */
    function primeSubmit(existing: unknown) {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'UTC' }) // familyTz
        .mockResolvedValueOnce({ c: 111 }) // count
        .mockResolvedValueOnce({ d: 253 }) // dayIndex
        .mockResolvedValueOnce(QROW) // pick
        .mockResolvedValueOnce(existing); // existing attempt row (null = new)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT
      // the trailing getToday()
      primeGetToday({ attempt: { selected_answer: 'Jupiter', is_correct: true, points_earned: 10 } });
    }

    it("rejects an answer that isn't one of the options", async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'UTC' })
        .mockResolvedValueOnce({ c: 111 })
        .mockResolvedValueOnce({ d: 253 })
        .mockResolvedValueOnce(QROW);
      await expect(service.submitToday('u1', 'Pluto')).rejects.toThrow('bad-answer');
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it('records a correct answer and awards flat points by difficulty', async () => {
      primeSubmit(null);
      await service.submitToday('u1', 'Jupiter');

      const insert = mockQuery.mock.calls[0];
      expect(insert[0]).toContain('INSERT INTO trivia_attempts');
      expect(insert[1]).toEqual(['u1', 'q-1', 'UTC', 'Jupiter', true, 10]);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'u1',
        10,
        'trivia',
        expect.stringContaining('q-sci-001'),
      );
    });

    it('records a wrong answer with 0 points and no ledger entry', async () => {
      primeSubmit(null);
      await service.submitToday('u1', 'Saturn');
      expect(mockQuery.mock.calls[0][1]).toEqual(['u1', 'q-1', 'UTC', 'Saturn', false, 0]);
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it('is a no-op on a second submit the same day', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'UTC' })
        .mockResolvedValueOnce({ c: 111 })
        .mockResolvedValueOnce({ d: 253 })
        .mockResolvedValueOnce(QROW)
        .mockResolvedValueOnce({ id: 'existing-attempt' }); // already answered
      primeGetToday({ attempt: { selected_answer: 'Jupiter', is_correct: true, points_earned: 10 } });

      await service.submitToday('u1', 'Neptune');
      expect(mockQuery).not.toHaveBeenCalled();
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it('throws when there is no question to answer', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'UTC' })
        .mockResolvedValueOnce({ c: 0 });
      await expect(service.submitToday('u1', 'x')).rejects.toThrow('no-question');
    });
  });

  describe('streak', () => {
    it('uses a consecutive-days CTE over trivia_attempts', async () => {
      primeGetToday({ streak: 4 });
      const out = await service.getToday('u1');
      const streakCall = mockQueryOne.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('FROM trivia_attempts') && c[0].includes('row_number()'),
      );
      expect(streakCall).toBeTruthy();
      expect(out.streak).toBe(4);
    });
  });
});
