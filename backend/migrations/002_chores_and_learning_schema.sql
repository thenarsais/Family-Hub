-- Real schema for Chores and Learning, written 2026-08-22.
--
-- Chores had no live table at all -- its service (backend/src/services/chores.ts) wrote
-- to chores/chore_completions/point_transactions/user_points, none of which existed
-- anywhere. Learning's live tables (learning_courses/learning_lessons/learning_progress,
-- created by the old 004_phase2_features.sql) are a *different, incompatible* model --
-- course-with-percentage-progress -- left over from an earlier architecture generation,
-- not the per-lesson-completion model backend/src/services/learning.ts actually
-- implements (keyed by category: 'alphabet'|'numbers'|'vocabulary' + phase, matching the
-- salvaged Gujarati curriculum in backend/seed-data/). Dropping and recreating both under
-- the shape the real service code uses.
--
-- Also: both chores.ts and the old learning.ts wrote to a second, entirely separate
-- points ledger (point_transactions/user_points) that never talks to activity_points --
-- the table the already-working Points domain (database/repositories/PointsRepository.ts)
-- uses. That would mean chore- and lesson-earned points never showed up anywhere real.
-- Fixed by routing both through PointsRepository/activity_points instead -- see the
-- accompanying service-code changes in this same commit. No point_transactions or
-- user_points table is created here; there is exactly one points ledger now.

-- `chores` also already existed live, in the old 001_init_schema.sql shape
-- (child_id/title/priority/is_recurring/due_date/status) -- incompatible with what
-- services/chores.ts actually reads/writes (user_id/name/time_slot/enabled). Confirmed
-- empty (SELECT COUNT(*) = 0) before dropping.
DROP TABLE IF EXISTS chore_completions CASCADE;
DROP TABLE IF EXISTS chores CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS learning_lessons CASCADE;
DROP TABLE IF EXISTS learning_courses CASCADE;
DROP TABLE IF EXISTS gujarati_learning CASCADE;

CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  points_value INTEGER NOT NULL CHECK (points_value > 0),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_earned INTEGER NOT NULL
);

-- Lesson content itself -- one row per curriculum item (letter, number, vocabulary word,
-- etc). Seeded from backend/seed-data/gujarati-curriculum.json; `content` is JSONB rather
-- than fixed columns since the shape genuinely differs by category (alphabet entries have
-- letter/romanization/pronunciation/english, vocabulary entries add a category grouping).
CREATE TABLE learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL CHECK (category IN ('alphabet', 'numbers', 'vocabulary')),
  phase VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  sequence_order INTEGER NOT NULL,
  content JSONB NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  phase VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE learning_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  selected_answer INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  chores, chore_completions, learning_lessons, learning_progress, learning_quiz_answers
TO service_role;

NOTIFY pgrst, 'reload schema';
