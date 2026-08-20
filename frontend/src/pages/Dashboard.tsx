import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import {
  useAnnouncements,
  useReminders,
  useActivityLog,
  useCalendar,
  useFamily,
  useEnergy,
  useWeather,
  useShoppingList,
  useMealPlanner,
  useNightMode,
} from '../hooks';
import { Wifi, BookOpen, CheckCircle, TrendingUp, Bell, Calendar, Zap, Users, Cloud, Droplets, Wind, ShoppingCart, Check, UtensilsCrossed, Moon, Sun } from 'lucide-react';
import { WeekCalendar } from '../components/Calendar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase 2 Features: Real Data from APIs
  // TODO: Re-enable when backend endpoints are implemented
  const announcements = [];
  const annLoading = false;
  const upcomingReminders = [];
  const remLoading = false;
  const activity = [];
  const actLoading = false;
  const upcomingEvents = [];
  const calLoading = false;
  const googleConnected = false;
  const connectGoogle = () => {};
  const family = null;
  const members = [];
  const famLoading = false;
  const currentMonth = 0;
  const goals = [];
  const enerLoading = false;
  const weather = null;
  const weatherLoading = false;
  const shoppingItems = [];
  const shoppingLoading = false;
  const meals = [];
  const mealsLoading = false;
  const { isNightMode, toggleNightMode } = useNightMode();

  // Phase 1 Features: Keep existing API calls
  const [userPoints, setUserPoints] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id) {
          // Use apiClient to include auth headers
          const pointsData = await apiClient.getUserPoints(user.id);
          const badgesData = await apiClient.getUserBadges(user.id);
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

  const pageLoading = isLoading || annLoading || remLoading || actLoading || calLoading || famLoading || enerLoading || weatherLoading || shoppingLoading || mealsLoading;

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's your activity overview</p>
        </div>
        <button
          onClick={toggleNightMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={isNightMode ? 'Disable night mode' : 'Enable night mode'}
        >
          {isNightMode ? (
            <Sun className="w-6 h-6 text-yellow-500" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Family Announcement Banner */}
      {announcements && announcements.length > 0 && announcements[0]?.is_pinned && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📢</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-800">{announcements[0].title}</h3>
              <p className="text-sm text-yellow-800 mt-1">{announcements[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Calendar Widget - Primary Focus */}
      <WeekCalendar />

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

      {/* Weather Card */}
      {weather && (
        <div className="card mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weather</h2>
            </div>
            <span className="text-4xl">{weather.current.icon}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Current</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{weather.current.temp}°F</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{weather.current.condition}</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{weather.current.humidity}%</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Wind</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{weather.current.windSpeed} mph</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">5-Day Forecast</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {weather.forecast.map((day) => (
                <div key={day.day} className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{day.day}</p>
                  <p className="text-2xl my-2">{day.icon}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{day.high}° / {day.low}°</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{day.condition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Shopping List Widget */}
      <div className="card mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Shopping List</h2>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {shoppingItems && shoppingItems.length > 0 ? (
            shoppingItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg flex items-start gap-3 ${
                  item.completed
                    ? 'bg-gray-100 dark:bg-gray-700 opacity-60'
                    : 'bg-white dark:bg-gray-700 border-l-4 border-green-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="mt-1 w-4 h-4 text-green-600 rounded"
                />
                <div className="flex-1">
                  <p className={`font-medium text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.quantity} {item.unit} • {item.category} • Added by {item.addedBy}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No items on the list</p>
          )}
        </div>
        <button
          onClick={() => navigate('/shopping-list')}
          className="btn btn-secondary w-full mt-4 text-xs"
        >
          View Full List
        </button>
      </div>

      {/* Meal Planner Widget */}
      <div className="card mb-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900 dark:to-amber-900">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Weekly Meal Plan</h2>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {meals && meals.length > 0 ? (
            meals.slice(0, 7).map((meal) => (
              <div key={meal.day} className="p-3 rounded-lg bg-white dark:bg-gray-700 border-l-4 border-orange-400">
                <p className="font-semibold text-sm text-orange-700 dark:text-orange-400 mb-2">{meal.day}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Breakfast</p>
                    <p className="text-gray-800 dark:text-gray-200">{meal.breakfast}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Lunch</p>
                    <p className="text-gray-800 dark:text-gray-200">{meal.lunch}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Dinner</p>
                    <p className="text-gray-800 dark:text-gray-200">{meal.dinner}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Planned by {meal.plannedBy}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No meal plan yet</p>
          )}
        </div>
        <button
          onClick={() => navigate('/meal-planner')}
          className="btn btn-secondary w-full mt-4 text-xs"
        >
          Edit Meal Plan
        </button>
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
    </div>
  );
}
