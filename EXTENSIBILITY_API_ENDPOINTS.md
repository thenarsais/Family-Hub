# Family Hub - Extensibility API Endpoints

**Date:** 2026-06-30  
**Status:** New API Endpoints for Dynamic System Management  
**Purpose:** Enable management of features, widgets, categories, and configurations without code changes

---

## Overview

New endpoints for managing the extensible architecture:
- Feature management & enablement
- Dashboard widget management & customization
- Category management
- Points configuration per child
- Badge unlock logic management
- Device type management
- Feature flags & A/B testing

---

## 1. Features API

### GET /admin/features
**Purpose:** Get all available features  
**Scope:** Admin/Parent  
**Auth:** Required (admin level)

**Query Parameters:**
- `module_type` (optional): 'activity_board', 'ha_dashboard', 'parent_portal'
- `is_enabled` (optional): true/false
- `limit` (default 50)
- `offset` (default 0)

**Response (200 OK):**
```json
{
  "features": [
    {
      "id": "feature_uuid",
      "name": "wordle_game",
      "display_name": "Wordle Game",
      "module_type": "activity_board",
      "category": "game",
      "is_enabled": true,
      "is_required": true,
      "version": "1.0.0",
      "config": {}
    }
  ],
  "total": 25
}
```

---

### POST /admin/features
**Purpose:** Create new feature  
**Scope:** Admin only  
**Auth:** Required (admin level)

**Request:**
```json
{
  "name": "voice_journal",
  "display_name": "Voice Journal",
  "description": "Record voice journal entries",
  "module_type": "activity_board",
  "category": "activity",
  "feature_type": "activity",
  "icon_url": "https://...",
  "is_enabled": false,
  "is_required": false,
  "min_age": 8,
  "version": "1.0.0",
  "config": {
    "max_duration_seconds": 300,
    "auto_transcribe": false
  }
}
```

**Response (201 Created):**
```json
{
  "id": "feature_uuid",
  "name": "voice_journal",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/features/{feature_id}
**Purpose:** Update feature configuration  
**Scope:** Admin only

**Request:**
```json
{
  "is_enabled": true,
  "config": {
    "max_duration_seconds": 600
  }
}
```

**Response (200 OK):**
```json
{
  "id": "feature_uuid",
  "updated_at": "2026-06-30T10:05:00Z"
}
```

---

### GET /children/{child_id}/features
**Purpose:** Get features enabled for specific child  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "features": [
    {
      "feature_id": "wordle_game_uuid",
      "name": "wordle_game",
      "display_name": "Wordle Game",
      "is_enabled": true,
      "config": {
        "difficulty_preference": "medium",
        "daily_limit": 3
      }
    }
  ],
  "total": 18
}
```

---

### PUT /children/{child_id}/features/{feature_id}
**Purpose:** Enable/disable feature for child  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "is_enabled": true,
  "config": {
    "difficulty_preference": "easy",
    "daily_limit": 2
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "child_id": "child_uuid",
  "feature_id": "feature_uuid",
  "is_enabled": true
}
```

---

## 2. Dashboard Widgets API

### GET /admin/dashboard-widgets
**Purpose:** Get all available dashboard widgets  
**Scope:** Admin

**Query Parameters:**
- `widget_type` (optional)
- `dashboard_type` (optional)
- `is_enabled` (optional)

**Response (200 OK):**
```json
{
  "widgets": [
    {
      "id": "widget_uuid",
      "name": "weather_widget",
      "display_name": "Weather",
      "widget_type": "weather",
      "dashboard_type": "ha_dashboard",
      "default_width": "medium",
      "icon_url": "https://...",
      "data_source": "weather_api",
      "is_enabled": true,
      "version": "1.0.0"
    }
  ],
  "total": 8
}
```

---

### POST /admin/dashboard-widgets
**Purpose:** Create new dashboard widget  
**Scope:** Admin

**Request:**
```json
{
  "name": "music_player",
  "display_name": "Music Player",
  "description": "Play music and manage playlists",
  "widget_type": "media",
  "dashboard_type": "ha_dashboard",
  "icon_url": "https://...",
  "default_width": "large",
  "data_source": "spotify_api",
  "config_schema": {
    "type": "object",
    "properties": {
      "spotify_token": {"type": "string"},
      "playlist_id": {"type": "string"}
    }
  },
  "refresh_interval_seconds": 0
}
```

**Response (201 Created):**
```json
{
  "id": "widget_uuid",
  "name": "music_player",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### GET /children/{child_id}/dashboard/{dashboard_type}
**Purpose:** Get child's dashboard layout & widgets  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "dashboard_type": "ha_dashboard",
  "widgets": [
    {
      "widget_id": "weather_widget_uuid",
      "name": "weather_widget",
      "display_name": "Weather",
      "position_order": 1,
      "grid_column": 1,
      "grid_row": 1,
      "width": "medium",
      "is_visible": true,
      "config": {
        "unit": "celsius",
        "location": "London"
      }
    },
    {
      "widget_id": "calendar_widget_uuid",
      "name": "calendar_widget",
      "display_name": "Calendar",
      "position_order": 2,
      "grid_column": 2,
      "grid_row": 1,
      "width": "medium",
      "is_visible": true
    }
  ]
}
```

---

### PUT /children/{child_id}/dashboard/{dashboard_type}/widgets/{widget_id}
**Purpose:** Add/update widget on child's dashboard  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "position_order": 1,
  "grid_column": 1,
  "grid_row": 1,
  "width": "large",
  "is_visible": true,
  "config": {
    "unit": "celsius",
    "location": "London"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "widget_id": "weather_widget_uuid",
  "position_order": 1
}
```

