import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@stores/authStore';

// Pages (to be created)
import Dashboard from '@pages/Dashboard';
import Login from '@pages/Login';
import Signup from '@pages/Signup';
import ActivityBoard from '@pages/ActivityBoard';
import SmartHome from '@pages/SmartHome';
import NotFound from '@pages/NotFound';

// Components (to be created)
import ProtectedRoute from '@components/ProtectedRoute';
import Navigation from '@components/Navigation';
import MehndiBorder from '@components/shell/MehndiBorder';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize auth state from localStorage on app load (only once)
  useEffect(() => {
    console.log('[APP] Initializing auth state from localStorage');
    useAuthStore.getState().initializeFromStorage();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-paper text-ink">
        <MehndiBorder edge="top" />
        {isAuthenticated && <Navigation />}

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
              <Route path="/activity" element={<ActivityBoard />} />
              <Route path="/smartthings" element={<SmartHome />} />
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
