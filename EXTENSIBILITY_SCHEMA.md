# Family Hub - Extensibility Schema (Phase 1 Enhancement)

**Date:** 2026-06-30  
**Status:** New - Extensibility Tables  
**Purpose:** Enable dynamic feature management, dashboard customization, and category extensibility without code changes

---

## Overview

These new tables create a plugin/module system that allows:
- ✅ Dynamic feature enablement per child
- ✅ Dashboard widget customization
- ✅ Flexible category management
- ✅ Per-child points configuration
- ✅ Complex badge unlock logic
- ✅ Extensible Home Automation device types

---

## New Tables

### 1. features

**Purpose:** Central registry of all features/modules in the system

```sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- 'wordle_game', 'quickfire_trivia', 'daily_quests', 'mood_tracker', 'voice_journal'
  display_name VARCHAR(255) NOT NULL, -- "Wordle Game", "Quick-Fire Trivia"
  description TEXT,
  icon_url VARCHAR(500),
  
  -- Feature Classification
  module_type VARCHAR(50) NOT NULL, -- 'activity_board', 'ha_dashboard', 'parent_portal', 'system'
  category VARCHAR(50), -- 'game', 'trivia', 'health', 'widget', 'automation'
  feature_type VARCHAR(50), -- 'game', 'activity', 'widget', 'automation', 'integration'
  
  -- Status & Visibility
  is_enabled BOOLEAN DEFAULT true, -- can be disabled globally
  is_visible BOOLEAN DEFAULT true, -- can be hidden from UI
  is_required BOOLEAN DEFAULT false, -- required for all children/parents
  min_age INTEGER, -- minimum age to enable
  max_age INTEGER,
  
  -- Version & Configuration
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  config JSONB DEFAULT '{}', -- global config for this feature
  
  -- Dependencies
  depends_on JSONB, -- ["trivia_questions", "points_system"]
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_module_type (module_type),
  INDEX idx_is_enabled (is_enabled),
  INDEX idx_name (name)
);
```

**Example Data:**
```json
[
  {
    "name": "wordle_game",
    "display_name": "Wordle Game",
    "module_type": "activity_board",
    "category": "game",
    "feature_type": "game",
    "is_enabled": true,
    "is_required": true,
    "version": "1.0.0"
  },
  {
    "name": "voice_journal",
    "display_name": "Voice Journal",
    "module_type": "activity_board",
    "category": "activity",
    "feature_type": "activity",
    "is_enabled": false,
    "version": "1.0.0"
  }
]
```

---

### 2. child_features

**Purpose:** Enable/disable features per individual child

```sql
CREATE TABLE child_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  
  -- Override global settings
  is_enabled BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  
  -- Child-specific configuration
  config JSONB DEFAULT '{}', -- overrides global feature config
  
  -- Tracking
  enabled_at TIMESTAMP,
  disabled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, feature_id),
  INDEX idx_child_id (child_id),
  INDEX idx_feature_id (feature_id),
  INDEX idx_is_enabled (is_enabled)
);
```

**Example:**
```json
{
  "child_id": "krish-uuid",
  "feature_id": "wordle_game-uuid",
  "is_enabled": true,
  "config": {
    "difficulty_preference": "medium",
    "daily_limit": 3
  }
}
```

---

### 3. dashboard_widgets

**Purpose:** Registry of all available dashboard widgets

```sql
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- 'weather', 'calendar', 'shopping_list', 'announcements', 'music_player', 'notes'
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Widget Classification
  widget_type VARCHAR(50) NOT NULL, -- 'weather', 'calendar', 'todo', 'media', 'smart_home', 'custom'
  dashboard_type VARCHAR(50), -- 'ha_dashboard', 'activity_board_dashboard'
  
  -- UI Properties
  icon_url VARCHAR(500),
  default_width VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'full'
  height_ratio FLOAT DEFAULT 1.0, -- aspect ratio
  is_resizable BOOLEAN DEFAULT true,
  is_draggable BOOLEAN DEFAULT true,
  
  -- Data & Configuration
  data_source VARCHAR(255), -- 'weather_api', 'google_calendar', 'local_storage'
  config_schema JSONB, -- JSON Schema for widget configuration validation
  
  -- Refresh & Performance
  refresh_interval_seconds INTEGER DEFAULT 300, -- auto-refresh interval
  cache_enabled BOOLEAN DEFAULT true,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  min_age INTEGER,
  max_age INTEGER,
  
  -- Version
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_widget_type (widget_type),
  INDEX idx_dashboard_type (dashboard_type),
  INDEX idx_is_enabled (is_enabled)
);
```

