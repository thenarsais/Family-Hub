-- 019_homework.sql — T-20 (FR-024 homework tracker)
--
-- Dated, one-shot homework items. Unlike chores/habits there is no completions
-- table and no daily reset: an item is done once. completed_at / points_earned
-- live on the row. user_id = the assignee ("whose homework"), the Light model
-- from chores; family scoping is derived through family_members at read time.
-- created_by is recorded so the parent panel can show "added by Krish" vs a
-- parent-added item. The Supabase-era `homework` type in src/types/database.ts
-- was never migrated (001 header: out of scope) — this is a fresh table.

CREATE TABLE IF NOT EXISTS homework_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,       -- assignee
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(60),
  due_date DATE NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 10 CHECK (points_value > 0),
  completed_at TIMESTAMPTZ,
  points_earned INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homework_user_due ON homework_items (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_homework_completed_at ON homework_items (completed_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON homework_items TO service_role;

NOTIFY pgrst, 'reload schema';
