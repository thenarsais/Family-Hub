import { useMemo, useState } from 'react';
import { Repeat, Check, Pencil, Trash2, RotateCcw, Bell } from 'lucide-react';
import { useReminders } from '@hooks/useReminders';
import { useFamily } from '@hooks/useFamily';
import { useAuth } from '@hooks/useAuth';
import ReminderForm, { RECURRENCE_OPTIONS } from '@components/ReminderForm';
import { isoToLocalInput, localInputToIso, whenLabel } from '@/utils/reminderTime';
import type { components } from '@/types/api-generated';

type Reminder = components['schemas']['Reminder'];
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';

const isRecurring = (r?: string | null): boolean =>
  r === 'daily' || r === 'weekly' || r === 'monthly';

export default function RemindersPage() {
  const { user } = useAuth();
  const { members } = useFamily();
  const {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    dismissReminder,
    restoreReminder,
    deleteReminder,
  } = useReminders();

  const memberName = (userId?: string | null) =>
    members.find((m) => m.user_id === userId)?.name ?? null;

  // ---- inline edit ----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editWhen, setEditWhen] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<Recurrence>('once');

  const beginEdit = (r: Reminder) => {
    setEditingId(r.id);
    setEditTitle(r.title ?? '');
    setEditWhen(isoToLocalInput(r.scheduled_time));
    setEditRecurrence((r.recurrence as Recurrence) ?? 'once');
  };

  const saveEdit = async (id: string) => {
    const iso = localInputToIso(editWhen);
    if (!editTitle.trim() || !iso) return;
    try {
      await updateReminder(id, {
        title: editTitle.trim(),
        scheduled_time: iso,
        recurrence: editRecurrence,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save reminder:', err);
    }
  };

  // ---- grouping ----
  const { due, upcoming, dismissed } = useMemo(() => {
    const now = Date.now();
    const active = reminders.filter((r) => !r.is_dismissed);
    return {
      due: active
        .filter((r) => new Date(r.scheduled_time).getTime() <= now)
        .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
      upcoming: active
        .filter((r) => new Date(r.scheduled_time).getTime() > now)
        .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
      dismissed: reminders
        .filter((r) => r.is_dismissed)
        .sort((a, b) => b.scheduled_time.localeCompare(a.scheduled_time)),
    };
  }, [reminders]);

  const confirmDelete = (r: Reminder) => {
    if (window.confirm(`Delete "${r.title}"? This can't be undone.`)) {
      deleteReminder(r.id).catch((err) => console.error('Failed to delete reminder:', err));
    }
  };

  const row = (r: Reminder, section: 'active' | 'dismissed') => (
    <li key={r.id} className="py-3">
      {editingId === r.id ? (
        <div className="space-y-2">
          <input
            className="input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="datetime-local"
              className="input w-auto"
              value={editWhen}
              onChange={(e) => setEditWhen(e.target.value)}
            />
            <select
              className="input w-auto"
              value={editRecurrence}
              onChange={(e) => setEditRecurrence(e.target.value as Recurrence)}
            >
              {RECURRENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-small" onClick={() => saveEdit(r.id)}>
              Save
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-ink">{r.title}</span>
              {isRecurring(r.recurrence) && (
                <span className="badge badge-primary inline-flex items-center gap-1 !px-2 !py-0.5 !text-xs">
                  <Repeat className="w-3 h-3" aria-hidden="true" />
                  {RECURRENCE_OPTIONS.find((o) => o.value === r.recurrence)?.label ?? r.recurrence}
                </span>
              )}
              {memberName(r.user_id) && (
                <span className="text-xs text-ink-3 border border-rule-2 rounded px-1">
                  {memberName(r.user_id)}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-3 mt-0.5">{whenLabel(r.scheduled_time)}</p>
            {r.description && <p className="text-sm text-ink-2 mt-1">{r.description}</p>}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {section === 'active' ? (
              <>
                <button
                  aria-label="Mark done"
                  title={isRecurring(r.recurrence) ? 'Done — roll to next occurrence' : 'Mark done'}
                  className="p-1.5 text-leaf hover:opacity-80"
                  onClick={() =>
                    dismissReminder(r.id).catch((err) =>
                      console.error('Failed to dismiss reminder:', err),
                    )
                  }
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  aria-label="Edit"
                  title="Edit"
                  className="p-1.5 text-ink-3 hover:text-accent"
                  onClick={() => beginEdit(r)}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                aria-label="Restore"
                title="Restore"
                className="p-1.5 text-ink-3 hover:text-accent"
                onClick={() =>
                  restoreReminder(r.id).catch((err) =>
                    console.error('Failed to restore reminder:', err),
                  )
                }
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              aria-label="Delete"
              title="Delete"
              className="p-1.5 text-ink-3 hover:text-alert"
              onClick={() => confirmDelete(r)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );

  const section = (
    heading: string,
    items: Reminder[],
    kind: 'active' | 'dismissed',
    emptyText: string,
  ) => (
    <section className="card">
      <h2 className="font-display text-lg font-bold text-ink mb-3">
        {heading} <span className="text-ink-3 text-sm font-normal">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-3">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-rule">{items.map((r) => row(r, kind))}</ul>
      )}
    </section>
  );

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink flex items-center gap-2">
          <Bell className="w-7 h-7 text-accent" aria-hidden="true" />
          Reminders
        </h1>
        <p className="text-ink-2 text-sm mt-1">
          Anything the family shouldn&apos;t forget. A due reminder shows in the band on the
          dashboard until someone marks it done.
        </p>
      </header>

      <section className="card space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">New reminder</h2>
        <ReminderForm
          members={members}
          defaultAssigneeId={user?.id ?? ''}
          onSubmit={createReminder}
        />
      </section>

      {error && (
        <p className="text-sm text-alert bg-alert/10 rounded p-2">
          Couldn&apos;t load your reminders: {error}
        </p>
      )}

      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : (
        <>
          {section('Due now', due, 'active', 'Nothing due right now.')}
          {section('Upcoming', upcoming, 'active', 'No upcoming reminders.')}
          {section('Done & dismissed', dismissed, 'dismissed', 'Nothing here yet.')}
        </>
      )}
    </main>
  );
}
