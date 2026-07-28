-- ============================================
-- PHASE 1 DATABASE SCHEMA
-- Family Hub: Smart Home + Learning + Chores
-- ============================================

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child', 'toddler')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- SMART THINGS DEVICES
-- ============================================

CREATE TABLE IF NOT EXISTS smartthings_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('light', 'lock', 'climate', 'switch', 'sensor', 'other')),
  room VARCHAR(255),
  status JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_smartthings_devices_type ON smartthings_devices(type);
CREATE INDEX idx_smartthings_devices_room ON smartthings_devices(room);

-- ============================================
-- CHORES & POINTS
-- ============================================

CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  time_slot VARCHAR(50) CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  points_value INT NOT NULL DEFAULT 10,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chores_user_id ON chores(user_id);
CREATE INDEX idx_chores_enabled ON chores(enabled);

CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chore_completions_user_id ON chore_completions(user_id);
CREATE INDEX idx_chore_completions_chore_id ON chore_completions(chore_id);
CREATE INDEX idx_chore_completions_completed_at ON chore_completions(completed_at);

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INT NOT NULL DEFAULT 0,
  daily_points INT NOT NULL DEFAULT 0,
  weekly_points INT NOT NULL DEFAULT 0,
  monthly_points INT NOT NULL DEFAULT 0,
  last_reset_daily DATE DEFAULT CURRENT_DATE,
  last_reset_weekly DATE DEFAULT CURRENT_DATE,
  last_reset_monthly DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_points_user_id ON user_points(user_id);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('chore', 'trivia', 'habit', 'reading', 'mood', 'badge', 'other')),
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);

-- ============================================
-- LEARNING MODULE (GUJARATI)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('alphabet', 'numbers', 'vocabulary')),
  phase VARCHAR(50) NOT NULL CHECK (phase IN ('phase_1_alphabet', 'phase_2_numbers', 'phase_3_vocabulary')),
  completed BOOLEAN DEFAULT false,
  points_earned INT DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_phase ON learning_progress(phase);
CREATE INDEX idx_learning_progress_completed ON learning_progress(completed);

CREATE TABLE IF NOT EXISTS learning_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(255) NOT NULL,
  question_number INT NOT NULL,
  selected_answer INT NOT NULL,
  correct_answer INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_quiz_answers_user_id ON learning_quiz_answers(user_id);
CREATE INDEX idx_learning_quiz_answers_created_at ON learning_quiz_answers(created_at);

-- ============================================
-- BADGES & ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(255),
  criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================
-- SYSTEM & SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

-- ============================================
-- INDEXES FOR COMMON QUERIES
-- ============================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_chore_completions_date ON chore_completions(completed_at DESC);
CREATE INDEX idx_learning_progress_date ON learning_progress(completed_at DESC);