---

### DELETE /children/{child_id}/dashboard/{dashboard_type}/widgets/{widget_id}
**Purpose:** Remove widget from child's dashboard  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "success": true,
  "removed_widget": "weather_widget_uuid"
}
```

---

### POST /children/{child_id}/dashboard/{dashboard_type}/reset
**Purpose:** Reset dashboard to default layout  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "success": true,
  "widgets_restored": 4
}
```

---

## 3. Activity Categories API

### GET /admin/activity-categories
**Purpose:** Get all activity categories  
**Scope:** Admin

**Query Parameters:**
- `is_active` (optional)
- `category_type` (optional)

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "category_uuid",
      "name": "games",
      "display_name": "Games",
      "icon_emoji": "🎮",
      "color_hex": "#FF6B6B",
      "category_type": "activity",
      "is_active": true,
      "display_order": 1
    }
  ],
  "total": 10
}
```

---

### POST /admin/activity-categories
**Purpose:** Create new activity category  
**Scope:** Admin

**Request:**
```json
{
  "name": "voice_journal",
  "display_name": "Voice Journal",
  "description": "Record and reflect on voice journals",
  "icon_emoji": "🎙️",
  "color_hex": "#FFE66D",
  "category_type": "activity",
  "display_order": 9
}
```

**Response (201 Created):**
```json
{
  "id": "category_uuid",
  "name": "voice_journal",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/activity-categories/{category_id}
**Purpose:** Update activity category  
**Scope:** Admin

**Request:**
```json
{
  "is_active": true,
  "color_hex": "#FF1493",
  "display_order": 2
}
```

**Response (200 OK):**
```json
{
  "id": "category_uuid",
  "updated_at": "2026-06-30T10:05:00Z"
}
```

---

### DELETE /admin/activity-categories/{category_id}
**Purpose:** Archive/delete activity category  
**Scope:** Admin

**Request:**
```json
{
  "soft_delete": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "category_id": "category_uuid",
  "archived": true
}
```

---

## 4. Points Configuration API

### GET /admin/points-config
**Purpose:** Get all points configurations  
**Scope:** Admin

**Query Parameters:**
- `child_id` (optional)
- `activity_type` (optional)

**Response (200 OK):**
```json
{
  "configs": [
    {
      "id": "config_uuid",
      "child_id": "child_uuid",
      "activity_type": "game",
      "base_points": 20,
      "difficulty_multipliers": {
        "easy": 0.5,
        "medium": 1.0,
        "hard": 1.5,
        "expert": 2.0
      },
      "time_bonus_enabled": true,
      "daily_cap": 500
    }
  ]
}
```

---

### GET /children/{child_id}/points-config
**Purpose:** Get points configuration for specific child  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "configs": [
    {
      "activity_type": "game",
      "base_points": 20,
      "difficulty_multipliers": {...},
      "daily_cap": 500
    }
  ]
}
```

---

### PUT /children/{child_id}/points-config/{activity_type}
**Purpose:** Update points configuration for specific activity type  
**Scope:** Authenticated (parent/admin)

**Request:**
```json
{
  "base_points": 25,
  "difficulty_multipliers": {
    "easy": 0.5,
    "medium": 1.0,
    "hard": 1.75,
    "expert": 2.25
  },
  "time_bonus_enabled": true,
  "time_bonus_config": {
    "threshold_minutes": 10,
    "bonus_percent": 15
  },
  "daily_cap": 600
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "activity_type": "game",
  "updated_at": "2026-06-30T10:00:00Z"
}
```

---

### POST /children/{child_id}/points-config/reset
**Purpose:** Reset points config to defaults  
**Scope:** Authenticated (parent/admin)

**Response (200 OK):**
```json
{
  "success": true,
  "activity_types_reset": ["game", "quest", "trivia"],
  "reset_at": "2026-06-30T10:00:00Z"
}
```

---

## 5. Badge Unlock Logic API

### GET /admin/badge-unlock-logic
**Purpose:** Get all badge unlock logic rules  
**Scope:** Admin

**Query Parameters:**
- `rule_type` (optional)

**Response (200 OK):**
```json
{
  "logic_rules": [
    {
      "id": "logic_uuid",
      "name": "first_quest",
      "display_name": "First Quest",
      "rule_type": "activity_count",
      "config": {
        "activity_type": "quest",
        "minimum": 1
      }
    }
  ],
  "total": 15
}
```

---

### POST /admin/badge-unlock-logic
**Purpose:** Create new badge unlock logic  
**Scope:** Admin

**Request:**
```json
{
  "name": "voice_journal_starter",
  "display_name": "Voice Journal Starter",
  "rule_type": "activity_count",
  "config": {
    "activity_type": "voice_journal",
    "minimum": 5
  }
}
```

**Response (201 Created):**
```json
{
  "id": "logic_uuid",
  "name": "voice_journal_starter",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/badge-unlock-logic/{logic_id}
**Purpose:** Update badge unlock logic  
**Scope:** Admin

**Request:**
```json
{
  "config": {
    "activity_type": "voice_journal",
    "minimum": 3
  }
}
```

**Response (200 OK):**
```json
{
  "id": "logic_uuid",
  "updated_at": "2026-06-30T10:05:00Z"
}
```

---

## 6. Home Automation Device Types API

### GET /admin/ha-device-types
**Purpose:** Get all HA device types  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "device_types": [
    {
      "id": "device_type_uuid",
      "name": "light",
      "display_name": "Light",
      "icon_emoji": "💡",
      "supported_actions": ["on", "off", "set_brightness"],
      "ha_domain": "light",
      "is_enabled": true
    }
  ],
  "total": 8
}
```

---

### POST /admin/ha-device-types
**Purpose:** Create new HA device type  
**Scope:** Admin

**Request:**
```json
{
  "name": "vacuum",
  "display_name": "Vacuum",
  "icon_emoji": "🤖",
  "supported_actions": ["start", "stop", "dock", "return_to_base"],
  "ha_domain": "vacuum",
  "action_schema": {
    "type": "object",
    "properties": {
      "action": {"type": "string", "enum": ["start", "stop", "dock"]}
    }
  }
}
```

**Response (201 Created):**
```json
{
  "id": "device_type_uuid",
  "name": "vacuum",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/ha-device-types/{device_type_id}
**Purpose:** Update HA device type  
**Scope:** Admin

**Request:**
```json
{
  "is_enabled": false,
  "supported_actions": ["start", "stop", "dock", "return_to_base", "pause"]
}
```

**Response (200 OK):**
```json
{
  "id": "device_type_uuid",
  "updated_at": "2026-06-30T10:05:00Z"
}
```

---

## 7. Feature Flags API

### GET /admin/feature-flags
**Purpose:** Get all feature flags  
**Scope:** Admin

**Query Parameters:**
- `is_enabled` (optional)
- `target_user_type` (optional)

**Response (200 OK):**
```json
{
  "flags": [
    {
      "id": "flag_uuid",
      "name": "enable_voice_journal",
      "display_name": "Enable Voice Journal",
      "is_enabled": false,
      "rollout_percent": 0,
      "target_user_type": "child",
      "beta_user_ids": []
    }
  ],
  "total": 5
}
```

---

### POST /admin/feature-flags
**Purpose:** Create new feature flag  
**Scope:** Admin

**Request:**
```json
{
  "name": "new_points_algorithm",
  "display_name": "New Points Algorithm",
  "description": "Test improved points calculation",
  "is_enabled": true,
  "rollout_percent": 10,
  "target_user_type": "all",
  "start_date": "2026-06-30T00:00:00Z",
  "end_date": "2026-07-30T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "flag_uuid",
  "name": "new_points_algorithm",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/feature-flags/{flag_id}
**Purpose:** Update feature flag rollout  
**Scope:** Admin

**Request:**
```json
{
  "is_enabled": true,
  "rollout_percent": 50
}
```

**Response (200 OK):**
```json
{
  "id": "flag_uuid",
  "rollout_percent": 50,
  "updated_at": "2026-06-30T10:05:00Z"
}
```

---

### POST /admin/feature-flags/{flag_id}/beta-users
**Purpose:** Add users to beta test  
**Scope:** Admin

**Request:**
```json
{
  "user_ids": ["user_uuid_1", "user_uuid_2"]
}
```

**Response (200 OK):**
```json
{
  "flag_id": "flag_uuid",
  "beta_users_added": 2,
  "total_beta_users": 5
}
```

---

### GET /feature-flags/check
**Purpose:** Check if feature is enabled for current user  
**Scope:** Authenticated

**Query Parameters:**
- `flag_name` (required)
- `user_id` (optional, defaults to current user)

**Response (200 OK):**
```json
{
  "flag_name": "new_points_algorithm",
  "is_enabled": true,
  "reason": "rollout" // or "beta_user", "admin"
}
```

---

## 8. Roles & Permissions API

### GET /admin/roles
**Purpose:** Get all roles  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "roles": [
    {
      "id": "role_uuid",
      "name": "super_admin",
      "display_name": "Super Admin",
      "hierarchy_level": 0,
      "is_system_role": true,
      "permissions_count": 45
    }
  ],
  "total": 5
}
```

---

### POST /admin/roles
**Purpose:** Create new role  
**Scope:** Super Admin

**Request:**
```json
{
  "name": "content_manager",
  "display_name": "Content Manager",
  "description": "Manages homework, books, and trivia content",
  "hierarchy_level": 1,
  "permission_ids": ["content.create", "content.update", "content.publish"]
}
```

**Response (201 Created):**
```json
{
  "id": "role_uuid",
  "name": "content_manager"
}
```

---

### GET /admin/permissions
**Purpose:** Get all permissions  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "permissions": [
    {
      "id": "perm_uuid",
      "name": "features.create",
      "resource": "features",
      "action": "create",
      "is_system_permission": true
    }
  ],
  "total": 50
}
```

---

### GET /admin/users/{user_id}/roles
**Purpose:** Get roles assigned to user  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "user_id": "user_uuid",
  "roles": [
    {
      "role_id": "role_uuid",
      "name": "admin",
      "permissions": [...]
    }
  ]
}
```

