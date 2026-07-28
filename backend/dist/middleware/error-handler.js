"use strict";
/**
 * Error Handling Middleware
 * Standardizes error responses across the API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ApiError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
class ApiError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, details) {
        super(400, message, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApiError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends ApiError {
    constructor(message, details) {
        super(409, message, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class InternalServerError extends ApiError {
    constructor(message = 'Internal Server Error', details) {
        super(500, message, 'INTERNAL_SERVER_ERROR', details);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Error handler middleware
 */
function errorHandler() {
    return (err, req, res, next) => {
        console.error('Error:', {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack
        });
        // Handle ApiError
        if (err instanceof ApiError) {
            const response = {
                error: {
                    code: err.code || 'ERROR',
                    message: err.message,
                    statusCode: err.statusCode,
                    details: err.details,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    method: req.method
                }
            };
            return res.status(err.statusCode).json(response);
        }
        // Handle JSON parse errors
        if (err instanceof SyntaxError && 'body' in err) {
            const response = {
                error: {
                    code: 'INVALID_JSON',
                    message: 'Invalid JSON in request body',
                    statusCode: 400,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    method: req.method
                }
            };
            return res.status(400).json(response);
        }
        // Handle validation errors from express-validator or similar
        if (err.array && typeof err.array === 'function') {
            const errors = err.array();
            const response = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    statusCode: 400,
                    details: { errors },
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    method: req.method
                }
            };
            return res.status(400).json(response);
        }
        // Handle generic errors
        const statusCode = err.statusCode || 500;
        const response = {
            error: {
                code: err.code || 'INTERNAL_SERVER_ERROR',
                message: err.message || 'An unexpected error occurred',
                statusCode,
                details: process.env.ENVIRONMENT === 'development' ? { stack: err.stack } : undefined,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method
            }
        };
        res.status(statusCode).json(response);
    };
}
/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.default = {
    ApiError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    InternalServerError,
    errorHandler,
    asyncHandler
};
//# sourceMappingURL=error-handler.js.map