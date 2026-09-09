import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useKioskStore, selectIsKiosk } from '@stores/kioskStore';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const isKiosk = useKioskStore(selectIsKiosk);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // On a shared display the device itself is the credential — no login screen.
  if (!isKiosk && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
