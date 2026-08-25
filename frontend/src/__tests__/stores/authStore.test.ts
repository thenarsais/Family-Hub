/**
 * authStore Tests
 *
 * useAuth.test.ts mocks this store entirely, so none of its real actions
 * (login/signup/logout/loadCurrentUser/initializeFromStorage) were ever
 * exercised. This file tests the real zustand store, mocking only apiClient
 * and localStorage.
 */

import { vi } from 'vitest';

vi.mock('@/services/api', () => ({
  apiClient: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

function resetStore() {
  useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetStore();
  });

  describe('initializeFromStorage', () => {
    it('should load token and user from localStorage', () => {
      window.localStorage.setItem('auth_token', 'tok-1');
      window.localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', email: 'a@b.com' }));

      useAuthStore.getState().initializeFromStorage();

      expect(useAuthStore.getState().token).toBe('tok-1');
      expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@b.com' });
    });

    it('should default to null when nothing is stored', () => {
      useAuthStore.getState().initializeFromStorage();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should reset to null when stored user JSON is corrupt', () => {
      window.localStorage.setItem('auth_token', 'tok-1');
      window.localStorage.setItem('auth_user', '{not-json');

      useAuthStore.getState().initializeFromStorage();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('signup', () => {
    it('should store the token/user and update state on success', async () => {
      (apiClient.signup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        session: { access_token: 'tok-1' },
        user: { id: 'u1', email: 'a@b.com' },
      });

      await useAuthStore.getState().signup('a@b.com', 'pw', 'Alice');

      expect(apiClient.signup).toHaveBeenCalledWith('a@b.com', 'pw', 'Alice');
      expect(window.localStorage.getItem('auth_token')).toBe('tok-1');
      expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@b.com' });
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should fall back to a top-level token field when session is absent', async () => {
      (apiClient.signup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        token: 'tok-2',
        user: { id: 'u1' },
      });

      await useAuthStore.getState().signup('a@b.com', 'pw', 'Alice');

      expect(useAuthStore.getState().token).toBe('tok-2');
    });

    it('should set an error and rethrow when there is no token in the response', async () => {
      (apiClient.signup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { id: 'u1' } });

      await expect(useAuthStore.getState().signup('a@b.com', 'pw', 'Alice')).rejects.toThrow('No token in response');

      expect(useAuthStore.getState().error).toBe('No token in response');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should surface a server-provided error message', async () => {
      (apiClient.signup as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        response: { data: { message: 'Email already in use' } },
      });

      await expect(useAuthStore.getState().signup('a@b.com', 'pw', 'Alice')).rejects.toBeDefined();

      expect(useAuthStore.getState().error).toBe('Email already in use');
    });
  });

  describe('login', () => {
    it('should store the token/user and update state on success', async () => {
      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        session: { access_token: 'tok-1' },
        user: { id: 'u1', email: 'a@b.com' },
      });

      await useAuthStore.getState().login('a@b.com', 'pw');

      expect(window.localStorage.getItem('auth_user')).toBe(JSON.stringify({ id: 'u1', email: 'a@b.com' }));
      expect(useAuthStore.getState().token).toBe('tok-1');
    });

    it('should set isLoading while the request is in flight', () => {
      let resolveLogin: (value: unknown) => void = () => {};
      (apiClient.login as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const promise = useAuthStore.getState().login('a@b.com', 'pw');
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveLogin({ session: { access_token: 'tok-1' }, user: { id: 'u1' } });
      return promise;
    });

    it('should set an error and rethrow when there is no token in the response', async () => {
      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { id: 'u1' } });

      await expect(useAuthStore.getState().login('a@b.com', 'wrong')).rejects.toThrow('No token in response');
      expect(useAuthStore.getState().error).toBe('No token in response');
    });

    it('should fall back to a generic message when the error has none', async () => {
      (apiClient.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce({});

      await expect(useAuthStore.getState().login('a@b.com', 'wrong')).rejects.toBeDefined();

      expect(useAuthStore.getState().error).toBe('Login failed');
    });
  });

  describe('logout', () => {
    it('should clear localStorage and state even when the API call succeeds', async () => {
      window.localStorage.setItem('auth_token', 'tok-1');
      window.localStorage.setItem('auth_user', '{}');
      useAuthStore.setState({ token: 'tok-1', user: { id: 'u1' } as never });
      (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      await useAuthStore.getState().logout();

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(window.localStorage.getItem('auth_user')).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('should still clear local state when the API call fails, even though logout() itself rejects', async () => {
      window.localStorage.setItem('auth_token', 'tok-1');
      useAuthStore.setState({ token: 'tok-1', user: { id: 'u1' } as never });
      (apiClient.logout as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'));

      await expect(useAuthStore.getState().logout()).rejects.toThrow('network error');

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('loadCurrentUser', () => {
    it('should store the resolved user (response.data.user shape)', async () => {
      (apiClient.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'a@b.com' } },
      });

      await useAuthStore.getState().loadCurrentUser();

      expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@b.com' });
      expect(window.localStorage.getItem('auth_user')).toBe(JSON.stringify({ id: 'u1', email: 'a@b.com' }));
    });

    it('should fall back to response.data directly when there is no nested user', async () => {
      (apiClient.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { id: 'u1', email: 'a@b.com' },
      });

      await useAuthStore.getState().loadCurrentUser();

      expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@b.com' });
    });

    it('should clear tokens and user when the call fails', async () => {
      window.localStorage.setItem('auth_token', 'tok-1');
      window.localStorage.setItem('auth_user', '{}');
      (apiClient.getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('unauthorized'));

      await useAuthStore.getState().loadCurrentUser();

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setUser / setToken', () => {
    it('setUser should update state directly', () => {
      useAuthStore.getState().setUser({ id: 'u1', email: 'a@b.com', name: 'A', role: 'parent', created_at: '2026-01-01' });

      expect(useAuthStore.getState().user?.id).toBe('u1');
    });

    it('setToken should persist a non-null token to localStorage', () => {
      useAuthStore.getState().setToken('tok-1');

      expect(window.localStorage.getItem('auth_token')).toBe('tok-1');
      expect(useAuthStore.getState().token).toBe('tok-1');
    });

    it('setToken(null) should remove the stored token', () => {
      window.localStorage.setItem('auth_token', 'tok-1');

      useAuthStore.getState().setToken(null);

      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });
});
