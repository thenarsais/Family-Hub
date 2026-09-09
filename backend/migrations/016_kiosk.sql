-- 016_kiosk.sql — T-14 shared-display kiosk model (FR-056)
-- A wall device enrols once and boots into the household; a numeric family PIN
-- gates the Parent profile. No points, no coupling to auth beyond family_members.

CREATE TABLE IF NOT EXISTS kiosk_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,          -- sha256 hex of the raw device token
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kiosk_devices_family ON kiosk_devices (family_id);

ALTER TABLE family_settings
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),                       -- scrypt "salthex:hashhex"
  ADD COLUMN IF NOT EXISTS kiosk_idle_minutes INTEGER NOT NULL DEFAULT 5;

GRANT SELECT, INSERT, UPDATE, DELETE ON kiosk_devices TO service_role;

NOTIFY pgrst, 'reload schema';
