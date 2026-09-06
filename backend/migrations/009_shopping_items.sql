-- 009_shopping_items.sql
--
-- FR-087 / T-17: the shared family shopping list. Until now the dashboard
-- "Shopping List" widget ran off a hard-coded mock hook; this is its first
-- real backing store.
--
-- v1 is deliberately flat: one row per line item, `name` free text, a `checked`
-- flag for "in the cart / bought". No quantities, units, categories or aisles --
-- those were in the mock's shape but the register decision drops them for v1.
--
-- Scope is the family: any member resolves their `family_id` via
-- `family_members` (same pattern as announcements/reminders) and every
-- read/write is filtered by it, so item ids from another family can't be
-- toggled or deleted.

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  added_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_family
  ON shopping_items (family_id, checked, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_items TO service_role;

NOTIFY pgrst, 'reload schema';
