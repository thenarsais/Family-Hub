-- 013_habits_and_mood.sql — T-08 (FR-026 habits + FR-028 mood check-in)
--
-- The Supabase-era `habits` / `habit_completions` / `mood_entries` tables listed
-- in src/types/database.ts were never carried into the migration chain (001's
-- header lists them as deliberately out of scope). Creating them fresh under the
-- same shape the T-07 chores feature uses:
--
--  * habits.user_id = the assignee ("whose habit"), like chores — the "Light"
--    ownership model, no separate assignment table. Family scoping is derived
--    through family_members at read time.
--  * weekly_target (1..7) is the "N of 7 days this week" goal. A completion is
--    one tap per family-local day (guarded in the service); the streak is
--    consecutive *weeks* that hit the target.
--  * completed_at / recorded_at are TIMESTAMPTZ so the family-local "today" /
--    "this week" boundaries are real instants (matches reminders migration 012).
--  * mood_entries carries family_id so the parent mood heatmap (FR-149) is a
--    pure family-scoped read. One row per user per family-local day — the
--    service upserts, so changing your mind before midnight replaces it.

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  weekly_target INTEGER NOT NULL DEFAULT 7 CHECK (weekly_target BETWEEN 1 AND 7),
  points_value INTEGER NOT NULL DEFAULT 10 CHECK (points_value > 0),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  points_earned INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions (habit_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user ON habit_completions (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('great', 'good', 'ok', 'low', 'sad')),
  emoji VARCHAR(16),
  note TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_family ON mood_entries (family_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON habits, habit_completions, mood_entries TO service_role;

NOTIFY pgrst, 'reload schema';
