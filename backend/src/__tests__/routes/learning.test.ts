import request from 'supertest';
import express from 'express';

// routes/learning.ts calls getLearningService() once at module load time and
// holds the result in a module-scoped constant. Reassigning getLearningService
// per-test (as this file used to do via `(learningService.getLearningService as
// jest.Mock).mockReturnValue(...)`) has no effect on that already-captured
// value. Instead, mock the module to always return the same shared object,
// and configure its methods per test.
const mockLearningService = {
  completeLesson: jest.fn(),
  getLearningStats: jest.fn(),
  recordQuizAnswer: jest.fn(),
  getPhaseProgress: jest.fn(),
  getQuizPerformance: jest.fn(),
  getRecentActivity: jest.fn(),
};

jest.mock('../../services/learning', () => ({ getLearningService: () => mockLearningService }));

import learningRoutes from '../../routes/learning';

const app = express();
app.use(express.json());
app.use('/api/learning', learningRoutes);

describe('Learning Routes', () => {
  const mockProgress = {
    id: 'progress-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    category: 'alphabet' as const,
    phase: 'phase_1_alphabet',
    completed: true,
    pointsEarned: 10,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so queued mockResolvedValueOnce/etc.
    // from a previous test can't leak into the next one.
    jest.resetAllMocks();
  });

  describe('POST /api/learning/lessons/:lessonId/complete', () => {
    it('should complete a lesson and award points', async () => {
      const mockStats = {
        totalLessonsCompleted: 5,
        totalPointsEarned: 50,
        alphabet: { completed: 5, total: 47 },
        numbers: { completed: 0, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      };

      mockLearningService.completeLesson.mockResolvedValueOnce(mockProgress);
      mockLearningService.getLearningStats.mockResolvedValueOnce(mockStats);

      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({
          category: 'alphabet',
          phase: 'phase_1_alphabet',
          pointsValue: 10,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.progress.completed).toBe(true);
      expect(res.body.stats.totalLessonsCompleted).toBe(5);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .send({
          category: 'alphabet',
          phase: 'phase_1_alphabet',
        })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should require category and phase', async () => {
      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('required');
    });

    it('should validate category enum', async () => {
      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({
          category: 'invalid',
          phase: 'phase_1_alphabet',
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('alphabet, numbers, or vocabulary');
    });

    it('should accept all valid categories', async () => {
      const mockStats = {
        totalLessonsCompleted: 1,
        totalPointsEarned: 10,
        alphabet: { completed: 0, total: 47 },
        numbers: { completed: 1, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      };

      mockLearningService.completeLesson.mockResolvedValue(mockProgress);
      mockLearningService.getLearningStats.mockResolvedValue(mockStats);

      const categories = ['alphabet', 'numbers', 'vocabulary'];

      for (const category of categories) {
        const res = await request(app)
          .post('/api/learning/lessons/lesson-1/complete')
          .set('x-user-id', 'user-1')
          .send({
            category,
            phase: 'phase_1_alphabet',
          });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
      }
    });

    it('should use default pointsValue if not provided', async () => {
      const mockStats = {
        totalLessonsCompleted: 1,
        totalPointsEarned: 10,
        alphabet: { completed: 1, total: 47 },
        numbers: { completed: 0, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      };

      mockLearningService.completeLesson.mockResolvedValueOnce(mockProgress);
      mockLearningService.getLearningStats.mockResolvedValueOnce(mockStats);

      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({
          category: 'alphabet',
          phase: 'phase_1_alphabet',
        })
        .expect(201);

      expect(res.body.status).toBe('success');
    });

    it('should handle service errors', async () => {
      mockLearningService.completeLesson.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({
          category: 'alphabet',
          phase: 'phase_1_alphabet',
        })
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to complete lesson');
    });
  });

  describe('POST /api/learning/quiz/answer', () => {
    it('should record correct answer and award points', async () => {
      mockLearningService.recordQuizAnswer.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 1,
          selectedAnswer: 2,
          correctAnswer: 2,
          pointsEarned: 5,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.result.isCorrect).toBe(true);
      expect(res.body.result.pointsEarned).toBe(5);
    });

    it('should record incorrect answer without awarding points', async () => {
      mockLearningService.recordQuizAnswer.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 1,
          selectedAnswer: 1,
          correctAnswer: 2,
          pointsEarned: 5,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.result.isCorrect).toBe(false);
      expect(res.body.result.pointsEarned).toBe(0);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 1,
          selectedAnswer: 2,
          correctAnswer: 2,
        })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should require all answer fields', async () => {
      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('required');
    });

    it('should use default pointsEarned if not provided', async () => {
      mockLearningService.recordQuizAnswer.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 1,
          selectedAnswer: 2,
          correctAnswer: 2,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.result.pointsEarned).toBe(5);
    });

    it('should handle service errors', async () => {
      mockLearningService.recordQuizAnswer.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 1,
          selectedAnswer: 2,
          correctAnswer: 2,
        })
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to record quiz answer');
    });
  });

  describe('GET /api/learning/progress/:phase', () => {
    it('should get progress for a phase', async () => {
      const mockPhaseProgress = {
        totalLessons: 47,
        completedLessons: 15,
        percentComplete: 31,
        pointsEarned: 150,
      };

      mockLearningService.getPhaseProgress.mockResolvedValueOnce(mockPhaseProgress);

      const res = await request(app)
        .get('/api/learning/progress/phase_1_alphabet')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.progress.totalLessons).toBe(47);
      expect(res.body.progress.completedLessons).toBe(15);
      expect(res.body.progress.percentComplete).toBe(31);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/learning/progress/phase_1_alphabet')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should require phase parameter', async () => {
      await request(app)
        .get('/api/learning/progress/')
        .set('x-user-id', 'user-1')
        .expect(404);
    });

    it('should handle service errors', async () => {
      mockLearningService.getPhaseProgress.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/learning/progress/phase_1_alphabet')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get phase progress');
    });
  });

  describe('GET /api/learning/stats', () => {
    it('should get overall learning statistics', async () => {
      const mockStats = {
        totalLessonsCompleted: 20,
        totalPointsEarned: 200,
        alphabet: { completed: 15, total: 47 },
        numbers: { completed: 5, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      };

      mockLearningService.getLearningStats.mockResolvedValueOnce(mockStats);

      const res = await request(app)
        .get('/api/learning/stats')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.stats.totalLessonsCompleted).toBe(20);
      expect(res.body.stats.alphabet.completed).toBe(15);
      expect(res.body.stats.numbers.completed).toBe(5);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/learning/stats')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should handle service errors', async () => {
      mockLearningService.getLearningStats.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/learning/stats')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get learning stats');
    });
  });

  describe('GET /api/learning/quiz/performance', () => {
    it('should get quiz performance metrics', async () => {
      const mockPerformance = {
        totalAnswered: 50,
        correctAnswers: 35,
        accuracy: 70,
        pointsEarned: 175,
      };

      mockLearningService.getQuizPerformance.mockResolvedValueOnce(mockPerformance);

      const res = await request(app)
        .get('/api/learning/quiz/performance')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.performance.totalAnswered).toBe(50);
      expect(res.body.performance.correctAnswers).toBe(35);
      expect(res.body.performance.accuracy).toBe(70);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/learning/quiz/performance')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should handle service errors', async () => {
      mockLearningService.getQuizPerformance.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/learning/quiz/performance')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get quiz performance');
    });
  });

  describe('GET /api/learning/activity/recent', () => {
    it('should get recent activity', async () => {
      const mockActivity = [
        { type: 'lesson', subject: 'lesson-1', created_at: new Date(), points_earned: 10 },
        { type: 'quiz', subject: 'lesson-1:1', created_at: new Date(), points_earned: 5 },
      ];

      mockLearningService.getRecentActivity.mockResolvedValueOnce(mockActivity);

      const res = await request(app)
        .get('/api/learning/activity/recent')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(2);
      expect(res.body.activity[0].type).toBe('lesson');
      expect(res.body.activity[1].type).toBe('quiz');
    });

    it('should limit results with default limit', async () => {
      const mockActivity = Array(20).fill({
        type: 'lesson',
        subject: 'lesson-1',
        created_at: new Date(),
        points_earned: 10,
      });

      mockLearningService.getRecentActivity.mockResolvedValueOnce(mockActivity);

      const res = await request(app)
        .get('/api/learning/activity/recent')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(20);
    });

    it('should enforce max limit of 100', async () => {
      const mockActivity = Array(50).fill({
        type: 'lesson',
        subject: 'lesson-1',
        created_at: new Date(),
        points_earned: 10,
      });

      mockLearningService.getRecentActivity.mockImplementationOnce((userId: string, limit: number) => {
        expect(limit).toBeLessThanOrEqual(100);
        return Promise.resolve(mockActivity);
      });

      const res = await request(app)
        .get('/api/learning/activity/recent?limit=200')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/learning/activity/recent')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should return empty activity when no records', async () => {
      mockLearningService.getRecentActivity.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/learning/activity/recent')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.activity).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockLearningService.getRecentActivity.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/learning/activity/recent')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get recent activity');
    });
  });
});
