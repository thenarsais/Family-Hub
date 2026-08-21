-- The demo login/signup flow (backend/src/routes/auth.ts, frontend/src/hooks/useAuth.ts)
-- hardcodes two demo accounts by UUID. families.created_by_id has a foreign key to
-- users.id, so family auto-creation on login (ensureUserHasFamily) fails unless these
-- rows actually exist in the users table. They were inserted directly via the Supabase
-- SQL editor; this migration captures that so a fresh database doesn't regress.

INSERT INTO public.users (id, email, name, account_type, role, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'testparent@example.com', 'Test Parent', 'primary', 'parent', true),
  ('00000000-0000-0000-0000-000000000002', 'testchild@example.com', 'Test Child', 'child', 'child', true)
ON CONFLICT (id) DO NOTHING;
