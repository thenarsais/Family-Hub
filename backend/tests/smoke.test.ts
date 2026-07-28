/**
 * Smoke Test Suite for Family Hub
 *
 * Tests critical functionality to ensure the application is operational:
 * - API health
 * - Database connectivity
 * - Redis connectivity
 * - Elasticsearch connectivity
 * - Database schema
 * - Seed data
 *
 * Run: npm run test:smoke
 * CI/CD: Runs on every deployment
 */

import http from 'http';
import { Client as PgClient } from 'pg';

// ================================================
// TEST CONFIGURATION
// ================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_hub';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || 'localhost:9200';

const TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// ================================================
// UTILITY FUNCTIONS
// ================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await sleep(delay);
    }
  }
  throw new Error('Retry failed');
}

// ================================================
// TEST SUITE
// ================================================

class SmokeTestSuite {
  private results: Map<string, { passed: boolean; message: string; duration: number }> = new Map();
  private startTime = Date.now();

  /**
   * TEST 1: API Health Check
   * Verifies the API is responding to requests
   */
  async testApiHealth(): Promise<void> {
    const testName = 'API Health Check';
    const start = Date.now();

    try {
      const response = await retry(async () => {
        return new Promise<any>((resolve, reject) => {
          const req = http.get(`${API_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const json = JSON.parse(data);
                  resolve(json);
                } catch (e) {
                  reject(new Error('Invalid JSON response'));
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}`));
              }
            });
          });

