-- 006_family_member_color.sql
--
-- T-01 (calendar settings) / FR-153: one colour per family member, used for
-- the calendar event-dot badges and the "just X" filter. The palette is the
-- six named "Henna & haldi" family colours; this column stores the chosen
-- key (e.g. 'krish', 'priya', 'anand', …) — NULL means "not assigned yet",
-- and the UI falls back to an index-based default until a parent picks one
-- in the calendar settings panel.

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS color VARCHAR(20);

NOTIFY pgrst, 'reload schema';
