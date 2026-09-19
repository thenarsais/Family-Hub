-- 029_family_member_kiosk_visibility.sql
--
-- Lets a family member exist purely for calendar person-tagging (a color +
-- a name) without appearing on the kiosk "tap your name" picker or ever
-- being selectable as an active profile -- the concrete case being a
-- newborn who needs a calendar color but no Activity Board / kiosk
-- presence yet. Defaults to true so every existing member is unaffected.

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS show_on_kiosk BOOLEAN NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
