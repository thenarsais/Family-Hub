import { LearningService } from '../../services/learning';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

describe('LearningService', () => {
  let service: LearningService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LearningService();
    (PointsRepository.addPoints as jest.Mock).mockResolvedValue({});
  });

  describe('completeLesson', () => {
    it('should record lesson completion with points', async () => {
      const mockResult = {
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
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await service.completeLesson(
        'user-1',
        'lesson-a',
        'alphabet',
        'phase_1_alphabet',
        10
      );

      expect(result.completed).toBe(true);
      expect(result.pointsEarned).toBe(10);
      expect(PointsRepository.addPoints).toHaveBeenCalled();
    });

    it('should award points for lesson completion', async () => {
      const mockResult = {
        id: 'progress-1',
        user_id: 'user-1',
        lesson_id: 'lesson-a',
        category: 'alphabet',
        phase: 'phase_1_alphabet',
        completed: true,
        points_earned: 15,
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockResult);

      await service.completeLesson('user-1', 'lesson-a', 'alphabet', 'phase_1_alphabet', 15);

      expect(PointsRepository.addPoints).toHaveBeenCalledWith(
        'user-1',
        15,
        'learning',
        expect.stringContaining('lesson-a')
      );
    });
  });

  describe('recordQuizAnswer', () => {
    it('should record correct quiz answer with points', async () => {
      (connection.query as jest.Mock).mockResolvedValue({});

      await service.recordQuizAnswer('user-1', 'lesson-a', 1, 2, 2, 10);

      expect(connection.query).toHaveBeenCalledTimes(1); // Insert answer
      expect(PointsRepository.addPoints).toHaveBeenCalledWith('user-1', 10, 'learning', expect.stringContaining('lesson-a:1'));
    });

    it('should record incorrect answer without points', async () => {
      (connection.query as jest.Mock).mockResolvedValue({});

      await service.recordQuizAnswer('user-1', 'lesson-a', 1, 1, 2, 10);

      // Should still record answer but not award points
      expect(connection.query).toHaveBeenCalled();
      expect(PointsRepository.addPoints).not.toHaveBeenCalled();
    });
  });

  describe('getPhaseProgress', () => {
    it('should calculate phase progress percentage', async () => {
      const mockResult = {
        total: '47',
        completed: '30',
        points_earned: '300',
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await service.getPhaseProgress('user-1', 'phase_1_alphabet');

      expect(result.totalLessons).toBe(47);
      expect(result.completedLessons).toBe(30);
      expect(result.percentComplete).toBe(64); // 30/47 = 0.638 = 64%
      expect(result.pointsEarned).toBe(300);
    });

    it('should handle zero total lessons', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getPhaseProgress('user-1', 'phase_1_alphabet');

      expect(result.totalLessons).toBe(0);
      expect(result.percentComplete).toBe(0);
    });
  });

  describe('getLearningStats', () => {
    it('should return learning statistics for all phases', async () => {
      const mockResult = {
        total_completed: '100',
        total_points: '1000',
        alphabet_completed: '47',
        alphabet_total: '47',
        numbers_completed: '10',
        numbers_total: '10',
        vocab_completed: '43',
        vocab_total: '101',
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await service.getLearningStats('user-1');

      expect(result.totalLessonsCompleted).toBe(100);
      expect(result.totalPointsEarned).toBe(1000);
      expect(result.alphabet.completed).toBe(47);
      expect(result.alphabet.total).toBe(47);
      expect(result.numbers.completed).toBe(10);
      expect(result.numbers.total).toBe(10);
      expect(result.vocabulary.completed).toBe(43);
      expect(result.vocabulary.total).toBe(101);
    });
  });

  describe('getQuizPerformance', () => {
    it('should calculate quiz accuracy percentage', async () => {
      const mockResult = {
        total: '50',
        correct: '40',
        points_earned: '200',
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await service.getQuizPerformance('user-1');

      expect(result.totalAnswered).toBe(50);
      expect(result.correctAnswers).toBe(40);
      expect(result.accuracy).toBe(80); // 40/50 = 0.8 = 80%
      expect(result.pointsEarned).toBe(200);
    });

    it('should handle no quiz answers', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getQuizPerformance('user-1');

      expect(result.totalAnswered).toBe(0);
      expect(result.accuracy).toBe(0);
      expect(result.pointsEarned).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activities ordered by date', async () => {
      const mockActivities = [
        {
          type: 'lesson',
          subject: 'lesson-a',
          created_at: new Date(),
          points_earned: 10,
        },
        {
          type: 'quiz',
          subject: 'lesson-b:1',
          created_at: new Date(),
          points_earned: 5,
        },
      ];

      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: mockActivities });

      const result = await service.getRecentActivity('user-1', 20);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('lesson');
      expect(result[1].type).toBe('quiz');
    });
  });
});
