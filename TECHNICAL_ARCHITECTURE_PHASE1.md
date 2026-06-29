# Family Hub - Technical Architecture (Phase 1)

**Date:** 2026-06-29  
**Phase:** Phase 1 - Technical Architecture Planning  
**Status:** In Progress  

---

## Part 1: Database Schema (PostgreSQL/Supabase)

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_parent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(20), -- 'sms', 'email', 'authenticator'
  recovery_codes_hash VARCHAR(255),
  trusted_devices_count INTEGER DEFAULT 0,
  
  -- Settings
  preferred_language VARCHAR(10) DEFAULT 'en',
  notification_settings JSONB DEFAULT '{}',
  
  -- Audit
  ip_address_last_login VARCHAR(50),
  device_info JSONB,
  
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
);
```

#### children
```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  date_of_birth DATE,
  pin_hash VARCHAR(255),
  pattern_hash VARCHAR(255),
  pattern_visibility BOOLEAN DEFAULT false, -- show path while drawing
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Session management
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
  last_activity_at TIMESTAMP,
  
  -- Daily tracking
  points_today INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  streak_last_broken_date DATE,
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_name (name)
);
```

#### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- For 2FA and device trust
  two_factor_verified_at TIMESTAMP,
  device_trusted_until TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_child_id (child_id),
  INDEX idx_expires_at (expires_at)
);
```

#### activities
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'quest', 'game', 'trivia', 'homework', etc.
  category VARCHAR(50) NOT NULL, -- 'games', 'trivia', 'homework', 'kung_fu', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'abandoned'
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  due_date DATE,
  due_time TIME,
  duration_minutes INTEGER, -- estimated duration
  
  -- Completion tracking
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  abandoned_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB, -- game-specific data, quiz answers, etc.
  
  INDEX idx_child_id (child_id),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_scheduled_date (scheduled_date)
);
```

#### points_ledger
```sql
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'earn', 'redeem', 'bonus', 'penalty'
  points_amount INTEGER NOT NULL,
  reason VARCHAR(255),
  multiplier FLOAT DEFAULT 1.0,
  
  -- Context
  category VARCHAR(50),
  game_name VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_child_id (child_id),
  INDEX idx_created_at (created_at),
  INDEX idx_transaction_type (transaction_type)
);
```

#### badges
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(100) UNIQUE NOT NULL, -- 'first_quest', 'gaming_master', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  category VARCHAR(50), -- 'achievement', 'milestone', 'challenge', 'streak', etc.
  tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  points_value INTEGER,
  
  -- Requirements
  unlock_condition JSONB, -- {"type": "activity_count", "value": 10}
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_category (category)
);
```

#### child_badges
```sql
CREATE TABLE child_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL,
  notified_at TIMESTAMP,
  
  UNIQUE(child_id, badge_id),
  INDEX idx_child_id (child_id),
  INDEX idx_unlocked_at (unlocked_at)
);
```

#### habits
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'exercise', 'study', 'health', etc.
  frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', etc.
  target_count INTEGER DEFAULT 1, -- times per period
  points_per_completion INTEGER DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'medium',
  
  -- Tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_child_id (child_id),
  INDEX idx_category (category)
);
```

#### habit_logs
```sql
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  completion_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(habit_id, logged_date),
  INDEX idx_habit_id (habit_id),
  INDEX idx_logged_date (logged_date)
);
```

#### goals
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50), -- 'weekly', 'monthly', 'custom'
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  
  -- Metrics
  target_metric VARCHAR(100), -- 'points', 'activities_completed', 'streaks', etc.
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  
  -- Rewards
  completion_bonus_points INTEGER,
  partial_credit_threshold FLOAT DEFAULT 0.5, -- 50%
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed_at TIMESTAMP,
  
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired', 'abandoned'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_child_id (child_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
);
```

