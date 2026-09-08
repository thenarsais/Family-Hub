import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';

export const useAuth = () => {
  const { user, token, isLoading, error, loadCurrentUser, logout } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  // A stored token with no user yet means loadCurrentUser is about to run (or is
  // running). Report that as "still resolving" so route guards wait for it
  // instead of treating the user as logged out and redirecting to /login.
  const resolvingSession = isLoading || (!!token && !user);

  useEffect(() => {
    // Load current user on mount if a token exists but the user isn't loaded yet
    if (token && !user) {
      loadCurrentUser();
    }
  }, [token, user, loadCurrentUser]);

  return {
    user,
    token,
    isLoading: resolvingSession,
    error,
    isAuthenticated,
    logout,
    loadCurrentUser,
  };
};
