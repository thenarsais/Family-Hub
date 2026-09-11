-- 021_kungfu.sql — T-22 (FR-025 kung fu tracker)
--
-- No fixed weekly class schedule (the original "calendar-aware" idea in the spec
-- didn't survive scoping) — kungfu_logs is a free-form training log with two
-- session types, either loggable any day. Unlike homework/reading there is
-- deliberately NO UNIQUE(user_id, log_date) — multiple sessions per day are
-- allowed (a kid can have a class and home practice the same day).
-- kungfu_profiles holds the belt (parent-set manually — a real belt comes from
-- an instructor's test at the dojo, not an app formula) plus the per-type point
-- values; one row per user, created lazily on first parent edit.

CREATE TABLE IF NOT EXISTS kungfu_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  belt VARCHAR(60),
  belt_since DATE,
  points_per_class INTEGER NOT NULL DEFAULT 15 CHECK (points_per_class > 0),
  points_per_practice INTEGER NOT NULL DEFAULT 5 CHECK (points_per_practice > 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kungfu_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('class', 'practice')),
  log_date DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kungfu_logs_user_date ON kungfu_logs (user_id, log_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON kungfu_profiles, kungfu_logs TO service_role;

NOTIFY pgrst, 'reload schema';
