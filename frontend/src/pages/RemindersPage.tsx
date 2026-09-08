import { useMemo, useState, type FormEvent } from 'react';
import { Repeat, Check, Pencil, Trash2, RotateCcw, Bell } from 'lucide-react';
import { useReminders, type NewReminder } from '@hooks/useReminders';
import { useFamily } from '@hooks/useFamily';
import { useAuth } from '@hooks/useAuth';
import type { components } from '@/types/api-generated';

type Reminder = components['schemas']['Reminder'];
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
];

/** ISO instant -> value for an <input type="datetime-local"> in local time. */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function whenLabel(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  // ---- create form ----
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('once');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState<string>(user?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setWhen('');
    setRecurrence('once');
    setEndDate('');
    setAssignee(user?.id ?? '');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const iso = localInputToIso(when);
    if (!t || !iso || busy) {
      setFormErr(!t ? 'Give the reminder a title.' : 'Pick a date and time.');
      return;
    }
    setBusy(true);
    setFormErr(null);
    const payload: NewReminder = {
      title: t,
      description: description.trim() || undefined,
      scheduled_time: iso,
      recurrence,
      recurrence_end_date: recurrence !== 'once' && endDate ? endDate : null,
      assignee_user_id: assignee || undefined,
    };
    try {
      await createReminder(payload);
      resetForm();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Could not create the reminder.');
    } finally {
      setBusy(false);
    }
  };

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

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">New reminder</h2>
        <div>
          <label className="label" htmlFor="r-title">
            Title
          </label>
          <input
            id="r-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="label" htmlFor="r-desc">
            Details <span className="text-ink-3 font-normal">(optional)</span>
          </label>
          <input
            id="r-desc"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="label" htmlFor="r-when">
              When
            </label>
            <input
              id="r-when"
              type="datetime-local"
              className="input w-auto"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="r-recurrence">
              Repeat
            </label>
            <select
              id="r-recurrence"
              className="input w-auto"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            >
              {RECURRENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {recurrence !== 'once' && (
            <div>
              <label className="label" htmlFor="r-end">
                Until <span className="text-ink-3 font-normal">(optional)</span>
              </label>
              <input
                id="r-end"
                type="date"
                className="input w-auto"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="r-assignee">
              For
            </label>
            <select
              id="r-assignee"
              className="input w-auto"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name ?? 'Family member'}
                  {m.user_id === user?.id ? ' (me)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        {formErr && <p className="text-sm text-alert bg-alert/10 rounded p-2">{formErr}</p>}
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          {busy ? 'Adding…' : 'Add reminder'}
        </button>
      </form>

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