          req.on('error', reject);
          req.setTimeout(5000, () => req.abort());
        });
      });

      if (response.status === 'ok') {
        this.recordPass(testName, 'API is healthy and responding', Date.now() - start);
      } else {
        this.recordFail(testName, 'Unexpected health status', Date.now() - start);
      }
    } catch (error: any) {
      this.recordFail(testName, `Health check failed: ${error.message}`, Date.now() - start);
      throw error;
    }
  }

  /**
   * TEST 2: Database Connectivity
   * Verifies connection to PostgreSQL database
   */
  async testDatabaseConnectivity(): Promise<void> {
    const testName = 'Database Connectivity';
    const start = Date.now();

    const client = new PgClient({ connectionString: DATABASE_URL });

    try {
      await retry(async () => {
        await client.connect();
      });

      const result = await client.query('SELECT NOW()');
      if (result.rows.length > 0) {
        this.recordPass(testName, 'Connected to PostgreSQL', Date.now() - start);
      } else {
        this.recordFail(testName, 'Query returned no results', Date.now() - start);
      }
    } catch (error: any) {
      this.recordFail(testName, `Database connection failed: ${error.message}`, Date.now() - start);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * TEST 3: Database Schema
   * Verifies all required tables exist
   */
  async testDatabaseSchema(): Promise<void> {
    const testName = 'Database Schema';
    const start = Date.now();

    const client = new PgClient({ connectionString: DATABASE_URL });

    try {
      await client.connect();

      const result = await client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema='public'
        AND table_type='BASE TABLE'
      `);

      const tableCount = parseInt(result.rows[0].table_count);
      const expectedTables = 39; // From Phase 1A schema

      if (tableCount >= expectedTables) {
        this.recordPass(
          testName,
          `All ${tableCount} tables present (expected ${expectedTables}+)`,
          Date.now() - start
        );
      } else {
        this.recordFail(
          testName,
          `Only ${tableCount} tables found (expected ${expectedTables}+)`,
          Date.now() - start
        );
      }
    } catch (error: any) {
      this.recordFail(testName, `Schema check failed: ${error.message}`, Date.now() - start);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * TEST 4: Seed Data
   * Verifies seed data was loaded
   */
  async testSeedData(): Promise<void> {
    const testName = 'Seed Data';
    const start = Date.now();

    const client = new PgClient({ connectionString: DATABASE_URL });

    try {
      await client.connect();

      // Check feature flags
      const flagsResult = await client.query('SELECT COUNT(*) as count FROM feature_flags');
      const flagCount = parseInt(flagsResult.rows[0].count);

      // Check badges
      const badgesResult = await client.query('SELECT COUNT(*) as count FROM badges');
      const badgeCount = parseInt(badgesResult.rows[0].count);

      // Check trivia
      const triviaResult = await client.query('SELECT COUNT(*) as count FROM trivia_questions');
      const triviaCount = parseInt(triviaResult.rows[0].count);

      if (flagCount >= 22 && badgeCount >= 20 && triviaCount >= 10) {
        this.recordPass(
          testName,
          `Seed data loaded: ${flagCount} flags, ${badgeCount} badges, ${triviaCount} trivia`,
          Date.now() - start
        );
      } else {
        this.recordFail(
          testName,
          `Incomplete seed data: ${flagCount} flags, ${badgeCount} badges, ${triviaCount} trivia`,
          Date.now() - start
        );
      }
    } catch (error: any) {
      this.recordFail(testName, `Seed data check failed: ${error.message}`, Date.now() - start);
      throw error;
    } finally {
      await client.end();
    }
  }

  /**
   * TEST 5: Redis Connectivity
   * Verifies connection to Redis cache
   */
  async testRedisConnectivity(): Promise<void> {
    const testName = 'Redis Connectivity';
    const start = Date.now();

    try {
      // Parse Redis URL
      const url = new URL(`redis://${REDIS_URL.replace('redis://', '')}`);
      const host = url.hostname;
      const port = parseInt(url.port || '6379');

      await retry(async () => {
        return new Promise<void>((resolve, reject) => {
          const socket = require('net').createConnection(port, host);
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('Connection timeout'));
          }, 5000);

          socket.on('connect', () => {
            clearTimeout(timeout);
            socket.write('PING\r\n');
          });

          socket.on('data', (data: Buffer) => {
            clearTimeout(timeout);
            if (data.toString().includes('PONG')) {
              socket.destroy();
              resolve();
            } else {
              reject(new Error('No PONG response'));
            }
          });

          socket.on('error', reject);
        });
      });

      this.recordPass(testName, `Connected to Redis at ${host}:${port}`, Date.now() - start);
    } catch (error: any) {
      this.recordFail(testName, `Redis connection failed: ${error.message}`, Date.now() - start);
      throw error;
    }
  }

  /**
   * TEST 6: Elasticsearch Connectivity
   * Verifies connection to Elasticsearch
   */
  async testElasticsearchConnectivity(): Promise<void> {
    const testName = 'Elasticsearch Connectivity';
    const start = Date.now();

    try {
      const response = await retry(async () => {
        return new Promise<any>((resolve, reject) => {
          const [host, port] = ELASTICSEARCH_HOST.split(':');
          const req = http.get(
            {
              hostname: host,
              port: parseInt(port || '9200'),
              path: '/_cluster/health',
              timeout: 5000
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                if (res.statusCode === 200) {
                  try {
                    resolve(JSON.parse(data));
                  } catch (e) {
                    reject(new Error('Invalid JSON'));
                  }
                } else {
                  reject(new Error(`HTTP ${res.statusCode}`));
                }
              });
            }
          );

          req.on('error', reject);
          req.on('timeout', () => {
            req.abort();
            reject(new Error('Timeout'));
          });
        });
      });

      if (response.status === 'green' || response.status === 'yellow') {
        this.recordPass(
          testName,
          `Elasticsearch healthy (status: ${response.status})`,
          Date.now() - start
        );
      } else {
        this.recordFail(testName, `Elasticsearch status: ${response.status}`, Date.now() - start);
      }
    } catch (error: any) {
      this.recordFail(testName, `Elasticsearch check failed: ${error.message}`, Date.now() - start);
      throw error;
    }
  }

  /**
   * TEST 7: Critical Tables
   * Verifies critical tables have expected structure
   */
  async testCriticalTables(): Promise<void> {
    const testName = 'Critical Tables';
    const start = Date.now();

    const client = new PgClient({ connectionString: DATABASE_URL });

    try {
      await client.connect();

      const criticalTables = [
        'users',
        'parent_profiles',
        'child_profiles',
        'badges',
        'trivia_questions',
        'daily_quests',
        'chores',
        'goals',
        'feature_flags',
        'system_settings'
      ];

      for (const table of criticalTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name='${table}'
          )
        `);

        if (!result.rows[0].exists) {
          throw new Error(`Missing critical table: ${table}`);
        }
      }

      this.recordPass(
        testName,
        `All ${criticalTables.length} critical tables present`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordFail(testName, `Table check failed: ${error.message}`, Date.now() - start);
      throw error;
    } finally {
      await client.end();
    }
  }

  // ================================================
  // RESULT TRACKING
  // ================================================

  private recordPass(testName: string, message: string, duration: number): void {
    this.results.set(testName, { passed: true, message, duration });
    console.log(`✅ ${testName}: ${message} (${duration}ms)`);
  }

  private recordFail(testName: string, message: string, duration: number): void {
    this.results.set(testName, { passed: false, message, duration });
    console.log(`❌ ${testName}: ${message} (${duration}ms)`);
  }

  // ================================================
  // REPORT GENERATION
  // ================================================

  async runAllTests(): Promise<boolean> {
    console.log('\n🧪 FAMILY HUB SMOKE TESTS');
    console.log('========================\n');
    console.log(`Configuration:`);
    console.log(`  API: ${API_URL}`);
    console.log(`  Database: ${DATABASE_URL.split('@')[1]}`);
    console.log(`  Redis: ${REDIS_URL}`);
    console.log(`  Elasticsearch: ${ELASTICSEARCH_HOST}\n`);
    console.log('Running tests...\n');

    const tests = [
      () => this.testApiHealth(),
      () => this.testDatabaseConnectivity(),
      () => this.testDatabaseSchema(),
      () => this.testSeedData(),
      () => this.testRedisConnectivity(),
      () => this.testElasticsearchConnectivity(),
      () => this.testCriticalTables()
    ];

    let failedCount = 0;

    for (const test of tests) {
      try {
        await Promise.race([
          test(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), TIMEOUT)
          )
        ]);
      } catch (error) {
        failedCount++;
      }
    }

    this.printReport(failedCount);
    return failedCount === 0;
  }

  private printReport(failedCount: number): void {
    console.log('\n========================');
    console.log('📊 SMOKE TEST REPORT');
    console.log('========================\n');

    let totalDuration = 0;
    this.results.forEach((result) => {
      totalDuration += result.duration;
    });

    const passCount = this.results.size - failedCount;
    const totalTests = this.results.size;

    console.log(`Tests: ${passCount}/${totalTests} passed`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Total duration: ${totalDuration}ms\n`);

    this.results.forEach((result, testName) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${testName}`);
      console.log(`   └─ ${result.message} (${result.duration}ms)`);
    });

    console.log('');
    if (failedCount === 0) {
      console.log('🎉 All smoke tests passed! System is operational.');
    } else {
      console.log(`❌ ${failedCount} test(s) failed. Check configuration and services.`);
    }
    console.log('');
  }
}

// ================================================
// EXECUTE TESTS
// ================================================

async function main(): Promise<void> {
  const suite = new SmokeTestSuite();

  try {
    const allPassed = await suite.runAllTests();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Fatal error running smoke tests:', error);
    process.exit(1);
  }
}

main();
