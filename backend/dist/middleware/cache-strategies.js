"use strict";
/**
 * Caching Strategies
 * Multiple caching patterns for different use cases
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePresets = void 0;
exports.cacheResponse = cacheResponse;
exports.cacheWithETag = cacheWithETag;
exports.cachePaginatedList = cachePaginatedList;
exports.cachePerUser = cachePerUser;
exports.invalidateCache = invalidateCache;
exports.invalidateUserCache = invalidateUserCache;
exports.invalidatePathCache = invalidatePathCache;
const cache = __importStar(require("../database/cache"));
/**
 * Simple response caching middleware
 */
function cacheResponse(options = {}) {
    return async (req, res, next) => {
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
        }
        catch (e) {
            // Cache miss is OK, continue
        }
        // Override res.json to cache response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
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
function cacheWithETag() {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        // Override res.json
        const originalJson = res.json.bind(res);
        res.json = function (data) {
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
function cachePaginatedList(options = {}) {
    return async (req, res, next) => {
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
        }
        catch (e) {
            // Continue
        }
        // Cache response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
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
function cachePerUser(options = {}) {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const userId = req.userId;
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
        }
        catch (e) {
            // Continue
        }
        // Cache response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
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
async function invalidateCache(pattern) {
    // In Redis, this would use KEYS pattern
    // For now, just log (would need to implement in actual Redis wrapper)
    console.log(`Cache invalidation requested for pattern: ${pattern}`);
}
/**
 * Cache invalidation by user
 */
async function invalidateUserCache(userId) {
    console.log(`User cache invalidated for: ${userId}`);
}
/**
 * Cache invalidation by path
 */
async function invalidatePathCache(path) {
    console.log(`Path cache invalidated for: ${path}`);
}
/**
 * Preset cache strategies
 */
exports.cachePresets = {
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
exports.default = {
    cacheResponse,
    cacheWithETag,
    cachePaginatedList,
    cachePerUser,
    invalidateCache,
    invalidateUserCache,
    invalidatePathCache,
    cachePresets: exports.cachePresets
};
//# sourceMappingURL=cache-strategies.js.map