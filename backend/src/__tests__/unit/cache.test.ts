const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  flushDb: jest.fn(),
  dbSize: jest.fn(),
  quit: jest.fn(),
  isOpen: true,
};

jest.mock('redis', () => ({ createClient: jest.fn(() => mockRedisClient) }));

describe('cache service', () => {
  let cache: typeof import('../../database/cache');

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRedisClient.isOpen = true;
    mockRedisClient.connect.mockResolvedValue(undefined);
    cache = require('../../database/cache');
    await cache.initRedis();
  });

  describe('initRedis', () => {
    it('should connect once and be a no-op on a second call', async () => {
      await cache.initRedis();

      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should disable caching when the connection fails', async () => {
      jest.resetModules();
      const { createClient } = require('redis');
      (createClient as jest.Mock).mockReturnValueOnce({ ...mockRedisClient, connect: jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')) });
      const freshCache = require('../../database/cache');

      await expect(freshCache.initRedis()).resolves.toBeUndefined();
      // Disabled cache: get() should short-circuit to null without throwing
      await expect(freshCache.get('k')).resolves.toBeNull();
    });
  });

  describe('get', () => {
    it('should return the parsed value on a hit', async () => {
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ a: 1 }));

      const result = await cache.get('k');

      expect(result).toEqual({ a: 1 });
    });

    it('should return null on a miss', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cache.get('k');

      expect(result).toBeNull();
    });

    it('should return null and log when redis throws', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('conn reset'));

      const result = await cache.get('k');

      expect(result).toBeNull();
    });

    it('should return null when the client is not open', async () => {
      mockRedisClient.isOpen = false;

      const result = await cache.get('k');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should setEx with the given TTL', async () => {
      await cache.set('k', { a: 1 }, 120);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('k', 120, JSON.stringify({ a: 1 }));
    });

    it('should default the TTL to 3600', async () => {
      await cache.set('k', { a: 1 });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('k', 3600, JSON.stringify({ a: 1 }));
    });

    it('should swallow redis errors', async () => {
      mockRedisClient.setEx.mockRejectedValueOnce(new Error('down'));

      await expect(cache.set('k', { a: 1 })).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete the given keys', async () => {
      await cache.del('k1', 'k2');

      expect(mockRedisClient.del).toHaveBeenCalledWith(['k1', 'k2']);
    });

    it('should no-op when no keys are given', async () => {
      await cache.del();

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should swallow redis errors', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('down'));

      await expect(cache.del('k1')).resolves.toBeUndefined();
    });
  });

  describe('delPattern', () => {
    it('should delete all matched keys', async () => {
      mockRedisClient.keys.mockResolvedValueOnce(['a:1', 'a:2']);

      await cache.delPattern('a:*');

      expect(mockRedisClient.del).toHaveBeenCalledWith(['a:1', 'a:2']);
    });

    it('should not call del when no keys match', async () => {
      mockRedisClient.keys.mockResolvedValueOnce([]);

      await cache.delPattern('a:*');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should swallow redis errors', async () => {
      mockRedisClient.keys.mockRejectedValueOnce(new Error('down'));

      await expect(cache.delPattern('a:*')).resolves.toBeUndefined();
    });
  });

  describe('flush', () => {
    it('should flush the db', async () => {
      await cache.flush();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('should swallow redis errors', async () => {
      mockRedisClient.flushDb.mockRejectedValueOnce(new Error('down'));

      await expect(cache.flush()).resolves.toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return connected + key count', async () => {
      mockRedisClient.dbSize.mockResolvedValueOnce(42);

      const result = await cache.getStats();

      expect(result).toEqual({ connected: true, keys: 42 });
    });

    it('should return null on error', async () => {
      mockRedisClient.dbSize.mockRejectedValueOnce(new Error('down'));

      const result = await cache.getStats();

      expect(result).toBeNull();
    });

    it('should return null when disabled', async () => {
      mockRedisClient.isOpen = false;

      const result = await cache.getStats();

      expect(result).toBeNull();
    });
  });

  describe('getOrSet', () => {
    it('should return the cached value without invoking the callback on a hit', async () => {
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify('cached'));
      const callback = jest.fn();

      const result = await cache.getOrSet('k', callback);

      expect(result).toBe('cached');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should invoke the callback and cache the result on a miss', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      const callback = jest.fn().mockResolvedValue('fresh');

      const result = await cache.getOrSet('k', callback, 60);

      expect(result).toBe('fresh');
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('k', 60, JSON.stringify('fresh'));
    });
  });

  describe('closeRedis', () => {
    it('should quit an open connection', async () => {
      await cache.closeRedis();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should no-op when already closed', async () => {
      mockRedisClient.isOpen = false;

      await cache.closeRedis();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });
});
