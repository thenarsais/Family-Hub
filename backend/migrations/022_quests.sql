-- 022_quests.sql — T-23 (FR-029 daily quests, FR-030 scoped down to v1)
--
-- The real v1 named in the 2026-09-01 decision: "pick 3 random quests, +50 if
-- all done." FR-030's hybrid-rotation/weakness-bias/swap-economy engine is
-- explicitly NOT built — this table only remembers which 3 template keys were
-- assigned to a user for a family-local day, and whether the all-done bonus
-- has already been paid (so a page refresh never double-pays it). Quest
-- "done" state itself is never stored here — it's computed live by checking
-- each of the other sections' own tables (see services/quests.ts).

CREATE TABLE IF NOT EXISTS quest_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL,
  template_keys TEXT[] NOT NULL,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, quest_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON quest_assignments TO service_role;

NOTIFY pgrst, 'reload schema';