**Example Data:**
```json
[
  {
    "name": "weather_widget",
    "display_name": "Weather",
    "widget_type": "weather",
    "dashboard_type": "ha_dashboard",
    "default_width": "medium",
    "data_source": "weather_api",
    "config_schema": {
      "type": "object",
      "properties": {
        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
        "location": {"type": "string"}
      }
    }
  },
  {
    "name": "calendar_widget",
    "display_name": "Calendar",
    "widget_type": "calendar",
    "dashboard_type": "ha_dashboard",
    "data_source": "google_calendar"
  }
]
```

---

### 4. child_dashboard_layout

**Purpose:** Per-child dashboard customization

```sql
CREATE TABLE child_dashboard_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  dashboard_type VARCHAR(50) NOT NULL, -- 'ha_dashboard', 'activity_board'
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  
  -- Layout Properties
  position_order INTEGER NOT NULL, -- order on dashboard
  grid_column INTEGER, -- for grid-based layouts
  grid_row INTEGER,
  width VARCHAR(20), -- 'small', 'medium', 'large', 'full'
  height VARCHAR(20),
  
  -- Widget-specific configuration
  config JSONB DEFAULT '{}',
  
  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, dashboard_type, widget_id),
  INDEX idx_child_id (child_id),
  INDEX idx_dashboard_type (dashboard_type),
  INDEX idx_position_order (position_order)
);
```

**Example:**
```json
{
  "child_id": "krish-uuid",
  "dashboard_type": "ha_dashboard",
  "widget_id": "weather_widget-uuid",
  "position_order": 1,
  "grid_column": 1,
  "grid_row": 1,
  "width": "medium",
  "config": {
    "unit": "celsius",
    "location": "London"
  }
}
```

---

### 5. activity_categories

**Purpose:** Dynamic activity category management

```sql
CREATE TABLE activity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'games', 'homework', 'trivia', 'kung_fu', 'voice_journal', 'coding'
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- UI Properties
  icon_url VARCHAR(500),
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7), -- #FF5733
  
  -- Category Type
  category_type VARCHAR(50), -- 'activity', 'achievement', 'skill'
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  
  -- Grouping (for UI organization)
  parent_category_id UUID REFERENCES activity_categories(id) ON DELETE SET NULL,
  display_order INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  INDEX idx_parent_category_id (parent_category_id)
);
```

**Example Data:**
```json
[
  {
    "name": "games",
    "display_name": "Games",
    "icon_emoji": "🎮",
    "color_hex": "#FF6B6B",
    "category_type": "activity",
    "display_order": 1
  },
  {
    "name": "homework",
    "display_name": "Homework",
    "icon_emoji": "📚",
    "color_hex": "#4ECDC4",
    "category_type": "activity",
    "display_order": 2
  },
  {
    "name": "voice_journal",
    "display_name": "Voice Journal",
    "icon_emoji": "🎙️",
    "color_hex": "#FFE66D",
    "category_type": "activity",
    "is_active": false
  }
]
```

**Update activities table:**
```sql
ALTER TABLE activities 
  ADD COLUMN category_id UUID REFERENCES activity_categories(id),
  DROP COLUMN category;
```

---

### 6. points_config

**Purpose:** Per-child points configuration for flexibility

```sql
CREATE TABLE points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Activity Type Configuration
  activity_type VARCHAR(50) NOT NULL, -- 'game', 'quest', 'trivia', 'homework', 'habit'
  
  -- Points Settings
  base_points INTEGER NOT NULL DEFAULT 10,
  
  -- Difficulty Multipliers
  difficulty_multipliers JSONB NOT NULL DEFAULT '{"easy": 0.5, "medium": 1.0, "hard": 1.5, "expert": 2.0}',
  
  -- Time-based Bonuses
  time_bonus_enabled BOOLEAN DEFAULT false,
  time_bonus_config JSONB, -- {"threshold_minutes": 15, "bonus_percent": 10}
  
  -- Speed Bonus (for timed activities)
  speed_bonus_enabled BOOLEAN DEFAULT false,
  speed_bonus_config JSONB, -- {"threshold_percent": 50, "bonus_points": 5}
  
  -- Streak Bonuses
  streak_bonus_enabled BOOLEAN DEFAULT false,
  streak_bonus_config JSONB, -- {"min_streak": 3, "bonus_multiplier": 1.25}
  
  -- Daily/Weekly Caps
  daily_cap INTEGER DEFAULT 500,
  weekly_cap INTEGER DEFAULT 3000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, activity_type),
  INDEX idx_child_id (child_id),
  INDEX idx_activity_type (activity_type)
);
```

**Example:**
```json
{
  "child_id": "krish-uuid",
  "activity_type": "game",
  "base_points": 20,
  "difficulty_multipliers": {
    "easy": 0.5,
    "medium": 1.0,
    "hard": 1.5,
    "expert": 2.0
  },
  "time_bonus_enabled": true,
  "time_bonus_config": {
    "threshold_minutes": 15,
    "bonus_percent": 10
  },
  "daily_cap": 500
}
```

---

### 7. badge_unlock_logic

**Purpose:** Flexible badge unlock conditions

