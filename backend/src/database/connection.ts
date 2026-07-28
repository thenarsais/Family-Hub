import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_POOL_MIN = parseInt(process.env.DATABASE_POOL_MIN || '2');
const DATABASE_POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX || '10');

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  min: DATABASE_POOL_MIN,
  max: DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✓ New connection established to database');
});

pool.on('remove', () => {
  console.log('✓ Connection removed from pool');
});

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = any>(
  text: string,
  values?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const result = await pool.query(text, values);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text}`);
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', error, { query: text, values });
    throw error;
  }
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T = any>(
  text: string,
  values?: any[]
): Promise<T | null> {
  const result = await query<T>(text, values);
  return result.rows[0] || null;
}

/**
 * Get a client from the pool for manual transaction handling
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Initialize database connection (test only)
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

/**
 * Close all connections (test cleanup)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
