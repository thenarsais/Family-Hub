-- 007_event_people.sql
--
-- FR-153: the family runs ONE shared Google calendar, so mapping a calendar to
-- a person is useless. Instead each *event* is tagged with the family members
-- it involves, as "going" or "maybe". The calendar renders a row of coloured
-- dots after the event title (Going solid, Maybe ~45% opacity); the colour is
-- the member's `family_members.color` key (migration 006).
--
-- `event_id` is the same identifier the frontend already keys events on and
-- that `dismissed_events` stores: the Google event id for a Google event, or
-- the `calendar_events.id` UUID (as text) for a local family event. Matches
-- `dismissed_events.event_id` (VARCHAR(255)) on purpose.
--
-- Writes are replace-all for a given event_id (see CalendarService.setEventPeople):
-- the PUT sends the full desired set and the service diffs it.

CREATE TABLE IF NOT EXISTS event_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'going' CHECK (role IN ('going', 'maybe')),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_people_family_event
  ON event_people (family_id, event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON event_people TO service_role;

NOTIFY pgrst, 'reload schema';
