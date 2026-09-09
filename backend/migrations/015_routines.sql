-- 015_routines.sql — T-12 (Karishma's Activity Board, FR-047)
--
-- A 4-year-old's morning/evening routine checklists. Deliberately its OWN pair of
-- tables, NOT the habits table: no points, no streak, no activity_points, no
-- coupling to the shipped T-08 habits feature. One tap per family-local day,
-- enforced by the UNIQUE (routine_id, done_on). `user_id` = whose routine.
-- Rows are created/edited by a parent acting for the child (see routes/kids.ts).

CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot VARCHAR(20) NOT NULL CHECK (slot IN ('morning', 'evening')),
  label VARCHAR(120) NOT NULL,
  emoji VARCHAR(16) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  done_on DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (routine_id, done_on)
);

CREATE INDEX IF NOT EXISTS idx_routines_user ON routines (user_id, slot, sort_order);
CREATE INDEX IF NOT EXISTS idx_routine_completions_routine ON routine_completions (routine_id, done_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON routines, routine_completions TO service_role;

NOTIFY pgrst, 'reload schema';
