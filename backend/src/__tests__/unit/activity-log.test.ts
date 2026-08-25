import { getActivityLogService } from '../../services/activity-log';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('ActivityLogService', () => {
  const service = getActivityLogService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserActivity', () => {
    it('should return activity rows for a user', async () => {
      const rows = [{ id: '1', user_id: 'user-1', activity_type: 'chore' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getUserActivity('user-1', 10);

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), ['user-1', 10]);
      expect(result).toEqual(rows);
    });

    it('should default limit to 50', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getUserActivity('user-1');

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), ['user-1', 50]);
    });

    it('should rethrow and log on query failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      await expect(service.getUserActivity('user-1')).rejects.toThrow('db down');
    });
  });

  describe('getFamilyActivity', () => {
    it('should return empty array when family has no active members', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getFamilyActivity('family-1');

      expect(result).toEqual([]);
      // Only the membership lookup should run, not a second query
      expect(connection.query).toHaveBeenCalledTimes(1);
    });

    it('should fetch activity for all active member ids', async () => {
      (connection.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ user_id: 'u1' }, { user_id: 'u2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'a1' }, { id: 'a2' }] });

      const result = await service.getFamilyActivity('family-1', 20);

      expect(connection.query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        [['u1', 'u2'], 20]
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('logActivity', () => {
    it('should insert an activity entry and return it', async () => {
      const entry = { id: 'a1', user_id: 'user-1', activity_type: 'chore', action: 'completed' };
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [entry] });

      const result = await service.logActivity('user-1', {
        activity_type: 'chore',
        action: 'completed',
        points_earned: 10,
      });

      expect(result).toEqual(entry);
    });

    it('should serialize metadata to JSON for storage', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'a1' }] });

      await service.logActivity('user-1', {
        activity_type: 'chore',
        action: 'completed',
        metadata: { choreId: 'c1' },
      });

      const params = (connection.query as jest.Mock).mock.calls[0][1];
      expect(params[7]).toBe(JSON.stringify({ choreId: 'c1' }));
    });

    it('should throw if insert returns no row', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(
        service.logActivity('user-1', { activity_type: 'chore', action: 'completed' })
      ).rejects.toThrow('Failed to log activity');
    });
  });

  describe('getActivityByType', () => {
    it('should filter by activity type', async () => {
      const rows = [{ id: '1', activity_type: 'trivia' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getActivityByType('user-1', 'trivia');

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), ['user-1', 'trivia', 50]);
      expect(result).toEqual(rows);
    });
  });

  describe('getActivityStats', () => {
    it('should tally activity counts by type', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { activity_type: 'chore' },
          { activity_type: 'chore' },
          { activity_type: 'trivia' },
        ],
      });

      const result = await service.getActivityStats('user-1', 7);

      expect(result).toEqual({ chore: 2, trivia: 1 });
    });

    it('should return an empty stats object when there is no activity', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getActivityStats('user-1');

      expect(result).toEqual({});
    });
  });

  describe('getTotalPointsFromActivity', () => {
    it('should parse the summed total', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: '150' }] });

      const result = await service.getTotalPointsFromActivity('user-1');

      expect(result).toBe(150);
    });

    it('should return 0 when there are no rows', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getTotalPointsFromActivity('user-1');

      expect(result).toBe(0);
    });
  });
});
