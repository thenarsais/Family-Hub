import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';

export const useAuth = () => {
  const { user, token, isLoading, error, loadCurrentUser, logout, setUser } = useAuthStore();

  // Demo users for testing
  const demoUsers: Record<string, any> = {
    '00000000-0000-0000-0000-000000000001': {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'testparent@example.com',
      name: 'Test Parent',
      role: 'parent',
      created_at: new Date().toISOString()
    },
    '00000000-0000-0000-0000-000000000002': {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'testchild@example.com',
      name: 'Test Child',
      role: 'child',
      created_at: new Date().toISOString()
    }
  };

  // Check if token is a demo token
  let decodedUser = null;
  if (token) {
    try {
      // Decode base64 token (works in browser)
      const decoded = JSON.parse(atob(token));
      if (decoded.sub && demoUsers[decoded.sub]) {
        decodedUser = demoUsers[decoded.sub];
      }
    } catch (e) {
      // Not a demo token, continue
    }
  }

  const isAuthenticated = !!token && (!!user || !!decodedUser);

  console.log('[USEAUTH] token exists:', !!token, 'user exists:', !!user, 'decodedUser exists:', !!decodedUser, 'isAuthenticated:', isAuthenticated);
  if (token) console.log('[USEAUTH] token:', token.substring(0, 30) + '...');
  if (user) console.log('[USEAUTH] user:', user.id);
  if (decodedUser) console.log('[USEAUTH] decodedUser:', decodedUser.id);

  useEffect(() => {
    // Load current user on mount if token exists
    if (token && !user && !decodedUser) {
      loadCurrentUser();
    } else if (decodedUser && !user) {
      // Set demo user
      setUser(decodedUser);
    }
  }, [token, user, decodedUser, loadCurrentUser, setUser]);

  return {
    user: user || decodedUser,
    token,
    isLoading,
    error,
    isAuthenticated,
    logout,
    loadCurrentUser,
  };
};
