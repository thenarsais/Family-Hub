import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useNightMode } from '@hooks/useNightMode';
import { useIdleRevert } from '@hooks/useIdleRevert';
import { useAuthStore } from '@stores/authStore';
import { useKioskStore, selectIsKiosk } from '@stores/kioskStore';

// Entry-point pages stay eager (they're on the first-paint path).
import Dashboard from '@pages/Dashboard';
import Login from '@pages/Login';
import Signup from '@pages/Signup';
import NotFound from '@pages/NotFound';

// Secondary pages are reached only by navigation — split each into its own
// chunk so it isn't in the initial bundle.
const ActivityBoard = lazy(() => import('@pages/ActivityBoard'));
const SmartHome = lazy(() => import('@pages/SmartHome'));
const FamilyPage = lazy(() => import('@pages/FamilyPage'));
const ProfilePage = lazy(() => import('@pages/ProfilePage'));
const AnnouncementsPage = lazy(() => import('@pages/AnnouncementsPage'));
const RemindersPage = lazy(() => import('@pages/RemindersPage'));
const ShoppingListPage = lazy(() => import('@pages/ShoppingListPage'));
const KidsBoard = lazy(() => import('@pages/KidsBoard'));
const KioskHome = lazy(() => import('@pages/KioskHome'));

import ProtectedRoute from '@components/ProtectedRoute';
import Navigation from '@components/Navigation';
import MehndiBorder from '@components/shell/MehndiBorder';

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
      <div className="animate-spin">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    </div>
  );
}

/** Wraps a lazily-loaded page so its chunk can stream in behind a spinner. */
function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

/** Routes + shell. Split out so it can use router hooks (useIdleRevert). */
function AppShell() {
  const { isAuthenticated } = useAuth();
  const { isNightMode, isOverridden, toggleNightMode } = useNightMode();
  const isKiosk = useKioskStore(selectIsKiosk);
  const activeProfileId = useKioskStore((s) => s.activeProfileId);
  const kioskProfileCount = useKioskStore((s) => s.profiles.length);
  const bootstrapKiosk = useKioskStore((s) => s.bootstrap);

  // A shared display persists only its device token across reloads — re-fetch
  // the household (profiles, PIN status, idle timeout) on boot.
  useEffect(() => {
    if (isKiosk && kioskProfileCount === 0) void bootstrapKiosk();
  }, [isKiosk, kioskProfileCount, bootstrapKiosk]);

  // Shared display: after N idle minutes, drop back to the attract screen.
  useIdleRevert();

  const showChrome = isAuthenticated || isKiosk;
  const attract = isKiosk && !activeProfileId;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <MehndiBorder edge="top" />
      {showChrome && (
        <Navigation
          isNightMode={isNightMode}
          isNightOverridden={isOverridden}
          onToggleNightMode={toggleNightMode}
        />
      )}

      <div className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated || isKiosk ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated || isKiosk ? <Navigate to="/dashboard" /> : <Signup />}
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={attract ? <Lazy><KioskHome /></Lazy> : <Dashboard />}
            />
            <Route path="/activity" element={<Lazy><ActivityBoard /></Lazy>} />
            <Route path="/smartthings" element={<Lazy><SmartHome /></Lazy>} />
            <Route path="/family" element={<Lazy><FamilyPage /></Lazy>} />
            <Route path="/profile" element={<Lazy><ProfilePage /></Lazy>} />
            <Route path="/announcements" element={<Lazy><AnnouncementsPage /></Lazy>} />
            <Route path="/reminders" element={<Lazy><RemindersPage /></Lazy>} />
            <Route path="/shopping-list" element={<Lazy><ShoppingListPage /></Lazy>} />
            <Route path="/kids/:memberId" element={<Lazy><KidsBoard /></Lazy>} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <MehndiBorder edge="bottom" />
    </div>
  );
}

export default function App() {
  const { isLoading } = useAuth();

  // Initialize auth state from localStorage on app load (only once)
  useEffect(() => {
    console.log('[APP] Initializing auth state from localStorage');
    useAuthStore.getState().initializeFromStorage();

    // Apply the saved mehndi-border preference (toggled on the profile page)
    try {
      if (localStorage.getItem('fh:mehndi') === 'off') {
        document.documentElement.dataset.mehndi = 'off';
      }
    } catch {
      /* storage unavailable — keep the default (on) */
    }
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