#### streaks
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'daily_quests', 'homework', 'kung_fu', etc.
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_completed_date DATE,
  
  -- Streak recovery
  recovery_available BOOLEAN DEFAULT false,
  recovery_used_count INTEGER DEFAULT 0,
  max_recoveries INTEGER DEFAULT 5, -- per category
  recovery_cost_points INTEGER DEFAULT 50,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, category),
  INDEX idx_child_id (child_id),
  INDEX idx_category (category)
);
```

#### moods
```sql
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  mood_level INTEGER NOT NULL, -- 1-5 scale
  emoji VARCHAR(10), -- "😊", "😢", etc.
  notes TEXT,
  logged_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_child_id (child_id),
  INDEX idx_logged_at (logged_at)
);
```

#### events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- 'meal', 'school', 'appointment', 'personal', etc.
  
  -- Timing
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  timezone VARCHAR(50),
  
  -- Recurrence
  recurrence_rule VARCHAR(500), -- RFC 5545 RRULE format
  
  -- Calendar sync
  google_calendar_id VARCHAR(500),
  google_event_id VARCHAR(500),
  outlook_event_id VARCHAR(500),
  apple_event_id VARCHAR(500),
  
  last_sync_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_start_date (start_date)
);
```

#### calendar_sync_log
```sql
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  provider VARCHAR(50), -- 'google', 'outlook', 'apple'
  direction VARCHAR(20), -- 'push', 'pull'
  status VARCHAR(20), -- 'success', 'conflict', 'error'
  conflict_data JSONB,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_synced_at (synced_at)
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'badge', 'goal', 'streak', 'announcement'
  title VARCHAR(255),
  body TEXT,
  data JSONB, -- contextual data (badge_id, goal_id, etc.)
  
  -- Delivery tracking
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Do-not-disturb
  should_respect_dnd BOOLEAN DEFAULT true,
  dnd_queue BOOLEAN DEFAULT false, -- queued during quiet hours
  
  -- Device targeting
  device_target VARCHAR(50), -- 'all', 'mobile', 'monitor', 'portal'
  fcm_token VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_notification_type (notification_type),
  INDEX idx_sent_at (sent_at)
);
```

#### automations
```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  automation_type VARCHAR(50) NOT NULL, -- 'schedule', 'trigger', 'conditional'
  
  -- Trigger
  trigger_type VARCHAR(50), -- 'time_based', 'activity_based', 'point_based'
  trigger_config JSONB, -- {"time": "08:00", "days": ["mon", "wed"]}
  
  -- Actions
  device_type VARCHAR(50), -- 'light', 'thermostat', 'speaker', etc.
  device_id VARCHAR(255), -- Home Assistant entity ID
  action VARCHAR(50), -- 'on', 'off', 'set_brightness', etc.
  action_value VARCHAR(255),
  
  -- Home Assistant integration
  ha_automation_id VARCHAR(500),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Rate limiting
  last_triggered_at TIMESTAMP,
  trigger_count_today INTEGER DEFAULT 0,
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_is_active (is_active)
);
```

#### audit_log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id),
  child_id UUID REFERENCES children(id),
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- 'activity', 'goal', 'pin', 'automation', etc.
  resource_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  device_info JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_child_id (child_id),
  INDEX idx_created_at (created_at)
);
```

#### sync_queue
```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50), -- 'create', 'update', 'delete'
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  payload JSONB,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  error_message TEXT,
  
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  
  INDEX idx_device_id (device_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

---

## Part 2: API Endpoints (REST)

### Authentication Endpoints

#### POST /auth/register
**Purpose:** Parent creates account  
**Scope:** Public (no auth required)

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "timezone": "America/New_York"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "parent@example.com",
  "full_name": "John Doe",
  "token": "jwt_token_here",
  "expires_in": 3600
}
```

---

#### POST /auth/login
**Purpose:** Parent or Krish logs in  
**Scope:** Public (no auth required)

**Request (Parent):**
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123!",
  "device_info": {
    "device_type": "monitor",
    "os": "Linux",
    "app_version": "1.0.0"
  }
}
```

**Request (Child with PIN):**
```json
{
  "child_id": "uuid",
  "pin": "1234",
  "device_info": {
    "device_type": "monitor",
    "os": "Linux"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "token": "jwt_token",
  "expires_in": 3600,
  "user_type": "parent|child",
  "requires_2fa": false
}
```

