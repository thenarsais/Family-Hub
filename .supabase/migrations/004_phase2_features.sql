-- Phase 2: Dashboard & Home Features Schema
-- Adds tables for announcements, reminders, energy tracking, learning modules, and family management
-- This migration extends Phase 1 infrastructure for full family hub functionality

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
-- Family-wide announcements/messages from parents to children
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  created_by_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'general' CHECK (announcement_type IN ('general', 'reminder', 'urgent', 'celebration', 'request')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'children', 'parents', 'specific')),
  target_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Track who has read announcements
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(announcement_id, user_id)
);

-- ============================================
-- REMINDERS TABLE
-- ============================================
-- Upcoming reminders for chores, assignments, events, etc.
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('chore', 'assignment', 'event', 'goal', 'custom')),
  related_item_id UUID,
  related_item_type VARCHAR(100),
  scheduled_time TIMESTAMP NOT NULL,
  remind_before_minutes INTEGER DEFAULT 15,
  notification_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP,
  recurrence VARCHAR(50) CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  recurrence_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ENERGY USAGE TABLE
-- ============================================
-- Track energy consumption from SmartThings devices
CREATE TABLE IF NOT EXISTS energy_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(100),
  power_watts DECIMAL(10, 2),
  energy_kwh DECIMAL(12, 4),
  timestamp TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily/monthly energy summary
CREATE TABLE IF NOT EXISTS energy_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_kwh DECIMAL(12, 4),
  average_power_watts DECIMAL(10, 2),
  peak_power_watts DECIMAL(10, 2),
  peak_time TIMESTAMP,
  device_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period, period_start, period_end)
);

-- Energy goals and targets
CREATE TABLE IF NOT EXISTS energy_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id UUID NOT NULL,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  target_kwh DECIMAL(12, 4),
  current_kwh DECIMAL(12, 4) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'archived')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  points_reward INTEGER DEFAULT 100,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- LEARNING COURSES & LESSONS
-- ============================================
-- Learning courses (e.g., Gujarati Language, Math, Science, etc.)
CREATE TABLE IF NOT EXISTS learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  language VARCHAR(10),
  difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  total_lessons INTEGER DEFAULT 0,
  estimated_duration_hours INTEGER DEFAULT 10,
  icon_emoji VARCHAR(10),
  color_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons within a course
CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lesson_order INTEGER NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'quiz', 'interactive', 'reading', 'exercise')),
  content_url VARCHAR(500),
  duration_minutes INTEGER DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  points_value INTEGER DEFAULT 25,
  estimated_completion_time_minutes INTEGER DEFAULT 15,
  is_prerequisite_required BOOLEAN DEFAULT false,
  prerequisite_lesson_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES learning_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (prerequisite_lesson_id) REFERENCES learning_lessons(id) ON DELETE SET NULL
);

-- Track learning progress per user per course
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  total_lessons INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  current_lesson_id UUID,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived')),
  points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES learning_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (current_lesson_id) REFERENCES learning_lessons(id) ON DELETE SET NULL,
  UNIQUE(user_id, course_id)
);

-- Track individual lesson completion
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER,
  duration_seconds INTEGER,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES learning_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(lesson_id, user_id)
);

-- ============================================
-- FAMILY MANAGEMENT
-- ============================================
-- Family groups (one family can have multiple children/parents)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by_id UUID NOT NULL,
  max_children INTEGER DEFAULT 5,
  max_parents INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link users to families with roles
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'parent', 'child', 'guardian')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(family_id, user_id)
);

