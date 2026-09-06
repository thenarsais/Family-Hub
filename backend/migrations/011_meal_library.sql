-- 011_meal_library.sql
--
-- FR-133: a family-maintained list of saved meals. The dashboard meal-planner
-- card (FR-015, migration 010) lets you type a meal into a date+slot; this adds
-- a reusable library you drag from instead of retyping "Taco Tuesday" every week.
--
-- `default_slot` is an optional hint (e.g. "Pancakes" defaults to breakfast) —
-- purely a UI nicety, the drag still lands wherever you drop it.
--
-- Scope is the family, same resolution as meal_plans/shopping. UNIQUE keeps the
-- list from filling with duplicates; the add endpoint upserts on conflict.

CREATE TABLE IF NOT EXISTS meal_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_slot VARCHAR(10) CHECK (default_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, name)
);

CREATE INDEX IF NOT EXISTS idx_meal_library_family
  ON meal_library (family_id, name);

GRANT SELECT, INSERT, UPDATE, DELETE ON meal_library TO service_role;

NOTIFY pgrst, 'reload schema';
