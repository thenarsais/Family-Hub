-- 024_learning_trace.sql — T-25 (FR-143 trace mode)
--
-- Trace mode is tracked on the existing learning_progress row, not a new table:
-- it's already the per-user-per-lesson row, and trace completion is independent
-- of `completed` (which means "went through Learn view") — a lesson can be
-- traced without ever being formally completed, and vice versa.
--
-- Points are awarded once per lesson, ever: trace_points_earned is set on the
-- first successful trace and left untouched afterwards, so a repeat trace
-- (practice only) never re-earns points. See LearningService.completeTrace.

ALTER TABLE learning_progress
  ADD COLUMN IF NOT EXISTS traced BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS traced_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS trace_points_earned INTEGER NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
