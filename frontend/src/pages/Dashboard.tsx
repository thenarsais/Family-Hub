import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Zap, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { WeekCalendar } from '../components/Calendar';
import { useAuth } from '../hooks/useAuth';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useReminders } from '../hooks/useReminders';
import { useEnergy } from '../hooks/useEnergy';
import { useFamily } from '../hooks/useFamily';
import { useActivityLog } from '../hooks/useActivityLog';
import { useShoppingList } from '../hooks/useShoppingList';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks loading / empty / content for a widget body so the page can render
 *  immediately and each widget fills in as its hook resolves. */
function WidgetBody({
  loading,
  isEmpty,
  emptyText,
  children,
}: {
  loading: boolean;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="py-6 flex justify-center" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (isEmpty) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">{emptyText}</p>;
  }
  return <>{children}</>;
}

function toDayKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Consecutive days (ending today, or yesterday if nothing is logged yet today)
 *  that have at least one activity entry. Uses the same UTC day-key as
 *  `toDayKey` throughout so the two never disagree across a timezone boundary. */
function activityStreak(days: Array<string | null | undefined>, nowMs: number): number {
  const keys = new Set(days.map(toDayKey).filter((k): k is string => k !== null));
  if (keys.size === 0) return 0;

  const keyFor = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  let cursor = nowMs;
  if (!keys.has(keyFor(cursor))) {
    cursor -= DAY_MS;
    if (!keys.has(keyFor(cursor))) return 0;
  }

  let streak = 0;
  while (keys.has(keyFor(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { upcomingReminders, loading: remindersLoading } = useReminders();
  const { currentMonth, goals, loading: energyLoading } = useEnergy();
  const { family, members, loading: familyLoading } = useFamily();
  const { activity, loading: activityLoading } = useActivityLog();
  const { items: shoppingItems, loading: shoppingLoading } = useShoppingList();

  // "This week" / streak are relative to load time — pin it once at mount so
  // the numbers don't drift on unrelated re-renders.
  const [mountedAt] = useState(() => Date.now());
  const { pointsThisWeek, streak } = useMemo(() => {
    const points = activity
      .filter((e) => {
        const t = e.created_at ? new Date(e.created_at).getTime() : NaN;
        return !Number.isNaN(t) && mountedAt - t <= 7 * DAY_MS;
      })
      .reduce((sum, e) => sum + (e.points_earned ?? 0), 0);
    return {
      pointsThisWeek: points,
      streak: activityStreak(activity.map((e) => e.created_at), mountedAt),
    };
  }, [activity, mountedAt]);

  const activeGoal = goals.find((g) => g.status === 'active') ?? goals[0];
  const goalProgress =
    activeGoal && activeGoal.target_kwh
      ? Math.min(100, Math.round((currentMonth / activeGoal.target_kwh) * 100))
      : 0;
  const pendingShopping = shoppingItems.filter((i) => !i.completed).length;

  return (
    <main className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your activity overview</p>
      </div>

      {/* Stats Cards — derived from this week's activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Points This Week</p>
              <p className="text-4xl font-bold text-primary-700 dark:text-primary-300 mt-2">
                {activityLoading ? '—' : pointsThisWeek}
              </p>
            </div>
            <span className="text-5xl" aria-hidden="true">⭐</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Activity Streak</p>
              <p className="text-4xl font-bold text-secondary-700 dark:text-secondary-300 mt-2">
                {activityLoading ? '—' : `${streak} ${streak === 1 ? 'day' : 'days'}`}
              </p>
            </div>
            <span className="text-5xl" aria-hidden="true">🔥</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Reminders Due Soon</p>
              <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
                {remindersLoading ? '—' : upcomingReminders.length}
              </p>
            </div>
            <span className="text-5xl" aria-hidden="true">⏰</span>
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
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Announcements</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <WidgetBody
              loading={announcementsLoading}
              isEmpty={announcements.length === 0}
              emptyText="No announcements yet"
            >
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <p className="font-semibold text-sm">
                    {announcement.is_pinned ? '📌 ' : ''}
                    {announcement.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{announcement.message}</p>
                </div>
              ))}
            </WidgetBody>
          </div>
          <button onClick={() => navigate('/announcements')} className="btn btn-secondary w-full mt-4 text-xs">
            View All
          </button>
        </div>

        {/* Reminders Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Reminders</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <WidgetBody
              loading={remindersLoading}
              isEmpty={upcomingReminders.length === 0}
              emptyText="No upcoming reminders"
            >
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="p-3 bg-orange-50 dark:bg-orange-900/40 rounded-lg">
                  <p className="font-medium text-sm">{reminder.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {new Date(reminder.scheduled_time).toLocaleString([], {
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </WidgetBody>
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
            <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Energy Usage</h2>
          </div>
          <WidgetBody loading={energyLoading} isEmpty={false} emptyText="">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {currentMonth.toLocaleString()} kWh
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${goalProgress}%` }}
                ></div>
              </div>
              {activeGoal ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {goalProgress}% of the {activeGoal.goal_type} goal ({activeGoal.target_kwh ?? '—'} kWh)
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No active goal set</p>
              )}
            </div>
          </WidgetBody>
          <button onClick={() => navigate('/energy')} className="btn btn-secondary w-full mt-4 text-xs">
            View Details
          </button>
        </div>

        {/* Shopping Widget */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Shopping List</h2>
          </div>
          <WidgetBody
            loading={shoppingLoading}
            isEmpty={shoppingItems.length === 0}
            emptyText="No items on the list"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {pendingShopping} of {shoppingItems.length} item{shoppingItems.length === 1 ? '' : 's'} still needed
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
              {shoppingItems.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className={item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}
                >
                  {item.quantity} {item.unit} {item.name}
                </li>
              ))}
            </ul>
          </WidgetBody>
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
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Family</h2>
          </div>
          <WidgetBody loading={familyLoading} isEmpty={!family} emptyText="No family data available">
            <div>
              <p className="font-semibold">{family?.name}</p>
              {family?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{family.description}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {members.length} member{members.length === 1 ? '' : 's'}
              </p>
              {members.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-y-auto">
                  {members.map((member) => (
                    <li key={member.id} className="flex justify-between">
                      <span>{member.user_id}</span>
                      <span className="text-gray-500 dark:text-gray-400 capitalize">{member.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </WidgetBody>
          <button onClick={() => navigate('/family')} className="btn btn-secondary w-full mt-4 text-xs">
            Manage Family
          </button>
        </div>

        {/* Activity Widget */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <WidgetBody loading={activityLoading} isEmpty={activity.length === 0} emptyText="No activity yet">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  {(entry.points_earned ?? 0) > 0 && (
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">+{entry.points_earned}</span>
                  )}
                </div>
              ))}
            </div>
          </WidgetBody>
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
            <Bell className="w-4 h-4" aria-hidden="true" />
            Announcements
          </button>
          <button onClick={() => navigate('/reminders')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Reminders
          </button>
          <button onClick={() => navigate('/calendar')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Calendar
          </button>
          <button onClick={() => navigate('/energy')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Energy
          </button>
          <button onClick={() => navigate('/smartthings')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Users className="w-4 h-4" aria-hidden="true" />
            Smart Home
          </button>
          <button onClick={() => navigate('/family')} className="btn btn-secondary flex items-center justify-center gap-2">
            <Users className="w-4 h-4" aria-hidden="true" />
            Family
          </button>
        </div>
      </div>
    </main>
  );
}
