import { useState, type FormEvent } from 'react';
import { Car, Plus, X } from 'lucide-react';
import { DashboardCard } from '../shell/DashboardCard';
import type { CommuteRouteStatus, NewCommuteRoute } from '@hooks/useCommute';

interface CardShellProps {
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMove: (id: string, delta: number) => void;
}

interface Props extends CardShellProps {
  configured: boolean;
  homeAddress: string | null;
  noSchoolToday: boolean;
  routes: CommuteRouteStatus[];
  loading: boolean;
  error: string | null;
  onAddRoute: (input: NewCommuteRoute) => void | Promise<void>;
  onRemoveRoute: (id: string) => void | Promise<void>;
  onSetHomeAddress: (address: string) => void | Promise<void>;
  onSetNoSchoolToday: (noSchool: boolean) => void | Promise<void>;
}

/** FR-084 — the school-run window: weekday mornings and afternoons only. */
function inCommuteWindow(now: Date): boolean {
  const day = now.getDay(); // 0 Sun .. 6 Sat
  if (day === 0 || day === 6) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const morning = minutes >= 6 * 60 + 30 && minutes <= 8 * 60; // 6:30–8:00 AM
  const afternoon = minutes >= 14 * 60 && minutes <= 15 * 60 + 30; // 2:00–3:30 PM
  return morning || afternoon;
}

/** FR-085 — green/yellow/red by traffic delay vs. the no-traffic baseline. First-cut thresholds, easy to retune. */
function trafficTone(delayMin: number | null): { label: string; className: string } {
  if (delayMin == null) return { label: '', className: 'text-ink-3' };
  if (delayMin >= 15) return { label: 'heavy traffic — leave early!', className: 'text-alert font-semibold' };
  if (delayMin >= 5) return { label: 'some traffic', className: 'text-warn font-medium' };
  return { label: 'light traffic', className: 'text-leaf' };
}

/**
 * T-16 — commute/school-run card. Shows a "leave by" time per kid, live from
 * Google Directions, only inside the weekday school-run windows (FR-084);
 * outside them (or on a "no school today" day) it shows a quiet status line
 * instead — but home-address/route management stays available any time.
 */
export function CommuteCard({
  configured,
  homeAddress,
  noSchoolToday,
  routes,
  loading,
  error,
  onAddRoute,
  onRemoveRoute,
  onSetHomeAddress,
  onSetNoSchoolToday,
  ...shell
}: Props) {
  const [addressDraft, setAddressDraft] = useState(homeAddress ?? '');
  const [label, setLabel] = useState('');
  const [destination, setDestination] = useState('');
  const [arriveBy, setArriveBy] = useState('08:00');

  const inWindow = inCommuteWindow(new Date());

  const submitRoute = (e: FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    const d = destination.trim();
    if (!l || !d || !arriveBy) return;
    void onAddRoute({ label: l, destinationAddress: d, arriveByTime: arriveBy });
    setLabel('');
    setDestination('');
  };

  const saveAddress = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = addressDraft.trim();
    if (!trimmed) return;
    void onSetHomeAddress(trimmed);
  };

  return (
    <DashboardCard
      {...shell}
      title="Commute"
      icon={<Car className="w-5 h-5 text-leaf" aria-hidden="true" />}
      count={!loading && routes.length > 0 && inWindow && !noSchoolToday ? `${routes.length} route${routes.length === 1 ? '' : 's'}` : undefined}
    >
      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : error ? (
        <p className="text-sm text-alert">{error}</p>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={noSchoolToday}
              onChange={(e) => void onSetNoSchoolToday(e.target.checked)}
              className="rounded"
            />
            No school today
          </label>

          {noSchoolToday ? (
            <p className="text-sm text-ink-3">No school today — nothing to leave for. 🎉</p>
          ) : !homeAddress || !configured ? (
            <p className="text-sm text-ink-3">
              {!homeAddress
                ? 'Add a home address below to turn this on.'
                : 'Not connected — set GOOGLE_MAPS_API_KEY to turn this on.'}
            </p>
          ) : routes.length === 0 ? (
            <p className="text-sm text-ink-3">No routes yet — add your first one below.</p>
          ) : !inWindow ? (
            <p className="text-sm text-ink-3">Outside the school-run window — check back around 6:30 AM or 2:00 PM.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {routes.map((r) => {
                const tone = trafficTone(r.trafficDelayMin ?? null);
                return (
                  <li key={r.id} className="py-2">
                    <p className="text-sm text-ink font-medium">{r.label}</p>
                    {r.leaveByTime ? (
                      <p className="text-sm">
                        Leave by <span className="font-semibold">{r.leaveByTime}</span>{' '}
                        <span className="text-ink-3">
                          ({r.durationInTrafficMin} min, {r.distanceMi} mi)
                        </span>{' '}
                        {tone.label && <span className={tone.className}>— {tone.label}</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-3">Traffic data unavailable right now.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <details className="pt-1">
            <summary className="text-xs text-ink-3 cursor-pointer select-none">Manage routes &amp; address</summary>
            <div className="mt-2 space-y-3">
              <form onSubmit={saveAddress} className="flex gap-2">
                <input
                  type="text"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  placeholder="Home address"
                  aria-label="Home address"
                  className="input py-1 text-sm flex-1"
                />
                <button type="submit" className="btn btn-secondary btn-small shrink-0">
                  Save
                </button>
              </form>

              {routes.length > 0 && (
                <ul className="space-y-1">
                  {routes.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-xs text-ink-2">
                      <span className="flex-1 truncate">
                        {r.label} → {r.destinationAddress} @ {r.arriveByTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => void onRemoveRoute(r.id)}
                        aria-label={`Remove ${r.label}`}
                        className="shrink-0 text-ink-3 hover:text-alert"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={submitRoute} className="flex flex-wrap gap-2 items-end">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Who (e.g. Krish's school)"
                  aria-label="Route label"
                  className="input py-1 text-sm flex-1 min-w-[8rem]"
                />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="School address"
                  aria-label="Destination address"
                  className="input py-1 text-sm flex-1 min-w-[8rem]"
                />
                <input
                  type="time"
                  value={arriveBy}
                  onChange={(e) => setArriveBy(e.target.value)}
                  aria-label="Arrive-by (bell) time"
                  className="input py-1 text-sm w-auto"
                />
                <button type="submit" className="btn btn-secondary btn-small shrink-0" aria-label="Add route">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </details>
        </div>
      )}
    </DashboardCard>
  );
}

export default CommuteCard;
