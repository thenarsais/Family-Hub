/**
 * Response Formatting Middleware
 * Standardizes API responses
 */
import { Request, Response, NextFunction } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: string;
    meta?: {
        count?: number;
        page?: number;
        limit?: number;
        total?: number;
    };
}
/**
 * Extend Express Response with helper methods
 */
declare global {
    namespace Express {
        interface Response {
            success<T>(data: T, message?: string, statusCode?: number): Response;
            created<T>(data: T, message?: string): Response;
            noContent(): Response;
            paginated<T>(data: T[], message?: string, page?: number, limit?: number, total?: number): Response;
        }
    }
}
/**
 * Response formatter middleware
 */
export declare function responseFormatter(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Wrap controller response in standardized format
 */
export declare function formatResponse<T>(data: T, message?: string, statusCode?: number): ApiResponse<T>;
/**
 * Wrap paginated response
 */
export declare function formatPaginatedResponse<T>(data: T[], message?: string, page?: number, limit?: number, total?: number): ApiResponse<T[]>;
declare const _default: {
    responseFormatter: typeof responseFormatter;
    formatResponse: typeof formatResponse;
    formatPaginatedResponse: typeof formatPaginatedResponse;
};
export default _default;
//# sourceMappingURL=response-formatter.d.ts.map