/**
 * Error Handling Middleware
 * Standardizes error responses across the API
 */

import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
  };
}

/**
 * Error handler middleware
 */
export function errorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    });

    // Handle ApiError
    if (err instanceof ApiError) {
      const response: ErrorResponse = {
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
      const response: ErrorResponse = {
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
      const response: ErrorResponse = {
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
    const response: ErrorResponse = {
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
        statusCode,
        details:
          process.env.ENVIRONMENT === 'development' ? { stack: err.stack } : undefined,
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
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
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
