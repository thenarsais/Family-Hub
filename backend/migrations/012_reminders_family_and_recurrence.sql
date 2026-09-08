-- 012_reminders_family_and_recurrence.sql
--
-- Reminders (FR-094) were user-scoped and display-only. This turns them into a
-- family-visible feature with working recurrence:
--
--  * family_id — the visibility scope. `user_id` stays as the assignee ("whose
--    reminder"); the card/band shows both. Backfilled from the creator's active
--    membership.
--  * scheduled_time TIMESTAMP -> TIMESTAMPTZ. It was written as UTC ISO strings
--    and read with `new Date(...)`, so it worked by convention; the recurrence
--    engine and the "is it due now?" comparison need a real instant. Existing
--    values are interpreted as UTC.
--
-- Recurrence rollover happens in the service on read (there is no job runner
-- yet — that rides with FR-140/FR-118), guarded by a compare-and-swap on
-- scheduled_time so concurrent reads don't double-advance a row.

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;

UPDATE reminders r
SET family_id = fm.family_id
FROM family_members fm
WHERE fm.user_id = r.user_id
  AND fm.is_active = true
  AND r.family_id IS NULL;

ALTER TABLE reminders
  ALTER COLUMN scheduled_time TYPE TIMESTAMPTZ USING scheduled_time AT TIME ZONE 'UTC';

CREATE INDEX IF NOT EXISTS idx_reminders_family_scheduled
  ON reminders (family_id, scheduled_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO service_role;

NOTIFY pgrst, 'reload schema';
