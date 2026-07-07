"use strict";
/**
 * Redis Caching Layer
 * Provides caching for database queries to improve performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = initRedis;
exports.get = get;
exports.set = set;
exports.del = del;
exports.delPattern = delPattern;
exports.flush = flush;
exports.getStats = getStats;
exports.getOrSet = getOrSet;
exports.closeRedis = closeRedis;
const redis_1 = require("redis");
// ================================================
// REDIS CLIENT SETUP
// ================================================
let redisClient = null;
/**
 * Initialize Redis connection
 */
async function initRedis() {
    if (redisClient)
        return; // Already connected
    try {
        redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        redisClient.on('error', (err) => {
            console.error('Redis error:', err);
        });
        redisClient.on('connect', () => {
            console.log('✅ Connected to Redis');
        });
        await redisClient.connect();
    }
    catch (error) {
        console.warn('⚠️  Redis connection failed, caching disabled:', error);
        redisClient = null;
    }
}
/**
 * Check if Redis is available
 */
function isEnabled() {
    return redisClient !== null && redisClient.isOpen;
}
// ================================================
// CACHE OPERATIONS
// ================================================
/**
 * Get value from cache
 */
async function get(key) {
    if (!isEnabled())
        return null;
    try {
        const value = await redisClient.get(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }
    catch (error) {
        console.error(`Cache get error (${key}):`, error);
        return null;
    }
}
/**
 * Set value in cache with optional TTL
 */
async function set(key, value, ttlSeconds = 3600) {
    if (!isEnabled())
        return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    }
    catch (error) {
        console.error(`Cache set error (${key}):`, error);
    }
}
/**
 * Delete key from cache
 */
async function del(...keys) {
    if (!isEnabled() || keys.length === 0)
        return;
    try {
        await redisClient.del(keys);
    }
    catch (error) {
        console.error(`Cache delete error:`, error);
    }
}
/**
 * Delete all keys matching pattern
 */
async function delPattern(pattern) {
    if (!isEnabled())
        return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }
    catch (error) {
        console.error(`Cache pattern delete error (${pattern}):`, error);
    }
}
/**
 * Clear all cache
 */
async function flush() {
    if (!isEnabled())
        return;
    try {
        await redisClient.flushDb();
        console.log('✅ Cache flushed');
    }
    catch (error) {
        console.error('Cache flush error:', error);
    }
}
/**
 * Get cache statistics
 */
async function getStats() {
    if (!isEnabled())
        return null;
    try {
        const info = await redisClient.info('keyspace');
        const keys = await redisClient.dbSize();
        return {
            connected: true,
            keys,
        };
    }
    catch (error) {
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
async function getOrSet(key, callback, ttlSeconds = 3600) {
    // Try to get from cache
    const cached = await get(key);
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
async function closeRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
}
exports.default = {
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
//# sourceMappingURL=cache.js.map