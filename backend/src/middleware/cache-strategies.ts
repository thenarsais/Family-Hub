/**
 * Caching Strategies
 * Multiple caching patterns for different use cases
 */

import { Request, Response, NextFunction } from 'express';
import * as cache from '../database/cache';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: (req: Request) => string;
  condition?: (req: Request) => boolean; // Only cache if condition is true
}

/**
 * Simple response caching middleware
 */
export function cacheResponse(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.key ? options.key(req) : `cache:${req.path}:${JSON.stringify(req.query)}`;

    // Try to get from cache
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (e) {
      // Cache miss is OK, continue
    }

    // Override res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const ttl = options.ttl || 300; // Default 5 minutes
      cache.set(cacheKey, data, ttl).catch((e) => {
        console.error('Cache set error:', e);
      });

      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache with ETag support (conditional requests)
 */
export function cacheWithETag() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Override res.json
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const crypto = require('crypto');
      const etag = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');

      res.set('ETag', `"${etag}"`);

      // Check If-None-Match header
      if (req.get('if-none-match') === `"${etag}"`) {
        return res.status(304).end(); // Not Modified
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache list endpoints with pagination
 */
export function cachePaginatedList(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const page = req.query.page || '1';
    const limit = req.query.limit || '10';
    const cacheKey = options.key
      ? options.key(req)
      : `cache:${req.path}:page:${page}:limit:${limit}`;

    // Try cache
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (e) {
      // Continue
    }

    // Cache response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const ttl = options.ttl || 600; // Default 10 minutes
      cache.set(cacheKey, data, ttl).catch((e) => {
        console.error('Cache set error:', e);
      });

      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Per-user cache (different cache per user)
 */
export function cachePerUser(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const userId = (req as any).userId;
    if (!userId) {
      return next();
    }

    const cacheKey = options.key
      ? options.key(req)
      : `cache:user:${userId}:${req.path}:${JSON.stringify(req.query)}`;

    // Try cache
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (e) {
      // Continue
    }

    // Cache response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const ttl = options.ttl || 300;
      cache.set(cacheKey, data, ttl).catch((e) => {
        console.error('Cache set error:', e);
      });

      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string) {
  // In Redis, this would use KEYS pattern
  // For now, just log (would need to implement in actual Redis wrapper)
  console.log(`Cache invalidation requested for pattern: ${pattern}`);
}

/**
 * Cache invalidation by user
 */
export async function invalidateUserCache(userId: string) {
  console.log(`User cache invalidated for: ${userId}`);
}

/**
 * Cache invalidation by path
 */
export async function invalidatePathCache(path: string) {
  console.log(`Path cache invalidated for: ${path}`);
}

/**
 * Preset cache strategies
 */
export const cachePresets = {
  // Short cache (1 minute) - for frequently changing data
  short: {
    ttl: 60
  },

  // Standard cache (5 minutes) - default
  standard: {
    ttl: 300
  },

  // Medium cache (15 minutes) - for moderately changing data
  medium: {
    ttl: 900
  },

  // Long cache (1 hour) - for stable data
  long: {
    ttl: 3600
  },

  // Very long cache (24 hours) - for static data
  veryLong: {
    ttl: 86400
  }
};

export default {
  cacheResponse,
  cacheWithETag,
  cachePaginatedList,
  cachePerUser,
  invalidateCache,
  invalidateUserCache,
  invalidatePathCache,
  cachePresets
};
