/**
 * Redis Caching Layer
 * Provides caching for database queries to improve performance
 */
/**
 * Initialize Redis connection
 */
export declare function initRedis(): Promise<void>;
/**
 * Get value from cache
 */
export declare function get<T>(key: string): Promise<T | null>;
/**
 * Set value in cache with optional TTL
 */
export declare function set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
/**
 * Delete key from cache
 */
export declare function del(...keys: string[]): Promise<void>;
/**
 * Delete all keys matching pattern
 */
export declare function delPattern(pattern: string): Promise<void>;
/**
 * Clear all cache
 */
export declare function flush(): Promise<void>;
/**
 * Get cache statistics
 */
export declare function getStats(): Promise<{
    connected: boolean;
    keys: number;
} | null>;
/**
 * Get or set value in cache
 * If value not in cache, execute callback and cache result
 */
export declare function getOrSet<T>(key: string, callback: () => Promise<T>, ttlSeconds?: number): Promise<T>;
/**
 * Close Redis connection
 */
export declare function closeRedis(): Promise<void>;
declare const _default: {
    initRedis: typeof initRedis;
    get: typeof get;
    set: typeof set;
    del: typeof del;
    delPattern: typeof delPattern;
    flush: typeof flush;
    getStats: typeof getStats;
    getOrSet: typeof getOrSet;
    closeRedis: typeof closeRedis;
};
export default _default;
//# sourceMappingURL=cache.d.ts.map