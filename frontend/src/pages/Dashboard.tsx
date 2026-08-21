import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Wifi, Bell, Calendar, Zap, Users, ShoppingCart, UtensilsCrossed, TrendingUp, Cloud, Droplets, Wind } from 'lucide-react';
import { WeekCalendar } from '../components/Calendar';

export default function Dashboard() {
  console.log('[DASHBOARD] *** COMPONENT MOUNTING ***');
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for Phase 1 features
  const [userPoints, setUserPoints] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 2 data with defaults
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [activity, setActivity] = useState([]);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);

  console.log('[DASHBOARD] Component authenticated, user:', user?.name);

  useEffect(() => {
    console.log('[DASHBOARD] useEffect running, user.id:', user?.id);
    const loadData = async () => {
      try {
        setIsLoading(true);

        if (user?.id) {
          console.log('[DASHBOARD] Loading user data...');
          // Mock Phase 1 data for now
          setUserPoints(1250);
          setTotalBadges(5);

          // Try to load Phase 2 data, but don't fail if APIs aren't ready
          try {
            // Placeholder for future API calls
            // const announcementsData = await apiClient.getAnnouncements();
            // setAnnouncements(announcementsData);
          } catch (err) {
            console.warn('[DASHBOARD] Phase 2 APIs not ready, using defaults');
          }

          console.log('[DASHBOARD] User data loaded successfully');
        }
      } catch (err) {
        console.error('[DASHBOARD] Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your activity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Total Points</p>
              <p className="text-4xl font-bold text-primary-600 dark:text-primary-300 mt-2">{userPoints}</p>
            </div>
            <span className="text-5xl">⭐</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Badges Earned</p>
              <p className="text-4xl font-bold text-secondary-600 dark:text-secondary-300 mt-2">{totalBadges}</p>
            </div>
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Current Streak</p>
              <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-300 mt-2">7 days</p>
            </div>
            <span className="text-5xl">🔥</span>
          </div>
        </div>
      </div>

      {/* Calendar Widget - Primary Focus */}
      <div className="mb-8">
        <WeekCalendar />
      </div>

      {/* Announcements & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Announcements Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Announcements</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                  <p className="font-semibold text-sm">{announcement.title}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{announcement.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No announcements yet</p>
            )}
          </div>
          <button onClick={() => navigate('/announcements')} className="btn btn-secondary w-full mt-4 text-xs">
            View All
          </button>
        </div>

        {/* Reminders Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Reminders</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {upcomingReminders && upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-sm">{reminder.title}</p>
                  <p className="text-xs text-gray-600">{new Date(reminder.scheduled_time).toLocaleTimeString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming reminders</p>
            )}
          </div>
          <button onClick={() => navigate('/reminders')} className="btn btn-secondary w-full mt-4 text-xs">
            View All
          </button>
        </div>
      </div>

      {/* Energy & Shopping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Energy Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold">Energy Usage</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-lg font-bold text-yellow-600">0 kWh</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/energy')} className="btn btn-secondary w-full mt-4 text-xs">
            View Details
          </button>
        </div>

        {/* Shopping Widget */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Shopping List</h2>
          </div>
          <p className="text-gray-500 text-sm text-center py-4">No items on the list</p>
          <button onClick={() => navigate('/shopping-list')} className="btn btn-secondary w-full mt-4 text-xs">
            View Full List
          </button>
        </div>
      </div>

      {/* Family & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Family Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Family</h2>
          </div>
          <p className="text-gray-500 text-sm text-center py-4">No family data available</p>
          <button onClick={() => navigate('/family')} className="btn btn-secondary w-full mt-4 text-xs">
            Manage Family
          </button>
        </div>

        {/* Activity Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          {activity && activity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</p>
                  </div>
                  {entry.points_earned > 0 && <span className="text-sm font-bold text-green-600">+{entry.points_earned}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
          )}
          <button onClick={() => navigate('/activity')} className="btn btn-secondary w-full mt-4 text-xs">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button onClick={() => navigate('/announcements')} className="btn btn-primary flex items-center justify-center gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </button>
          <button onClick={() => navigate('/reminders')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Reminders
          </button>
          <button onClick={() => navigate('/calendar')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button onClick={() => navigate('/energy')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Energy
          </button>
          <button onClick={() => navigate('/smartthings')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Wifi className="w-4 h-4" />
            Smart Home
          </button>
          <button onClick={() => navigate('/family')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Family
          </button>
        </div>
      </div>
    </main>
  );
}
