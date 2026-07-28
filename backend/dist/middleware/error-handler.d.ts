/**
 * Error Handling Middleware
 * Standardizes error responses across the API
 */
import { Request, Response, NextFunction } from 'express';
export declare class ApiError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    details?: any | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: any | undefined);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends ApiError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class InternalServerError extends ApiError {
    constructor(message?: string, details?: any);
}
/**
 * Error handler middleware
 */
export declare function errorHandler(): (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Async error wrapper for route handlers
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    ApiError: typeof ApiError;
    ValidationError: typeof ValidationError;
    NotFoundError: typeof NotFoundError;
    UnauthorizedError: typeof UnauthorizedError;
    ForbiddenError: typeof ForbiddenError;
    ConflictError: typeof ConflictError;
    InternalServerError: typeof InternalServerError;
    errorHandler: typeof errorHandler;
    asyncHandler: typeof asyncHandler;
};
export default _default;
//# sourceMappingURL=error-handler.d.ts.map