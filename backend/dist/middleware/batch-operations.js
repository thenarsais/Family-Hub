"use strict";
/**
 * Batch Operations Support
 * Handle multiple operations in a single request
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchBuilder = void 0;
exports.handleBatchOperations = handleBatchOperations;
exports.batchOperations = batchOperations;
/**
 * Batch operations endpoint handler
 */
async function handleBatchOperations(req, res) {
    const operations = req.body.operations;
    if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('No operations provided');
    }
    if (operations.length > 25) {
        throw new Error('Too many operations. Maximum 25 per batch');
    }
    const results = [];
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
        }
        catch (error) {
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
async function executeBatchOperation(operation) {
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
    }
    catch (error) {
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
function batchOperations() {
    return async (req, res, next) => {
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
            }
            catch (error) {
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
class BatchBuilder {
    constructor() {
        this.operations = [];
    }
    add(id, method, path, body) {
        this.operations.push({
            id,
            method: method,
            path,
            body
        });
        return this;
    }
    get(id, path) {
        return this.add(id, 'GET', path);
    }
    post(id, path, body) {
        return this.add(id, 'POST', path, body);
    }
    put(id, path, body) {
        return this.add(id, 'PUT', path, body);
    }
    patch(id, path, body) {
        return this.add(id, 'PATCH', path, body);
    }
    delete(id, path) {
        return this.add(id, 'DELETE', path);
    }
    build() {
        return {
            operations: this.operations
        };
    }
    clear() {
        this.operations = [];
        return this;
    }
    count() {
        return this.operations.length;
    }
}
exports.BatchBuilder = BatchBuilder;
exports.default = {
    handleBatchOperations,
    batchOperations,
    BatchBuilder
};
//# sourceMappingURL=batch-operations.js.map