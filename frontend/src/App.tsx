import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useNightMode } from '@hooks/useNightMode';
import { useAuthStore } from '@stores/authStore';

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

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  // Drives .dark on <html> app-wide (Auto schedule + temporary manual override).
  const { isNightMode, isOverridden, toggleNightMode } = useNightMode();

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
      <div className="min-h-screen flex flex-col bg-paper text-ink">
        <MehndiBorder edge="top" />
        {isAuthenticated && (
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
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route
              path="/signup"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/activity" element={<Lazy><ActivityBoard /></Lazy>} />
              <Route path="/smartthings" element={<Lazy><SmartHome /></Lazy>} />
              <Route path="/family" element={<Lazy><FamilyPage /></Lazy>} />
              <Route path="/profile" element={<Lazy><ProfilePage /></Lazy>} />
              <Route path="/announcements" element={<Lazy><AnnouncementsPage /></Lazy>} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <MehndiBorder edge="bottom" />
      </div>
    </BrowserRouter>
  );
}
