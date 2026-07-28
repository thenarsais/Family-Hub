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
export declare function handleBatchOperations(req: Request, res: Response): Promise<BatchOperationResult[]>;
/**
 * Batch operations middleware
 */
export declare function batchOperations(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Batch operation builder (for clients)
 */
export declare class BatchBuilder {
    private operations;
    add(id: string, method: string, path: string, body?: any): this;
    get(id: string, path: string): this;
    post(id: string, path: string, body: any): this;
    put(id: string, path: string, body: any): this;
    patch(id: string, path: string, body: any): this;
    delete(id: string, path: string): this;
    build(): {
        operations: BatchOperation[];
    };
    clear(): this;
    count(): number;
}
declare const _default: {
    handleBatchOperations: typeof handleBatchOperations;
    batchOperations: typeof batchOperations;
    BatchBuilder: typeof BatchBuilder;
};
export default _default;
//# sourceMappingURL=batch-operations.d.ts.map