---

### POST /admin/users/{user_id}/roles
**Purpose:** Assign role to user  
**Scope:** Super Admin

**Request:**
```json
{
  "role_id": "role_uuid"
}
```

**Response (201 Created):**
```json
{
  "user_id": "user_uuid",
  "role_id": "role_uuid",
  "assigned_at": "2026-06-30T10:00:00Z"
}
```

---

## 9. Feature Dependencies API

### GET /admin/features/{feature_id}/dependencies
**Purpose:** Get feature dependencies  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "feature_id": "feature_uuid",
  "depends_on": [
    {
      "feature_id": "trivia_questions_uuid",
      "feature_name": "trivia_questions",
      "dependency_type": "required",
      "min_version": "1.0.0"
    }
  ],
  "required_by": [
    {
      "feature_id": "quickfire_uuid",
      "feature_name": "quickfire_trivia"
    }
  ]
}
```

---

### POST /admin/features/{feature_id}/dependencies
**Purpose:** Add dependency  
**Scope:** Admin

**Request:**
```json
{
  "depends_on_feature_id": "trivia_questions_uuid",
  "dependency_type": "required",
  "min_version": "1.5.0"
}
```

**Response (201 Created):**
```json
{
  "dependency_id": "dep_uuid",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

## 10. Widget Credentials API

### POST /children/{child_id}/dashboard/widgets/{widget_id}/credentials
**Purpose:** Store widget API credentials  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "credential_type": "api_key",
  "service_name": "weather_api",
  "credential_data": {
    "api_key": "encrypted_key_here"
  },
  "scope": ["read_weather", "read_forecast"]
}
```

**Response (201 Created):**
```json
{
  "credential_id": "cred_uuid",
  "is_valid": true,
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /children/{child_id}/dashboard/widgets/{widget_id}/credentials/{credential_id}
**Purpose:** Update credentials  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "credential_data": {
    "api_key": "new_encrypted_key"
  }
}
```

**Response (200 OK):**
```json
{
  "credential_id": "cred_uuid",
  "last_validated_at": "2026-06-30T10:00:00Z"
}
```

---

### POST /admin/widget-credentials/validate
**Purpose:** Validate all widget credentials  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "total_checked": 45,
  "valid": 42,
  "invalid": 3,
  "expired": 0,
  "needs_refresh": 5
}
```

