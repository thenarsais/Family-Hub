/**
 * Frontend Environment Validation Tests
 * Ensures required Vite environment variables are available (fail-fast)
 */

describe('Frontend Environment Validation', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('Required Variables', () => {
    it('should provide VITE_API_URL', () => {
      expect(import.meta.env.VITE_API_URL).toBeDefined();
      expect(typeof import.meta.env.VITE_API_URL).toBe('string');
    });

    it('should provide VITE_SUPABASE_URL', () => {
      expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined();
      expect(typeof import.meta.env.VITE_SUPABASE_URL).toBe('string');
    });

    it('should provide VITE_SUPABASE_ANON_KEY', () => {
      expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeDefined();
      expect(typeof import.meta.env.VITE_SUPABASE_ANON_KEY).toBe('string');
    });
  });

  describe('Optional Variables', () => {
    it('should optionally provide VITE_SENTRY_DSN', () => {
      // Optional in Phase 0, required in Phase 1
      if (import.meta.env.VITE_SENTRY_DSN) {
        expect(typeof import.meta.env.VITE_SENTRY_DSN).toBe('string');
      }
    });
  });

  describe('URL Format Validation', () => {
    it('VITE_API_URL should be valid URL or relative path', () => {
      const url = import.meta.env.VITE_API_URL;
      // Should start with http, https, or /
      expect(url).toMatch(/^(https?:\/\/|\/)/);
    });

    it('VITE_SUPABASE_URL should be valid HTTPS URL', () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    });
  });

  describe('Key Format Validation', () => {
    it('VITE_SUPABASE_ANON_KEY should be non-empty', () => {
      expect(import.meta.env.VITE_SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
    });

    it('VITE_SENTRY_DSN should be valid when present', () => {
      if (import.meta.env.VITE_SENTRY_DSN) {
        expect(import.meta.env.VITE_SENTRY_DSN).toMatch(
          /^https?:\/\/.+@\S+\.\S+\/\d+/
        );
      }
    });
  });

  describe('Environment Mode', () => {
    it('should provide MODE variable', () => {
      expect(import.meta.env.MODE).toBeDefined();
      expect(['development', 'production', 'test']).toContain(
        import.meta.env.MODE
      );
    });

    it('should provide DEV boolean flag', () => {
      expect(typeof import.meta.env.DEV).toBe('boolean');
    });

    it('should provide PROD boolean flag', () => {
      expect(typeof import.meta.env.PROD).toBe('boolean');
    });

    it('DEV and PROD should be mutually exclusive', () => {
      expect(import.meta.env.DEV).not.toBe(import.meta.env.PROD);
    });
  });

  describe('Development Environment', () => {
    it('should allow localhost API in development', () => {
      if (import.meta.env.DEV) {
        const apiUrl = import.meta.env.VITE_API_URL;
        // In dev, should be able to connect to localhost
        expect(apiUrl).toBeTruthy();
      }
    });
  });

  describe('Production Environment', () => {
    it('VITE_API_URL should be absolute URL in production', () => {
      if (import.meta.env.PROD) {
        const apiUrl = import.meta.env.VITE_API_URL;
        expect(apiUrl).toMatch(/^https?:\/\//);
      }
    });

    it('should use HTTPS in production', () => {
      if (import.meta.env.PROD) {
        expect(import.meta.env.VITE_SUPABASE_URL).toMatch(/^https:\/\//);
      }
    });
  });
});
