-- Captures the dismissed_events table as it actually exists in the live database.
-- No prior migration file defines this table at all (confirmed by grepping every
-- migration for "dismissed_events" — zero matches) even though backend/src/routes/calendar.ts
-- has read/written it since it was introduced. It was created directly via the Supabase
-- SQL editor. Schema below matches a live introspection of information_schema.columns
-- and pg_constraint against the running database, not a design guess.
-- Written IF NOT EXISTS so it is a no-op if run against a database that already has it.

CREATE TABLE IF NOT EXISTS dismissed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255),
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT dismissed_events_user_event_unique UNIQUE (user_id, event_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dismissed_events TO service_role;

NOTIFY pgrst, 'reload schema';