```sql
CREATE TABLE badge_unlock_logic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- 'first_quest', '7_day_streak', '500_points_earned'
  display_name VARCHAR(255),
  description TEXT,
  
  -- Rule Configuration
  rule_type VARCHAR(50) NOT NULL, -- 'activity_count', 'points_threshold', 'streak', 'time_based', 'composite', 'manual'
  config JSONB NOT NULL, -- rule-specific configuration
  
  -- Examples:
  -- activity_count: {"activity_type": "quest", "minimum": 1}
  -- points_threshold: {"total_points": 500}
  -- streak: {"category": "daily_quests", "minimum": 7}
  -- time_based: {"days_active": 30}
  -- composite: {"rules": ["rule_id_1", "rule_id_2"], "operator": "AND|OR"}
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_rule_type (rule_type)
);
```

**Example Data:**
```json
[
  {
    "name": "first_quest",
    "rule_type": "activity_count",
    "config": {
      "activity_type": "quest",
      "minimum": 1
    }
  },
  {
    "name": "quest_master_7_day",
    "rule_type": "composite",
    "config": {
      "rules": ["quest_count_10", "7_day_streak"],
      "operator": "AND"
    }
  }
]
```

**Update badges table:**
```sql
ALTER TABLE badges 
  ADD COLUMN unlock_logic_id UUID REFERENCES badge_unlock_logic(id),
  DROP COLUMN unlock_condition;
```

---

### 8. ha_device_types

**Purpose:** Extensible Home Automation device type registry

```sql
CREATE TABLE ha_device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'light', 'switch', 'thermostat', 'scene', 'fan', 'lock', 'vacuum'
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- UI Properties
  icon_url VARCHAR(500),
  icon_emoji VARCHAR(10),
  
  -- Supported Actions
  supported_actions JSONB NOT NULL, -- ["on", "off", "set_brightness", "set_color"]
  action_schema JSONB, -- JSON Schema for action parameters
  
  -- Configuration
  ha_domain VARCHAR(100), -- Home Assistant domain (light, switch, climate, etc.)
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
  INDEX idx_is_enabled (is_enabled)
);
```

**Example Data:**
```json
[
  {
    "name": "light",
    "display_name": "Light",
    "icon_emoji": "💡",
    "supported_actions": ["on", "off", "set_brightness", "set_color_temp"],
    "ha_domain": "light",
    "action_schema": {
      "type": "object",
      "properties": {
        "action": {"type": "string", "enum": ["on", "off", "set_brightness"]},
        "brightness": {"type": "integer", "minimum": 0, "maximum": 255}
      }
    }
  },
  {
    "name": "scene",
    "display_name": "Scene",
    "icon_emoji": "🎬",
    "supported_actions": ["activate"],
    "ha_domain": "scene"
  }
]
```

**Update automations table:**
```sql
ALTER TABLE automations 
  ADD COLUMN device_type_id UUID REFERENCES ha_device_types(id),
  DROP COLUMN device_type;
```

---

### 9. feature_flags

**Purpose:** A/B testing and gradual rollouts

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- 'enable_voice_journal', 'new_points_algorithm'
  display_name VARCHAR(255),
  description TEXT,
  
  -- Rollout Configuration
  is_enabled BOOLEAN DEFAULT false,
  rollout_percent FLOAT DEFAULT 0.0, -- 0-100, percentage of users to enable for
  
  -- Targeting
  target_user_type VARCHAR(50), -- 'parent', 'child', 'all'
  target_min_age INTEGER,
  target_max_age INTEGER,
  
  -- Beta Testers (specific users)
  beta_user_ids JSONB DEFAULT '[]',
  
  -- Scheduling
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
  INDEX idx_is_enabled (is_enabled)
);
```

---

### 10. roles_permissions

**Purpose:** Fine-grained role-based access control

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'super_admin', 'admin', 'parent', 'child', 'guardian'
  display_name VARCHAR(255),
  description TEXT,
  hierarchy_level INTEGER, -- 0=super_admin, 1=admin, 2=parent, 3=child (for inheritance)
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL, -- 'features.create', 'features.read', 'dashboard.customize'
  display_name VARCHAR(255),
  description TEXT,
  resource VARCHAR(100), -- 'features', 'dashboard', 'points', 'activities'
  action VARCHAR(50), -- 'create', 'read', 'update', 'delete', 'execute'
  is_system_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_resource (resource),
  INDEX idx_action (action)
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(role_id, permission_id),
  INDEX idx_role_id (role_id)
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, role_id),
  INDEX idx_user_id (user_id)
);
```

---

### 11. feature_dependencies

**Purpose:** Manage feature dependencies and validate enablement

