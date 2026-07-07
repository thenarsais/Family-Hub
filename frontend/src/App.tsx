import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

// Pages (to be created)
import Dashboard from '@pages/Dashboard';
import Login from '@pages/Login';
import Signup from '@pages/Signup';
import ActivityBoard from '@pages/ActivityBoard';
import NotFound from '@pages/NotFound';

// Components (to be created)
import ProtectedRoute from '@components/ProtectedRoute';
import Navigation from '@components/Navigation';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navigation />}

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
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
