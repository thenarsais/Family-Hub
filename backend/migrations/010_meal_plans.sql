-- 010_meal_plans.sql
--
-- FR-015 / FR-089: the family meal planner. Until now useMealPlanner was a
-- hard-coded mock keyed by weekday name; this is its real backing store.
--
-- v1 is deliberately plain: one row per (family, date, slot), `text` free-form,
-- four fixed slots. No recipes, ingredients, or shopping-list linkage — those
-- were explored and cut for v1 (see the register decision on FR-015).
--
-- `plan_date` is a real calendar date (not a weekday), so the same data drives
-- both the week-at-a-glance planner card and the inline meals line on the
-- calendar (FR-150). Scope is the family: every read/write resolves the
-- caller's `family_id` from `family_members` and filters by it.
--
-- UNIQUE (family_id, plan_date, slot) makes writes an upsert — setting a slot
-- that already has text just replaces it; clearing a slot deletes the row.

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  slot VARCHAR(10) NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  text TEXT NOT NULL,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, plan_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_family_date
  ON meal_plans (family_id, plan_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON meal_plans TO service_role;

NOTIFY pgrst, 'reload schema';
