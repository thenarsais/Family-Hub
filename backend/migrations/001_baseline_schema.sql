-- Baseline schema, written 2026-08-22 as part of a full migration-history reset.
--
-- This repo's migrations had drifted badly from the live database in both directions:
-- two files both claimed to be migration 001 with incompatible column sets for the same
-- tables (chores/badges/users/user_badges), two more both claimed to be 006, and several
-- files (002_add_phase1_tables.sql, 003_seed_phase1_data.sql) targeted tables that were
-- never actually created live at all. The migration runner (runMigrations.ts) has no
-- applied-migrations tracking table -- it just replays every .sql file in the directory,
-- alphabetically, every time -- so there was never a real record of what had actually run.
--
-- Rather than reconcile that history, this file snapshots the live database's actual
-- schema (queried directly via PostgREST's OpenAPI discovery endpoint against the real
-- Supabase project) for every table a current backend route touches, and supersedes
-- migrations 001 through 010 entirely. All CREATE TABLE statements are IF NOT EXISTS, so
-- this is safe to run against the database that already has these tables in this shape.
--
-- Out of scope, deliberately: the ~26 other live tables (habits, daily_quests,
-- mood_entries, reading, homework, child_profiles, parent_profiles, parental_controls,
-- linked_accounts, game_sessions, sync_queue, trivia_questions, trivia_attempts, etc.)
-- that predate this app's current routes and have no code referencing them today --
-- see rebuild-decisions memory item #4. Chores and Learning are handled in
-- 002_chores_and_learning_schema.sql, not here, since both needed a real design rather
-- than a live-schema snapshot (neither has a working live shape to snapshot).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  account_type VARCHAR(50),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_children INTEGER DEFAULT 5,
  max_parents INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  notifications_enabled BOOLEAN DEFAULT true,
  sound_notifications BOOLEAN DEFAULT true,
  email_digest_frequency VARCHAR(50) DEFAULT 'daily',
  parental_controls_enabled BOOLEAN DEFAULT false,
  require_age_verification BOOLEAN DEFAULT false,
  max_screen_time_minutes INTEGER,
  bedtime_enabled BOOLEAN DEFAULT false,
  bedtime_start VARCHAR(5),
  bedtime_end VARCHAR(5),
  enable_smart_home_control BOOLEAN DEFAULT true,
  points_system_enabled BOOLEAN DEFAULT true,
  badges_system_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  privacy_mode BOOLEAN DEFAULT false,
  allow_google_calendar_sync BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (family_id)
);

CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  inviting_parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL,
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  child_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  event_type VARCHAR(100),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dismissed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255),
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS activity_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  category VARCHAR(100),
  tier VARCHAR(50),
  points_required INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS smart_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100),
  device_status VARCHAR(50),
  room VARCHAR(100),
  power_consumption_watts NUMERIC,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  announcement_type VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'normal',
  target_audience VARCHAR(50) DEFAULT 'all',
  target_user_ids UUID[],
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(100),
  related_item_id UUID,
  related_item_type VARCHAR(100),
  scheduled_time TIMESTAMP NOT NULL,
  remind_before_minutes INTEGER DEFAULT 0,
  notification_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP,
  recurrence VARCHAR(50),
  recurrence_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS energy_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  device_type VARCHAR(100),
  power_watts NUMERIC,
  energy_kwh NUMERIC,
  timestamp TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS energy_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  goal_type VARCHAR(100) NOT NULL,
  target_kwh NUMERIC NOT NULL,
  current_kwh NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  points_reward INTEGER DEFAULT 0,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS energy_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_kwh NUMERIC,
  average_power_watts NUMERIC,
  peak_power_watts NUMERIC,
  peak_time TIMESTAMP,
  device_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  achievement_title VARCHAR(255),
  related_item_id UUID,
  related_item_type VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- service_role needs explicit grants for every table above regardless of which data
-- layer (Supabase client vs. raw Postgres) ends up reading it -- see rebuild-decisions
-- memory item #1. Granting here up front avoids re-discovering the 32-of-38-tables gap
-- that motivated this whole reset.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  users, families, family_members, family_settings, family_invitations,
  calendar_events, dismissed_events, user_integrations,
  activity_points, badges, user_badges, smart_devices,
  announcements, announcement_reads, reminders,
  energy_usage, energy_goals, energy_summary, activity_log
TO service_role;

NOTIFY pgrst, 'reload schema';
