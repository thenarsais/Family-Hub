-- 018_trivia.sql — T-09 Trivia v1 (FR-031)
-- One shared daily question + a per-user participation streak. No games, no
-- leaderboard, no badges. Hand-rolled schema (the Supabase trivia_* tables
-- referenced in types/database.ts were never in this migration set).

CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id VARCHAR(40) UNIQUE,                 -- from the seed JSON, for idempotent upsert
  question TEXT NOT NULL,
  category VARCHAR(40) NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  correct_answer TEXT NOT NULL,
  incorrect_answers TEXT[] NOT NULL,
  hint TEXT,
  fun_fact TEXT,
  points_value INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trivia_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  answered_on DATE NOT NULL,                    -- family-local day
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, answered_on)                 -- one daily attempt per user per day
);

CREATE INDEX IF NOT EXISTS idx_trivia_attempts_user ON trivia_attempts (user_id, answered_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON trivia_questions, trivia_attempts TO service_role;

NOTIFY pgrst, 'reload schema';
