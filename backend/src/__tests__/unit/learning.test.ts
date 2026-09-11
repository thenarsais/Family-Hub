import { LearningService } from '../../services/learning';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;

const LESSON_ROW = {
  id: 'lesson-a',
  category: 'alphabet',
  phase: 'phase_1_alphabet',
  subcategory: 'vowels',
  sequence_order: 0,
  content: { text: 'અ', romanization: 'a', pronunciation: "uh", english: 'vowel a' },
  points_value: 10,
};

describe('LearningService', () => {
  let service: LearningService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LearningService();
    (PointsRepository.addPoints as jest.Mock).mockResolvedValue({});
  });

  describe('getLessons', () => {
    it('returns the mapped curriculum, unfiltered', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [LESSON_ROW], rowCount: 1 });
      const lessons = await service.getLessons();
      expect(lessons[0]).toEqual({
        id: 'lesson-a',
        category: 'alphabet',
        phase: 'phase_1_alphabet',
        subcategory: 'vowels',
        sequenceOrder: 0,
        content: LESSON_ROW.content,
        pointsValue: 10,
      });
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).not.toContain('WHERE');
      expect(params).toEqual([]);
    });

    it('builds a filtered WHERE clause', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await service.getLessons({ category: 'vocabulary', subcategory: 'animals' });
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('WHERE category = $1 AND subcategory = $2');
      expect(params).toEqual(['vocabulary', 'animals']);
    });
  });

  describe('getLessonsWithProgress', () => {
    it('folds in per-lesson completion, user id first', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...LESSON_ROW, completed: true, points_earned: 10 }],
        rowCount: 1,
      });
      const rows = await service.getLessonsWithProgress('user-1', { phase: 'phase_1_alphabet' });
      expect(rows[0]).toMatchObject({ id: 'lesson-a', completed: true, pointsEarned: 10 });
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('LEFT JOIN learning_progress');
      expect(params).toEqual(['user-1', 'phase_1_alphabet']);
    });

    it('defaults completed/points when there is no progress row', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...LESSON_ROW, completed: false, points_earned: 0, traced: false }],
        rowCount: 1,
      });
      const rows = await service.getLessonsWithProgress('user-1');
      expect(rows[0].completed).toBe(false);
      expect(rows[0].pointsEarned).toBe(0);
      expect(rows[0].traced).toBe(false);
    });

    it('folds in traced state alongside completed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...LESSON_ROW, completed: false, points_earned: 0, traced: true }],
        rowCount: 1,
      });
      const rows = await service.getLessonsWithProgress('user-1');
      expect(rows[0].traced).toBe(true);
    });
  });

  describe('getLessonById', () => {
    it('returns null for an unknown id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      expect(await service.getLessonById('nope', 'user-1')).toBeNull();
    });
    it('returns the lesson with progress', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ...LESSON_ROW, completed: true, points_earned: 10 }],
        rowCount: 1,
      });
      const l = await service.getLessonById('lesson-a', 'user-1');
      expect(l).toMatchObject({ id: 'lesson-a', completed: true });
    });
  });

  describe('completeLesson', () => {
    it('derives category/phase/points from the lesson row and awards points', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ category: 'alphabet', phase: 'phase_1_alphabet', points_value: 10 })
        .mockResolvedValueOnce({
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-a',
          category: 'alphabet',
          phase: 'phase_1_alphabet',
          completed: true,
          points_earned: 10,
          completed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });

      const result = await service.completeLesson('user-1', 'lesson-a');

      expect(result.completed).toBe(true);
      expect(result.pointsEarned).toBe(10);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'user-1',
        10,
        'learning',
        expect.stringContaining('lesson-a'),
      );
      // the INSERT was parameterised with values from the lesson row
      expect(mockQueryOne.mock.calls[1][1]).toEqual([
        'user-1',
        'lesson-a',
        'alphabet',
        'phase_1_alphabet',
        10,
      ]);
    });

    it("throws 'not-found' for an unknown lesson id (no points)", async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.completeLesson('user-1', 'ghost')).rejects.toThrow('not-found');
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });
  });

  describe('completeTrace', () => {
    it('awards points on the first successful trace', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ category: 'alphabet', phase: 'phase_1_alphabet' }) // lesson lookup
        .mockResolvedValueOnce(null) // no existing progress row -> not already traced
        .mockResolvedValueOnce({
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-a',
          category: 'alphabet',
          phase: 'phase_1_alphabet',
          completed: false,
          points_earned: 0,
          completed_at: null,
          traced: true,
          trace_points_earned: 15,
          traced_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });

      const result = await service.completeTrace('user-1', 'lesson-a');

      expect(result.alreadyTraced).toBe(false);
      expect(result.traced).toBe(true);
      expect(result.tracePointsEarned).toBe(15);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'user-1',
        15,
        'learning',
        expect.stringContaining('lesson-a'),
      );
    });

    it('does not re-award points when the lesson was already traced', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ category: 'alphabet', phase: 'phase_1_alphabet' })
        .mockResolvedValueOnce({ traced: true }) // already traced
        .mockResolvedValueOnce({
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-a',
          category: 'alphabet',
          phase: 'phase_1_alphabet',
          completed: false,
          points_earned: 0,
          completed_at: null,
          traced: true,
          trace_points_earned: 15,
          traced_at: new Date('2026-01-01'),
          created_at: new Date(),
          updated_at: new Date(),
        });

      const result = await service.completeTrace('user-1', 'lesson-a');

      expect(result.alreadyTraced).toBe(true);
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });

    it("throws 'not-found' for an unknown lesson id (no points)", async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.completeTrace('user-1', 'ghost')).rejects.toThrow('not-found');
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });
  });

  describe('recordQuizAnswer', () => {
    it('records a correct answer and awards points', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      await service.recordQuizAnswer('user-1', 'lesson-a', 1, 2, 2, 10);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'user-1',
        10,
        'learning',
        expect.stringContaining('lesson-a:1'),
      );
    });

    it('records an incorrect answer without points', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      await service.recordQuizAnswer('user-1', 'lesson-a', 1, 1, 2, 10);
      expect(mockQuery).toHaveBeenCalled();
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });
  });

  describe('getPhaseProgress', () => {
    it('takes totals from learning_lessons via the LEFT JOIN', async () => {
      mockQueryOne.mockResolvedValueOnce({ total: '47', completed: '30', points_earned: '300' });
      const result = await service.getPhaseProgress('user-1', 'phase_1_alphabet');
      expect(result).toEqual({
        totalLessons: 47,
        completedLessons: 30,
        percentComplete: 64,
        pointsEarned: 300,
      });
      const [sql, params] = mockQueryOne.mock.calls[0];
      expect(sql).toContain('FROM learning_lessons l');
      expect(sql).toContain('LEFT JOIN learning_progress');
      expect(params).toEqual(['user-1', 'phase_1_alphabet']);
    });

    it('handles a phase with no lessons', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const result = await service.getPhaseProgress('user-1', 'phase_x');
      expect(result.totalLessons).toBe(0);
      expect(result.percentComplete).toBe(0);
    });
  });

  describe('getLearningStats', () => {
    it('reports full-curriculum totals per category with the user completions', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { category: 'alphabet', total: '47', completed: '12', points: '120' },
          { category: 'numbers', total: '10', completed: '10', points: '100' },
          { category: 'vocabulary', total: '120', completed: '3', points: '30' },
        ],
        rowCount: 3,
      });

      const stats = await service.getLearningStats('user-1');

      expect(stats.alphabet).toEqual({ completed: 12, total: 47 });
      expect(stats.numbers).toEqual({ completed: 10, total: 10 });
      expect(stats.vocabulary).toEqual({ completed: 3, total: 120 });
      expect(stats.totalLessonsCompleted).toBe(25);
      expect(stats.totalPointsEarned).toBe(250);
    });

    it('zero-fills a category with no rows', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const stats = await service.getLearningStats('user-1');
      expect(stats.alphabet).toEqual({ completed: 0, total: 0 });
      expect(stats.totalLessonsCompleted).toBe(0);
    });

    it('the points aggregate SQL folds in trace points alongside completed-lesson points', async () => {
      // the query itself sums both p.points_earned FILTER (completed) and
      // p.trace_points_earned FILTER (traced) into one `points` column --
      // this asserts the SQL shape, since the DB does the actual folding.
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await service.getLearningStats('user-1');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('trace_points_earned');
      expect(sql).toContain("FILTER (WHERE p.traced)");
    });
  });

  describe('getQuizPerformance', () => {
    it('calculates accuracy', async () => {
      mockQueryOne.mockResolvedValueOnce({ total: '50', correct: '40', points_earned: '200' });
      const result = await service.getQuizPerformance('user-1');
      expect(result).toEqual({
        totalAnswered: 50,
        correctAnswers: 40,
        accuracy: 80,
        pointsEarned: 200,
      });
    });

    it('handles no answers', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const result = await service.getQuizPerformance('user-1');
      expect(result.accuracy).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('returns rows in the given order', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { type: 'lesson', subject: 'lesson-a', created_at: new Date(), points_earned: 10 },
          { type: 'quiz', subject: 'lesson-b:1', created_at: new Date(), points_earned: 5 },
        ],
        rowCount: 2,
      });
      const result = await service.getRecentActivity('user-1', 20);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('lesson');
    });
  });
});
