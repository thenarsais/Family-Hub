/**
 * API Service Tests
 * Tests HTTP client and API communication
 *
 * The previous version of this file mocked global.fetch, but apiClient is
 * built on axios (which uses XMLHttpRequest, not fetch, in jsdom) — the mock
 * never touched the real request path. It also asserted `expect(apiClient)
 * .toBeDefined()` in nearly every test regardless of what was mocked, and
 * described features (retry logic, exponential backoff, timeout/abort
 * handling) that don't exist anywhere in services/api.ts. Rewritten to
 * actually mock axios and exercise the two pieces of real logic in this
 * file: the auth-token request interceptor and the conditional-redirect
 * response interceptor (see the `isAuthEndpoint` check — this is the exact
 * logic behind a redirect-loop bug fixed earlier in this project).
 */

import { vi } from 'vitest';

let requestInterceptor: (config: any) => any;
let responseErrorInterceptor: (error: any) => any;

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn((fn: any) => {
        requestInterceptor = fn;
      }),
    },
    response: {
      use: vi.fn((_success: any, errorFn: any) => {
        responseErrorInterceptor = errorFn;
      }),
    },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

function makeToken(payload: Record<string, any>) {
  return btoa(JSON.stringify(payload));
}

describe('API Service', () => {
  // Imported after the mock is registered so the module picks up mocked axios.
  let apiClient: typeof import('@/services/api').apiClient;

  beforeAll(async () => {
    ({ apiClient } = await import('@/services/api'));
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Client setup', () => {
    it('should be initialized as a single instance', () => {
      expect(apiClient).toBeDefined();
    });

    it('should register a request interceptor', () => {
      expect(requestInterceptor).toBeDefined();
    });

    it('should register a response interceptor', () => {
      expect(responseErrorInterceptor).toBeDefined();
    });
  });

  describe('Request interceptor — auth headers', () => {
    it('should not add an Authorization header when no token is stored', () => {
      const config = { headers: {} as Record<string, string> };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add a Bearer Authorization header when a token is stored', () => {
      window.localStorage.setItem('auth_token', 'some-token');
      const config = { headers: {} as Record<string, string> };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer some-token');
    });

    it('should decode the token and set x-user-id when it is decodable', () => {
      const token = makeToken({ sub: 'user-123', email: 'test@example.com' });
      window.localStorage.setItem('auth_token', token);
      const config = { headers: {} as Record<string, string> };

      const result = requestInterceptor(config);

      expect(result.headers['x-user-id']).toBe('user-123');
    });

    it('should not throw or set x-user-id when the token is not valid base64 JSON', () => {
      window.localStorage.setItem('auth_token', 'not-a-real-token');
      const config = { headers: {} as Record<string, string> };

      expect(() => requestInterceptor(config)).not.toThrow();
      const result = requestInterceptor(config);
      expect(result.headers['x-user-id']).toBeUndefined();
      // The Authorization header should still be set even if decoding fails.
      expect(result.headers.Authorization).toBe('Bearer not-a-real-token');
    });
  });

  describe('Response interceptor — 401 handling', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // window.location.href = ... would otherwise attempt a real jsdom
      // navigation and log "Not implemented" noise.
      delete (window as any).location;
      (window as any).location = { ...originalLocation, href: '' };
      window.localStorage.setItem('auth_token', 'token');
      window.localStorage.setItem('auth_user', '{}');
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it('should clear tokens and redirect on a 401 from an auth endpoint', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/auth/login' },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(window.localStorage.getItem('auth_user')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should NOT clear tokens or redirect on a 401 from a feature endpoint', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/api/calendar/events' },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(window.localStorage.getItem('auth_token')).toBe('token');
      expect(window.location.href).toBe('');
    });

    it('should pass through non-401 errors without touching auth state', async () => {
      const error = {
        response: { status: 500 },
        config: { url: '/api/chores' },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);

      expect(window.localStorage.getItem('auth_token')).toBe('token');
      expect(window.location.href).toBe('');
    });
  });

  describe('Method delegation', () => {
    it('should call the login endpoint with credentials', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { session: {} } });

      await apiClient.login('test@example.com', 'password123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should call the badges endpoint with pagination params', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });

      await apiClient.getBadges(10, 5);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges', {
        params: { limit: 10, offset: 5 },
      });
    });

    it('should propagate rejected requests to the caller', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getBadges()).rejects.toThrow('Network error');
    });
  });
});
