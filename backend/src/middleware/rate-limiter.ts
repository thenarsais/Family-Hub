/**
 * Rate Limiting Middleware
 * Prevents API abuse and DoS attacks
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean expired entries from store
 */
function cleanStore() {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

/**
 * Default key generator (by IP address)
 */
function defaultKeyGenerator(req: Request): string {
  return (
    (req.ip ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      'unknown') as string
  );
}

/**
 * Create rate limiter middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if configured
    if (config.skip && config.skip(req)) {
      return next();
    }

    const key = config.keyGenerator ? config.keyGenerator(req) : defaultKeyGenerator(req);
    const now = Date.now();

    // Clean old entries periodically
    if (Math.random() < 0.1) {
      cleanStore();
    }

    // Initialize or check entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      return next();
    }

    // Increment counter
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > config.maxRequests) {
      const remainingTime = Math.ceil((store[key].resetTime - now) / 1000);

      res.set('Retry-After', remainingTime.toString());
      return res.status(429).json({
        error: 'Too many requests',
        message: config.message || `Rate limit exceeded. Try again in ${remainingTime}s`,
        retryAfter: remainingTime
      });
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', config.maxRequests.toString());
    res.set('X-RateLimit-Remaining', (config.maxRequests - store[key].count).toString());
    res.set('X-RateLimit-Reset', store[key].resetTime.toString());

    next();
  };
}

/**
 * Preset configurations
 */
export const rateLimitPresets = {
  // 100 requests per 15 minutes
  standard: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  },

  // 30 requests per 15 minutes (stricter)
  strict: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 30
  },

  // 1000 requests per 15 minutes (lenient)
  lenient: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000
  },

  // 5 requests per minute (auth endpoints)
  auth: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 5
  },

  // 10 requests per minute (public endpoints)
  public: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 10
  }
};

export default { rateLimit, rateLimitPresets };
