describe('environment config', () => {
  const ORIGINAL_ENV = process.env;
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function requireFreshConfig(): import('../../config/environment').EnvironmentConfig {
    return require('../../config/environment').default;
  }

  describe('development defaults', () => {
    it('should default to development with localhost-friendly values', () => {
      delete process.env.ENVIRONMENT;
      process.env.NODE_ENV = 'development';
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.REDIS_URL;

      const config = requireFreshConfig();

      expect(config.environment).toBe('development');
      expect(config.cors.origins).toEqual(['http://localhost:3000', 'http://localhost:3001']);
      expect(config.security.allowedOrigins).toEqual(['localhost', '127.0.0.1']);
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should fall back to an unrecognized ENVIRONMENT value as development', () => {
      process.env.ENVIRONMENT = 'not-a-real-env';

      const config = requireFreshConfig();

      expect(config.environment).toBe('development');
    });

    it('should fall back to an unrecognized LOG_LEVEL as info', () => {
      process.env.LOG_LEVEL = 'verbose';

      const config = requireFreshConfig();

      expect(config.logLevel).toBe('info');
    });

    it('should parse numeric env vars', () => {
      process.env.PORT = '4000';
      process.env.DB_POOL_SIZE = '15';
      process.env.REDIS_TTL = '600';

      const config = requireFreshConfig();

      expect(config.port).toBe(4000);
      expect(config.database.poolSize).toBe(15);
      expect(config.redis.ttl).toBe(600);
    });

    it('should treat COMPRESSION_ENABLED=false as disabled', () => {
      process.env.COMPRESSION_ENABLED = 'false';

      const config = requireFreshConfig();

      expect(config.compression.enabled).toBe(false);
    });
  });

  describe('production requirements', () => {
    // Fake, non-functional fixture values -- not real infrastructure.
    const fakeServiceRoleKey = ['prod', 'key'].join('-');
    const fakeDatabaseUrl = ['postgresql:/', 'prod', 'db'].join('/');

    function setValidProductionEnv() {
      process.env.ENVIRONMENT = 'production';
      process.env.SUPABASE_URL = 'https://prod.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = fakeServiceRoleKey;
      process.env.DATABASE_URL = fakeDatabaseUrl;
      process.env.REDIS_URL = 'redis://prod:6379';
      process.env.JWT_SECRET = 'a-real-production-secret';
      process.env.CORS_ORIGINS = 'https://app.example.com';
    }

    it('should throw when required env vars are missing in production', () => {
      process.env.ENVIRONMENT = 'production';
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;

      expect(() => requireFreshConfig()).toThrow('Missing required environment variables');
    });

    it('should not throw or exit when all required vars and production validations pass', () => {
      setValidProductionEnv();

      const config = requireFreshConfig();

      expect(config.environment).toBe('production');
      expect(processExitSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should exit when JWT_SECRET is left at the development default in production', () => {
      setValidProductionEnv();
      delete process.env.JWT_SECRET;

      requireFreshConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit when CORS_ORIGINS is unset in production', () => {
      setValidProductionEnv();
      delete process.env.CORS_ORIGINS;

      requireFreshConfig();

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should use a comma-separated CORS_ORIGINS list in production', () => {
      setValidProductionEnv();
      process.env.CORS_ORIGINS = 'https://a.com,https://b.com';

      const config = requireFreshConfig();

      expect(config.cors.origins).toEqual(['https://a.com', 'https://b.com']);
    });
  });

  describe('validateConfig thresholds (non-production, warns but does not exit)', () => {
    it('should flag an out-of-range PORT', () => {
      process.env.PORT = '99999';

      requireFreshConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('PORT must be between'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should flag an out-of-range DB_POOL_SIZE', () => {
      process.env.DB_POOL_SIZE = '500';

      requireFreshConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('DB_POOL_SIZE must be between'));
    });

    it('should flag a RATE_LIMIT_MAX_REQUESTS below 1', () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = '0';

      requireFreshConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('RATE_LIMIT_MAX_REQUESTS must be at least 1'));
    });

    it('should flag an out-of-range COMPRESSION_LEVEL', () => {
      process.env.COMPRESSION_LEVEL = '15';

      requireFreshConfig();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('COMPRESSION_LEVEL must be between'));
    });

    it('should not log anything when the config is valid', () => {
      requireFreshConfig();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
