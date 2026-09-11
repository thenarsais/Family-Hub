-- 020_reading.sql — T-21 (FR-027 reading challenges)
--
-- One reading log per family-local day (dated, one-shot — like homework, not a
-- daily-reset recurring item). goal_minutes / goal_met / points_earned are
-- snapshotted on the log row at write time so a later goal edit never rewrites
-- history (same principle as chores/habits snapshotting points_earned).
-- reading_goals holds one row per user (daily/weekly minute targets + the
-- per-day points value); missing rows fall back to defaults in the app layer,
-- so a row is only created the first time a parent actually edits it.
-- The Supabase-era `reading` type in src/types/database.ts was never migrated
-- (001 header: out of scope) — these are fresh tables.

CREATE TABLE IF NOT EXISTS reading_goals (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_minutes INTEGER NOT NULL DEFAULT 20 CHECK (daily_minutes > 0),
  weekly_minutes INTEGER NOT NULL DEFAULT 100 CHECK (weekly_minutes > 0),
  points_value INTEGER NOT NULL DEFAULT 10 CHECK (points_value > 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes >= 0),
  goal_minutes INTEGER NOT NULL,
  goal_met BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_reading_logs_user ON reading_logs (user_id, log_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON reading_goals, reading_logs TO service_role;

NOTIFY pgrst, 'reload schema';
