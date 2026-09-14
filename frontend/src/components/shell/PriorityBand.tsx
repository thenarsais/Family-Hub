import { useAnnouncements } from '@hooks/useAnnouncements';
import { useReminders } from '@hooks/useReminders';
import { useCommute } from '@hooks/useCommute';
import { RemindersDueBand } from './RemindersDueBand';
import { AnnouncementsBand } from './AnnouncementsBand';
import { CommuteAlertBand } from './CommuteAlertBand';

const LEAVING_SOON_MIN = 20;

/**
 * The single "what the house needs to see" region directly under the top bar.
 * Stacks the leave-soon trips row (T-26, most time-critical — changes minute
 * to minute) above due-reminders (urgent, time-anchored) above announcements
 * (parent broadcasts), inside one framed strip with a hairline between them.
 * Each child keeps its own feature logic and its own left-rule / tint as a type
 * indicator; this wrapper just owns the outer frame and the order, and hides the
 * whole thing when there's nothing in any of them. Fact of the day stays a
 * separate band below this one.
 */
export function PriorityBand({
  canPost = false,
  familyId,
}: {
  canPost?: boolean;
  familyId?: string;
}) {
  const { dueReminders } = useReminders();
  const { announcements } = useAnnouncements();
  const { summary: commuteSummary } = useCommute();

  const hasLeavingSoon = commuteSummary.routes.some(
    (r) => r.minutesUntilLeave != null && r.minutesUntilLeave <= LEAVING_SOON_MIN && r.minutesUntilLeave >= -5,
  );
  const hasDue = dueReminders.length > 0;
  const pinned = announcements.filter((a) => a.is_pinned);
  const announceShown = (pinned.length > 0 ? pinned : announcements).slice(0, 4);
  const hasAnnounce = announceShown.length > 0 || canPost;

  if (!hasLeavingSoon && !hasDue && !hasAnnounce) return null;

  return (
    <section className="bg-raised border-b border-rule divide-y divide-rule">
      {hasLeavingSoon && <CommuteAlertBand />}
      {hasDue && <RemindersDueBand />}
      {hasAnnounce && <AnnouncementsBand canPost={canPost} familyId={familyId} />}
    </section>
  );
}

export default PriorityBand;
