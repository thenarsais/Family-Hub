import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
            <span className="text-xl font-bold text-primary-600">Family Hub</span>
          </Link>

          {/* Menu */}
          <div className="flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/activity"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Activity Board
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-4 pl-8 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-small"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