---

#### POST /auth/2fa/verify
**Purpose:** Verify 2FA code  
**Scope:** Public (partially authenticated)

**Request:**
```json
{
  "session_id": "temp_session_id",
  "code": "123456",
  "trust_device": true,
  "trust_days": 30
}
```

**Response (200 OK):**
```json
{
  "token": "jwt_token",
  "expires_in": 3600,
  "device_trusted_until": "2026-07-29"
}
```

---

#### POST /auth/refresh
**Purpose:** Refresh expired token  
**Scope:** Authenticated

**Request:**
```json
{
  "refresh_token": "refresh_token_value"
}
```

**Response (200 OK):**
```json
{
  "token": "new_jwt_token",
  "expires_in": 3600
}
```

---

#### POST /auth/logout
**Purpose:** Logout user  
**Scope:** Authenticated

**Response (204 No Content)**

---

### Child Management Endpoints

#### POST /children
**Purpose:** Parent creates child account  
**Scope:** Authenticated (parent only)

**Request:**
```json
{
  "name": "Krish",
  "date_of_birth": "2015-03-15",
  "pin": "1234",
  "use_pattern": true,
  "pattern_visibility": false
}
```

**Response (201 Created):**
```json
{
  "id": "child_uuid",
  "name": "Krish",
  "avatar_url": "https://...",
  "streak_count": 0,
  "points_total": 0
}
```

---

#### PUT /children/{child_id}/pin
**Purpose:** Krish or parent changes PIN  
**Scope:** Authenticated (child or parent)

**Request:**
```json
{
  "old_pin": "1234",
  "new_pin": "5678"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "PIN updated successfully"
}
```

---

#### PUT /children/{child_id}/login-session
**Purpose:** Track last activity time  
**Scope:** Authenticated (child)

**Request:**
```json
{
  "last_activity_at": "2026-06-29T14:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "session_expires_at": "2026-06-29T22:30:00Z"
}
```

---

### Activity Endpoints

#### POST /activities
**Purpose:** Create activity (quest, game, homework, etc.)  
**Scope:** Authenticated (parent creates, child interacts)

**Request (Parent):**
```json
{
  "child_id": "child_uuid",
  "activity_type": "homework",
  "category": "homework",
  "title": "Math Assignment Chapter 5",
  "description": "Complete exercises 1-20",
  "points_earned": 100,
  "difficulty": "medium",
  "due_date": "2026-06-30",
  "due_time": "18:00"
}
```

**Response (201 Created):**
```json
{
  "id": "activity_uuid",
  "title": "Math Assignment Chapter 5",
  "status": "pending",
  "points_earned": 100,
  "created_at": "2026-06-29T10:00:00Z"
}
```

---

#### GET /activities
**Purpose:** List activities for child  
**Scope:** Authenticated

**Query Parameters:**
- `child_id` (required)
- `category` (optional)
- `status` (optional): pending, in_progress, completed, abandoned
- `start_date` (optional)
- `end_date` (optional)
- `limit` (default 50)
- `offset` (default 0)

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "activity_uuid",
      "title": "Math Assignment Chapter 5",
      "category": "homework",
      "status": "pending",
      "points_earned": 100,
      "difficulty": "medium",
      "due_date": "2026-06-30",
      "progress": 0,
      "created_at": "2026-06-29T10:00:00Z"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

---

#### PUT /activities/{activity_id}
**Purpose:** Update activity status  
**Scope:** Authenticated

**Request:**
```json
{
  "status": "completed",
  "completed_at": "2026-06-29T16:45:00Z",
  "metadata": {
    "score": 95
  }
}
```

**Response (200 OK):**
```json
{
  "id": "activity_uuid",
  "status": "completed",
  "points_earned": 100,
  "completed_at": "2026-06-29T16:45:00Z"
}
```

---

### Points & Badges Endpoints

#### GET /points/summary
**Purpose:** Get points summary for child  
**Scope:** Authenticated

**Query Parameters:**
- `child_id` (required)
- `period` (optional): today, week, month, all (default all)