-- Family-level settings and configuration
CREATE TABLE IF NOT EXISTS family_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL UNIQUE,
  theme VARCHAR(50) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  notifications_enabled BOOLEAN DEFAULT true,
  sound_notifications BOOLEAN DEFAULT true,
  email_digest_frequency VARCHAR(50) DEFAULT 'weekly' CHECK (email_digest_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  parental_controls_enabled BOOLEAN DEFAULT true,
  require_age_verification BOOLEAN DEFAULT true,
  max_screen_time_minutes INTEGER DEFAULT 120,
  bedtime_enabled BOOLEAN DEFAULT false,
  bedtime_start VARCHAR(5),
  bedtime_end VARCHAR(5),
  enable_smart_home_control BOOLEAN DEFAULT true,
  points_system_enabled BOOLEAN DEFAULT true,
  badges_system_enabled BOOLEAN DEFAULT true,
  leaderboard_enabled BOOLEAN DEFAULT true,
  privacy_mode BOOLEAN DEFAULT false,
  allow_google_calendar_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Parental control settings per parent
CREATE TABLE IF NOT EXISTS parental_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  child_id UUID NOT NULL,
  content_filter_enabled BOOLEAN DEFAULT true,
  screen_time_limit_enabled BOOLEAN DEFAULT true,
  daily_limit_minutes INTEGER DEFAULT 120,
  bedtime_enabled BOOLEAN DEFAULT false,
  bedtime_start VARCHAR(5),
  bedtime_end VARCHAR(5),
  require_approval_for_sensitive_content BOOLEAN DEFAULT true,
  location_tracking_enabled BOOLEAN DEFAULT false,
  app_restrictions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(family_id, parent_id, child_id)
);

-- Family invitations for new members
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  invited_email VARCHAR(255) NOT NULL,
  inviting_parent_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child', 'guardian')),
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (inviting_parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ACTIVITY LOG (for dashboard activity feed)
-- ============================================
-- Central log for all user activities
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  achievement_title VARCHAR(255),
  related_item_id UUID,
  related_item_type VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- SMART HOME DEVICE INTEGRATION
-- ============================================
-- Track smart home devices (SmartThings)
CREATE TABLE IF NOT EXISTS smart_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  device_status VARCHAR(50) DEFAULT 'unknown',
  room VARCHAR(100),
  power_consumption_watts DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Smart device control history
CREATE TABLE IF NOT EXISTS device_control_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL,
  controlled_by_id UUID,
  command VARCHAR(100) NOT NULL,
  command_args JSON,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  response JSON,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (controlled_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Announcements indexes
CREATE INDEX idx_announcements_created_by_id ON announcements(created_by_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_user_id ON announcement_reads(user_id);

-- Reminders indexes
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_scheduled_time ON reminders(scheduled_time);
CREATE INDEX idx_reminders_is_dismissed ON reminders(is_dismissed);
CREATE INDEX idx_reminders_reminder_type ON reminders(reminder_type);

-- Energy indexes
CREATE INDEX idx_energy_usage_device_id ON energy_usage(device_id);
CREATE INDEX idx_energy_usage_timestamp ON energy_usage(timestamp DESC);
CREATE INDEX idx_energy_summary_period_start ON energy_summary(period_start);

-- Learning indexes
CREATE INDEX idx_learning_courses_subject ON learning_courses(subject);
CREATE INDEX idx_learning_lessons_course_id ON learning_lessons(course_id);
CREATE INDEX idx_learning_lessons_lesson_order ON learning_lessons(course_id, lesson_order);
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_course_id ON learning_progress(course_id);
CREATE INDEX idx_learning_progress_status ON learning_progress(status);
CREATE INDEX idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- Family indexes
CREATE INDEX idx_families_created_by_id ON families(created_by_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_role ON family_members(role);
CREATE INDEX idx_family_settings_family_id ON family_settings(family_id);
CREATE INDEX idx_parental_controls_family_id ON parental_controls(family_id);
CREATE INDEX idx_parental_controls_parent_id ON parental_controls(parent_id);
CREATE INDEX idx_parental_controls_child_id ON parental_controls(child_id);
CREATE INDEX idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX idx_family_invitations_invite_token ON family_invitations(invite_token);

-- Activity log indexes
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Smart devices indexes
CREATE INDEX idx_smart_devices_family_id ON smart_devices(family_id);
CREATE INDEX idx_smart_devices_device_type ON smart_devices(device_type);
CREATE INDEX idx_device_control_history_device_id ON device_control_history(device_id);
CREATE INDEX idx_device_control_history_controlled_by_id ON device_control_history(controlled_by_id);
CREATE INDEX idx_device_control_history_executed_at ON device_control_history(executed_at DESC);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Phase 2 tables added:
-- - Announcements: 2 tables
-- - Reminders: 1 table
-- - Energy: 3 tables
-- - Learning: 5 tables
-- - Family Management: 5 tables
-- - Activity Log: 1 table
-- - Smart Home: 2 tables
-- Total new tables: 19
-- Total new indexes: 35+
