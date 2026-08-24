/**
 * Database Connection & Pool Management
 * Handles PostgreSQL connections with connection pooling for performance
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// This module is imported transitively (via UserRepository) by routes that
// server.ts pulls in at the top of the file, ahead of server.ts's own
// dotenv.config() call -- imports run depth-first before the rest of that
// file executes, so relying on server.ts to load the env first left this
// pool built with an undefined DATABASE_URL (falling back to localhost,
// which fails as an AggregateError). Load it here directly instead, same as
// connection.ts does.
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// ================================================
// CONNECTION POOL CONFIGURATION
// ================================================

const pool = new Pool({
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
export async function query(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms): ${sql.substring(0, 50)}...`);
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return first row
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Execute a query and return count
 */
export async function queryCount(
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const result = await queryOne<{ count: string }>(sql, params);
  return result ? parseInt(result.count, 10) : 0;
}

/**
 * Execute transaction with multiple queries
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in transaction
 */
export async function batch(
  queries: Array<{ sql: string; params: unknown[] }>
): Promise<QueryResult[]> {
  return transaction(async (client) => {
    const results: QueryResult[] = [];

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
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Get connection pool statistics
 */
export function getPoolStats() {
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
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✅ Database pool closed');
}

export default { query, queryOne, queryAll, queryCount, transaction, batch, healthCheck, getPoolStats, closePool };
