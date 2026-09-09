import { useEffect } from 'react';
import { useAuthStore, type User } from '@stores/authStore';
import { useKioskStore, selectIsKiosk } from '@stores/kioskStore';

/**
 * The signed-in principal for the rest of the app.
 *
 * On a phone (normal login) this is the Supabase user. On a shared wall display
 * (kiosk mode) there is no user login — `user` becomes whichever family profile
 * is currently selected on the ProfileBar (null on the attract screen), and the
 * device itself is the credential, so `isAuthenticated` is always true. Every
 * downstream `canManage` role check and `!user?.id` fetch guard then works
 * unchanged.
 */
export const useAuth = () => {
  const { user, token, isLoading, error, loadCurrentUser, logout } = useAuthStore();
  const isKiosk = useKioskStore(selectIsKiosk);
  const profiles = useKioskStore((s) => s.profiles);
  const activeProfileId = useKioskStore((s) => s.activeProfileId);

  useEffect(() => {
    // Only a real per-user session needs the /auth/me round-trip.
    if (!isKiosk && token && !user) {
      loadCurrentUser();
    }
  }, [isKiosk, token, user, loadCurrentUser]);

  if (isKiosk) {
    const p = profiles.find((x) => x.userId === activeProfileId) ?? null;
    const kioskUser: User | null = p
      ? { id: p.userId, email: '', name: p.name, role: p.role, created_at: '' }
      : null;
    return {
      user: kioskUser,
      token: null,
      isLoading: false,
      error,
      isAuthenticated: true,
      logout,
      loadCurrentUser,
    };
  }

  const isAuthenticated = !!token && !!user;

  // A stored token with no user yet means loadCurrentUser is about to run (or is
  // running). Report that as "still resolving" so route guards wait for it
  // instead of treating the user as logged out and redirecting to /login.
  const resolvingSession = isLoading || (!!token && !user);

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
