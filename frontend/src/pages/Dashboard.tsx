import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Zap, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { WeekCalendar } from '../components/Calendar';
import { AnnouncementsBand } from '../components/shell/AnnouncementsBand';
import { FactOfDayBand } from '../components/shell/FactOfDayBand';
import { DashboardCard } from '../components/shell/DashboardCard';
import { useAuth } from '../hooks/useAuth';
import { useReminders } from '../hooks/useReminders';
import { useEnergy } from '../hooks/useEnergy';
import { useFamily } from '../hooks/useFamily';
import { useActivityLog } from '../hooks/useActivityLog';
import { useShoppingList } from '../hooks/useShoppingList';
import { useCardOrder } from '../hooks/useCardOrder';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The dashboard's reorderable cards, in their out-of-the-box order. The first
 *  few sit in the column beside the calendar; the rest flow into a row below
 *  it — the calendar keeps its hero size either way (FR-131). */
const CARD_IDS = ['reminders', 'shopping', 'activity', 'family', 'energy'] as const;
const COLUMN_COUNT = 3;

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
      </div>
    );
  }
  if (isEmpty) {
    return <p className="text-ink-3 text-sm text-center py-4">{emptyText}</p>;
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

  const { upcomingReminders, loading: remindersLoading } = useReminders();
  const { currentMonth, goals, loading: energyLoading } = useEnergy();
  const { family, members, loading: familyLoading } = useFamily();
  const { activity, loading: activityLoading } = useActivityLog();
  const { items: shoppingItems, loading: shoppingLoading } = useShoppingList();

  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleCard = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const { sort, reorder, move } = useCardOrder(user?.id ?? 'default', CARD_IDS as unknown as string[]);

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

  const cardProps = (id: string) => ({
    id,
    expanded: expandedId === id,
    onToggle: toggleCard,
    onReorder: reorder,
    onMove: move,
  });

  const CARDS: Record<string, ReactNode> = {
    reminders: (
      <DashboardCard
        {...cardProps('reminders')}
        title="Reminders"
        icon={<Calendar className="w-5 h-5 text-accent" aria-hidden="true" />}
        count={remindersLoading ? undefined : upcomingReminders.length}
        footer={
          <button onClick={() => navigate('/reminders')} className="btn btn-secondary w-full text-xs">
            View All
          </button>
        }
      >
        <div className="space-y-2">
          <WidgetBody
            loading={remindersLoading}
            isEmpty={upcomingReminders.length === 0}
            emptyText="No upcoming reminders"
          >
            {upcomingReminders.map((reminder) => (
              <div key={reminder.id} className="p-3 rounded-lg bg-paper border border-rule">
                <p className="font-medium text-sm text-ink">{reminder.title}</p>
                <p className="text-xs text-ink-3">
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
      </DashboardCard>
    ),

    shopping: (
      <DashboardCard
        {...cardProps('shopping')}
        title="Shopping List"
        icon={<ShoppingCart className="w-5 h-5 text-leaf" aria-hidden="true" />}
        count={shoppingLoading ? undefined : `${pendingShopping} left`}
        footer={
          <button
            onClick={() => navigate('/shopping-list')}
            className="btn btn-secondary w-full text-xs"
          >
            View Full List
          </button>
        }
      >
        <WidgetBody
          loading={shoppingLoading}
          isEmpty={shoppingItems.length === 0}
          emptyText="No items on the list"
        >
          <p className="text-sm text-ink-2 mb-3">
            {pendingShopping} of {shoppingItems.length} item{shoppingItems.length === 1 ? '' : 's'}{' '}
            still needed
          </p>
          <ul className="space-y-1 text-sm">
            {shoppingItems.map((item) => (
              <li key={item.id} className={item.completed ? 'line-through text-ink-3' : 'text-ink'}>
                {item.quantity} {item.unit} {item.name}
              </li>
            ))}
          </ul>
        </WidgetBody>
      </DashboardCard>
    ),

    activity: (
      <DashboardCard
        {...cardProps('activity')}
        title="Recent Activity"
        icon={<TrendingUp className="w-5 h-5 text-leaf" aria-hidden="true" />}
        count={activityLoading ? undefined : activity.length}
        footer={
          <button onClick={() => navigate('/activity')} className="btn btn-secondary w-full text-xs">
            View All Activity
          </button>
        }
      >
        <WidgetBody
          loading={activityLoading}
          isEmpty={activity.length === 0}
          emptyText="No activity yet"
        >
          <div className="space-y-3">
            {activity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 bg-paper border border-rule rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-ink">{entry.action}</p>
                  <p className="text-xs text-ink-3">
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                {(entry.points_earned ?? 0) > 0 && (
                  <span className="text-sm font-bold text-leaf">+{entry.points_earned}</span>
                )}
              </div>
            ))}
          </div>
        </WidgetBody>
      </DashboardCard>
    ),

    family: (
      <DashboardCard
        {...cardProps('family')}
        title="Family"
        icon={<Users className="w-5 h-5 text-accent" aria-hidden="true" />}
        count={familyLoading ? undefined : members.length}
        footer={
          <button onClick={() => navigate('/family')} className="btn btn-secondary w-full text-xs">
            Manage Family
          </button>
        }
      >
        <WidgetBody loading={familyLoading} isEmpty={!family} emptyText="No family data available">
          <div>
            <p className="font-semibold text-ink">{family?.name}</p>
            {family?.description && <p className="text-sm text-ink-2">{family.description}</p>}
            <p className="text-sm text-ink-3 mt-2">
              {members.length} member{members.length === 1 ? '' : 's'}
            </p>
            {members.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {members.map((member) => (
                  <li key={member.id} className="flex justify-between">
                    <span className="text-ink">{member.user_id}</span>
                    <span className="text-ink-3 capitalize">{member.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </WidgetBody>
      </DashboardCard>
    ),

    energy: (
      <DashboardCard
        {...cardProps('energy')}
        title="Energy Usage"
        icon={<Zap className="w-5 h-5 text-haldi" aria-hidden="true" />}
        footer={
          <button onClick={() => navigate('/energy')} className="btn btn-secondary w-full text-xs">
            View Details
          </button>
        }
      >
        <WidgetBody loading={energyLoading} isEmpty={false} emptyText="">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-ink">This Month</span>
              <span className="text-lg font-bold text-haldi">{currentMonth.toLocaleString()} kWh</span>
            </div>
            <div className="w-full bg-paper border border-rule rounded-full h-3">
              <div
                className="bg-haldi h-3 rounded-full transition-all"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
            {activeGoal ? (
              <p className="text-xs text-ink-3 mt-2">
                {goalProgress}% of the {activeGoal.goal_type} goal ({activeGoal.target_kwh ?? '—'}{' '}
                kWh)
              </p>
            ) : (
              <p className="text-xs text-ink-3 mt-2">No active goal set</p>
            )}
          </div>
        </WidgetBody>
      </DashboardCard>
    ),
  };

  const ordered = sort(
    CARD_IDS.map((id) => ({ id })),
    (c) => c.id,
  ).map((c) => c.id);
  const columnCards = ordered.slice(0, COLUMN_COUNT);
  const belowCards = ordered.slice(COLUMN_COUNT);

  return (
    <main>
      <AnnouncementsBand canPost={canManage} familyId={family?.id} />
      <FactOfDayBand canShuffle={canManage} />

      <div className="container py-6 space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold text-ink">Welcome, {user?.name}!</h1>
          <p className="text-ink-2 text-sm mt-1">Here's what's going on at home</p>
        </header>

        {/* Hero row: calendar pinned large, cards in the column beside it */}
        <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] lg:items-start">
          <div className="lg:sticky lg:top-4">
            <WeekCalendar />
          </div>
          <div className="space-y-4">
            {columnCards.map((id) => (
              <div key={id}>{CARDS[id]}</div>
            ))}
          </div>
        </div>

        {/* Derived stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-accent-soft border-accent/30">
            <p className="text-ink-2 text-sm font-medium">Points This Week</p>
            <p className="font-display text-3xl font-bold text-accent-strong mt-1">
              {activityLoading ? '—' : pointsThisWeek}
            </p>
          </div>
          <div className="card">
            <p className="text-ink-2 text-sm font-medium">Activity Streak</p>
            <p className="font-display text-3xl font-bold text-leaf mt-1">
              {activityLoading ? '—' : `${streak} ${streak === 1 ? 'day' : 'days'}`}
            </p>
          </div>
          <div className="card">
            <p className="text-ink-2 text-sm font-medium">Reminders Due Soon</p>
            <p className="font-display text-3xl font-bold text-haldi mt-1">
              {remindersLoading ? '—' : upcomingReminders.length}
            </p>
          </div>
        </div>

        {/* Overflow: cards that don't fit the column flow below the calendar */}
        {belowCards.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {belowCards.map((id) => (
              <div key={id}>{CARDS[id]}</div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-display text-xl font-bold mb-4 text-ink">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/announcements')}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              Announcements
            </button>
            <button
              onClick={() => navigate('/reminders')}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Reminders
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Calendar
            </button>
            <button
              onClick={() => navigate('/energy')}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              Energy
            </button>
            <button
              onClick={() => navigate('/smartthings')}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              Smart Home
            </button>
            <button
              onClick={() => navigate('/family')}
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              Family
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
