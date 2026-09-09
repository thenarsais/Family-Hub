import { useState, type FormEvent } from 'react';
import type { NewReminder } from '@hooks/useReminders';
import { localInputToIso } from '@/utils/reminderTime';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
];

interface Props {
  members: FamilyMember[];
  defaultAssigneeId: string;
  submitLabel?: string;
  onSubmit: (payload: NewReminder) => Promise<unknown>;
  onSuccess?: () => void;
}

/**
 * The "New reminder" form body — no card/heading chrome (the caller wraps it).
 * Used by the /reminders page and the dashboard quick-add modal.
 */
export default function ReminderForm({
  members,
  defaultAssigneeId,
  submitLabel = 'Add reminder',
  onSubmit,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('once');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState<string>(defaultAssigneeId);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setWhen('');
    setRecurrence('once');
    setEndDate('');
    setAssignee(defaultAssigneeId);
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
      await onSubmit(payload);
      reset();
      onSuccess?.();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Could not create the reminder.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
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
                {m.user_id === defaultAssigneeId ? ' (me)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      {formErr && <p className="text-sm text-alert bg-alert/10 rounded p-2">{formErr}</p>}
      <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
        {busy ? 'Adding…' : submitLabel}
      </button>
    </form>
  );
}
