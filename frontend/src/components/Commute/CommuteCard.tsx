import { useState, type FormEvent } from 'react';
import { Car, Plus, X, Sparkles } from 'lucide-react';
import { DashboardCard } from '../shell/DashboardCard';
import { resolveMemberColor } from '@/data/familyColors';
import type { components } from '@/types/api-generated';
import type { CommuteRouteStatus, NewCommuteRoute, TripSuggestion } from '@hooks/useCommute';

type FamilyMember = components['schemas']['FamilyMember'];

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
  members: FamilyMember[];
  suggestions: TripSuggestion[];
  loading: boolean;
  error: string | null;
  onAddRoute: (input: NewCommuteRoute) => void | Promise<void>;
  onRemoveRoute: (id: string) => void | Promise<void>;
  onSetHomeAddress: (address: string) => void | Promise<void>;
  onSetNoSchoolToday: (noSchool: boolean) => void | Promise<void>;
  onDismissSuggestion: (titlePattern: string) => void | Promise<void>;
}

/** FR-084 — the school-run window: weekday mornings and afternoons only. Event-linked (T-26) routes ignore this -- they're gated by whether their calendar event occurs today, not a fixed clock window. */
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

/** T-26 — how soon a route counts as "leaving soon" for the in-place highlight (matches CommuteAlertBand's threshold). */
const LEAVING_SOON_MIN = 20;

function memberHex(members: FamilyMember[], memberId: string | null): string | null {
  if (!memberId) return null;
  const idx = members.findIndex((m) => m.id === memberId);
  if (idx === -1) return null;
  return resolveMemberColor(members[idx].color, idx).hex;
}

/**
 * T-16 + T-26 — commute/trips card. A "leave by" time per kid/trip, live from
 * Google Directions: fixed school-run routes show inside the weekday
 * school-run windows (FR-084); event-linked routes (T-26) show any day their
 * matching calendar event occurs, from any time until it passes. Home-address
 * /route management, and the T-26 suggestion prompt, stay available any time.
 */