---

## 11. Feature Analytics API

### GET /admin/analytics/features
**Purpose:** Get feature adoption analytics  
**Scope:** Admin

**Query Parameters:**
- `feature_id` (optional)
- `period` (optional): 'day', 'week', 'month'
- `start_date` (optional)
- `end_date` (optional)

**Response (200 OK):**
```json
{
  "analytics": [
    {
      "feature_id": "feature_uuid",
      "feature_name": "wordle_game",
      "total_uses": 1250,
      "unique_users": 45,
      "weekly_active_users": 38,
      "average_rating": 4.2,
      "error_rate": 0.02,
      "date_period": "2026-06-30"
    }
  ]
}
```

---

### GET /children/{child_id}/features/analytics
**Purpose:** Get child's feature usage  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "summary": {
    "most_used_feature": "wordle_game",
    "total_sessions": 156,
    "average_daily_usage_minutes": 45
  },
  "features": [
    {
      "feature_name": "wordle_game",
      "uses_this_week": 12,
      "average_rating": 5
    }
  ]
}
```

---

## 12. Notification Preferences API

### GET /children/{child_id}/notification-preferences
**Purpose:** Get child's notification settings  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "badge_unlocked": true,
  "activity_completed": true,
  "push_notifications": true,
  "email_digest": false,
  "dnd_enabled": true,
  "dnd_start_time": "21:00",
  "dnd_end_time": "08:00",
  "sound_enabled": true
}
```