**Response (200 OK):**
```json
{
  "total_points": 2450,
  "today_points": 150,
  "week_points": 850,
  "month_points": 2450,
  "daily_goal": 50,
  "daily_progress": 3,
  "breakdown": {
    "quests": 1200,
    "games": 800,
    "trivia": 350,
    "habits": 100
  }
}
```

---

#### GET /badges
**Purpose:** Get all available badges  
**Scope:** Authenticated

**Response (200 OK):**
```json
{
  "badges": [
    {
      "id": "badge_uuid",
      "key": "first_quest",
      "name": "First Quest",
      "description": "Complete your first quest",
      "icon_url": "https://...",
      "category": "achievement",
      "tier": "bronze",
      "points_value": 0
    }
  ],
  "total": 150
}
```

---

#### GET /children/{child_id}/badges
**Purpose:** Get child's unlocked badges  
**Scope:** Authenticated

**Response (200 OK):**
```json
{
  "unlocked_badges": [
    {
      "badge_id": "badge_uuid",
      "name": "First Quest",
      "icon_url": "https://...",
      "unlocked_at": "2026-06-20T14:30:00Z"
    }
  ],
  "total_unlocked": 5,
  "total_available": 150
}
```

---

### Habits Endpoints

#### POST /habits
**Purpose:** Create habit  
**Scope:** Authenticated (parent creates)

**Request:**
```json
{
  "child_id": "child_uuid",
  "name": "Morning Exercise",
  "category": "exercise",
  "frequency": "daily",
  "target_count": 1,
  "points_per_completion": 25,
  "difficulty": "medium"
}
```

**Response (201 Created):**
```json
{
  "id": "habit_uuid",
  "name": "Morning Exercise",
  "current_streak": 0,
  "total_completions": 0
}
```

---

#### POST /habits/{habit_id}/log
**Purpose:** Log habit completion  
**Scope:** Authenticated (child)

**Request:**
```json
{
  "completion_count": 1,
  "notes": "Did 20 push-ups"
}
```

**Response (201 Created):**
```json
{
  "id": "log_uuid",
  "habit_id": "habit_uuid",
  "completion_count": 1,
  "streak_updated": 5,
  "points_awarded": 25,
  "logged_at": "2026-06-29T06:30:00Z"
}
```

---

### Goals Endpoints

#### POST /goals
**Purpose:** Create goal  
**Scope:** Authenticated (parent creates)

**Request:**
```json
{
  "child_id": "child_uuid",
  "title": "Read 3 Books This Month",
  "goal_type": "monthly",
  "difficulty": "medium",
  "target_metric": "books_read",
  "target_value": 3,
  "completion_bonus_points": 150,
  "start_date": "2026-06-01",
  "end_date": "2026-06-30"
}
```

**Response (201 Created):**
```json
{
  "id": "goal_uuid",
  "title": "Read 3 Books This Month",
  "status": "active",
  "current_value": 0,
  "target_value": 3,
  "progress_percent": 0
}
```

---

#### GET /goals/{goal_id}/progress
**Purpose:** Get goal progress  
**Scope:** Authenticated

**Response (200 OK):**
```json
{
  "id": "goal_uuid",
  "title": "Read 3 Books This Month",
  "status": "active",
  "current_value": 2,
  "target_value": 3,
  "progress_percent": 67,
  "days_remaining": 2,
  "completion_bonus": 150
}
```

---

### Streaks Endpoints

#### GET /streaks
**Purpose:** Get all streaks for child  
**Scope:** Authenticated

**Query Parameters:**
- `child_id` (required)

**Response (200 OK):**
```json
{
  "streaks": [
    {
      "category": "daily_quests",
      "current_count": 7,
      "longest_count": 12,
      "last_completed_date": "2026-06-29",
      "recovery_available": true,
      "recovery_used_count": 0,
      "max_recoveries": 5
    }
  ]
}
```

---

#### POST /streaks/{category}/recovery
**Purpose:** Use streak recovery  
**Scope:** Authenticated (parent or child)

