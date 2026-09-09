import { useAnnouncements } from '@hooks/useAnnouncements';
import { useReminders } from '@hooks/useReminders';
import { RemindersDueBand } from './RemindersDueBand';
import { AnnouncementsBand } from './AnnouncementsBand';

/**
 * The single "what the house needs to see" region directly under the top bar.
 * Stacks the due-reminders row (urgent, time-anchored) above the announcements
 * row (parent broadcasts) inside one framed strip with a hairline between them.
 * Each child keeps its own feature logic and its own left-rule / tint as a type
 * indicator; this wrapper just owns the outer frame and the order, and hides the
 * whole thing when there's nothing in either — same as the two bands did alone.
 * Fact of the day stays a separate band below this one.
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

  const hasDue = dueReminders.length > 0;
  const pinned = announcements.filter((a) => a.is_pinned);
  const announceShown = (pinned.length > 0 ? pinned : announcements).slice(0, 4);
  const hasAnnounce = announceShown.length > 0 || canPost;

  if (!hasDue && !hasAnnounce) return null;

  return (
    <section className="bg-raised border-b border-rule divide-y divide-rule">
      {hasDue && <RemindersDueBand />}
      {hasAnnounce && <AnnouncementsBand canPost={canPost} familyId={familyId} />}
    </section>
  );
}

export default PriorityBand;
