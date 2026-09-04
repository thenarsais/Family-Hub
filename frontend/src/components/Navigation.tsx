import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useWeather } from '@hooks/useWeather';
import { useClock, formatClockDate, formatClockTime } from '@hooks/useClock';

/**
 * Top bar (T-00 / FR-151) — always on: brand, live clock + date, outdoor temp,
 * and the profile chip. The chip is the seat of the future profile switcher
 * (T-13/T-14); for now it shows who's signed in and holds Logout.
 */
export default function Navigation() {
  const { user, logout } = useAuth();
  const { weather } = useWeather();
  const navigate = useNavigate();
  const now = useClock();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = (user?.name?.trim()?.[0] ?? '?').toUpperCase();
  const temp = weather?.current?.temp;

  return (
    <nav className="bg-raised border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-16">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl" aria-hidden="true">🪔</span>
            <span className="font-display text-xl font-bold text-accent">Family Hub</span>
          </Link>

          {/* Clock + date */}
          <div className="hidden sm:flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tabular-nums text-ink">
              {formatClockTime(now)}
            </span>
            <span className="text-sm font-medium text-ink-2">{formatClockDate(now)}</span>
          </div>

          {/* Weather */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-2">
            <span aria-hidden="true">{weather?.current?.icon ?? '·'}</span>
            <span className="text-ink font-semibold">
              {typeof temp === 'number' ? `${Math.round(temp)}°` : '—'}
            </span>
            <span>Denver</span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-6 ml-auto">
            <Link
              to="/dashboard"
              className="hidden sm:inline text-ink-2 hover:text-accent transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/activity"
              className="hidden sm:inline text-ink-2 hover:text-accent transition-colors"
            >
              Activity Board
            </Link>
            <Link
              to="/family"
              className="hidden sm:inline text-ink-2 hover:text-accent transition-colors"
            >
              Family
            </Link>

            <div className="flex items-center gap-3 pl-4 sm:border-l border-rule">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-full hover:bg-accent-soft transition-colors px-1 py-0.5"
              >
                <span
                  className="w-8 h-8 rounded-full bg-accent text-white grid place-items-center text-sm font-semibold"
                  aria-hidden="true"
                >
                  {initial}
                </span>
                <span className="text-right leading-tight hidden sm:block">
                  <span className="block text-sm font-medium text-ink">{user?.name}</span>
                  <span className="block text-xs text-ink-3">{user?.email}</span>
                </span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-small">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
