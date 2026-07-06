/**
 * Redis Caching Layer
 * Provides caching for database queries to improve performance
 */

import { createClient, RedisClientType } from 'redis';

// ================================================
// REDIS CLIENT SETUP
// ================================================

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<void> {
  if (redisClient) return; // Already connected

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis connection failed, caching disabled:', error);
    redisClient = null;
  }
}

/**
 * Check if Redis is available
 */
function isEnabled(): boolean {
  return redisClient !== null && redisClient.isOpen;
}

// ================================================
// CACHE OPERATIONS
// ================================================

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  if (!isEnabled()) return null;

  try {
    const value = await redisClient!.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error(`Cache get error (${key}):`, error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  if (!isEnabled()) return;

  try {
    await redisClient!.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`Cache set error (${key}):`, error);
  }
}

/**
 * Delete key from cache
 */
export async function del(...keys: string[]): Promise<void> {
  if (!isEnabled() || keys.length === 0) return;

  try {
    await redisClient!.del(keys);
  } catch (error) {
    console.error(`Cache delete error:`, error);
  }
}

/**
 * Delete all keys matching pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  if (!isEnabled()) return;

  try {
    const keys = await redisClient!.keys(pattern);
    if (keys.length > 0) {
      await redisClient!.del(keys);
    }
  } catch (error) {
    console.error(`Cache pattern delete error (${pattern}):`, error);
  }
}

/**
 * Clear all cache
 */
export async function flush(): Promise<void> {
  if (!isEnabled()) return;

  try {
    await redisClient!.flushDb();
    console.log('✅ Cache flushed');
  } catch (error) {
    console.error('Cache flush error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getStats(): Promise<{
  connected: boolean;
  keys: number;
} | null> {
  if (!isEnabled()) return null;

  try {
    const info = await redisClient!.info('keyspace');
    const keys = await redisClient!.dbSize();
    return {
      connected: true,
      keys,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

// ================================================
// CACHE HELPER
// ================================================

/**
 * Get or set value in cache
 * If value not in cache, execute callback and cache result
 */
export async function getOrSet<T>(
  key: string,
  callback: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute callback
  const value = await callback();

  // Cache the result
  await set(key, value, ttlSeconds);

  return value;
}

// ================================================
// SHUTDOWN
// ================================================

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
}

export default {
  initRedis,
  get,
  set,
  del,
  delPattern,
  flush,
  getStats,
  getOrSet,
  closeRedis,
};
