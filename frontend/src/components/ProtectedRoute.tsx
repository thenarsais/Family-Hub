import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, token, user } = useAuth();

  console.log('[PROTECTED_ROUTE] Checking auth:', {
    isAuthenticated,
    isLoading,
    hasToken: !!token,
    hasUser: !!user,
  });

  if (isLoading) {
    console.log('[PROTECTED_ROUTE] Still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.error('[PROTECTED_ROUTE] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[PROTECTED_ROUTE] Authenticated, rendering Outlet');
  return <Outlet />;
}
