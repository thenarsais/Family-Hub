import { Car } from 'lucide-react';
import { useCommute } from '@hooks/useCommute';
import { useFamily } from '@hooks/useFamily';
import { resolveMemberColor } from '@/data/familyColors';

/** T-26 — how soon a route counts as "leaving soon". Negative down to -5 keeps a just-missed leave-by visible briefly rather than vanishing the instant it passes. */
const LEAVING_SOON_MIN = 20;

/**
 * T-26 — a leave-soon alert, the same self-hiding band pattern as
 * RemindersDueBand: renders nothing until a commute route's leave-by time is
 * within LEAVING_SOON_MIN minutes, then shows one row per such route,
 * stacking when more than one trip is leaving around the same time (usually
 * different people, per the person-colour tag). The CommuteCard itself also
 * highlights the same routes in place -- this band is the "look up now"
 * surface, the card is the "manage it" surface.
 */
export function CommuteAlertBand() {
  const { summary } = useCommute();
  const { members } = useFamily();

  const leavingSoon = summary.routes.filter(
    (r) => r.minutesUntilLeave != null && r.minutesUntilLeave <= LEAVING_SOON_MIN && r.minutesUntilLeave >= -5,
  );

  if (leavingSoon.length === 0) return null;

  return (
    <div className="bg-alert/10 border-l-4 border-l-alert px-4 sm:px-6 py-2.5">
      <div className="flex items-start gap-3">
        <span className="flex items-center gap-1.5 shrink-0 pt-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-alert">
          <Car className="w-3.5 h-3.5" aria-hidden="true" />
          Leaving soon
        </span>

        <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
          {leavingSoon.map((r) => {
            const idx = members.findIndex((m) => m.id === r.familyMemberId);
            const hex = idx !== -1 ? resolveMemberColor(members[idx].color, idx).hex : null;
            const minutes = r.minutesUntilLeave ?? 0;
            return (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                {hex && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hex }} aria-hidden="true" />}
                <span className="font-medium text-ink truncate">
                  {r.eventTitlePattern && r.matchedEventTitle ? r.matchedEventTitle : r.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-alert">
                  {minutes <= 0 ? 'leave now' : `in ${minutes} min`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default CommuteAlertBand;
