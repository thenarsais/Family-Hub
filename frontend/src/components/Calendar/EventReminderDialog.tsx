import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  CALENDAR_EVENT_ITEM_TYPE,
  type NewReminder,
} from '@hooks/useReminders';
import type { components } from '@/types/api-generated';

type Reminder = components['schemas']['Reminder'];
type Cadence = 'daily' | 'weekly' | 'monthly';

interface LeadOption {
  label: string;
  minutes: number;
}

const TIMED_OPTIONS: LeadOption[] = [
  { label: 'At the event', minutes: 0 },
  { label: '10 minutes before', minutes: 10 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '1 day before', minutes: 1440 },
  { label: '2 days before', minutes: 2880 },
];

const ALLDAY_OPTIONS: LeadOption[] = [
  { label: 'Morning of (9am)', minutes: 0 },
  { label: '1 day before (9am)', minutes: 1440 },
  { label: '2 days before (9am)', minutes: 2880 },
  { label: '1 week before (9am)', minutes: 10080 },
];

const CADENCE_LABEL: Record<Cadence, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};

function labelForMinutes(min: number): string {
  if (min === 0) return 'At the event';
  if (min % 1440 === 0) {
    const d = min / 1440;
    return `${d} day${d === 1 ? '' : 's'} before`;
  }
  if (min % 60 === 0) {
    const h = min / 60;
    return `${h} hour${h === 1 ? '' : 's'} before`;
  }
  return `${min} minutes before`;
}

interface Props {
  event: { id: string; title: string; recurringEventId?: string | null };
  /** Resolved event start (all-day events pass 9am local). */
  startAt: Date;
  allDay: boolean;
  /** Inferred cadence for a recurring event, else null. */
  seriesCadence: Cadence | null;
  /** Reminders already linked to this event id or its series id. */
  existing: Reminder[];
  onCreate: (payload: NewReminder) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onClose: () => void;
}

export default function EventReminderDialog({
  event,
  startAt,
  allDay,
  seriesCadence,
  existing,
  onCreate,
  onDelete,
  onClose,
}: Props) {
  const seriesRelId = event.recurringEventId ?? event.id;
  const isRecurring = !!event.recurringEventId && !!seriesCadence;

  const [scope, setScope] = useState<'this' | 'series'>('this');
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(existing.map((r) => r.remind_before_minutes ?? 0)),
  );
  const [customValue, setCustomValue] = useState(15);
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [customMinutes, setCustomMinutes] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const presets = allDay ? ALLDAY_OPTIONS : TIMED_OPTIONS;

  // Any existing lead time that isn't one of the presets shows as an extra row.
  const extraExisting = useMemo(() => {
    const presetMins = new Set(presets.map((o) => o.minutes));
    return [...new Set(existing.map((r) => r.remind_before_minutes ?? 0))].filter(
      (m) => !presetMins.has(m) && !customMinutes.includes(m),
    );
  }, [existing, presets, customMinutes]);

  const rows: LeadOption[] = [
    ...presets,
    ...extraExisting.map((m) => ({ label: labelForMinutes(m), minutes: m })),
    ...customMinutes.map((m) => ({ label: labelForMinutes(m), minutes: m })),
  ];

  const toggle = (min: number) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(min)) next.delete(min);
      else next.add(min);
      return next;
    });

  const addCustom = () => {
    const per = customUnit === 'minutes' ? 1 : customUnit === 'hours' ? 60 : 1440;
    const mins = Math.max(0, Math.round(customValue)) * per;
    if (rows.some((r) => r.minutes === mins)) {
      setChecked((c) => new Set(c).add(mins));
      return;
    }
    setCustomMinutes((c) => [...c, mins]);
    setChecked((c) => new Set(c).add(mins));
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const wantSeries = scope === 'series' && isRecurring;
    const wantRelId = wantSeries ? seriesRelId : event.id;

    // Keep an existing row iff its lead time is still checked and its scope matches.
    const keep = new Map<number, Reminder>();
    for (const r of existing) {
      const m = r.remind_before_minutes ?? 0;
      if (checked.has(m) && r.related_item_id === wantRelId && !keep.has(m)) keep.set(m, r);
    }
    try {
      for (const r of existing) {
        if (keep.get(r.remind_before_minutes ?? 0)?.id !== r.id) await onDelete(r.id);
      }
      for (const min of checked) {
        if (keep.has(min)) continue;
        const when = new Date(startAt.getTime() - min * 60_000);
        await onCreate({
          title: event.title,
          scheduled_time: when.toISOString(),
          reminder_type: 'event',
          related_item_id: wantRelId,
          related_item_type: CALENDAR_EVENT_ITEM_TYPE,
          remind_before_minutes: min,
          recurrence: wantSeries ? (seriesCadence as Cadence) : 'once',
        });
      }
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save the reminders.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Reminders for ${event.title}`}
      onClick={onClose}
    >
      <div
        className="bg-raised border border-rule rounded-card p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-lg font-bold text-ink">Remind me</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-3 hover:text-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-ink-2 mb-3 truncate">{event.title}</p>

        {isRecurring && (
          <fieldset className="mb-3 border border-rule rounded p-2">
            <legend className="text-xs text-ink-3 px-1">This repeats</legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="reminder-scope"
                checked={scope === 'this'}
                onChange={() => setScope('this')}
              />
              This event only
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="reminder-scope"
                checked={scope === 'series'}
                onChange={() => setScope('series')}
              />
              Every event in the series
            </label>
            {scope === 'series' && seriesCadence && (
              <p className="text-xs text-ink-3 mt-1">
                Repeats ~{CADENCE_LABEL[seriesCadence]} — adjust on the Reminders page.
              </p>
            )}
          </fieldset>
        )}

        <div className="space-y-1.5">
          {rows.map((o) => (
            <label key={o.minutes} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={checked.has(o.minutes)}
                onChange={() => toggle(o.minutes)}
              />
              {o.label}
            </label>
          ))}
        </div>

        {!allDay && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="number"
              min={1}
              value={customValue}
              onChange={(e) => setCustomValue(Number(e.target.value) || 1)}
              aria-label="Custom lead time value"
              className="input py-1 w-16"
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as typeof customUnit)}
              aria-label="Custom lead time unit"
              className="input py-1 w-auto"
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
            <span className="text-ink-3">before</span>
            <button type="button" onClick={addCustom} className="btn btn-secondary btn-small ml-auto">
              Add
            </button>
          </div>
        )}

        {err && <p className="text-sm text-alert bg-alert/10 rounded p-2 mt-3">{err}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
