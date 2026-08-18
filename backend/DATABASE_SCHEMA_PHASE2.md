# Phase 2 Database Schema Documentation

**File**: `backend/migrations/004_phase2_features.sql`  
**Status**: Ready for deployment  
**Tables Added**: 19 new tables  
**Indexes Added**: 35+ performance indexes

---

## 📋 Table Overview

### 1. Announcements (2 tables)

#### `announcements`
Family-wide messages/announcements from parents to children.

**Purpose**: Central hub for parent-to-family communication

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | Which family this announcement is for |
| created_by_id | UUID | Parent/admin who created it |
| title | VARCHAR(255) | Announcement subject |
| message | TEXT | Full message content |
| announcement_type | VARCHAR(50) | general, reminder, urgent, celebration, request |
| priority | VARCHAR(20) | low, normal, high, urgent |
| target_audience | VARCHAR(50) | all, children, parents, specific |
| target_user_ids | UUID[] | If specific audience, which users |
| is_pinned | BOOLEAN | Pin important announcements to top |
| expires_at | TIMESTAMP | Auto-hide after this date |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last modification |

**Queries**:
```sql
-- Get active announcements for user
SELECT * FROM announcements 
WHERE (target_audience = 'all' OR 'user_id' = ANY(target_user_ids))
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY is_pinned DESC, created_at DESC;

-- Mark announcement as read
INSERT INTO announcement_reads (announcement_id, user_id) VALUES (?, ?);

-- Get read status for user
SELECT announcement_id FROM announcement_reads WHERE user_id = ?;
```

#### `announcement_reads`
Tracks who has read each announcement.

**Purpose**: Know which family members have seen announcements

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| announcement_id | UUID | FK to announcement |
| user_id | UUID | FK to user who read it |
| read_at | TIMESTAMP | When they read it |

---

### 2. Reminders (1 table)

#### `reminders`
Upcoming reminders for chores, assignments, events, etc.

**Purpose**: Notify users about upcoming tasks and deadlines

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Who this reminder is for |
| title | VARCHAR(255) | Reminder title |
| description | TEXT | Details |
| reminder_type | VARCHAR(50) | chore, assignment, event, goal, custom |
| related_item_id | UUID | Link to chore/homework/event |
| related_item_type | VARCHAR(100) | Type of linked item |
| scheduled_time | TIMESTAMP | When to remind |
| remind_before_minutes | INTEGER | Send notification X min before |
| notification_sent | BOOLEAN | Has push notification been sent |
| sent_at | TIMESTAMP | When notification was sent |
| is_dismissed | BOOLEAN | User has dismissed it |
| dismissed_at | TIMESTAMP | When dismissed |
| recurrence | VARCHAR(50) | once, daily, weekly, monthly |
| recurrence_end_date | DATE | Stop recurring after this |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Last modified |

**Example Data**:
```json
{
  "title": "Clean your bedroom",
  "reminder_type": "chore",
  "related_item_id": "chore-123",
  "scheduled_time": "2026-08-08 10:00:00",
  "remind_before_minutes": 30
}
```

**Queries**:
```sql
-- Get pending reminders for user
SELECT * FROM reminders 
WHERE user_id = ? 
AND scheduled_time <= NOW() + INTERVAL '1 hour'
AND is_dismissed = false
AND notification_sent = false
ORDER BY scheduled_time ASC;

-- Dismiss reminder
UPDATE reminders SET is_dismissed = true, dismissed_at = NOW() WHERE id = ?;

-- Create recurring reminder
INSERT INTO reminders (user_id, title, scheduled_time, recurrence, recurrence_end_date)
VALUES (?, ?, ?, 'daily', ?);
```

---

### 3. Energy Usage (3 tables)

#### `energy_usage`
Raw power consumption data from SmartThings devices.

