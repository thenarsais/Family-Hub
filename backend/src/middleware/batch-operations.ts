/**
 * Batch Operations Support
 * Handle multiple operations in a single request
 */

import { Request, Response, NextFunction } from 'express';

export interface BatchOperation {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchOperationResult {
  id: string;
  statusCode: number;
  data?: any;
  error?: string;
}

/**
 * Batch operations endpoint handler
 */
export async function handleBatchOperations(
  req: Request,
  res: Response
): Promise<BatchOperationResult[]> {
  const operations: BatchOperation[] = req.body.operations;

  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('No operations provided');
  }

  if (operations.length > 25) {
    throw new Error('Too many operations. Maximum 25 per batch');
  }

  const results: BatchOperationResult[] = [];

  // Process each operation sequentially to maintain order
  for (const operation of operations) {
    try {
      if (!operation.id || !operation.method || !operation.path) {
        results.push({
          id: operation.id || 'unknown',
          statusCode: 400,
          error: 'Missing required fields: id, method, path'
        });
        continue;
      }

      // Validate method
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(operation.method)) {
        results.push({
          id: operation.id,
          statusCode: 405,
          error: 'Invalid HTTP method'
        });
        continue;
      }

      // Execute operation
      const result = await executeBatchOperation(operation);
      results.push(result);
    } catch (error: any) {
      results.push({
        id: operation.id,
        statusCode: 500,
        error: error.message || 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Execute individual batch operation
 */
async function executeBatchOperation(operation: BatchOperation): Promise<BatchOperationResult> {
  // In a real implementation, this would make internal HTTP calls
  // For now, return a mock response

  try {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      id: operation.id,
      statusCode: 200,
      data: {
        message: `Mock response for ${operation.method} ${operation.path}`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error: any) {
    return {
      id: operation.id,
      statusCode: 500,
      error: error.message
    };
  }
}

/**
 * Batch operations middleware
 */
export function batchOperations() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only process batch endpoint
    if (req.path === '/batch' && req.method === 'POST') {
      try {
        const results = await handleBatchOperations(req, res);
        return res.status(207).json({
          // 207 Multi-Status
          message: 'Batch operations completed',
          operations: results.length,
          results
        });
      } catch (error: any) {
        return res.status(400).json({
          error: error.message
        });
      }
    }

    next();
  };
}

/**
 * Batch operation builder (for clients)
 */
export class BatchBuilder {
  private operations: BatchOperation[] = [];

  add(id: string, method: string, path: string, body?: any): this {
    this.operations.push({
      id,
      method: method as any,
      path,
      body
    });
    return this;
  }

  get(id: string, path: string): this {
    return this.add(id, 'GET', path);
  }

  post(id: string, path: string, body: any): this {
    return this.add(id, 'POST', path, body);
  }

  put(id: string, path: string, body: any): this {
    return this.add(id, 'PUT', path, body);
  }

  patch(id: string, path: string, body: any): this {
    return this.add(id, 'PATCH', path, body);
  }

  delete(id: string, path: string): this {
    return this.add(id, 'DELETE', path);
  }

  build() {
    return {
      operations: this.operations
    };
  }

  clear(): this {
    this.operations = [];
    return this;
  }

  count(): number {
    return this.operations.length;
  }
}

export default {
  handleBatchOperations,
  batchOperations,
  BatchBuilder
};
