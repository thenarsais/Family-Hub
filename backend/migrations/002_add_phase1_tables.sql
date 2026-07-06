-- Phase 1B: Extended Schema - Goals, Challenge Mode, Notifications, and More
-- This migration adds remaining tables for complete Phase 1 functionality

-- Goals Table (Weekly/Monthly)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('weekly', 'monthly')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  category VARCHAR(100),
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 50,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'abandoned', 'paused')),
  created_by_id UUID,
  parent_approved BOOLEAN DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Goal Progress Tracking
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  progress_value INTEGER,
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Category Mastery Table
CREATE TABLE IF NOT EXISTS category_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  total_activities INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(child_id, category)
);

-- Daily Challenge Mode Table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  challenge_date DATE NOT NULL,
  game_order INTEGER,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  game_type VARCHAR(100),
  lives_remaining INTEGER DEFAULT 3,
  points_earned INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  clean_sweep BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(child_id, challenge_date)
);

-- Daily Challenge Results/Leaderboard
CREATE TABLE IF NOT EXISTS challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL,
  round_number INTEGER,
  game_score INTEGER,
  is_correct BOOLEAN,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE
);

-- Streak Recovery System
CREATE TABLE IF NOT EXISTS streak_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  activity_type VARCHAR(100),
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(child_id, activity_type)
);

-- Streak Recovery Attempts
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_id UUID NOT NULL,
  recovery_cost INTEGER,
  recovered_date DATE,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (streak_id) REFERENCES streak_records(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  child_id UUID,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  event_type VARCHAR(100),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  created_by_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Calendar Event Templates (for recurring events like practices, appointments)
CREATE TABLE IF NOT EXISTS calendar_event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  default_duration_minutes INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chore Templates (for automated chore creation from calendar events)
CREATE TABLE IF NOT EXISTS chore_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  chore_title VARCHAR(255),
  chore_description TEXT,
  points_value INTEGER DEFAULT 10,
  priority VARCHAR(20) DEFAULT 'medium',
  days_before_event INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings/Configuration Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  setting_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Portal Settings
CREATE TABLE IF NOT EXISTS parent_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL UNIQUE,
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_reports_enabled BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Board Module Settings (per child, per parent)
CREATE TABLE IF NOT EXISTS activity_board_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  wordle_enabled BOOLEAN DEFAULT true,
  quickfire_trivia_enabled BOOLEAN DEFAULT true,
  word_scramble_enabled BOOLEAN DEFAULT true,
  hangman_enabled BOOLEAN DEFAULT true,
  daily_quests_enabled BOOLEAN DEFAULT true,
  homework_enabled BOOLEAN DEFAULT true,
  kung_fu_enabled BOOLEAN DEFAULT true,
  habits_enabled BOOLEAN DEFAULT true,
  reading_enabled BOOLEAN DEFAULT true,
  mood_enabled BOOLEAN DEFAULT true,
  gujarati_enabled BOOLEAN DEFAULT true,
  goals_enabled BOOLEAN DEFAULT true,
  category_mastery_enabled BOOLEAN DEFAULT true,
  daily_challenge_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(child_id, parent_id)
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (for compliance and troubleshooting)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Google Drive Sync State
CREATE TABLE IF NOT EXISTS google_drive_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  backup_folder_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Soft Delete Support Table (for tracking deleted records)
CREATE TABLE IF NOT EXISTS deleted_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  record_type VARCHAR(100) NOT NULL,
  deleted_by_id UUID,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  restoration_possible BOOLEAN DEFAULT true,
  FOREIGN KEY (deleted_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sessions/Authentication Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  ip_address VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Content Items Table (generic for reusability)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  difficulty VARCHAR(20),
  category VARCHAR(100),
  data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for new tables
CREATE INDEX idx_goals_child_id ON goals(child_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_end_date ON goals(end_date);
CREATE INDEX idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX idx_category_mastery_child_id ON category_mastery(child_id);
CREATE INDEX idx_daily_challenges_child_id ON daily_challenges(child_id);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_challenge_results_challenge_id ON challenge_results(challenge_id);
CREATE INDEX idx_streak_records_child_id ON streak_records(child_id);
CREATE INDEX idx_streak_recoveries_streak_id ON streak_recoveries(streak_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_calendar_events_child_id ON calendar_events(child_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX idx_parent_portal_settings_parent_id ON parent_portal_settings(parent_id);
CREATE INDEX idx_activity_board_settings_child_id ON activity_board_settings(child_id);
CREATE INDEX idx_feature_flags_name ON feature_flags(flag_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_google_drive_sync_user_id ON google_drive_sync(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