```sql
CREATE TABLE feature_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  depends_on_feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  
  -- Dependency Type
  dependency_type VARCHAR(50) NOT NULL, -- 'required', 'optional', 'conflicts'
  
  -- Minimum version of dependency
  min_version VARCHAR(20),
  
  -- When dependency fails
  on_dependency_missing VARCHAR(50) DEFAULT 'disable', -- 'disable', 'warn', 'error'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(feature_id, depends_on_feature_id),
  INDEX idx_feature_id (feature_id)
);
```

---

### 12. widget_credentials

**Purpose:** Securely store API keys and credentials for widgets

```sql
CREATE TABLE widget_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- null = global
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null = global
  
  -- Credential Type
  credential_type VARCHAR(50) NOT NULL, -- 'api_key', 'oauth_token', 'username_password'
  service_name VARCHAR(255), -- 'weather_api', 'spotify', 'google_calendar'
  
  -- Encrypted credential storage
  credential_data JSONB NOT NULL, -- encrypted: {api_key, token, username, etc}
  
  -- Scope & Permissions
  scope JSONB, -- what the credential has access to
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMP,
  validation_error TEXT,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_widget_id (widget_id),
  INDEX idx_child_id (child_id),
  INDEX idx_service_name (service_name)
);
```

---

### 13. feature_analytics

**Purpose:** Track feature adoption and usage metrics

```sql
CREATE TABLE feature_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id), -- null = aggregate
  
  -- Metrics
  total_uses INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  average_session_duration_seconds INTEGER,
  
  -- Engagement
  weekly_active_users INTEGER,
  monthly_active_users INTEGER,
  churn_rate FLOAT, -- percentage of users who stopped using
  
  -- Satisfaction
  average_rating FLOAT DEFAULT 0.0, -- 1-5 stars
  review_count INTEGER DEFAULT 0,
  
  -- Performance
  average_load_time_ms INTEGER,
  error_rate FLOAT,
  
  -- Period
  date_period DATE, -- daily snapshot
  period_type VARCHAR(20) DEFAULT 'day', -- 'day', 'week', 'month'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_feature_id (feature_id),
  INDEX idx_child_id (child_id),
  INDEX idx_date_period (date_period)
);

CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id),
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  average_time_on_widget_seconds INTEGER,
  
  -- Date period
  date_period DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_widget_id (widget_id),
  INDEX idx_date_period (date_period)
);

CREATE TABLE flag_rollout_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  
  -- Metrics
  total_exposed_users INTEGER DEFAULT 0,
  users_with_flag_enabled INTEGER DEFAULT 0,
  conversion_rate FLOAT, -- if applicable
  error_rate FLOAT,
  
  -- Period
  date_period DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_flag_id (flag_id)
);
```

---

### 14. notification_preferences

**Purpose:** Per-child notification customization

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Notification Types & Toggles
  badge_unlocked BOOLEAN DEFAULT true,
  activity_completed BOOLEAN DEFAULT true,
  goal_progress BOOLEAN DEFAULT true,
  streak_broken BOOLEAN DEFAULT true,
  daily_reminder BOOLEAN DEFAULT true,
  achievement_unlocked BOOLEAN DEFAULT true,
  social_notification BOOLEAN DEFAULT true,
  system_announcement BOOLEAN DEFAULT true,
  
  -- Delivery Channels
  push_notifications BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'off'
  sms_enabled BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  
  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_start_time TIME, -- 21:00
  dnd_end_time TIME, -- 08:00
  dnd_days JSONB DEFAULT '["mon", "tue", "wed", "thu", "fri"]',
  
  -- Sound & Vibration
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id),
  INDEX idx_child_id (child_id)
);
```

---

### 15. theme_customizations

**Purpose:** Per-child theme and color customization

```sql
CREATE TABLE theme_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Theme Selection
  theme_type VARCHAR(50) DEFAULT 'seasonal', -- 'seasonal', 'custom', 'dark', 'light'
  seasonal_theme VARCHAR(50), -- 'spring', 'summer', 'fall', 'winter' (if seasonal)
  
  -- Color Customization
  primary_color VARCHAR(7), -- hex color
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  
  -- Font & Typography
  font_family VARCHAR(100) DEFAULT 'sans-serif',
  font_size_scale FLOAT DEFAULT 1.0, -- 0.8 = smaller, 1.2 = larger
  
  -- Visual Effects
  animations_enabled BOOLEAN DEFAULT true,
  reduce_motion BOOLEAN DEFAULT false,
  
  -- Accessibility
  high_contrast_mode BOOLEAN DEFAULT false,
  dyslexia_friendly_font BOOLEAN DEFAULT false,
  
  -- Saved Custom Schemes
  custom_schemes JSONB DEFAULT '[]', -- allow multiple custom schemes
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id),
  INDEX idx_child_id (child_id)
);
```

---

### 16. content_items

**Purpose:** Manage content (homework, books, trivia questions, etc.) as data

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content Classification
  content_type VARCHAR(50) NOT NULL, -- 'homework_assignment', 'book', 'trivia_question', 'challenge', 'prompt'
  category_id UUID REFERENCES activity_categories(id),
  
  -- Content Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL, -- varies by type
  
  -- Metadata
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  estimated_duration_minutes INTEGER,
  
  -- Sourcing & Attribution
  source VARCHAR(255), -- 'user_created', 'external_api', 'manual_upload'
  created_by UUID REFERENCES users(id),
  
  -- Status & Visibility
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_content_id UUID REFERENCES content_items(id), -- for revisions
  
  -- Tags & Search
  tags JSONB DEFAULT '[]', -- ["math", "algebra", "homework"]
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_content_type (content_type),
  INDEX idx_category_id (category_id),
  INDEX idx_is_published (is_published),
  INDEX idx_created_by (created_by)
);

CREATE TABLE content_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Usage Tracking
  used_at TIMESTAMP NOT NULL,
  completion_status VARCHAR(20), -- 'started', 'in_progress', 'completed', 'abandoned'
  feedback_score INTEGER, -- 1-5 stars
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_content_id (content_id),
  INDEX idx_child_id (child_id)
);
```

