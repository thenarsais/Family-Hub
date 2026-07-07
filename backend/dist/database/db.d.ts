/**
 * Database Connection & Pool Management
 * Handles PostgreSQL connections with connection pooling for performance
 */
import { PoolClient, QueryResult } from 'pg';
/**
 * Execute a SQL query with parameters
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export declare function query(sql: string, params?: any[]): Promise<any>;
/**
 * Execute a query and return first row
 */
export declare function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
/**
 * Execute a query and return all rows
 */
export declare function queryAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
/**
 * Execute a query and return count
 */
export declare function queryCount(sql: string, params?: any[]): Promise<number>;
/**
 * Execute transaction with multiple queries
 */
export declare function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
/**
 * Execute multiple queries in transaction
 */
export declare function batch(queries: Array<{
    sql: string;
    params: any[];
}>): Promise<QueryResult[]>;
/**
 * Test database connectivity
 */
export declare function healthCheck(): Promise<boolean>;
/**
 * Get connection pool statistics
 */
export declare function getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
};
/**
 * Close all connections gracefully
 */
export declare function closePool(): Promise<void>;
declare const _default: {
    query: typeof query;
    queryOne: typeof queryOne;
    queryAll: typeof queryAll;
    queryCount: typeof queryCount;
    transaction: typeof transaction;
    batch: typeof batch;
    healthCheck: typeof healthCheck;
    getPoolStats: typeof getPoolStats;
    closePool: typeof closePool;
};
export default _default;
//# sourceMappingURL=db.d.ts.map