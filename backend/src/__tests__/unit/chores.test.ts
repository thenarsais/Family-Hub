import { ChoreService } from '../../services/chores';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

describe('ChoreService', () => {
  let service: ChoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChoreService();
  });

  describe('createChore', () => {
    it('should create a chore with valid data', async () => {
      const mockChore = {
        id: 'test-id',
        user_id: 'user-1',
        name: 'Take out trash',
        description: 'Move trash to curb',
        time_slot: 'morning',
        points_value: 10,
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockChore);

      const result = await service.createChore(
        'user-1',
        'Take out trash',
        'Move trash to curb',
        'morning',
        10
      );

      expect(result.name).toBe('Take out trash');
      expect(result.pointsValue).toBe(10);
      expect(result.timeSlot).toBe('morning');
    });

    it('should throw if chore creation fails', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createChore('user-1', 'Chore', undefined, 'morning', 10)
      ).rejects.toThrow('Failed to create chore');
    });
  });

  describe('getUserChores', () => {
    it('should return user chores ordered by time slot', async () => {
      const mockChores = [
        {
          id: '1',
          user_id: 'user-1',
          name: 'Morning task',
          description: null,
          time_slot: 'morning',
          points_value: 10,
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          user_id: 'user-1',
          name: 'Evening task',
          description: null,
          time_slot: 'evening',
          points_value: 15,
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: mockChores });

      const result = await service.getUserChores('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].timeSlot).toBe('morning');
      expect(result[1].timeSlot).toBe('evening');
    });

    it('should return empty array if user has no chores', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getUserChores('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('completeChore', () => {
    it('should record chore completion and award points', async () => {
      const mockChoreDetails = { points_value: 20 };
      const mockCompletion = {
        id: 'completion-1',
        chore_id: 'chore-1',
        user_id: 'user-1',
        completed_at: new Date(),
        points_earned: 20,
      };

      (connection.queryOne as jest.Mock)
        .mockResolvedValueOnce(mockChoreDetails)
        .mockResolvedValueOnce(mockCompletion);

      (PointsRepository.addPoints as jest.Mock).mockResolvedValue({});

      const result = await service.completeChore('user-1', 'chore-1');

      expect(result.pointsEarned).toBe(20);
      expect(PointsRepository.addPoints).toHaveBeenCalledWith('user-1', 20, 'chore', expect.stringContaining('chore-1'));
    });

    it('should throw if chore not found', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.completeChore('user-1', 'invalid-chore')).rejects.toThrow(
        'Chore not found'
      );
    });
  });

  describe('getChoreProgress', () => {
    it('should return progress statistics', async () => {
      const mockStats = {
        total_completed: '15',
        this_week: '3',
        this_month: '10',
        points_earned: '150',
      };

      (connection.queryOne as jest.Mock).mockResolvedValueOnce(mockStats);

      const result = await service.getChoreProgress('user-1');

      expect(result.totalCompleted).toBe(15);
      expect(result.thisWeek).toBe(3);
      expect(result.thisMonth).toBe(10);
      expect(result.pointsEarned).toBe(150);
    });

    it('should handle null results', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getChoreProgress('user-1');

      expect(result.totalCompleted).toBe(0);
      expect(result.thisWeek).toBe(0);
    });
  });

  describe('getPointsSummary', () => {
    it('should return points summary from the real points ledger (activity_points, via PointsRepository)', async () => {
      (PointsRepository.getTotalPoints as jest.Mock).mockResolvedValueOnce(500);
      (PointsRepository.getPointsToday as jest.Mock).mockResolvedValueOnce(50);
      (PointsRepository.getPointsThisWeek as jest.Mock).mockResolvedValueOnce(200);
      (PointsRepository.getPointsThisMonth as jest.Mock).mockResolvedValueOnce(400);

      const result = await service.getPointsSummary('user-1');

      expect(result.totalPoints).toBe(500);
      expect(result.dailyPoints).toBe(50);
      expect(result.weeklyPoints).toBe(200);
      expect(result.monthlyPoints).toBe(400);
    });

    it('should return zeros if user has no points recorded', async () => {
      (PointsRepository.getTotalPoints as jest.Mock).mockResolvedValueOnce(0);
      (PointsRepository.getPointsToday as jest.Mock).mockResolvedValueOnce(0);
      (PointsRepository.getPointsThisWeek as jest.Mock).mockResolvedValueOnce(0);
      (PointsRepository.getPointsThisMonth as jest.Mock).mockResolvedValueOnce(0);

      const result = await service.getPointsSummary('user-1');

      expect(result.totalPoints).toBe(0);
      expect(result.dailyPoints).toBe(0);
      expect(result.weeklyPoints).toBe(0);
      expect(result.monthlyPoints).toBe(0);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history from the real points ledger', async () => {
      const mockTransactions = [
        {
          user_id: 'user-1',
          activity_type: 'chore',
          points: 20,
          reason: 'Completed task',
          created_at: new Date(),
        },
        {
          user_id: 'user-1',
          activity_type: 'trivia',
          points: 10,
          reason: null,
          created_at: new Date(),
        },
      ];

      (PointsRepository.getPointsHistory as jest.Mock).mockResolvedValueOnce(mockTransactions);

      const result = await service.getTransactionHistory('user-1', 50);

      expect(PointsRepository.getPointsHistory).toHaveBeenCalledWith('user-1', 50);
      expect(result).toHaveLength(2);
      expect(result[0].activity_type).toBe('chore');
      expect(result[1].activity_type).toBe('trivia');
    });
  });
});