---

### PUT /children/{child_id}/notification-preferences
**Purpose:** Update notification preferences  
**Scope:** Authenticated (parent or child)

**Request:**
```json
{
  "badge_unlocked": true,
  "push_notifications": true,
  "email_digest": true,
  "email_digest_frequency": "weekly",
  "dnd_enabled": true,
  "dnd_start_time": "21:00",
  "dnd_end_time": "08:00"
}
```

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "updated_at": "2026-06-30T10:00:00Z"
}
```

---

## 13. Theme Customization API

### GET /children/{child_id}/theme
**Purpose:** Get child's theme customization  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "theme_type": "custom",
  "primary_color": "#FF6B6B",
  "secondary_color": "#4ECDC4",
  "accent_color": "#FFE66D",
  "high_contrast_mode": false,
  "dyslexia_friendly_font": false,
  "animations_enabled": true
}
```

---

### PUT /children/{child_id}/theme
**Purpose:** Update theme customization  
**Scope:** Authenticated (parent or child)

**Request:**
```json
{
  "theme_type": "custom",
  "primary_color": "#FF1493",
  "secondary_color": "#00CED1",
  "high_contrast_mode": false,
  "dyslexia_friendly_font": false
}
```

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "updated_at": "2026-06-30T10:00:00Z"
}
```

---

### POST /children/{child_id}/theme/presets
**Purpose:** Apply preset theme  
**Scope:** Authenticated (parent or child)

**Request:**
```json
{
  "preset_name": "spring" // or "summer", "dark_mode", "high_contrast"
}
```

**Response (200 OK):**
```json
{
  "preset_applied": "spring",
  "colors": {...}
}
```

---

## 14. Content Management API

### GET /admin/content
**Purpose:** Get all content items  
**Scope:** Admin/Content Manager

**Query Parameters:**
- `content_type` (optional)
- `category_id` (optional)
- `is_published` (optional)
- `search` (optional)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "content_uuid",
      "title": "Chapter 5: Algebra Basics",
      "content_type": "homework_assignment",
      "difficulty": "medium",
      "created_by": "user_uuid",
      "is_published": true,
      "usage_count": 45
    }
  ],
  "total": 250
}
```

---

### POST /admin/content
**Purpose:** Create content item  
**Scope:** Admin/Content Manager

**Request:**
```json
{
  "title": "Math Homework - Chapter 5",
  "content_type": "homework_assignment",
  "category_id": "homework_uuid",
  "difficulty": "medium",
  "estimated_duration_minutes": 45,
  "content_data": {
    "instructions": "Complete exercises 1-20",
    "questions": [...]
  },
  "tags": ["math", "algebra", "homework"]
}
```

**Response (201 Created):**
```json
{
  "id": "content_uuid",
  "title": "Math Homework - Chapter 5",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/content/{content_id}/publish
**Purpose:** Publish content  
**Scope:** Admin

**Request:**
```json
{
  "version_notes": "Ready for production"
}
```

**Response (200 OK):**
```json
{
  "content_id": "content_uuid",
  "is_published": true,
  "published_at": "2026-06-30T10:00:00Z"
}
```

---

## 15. Audit Trail API

### GET /admin/audit-trail
**Purpose:** Get audit logs  
**Scope:** Super Admin

**Query Parameters:**
- `resource_type` (optional)
- `actor_id` (optional)
- `action` (optional)
- `start_date` (optional)
- `end_date` (optional)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": "log_uuid",
      "actor_id": "user_uuid",
      "actor_type": "admin",
      "resource_type": "feature",
      "resource_name": "wordle_game",
      "action": "update",
      "changes": {
        "is_enabled": {
          "old": false,
          "new": true
        }
      },
      "created_at": "2026-06-30T10:00:00Z"
    }
  ],
  "total": 1250
}
```