**Request:**
```json
{
  "child_id": "child_uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "streak_recovered": true,
  "current_count": 6,
  "recovery_cost": 50,
  "recoveries_remaining": 4
}
```

---

### Events/Calendar Endpoints

#### POST /events
**Purpose:** Create or sync calendar event  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "title": "Doctor's Appointment",
  "event_type": "appointment",
  "start_date": "2026-07-05",
  "start_time": "14:00",
  "end_time": "15:00",
  "timezone": "America/New_York",
  "sync_to_calendars": ["google", "outlook"],
  "all_day": false
}
```

**Response (201 Created):**
```json
{
  "id": "event_uuid",
  "title": "Doctor's Appointment",
  "start_date": "2026-07-05",
  "start_time": "14:00",
  "synced_to": {
    "google": "event_id_123",
    "outlook": "event_id_456"
  },
  "created_at": "2026-06-29T10:00:00Z"
}
```

---

#### GET /events
**Purpose:** List events  
**Scope:** Authenticated

**Query Parameters:**
- `start_date` (required)
- `end_date` (required)
- `include_synced` (optional, default true)

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": "event_uuid",
      "title": "Doctor's Appointment",
      "event_type": "appointment",
      "start_date": "2026-07-05",
      "start_time": "14:00",
      "synced_to": ["google", "outlook"]
    }
  ]
}
```

---

### Sync Queue Endpoints

#### POST /sync/queue
**Purpose:** Queue action for offline sync  
**Scope:** Authenticated

**Request:**
```json
{
  "action_type": "create",
  "resource_type": "activity",
  "payload": {
    "title": "New Quest",
    "points": 50
  }
}
```

**Response (201 Created):**
```json
{
  "id": "queue_id",
  "status": "pending",
  "created_at": "2026-06-29T14:30:00Z"
}
```

---

#### POST /sync/batch
**Purpose:** Sync batched offline actions  
**Scope:** Authenticated

**Request:**
```json
{
  "sync_items": [
    {
      "id": "queue_id_1",
      "status": "completed"
    },
    {
      "id": "queue_id_2",
      "status": "in_progress"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "synced_count": 2,
  "failed_count": 0,
  "results": [
    {
      "queue_id": "queue_id_1",
      "status": "synced",
      "resource_id": "activity_uuid"
    }
  ]
}
```

---

### Notifications Endpoints

#### GET /notifications
**Purpose:** Get notifications for user  
**Scope:** Authenticated

**Query Parameters:**
- `unread_only` (optional, default false)
- `limit` (default 20)
- `offset` (default 0)

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "notif_uuid",
      "type": "badge_unlocked",
      "title": "Badge Unlocked!",
      "body": "You unlocked 'Gaming Master'",
      "data": {
        "badge_id": "badge_uuid"
      },
      "sent_at": "2026-06-29T10:00:00Z",
      "read": false
    }
  ],
  "total": 5,
  "unread_count": 2
}
```

---

#### PUT /notifications/{notif_id}/read
**Purpose:** Mark notification as read  
**Scope:** Authenticated

**Response (200 OK):**
```json
{
  "read_at": "2026-06-29T14:35:00Z"
}
```

---

### Automations/Smart Home Endpoints

#### POST /automations
**Purpose:** Create automation  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "name": "Morning Light",
  "automation_type": "schedule",
  "trigger_type": "time_based",
  "trigger_config": {
    "time": "08:00",
    "days": ["mon", "tue", "wed", "thu", "fri"]
  },
  "device_type": "light",
  "device_id": "light.bedroom",
  "action": "on",
  "action_value": null
}
```

**Response (201 Created):**
```json
{
  "id": "automation_uuid",
  "name": "Morning Light",
  "is_active": true,
  "ha_automation_id": "automation.morning_light"
}
```

---

