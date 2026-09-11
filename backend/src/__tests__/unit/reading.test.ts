import { ReadingService } from '../../services/reading';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockAddPoints = PointsRepository.addPoints as jest.Mock;
const mockRemovePoints = PointsRepository.removePoints as jest.Mock;

describe('ReadingService', () => {
  let service: ReadingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReadingService();
  });

  describe('getGoals', () => {
    it('falls back to defaults when no row exists', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const goals = await service.getGoals('kid-1');
      expect(goals).toEqual({ dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 });
    });

    it('returns the stored row', async () => {
      mockQueryOne.mockResolvedValueOnce({
        user_id: 'kid-1', daily_minutes: 30, weekly_minutes: 150, points_value: 15,
      });
      const goals = await service.getGoals('kid-1');
      expect(goals).toEqual({ dailyMinutes: 30, weeklyMinutes: 150, pointsValue: 15 });
    });
  });

  describe('setGoals', () => {
    it('upserts for self without a family check', async () => {
      mockQueryOne
        .mockResolvedValueOnce(null) // getGoals (current) inside setGoals
        .mockResolvedValueOnce({
          user_id: 'kid-1', daily_minutes: 30, weekly_minutes: 100, points_value: 10,
        }); // UPSERT RETURNING
      const goals = await service.setGoals('kid-1', 'kid-1', { daily_minutes: 30 });
      expect(goals.dailyMinutes).toBe(30);
    });

    it('throws bad-assignee for a non-family target', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce(null); // membership check fails
      await expect(
        service.setGoals('parent-1', 'stranger', { daily_minutes: 30 }),
      ).rejects.toThrow('bad-assignee');
    });
  });

  describe('getFamilyGoals', () => {
    it('returns [] when the viewer is in no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      const goals = await service.getFamilyGoals('nobody');
      expect(goals).toEqual([]);
    });

    it('merges member rows with stored goals, defaulting the rest', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId
      mockQuery
        .mockResolvedValueOnce({ rows: [{ user_id: 'kid-1', name: 'Krish' }, { user_id: 'kid-2', name: 'Karishma' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'kid-1', daily_minutes: 30, weekly_minutes: 150, points_value: 15 }] });
      const goals = await service.getFamilyGoals('parent-1');
      expect(goals).toEqual([
        { userId: 'kid-1', name: 'Krish', dailyMinutes: 30, weeklyMinutes: 150, pointsValue: 15 },
        { userId: 'kid-2', name: 'Karishma', dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
      ]);
    });
  });

  describe('getToday', () => {
    it('assembles goals + log + week total + streak', async () => {
      mockQueryOne
        .mockResolvedValueOnce(null) // getGoals -> defaults
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce({ minutes: 25, goal_met: true, points_earned: 10 }) // log
        .mockResolvedValueOnce({ total: '55' }) // week sum
        .mockResolvedValueOnce({ len: 3 }); // streak
      const today = await service.getToday('kid-1');
      expect(today).toEqual({
        goals: { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
        log: { minutes: 25, goalMet: true, pointsEarned: 10 },
        weekMinutes: 55,
        streak: 3,
      });
    });

    it('log is null when nothing was logged today', async () => {
      mockQueryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ total: '0' })
        .mockResolvedValueOnce({ len: 0 });
      const today = await service.getToday('kid-1');
      expect(today.log).toBeNull();
      expect(today.weekMinutes).toBe(0);
    });
  });

  describe('logToday', () => {
    function primeLogToday(insertedId = 'log-1') {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // getGoals -> defaults (20/100/10)
        .mockResolvedValueOnce(null) // existing? no
        .mockResolvedValueOnce({ id: insertedId }); // INSERT RETURNING id
    }

    it('awards points and marks goalMet when minutes meets the daily goal', async () => {
      primeLogToday();
      // getToday() call at the end
      mockQueryOne
        .mockResolvedValueOnce(null) // getGoals inside getToday
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz inside getToday
        .mockResolvedValueOnce({ minutes: 25, goal_met: true, points_earned: 10 })
        .mockResolvedValueOnce({ total: '25' })
        .mockResolvedValueOnce({ len: 1 });

      const result = await service.logToday('kid-1', 25);
      expect(result.log).toEqual({ minutes: 25, goalMet: true, pointsEarned: 10 });
      expect(mockAddPoints).toHaveBeenCalledWith('kid-1', 10, 'reading', 'Reading: log-1');
    });

    it('awards nothing when minutes falls short of the goal', async () => {
      primeLogToday('log-2');
      mockQueryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ minutes: 5, goal_met: false, points_earned: 0 })
        .mockResolvedValueOnce({ total: '5' })
        .mockResolvedValueOnce({ len: 0 });

      const result = await service.logToday('kid-1', 5);
      expect(result.log?.goalMet).toBe(false);
      expect(mockAddPoints).not.toHaveBeenCalled();
    });

    it('throws bad-minutes for a negative value', async () => {
      await expect(service.logToday('kid-1', -5)).rejects.toThrow('bad-minutes');
      expect(mockQueryOne).not.toHaveBeenCalled();
    });

    it('throws already-logged when today has a row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing' });
      await expect(service.logToday('kid-1', 25)).rejects.toThrow('already-logged');
      expect(mockAddPoints).not.toHaveBeenCalled();
    });
  });

  describe('undoToday', () => {
    it('reverses points earned and removes the row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ id: 'log-1', points_earned: 10 });
      const ok = await service.undoToday('kid-1');
      expect(ok).toBe(true);
      expect(mockRemovePoints).toHaveBeenCalledWith('kid-1', 'reading', 'Reading: log-1');
    });

    it('does not touch points when nothing was earned', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ id: 'log-1', points_earned: 0 });
      const ok = await service.undoToday('kid-1');
      expect(ok).toBe(true);
      expect(mockRemovePoints).not.toHaveBeenCalled();
    });

    it('returns false when there was nothing to undo', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null);
      const ok = await service.undoToday('kid-1');
      expect(ok).toBe(false);
      expect(mockRemovePoints).not.toHaveBeenCalled();
    });
  });
});