---

### 17. audit_trail

**Purpose:** Compliance & audit logging for all system changes

```sql
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Actor
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_type VARCHAR(50), -- 'parent', 'admin', 'system'
  
  -- What Changed
  resource_type VARCHAR(50) NOT NULL, -- 'feature', 'widget', 'points_config', 'child_settings'
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  
  -- Change Details
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'enable', 'disable'
  changes JSONB, -- {old_value, new_value}
  
  -- Context
  reason TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Related Entities
  child_id UUID REFERENCES children(id),
  parent_id UUID REFERENCES users(id),
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_actor_id (actor_id),
  INDEX idx_resource_type (resource_type),
  INDEX idx_resource_id (resource_id),
  INDEX idx_created_at (created_at)
);
```

---

### 18. feature_rate_limits

**Purpose:** Per-feature rate limiting configuration

```sql
CREATE TABLE feature_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- null = default for all
  
  -- Rate Limit Type
  limit_type VARCHAR(50) NOT NULL, -- 'daily', 'hourly', 'per_session', 'total'
  
  -- Limits
  max_uses_per_day INTEGER,
  max_uses_per_hour INTEGER,
  max_uses_per_session INTEGER,
  max_uses_total INTEGER,
  
  -- Cooldown
  cooldown_seconds_between_uses INTEGER,
  
  -- Response When Limited
  action_when_limited VARCHAR(50) DEFAULT 'block', -- 'block', 'warn', 'queue'
  
  -- Time Window
  applies_start_time TIME,
  applies_end_time TIME,
  applies_days JSONB DEFAULT '["mon", "tue", "wed", "thu", "fri", "sat", "sun"]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(feature_id, child_id),
  INDEX idx_feature_id (feature_id)
);
```

---

### 19. translations

**Purpose:** Multi-language support for features, widgets, and content

```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Translation Target
  resource_type VARCHAR(50) NOT NULL, -- 'feature', 'widget', 'category', 'content_item'
  resource_id UUID NOT NULL,
  
  -- Language
  language_code VARCHAR(10) NOT NULL, -- 'en', 'gu', 'es', 'fr'
  language_name VARCHAR(100),
  
  -- Translated Fields
  title VARCHAR(500),
  display_name VARCHAR(255),
  description TEXT,
  
  -- Custom Field Translations
  custom_fields JSONB, -- for widget/feature specific fields
  
  -- Status
  is_approved BOOLEAN DEFAULT false,
  is_machine_translated BOOLEAN DEFAULT false,
  
  -- Metadata
  translated_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(resource_type, resource_id, language_code),
  INDEX idx_resource_type (resource_type),
  INDEX idx_language_code (language_code)
);
```

---

---

## GAP TABLES (14 new tables for original feature support)

### 20. trivia_tracking

**Purpose:** Track question cycling and performance per child

```sql
CREATE TABLE trivia_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  trivia_question_id UUID NOT NULL REFERENCES content_items(id),
  
  -- Performance tracking
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  
  -- Cycling logic (14 days correct, 3-7 days incorrect)
  last_shown_date DATE,
  next_show_date DATE,
  last_shown_result VARCHAR(20), -- 'correct', 'incorrect'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, trivia_question_id),
  INDEX idx_child_id (child_id),
  INDEX idx_next_show_date (next_show_date)
);
```

---

### 21. daily_quest_rules

**Purpose:** Define constraints for daily quest generation algorithm