**Purpose**: Granular energy tracking for dashboards and analysis

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| device_id | VARCHAR(255) | SmartThings device ID |
| device_name | VARCHAR(255) | e.g., "Living Room Thermostat" |
| device_type | VARCHAR(100) | e.g., "thermostat", "light", "outlet" |
| power_watts | DECIMAL(10,2) | Current power draw |
| energy_kwh | DECIMAL(12,4) | Energy consumed (kWh) |
| timestamp | TIMESTAMP | When measured |
| recorded_at | TIMESTAMP | When inserted into DB |

**Notes**: 
- Can grow large with frequent updates (consider archiving old data)
- Typically captured every 5-15 minutes per device
- Should have retention policy (keep 90 days, archive to cold storage)

#### `energy_summary`
Daily/weekly/monthly rollups for performance.

**Purpose**: Faster queries for historical data (avoid scanning millions of rows)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| period | VARCHAR(20) | daily, weekly, monthly |
| period_start | DATE | Start of period |
| period_end | DATE | End of period |
| total_kwh | DECIMAL(12,4) | Total energy for period |
| average_power_watts | DECIMAL(10,2) | Average power draw |
| peak_power_watts | DECIMAL(10,2) | Highest power draw |
| peak_time | TIMESTAMP | When peak occurred |
| device_count | INTEGER | How many devices reported |
| created_at | TIMESTAMP | When calculated |

**Queries**:
```sql
-- Get monthly energy usage
SELECT * FROM energy_summary 
WHERE period = 'monthly' 
AND period_start >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
ORDER BY period_start DESC;

-- Calculate summary from raw data (run nightly)
INSERT INTO energy_summary (period, period_start, period_end, total_kwh, average_power_watts, peak_power_watts, peak_time, device_count)
SELECT 
  'daily',
  DATE(timestamp),
  DATE(timestamp),
  SUM(energy_kwh),
  AVG(power_watts),
  MAX(power_watts),
  (ARRAY_AGG(timestamp ORDER BY power_watts DESC))[1],
  COUNT(DISTINCT device_id)
FROM energy_usage
WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(timestamp);
```

#### `energy_goals`
Family energy-saving goals and targets.

**Purpose**: Gamify energy savings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| created_by_id | UUID | Parent who created goal |
| goal_type | VARCHAR(50) | daily, weekly, monthly |
| target_kwh | DECIMAL(12,4) | Target energy limit |
| current_kwh | DECIMAL(12,4) | Current progress |
| status | VARCHAR(50) | active, achieved, failed, archived |
| start_date | DATE | When goal starts |
| end_date | DATE | When goal ends |
| points_reward | INTEGER | Points if achieved |
| achieved_at | TIMESTAMP | When/if completed |
| created_at | TIMESTAMP | Created |

---

### 4. Learning Module (5 tables)

#### `learning_courses`
Available courses (Gujarati, Math, Science, etc.).

**Purpose**: Course catalog and metadata

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| title | VARCHAR(255) | "Gujarati Alphabet Basics" |
| description | TEXT | What students will learn |
| subject | VARCHAR(100) | gujarati, math, science, etc. |
| language | VARCHAR(10) | Language taught (e.g., gu for Gujarati) |
| difficulty | VARCHAR(20) | easy, medium, hard, expert |
| total_lessons | INTEGER | Number of lessons |
| estimated_duration_hours | INTEGER | How long to complete |
| icon_emoji | VARCHAR(10) | 🔤 for letters, 🔢 for numbers |
| color_code | VARCHAR(10) | #FF5733 or similar |
| is_active | BOOLEAN | Available for enrollment |
| display_order | INTEGER | Sort order on dashboard |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Last modified |

**Example Data**:
```sql
INSERT INTO learning_courses VALUES
  (gen_random_uuid(), 'Gujarati Alphabet', 'Learn Gujarati letters', 'gujarati', 'gu', 'easy', 26, 5, '🔤', '#FF6B6B', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'Gujarati Numbers', 'Learn to count in Gujarati', 'gujarati', 'gu', 'easy', 10, 3, '🔢', '#4ECDC4', true, 2, NOW(), NOW()),
  (gen_random_uuid(), 'Basic Conversations', 'Common phrases in Gujarati', 'gujarati', 'gu', 'medium', 15, 8, '💬', '#45B7D1', true, 3, NOW(), NOW());
```

