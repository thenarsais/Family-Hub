import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';

export const useAuth = () => {
  const { user, token, isLoading, error, loadCurrentUser, logout } = useAuthStore();

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    // Load current user on mount if a token exists but the user isn't loaded yet
    if (token && !user) {
      loadCurrentUser();
    }
  }, [token, user, loadCurrentUser]);

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    logout,
    loadCurrentUser,
  };
};