```sql
CREATE TABLE daily_quest_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_template_id UUID NOT NULL REFERENCES content_items(id),
  
  -- Generation constraints
  max_per_day INTEGER DEFAULT 1,
  type VARCHAR(50), -- 'points_quest', 'streak_quest', 'activity_quest'
  
  -- Conflicts (quests that can't appear same day)
  conflicts_with JSONB DEFAULT '[]', -- array of quest IDs
  
  -- Requirements
  requires_feature_id UUID REFERENCES features(id),
  min_age INTEGER,
  max_age INTEGER,
  
  -- Scheduling bias
  preferred_day_of_week VARCHAR(20),
  preferred_season VARCHAR(20),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_quest_template_id (quest_template_id),
  INDEX idx_type (type)
);
```

---

### 22. predefined_habits

**Purpose:** Manage 11 predefined habits and their properties

```sql
CREATE TABLE predefined_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- "Morning Exercise", "Read for 30 min"
  description TEXT,
  icon_emoji VARCHAR(10),
  
  -- Points
  points_per_completion INTEGER DEFAULT 5,
  streak_bonus_multiplier FLOAT DEFAULT 1.0,
  
  -- Equivalency mapping (linked activities)
  linked_activities JSONB DEFAULT '[]', -- ["Kung Fu", "Yoga", "Running"]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_is_active (is_active)
);
```

---

### 23. habit_recovery_tracking

**Purpose:** Track missed day recovery (1 free/month + points-based)

```sql
CREATE TABLE habit_recovery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  -- Missed day info
  missed_date DATE NOT NULL,
  
  -- Recovery details
  recovery_type VARCHAR(20) DEFAULT 'free', -- 'free', 'points_cost'
  recovery_cost_points INTEGER DEFAULT 0,
  recovery_used_at TIMESTAMP,
  
  -- Tracking
  free_recovery_used_this_month BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, habit_id, missed_date),
  INDEX idx_child_id (child_id),
  INDEX idx_missed_date (missed_date)
);
```

---

### 24. kung_fu_belt_levels

**Purpose:** Define belt progression system for Kung Fu module

```sql
CREATE TABLE kung_fu_belt_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- "White", "Yellow", "Orange", "Green", etc.
  color_hex VARCHAR(7),
  level_order INTEGER NOT NULL, -- 1, 2, 3, etc.
  
  description TEXT,
  requirements TEXT, -- What's needed to achieve this belt
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(level_order),
  INDEX idx_level_order (level_order)
);

-- Add to children table:
ALTER TABLE children ADD COLUMN current_belt_id UUID REFERENCES kung_fu_belt_levels(id);
```

---

### 25. quest_swaps

**Purpose:** Track daily quest swaps (1 free/day + points cost escalation)

```sql
CREATE TABLE quest_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  swap_date DATE NOT NULL,
  original_quest_id UUID NOT NULL REFERENCES content_items(id),
  swapped_quest_id UUID NOT NULL REFERENCES content_items(id),
  
  -- Swap cost
  is_free_swap BOOLEAN DEFAULT false, -- 1 free per day
  cost_points INTEGER DEFAULT 0,
  swap_order_today INTEGER DEFAULT 1, -- which swap this is (1st = free, 2nd+ = paid)
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_child_id (child_id),
  INDEX idx_swap_date (swap_date)
);
```

---

### 26. category_mastery_progress

**Purpose:** Track per-category mastery levels and unlock progression

```sql
CREATE TABLE category_mastery_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES activity_categories(id),
  
  -- Statistics
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percent FLOAT DEFAULT 0.0,
  
  -- Progression
  mastery_level INTEGER DEFAULT 1, -- 1=Rookie, 2=Pro, 3=Legend, 4=Master
  
  -- Unlock thresholds
  unlock_requirements JSONB DEFAULT '{"L1": 80, "L2": 80, "L3": 90}',
  
  -- Tracking
  last_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, category_id),
  INDEX idx_child_id (child_id),
  INDEX idx_mastery_level (mastery_level)
);
```

---

### 27. notification_types

**Purpose:** Catalog of 35+ notification types and their behaviors

```sql
CREATE TABLE notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'quest_completed', 'badge_unlocked'
  display_name VARCHAR(255),
  description TEXT,
  
  -- Behavior configuration
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  
  -- Display options
  show_in_activity_board BOOLEAN DEFAULT true,
  show_in_ha_dashboard BOOLEAN DEFAULT false,
  show_in_parent_portal BOOLEAN DEFAULT false,
  
  -- Customization
  icon_emoji VARCHAR(10),
  icon_url VARCHAR(500),
  
  -- Default preferences
  sound_enabled_default BOOLEAN DEFAULT true,
  vibration_enabled_default BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
  INDEX idx_priority (priority)
);
```

---

### 28. reading_entry_types

**Purpose:** Define 5 reading entry types (Book, Article, Blog, Story, Chapter)

```sql
CREATE TABLE reading_entry_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- "Book", "Article", "Blog Post", "Story", "Chapter"
  description TEXT,
  icon_emoji VARCHAR(10),
  
  -- Points calculation
  base_points_per_minute FLOAT DEFAULT 0.2, -- 1 pt per 5 min
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_is_active (is_active)
);
```