#### GET /automations
**Purpose:** List automations  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "automations": [
    {
      "id": "automation_uuid",
      "name": "Morning Light",
      "device_type": "light",
      "device_id": "light.bedroom",
      "is_active": true,
      "trigger_count_today": 1,
      "last_triggered_at": "2026-06-29T08:00:15Z"
    }
  ]
}
```

---

### Parent Portal Endpoints

#### GET /parent/dashboard
**Purpose:** Get parent dashboard data  
**Scope:** Authenticated (parent)

**Query Parameters:**
- `child_id` (required)
- `period` (optional): day, week, month, all (default week)

**Response (200 OK):**
```json
{
  "child_name": "Krish",
  "points_summary": {
    "today": 150,
    "week": 850,
    "month": 2450
  },
  "streaks": {
    "daily_quests": 7,
    "homework": 3
  },
  "recent_activities": [
    {
      "id": "activity_uuid",
      "title": "Math Quest",
      "completed_at": "2026-06-29T16:45:00Z",
      "points": 100
    }
  ],
  "badges_unlocked_count": 5,
  "goals": {
    "active": 2,
    "completed": 1
  },
  "mood_today": 4,
  "last_activity": "2026-06-29T16:45:00Z"
}
```

---

#### GET /parent/analytics
**Purpose:** Get analytics and insights  
**Scope:** Authenticated (parent)

**Query Parameters:**
- `child_id` (required)
- `metric` (optional): points, activities, habits, mood, engagement
- `start_date` (required)
- `end_date` (required)

**Response (200 OK):**
```json
{
  "metric": "points",
  "start_date": "2026-06-22",
  "end_date": "2026-06-29",
  "data_points": [
    {
      "date": "2026-06-22",
      "value": 120
    },
    {
      "date": "2026-06-23",
      "value": 240
    }
  ],
  "summary": {
    "total": 1050,
    "average": 150,
    "trend": "increasing"
  }
}
```

---

## Part 3: State Management Architecture (Riverpod)

### Provider Structure

```dart
// lib/providers/auth_provider.dart
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(supabaseClientProvider));
});

final currentUserProvider = FutureProvider<User?>((ref) {
  return ref.watch(authStateProvider).when(
    authenticated: (user) => Future.value(user),
    unauthenticated: () => Future.value(null),
    loading: () => Future.value(null),
  );
});
```

```dart
// lib/providers/child_provider.dart
final currentChildProvider = StateProvider<Child?>((ref) => null);

final childActivitiesProvider = FutureProvider.family<List<Activity>, String>((ref, childId) async {
  final supabase = ref.watch(supabaseClientProvider);
  return supabase
    .from('activities')
    .select()
    .eq('child_id', childId)
    .order('created_at', ascending: false)
    .then((data) => (data as List).map((e) => Activity.fromJson(e)).toList());
});
```

```dart
// lib/providers/points_provider.dart
final pointsSummaryProvider = FutureProvider.family<PointsSummary, String>((ref, childId) async {
  final supabase = ref.watch(supabaseClientProvider);
  final response = await supabase
    .from('points_ledger')
    .select()
    .eq('child_id', childId);
  
  return _calculatePointsSummary(response as List);
});
```

---

### Event Bus (Real-time Updates)

```dart
// lib/services/event_bus.dart
class EventBus {
  final _eventController = StreamController<AppEvent>.broadcast();
  
  Stream<AppEvent> get events => _eventController.stream;
  
  void emit(AppEvent event) => _eventController.add(event);
  
  void dispose() => _eventController.close();
}

abstract class AppEvent {
  const AppEvent();
}

class ActivityCompletedEvent extends AppEvent {
  final String activityId;
  final int pointsEarned;
  ActivityCompletedEvent({required this.activityId, required this.pointsEarned});
}

class BadgeUnlockedEvent extends AppEvent {
  final String badgeId;
  final String badgeName;
  BadgeUnlockedEvent({required this.badgeId, required this.badgeName});
}
```

---

### Sync Service

```dart
// lib/services/sync_service.dart
class SyncService {
  final Supabase supabase;
  final LocalStorage localStorage;
  final EventBus eventBus;
  
  Future<void> syncOfflineQueue() async {
    final queue = await localStorage.getSyncQueue();
    
    for (final item in queue) {
      try {
        await _syncItem(item);
        await localStorage.markSynced(item.id);
      } catch (e) {
        await localStorage.retryLater(item.id);
      }
    }
  }
  
