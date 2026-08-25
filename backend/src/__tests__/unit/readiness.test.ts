import {
  checkDatabase,
  checkCache,
  checkExternalApis,
  checkEnvironmentVariables,
  checkMemory,
  runReadinessChecks,
  isAlive,
} from '../../utils/readiness';

// Fake, non-functional fixture values -- not real infrastructure.
const FAKE_SERVICE_ROLE_KEY = ['fake', 'key'].join('-');
const FAKE_DATABASE_URL = ['postgresql:/', 'localhost', 'db'].join('/');

describe('readiness checks', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('checkDatabase', () => {
    it('should report healthy', async () => {
      const result = await checkDatabase();

      expect(result.name).toBe('database');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkCache', () => {
    it('should report healthy', async () => {
      const result = await checkCache();

      expect(result.name).toBe('cache');
      expect(result.status).toBe('healthy');
    });
  });

  describe('checkExternalApis', () => {
    it('should report healthy when SUPABASE_URL is configured', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';

      const result = await checkExternalApis();

      expect(result.status).toBe('healthy');
    });

    it('should report degraded when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;

      const result = await checkExternalApis();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('Supabase not configured');
    });
  });

  describe('checkEnvironmentVariables', () => {
    it('should report healthy when all required vars are set', () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = FAKE_SERVICE_ROLE_KEY;
      process.env.DATABASE_URL = FAKE_DATABASE_URL;
      process.env.REDIS_URL = 'redis://localhost';

      const result = checkEnvironmentVariables();

      expect(result.status).toBe('healthy');
    });

    it('should report unhealthy and list the missing vars', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.REDIS_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = FAKE_SERVICE_ROLE_KEY;
      process.env.DATABASE_URL = FAKE_DATABASE_URL;

      const result = checkEnvironmentVariables();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('SUPABASE_URL');
      expect(result.message).toContain('REDIS_URL');
    });
  });

  describe('checkMemory', () => {
    const originalMemoryUsage = process.memoryUsage;

    afterEach(() => {
      process.memoryUsage = originalMemoryUsage;
    });

    it('should report healthy under 75% heap usage', () => {
      process.memoryUsage = jest.fn(() => ({
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      })) as unknown as typeof process.memoryUsage;

      const result = checkMemory();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('50.0%');
    });

    it('should report degraded between 75% and 90% heap usage', () => {
      process.memoryUsage = jest.fn(() => ({
        heapUsed: 80 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      })) as unknown as typeof process.memoryUsage;

      const result = checkMemory();

      expect(result.status).toBe('degraded');
    });

    it('should report unhealthy above 90% heap usage', () => {
      process.memoryUsage = jest.fn(() => ({
        heapUsed: 95 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      })) as unknown as typeof process.memoryUsage;

      const result = checkMemory();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('runReadinessChecks', () => {
    it('should aggregate all checks with a consistent summary', async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = FAKE_SERVICE_ROLE_KEY;
      process.env.DATABASE_URL = FAKE_DATABASE_URL;
      process.env.REDIS_URL = 'redis://localhost';

      const result = await runReadinessChecks();

      expect(result.checks).toHaveLength(5);
      expect(result.summary.total).toBe(5);
      expect(result.summary.healthy + result.summary.degraded + result.summary.unhealthy).toBe(5);
      expect(result.ready).toBe(result.summary.unhealthy === 0);
      // environment-independent checks should always be healthy here
      const byName = Object.fromEntries(result.checks.map((c) => [c.name, c.status]));
      expect(byName.database).toBe('healthy');
      expect(byName.cache).toBe('healthy');
      expect(byName.external_apis).toBe('healthy');
      expect(byName.environment_variables).toBe('healthy');
    });

    it('should not be ready when a check is unhealthy', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;

      const result = await runReadinessChecks();

      expect(result.summary.unhealthy).toBeGreaterThan(0);
      expect(result.ready).toBe(false);
    });
  });

  describe('isAlive', () => {
    it('should be true once the process has uptime', () => {
      expect(isAlive()).toBe(true);
    });
  });
});
