/**
 * Caching Strategies
 * Multiple caching patterns for different use cases
 */
import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    ttl?: number;
    key?: (req: Request) => string;
    condition?: (req: Request) => boolean;
}
/**
 * Simple response caching middleware
 */
export declare function cacheResponse(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Cache with ETag support (conditional requests)
 */
export declare function cacheWithETag(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cache list endpoints with pagination
 */
export declare function cachePaginatedList(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Per-user cache (different cache per user)
 */
export declare function cachePerUser(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Cache invalidation helper
 */
export declare function invalidateCache(pattern: string): Promise<void>;
/**
 * Cache invalidation by user
 */
export declare function invalidateUserCache(userId: string): Promise<void>;
/**
 * Cache invalidation by path
 */
export declare function invalidatePathCache(path: string): Promise<void>;
/**
 * Preset cache strategies
 */
export declare const cachePresets: {
    short: {
        ttl: number;
    };
    standard: {
        ttl: number;
    };
    medium: {
        ttl: number;
    };
    long: {
        ttl: number;
    };
    veryLong: {
        ttl: number;
    };
};
declare const _default: {
    cacheResponse: typeof cacheResponse;
    cacheWithETag: typeof cacheWithETag;
    cachePaginatedList: typeof cachePaginatedList;
    cachePerUser: typeof cachePerUser;
    invalidateCache: typeof invalidateCache;
    invalidateUserCache: typeof invalidateUserCache;
    invalidatePathCache: typeof invalidatePathCache;
    cachePresets: {
        short: {
            ttl: number;
        };
        standard: {
            ttl: number;
        };
        medium: {
            ttl: number;
        };
        long: {
            ttl: number;
        };
        veryLong: {
            ttl: number;
        };
    };
};
export default _default;
//# sourceMappingURL=cache-strategies.d.ts.map