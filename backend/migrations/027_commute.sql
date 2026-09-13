-- 027_commute.sql — T-16 (FR-083/084/085, commute / school-run card)
--
-- One row per kid's route (school name is just the label — free text, not a
-- separate table). Home address + the "no school today" override live on
-- family_settings, same precedent as kiosk's pin_hash (016) — a single
-- shared value per family, not worth their own table.
--
-- commute_no_school_date is a DATE, not a boolean: setting it to today hides
-- the card for the day and it naturally stops applying tomorrow — no reset
-- step for a parent to remember.

ALTER TABLE family_settings ADD COLUMN IF NOT EXISTS commute_home_address VARCHAR(255);
ALTER TABLE family_settings ADD COLUMN IF NOT EXISTS commute_no_school_date DATE;

CREATE TABLE IF NOT EXISTS commute_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  label VARCHAR(80) NOT NULL,
  destination_address VARCHAR(255) NOT NULL,
  arrive_by_time TIME NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 10 CHECK (buffer_minutes >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commute_routes_family ON commute_routes (family_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON commute_routes TO service_role;

NOTIFY pgrst, 'reload schema';
