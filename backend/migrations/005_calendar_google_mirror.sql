-- B-lite Google Calendar create/edit/delete (feat/calendar-create-events).
--
-- Events created through the new dashboard "Add event" form are written to the
-- creator's Google Calendar first (Google is the single source of truth) and
-- then mirrored into calendar_events so family members who aren't attendees
-- still see them on the shared calendar. The mirror row is never edited
-- independently -- on any disagreement, Google wins.
--
-- These columns tag a calendar_events row as such a mirror:
--   google_event_id    -- the Google event id; NULL for a normal local event
--   google_calendar_id -- which Google calendar it lives on ('primary' for now;
--                          column exists so a future calendar picker is additive)
--
-- The useCalendar merge dedupes on google_event_id: when a mirror row carries
-- one, the matching event from the Google read feed is dropped so it renders
-- once.

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255);

-- One mirror row per Google event. Partial unique index so normal local events
-- (google_event_id IS NULL) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_google_event_id_key
  ON calendar_events (google_event_id)
  WHERE google_event_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
