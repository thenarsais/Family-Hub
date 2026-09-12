-- 026_maintenance.sql — T-15 (FR-078 / FR-080-core / FR-081, home maintenance tracker)
--
-- Deliberately the simplest possible recurrence model: a name, an interval in
-- days, and a last-done date. "Next due" is computed (last_done_at +
-- interval_days), never stored -- "mark done" is just last_done_at = today,
-- which reschedules for free. Even "twice a year" items (gutters) are just a
-- ~182-day interval; no separate seasonal/calendar logic anywhere.
--
-- Family-wide like the shopping list, not user-scoped and not gamified --
-- any signed-in member can add, edit, mark done, or remove an item.

CREATE TABLE IF NOT EXISTS maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  interval_days INTEGER NOT NULL CHECK (interval_days > 0),
  last_done_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_items_family ON maintenance_items (family_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance_items TO service_role;

NOTIFY pgrst, 'reload schema';
