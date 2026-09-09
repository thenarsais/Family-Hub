-- 014_reminders_related_item_text.sql — T (reminders from calendar events)
--
-- `reminders.related_item_id` was UUID (baseline 001). Calendar events are keyed
-- by Google's event id, an opaque string — the same reason `dismissed_events`
-- and `event_people` use VARCHAR(255) for their `event_id`. Widen it so a
-- reminder can point at a calendar event (or its series `recurringEventId`).
--
-- A UUID -> varchar cast is lossless: existing values (all NULL in practice)
-- become their text form.

ALTER TABLE reminders ALTER COLUMN related_item_id TYPE VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_reminders_related_item
  ON reminders (family_id, related_item_id)
  WHERE related_item_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO service_role;

NOTIFY pgrst, 'reload schema';
