/**
 * Request Logging Middleware
 * Tracks API usage, performance, and errors
 */
import { Request, Response, NextFunction } from 'express';
export interface RequestLog {
    id: string;
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    userId?: string;
    userAgent?: string;
    ip: string;
    error?: string;
    requestSize?: number;
    responseSize?: number;
}
/**
 * Request logger middleware
 */
export declare function requestLogger(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get recent logs
 */
export declare function getRecentLogs(limit?: number): RequestLog[];
/**
 * Get logs by path
 */
export declare function getLogsByPath(path: string, limit?: number): RequestLog[];
/**
 * Get logs by status code
 */
export declare function getLogsByStatus(statusCode: number, limit?: number): RequestLog[];
/**
 * Get error logs
 */
export declare function getErrorLogs(limit?: number): RequestLog[];
/**
 * Get performance stats
 */
export declare function getPerformanceStats(): {
    totalRequests: number;
    avgResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestRequests: {
        path: string;
        method: string;
        responseTime: number;
        statusCode: number;
    }[];
    errorRate: number;
} | null;
/**
 * Clear logs
 */
export declare function clearLogs(): void;
declare const _default: {
    requestLogger: typeof requestLogger;
    getRecentLogs: typeof getRecentLogs;
    getLogsByPath: typeof getLogsByPath;
    getLogsByStatus: typeof getLogsByStatus;
    getErrorLogs: typeof getErrorLogs;
    getPerformanceStats: typeof getPerformanceStats;
    clearLogs: typeof clearLogs;
};
export default _default;
//# sourceMappingURL=request-logger.d.ts.map