export function CommuteCard({
  configured,
  homeAddress,
  noSchoolToday,
  routes,
  members,
  suggestions,
  loading,
  error,
  onAddRoute,
  onRemoveRoute,
  onSetHomeAddress,
  onSetNoSchoolToday,
  onDismissSuggestion,
  ...shell
}: Props) {
  const [addressDraft, setAddressDraft] = useState(homeAddress ?? '');
  const [mode, setMode] = useState<'fixed' | 'event'>('fixed');
  const [label, setLabel] = useState('');
  const [destination, setDestination] = useState('');
  const [arriveBy, setArriveBy] = useState('08:00');
  const [eventPattern, setEventPattern] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [originOverride, setOriginOverride] = useState('');

  const inWindow = inCommuteWindow(new Date());
  const fixedRoutes = routes.filter((r) => !r.eventTitlePattern);
  const eventRoutes = routes.filter((r) => r.eventTitlePattern);
  // Fixed routes obey the school-run window; event-linked routes show any time their event is today.
  const visibleRoutes = [...(inWindow ? fixedRoutes : []), ...eventRoutes];

  const resetForm = () => {
    setLabel('');
    setDestination('');
    setEventPattern('');
    setFamilyMemberId('');
    setOriginOverride('');
  };

  const submitRoute = (e: FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    const d = destination.trim();
    if (!l || !d) return;
    if (mode === 'fixed') {
      if (!arriveBy) return;
      void onAddRoute({
        label: l,
        destinationAddress: d,
        arriveByTime: arriveBy,
        familyMemberId: familyMemberId || undefined,
        originOverride: originOverride.trim() || undefined,
      });
    } else {
      const p = eventPattern.trim();
      if (!p) return;
      void onAddRoute({
        label: l,
        destinationAddress: d,
        eventTitlePattern: p,
        familyMemberId: familyMemberId || undefined,
        originOverride: originOverride.trim() || undefined,
      });
    }
    resetForm();
  };

  const applySuggestion = (s: TripSuggestion) => {
    setMode('event');
    setLabel(s.titlePattern);
    setEventPattern(s.titlePattern);
    setDestination(s.suggestedLocation ?? '');
  };

  const saveAddress = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = addressDraft.trim();
    if (!trimmed) return;
    void onSetHomeAddress(trimmed);
  };

  const countLabel = !loading && visibleRoutes.length > 0 && !noSchoolToday
    ? `${visibleRoutes.length} route${visibleRoutes.length === 1 ? '' : 's'}`
    : undefined;

  return (
    <DashboardCard
      {...shell}
      title="Commute"
      icon={<Car className="w-5 h-5 text-leaf" aria-hidden="true" />}
      count={
        countLabel || suggestions.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            {countLabel}
            {suggestions.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-accent font-semibold" title={`${suggestions.length} new trip type detected`}>
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                {suggestions.length} new
              </span>
            )}
          </span>
        ) : undefined
      }
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
          ) : visibleRoutes.length === 0 ? (
            <p className="text-sm text-ink-3">Outside the school-run window — check back around 6:30 AM or 2:00 PM.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {visibleRoutes.map((r) => {
                const tone = trafficTone(r.trafficDelayMin ?? null);
                const hex = memberHex(members, r.familyMemberId);
                const leavingSoon = r.minutesUntilLeave != null && r.minutesUntilLeave <= LEAVING_SOON_MIN && r.minutesUntilLeave >= -5;
                return (
                  <li
                    key={r.id}
                    className={`py-2 ${leavingSoon ? 'px-2 -mx-2 rounded bg-alert/10 border-l-4 border-l-alert' : ''}`}
                  >
                    <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                      {hex && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hex }} aria-hidden="true" />}
                      {r.label}
                      {r.eventTitlePattern && r.matchedEventTitle && r.matchedEventTitle !== r.label && (
                        <span className="text-xs text-ink-3 font-normal">— {r.matchedEventTitle}</span>
                      )}
                    </p>
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
              {suggestions.length > 0 && (
                <div className="space-y-1.5 rounded border border-accent/40 bg-accent-wash p-2">
                  <p className="text-xs font-semibold text-accent flex items-center gap-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Detected on the calendar
                  </p>
                  {suggestions.map((s) => (
                    <div key={s.titlePattern} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate text-ink-2">
                        {s.titlePattern}
                        {s.nextDate && <span className="text-ink-3"> · next {s.nextDate}</span>}
                      </span>
                      <button type="button" onClick={() => applySuggestion(s)} className="shrink-0 text-accent font-semibold hover:underline">
                        Add a commute
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDismissSuggestion(s.titlePattern)}
                        aria-label={`Not now for ${s.titlePattern}`}
                        className="shrink-0 text-ink-3 hover:text-alert"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                        {r.label} → {r.eventTitlePattern ? `from "${r.eventTitlePattern}"` : `${r.destinationAddress} @ ${r.arriveByTime}`}
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

              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('fixed')}
                  className={`btn btn-small ${mode === 'fixed' ? 'btn-secondary' : ''}`}
                  aria-pressed={mode === 'fixed'}
                >
                  Fixed schedule
                </button>
                <button
                  type="button"
                  onClick={() => setMode('event')}
                  className={`btn btn-small ${mode === 'event' ? 'btn-secondary' : ''}`}
                  aria-pressed={mode === 'event'}
                >
                  From calendar
                </button>
              </div>

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
                  placeholder={mode === 'fixed' ? 'School address' : 'Fallback address (optional if the event has one)'}
                  aria-label="Destination address"
                  className="input py-1 text-sm flex-1 min-w-[8rem]"
                />
                {mode === 'fixed' ? (
                  <input
                    type="time"
                    value={arriveBy}
                    onChange={(e) => setArriveBy(e.target.value)}
                    aria-label="Arrive-by (bell) time"
                    className="input py-1 text-sm w-auto"
                  />
                ) : (
                  <input
                    type="text"
                    value={eventPattern}
                    onChange={(e) => setEventPattern(e.target.value)}
                    placeholder="Exact calendar event title"
                    aria-label="Calendar event title"
                    className="input py-1 text-sm flex-1 min-w-[10rem]"
                  />
                )}
                {members.length > 0 && (
                  <select
                    value={familyMemberId}
                    onChange={(e) => setFamilyMemberId(e.target.value)}
                    aria-label="For which family member"
                    className="input py-1 text-sm w-auto"
                  >
                    <option value="">Whole family</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email || 'Member'}
                      </option>
                    ))}
                  </select>
                )}
                <button type="submit" className="btn btn-secondary btn-small shrink-0" aria-label="Add route">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
              <details>
                <summary className="text-xs text-ink-3 cursor-pointer select-none">Leaving from somewhere other than home?</summary>
                <input
                  type="text"
                  value={originOverride}
                  onChange={(e) => setOriginOverride(e.target.value)}
                  placeholder="Origin override (e.g. school address) — applies to the next route you add"
                  aria-label="Origin override"
                  className="input py-1 text-sm w-full mt-1"
                />
              </details>
            </div>
          </details>
        </div>
      )}
    </DashboardCard>
  );
}

export default CommuteCard;