---

### 29. mood_settings

**Purpose:** Configure mood tracking preferences and alert thresholds

```sql
CREATE TABLE mood_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Alert configuration
  difficult_mood_threshold INTEGER DEFAULT 3, -- alert after 3+ difficult days
  difficult_mood_window_days INTEGER DEFAULT 7, -- within 7 days
  
  -- Notification preferences
  alert_parent_email BOOLEAN DEFAULT true,
  alert_parent_in_app BOOLEAN DEFAULT true,
  
  -- Privacy
  mood_entries_private BOOLEAN DEFAULT true, -- parent needs to explicitly reveal
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id),
  INDEX idx_child_id (child_id)
);
```

---

### 30. daily_challenge_rules

**Purpose:** Define Daily Challenge Mode sequencing and scoring

```sql
CREATE TABLE daily_challenge_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Challenge structure
  game_order INTEGER NOT NULL, -- 1, 2, 3, 4 (sequence of games)
  feature_id UUID NOT NULL REFERENCES features(id),
  
  -- Difficulty scaling
  difficulty_progression VARCHAR(50), -- 'static', 'increase_per_game'
  starting_difficulty VARCHAR(20) DEFAULT 'medium',
  
  -- Lives system
  lives_per_game INTEGER DEFAULT 1,
  total_lives_for_challenge INTEGER DEFAULT 3,
  
  -- Scoring
  base_multiplier FLOAT DEFAULT 2.5, -- 2.5x point multiplier
  clean_sweep_bonus_multiplier FLOAT DEFAULT 1.0, -- extra bonus if no lives lost
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(game_order),
  INDEX idx_feature_id (feature_id)
);
```

---

### 31. curriculum_phases

**Purpose:** Define 5-phase Gujarati learning curriculum

```sql
CREATE TABLE curriculum_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL UNIQUE, -- 1-5
  name VARCHAR(255),
  description TEXT,
  
  -- Structure
  total_lessons INTEGER,
  estimated_duration_hours INTEGER,
  
  -- Unlocking
  requires_previous_phase_completion BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_phase_number (phase_number)
);
```

---

### 32. lesson_components

**Purpose:** Define 4-component structure for Gujarati lessons

```sql
CREATE TABLE lesson_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  
  -- Component type
  component_type VARCHAR(100) NOT NULL, -- 'vocabulary', 'grammar', 'pronunciation', 'practice'
  
  -- Content
  content TEXT,
  media_url VARCHAR(500), -- audio, video, etc.
  
  -- Timing
  duration_minutes INTEGER,
  order_in_lesson INTEGER NOT NULL,
  
  -- Points
  completion_points INTEGER DEFAULT 5,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_lesson_id (lesson_id),
  INDEX idx_component_type (component_type)
);
```

---

### 33. reading_goals

**Purpose:** Track weekly reading time goals

```sql
CREATE TABLE reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  -- Goal configuration
  weekly_time_goal_minutes INTEGER DEFAULT 60,
  start_of_week_day INTEGER DEFAULT 1, -- 0=Sunday, 1=Monday
  
  -- Tracking
  current_week_minutes INTEGER DEFAULT 0,
  weeks_goal_met INTEGER DEFAULT 0, -- streak
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id),
  INDEX idx_child_id (child_id)
);
```

---

### 34. event_colors

**Purpose:** Define color palette for calendar event types

```sql
CREATE TABLE event_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100), -- "Activity", "Personal", "School", "Medical"
  hex_color VARCHAR(7), -- #FF5733
  rgb_value VARCHAR(20), -- 255, 87, 51
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name)
);
```

---

## Migration SQL (Add to Schema)