---

### POST /admin/audit-trail/export
**Purpose:** Export audit logs  
**Scope:** Super Admin

**Request:**
```json
{
  "start_date": "2026-06-01",
  "end_date": "2026-06-30",
  "format": "csv" // or "json"
}
```

**Response (200 OK - File Download)**
```
Audit logs exported as CSV
```

---

## 16. Rate Limiting API

### GET /admin/rate-limits
**Purpose:** Get all rate limit configurations  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "limits": [
    {
      "id": "limit_uuid",
      "feature_name": "wordle_game",
      "max_uses_per_day": 3,
      "cooldown_seconds": 3600,
      "is_active": true
    }
  ],
  "total": 25
}
```

---

### PUT /admin/rate-limits/{feature_id}
**Purpose:** Set rate limits for feature  
**Scope:** Admin

**Request:**
```json
{
  "max_uses_per_day": 5,
  "max_uses_per_hour": 2,
  "cooldown_seconds_between_uses": 300,
  "action_when_limited": "warn"
}
```

**Response (200 OK):**
```json
{
  "feature_id": "feature_uuid",
  "updated_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /children/{child_id}/rate-limits/{feature_id}
**Purpose:** Override rate limits for specific child  
**Scope:** Admin/Parent

**Request:**
```json
{
  "max_uses_per_day": 10,
  "reason": "Special accommodations"
}
```

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "feature_id": "feature_uuid"
}
```

---

## 17. Translations API

### GET /admin/translations
**Purpose:** Get all translations  
**Scope:** Admin

**Query Parameters:**
- `resource_type` (optional)
- `language_code` (optional)
- `is_approved` (optional)

**Response (200 OK):**
```json
{
  "translations": [
    {
      "id": "trans_uuid",
      "resource_type": "feature",
      "resource_id": "feature_uuid",
      "language_code": "gu",
      "title": "વર્ડલ્ ગેમ",
      "is_approved": true,
      "translated_by": "user_uuid"
    }
  ],
  "total": 500
}
```

---

### POST /admin/translations
**Purpose:** Add translation  
**Scope:** Admin/Translator

**Request:**
```json
{
  "resource_type": "feature",
  "resource_id": "feature_uuid",
  "language_code": "gu",
  "title": "વર્ડલ્ ગેમ",
  "description": "આપેલ શબ્દ શોધવાનો પ્રયાસ કરો"
}
```

**Response (201 Created):**
```json
{
  "id": "trans_uuid",
  "created_at": "2026-06-30T10:00:00Z"
}
```

---

### PUT /admin/translations/{translation_id}/approve
**Purpose:** Approve translation  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "translation_id": "trans_uuid",
  "is_approved": true,
  "approved_at": "2026-06-30T10:00:00Z"
}
```

---

## 18. Trivia Tracking API

### GET /children/{child_id}/trivia/tracking
**Purpose:** Get trivia performance and question cycling status  
**Scope:** Authenticated (parent)

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "total_questions_answered": 245,
  "accuracy": 78.5,
  "cycling_status": {
    "ready_to_show_today": 52,
    "just_answered_correctly": 15,
    "in_cooldown": 30
  }
}
```

---

### PUT /children/{child_id}/trivia/question/{question_id}/answer
**Purpose:** Record trivia answer and update cycling  
**Scope:** Authenticated (child)

**Request:**
```json
{
  "correct": true,
  "time_spent_seconds": 12,
  "used_hints": 1
}
```

**Response (200 OK):**
```json
{
  "points_awarded": 15,
  "next_show_date": "2026-07-07",
  "category_mastery_updated": true
}
```

---

## 19. Daily Quest Rules API

### GET /admin/quest-generation-rules
**Purpose:** Get quest generation rules  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "rules": [
    {
      "quest_id": "quest_uuid",
      "type": "points_quest",
      "max_per_day": 1,
      "conflicts_with": ["quest_uuid_2", "quest_uuid_3"],
      "preferred_day": "monday"
    }
  ]
}
```

---

### POST /admin/quest-generation-rules
**Purpose:** Create quest generation rule  
**Scope:** Admin

**Request:**
```json
{
  "quest_template_id": "quest_uuid",
  "type": "activity_quest",
  "max_per_day": 1,
  "conflicts_with": []
}
```

---

## 20. Predefined Habits API

### GET /admin/predefined-habits
**Purpose:** Get all predefined habits  
**Scope:** Admin/Parent

