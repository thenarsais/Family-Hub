-- Captures the calendar_events table as it actually exists in the live database.
-- This table was originally defined in 002_add_phase1_tables.sql, but that migration
-- was never applied (confirmed by diffing information_schema.tables against every
-- migration file's CREATE TABLE statements). backend/src/services/calendar.ts has
-- queried .from('calendar_events') since it was written, so this table was created
-- directly via the Supabase SQL editor to unblock GET/POST /api/calendar/events.
-- Written IF NOT EXISTS so it is a no-op if run against a database that already has it.

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  child_id UUID,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  event_type VARCHAR(100),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  created_by_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO service_role;

NOTIFY pgrst, 'reload schema';