```sql
-- Create new tables in order (respecting foreign keys)
CREATE TABLE features (...);
CREATE TABLE child_features (...);
CREATE TABLE dashboard_widgets (...);
CREATE TABLE child_dashboard_layout (...);
CREATE TABLE activity_categories (...);
CREATE TABLE points_config (...);
CREATE TABLE badge_unlock_logic (...);
CREATE TABLE ha_device_types (...);
CREATE TABLE feature_flags (...);

-- Migrate existing data
INSERT INTO activity_categories (name, display_name, icon_emoji, color_hex, display_order)
VALUES 
  ('games', 'Games', '🎮', '#FF6B6B', 1),
  ('trivia', 'Trivia', '🧠', '#4ECDC4', 2),
  ('homework', 'Homework', '📚', '#95E1D3', 3),
  ('kung_fu', 'Kung Fu', '🥋', '#FFA07A', 4),
  ('habits', 'Habits', '✨', '#FFD700', 5),
  ('reading', 'Reading', '📖', '#87CEEB', 6),
  ('mood', 'Mood', '😊', '#FF69B4', 7),
  ('gujarati', 'Gujarati', '🇮🇳', '#FF8C00', 8);

-- Add initial HA device types
INSERT INTO ha_device_types (name, display_name, icon_emoji, supported_actions, ha_domain)
VALUES 
  ('light', 'Light', '💡', '["on", "off", "set_brightness", "set_color_temp"]', 'light'),
  ('switch', 'Switch', '🔌', '["on", "off"]', 'switch'),
  ('thermostat', 'Thermostat', '🌡️', '["set_temperature", "set_mode"]', 'climate'),
  ('scene', 'Scene', '🎬', '["activate"]', 'scene');

-- Create default features
INSERT INTO features (name, display_name, module_type, category, feature_type, is_required)
VALUES 
  ('wordle_game', 'Wordle Game', 'activity_board', 'game', 'game', true),
  ('quickfire_trivia', 'Quick-Fire Trivia', 'activity_board', 'game', 'game', true),
  ('daily_quests', 'Daily Quests', 'activity_board', 'activity', 'activity', true),
  ('badges', 'Badges', 'activity_board', 'achievement', 'system', true),
  ('points_system', 'Points System', 'activity_board', 'system', 'system', true);

-- Create default dashboard widgets
INSERT INTO dashboard_widgets (name, display_name, widget_type, dashboard_type, icon_emoji, data_source)
VALUES 
  ('weather_widget', 'Weather', 'weather', 'ha_dashboard', '🌤️', 'weather_api'),
  ('calendar_widget', 'Calendar', 'calendar', 'ha_dashboard', '📅', 'google_calendar'),
  ('shopping_list_widget', 'Shopping List', 'todo', 'ha_dashboard', '🛒', 'local_storage'),
  ('announcements_widget', 'Announcements', 'custom', 'ha_dashboard', '📢', 'local_storage');
```

---

## Complete Table Summary - PHASE 1 FULL

**Core Extensibility (9 tables):**
1. features - Feature registry
2. child_features - Per-child feature enablement
3. dashboard_widgets - Widget registry
4. child_dashboard_layout - Dashboard customization
5. activity_categories - Dynamic categories
6. points_config - Points configuration
7. badge_unlock_logic - Badge unlock conditions
8. ha_device_types - HA device types
9. feature_flags - A/B testing

**Advanced Features (10 tables):**
10. roles_permissions - Role-based access control (3 sub-tables)
11. feature_dependencies - Feature dependency management
12. widget_credentials - Secure credential storage
13. feature_analytics - Feature adoption metrics
14. notification_preferences - Per-child notifications
15. theme_customizations - Theme & color customization
16. content_items - Content management system
17. audit_trail - Compliance & audit logging
18. feature_rate_limits - Rate limiting per feature
19. translations - Multi-language support

**System Foundation (9 tables):**
20. validation_schemas - Data validation rules
21. api_quotas - API rate limiting
22. error_logs - Error tracking & recovery
23. workflow_states - State machine management
24. resource_state_history - State change audit trail

**Gap Tables - Original Feature Support (14 tables):**
25. trivia_tracking - Question cycling & performance
26. daily_quest_rules - Quest generation constraints
27. predefined_habits - 11 predefined habits
28. habit_recovery_tracking - Missed day recovery
29. kung_fu_belt_levels - Belt progression
30. quest_swaps - Daily quest swaps
31. category_mastery_progress - Mastery level tracking
32. notification_types - 35+ notification type catalog
33. reading_entry_types - 5 reading entry types
34. mood_settings - Mood thresholds & alerts
35. daily_challenge_rules - Challenge sequencing
36. curriculum_phases - Gujarati curriculum structure
37. lesson_components - Gujarati lesson components
38. reading_goals - Weekly reading goals
39. event_colors - Calendar event colors

**Total: 38 Tables** (plus 3 sub-tables for RBAC = 41 total)

---

## Summary of Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Adding new feature** | Code + DB migration | DB insert only |
| **Adding dashboard widget** | Code change + UI work | DB insert + config |
| **New activity category** | Code enum update | DB insert |
| **Per-child points** | Hard-coded in code | Config in database |
| **Badge unlock logic** | Static JSONB | Flexible logic engine |
| **Home Automation devices** | Hard-coded types | Type registry |
| **Scalability** | Limited to 2-3 kids | Infinite children |
| **Feature toggles** | Feature branches | Database config |
| **Admin permissions** | Undefined | Role-based access control |
| **Widget API keys** | Not possible | Secure credential storage |
| **Feature adoption** | Manual tracking | Built-in analytics |
| **User notifications** | Global settings | Per-child preferences |
| **UI customization** | Fixed themes | Full personalization |
| **Content management** | Hard-coded | Database-driven |
| **Audit & compliance** | No logging | Full audit trail |
| **Rate limiting** | Not available | Per-feature limits |
| **Localization** | Single language | Multi-language support |

---

**Status:** Ready for Phase 1 Implementation  
**Next:** Update API endpoints to manage these new tables

