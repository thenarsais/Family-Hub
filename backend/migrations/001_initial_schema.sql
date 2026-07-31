-- ====================================
-- Family Hub - Initial Schema (Phase 1B)
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- USERS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child')),
  account_type VARCHAR(50) NOT NULL DEFAULT 'primary' CHECK (account_type IN ('primary', 'coparent', 'guardian', 'child')),
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ====================================
-- LINKED ACCOUNTS (Parent-Child)
-- ====================================
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, child_id)
);

-- ====================================
-- BADGES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  icon_url VARCHAR(500),
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- USER BADGES (Progress)
-- ====================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255),
  UNIQUE(user_id, badge_id)
);

-- ====================================
-- POINTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- CHORES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  frequency VARCHAR(50) DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
  due_date DATE,
  points_reward INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ====================================
-- LEARNING PHASES
-- ====================================
CREATE TABLE IF NOT EXISTS learning_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  order_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- LEARNING LESSONS
-- ====================================
CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES learning_phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  order_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- LEARNING PROGRESS
-- ====================================
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES learning_phases(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- QUIZ ANSWERS
-- ====================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES learning_phases(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- SMARTTHINGS DEVICES
-- ====================================
CREATE TABLE IF NOT EXISTS smartthings_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(100) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100),
  model_name VARCHAR(255),
  manufacturer VARCHAR(255),
  category VARCHAR(100),
  is_controllable BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'online',
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- SMARTTHINGS DEVICE HISTORY
-- ====================================
CREATE TABLE IF NOT EXISTS smartthings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES smartthings_devices(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  state_before JSONB,
  state_after JSONB,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Linked accounts indexes
CREATE INDEX IF NOT EXISTS idx_linked_accounts_parent ON linked_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_child ON linked_accounts(child_id);

-- Badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- Points indexes
CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_activity ON points(activity_type);
CREATE INDEX IF NOT EXISTS idx_points_created ON points(created_at DESC);

-- Chores indexes
CREATE INDEX IF NOT EXISTS idx_chores_assigned_to ON chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chores_assigned_by ON chores(assigned_by);
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);
CREATE INDEX IF NOT EXISTS idx_chores_due_date ON chores(due_date);

-- Learning indexes
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_phase ON learning_progress(phase_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user ON quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_phase ON quiz_answers(phase_id);

-- SmartThings indexes
CREATE INDEX IF NOT EXISTS idx_smartthings_devices_type ON smartthings_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_smartthings_history_device ON smartthings_history(device_id);

-- ====================================
-- AUDIT TRIGGERS (for updated_at)
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smartthings_devices_updated_at BEFORE UPDATE ON smartthings_devices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- SEED DATA (Optional - for testing)
-- ====================================

-- Insert test badges
INSERT INTO badges (name, description, category, points_required) VALUES
('Beginner Learner', 'Complete first lesson', 'learning', 10),
('Chore Champion', 'Complete 10 chores', 'chores', 50),
('Quiz Master', 'Get 5 quiz questions right', 'learning', 25),
('Smart Home Hero', 'Control 3 smart devices', 'smartthings', 30)
ON CONFLICT (name) DO NOTHING;

-- Insert test learning phases (Gujarati Module)
INSERT INTO learning_phases (name, description, module, order_number) VALUES
('Phase 1: Gujarati Alphabet', 'Learn Gujarati alphabets and basic sounds', 'gujarati', 1),
('Phase 2: Gujarati Numbers', 'Learn Gujarati number system and counting', 'gujarati', 2),
('Phase 3: Gujarati Vocabulary', 'Build Gujarati vocabulary with common words', 'gujarati', 3)
ON CONFLICT (name) DO NOTHING;
