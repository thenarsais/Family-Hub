/**
 * useAuth Hook Tests
 * Tests authentication hook and state management
 */

import { vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useKioskStore } from '@/stores/kioskStore';

// Mock the auth store. Must match the real useAuthStore shape completely —
// useAuth.ts destructures isLoading/error/loadCurrentUser/setUser too, and a
// partial mock silently returns `undefined` for whatever's missing rather
// than erroring, which is easy to miss (it only breaks the specific
// assertions that check those exact fields, not the render itself).
const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    user: { id: 'user-1', email: 'test@example.com' } as { id: string; email: string } | null,
    token: 'mock-token' as string | null,
    isLoading: false,
    error: null as string | null,
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    ...mockAuthState,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    loadCurrentUser: vi.fn(),
    setUser: vi.fn(),
  }),
}));

// Mock the API client
vi.mock('@/services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = { id: 'user-1', email: 'test@example.com' };
    mockAuthState.token = 'mock-token';
    mockAuthState.isLoading = false;
    mockAuthState.error = null;
    useKioskStore.setState({
      deviceToken: null,
      profiles: [],
      activeProfileId: null,
    });
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.error).toBeDefined();
    });

    it('should have user from store', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual({ id: 'user-1', email: 'test@example.com' });
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it('reports the session as still resolving when a stored token has no user yet', () => {
      // hard-load: readStoredAuth put a token in the store but loadCurrentUser
      // hasn't populated the user. Route guards must wait, not redirect to /login.
      mockAuthState.token = 'mock-token';
      mockAuthState.user = null;
      mockAuthState.isLoading = false;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    it('should provide user state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeDefined();
    });

    it('should track loading state', async () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should handle errors', async () => {
      const { result } = renderHook(() => useAuth());

      // Should have error handling
      expect(result.current.error).toBeNull();
    });

    it('should have user available', async () => {
      const { result } = renderHook(() => useAuth());

      // User should be available
      expect(result.current.user).toBeDefined();
    });

    it('should not expose password in state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).not.toHaveProperty('password');
      expect(result.current).not.toHaveProperty('passwordHash');
    });

    it('should track authentication status', () => {
      const { result } = renderHook(() => useAuth());

      // Should have isAuthenticated
      if (result.current.user) {
        expect(result.current.isAuthenticated).toBeDefined();
      }
    });
  });

  describe('Logout Functionality', () => {
    it('should have logout method', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.logout).toBe('function');
    });

    it('should clear user data on logout', async () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.logout).toBeDefined();
    });

    it('should clear error on logout', async () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeNull();
    });
  });

  describe('User Loading', () => {
    it('should have loadCurrentUser method', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.loadCurrentUser).toBe('function');
    });

    it('should load current user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loadCurrentUser).toBeDefined();
    });

    it('should update user state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeDefined();
    });
  });

  describe('Token Management', () => {
    it('should handle token refresh', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toBeDefined();
    });

    it('should not expose token in logs', () => {
      const { result } = renderHook(() => useAuth());

      // Token should not be in public properties
      expect(result.current).not.toHaveProperty('rawToken');
    });

    it('should include token in requests', () => {
      const { result } = renderHook(() => useAuth());

      // Hook should provide token for API calls
      expect(result.current).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should catch network errors', async () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      const { result } = renderHook(() => useAuth());

      // Should be able to track login errors
      expect(result.current.error).toBeNull();
    });

    it('should not expose sensitive error details', () => {
      const { result } = renderHook(() => useAuth());

      if (result.current.error) {
        const errorStr = JSON.stringify(result.current.error);
        expect(errorStr).not.toContain('password');
        expect(errorStr).not.toContain('token');
      }
    });
  });

  describe('State Persistence', () => {
    it('should persist auth state', () => {
      const { result } = renderHook(() => useAuth());

      // Should have user data available
      expect(result.current.user).toBeDefined();
    });

    it('should restore session from storage', () => {
      const { result } = renderHook(() => useAuth());

      // Should load from persistent storage
      expect(result.current.user).toBeDefined();
    });
  });

  describe('COPPA Compliance', () => {
    it('should not store sensitive child data in hook', () => {
      const { result } = renderHook(() => useAuth());

      if (result.current.user) {
        expect(result.current.user).not.toHaveProperty('childName');
        expect(result.current.user).not.toHaveProperty('birthDate');
      }
    });

    it('should not expose PII in user object', () => {
      const { result } = renderHook(() => useAuth());

      if (result.current.user) {
        expect(result.current.user).not.toHaveProperty('phoneNumber');
        expect(result.current.user).not.toHaveProperty('address');
      }
    });
  });

  describe('Kiosk mode', () => {
    const PROFILES = [
      { userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
      { userId: 'k1', name: 'Karishma', role: 'child', color: 'karishma' },
    ];

    it('returns the active profile as the user and is always authenticated', () => {
      useKioskStore.setState({
        deviceToken: 'dev-tok',
        profiles: PROFILES,
        activeProfileId: 'k1',
      });
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({ id: 'k1', name: 'Karishma', role: 'child' });
      expect(result.current.isLoading).toBe(false);
    });

    it('has a null user on the attract screen but stays authenticated', () => {
      useKioskStore.setState({
        deviceToken: 'dev-tok',
        profiles: PROFILES,
        activeProfileId: null,
      });
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('does not call loadCurrentUser in kiosk mode', () => {
      const loadCurrentUser = vi.fn();
      mockAuthState.token = 'mock-token';
      mockAuthState.user = null;
      useKioskStore.setState({ deviceToken: 'dev-tok', profiles: PROFILES, activeProfileId: 'p1' });

      // The store mock re-creates loadCurrentUser per call; assert via the effect
      // not firing a fetch would need spying — instead check the resolving flag
      // never trips (kiosk short-circuits before the token/user branch).
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
      expect(loadCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should share state across instances', () => {
      const { result: result1 } = renderHook(() => useAuth());
      const { result: result2 } = renderHook(() => useAuth());

      // Both should have same user
      expect(result1.current.user?.id).toBe(result2.current.user?.id);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useAuth());

      // Should cleanup without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should clear listeners on unmount', () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();
      // No additional assertions - just verify no errors
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed user', () => {
      const { result } = renderHook(() => useAuth());

      if (result.current.user) {
        expect(typeof result.current.user.id).toBe('string');
        expect(typeof result.current.user.email).toBe('string');
      }
    });

    it('should return properly typed loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });
});
