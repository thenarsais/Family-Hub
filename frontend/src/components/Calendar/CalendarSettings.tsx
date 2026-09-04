import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useFamily } from '@hooks/useFamily';
import { ALL_FAMILY_COLORS, resolveMemberColor } from '@/data/familyColors';
import type { DismissedEvent } from '@hooks/useCalendar';

interface Props {
  googleConnected: boolean;
  googleEmail: string | null;
  onConnect: () => Promise<string>;
  onDisconnect: () => Promise<void>;
  dismissedEvents: DismissedEvent[];
  eventTitleFor: (id: string) => string | undefined;
  onRestore: (eventId: string, source?: 'google' | 'local', calendarId?: string) => Promise<void>;
  canManage: boolean;
  onClose: () => void;
}

/**
 * Calendar settings panel (T-01): the connected Google account (FR-124),
 * hidden-events restore (FR-122/127), and the per-member calendar colour
 * mapping that feeds the event dots (FR-153).
 */
export function CalendarSettings({
  googleConnected,
  googleEmail,
  onConnect,
  onDisconnect,
  dismissedEvents,
  eventTitleFor,
  onRestore,
  canManage,
  onClose,
}: Props) {
  const { members, updateMemberColor } = useFamily();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error('Calendar settings action failed:', err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-start justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Calendar settings"
      onClick={onClose}
    >
      <div
        className="bg-raised border border-rule rounded-card shadow-xl w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-rule">
          <h3 className="font-display text-lg font-bold text-ink">Calendar settings</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Google account */}
          <section>
            <h4 className="font-semibold text-ink mb-2">Google Calendar</h4>
            {googleConnected ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-2">
                  Connected as{' '}
                  <span className="font-medium text-ink">{googleEmail ?? 'your Google account'}</span>
                </p>
                {canManage && (
                  <button
                    className="btn btn-secondary btn-small"
                    disabled={busy === 'disconnect'}
                    onClick={() => run('disconnect', onDisconnect)}
                  >
                    {busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-2">Not connected.</p>
                <button
                  className="btn btn-primary btn-small"
                  disabled={busy === 'connect'}
                  onClick={() => run('connect', onConnect)}
                >
                  Connect
                </button>
              </div>
            )}
          </section>

          {/* Hidden events */}
          <section>
            <h4 className="font-semibold text-ink mb-2">
              Hidden events{' '}
              <span className="text-ink-3 text-sm font-normal">({dismissedEvents.length})</span>
            </h4>
            {dismissedEvents.length === 0 ? (
              <p className="text-sm text-ink-3">Nothing hidden. Dismissed events show up here.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {dismissedEvents.map((d) => (
                  <li key={d.event_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-ink truncate">
                      {eventTitleFor(d.event_id) || d.event_id}
                    </span>
                    <button
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-strong disabled:opacity-50"
                      disabled={busy === `restore-${d.event_id}`}
                      onClick={() =>
                        run(`restore-${d.event_id}`, () =>
                          onRestore(
                            d.event_id,
                            d.calendar_id ? 'google' : 'local',
                            d.calendar_id ?? undefined,
                          ),
                        )
                      }
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Colour mapping */}
          {canManage && members.length > 0 && (
            <section>
              <h4 className="font-semibold text-ink mb-1">Calendar colours</h4>
              <p className="text-sm text-ink-2 mb-3">
                The colour each person's event dot shows in on the calendar.
              </p>
              <ul className="space-y-2">
                {members.map((m, i) => {
                  const current = resolveMemberColor(
                    (m as { color?: string | null }).color,
                    i,
                  );
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: current.hex }}
                      />
                      <span className="flex-1 min-w-0 text-sm text-ink truncate">
                        {(m as { name?: string; email?: string }).name ||
                          (m as { email?: string }).email ||
                          m.user_id}
                      </span>
                      <select
                        className="input py-1 w-auto text-sm"
                        aria-label={`Colour for ${
                          (m as { name?: string }).name || 'member'
                        }`}
                        value={(m as { color?: string | null }).color ?? ''}
                        disabled={busy === `color-${m.user_id}`}
                        onChange={(e) =>
                          run(`color-${m.user_id}`, () =>
                            updateMemberColor(m.user_id, e.target.value || null),
                          )
                        }
                      >
                        <option value="">Default</option>
                        {ALL_FAMILY_COLORS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarSettings;
