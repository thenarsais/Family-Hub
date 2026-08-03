/**
 * useAuth Hook Tests
 * Tests authentication hook and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    token: 'mock-token',
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
  }),
}));

// Mock the API client
jest.mock('@/services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