**Response (200 OK):**
```json
{
  "habits": [
    {
      "id": "habit_uuid",
      "name": "Morning Exercise",
      "points_per_completion": 5,
      "linked_activities": ["Kung Fu", "Yoga"],
      "emoji": "💪"
    }
  ],
  "total": 11
}
```

---

### POST /children/{child_id}/habits/from-predefined
**Purpose:** Create habit from predefined template  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "predefined_habit_id": "habit_uuid"
}
```

**Response (201 Created):**
```json
{
  "habit_id": "new_habit_uuid",
  "created_from_predefined": true
}
```

---

## 21. Habit Recovery API

### GET /children/{child_id}/habits/{habit_id}/recovery-status
**Purpose:** Check recovery status for habit  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "habit_id": "habit_uuid",
  "missed_date": "2026-06-29",
  "free_recovery_available_this_month": true,
  "cost_to_recover_with_points": 0
}
```

---

### POST /children/{child_id}/habits/{habit_id}/recover
**Purpose:** Recover missed habit (free or with points)  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "recovered": true,
  "recovery_type": "free",
  "points_deducted": 0,
  "streak_restored": true
}
```

---

## 22. Kung Fu Belt Levels API

### GET /admin/kung-fu-belts
**Purpose:** Get all belt levels  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "belts": [
    {
      "id": "belt_uuid",
      "name": "White Belt",
      "level_order": 1,
      "color": "#FFFFFF"
    }
  ],
  "total": 8
}
```

---

### PUT /children/{child_id}/kung-fu/belt
**Purpose:** Update child's belt level  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "belt_id": "belt_uuid"
}
```

**Response (200 OK):**
```json
{
  "child_id": "child_uuid",
  "new_belt": "Yellow Belt",
  "promoted": true
}
```

---

## 23. Quest Swaps API

### GET /children/{child_id}/quests/swap-status
**Purpose:** Check swap availability for today  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "free_swaps_remaining_today": 1,
  "cost_of_next_swap_percent": "5%",
  "cost_of_next_swap_points": 2,
  "swaps_used_today": 0
}
```

---

### POST /children/{child_id}/quests/swap
**Purpose:** Swap a daily quest  
**Scope:** Authenticated (parent or child)

**Request:**
```json
{
  "current_quest_id": "quest_uuid",
  "new_quest_id": "quest_uuid_2"
}
```

**Response (200 OK):**
```json
{
  "swapped": true,
  "was_free": true,
  "points_deducted": 0
}
```

---

## 24. Category Mastery API

### GET /children/{child_id}/categories/mastery
**Purpose:** Get category mastery progress for all categories  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "categories": [
    {
      "category_id": "category_uuid",
      "name": "Geography",
      "mastery_level": 2,
      "accuracy": 82,
      "questions_answered": 45,
      "progress_to_next_level": 75
    }
  ]
}
```

---

### GET /children/{child_id}/categories/{category_id}/mastery
**Purpose:** Get detailed mastery progress for one category  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "category_id": "category_uuid",
  "mastery_level": 2,
  "current_accuracy": 82,
  "next_level_requirement": 90,
  "progress_percent": 75,
  "questions_to_level_up": 5
}
```

---

## 25. Notification Types API

### GET /admin/notification-types
**Purpose:** Get all notification types  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "types": [
    {
      "id": "type_uuid",
      "name": "quest_completed",
      "display_name": "Quest Completed",
      "priority": "high",
      "emoji": "🎯",
      "sound_enabled_default": true
    }
  ],
  "total": 35
}
```

---

### POST /admin/notification-types
**Purpose:** Create new notification type  
**Scope:** Admin

**Request:**
```json
{
  "name": "custom_event",
  "display_name": "Custom Event",
  "priority": "medium",
  "emoji": "⭐",
  "sound_enabled_default": true
}
```

---

## 26. Reading Entry Types API

### GET /admin/reading-entry-types
**Purpose:** Get all reading entry types  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "types": [
    {
      "id": "type_uuid",
      "name": "Book",
      "emoji": "📚",
      "base_points_per_minute": 0.2
    }
  ],
  "total": 5
}
```

---

## 27. Mood Settings API

### GET /children/{child_id}/mood-settings
**Purpose:** Get mood tracking settings  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "difficult_mood_threshold": 3,
  "difficult_mood_window_days": 7,
  "alert_parent_on_threshold": true,
  "mood_entries_private": true
}
```

---

### PUT /children/{child_id}/mood-settings
**Purpose:** Update mood settings  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "difficult_mood_threshold": 2,
  "alert_parent_email": true,
  "mood_entries_private": false
}
```

---

## 28. Daily Challenge Rules API

