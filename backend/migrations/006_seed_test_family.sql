-- Migration: Seed test family for existing users
-- Purpose: Ensure test users have a family so calendar and other features work

-- Create a test family for test users
INSERT INTO families (name, description, created_by_id, max_children, max_parents)
SELECT
  'Test Family',
  'Automatically created test family',
  id,
  5,
  2
FROM users
WHERE email IN ('testparent@example.com', 'testchild@example.com', 'thenarsais@gmail.com')
AND id NOT IN (SELECT DISTINCT created_by_id FROM families WHERE created_by_id IS NOT NULL)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add family members for test users
INSERT INTO family_members (family_id, user_id, role, is_active)
SELECT
  f.id,
  u.id,
  CASE
    WHEN u.email = 'testparent@example.com' THEN 'parent'
    WHEN u.email = 'testchild@example.com' THEN 'child'
    WHEN u.email = 'thenarsais@gmail.com' THEN 'admin'
    ELSE 'parent'
  END,
  true
FROM families f
CROSS JOIN users u
WHERE (u.email IN ('testparent@example.com', 'testchild@example.com', 'thenarsais@gmail.com')
  OR f.created_by_id = u.id)
AND NOT EXISTS (
  SELECT 1 FROM family_members
  WHERE family_id = f.id AND user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Create default family settings
INSERT INTO family_settings (family_id, theme, language, timezone)
SELECT
  f.id,
  'light',
  'en',
  'America/New_York'
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM family_settings WHERE family_id = f.id
)
ON CONFLICT DO NOTHING;