  Future<void> _syncItem(SyncQueueItem item) async {
    // Batch items by type
    // Send to backend
    // Process response
    // Update local storage
  }
}
```

---

## Part 4: Component Architecture (Flutter)

### Screen Hierarchy

```
MonitorApp
├── LoginScreen (parent/child login)
├── MainScreen (authenticated)
│   ├── HADashboardScreen (home)
│   ├── ActivityBoardScreen (games, quests, etc.)
│   │   ├── GamesSection
│   │   ├── TriviaSection
│   │   ├── QuestsSection
│   │   ├── SettingsSection
│   │   └── FAQSection
│   ├── ParentPortalScreen (login required)
│   │   ├── DashboardTab
│   │   ├── ActivityBoardControlTab
│   │   ├── AnalyticsTab
│   │   ├── SettingsTab
│   │   └── UserManagementTab
│   └── SettingsScreen (app settings)
└── OnboardingScreen (first-time setup)
```

### Shared Components

```
lib/shared/
├── widgets/
│  ├── BottomNavBar.dart
│  ├── Card.dart
│  ├── Button.dart
│  ├── Dialog.dart
│  ├── Loading.dart
│  ├── Error.dart
│  └── Modal.dart
├── constants/
│  ├── colors.dart
│  ├── typography.dart
│  ├── spacing.dart
│  └── themes.dart
└── utils/
   ├── validators.dart
   ├── formatters.dart
   └── helpers.dart
```

---

## Part 5: Firebase Integration

### Analytics Events

```dart
final analytics = FirebaseAnalytics.instance;

// Activity completion
analytics.logEvent(
  name: 'activity_completed',
  parameters: {
    'activity_type': 'quest',
    'points_earned': 100,
    'difficulty': 'medium',
  },
);

// Badge unlocked
analytics.logEvent(
  name: 'badge_unlocked',
  parameters: {
    'badge_key': 'first_quest',
    'badge_tier': 'bronze',
  },
);
```

### Firebase Crashlytics

```dart
final crashlytics = FirebaseCrashlytics.instance;

try {
  // risky operation
} catch (e, stackTrace) {
  crashlytics.recordError(e, stackTrace);
}
```

---

## Part 6: Home Assistant Integration

### REST API Calls

```dart
// Turn on light
POST /api/services/light/turn_on
{
  "entity_id": "light.bedroom",
  "brightness": 255,
  "color_temp": 3000
}

// Get entity state
GET /api/states/light.bedroom
Response: {
  "entity_id": "light.bedroom",
  "state": "on",
  "attributes": {
    "brightness": 255,
    "color_temp": 3000
  }
}
```

### WebSocket Integration

```dart
// Subscribe to state changes
const_msg = {
  "type": "subscribe_events",
  "event_type": "state_changed"
}

// Receive updates
{
  "type": "event",
  "event": {
    "entity_id": "light.bedroom",
    "new_state": {"state": "on", "attributes": {...}}
  }
}
```

---

## Part 7: Offline Storage (Isar)

### Isar Collections

```dart
@Collection()
class CachedActivity {
  Id id = Isar.autoIncrement;
  late String activityId;
  late String title;
  late String status;
  late DateTime createdAt;
  late DateTime? syncedAt;
}

@Collection()
class SyncQueueItem {
  Id id = Isar.autoIncrement;
  late String action;
  late String resourceType;
  late DateTime createdAt;
  late bool synced;
}
```

---

## Next Steps

1. **Database Migration:** Create PostgreSQL schema in Supabase
2. **Backend API:** Implement Supabase functions or custom backend
3. **Flutter Project Setup:** Initialize Flutter project structure
4. **Riverpod Providers:** Build state management layer
5. **Home Assistant Integration:** Test REST/WebSocket connection
6. **Offline Storage:** Setup Isar and sync logic
7. **UI Implementation:** Start with core screens (login, dashboard, activities)

---

**Status:** Phase 1 Technical Architecture - In Progress  
**Next Review:** After schema validation and API endpoint testing

