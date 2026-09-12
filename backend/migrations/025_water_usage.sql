-- 025_water_usage.sql — FR-139 (City of Thornton water usage via WaterSmart)
--
-- Credentials live in env vars (WATERSMART_HOSTNAME/EMAIL/PASSWORD), matching
-- every other single-family integration in this app (SMARTTHINGS_TOKEN,
-- OPENWEATHER_API_KEY) -- no credential-vault table. This isn't multi-tenant,
-- so a per-family/per-user credentials row would be pure overhead.
--
-- read_datetime is WaterSmart's own per-hour meter reading timestamp; the
-- UNIQUE constraint makes re-syncing overlapping data an idempotent upsert.
-- synced_at tracks the last time THIS row was written by a poll, so "last
-- synced" can be read straight off the table without a separate state row.

CREATE TABLE IF NOT EXISTS water_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  read_datetime TIMESTAMPTZ NOT NULL,
  gallons NUMERIC(10,2),
  leak_gallons NUMERIC(10,2),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (read_datetime)
);

CREATE INDEX IF NOT EXISTS idx_water_usage_read_datetime ON water_usage (read_datetime DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON water_usage TO service_role;

NOTIFY pgrst, 'reload schema';