### GET /admin/daily-challenge-rules
**Purpose:** Get daily challenge configuration  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "rules": [
    {
      "game_order": 1,
      "feature_name": "wordle_game",
      "difficulty": "medium",
      "lives_per_game": 1,
      "base_multiplier": 2.5
    }
  ]
}
```

---

## 29. Curriculum API

### GET /admin/curriculum-phases
**Purpose:** Get Gujarati curriculum structure  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "phases": [
    {
      "id": "phase_uuid",
      "phase_number": 1,
      "name": "Fundamentals",
      "total_lessons": 10,
      "estimated_duration_hours": 5
    }
  ]
}
```

---

### GET /children/{child_id}/gujarati/progress
**Purpose:** Get child's Gujarati curriculum progress  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "current_phase": 2,
  "completed_lessons": 12,
  "total_lessons_in_phase": 15,
  "progress_percent": 80
}
```

---

## 30. Reading Goals API

### GET /children/{child_id}/reading/goals
**Purpose:** Get reading time goals and progress  
**Scope:** Authenticated (parent or child)

**Response (200 OK):**
```json
{
  "weekly_goal_minutes": 60,
  "current_week_minutes": 45,
  "weeks_goal_met_streak": 3,
  "progress_percent": 75
}
```

---

### PUT /children/{child_id}/reading/goals
**Purpose:** Update reading goals  
**Scope:** Authenticated (parent)

**Request:**
```json
{
  "weekly_time_goal_minutes": 120
}
```

---

## Admin Dashboard Endpoints

### GET /admin/extensibility-status
**Purpose:** Get overall extensibility system status  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "summary": {
    "total_features": 25,
    "features_enabled": 20,
    "total_widgets": 8,
    "total_categories": 10,
    "total_device_types": 8,
    "feature_flags_active": 3,
    "content_items": 250,
    "active_roles": 5,
    "audit_logs": 5000,
    "languages_supported": 3
  },
  "health": {
    "invalid_credentials": 2,
    "failed_dependencies": 0,
    "rate_limit_warnings": 1
  },
  "recent_changes": [
    {
      "type": "feature",
      "name": "voice_journal",
      "action": "enable",
      "timestamp": "2026-06-29T10:00:00Z"
    }
  ]
}
```

---

### GET /admin/system-health
**Purpose:** Check system health  
**Scope:** Admin

**Response (200 OK):**
```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "feature_dependencies": "ok",
    "widget_credentials": "warning",
    "audit_trail": "ok"
  },
  "recommendations": [
    "2 widget credentials are invalid and should be refreshed"
  ]
}
```

---

## Summary - PHASE 1 COMPLETE

| Endpoint Category | Endpoints | Purpose |
|---|---|---|
| **Features** | 5 | Manage feature enablement |
| **Dashboard Widgets** | 6 | Customize dashboard layouts |
| **Categories** | 4 | Manage activity categories |
| **Points Config** | 4 | Configure points per child |
| **Badge Logic** | 3 | Manage badge unlock conditions |
| **HA Device Types** | 3 | Manage device types |
| **Feature Flags** | 5 | A/B testing & rollouts |
| **Roles & Permissions** | 5 | Role-based access control |
| **Feature Dependencies** | 2 | Dependency management |
| **Widget Credentials** | 3 | Secure credential storage |
| **Feature Analytics** | 2 | Adoption & usage metrics |
| **Notification Preferences** | 2 | Per-child notifications |
| **Theme Customization** | 3 | Theme & UI personalization |
| **Content Management** | 3 | Content item management |
| **Audit Trail** | 2 | Compliance logging |
| **Rate Limiting** | 3 | Per-feature usage limits |
| **Translations** | 3 | Multi-language support |
| **Trivia Tracking** | 2 | Question cycling & performance |
| **Daily Quest Rules** | 2 | Quest generation constraints |
| **Predefined Habits** | 2 | 11 predefined habits |
| **Habit Recovery** | 2 | Missed day recovery |
| **Kung Fu Belts** | 2 | Belt progression |
| **Quest Swaps** | 2 | Daily quest swaps |
| **Category Mastery** | 2 | Mastery level tracking |
| **Notification Types** | 2 | Notification type catalog |
| **Reading Entry Types** | 1 | Reading entry types |
| **Mood Settings** | 2 | Mood thresholds & alerts |
| **Daily Challenge** | 1 | Challenge rules & sequencing |
| **Curriculum** | 2 | Gujarati curriculum structure |
| **Reading Goals** | 2 | Weekly reading goals |
| **Admin Dashboard** | 2 | System status & health |

**Total New Endpoints: ~110+**

**Tables: 38 total** (24 extensibility + 14 gap tables)

---

**Status:** COMPLETE - All Original Features + Extensibility Architecture  
**Ready for:** Database Performance & Implementation Planning

