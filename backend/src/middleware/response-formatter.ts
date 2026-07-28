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
export function responseFormatter() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Success response
    res.success = function<T>(data: T, message?: string, statusCode?: number) {
      const response: ApiResponse<T> = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
      };

      return this.status(statusCode || 200).json(response);
    };

    // Created response (201)
    res.created = function<T>(data: T, message?: string) {
      return this.success(data, message || 'Resource created successfully', 201);
    };

    // No content response (204)
    res.noContent = function() {
      return this.status(204).send();
    };

    // Paginated response
    res.paginated = function<T>(
      data: T[],
      message?: string,
      page?: number,
      limit?: number,
      total?: number
    ) {
      const response: ApiResponse<T[]> = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        meta: {
          count: data.length,
          ...(page !== undefined && { page }),
          ...(limit !== undefined && { limit }),
          ...(total !== undefined && { total })
        }
      };

      return this.status(200).json(response);
    };

    next();
  };
}

/**
 * Wrap controller response in standardized format
 */
export function formatResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): ApiResponse<T> {
  return {
    success: statusCode >= 200 && statusCode < 300,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Wrap paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  message?: string,
  page?: number,
  limit?: number,
  total?: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    meta: {
      count: data.length,
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
      ...(total !== undefined && { total })
    }
  };
}

export default {
  responseFormatter,
  formatResponse,
  formatPaginatedResponse
};
