import * as BadgesRepository from '../../database/repositories/BadgesRepository';
import * as db from '../../database/db';
import * as cache from '../../database/cache';

jest.mock('../../database/db');
jest.mock('../../database/cache');

describe('BadgesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.getOrSet as jest.Mock).mockImplementation((_key: string, callback: () => unknown) => callback());
    (cache.del as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getBadgeById', () => {
    it('should query through the cache', async () => {
      const badge = { id: 'b1' };
      (db.queryOne as jest.Mock).mockResolvedValueOnce(badge);

      const result = await BadgesRepository.getBadgeById('b1');

      expect(cache.getOrSet).toHaveBeenCalledWith('badge:b1', expect.any(Function), 3600);
      expect(result).toEqual(badge);
    });
  });

  describe('getBadgesByCategory', () => {
    it('should query through the cache filtered by category', async () => {
      const badges = [{ id: 'b1', category: 'chores' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getBadgesByCategory('chores');

      expect(cache.getOrSet).toHaveBeenCalledWith('badges:category:chores', expect.any(Function), 3600);
      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['chores']);
      expect(result).toEqual(badges);
    });
  });

  describe('getBadgesByTier', () => {
    it('should query directly by tier (no cache)', async () => {
      const badges = [{ id: 'b1', tier: 'gold' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getBadgesByTier('gold');

      expect(cache.getOrSet).not.toHaveBeenCalled();
      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['gold']);
      expect(result).toEqual(badges);
    });
  });

  describe('getAllBadges', () => {
    it('should query through the cache', async () => {
      const badges = [{ id: 'b1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getAllBadges();

      expect(cache.getOrSet).toHaveBeenCalledWith('badges:all', expect.any(Function), 3600);
      expect(result).toEqual(badges);
    });
  });

  describe('getBadgeCount', () => {
    it('should return the count', async () => {
      (db.queryCount as jest.Mock).mockResolvedValueOnce(12);

      const result = await BadgesRepository.getBadgeCount();

      expect(result).toBe(12);
    });
  });

  describe('getUserBadges', () => {
    it('should query through the cache with a 30-minute TTL', async () => {
      const badges = [{ id: 'ub1' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getUserBadges('u1');

      expect(cache.getOrSet).toHaveBeenCalledWith('user:u1:badges', expect.any(Function), 1800);
      expect(result).toEqual(badges);
    });
  });

  describe('getUserBadgesWithDetails', () => {
    it('should query through the cache with a joined result', async () => {
      const badges = [{ id: 'ub1', title: 'Early Bird' }];
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getUserBadgesWithDetails('u1');

      expect(cache.getOrSet).toHaveBeenCalledWith('user:u1:badges:detailed', expect.any(Function), 1800);
      expect(result).toEqual(badges);
    });
  });

  describe('getUserBadgeCountByCategory', () => {
    it('should scope the count to user and category', async () => {
      (db.queryCount as jest.Mock).mockResolvedValueOnce(3);

      const result = await BadgesRepository.getUserBadgeCountByCategory('u1', 'chores');

      expect(db.queryCount).toHaveBeenCalledWith(expect.any(String), ['u1', 'chores']);
      expect(result).toBe(3);
    });
  });

  describe('userHasBadge', () => {
    it('should return true when the badge is earned', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ exists: true });

      const result = await BadgesRepository.userHasBadge('u1', 'b1');

      expect(result).toBe(true);
    });

    it('should return false when there is no result', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await BadgesRepository.userHasBadge('u1', 'b1');

      expect(result).toBe(false);
    });
  });

  describe('awardBadge', () => {
    it('should throw when the badge is already earned', async () => {
      (db.queryOne as jest.Mock).mockResolvedValueOnce({ exists: true });

      await expect(BadgesRepository.awardBadge('u1', 'b1')).rejects.toThrow('Badge already earned');
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should insert the badge and clear both caches', async () => {
      (db.queryOne as jest.Mock)
        .mockResolvedValueOnce({ exists: false }) // userHasBadge check
        .mockResolvedValueOnce({ id: 'ub1', user_id: 'u1', badge_id: 'b1' }); // insert result

      const result = await BadgesRepository.awardBadge('u1', 'b1');

      expect(result).toEqual({ id: 'ub1', user_id: 'u1', badge_id: 'b1' });
      expect(cache.del).toHaveBeenCalledWith('user:u1:badges', 'user:u1:badges:detailed');
    });

    it('should throw when the insert returns nothing', async () => {
      (db.queryOne as jest.Mock)
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce(null);

      await expect(BadgesRepository.awardBadge('u1', 'b1')).rejects.toThrow('Failed to award badge');
    });
  });

  describe('revokeBadge', () => {
    it('should delete and clear both caches', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({});

      await BadgesRepository.revokeBadge('u1', 'b1');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM user_badges'), ['u1', 'b1']);
      expect(cache.del).toHaveBeenCalledWith('user:u1:badges', 'user:u1:badges:detailed');
    });
  });

  describe('getBadgesEarnedInRange', () => {
    it('should scope by date range', async () => {
      const badges = [{ id: 'ub1' }];
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      (db.queryAll as jest.Mock).mockResolvedValueOnce(badges);

      const result = await BadgesRepository.getBadgesEarnedInRange('u1', start, end);

      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), ['u1', start, end]);
      expect(result).toEqual(badges);
    });
  });

  describe('getUsersWithBadge', () => {
    it('should return the distinct user ids', async () => {
      (db.queryAll as jest.Mock).mockResolvedValueOnce([{ user_id: 'u1' }, { user_id: 'u2' }]);

      const result = await BadgesRepository.getUsersWithBadge('b1');

      expect(result).toEqual(['u1', 'u2']);
    });
  });

  describe('clearUserBadges', () => {
    it('should delete all badges for the user and clear both caches', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({});

      await BadgesRepository.clearUserBadges('u1');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM user_badges'), ['u1']);
      expect(cache.del).toHaveBeenCalledWith('user:u1:badges', 'user:u1:badges:detailed');
    });
  });
});
