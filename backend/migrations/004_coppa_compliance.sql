-- COPPA compliance schema (FRAMEWORK.md Decision #29, part of the
-- 2026-08-23/24 SDLC alignment review -- see sdlc-alignment-decisions.md).
--
-- Schema minimization: store birth_year (coarse) instead of an exact date of
-- birth, and a computed is_under_13 flag, for any user whose age matters for
-- compliance. This migration also removes a real, live violation that
-- predates this review: child_profiles.date_of_birth stored an exact DOB.
-- That table is currently empty and unused by any route (see
-- rebuild-decisions memory item #4), so dropping the column is a clean,
-- zero-risk fix rather than a data migration.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_year SMALLINT,
  ADD COLUMN IF NOT EXISTS is_under_13 BOOLEAN;

-- child_profiles is one of the orphaned pre-rebuild tables (see
-- rebuild-decisions memory item #4) -- present in prod as drift, absent from
-- this migration-managed baseline in a fresh database. Guarded so this
-- migration is correct in both.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'child_profiles') THEN
    ALTER TABLE child_profiles
      DROP COLUMN IF EXISTS date_of_birth,
      ADD COLUMN IF NOT EXISTS birth_year SMALLINT,
      ADD COLUMN IF NOT EXISTS is_under_13 BOOLEAN;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
