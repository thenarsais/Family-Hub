/**
 * Environment Validation Tests
 * Ensures required environment variables exist before server starts (fail-fast)
 */

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Save original env
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should pass when all required variables are set', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      // Should not throw
      expect(() => {
        // Import after setting env
        require('../../config/env').validateEnv();
      }).not.toThrow();
    });

    it('should fail when NODE_ENV is missing', () => {
      delete process.env.NODE_ENV;
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow(/NODE_ENV/);
    });

    it('should fail when PORT is missing', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.PORT;
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow(/PORT/);
    });

    it('should fail when SUPABASE_URL is missing', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow(/SUPABASE_URL/);
    });

    it('should fail when multiple variables are missing', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.PORT;
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow();
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error message with recovery step', () => {
      delete process.env.PORT;
      process.env.NODE_ENV = 'test';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      try {
        require('../../config/env').validateEnv();
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('cp .env.example .env');
      }
    });

    it('should list all missing variables in error', () => {
      delete process.env.PORT;
      delete process.env.SUPABASE_SERVICE_KEY;
      process.env.NODE_ENV = 'test';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      try {
        require('../../config/env').validateEnv();
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('PORT');
        expect(error.message).toContain('SUPABASE_SERVICE_KEY');
      }
    });
  });

  describe('Variable Content Validation', () => {
    it('should accept valid PORT numbers', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).not.toThrow();
    });

    it('should accept various NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test', 'staging'];

      for (const env of validEnvs) {
        process.env.NODE_ENV = env;
        process.env.PORT = '3000';
        process.env.SUPABASE_URL = 'https://test.supabase.co';
        process.env.SUPABASE_ANON_KEY = 'anon-key-123';
        process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

        expect(() => {
          require('../../config/env').validateEnv();
        }).not.toThrow();
      }
    });
  });

  describe('Exported Configuration', () => {
    it('should export validated configuration object', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      const config = require('../../config/env').config;

      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('supabaseUrl');
      expect(config).toHaveProperty('supabaseAnonKey');
      expect(config).toHaveProperty('supabaseServiceKey');
      expect(config).toHaveProperty('databaseUrl');
    });

    it('should parse port as number', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      const config = require('../../config/env').config;
      expect(typeof config.port).toBe('number');
      expect(config.port).toBe(3000);
    });
  });

  describe('Fail-Fast Behavior', () => {
    it('should throw synchronously (not async)', () => {
      delete process.env.PORT;
      process.env.NODE_ENV = 'test';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.SUPABASE_SERVICE_KEY = 'service-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      // Should throw immediately, not return promise
      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow();
    });

    it('should prevent server start before validation', () => {
      delete process.env.SUPABASE_SERVICE_KEY;
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'anon-key-123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';

      expect(() => {
        require('../../config/env').validateEnv();
      }).toThrow();
    });
  });
});
