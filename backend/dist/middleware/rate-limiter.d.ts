/**
 * Rate Limiting Middleware
 * Prevents API abuse and DoS attacks
 */
import { Request, Response, NextFunction } from 'express';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
}
/**
 * Create rate limiter middleware
 */
export declare function rateLimit(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Preset configurations
 */
export declare const rateLimitPresets: {
    standard: {
        windowMs: number;
        maxRequests: number;
    };
    strict: {
        windowMs: number;
        maxRequests: number;
    };
    lenient: {
        windowMs: number;
        maxRequests: number;
    };
    auth: {
        windowMs: number;
        maxRequests: number;
    };
    public: {
        windowMs: number;
        maxRequests: number;
    };
};
declare const _default: {
    rateLimit: typeof rateLimit;
    rateLimitPresets: {
        standard: {
            windowMs: number;
            maxRequests: number;
        };
        strict: {
            windowMs: number;
            maxRequests: number;
        };
        lenient: {
            windowMs: number;
            maxRequests: number;
        };
        auth: {
            windowMs: number;
            maxRequests: number;
        };
        public: {
            windowMs: number;
            maxRequests: number;
        };
    };
};
export default _default;
//# sourceMappingURL=rate-limiter.d.ts.map