#### `learning_lessons`
Individual lessons within a course.

**Purpose**: Lesson structure and sequencing

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| course_id | UUID | FK to course |
| title | VARCHAR(255) | "Letter A - Akshara" |
| description | TEXT | Learning objectives |
| lesson_order | INTEGER | Sequence (1, 2, 3...) |
| content_type | VARCHAR(50) | video, quiz, interactive, reading, exercise |
| content_url | VARCHAR(500) | Link to lesson content |
| duration_minutes | INTEGER | How long lesson takes |
| difficulty | VARCHAR(20) | Can differ from course |
| points_value | INTEGER | Points for completion |
| estimated_completion_time_minutes | INTEGER | SLA for completion |
| is_prerequisite_required | BOOLEAN | Must complete prior lesson first |
| prerequisite_lesson_id | UUID | FK to prior lesson |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Modified |

**Key Features**:
- Sequenced lessons (lesson_order 1-N)
- Prerequisites (can't skip lessons)
- Multiple content types (video, quiz, interactive)
- Points system (rewards completion)

#### `learning_progress`
User progress through courses.

**Purpose**: Track where each student is in each course

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Which student |
| course_id | UUID | Which course |
| total_lessons | INTEGER | Lesson count (denormalized for speed) |
| lessons_completed | INTEGER | How many done |
| completion_percentage | INTEGER | 0-100% |
| current_lesson_id | UUID | Where they are now |
| status | VARCHAR(50) | not_started, in_progress, completed, archived |
| points_earned | INTEGER | Total points from this course |
| started_at | TIMESTAMP | When enrollment started |
| last_accessed_at | TIMESTAMP | Last time opened |
| completed_at | TIMESTAMP | When finished (if applicable) |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Last modified |

**Indexes**:
- UNIQUE(user_id, course_id) — Only one record per student per course

**Queries**:
```sql
-- Get student's current progress in Gujarati course
SELECT * FROM learning_progress 
WHERE user_id = 'student-123' 
AND course_id = 'gujarati-101';

-- Get all courses student is taking
SELECT c.*, p.completion_percentage, p.status
FROM learning_courses c
JOIN learning_progress p ON c.id = p.course_id
WHERE p.user_id = 'student-123'
ORDER BY p.status, p.completion_percentage DESC;

-- Get courses by completion rate
SELECT c.title, AVG(p.completion_percentage) as avg_completion
FROM learning_courses c
JOIN learning_progress p ON c.id = p.course_id
WHERE p.status IN ('in_progress', 'completed')
GROUP BY c.id
ORDER BY avg_completion DESC;
```

#### `lesson_completions`
Individual lesson completion records.

**Purpose**: Track exactly when each lesson was completed

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| lesson_id | UUID | FK to lesson |
| user_id | UUID | FK to student |
| score | INTEGER | Quiz score if applicable |
| duration_seconds | INTEGER | How long lesson took |
| completed_at | TIMESTAMP | When completed |

**Indexes**:
- UNIQUE(lesson_id, user_id) — Can't complete same lesson twice

**Use Cases**:
- Calculate average time per lesson type
- Track quiz scores
- Identify struggling students (long times, low scores)
- Generate progress reports

---

### 5. Family Management (5 tables)

#### `families`
Family group (container for parents + children).

**Purpose**: Organize users into family units

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(255) | "The Patels" |
| description | TEXT | Optional family tagline |
| created_by_id | UUID | First parent/admin |
| max_children | INTEGER | Limit children per family |
| max_parents | INTEGER | Limit parents per family |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Modified |

**Notes**:
- One family can have 1-2 parents and 1-5 children
- Replaces previous linked_accounts approach
- Enables family-level settings and announcements

#### `family_members`
Join table linking users to families with roles.

**Purpose**: Manage family membership and permissions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | FK to family |
| user_id | UUID | FK to user |
| role | VARCHAR(50) | admin, parent, child, guardian |
| joined_at | TIMESTAMP | When joined |
| invited_by_id | UUID | Who invited them |
| is_active | BOOLEAN | Can pause membership |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Modified |

**Indexes**:
- UNIQUE(family_id, user_id) — User can't be in same family twice

**Role Levels**:
- **admin** — Can manage family, add/remove members, configure settings
- **parent** — Can manage child accounts, see reports, approve activities
- **child** — Participant, earns points, completes activities
- **guardian** — Like parent but read-only (grandparent, etc.)

**Queries**:
```sql
-- Get all members of a family
SELECT u.*, fm.role
FROM family_members fm
JOIN users u ON fm.user_id = u.id
WHERE fm.family_id = 'family-123'
AND fm.is_active = true;

-- Get families for a user
SELECT f.*
FROM families f
JOIN family_members fm ON f.id = fm.family_id
WHERE fm.user_id = 'user-456'
AND fm.is_active = true;

-- Get user's siblings
SELECT u.* FROM family_members fm
JOIN family_members fm2 ON fm.family_id = fm2.family_id
JOIN users u ON fm2.user_id = u.id
WHERE fm.user_id = 'child-123'
AND fm2.role = 'child'
AND u.id != 'child-123';
```

#### `family_settings`
Family-level configuration (one per family).

**Purpose**: Centralize family preferences

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | FK to family |
| theme | VARCHAR(50) | light, dark, auto |
| language | VARCHAR(10) | en, gu, etc. |
| timezone | VARCHAR(100) | America/New_York |
| notifications_enabled | BOOLEAN | Family-wide setting |
| sound_notifications | BOOLEAN | Enable sounds |
| email_digest_frequency | VARCHAR(50) | daily, weekly, monthly, never |
| parental_controls_enabled | BOOLEAN | Enforce restrictions |
| require_age_verification | BOOLEAN | COPPA compliance |
| max_screen_time_minutes | INTEGER | Daily limit |
| bedtime_enabled | BOOLEAN | Enforce bedtime |
| bedtime_start | VARCHAR(5) | e.g., "21:00" |
| bedtime_end | VARCHAR(5) | e.g., "07:00" |
| enable_smart_home_control | BOOLEAN | Allow device control |
| points_system_enabled | BOOLEAN | Use gamification |
| badges_system_enabled | BOOLEAN | Show achievements |
| leaderboard_enabled | BOOLEAN | Show rankings |
| privacy_mode | BOOLEAN | Hide real names, profile pics |
| allow_google_calendar_sync | BOOLEAN | Import calendar events |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Last modified |

**Indexes**:
- UNIQUE(family_id) — One settings record per family

#### `parental_controls`
Per-child restrictions set by parent.

**Purpose**: Granular control over individual children

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | FK to family |
| parent_id | UUID | FK to parent setting rules |
| child_id | UUID | FK to child being monitored |
| content_filter_enabled | BOOLEAN | Block inappropriate content |
| screen_time_limit_enabled | BOOLEAN | Enforce daily limit |
| daily_limit_minutes | INTEGER | e.g., 120 minutes |
| bedtime_enabled | BOOLEAN | Enforce sleep schedule |
| bedtime_start | VARCHAR(5) | "21:00" |
| bedtime_end | VARCHAR(5) | "07:00" |
| require_approval_for_sensitive_content | BOOLEAN | Parent must approve |
| location_tracking_enabled | BOOLEAN | Track child location |
| app_restrictions | JSON | Blacklist of apps |
| created_at | TIMESTAMP | Created |
| updated_at | TIMESTAMP | Modified |

**Indexes**:
- UNIQUE(family_id, parent_id, child_id)

**Example app_restrictions**:
```json
{
  "blocked_games": ["tiktok", "snapchat"],
  "blocked_subjects": ["adult_content"],
  "allowed_sites": ["wikipedia.org", "khan-academy.org"]
}
```

#### `family_invitations`
Pending family invitations.

**Purpose**: Allow non-registered users to join families

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | FK to family |
| invited_email | VARCHAR(255) | Email to invite |
| inviting_parent_id | UUID | Parent who sent invite |
| role | VARCHAR(50) | What role to assign |
| invite_token | VARCHAR(255) | Unique token for link |
| expires_at | TIMESTAMP | Invitation expires |
| accepted_at | TIMESTAMP | When/if accepted |
| created_at | TIMESTAMP | Created |

**Flow**:
1. Parent invites "grandma@example.com" as "guardian"
2. Email sent with invite link containing token
3. User clicks link, registers/logs in
4. Invitation marked as accepted
5. User auto-added to family_members with specified role

**Indexes**:
- UNIQUE(invite_token)

---

### 6. Activity Log (1 table)

#### `activity_log`
Central log of all user activities for dashboard feed.

**Purpose**: Populate "Recent Activity" widget

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to user |
| activity_type | VARCHAR(100) | completed_chore, earned_badge, quiz_score, etc. |
| action | VARCHAR(255) | "Completed Clean bedroom" |
| points_earned | INTEGER | Points awarded |
| achievement_title | VARCHAR(255) | "Trash Master Bronze" if badge earned |
| related_item_id | UUID | Link to chore/lesson/badge |
| related_item_type | VARCHAR(100) | chore, lesson, badge, etc. |
| metadata | JSON | Extra data (quiz_score, time_taken, etc.) |
| created_at | TIMESTAMP | When activity occurred |

**Example Data**:
```json
{
  "user_id": "child-123",
  "activity_type": "completed_chore",
  "action": "Completed 'Clean bedroom'",
  "points_earned": 50,
  "related_item_id": "chore-456",
  "related_item_type": "chore",
  "metadata": { "time_taken_minutes": 25 }
}
```

**Queries**:
```sql
-- Get recent activity for dashboard
SELECT * FROM activity_log 
WHERE user_id = 'child-123'
ORDER BY created_at DESC 
LIMIT 10;

-- Get family activity
SELECT a.*, u.name
FROM activity_log a
JOIN users u ON a.user_id = u.id
JOIN family_members fm ON u.id = fm.user_id
WHERE fm.family_id = 'family-123'
ORDER BY a.created_at DESC
LIMIT 50;

-- Count activities by type this week
SELECT activity_type, COUNT(*) as count
FROM activity_log
WHERE user_id = 'child-123'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY activity_type;
```

---

### 7. Smart Home Integration (2 tables)

#### `smart_devices`
Connected smart devices from SmartThings.

**Purpose**: Inventory of family smart home devices

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| family_id | UUID | FK to family |
| device_id | VARCHAR(255) | SmartThings device ID |
| device_name | VARCHAR(255) | "Living Room Light" |
| device_type | VARCHAR(100) | light, thermostat, lock, outlet, etc. |
| device_status | VARCHAR(50) | on, off, unknown, etc. |
| room | VARCHAR(100) | "living_room", "bedroom", etc. |
| power_consumption_watts | DECIMAL(10,2) | For energy tracking |
| is_active | BOOLEAN | Include in control |
| last_sync_at | TIMESTAMP | Last time status refreshed |
| metadata | JSON | Extra SmartThings data |
| created_at | TIMESTAMP | Added to system |
| updated_at | TIMESTAMP | Last refresh |

**Indexes**:
- UNIQUE(device_id)

**Queries**:
```sql
-- Get devices by room
SELECT * FROM smart_devices 
WHERE family_id = 'family-123' 
AND room = 'living_room'
AND is_active = true;

-- Get devices by type
SELECT * FROM smart_devices 
WHERE device_type = 'light' 
AND is_active = true;

-- Get device status
SELECT device_name, device_status, last_sync_at 
FROM smart_devices 
WHERE family_id = 'family-123'
ORDER BY room, device_name;
```

#### `device_control_history`
Log of all device commands.

**Purpose**: Track who controlled what when

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| device_id | VARCHAR(255) | Which device |
| controlled_by_id | UUID | FK to user who commanded it |
| command | VARCHAR(100) | turn_on, turn_off, set_temp, etc. |
| command_args | JSON | Arguments (temperature value, etc.) |
| status | VARCHAR(50) | pending, success, failed |
| response | JSON | Response from SmartThings |
| executed_at | TIMESTAMP | When executed |

**Example**:
```json
{
  "device_id": "st-device-123",
  "controlled_by_id": "parent-456",
  "command": "set_temperature",
  "command_args": { "temperature": 72, "unit": "F" },
  "status": "success",
  "response": { "new_temperature": 72 }
}
```

---

## 🔗 Relationship Diagram

```
families
  ├─ family_members (users + roles)
  ├─ family_settings (configuration)
  ├─ parental_controls (per parent/child)
  ├─ announcements (messages)
  ├─ smart_devices (IoT devices)
  └─ energy_goals (gamification)

users
  ├─ activity_log (activity feed)
  ├─ learning_progress (courses)
  ├─ reminders (notifications)
  ├─ family_invitations (pending joins)
  └─ device_control_history (smart home)

learning_courses
  └─ learning_lessons
      └─ lesson_completions (by users)

smart_devices
  └─ energy_usage (power data)
  └─ device_control_history (commands)

energy_usage
  └─ energy_summary (daily/weekly/monthly)
```

---

## 🚀 Migration Instructions

### Step 1: Backup Current Database
```bash
pg_dump $DATABASE_URL > backup_phase1.sql
```

### Step 2: Run Migration
```bash
psql $DATABASE_URL < backend/migrations/004_phase2_features.sql
```

### Step 3: Verify Tables
```bash
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "\di"  # List all indexes
```

### Step 4: Seed Initial Data (Optional)
```bash
psql $DATABASE_URL < backend/migrations/005_seed_phase2_data.sql
```

---

## 📊 Capacity Planning

| Table | Expected Rows | Growth Rate | Retention |
|-------|---------------|------------|-----------|
| activity_log | 1M/month | High | 1 year |
| energy_usage | 10M/month | Very High | 90 days |
| energy_summary | 10K/month | Low | Forever |
| reminders | 100K | Medium | Auto-delete expired |
| announcements | 10K | Low | 1 year |
| learning_progress | 10K | Slow | Forever |
| lesson_completions | 100K | Medium | Forever |

**Recommendations**:
1. Archive old `energy_usage` data monthly to cold storage
2. Implement automatic purge for old `reminders` (30 days after expiry)
3. Use table partitioning for `activity_log` by date
4. Create materialized views for reporting queries

---

## ✅ Quality Checklist

- [x] All tables have primary keys (UUID)
- [x] All foreign keys reference existing tables
- [x] All indexes created for common queries
- [x] All timestamps use TIMESTAMP (not DATE)
- [x] All CHECK constraints validate enum-like values
- [x] UNIQUE constraints where appropriate
- [x] Cascading deletes where needed
- [x] Soft delete support via deleted_records (from Phase 1)
- [x] Documentation complete

---

## 📝 Next Steps

1. **Create API endpoints** (backend/src/routes/)
   - Use these tables in service layer
   - Add endpoints per stream

2. **Create React hooks** (frontend/src/hooks/)
   - useAnnouncements, useReminders, useEnergy, useLearning, useFamily, etc.

3. **Create frontend components** (frontend/src/components/)
   - Widgets, pages, forms for each feature

4. **Add tests**
   - API tests for each endpoint
   - Database integration tests
   - Component tests for UI

5. **Create seed data** (005_seed_phase2_data.sql)
   - Sample courses and lessons
   - Sample announcements
   - Sample reminders

---

**Schema Version**: 2.0  
**Created**: 2026-08-06  
**Status**: Ready for implementation

