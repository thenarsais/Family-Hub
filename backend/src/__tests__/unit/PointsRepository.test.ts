import * as PointsRepository from '../../database/repositories/PointsRepository';
import * as db from '../../database/db';
import * as cache from '../../database/cache';

jest.mock('../../database/db');
jest.mock('../../database/cache');

describe('PointsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.getOrSet as jest.Mock).mockImplementation((_key: string, callback: () => unknown) => callback());
    (cache.del as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addPoints', () => {
    it('should insert a points entry and clear related caches', async () => {
      const entry = { id: 'p1', user_id: 'u1', points: 10 };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(entry);

      const result = await PointsRepository.addPoints('u1', 10, 'chore', 'completed chore');

      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['u1', 'chore', 10, 'completed chore']);
      expect(cache.del).toHaveBeenCalledWith('user:u1:points:total', 'user:u1:points:history', 'user:u1:points:chore');
      expect(result).toEqual(entry);
    });

    it('should throw when the insert returns nothing', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(PointsRepository.addPoints('u1', 10, 'chore', 'x')).rejects.toThrow('Failed to add points');
    });
  });

  describe('getTotalPoints', () => {
    it('should query through the cache and parse the total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '150' });

      const result = await PointsRepository.getTotalPoints('u1');

      expect(cache.getOrSet).toHaveBeenCalledWith('user:u1:points:total', expect.any(Function), 1800);
      expect(result).toBe(150);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await PointsRepository.getTotalPoints('u1');

      expect(result).toBe(0);
    });
  });

  describe('getPointsHistory', () => {
    it('should default the limit to 100', async () => {
      const rows = [{ id: 'p1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(rows);

      const result = await PointsRepository.getPointsHistory('u1');

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['u1', 100]);
      expect(result).toEqual(rows);
    });

    it('should respect a custom limit', async () => {
      (db.queryAll as jest.Mock).mockResolvedValueOnce([]);

      await PointsRepository.getPointsHistory('u1', 10);

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['u1', 10]);
    });
  });

  describe('getPointsByActivityType', () => {
    it('should query through the cache and parse the total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '30' });

      const result = await PointsRepository.getPointsByActivityType('u1', 'chore');

      expect(cache.getOrSet).toHaveBeenCalledWith('user:u1:points:chore', expect.any(Function), 1800);
      expect(result).toBe(30);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await PointsRepository.getPointsByActivityType('u1', 'chore');

      expect(result).toBe(0);
    });
  });

  describe('getPointsBreakdown', () => {
    it('should parse totals and counts per activity type', async () => {
      (db.queryAll as jest.Mock).mockResolvedValueOnce([
        { activity_type: 'chore', total: '100', count: '5' },
        { activity_type: 'trivia', total: '20', count: '2' },
      ]);

      const result = await PointsRepository.getPointsBreakdown('u1');

      expect(result).toEqual([
        { activity_type: 'chore', total: 100, count: 5 },
        { activity_type: 'trivia', total: 20, count: 2 },
      ]);
    });
  });

  describe('getPointsInRange', () => {
    it('should scope by date range and parse the total', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '75' });

      const result = await PointsRepository.getPointsInRange('u1', start, end);

      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['u1', start, end]);
      expect(result).toBe(75);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await PointsRepository.getPointsInRange('u1', new Date(), new Date());

      expect(result).toBe(0);
    });
  });

  describe('getTopUsersByPoints', () => {
    it('should default the limit to 10 and parse totals', async () => {
      (db.queryAll as jest.Mock).mockResolvedValueOnce([{ user_id: 'u1', total_points: '500' }]);

      const result = await PointsRepository.getTopUsersByPoints();

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), [10]);
      expect(result).toEqual([{ user_id: 'u1', total_points: 500 }]);
    });

    it('should respect a custom limit', async () => {
      (db.queryAll as jest.Mock).mockResolvedValueOnce([]);

      await PointsRepository.getTopUsersByPoints(5);

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), [5]);
    });
  });

  describe('getPointsToday', () => {
    it('should parse the total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '25' });

      const result = await PointsRepository.getPointsToday('u1');

      expect(result).toBe(25);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await PointsRepository.getPointsToday('u1');

      expect(result).toBe(0);
    });
  });

  describe('getPointsThisWeek', () => {
    it('should parse the total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '90' });

      const result = await PointsRepository.getPointsThisWeek('u1');

      expect(result).toBe(90);
    });
  });

  describe('getPointsThisMonth', () => {
    it('should parse the total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '300' });

      const result = await PointsRepository.getPointsThisMonth('u1');

      expect(result).toBe(300);
    });
  });

  describe('subtractPoints', () => {
    it('should add a negative penalty entry', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'p1', points: -15 });

      await PointsRepository.subtractPoints('u1', 15, 'broke curfew');

      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['u1', 'penalty', -15, 'broke curfew']);
    });
  });

  describe('getTotalPointsAllUsers', () => {
    it('should parse the sitewide total', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ total: '10000' });

      const result = await PointsRepository.getTotalPointsAllUsers();

      expect(result).toBe(10000);
    });

    it('should return 0 when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await PointsRepository.getTotalPointsAllUsers();

      expect(result).toBe(0);
    });
  });
});
