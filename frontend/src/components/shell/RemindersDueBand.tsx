import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check } from 'lucide-react';
import { useReminders } from '@hooks/useReminders';

/**
 * "Due now" surface (T-18). A full-width band, directly under the announcements
 * strip, listing every family reminder whose time has arrived and that nobody
 * has cleared yet. Each row has a Done button — for a recurring reminder that
 * means "done this time" and it rolls to the next occurrence; for a one-off it
 * is hidden. Renders nothing when nothing is due, so it costs no space the rest
 * of the time. Polls on the hook's 60s cadence.
 */
export function RemindersDueBand() {
  const { dueReminders, dismissReminder } = useReminders();
  const [clearing, setClearing] = useState<Set<string>>(new Set());

  if (dueReminders.length === 0) return null;

  const done = (id: string) => {
    setClearing((prev) => new Set(prev).add(id));
    dismissReminder(id).catch(() => {
      // the hook reverts its own state; drop the local pending mark
      setClearing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  };

  return (
    <div className="bg-alert/10 border-b border-rule border-l-4 border-l-alert px-4 sm:px-6 py-2.5">
      <div className="flex items-start gap-3">
        <span className="flex items-center gap-1.5 shrink-0 pt-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-alert">
          <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
          Due now
        </span>

        <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
          {dueReminders.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-ink truncate">{r.title}</span>
              {r.assignee_name && (
                <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-3 border border-rule-2 rounded px-1">
                  {r.assignee_name}
                </span>
              )}
              <button
                type="button"
                onClick={() => done(r.id)}
                disabled={clearing.has(r.id)}
                className="ml-auto shrink-0 flex items-center gap-1 text-xs font-semibold text-leaf hover:opacity-80 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Done
              </button>
            </li>
          ))}
        </ul>

        <Link
          to="/reminders"
          className="shrink-0 self-start pt-0.5 text-xs font-semibold text-ink-3 hover:text-accent"
        >
          All
        </Link>
      </div>
    </div>
  );
}

export default RemindersDueBand;
