/**
 * FR-134 — quick-post announcement presets. Tapping a chip posts the message
 * immediately, pinned to the band, no auto-expiry (dismiss to remove).
 * Hardcoded for v1; a per-family editable list is a v2 follow-up.
 */
export interface AnnouncementTemplate {
  /** Chip label (may include an emoji). */
  label: string;
  /** Title stored on the announcement (short, no emoji). */
  title: string;
  /** Body posted. */
  message: string;
  /** 'status' items render with a small STATUS tag (FR-062 half). */
  type: 'status' | 'general';
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  { label: 'Movie night 🍿', title: 'Movie night', message: 'Movie night tonight!', type: 'general' },
  { label: 'Running late', title: 'Running late', message: 'Running late — back soon.', type: 'general' },
  { label: 'Great job today! 🎉', title: 'Great job today', message: 'Great job today, everyone!', type: 'general' },
  { label: 'Leave in 10 min', title: 'Leaving soon', message: 'We leave in 10 minutes — get ready!', type: 'general' },
  { label: 'Working late', title: 'Working late', message: "I'm working late tonight.", type: 'status' },
];
