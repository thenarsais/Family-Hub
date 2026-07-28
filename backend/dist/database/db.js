"use strict";
/**
 * Database Connection & Pool Management
 * Handles PostgreSQL connections with connection pooling for performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.queryOne = queryOne;
exports.queryAll = queryAll;
exports.queryCount = queryCount;
exports.transaction = transaction;
exports.batch = batch;
exports.healthCheck = healthCheck;
exports.getPoolStats = getPoolStats;
exports.closePool = closePool;
const pg_1 = require("pg");
// ================================================
// CONNECTION POOL CONFIGURATION
// ================================================
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Wait max 2s to get a connection
});
// ================================================
// POOL EVENT HANDLERS
// ================================================
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
pool.on('connect', () => {
    console.log('✅ New database connection established');
});
pool.on('remove', () => {
    console.log('⚠️  Database connection removed from pool');
});
// ================================================
// QUERY EXECUTION
// ================================================
/**
 * Execute a SQL query with parameters
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
async function query(sql, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(sql, params);
        const duration = Date.now() - start;
        // Log slow queries (> 1000ms)
        if (duration > 1000) {
            console.warn(`⚠️  Slow query (${duration}ms): ${sql.substring(0, 50)}...`);
        }
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
/**
 * Execute a query and return first row
 */
async function queryOne(sql, params = []) {
    const result = await query(sql, params);
    return result.rows[0] || null;
}
/**
 * Execute a query and return all rows
 */
async function queryAll(sql, params = []) {
    const result = await query(sql, params);
    return result.rows;
}
/**
 * Execute a query and return count
 */
async function queryCount(sql, params = []) {
    const result = await queryOne(sql, params);
    return result ? parseInt(result.count, 10) : 0;
}
/**
 * Execute transaction with multiple queries
 */
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Execute multiple queries in transaction
 */
async function batch(queries) {
    return transaction(async (client) => {
        const results = [];
        for (const q of queries) {
            const result = await client.query(q.sql, q.params);
            results.push(result);
        }
        return results;
    });
}
// ================================================
// CONNECTION HEALTH
// ================================================
/**
 * Test database connectivity
 */
async function healthCheck() {
    try {
        const result = await query('SELECT 1');
        return result.rowCount === 1;
    }
    catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
/**
 * Get connection pool statistics
 */
function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
    };
}
// ================================================
// SHUTDOWN
// ================================================
/**
 * Close all connections gracefully
 */
async function closePool() {
    await pool.end();
    console.log('✅ Database pool closed');
}
exports.default = { query, queryOne, queryAll, queryCount, transaction, batch, healthCheck, getPoolStats, closePool };
//# sourceMappingURL=db.js.map