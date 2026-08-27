import { useState, useMemo, type FormEvent, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export interface EventFormValues {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  timeZone: string;
  attendees: string[];
  sendInvites: boolean;
}

export interface EventFormInitial {
  google_event_id?: string;
  summary?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  attendees?: string[];
}

interface EventFormProps {
  mode: 'create' | 'edit';
  initial?: EventFormInitial;
  /** Pre-fills the date in create mode when a day cell's "+" was used. */
  initialDate?: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EventForm({ mode, initial, initialDate, onSubmit, onClose }: EventFormProps) {
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [startDate, setStartDate] = useState(initial?.startDate ?? initialDate ?? todayKey());
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [endTime, setEndTime] = useState(initial?.endTime ?? '');
  const [attendees, setAttendees] = useState<string[]>(initial?.attendees ?? []);
  const [attendeeDraft, setAttendeeDraft] = useState('');
  const [sendInvites, setSendInvites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZone = useMemo(() => browserTimeZone(), []);

  const commitAttendee = () => {
    const raw = attendeeDraft.trim().replace(/,$/, '').trim();
    if (!raw) return;
    if (!EMAIL_RE.test(raw)) {
      setError(`"${raw}" is not a valid email address`);
      return;
    }
    if (!attendees.includes(raw)) setAttendees((prev) => [...prev, raw]);
    setAttendeeDraft('');
    setError(null);
  };

  const onAttendeeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitAttendee();
    } else if (e.key === 'Backspace' && !attendeeDraft && attendees.length) {
      setAttendees((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!summary.trim()) {
      setError('Give the event a title.');
      return;
    }
    if (!allDay && !/^\d{2}:\d{2}$/.test(startTime)) {
      setError('Pick a start time, or switch to all-day.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('The end date is before the start date.');
      return;
    }

    // An email left in the draft box should count, not be silently dropped.
    let finalAttendees = attendees;
    const pending = attendeeDraft.trim().replace(/,$/, '').trim();
    if (pending) {
      if (!EMAIL_RE.test(pending)) {
        setError(`"${pending}" is not a valid email address`);
        return;
      }
      finalAttendees = attendees.includes(pending) ? attendees : [...attendees, pending];
    }

    setSubmitting(true);
    try {
      await onSubmit({
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        allDay,
        startDate,
        startTime: allDay ? undefined : startTime,
        endDate: endDate || undefined,
        endTime: allDay || !endTime ? undefined : endTime,
        timeZone,
        attendees: finalAttendees,
        sendInvites,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {mode === 'edit' ? 'Edit event' : 'New event'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label" htmlFor="event-title">Title</label>
            <input
              id="event-title"
              className="input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="event-start-date">Start date</label>
              <input
                id="event-start-date"
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="label" htmlFor="event-start-time">Start time</label>
                <input
                  id="event-start-time"
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="event-end-date">
                End date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="event-end-date"
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {!allDay && (
              <div>
                <label className="label" htmlFor="event-end-time">
                  End time <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="event-end-time"
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="label" htmlFor="event-location">Location</label>
            <input
              id="event-location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="event-description">Description</label>
            <textarea
              id="event-description"
              className="input min-h-[72px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="event-attendees">Attendees</label>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attendees.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-full px-2 py-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setAttendees((prev) => prev.filter((a) => a !== email))}
                      className="hover:text-red-600"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              id="event-attendees"
              type="email"
              className="input"
              placeholder="name@example.com, then Enter"
              value={attendeeDraft}
              onChange={(e) => setAttendeeDraft(e.target.value)}
              onKeyDown={onAttendeeKeyDown}
              onBlur={commitAttendee}
            />
          </div>

          {attendees.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={sendInvites}
                onChange={(e) => setSendInvites(e.target.checked)}
              />
              Send invitation emails
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 rounded p-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
