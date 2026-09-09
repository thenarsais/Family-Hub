-- 017_learning_lesson_slot.sql — T-11 Gujarati learning module
-- Give learning_lessons a natural unique key so the curriculum seed is idempotent
-- (INSERT ... ON CONFLICT (phase, subcategory, sequence_order) DO UPDATE).

-- Numbers lessons carry no subcategory in the source JSON — give them one so the
-- unique index has no NULLs (NULLs compare distinct and would defeat idempotency).
UPDATE learning_lessons SET subcategory = 'digits' WHERE subcategory IS NULL;
ALTER TABLE learning_lessons ALTER COLUMN subcategory SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_lessons_slot
  ON learning_lessons (phase, subcategory, sequence_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON learning_lessons TO service_role;

NOTIFY pgrst, 'reload schema';
