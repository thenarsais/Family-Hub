-- 028_calendar_trips.sql — T-26 (FR-158, calendar-linked trips)
--
-- Generalizes commute_routes (027) beyond the fixed twice-daily school run:
-- a route can now be EVENT-LINKED instead of fixed-schedule. When
-- event_title_pattern is set, arrive_by_time is derived each day from the
-- matching calendar event's own start time rather than a stored bell time —
-- so arrive_by_time becomes nullable, guarded by a check that exactly one of
-- the two "when does this apply" mechanisms is present.
--
-- origin_override lets one route leave from somewhere other than home (e.g.
-- picked up straight from school) — expected to be rare, so it's a plain
-- optional address column, not a real multi-leg trip model.
--
-- commute_dismissed_suggestions remembers a declined auto-detected pattern so
-- the confirm-once prompt doesn't keep re-asking about the same event title.

ALTER TABLE commute_routes ALTER COLUMN arrive_by_time DROP NOT NULL;
ALTER TABLE commute_routes ADD COLUMN IF NOT EXISTS event_title_pattern VARCHAR(160);
ALTER TABLE commute_routes ADD COLUMN IF NOT EXISTS origin_override VARCHAR(255);
ALTER TABLE commute_routes DROP CONSTRAINT IF EXISTS commute_routes_schedule_check;
ALTER TABLE commute_routes ADD CONSTRAINT commute_routes_schedule_check
  CHECK (arrive_by_time IS NOT NULL OR event_title_pattern IS NOT NULL);

CREATE TABLE IF NOT EXISTS commute_dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title_pattern VARCHAR(160) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, title_pattern)
);

CREATE INDEX IF NOT EXISTS idx_commute_dismissed_family ON commute_dismissed_suggestions (family_id);

GRANT SELECT, INSERT, DELETE ON commute_dismissed_suggestions TO service_role;

NOTIFY pgrst, 'reload schema';
