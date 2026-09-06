-- 008_dismissed_event_scope.sql
--
-- FR-126 / T-02: dismissing a recurring event can now hide the WHOLE series,
-- not just the one occurrence. Google's read expands a recurring event into one
-- entry per day (singleEvents:true), so hiding a weekly meeting used to take
-- dozens of clicks.
--
-- `scope` distinguishes the two kinds of dismissed_events row:
--   'occurrence' (default) -- event_id is a single occurrence's id; the
--                              existing behaviour, keeps the Google decline.
--   'series'               -- event_id is Google's recurringEventId (the series
--                              master); the client filters out EVERY occurrence
--                              whose recurringEventId matches. Local hide only,
--                              no Google API calls (no RRULE surgery).
--
-- UNIQUE (user_id, event_id) still holds -- an occurrence id and a
-- recurringEventId don't collide, and re-dismissing a series just upserts.

ALTER TABLE dismissed_events
  ADD COLUMN IF NOT EXISTS scope VARCHAR(12) NOT NULL DEFAULT 'occurrence'
    CHECK (scope IN ('occurrence', 'series'));

NOTIFY pgrst, 'reload schema';
