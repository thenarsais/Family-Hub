import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useAnnouncements,
  useReminders,
  useActivityLog,
  useCalendar,
  useFamily,
  useEnergy,
} from '../hooks';
import { Wifi, BookOpen, CheckCircle, TrendingUp, Bell, Calendar, Zap, Users } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase 2 Features: Real Data from APIs
  const { announcements, loading: annLoading } = useAnnouncements();
  const { upcomingReminders, loading: remLoading } = useReminders();
  const { activity, loading: actLoading } = useActivityLog();
  const { upcomingEvents, loading: calLoading, googleConnected, connectGoogle } = useCalendar();
  const { family, members, loading: famLoading } = useFamily();
  const { currentMonth, goals, loading: enerLoading } = useEnergy();

  // Phase 1 Features: Keep existing API calls
  const [userPoints, setUserPoints] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          // TODO: Update to use Phase 1 hook when available
          const pointsData = await fetch(`/api/points/user/${user.id}`).then((r) => r.json());
          const badgesData = await fetch(`/api/badges/user/${user.id}`).then((r) => r.json());
          setUserPoints(pointsData.data?.total_points || 0);
          setTotalBadges(badgesData.data?.length || 0);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const pageLoading = isLoading || annLoading || remLoading || actLoading || calLoading || famLoading || enerLoading;

  if (isLoading && pageLoading) {
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
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">Here's your activity overview</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Points</p>
              <p className="text-4xl font-bold text-primary-600 mt-2">{userPoints}</p>
            </div>
            <span className="text-5xl">⭐</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Badges Earned</p>
              <p className="text-4xl font-bold text-secondary-600 mt-2">{totalBadges}</p>
            </div>
            <span className="text-5xl">🏆</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Streak</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">7 days</p>
            </div>
            <span className="text-5xl">🔥</span>
          </div>
        </div>
      </div>

      {/* Phase 2 Features: Announcements & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Announcements Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Announcements</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {announcements && announcements.length > 0 ? (
              announcements.slice(0, 5).map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    announcement.is_pinned
                      ? 'bg-yellow-50 border-l-4 border-yellow-400'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{announcement.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{announcement.message}</p>
                    </div>
                    {announcement.is_pinned && <span className="text-lg">📌</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No announcements yet</p>
            )}
          </div>
          <button
            onClick={() => navigate('/announcements')}
            className="btn btn-secondary w-full mt-4 text-xs"
          >
            View All
          </button>
        </div>

        {/* Upcoming Reminders Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Reminders</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {upcomingReminders && upcomingReminders.length > 0 ? (
              upcomingReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(reminder.scheduled_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-xs bg-orange-200 px-2 py-1 rounded">
                      {reminder.reminder_type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming reminders</p>
            )}
          </div>
          <button
            onClick={() => navigate('/reminders')}
            className="btn btn-secondary w-full mt-4 text-xs"
          >
            View All
          </button>
        </div>
      </div>

      {/* Energy & Calendar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Energy Usage Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold">Energy Usage</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-lg font-bold text-yellow-600">{currentMonth.toFixed(1)} kWh</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                  style={{
                    width: `${Math.min((currentMonth / (goals[0]?.target_kwh || 500)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              {goals.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Goal: {goals[0].target_kwh} kWh
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/energy')}
            className="btn btn-secondary w-full mt-4 text-xs"
          >
            View Details
          </button>
        </div>

        {/* Upcoming Events Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
            </div>
            {googleConnected && <span className="text-xs bg-green-200 px-2 py-1 rounded">Google Connected</span>}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className={`p-3 rounded-lg ${event.source === 'google' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-purple-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.event_title || event.summary}</p>
                      <p className="text-xs text-gray-600">
                        {event.event_date || event.start?.dateTime || event.start?.date}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {event.event_type && (
                        <span className="text-xs bg-purple-200 px-2 py-1 rounded">
                          {event.event_type}
                        </span>
                      )}
                      {event.source === 'google' && (
                        <span className="text-xs bg-blue-200 px-2 py-1 rounded">Google</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming events</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {!googleConnected && (
              <button
                onClick={() => connectGoogle().catch((err) => console.error('Failed to connect Google:', err))}
                className="btn btn-primary flex-1 text-xs"
              >
                Connect Google Calendar
              </button>
            )}
            <button
              onClick={() => navigate('/calendar')}
              className={`btn btn-secondary ${!googleConnected ? 'flex-1' : 'w-full'} text-xs`}
            >
              View Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Family & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Family Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Family</h2>
          </div>
          <div className="space-y-2">
            {family && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold">{family.name}</span> • {members.length} members
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members && members.length > 0 ? (
                    members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">{member.role}</span>
                        <span className="text-xs bg-green-200 px-2 py-1 rounded capitalize">
                          {member.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">No family members yet</p>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/family')}
            className="btn btn-secondary w-full mt-4 text-xs"
          >
            Manage Family
          </button>
        </div>

        {/* Recent Activity Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activity && activity.length > 0 ? (
              activity.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {entry.points_earned > 0 && (
                    <span className="text-sm font-bold text-green-600">+{entry.points_earned}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
            )}
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="btn btn-secondary w-full mt-4 text-xs"
          >
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/announcements')}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Announcements
          </button>
          <button
            onClick={() => navigate('/reminders')}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Reminders
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => navigate('/energy')}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Energy
          </button>
          <button
            onClick={() => navigate('/smartthings')}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            Smart Home
          </button>
          <button
            onClick={() => navigate('/family')}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Family
          </button>
        </div>
      </div>
    </div>
  );
}
