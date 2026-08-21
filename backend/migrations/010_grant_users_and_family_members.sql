-- The earlier RLS/permissions fix (see memory: supabase-rls-permissions, applied ~2 days
-- prior to this migration) granted service_role access to families, calendar_events,
-- dismissed_events, and user_integrations, but missed users and family_members. That gap
-- was never caught because it was applied ad hoc via the Supabase SQL editor rather than
-- as a migration, so there was nothing to diff against. It surfaced as "permission denied
-- for table users" / "permission denied for table family_members" when ensureUserHasFamily()
-- (backend/src/routes/auth.ts) tried to look up or create a user's family on login.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO service_role;

NOTIFY pgrst, 'reload schema';
