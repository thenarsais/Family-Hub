-- 023_rewards.sql — T-24 (FR-142 reward fulfilment)
--
-- Two independent milestones drive eligibility off the existing activity_points
-- ledger: a per-kid weekly points goal (reward_settings), and the pre-existing
-- monthly bronze/silver/gold tiers from chores.ts's CHORE_TIERS (200/300/400).
-- Hitting either creates a reward_earned row (pending until a parent fulfills it
-- by picking a reward_library item). Fulfilling never touches the points ledger —
-- it's a real-world action the app logs, layered on top.
--
-- period_key disambiguates repeat earns: 'YYYY-MM-DD' (the calendar week's Monday)
-- for weekly, 'YYYY-MM' for the monthly tiers — the UNIQUE constraint is what makes
-- checkAndRecord's "insert if not already earned this period" idempotent.

CREATE TABLE IF NOT EXISTS reward_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  weekly_goal INTEGER NOT NULL DEFAULT 50 CHECK (weekly_goal > 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  cash_amount NUMERIC(10,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_earned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(10) NOT NULL CHECK (milestone_type IN ('weekly', 'bronze', 'silver', 'gold')),
  period_key VARCHAR(10) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ,
  library_item_id UUID REFERENCES reward_library(id) ON DELETE SET NULL,
  fulfillment_note TEXT,
  UNIQUE (user_id, milestone_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_reward_earned_user ON reward_earned (user_id, earned_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON reward_settings, reward_library, reward_earned TO service_role;

NOTIFY pgrst, 'reload schema';
