# Original Features vs. Extensibility Architecture - Complete Mapping

**Date:** 2026-06-30  
**Status:** Gap Analysis & Feature Reconciliation  
**Purpose:** Ensure extensibility architecture complements (not conflicts with) original locked features

---

## OVERVIEW

**Original Design (from GitHub):**
- 20 locked sections across Activity Board, HA Dashboard, Parent Portal
- Comprehensive feature set with specific points, badge, quest rules
- Modular HTML-based architecture (v1)
- Flutter + backend planned (Phase 1)

**New Extensibility Architecture:**
- 24 database tables for dynamic feature management
- 80+ API endpoints for configuration
- Support for future expansion without code changes

**Goal:** Verify 100% alignment and identify gaps

---

## PART 1: ORIGINAL FEATURES INVENTORY

### ✅ Activity Board (20 Sections)

#### 1. Games (4 games + cross-game rules)
**Original Spec:**
- Wordle: 10 pts base × difficulty, attempts remaining bonus, escalating hint penalties
- Quick-Fire: Lives-based, compound scoring (10 × difficulty × combo + speed + lives bonuses)
- Word Scramble: Tile-based, 3 hint types, time-based scoring
- Hangman: Lives-based, stick figure, on-screen keyboard

**Extensibility Support:**
- ✅ feature table: Store each game as separate feature
- ✅ points_config table: Configure base points & multipliers per game per child
- ✅ feature_rate_limits table: Limit games per day (e.g., 3 Wordle/day)
- ✅ Content system: Word pool for Wordle, scramble solutions, etc.

**Gaps Identified:**
- ❓ Hint escalation logic (−5, −10, −20): Should this be configurable per child in Parent Portal?
- ❓ Speed bonus calculations: Need to store/track attempt times for scoring

---

#### 2. Trivia System (1,000 questions, 16 categories, 4 levels)
**Original Spec:**
- 1,000 questions distributed: 30% L1, 30% L2, 25% L3, 15% L4
- 16 categories with unlock progression
- Dynamic hint reduction based on performance
- Question cycling (14 days correct, 3-7 days incorrect)
- Category mastery with 4 levels

**Extensibility Support:**
- ✅ content_items table: Store trivia questions (type='trivia_question')
- ✅ feature_analytics table: Track trivia session analytics
- ✅ validation_schemas table: Enforce question structure (required fields, options, etc.)
- ✅ points_config table: Configure trivia points (10/15/20/30 for L1-L4)

**Gaps Identified:**
- ❌ **Question Cycling Logic:** No table for "last shown date" or "next show date"
- ❌ **Hint Reduction Tracking:** No per-category hint counter
- ❌ **Mastery Level Progression:** No table for unlock conditions (80%/80%/90%)
- ⚠️ Need to add: `trivia_tracking` table for per-child trivia state

---

#### 3. Daily Quests (130+ templates, calendar-aware)
**Original Spec:**
- 130+ quest pool across all modules
- No duplicate types per day
- Max 1 streak/points quest per day
- 1 free swap, optional points cost
- +50 bonus for all 3 quests

**Extensibility Support:**
- ✅ content_items table: Store quest templates
- ✅ points_config table: Configure quest base points
- ✅ validation_schemas table: Enforce quest structure

**Gaps Identified:**
- ❌ **Quest Generator Logic:** No table for quest generation rules/constraints
- ❌ **Swap Tracking:** No table for daily quest swaps
- ❌ **Quest Streak:** No table for quest completion streaks
- ⚠️ Need to add: `daily_quests` table with generation rules

---

#### 4. Chores (Lives in HA Dashboard, not Activity Board in v1)
**Original Spec:**
- Lives in HA Dashboard only in v1
- Activity Board points integration deferred to v2
- Priority-based points

**Extensibility Support:**
- ✅ feature table: Mark as "HA Dashboard" module type
- ✅ points_config table: Configure per chore type

**Gaps Identified:**
- None - properly deferred

---

#### 5. Homework
**Original Spec:**
- Time estimate (parent sets, child enters own)
- 10 predefined subjects (parent customizable)
- Points: base + time bonus + deadline multiplier
- Late/missed handling

**Extensibility Support:**
- ✅ content_items table: Store homework assignments
- ✅ activity_categories table: Subject list
- ✅ points_config table: Time bonus multipliers

**Gaps Identified:**
- ❌ **Subject List:** Need table for predefined subjects (can use activity_categories as workaround)
- ❌ **Late Penalty Logic:** No table for deadline-based multipliers
- ⚠️ Consider: Explicit `homework_subjects` table or use activity_categories

---

#### 6. Kung Fu
**Original Spec:**
- Session types (Class/Home Practice)
- Built-in flashcard timer
- Habit linking (auto-links to Exercise habit)
- Belt progression (manual parent update)

**Extensibility Support:**
- ✅ content_items table: Store flashcard decks
- ✅ activity table: Log sessions
- ✅ notification system: Missed class alert

**Gaps Identified:**
- ❌ **Session Types:** No enum/table for session type definitions
- ❌ **Belt Progression:** No belt level tracking table
- ⚠️ Need to add: `kung_fu_belt_levels` table

---

#### 7. Habits (11 predefined + custom)
**Original Spec:**
- 11 predefined habits with auto-link equivalencies
- Custom habits (parent direct, child with approval)
- Points: 5 pts base + streak bonuses
- Missed day: free recovery + points-based

**Extensibility Support:**
- ✅ features table: Each habit as separate feature
- ✅ points_config table: Configure habit points
- ✅ notification_preferences table: Habit reminders

**Gaps Identified:**
- ❌ **Predefined Habits:** Need table for 11 predefined habits
- ❌ **Equivalency Mapping:** No table for habit linking rules
- ❌ **Missed Day Recovery:** Need recovery tracking
- ⚠️ Need to add: `predefined_habits` table

---

#### 8. Reading
**Original Spec:**
- 5 entry types (all time-based, no pages)
- Built-in timer + manual fallback
- Points: 1 pt/5 min + completion bonus
- 10 genres + custom
- Weekly time goal (60 min default)

**Extensibility Support:**
- ✅ activity_categories table: Reading genres
- ✅ points_config table: Time-based point calculation
- ✅ notification_preferences table: Weekly goal reminders

**Gaps Identified:**
- ❌ **Entry Types:** No table for 5 entry type definitions
- ❌ **Reading Goal:** No weekly time goal tracking
- ⚠️ Need to add: `reading_entry_types` table, `reading_goals` table

---

#### 9. Mood
**Original Spec:**
- 6 emoji options + energy level + optional notes
- Privacy (sensitive entries, parent can reveal)
- Trends display (7-day + full trends)
- Parent alert for 3+ difficult days

**Extensibility Support:**
- ✅ activity table: Log mood entries
- ✅ notification_preferences table: Privacy settings
- ✅ feature_analytics table: Trend analysis

**Gaps Identified:**
- ❌ **Mood Emojis:** No table for emoji definitions
- ❌ **Privacy Rules:** No table for sensitive entry rules
- ❌ **Trend Triggers:** No table for alert rules (3+ difficult days)
- ⚠️ Need to add: `mood_settings` table, `mood_thresholds` table

---

#### 10. Gujarati Learning Module
**Original Spec:**
- 5-phase curriculum
- 4-component lesson structure
- Built-in timer + completion tracking
- Points aligned with existing system
- Parent involvement (custom lessons, struggle words)

**Extensibility Support:**
- ✅ content_items table: Store lesson content
- ✅ points_config table: Configure Gujarati points
- ✅ feature_analytics table: Curriculum progress

**Gaps Identified:**
- ❌ **Curriculum Structure:** No table for 5-phase curriculum definition
- ❌ **Lesson Components:** No table for 4-component structure
- ❌ **Struggle Words:** No tracking table
- ⚠️ Need to add: `curriculum_phases` table, `lesson_components` table

---

#### 11. Calendar
**Original Spec:**
- Append-only activity history
- 9 personal item types + custom
- Multi-person color-coded entries
- Two-system architecture (HA + Activity Board)

**Extensibility Support:**
- ✅ audit_trail table: Append-only history
- ✅ activity_categories table: Item types
- ✅ events table: Calendar events

**Gaps Identified:**
- ❌ **Item Type Colors:** No table for color coding
- ❌ **Multi-person Entries:** Need multi-user tracking
- ⚠️ Consider: Extended events table with color, person fields

---

#### 12. Points Tracker Module
**Original Spec:**
- Summary + detailed ledger
- Projection (7-day rolling average)
- Weekly/monthly visuals
- Parent visibility + CSV export

**Extensibility Support:**
- ✅ points_ledger table: Detailed ledger
- ✅ feature_analytics table: Summary statistics
- ⚠️ Report generation: No table, but can generate from ledger

**Gaps Identified:**
- ✅ Mostly covered - good design

---

#### 13. Settings & Customization
**Original Spec:**
- Krish controls: theme, difficulty, sounds, avatar, display name
- Parent controls: 8 tabs with various settings
- Data management: export, reset levels, JSON backup

**Extensibility Support:**
- ✅ theme_customizations table: Theme settings
- ✅ notification_preferences table: Sound/notification settings
- ✅ user_roles & permissions: Parent portal settings

**Gaps Identified:**
- ❌ **Avatar System:** No table for avatar definitions/emojis
- ✅ Mostly covered - good design

---

#### 14. Notifications & Alerts
**Original Spec:**
- 35+ Krish notification types across categories
- Priority levels (3 types with different behaviors)
- Do-not-disturb (school hours, bedtime, focus mode)
- Two-step system (HA pointer → Activity Board detail)

**Extensibility Support:**
- ✅ notifications table: Full notification system
- ✅ notification_preferences table: DND settings
- ✅ system_alerts table: Alert management

**Gaps Identified:**
- ❌ **Notification Types Catalog:** No table for defining 35+ notification types
- ❌ **Priority Level Rules:** No table for priority behaviors
- ⚠️ Need to add: `notification_types` table

---

#### 15. Onboarding Flow
**Original Spec:**
- Welcome → name/avatar → choice → destination
- Contextual tutorials + help system
- Interactive game demos
- Feedback system (💬 icon, 4 types, auto-screenshot)

**Extensibility Support:**
- ✅ Mostly UI-driven, not extensibility-focused

**Gaps Identified:**
- ✅ Covered at UI layer

---

#### 16. Google Drive Sync (v2)
**Original Spec:**
- OAuth flow, full state backup
- Event-driven sync with 30s debounce
- Section-aware conflict resolution
- Full/partial restore with typed confirmation

**Extensibility Support:**
- ✅ integrations & integration_connections tables: OAuth support
- ✅ backup_jobs table: Backup scheduling

**Gaps Identified:**
- ✅ Mostly covered

---

#### 17. Achievement Badges (~400+ badges)
**Original Spec:**
- ~400+ badges across 13 categories
- 4-tier system (Bronze/Silver/Gold/Platinum)
- Unlock conditions (specific achievement counts)

**Extensibility Support:**
- ✅ badges table: Store badge definitions
- ✅ badge_unlock_logic table: Unlock conditions
- ✅ child_badges table: Track unlocks per child

**Gaps Identified:**
- ✅ Good design - fully supported

---

#### 18. Weekly & Monthly Goals
**Original Spec:**
- Goal types: play X games, score X points, complete trivia, maintain streak, custom
- Real-time progress bars
- Bonus points on completion
- Goal history archiving

**Extensibility Support:**
- ✅ goals table: Goal storage
- ✅ points_config table: Bonus configuration

**Gaps Identified:**
- ✅ Fully supported

---

#### 19. Category Mastery Tracking
**Original Spec:**
- Per-category stats (correct/total, accuracy, streak)
- Category-specific badges
- "Master this category" badges

**Extensibility Support:**
- ✅ feature_analytics table: Category accuracy tracking
- ✅ badges table: Category mastery badges

**Gaps Identified:**
- ❌ **Category Mastery Levels:** Need explicit tracking table
- ⚠️ Need to add: `category_mastery_progress` table

---

#### 20. Daily Challenge Mode
**Original Spec:**
- Play all 4 games in sequence
- 3 lives (lose game = -1 life)
- Progressive difficulty
- 2.5x multiplier for clean sweep

**Extensibility Support:**
- ✅ features table: Daily Challenge as separate feature
- ✅ points_config table: 2.5x multiplier configuration

**Gaps Identified:**
- ❌ **Challenge Sequence:** No table for game sequence definition
- ⚠️ Need to add: `daily_challenge_rules` table

---

### ✅ HA Dashboard (12 Foundations + 6 Features)

**Foundations:** Layout, roles, responsiveness, persistence, sync, error handling, theming, notifications, accessibility, Activity Board integration, security, smart home

**Features:** Clock + Weather, Family Calendar, Shopping List, Meal Planner, Announcement Banner, Night Mode

**Extensibility Support:**
- ✅ dashboard_widgets table: All widgets supported
- ✅ child_dashboard_layout table: Customization per child
- ✅ theme_customizations table: Night mode + theming

**Gaps Identified:**
- ✅ Mostly supported - good design

---

### ✅ Parent Portal (6 Sections)

1. Dashboard Management
2. Activity Board Parent Controls
3. Settings & Configuration
4. Analytics & Insights
5. User Management
6. Home Automations & Smart Home

**Extensibility Support:**
- ✅ roles_permissions: Access control
- ✅ feature_analytics: Insights
- ✅ audit_trail: Activity logging
- ✅ automations: Smart home integration

**Gaps Identified:**
- ✅ Mostly supported - good design

---

## PART 2: GAP ANALYSIS & MISSING TABLES

### 🔴 CRITICAL GAPS (Must add to Phase 1)

1. **Trivia Tracking Table**
```sql
CREATE TABLE trivia_tracking (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  trivia_question_id UUID NOT NULL REFERENCES content_items(id),
  last_shown_date DATE,
  next_show_date DATE,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Tracks question cycling rules (14 days correct, 3-7 days incorrect)

---

2. **Daily Quest Generation Rules Table**
```sql
CREATE TABLE daily_quest_rules (
  id UUID PRIMARY KEY,
  quest_template_id UUID NOT NULL REFERENCES content_items(id),
  
  -- Generation constraints
  max_per_day INTEGER DEFAULT 1,
  conflicts_with JSONB, -- quest IDs that can't appear same day
  requires_feature_id UUID REFERENCES features(id),
  
  -- Scheduling
  preferred_day_of_week VARCHAR(20), -- bias (mon, tue, etc)
  season VARCHAR(20), -- bias (spring, summer)
  
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Implement quest generation algorithm (no duplicates, max 1 streak quest)

---

3. **Predefined Habits Table**
```sql
CREATE TABLE predefined_habits (
  id UUID PRIMARY KEY,
  name VARCHAR(255), -- "Morning Exercise", "Read for 30 min"
  description TEXT,
  points_per_completion INTEGER DEFAULT 5,
  emoji VARCHAR(10),
  
  -- Equivalency mapping
  linked_activities JSONB, -- ["Kung Fu", "Yoga", "Running"]
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Manage 11 predefined habits and their equivalencies

---

4. **Habit Recovery Tracking Table**
```sql
CREATE TABLE habit_recovery_tracking (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  habit_id UUID NOT NULL REFERENCES habits(id),
  
  missed_date DATE,
  recovery_type VARCHAR(20), -- 'free' (1/month), 'points' (cost)
  recovery_cost_points INTEGER,
  recovery_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Track free recovery (once/month) and points-based recovery for missed habits

---

5. **Kung Fu Belt Levels Table**
```sql
CREATE TABLE kung_fu_belt_levels (
  id UUID PRIMARY KEY,
  name VARCHAR(100), -- "White", "Yellow", "Orange", etc.
  color_hex VARCHAR(7),
  level_order INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add to children table:
ALTER TABLE children ADD COLUMN current_belt_id UUID REFERENCES kung_fu_belt_levels(id);
```
**Why:** Track belt progression for Kung Fu module

---

6. **Quest Swap Tracking Table**
```sql
CREATE TABLE quest_swaps (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  original_quest_id UUID NOT NULL REFERENCES content_items(id),
  swapped_quest_id UUID NOT NULL REFERENCES content_items(id),
  
  swap_date DATE,
  cost_points INTEGER, -- free (1/day) or point-based cost
  
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Track daily quest swaps and enforce 1 free swap/day limit

---

7. **Category Mastery Progress Table**
```sql
CREATE TABLE category_mastery_progress (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  category_id UUID NOT NULL REFERENCES activity_categories(id),
  
  total_questions INTEGER DEFAULT 0,
  correct_questions INTEGER DEFAULT 0,
  accuracy_percent FLOAT,
  
  mastery_level INTEGER DEFAULT 1, -- 1, 2, 3, 4 (Rookie, Pro, Legend, Master)
  unlock_requirements JSONB, -- {L1: "80%", L2: "80%", L3: "90%"}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(child_id, category_id)
);
```
**Why:** Track category mastery levels with unlock requirements

---

8. **Notification Types Catalog Table**
```sql
CREATE TABLE notification_types (
  id UUID PRIMARY KEY,
  name VARCHAR(100), -- 'quest_completed', 'badge_unlocked', etc.
  display_name VARCHAR(255),
  description TEXT,
  
  -- Behavior
  priority VARCHAR(20), -- 'high', 'medium', 'low'
  show_in_activity_board BOOLEAN DEFAULT true,
  show_in_ha_dashboard BOOLEAN DEFAULT false,
  
  -- Customization
  icon_emoji VARCHAR(10),
  sound_enabled_default BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Why:** Define 35+ notification types and their behaviors

---

### 🟡 MODERATE GAPS (Should add to Phase 1)

9. **Reading Entry Types Table**
```sql
CREATE TABLE reading_entry_types (
  id UUID PRIMARY KEY,
  name VARCHAR(100), -- "Book", "Article", "Blog", "Story", "Chapter"
  description TEXT,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);
```

10. **Mood Emojis & Thresholds Table**
```sql
CREATE TABLE mood_settings (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  
  difficult_mood_threshold INTEGER DEFAULT 3, -- alert after 3+ difficult days
  alert_parent_email BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(child_id)
);
```

11. **Daily Challenge Rules Table**
```sql
CREATE TABLE daily_challenge_rules (
  id UUID PRIMARY KEY,
  game_order INTEGER, -- 1, 2, 3, 4 (sequence)
  feature_id UUID NOT NULL REFERENCES features(id),
  difficulty_scaling VARCHAR(50), -- how difficulty increases per game
  lives_per_game INTEGER DEFAULT 1,
  base_multiplier FLOAT DEFAULT 2.5,
  clean_sweep_bonus FLOAT DEFAULT 1.0, -- extra multiplier
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

12. **Curriculum Structure Tables (for Gujarati)**
```sql
CREATE TABLE curriculum_phases (
  id UUID PRIMARY KEY,
  phase_number INTEGER, -- 1-5
  name VARCHAR(255),
  description TEXT,
  total_lessons INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lesson_components (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES content_items(id),
  component_type VARCHAR(100), -- "vocabulary", "grammar", "pronunciation", "practice"
  content TEXT,
  duration_minutes INTEGER,
  order_in_lesson INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🟢 MINOR GAPS (Can add Phase 1.5)

13. **Reading Goals Table**
```sql
CREATE TABLE reading_goals (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  weekly_time_goal_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT NOW()
);
```

14. **Event Color Coding Table**
```sql
CREATE TABLE event_colors (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  hex_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## PART 3: COMPREHENSIVE TABLE INVENTORY

### Final Count: 38 Total Tables

**Original 24:**
1. features
2. child_features
3. dashboard_widgets
4. child_dashboard_layout
5. activity_categories
6. points_config
7. badge_unlock_logic
8. ha_device_types
9. feature_flags
10. roles / permissions / role_permissions / user_roles (4)
11. feature_dependencies
12. widget_credentials
13. feature_analytics / widget_analytics / flag_rollout_analytics (3)
14. notification_preferences
15. theme_customizations
16. content_items / content_usage (2)
17. audit_trail
18. feature_rate_limits
19. translations
20. validation_schemas
21. api_quotas
22. error_logs
23. workflow_states
24. resource_state_history

**NEW GAPS (14):**
25. trivia_tracking (🔴 CRITICAL)
26. daily_quest_rules (🔴 CRITICAL)
27. predefined_habits (🔴 CRITICAL)
28. habit_recovery_tracking (🔴 CRITICAL)
29. kung_fu_belt_levels (🔴 CRITICAL)
30. quest_swaps (🔴 CRITICAL)
31. category_mastery_progress (🔴 CRITICAL)
32. notification_types (🔴 CRITICAL)
33. reading_entry_types (🟡 MODERATE)
34. mood_settings (🟡 MODERATE)
35. daily_challenge_rules (🟡 MODERATE)
36. curriculum_phases (🟡 MODERATE)
37. lesson_components (🟡 MODERATE)
38. reading_goals (🟢 MINOR)
39. event_colors (🟢 MINOR)

---

## SUMMARY TABLE

| Original Feature | Supported by Extensibility? | Gaps Found | Severity |
|---|---|---|---|
| 4 Games | ✅ Mostly | Hint escalation config | 🟡 Medium |
| Trivia System | ⚠️ Partial | Question cycling, hint reduction, mastery tracking | 🔴 High |
| Daily Quests | ⚠️ Partial | Quest generator rules, swap tracking | 🔴 High |
| Chores | ✅ Yes | None | - |
| Homework | ✅ Mostly | Late penalty multipliers | 🟡 Medium |
| Kung Fu | ⚠️ Partial | Belt progression tracking | 🔴 High |
| Habits | ⚠️ Partial | Predefined habits, recovery tracking, equivalencies | 🔴 High |
| Reading | ⚠️ Partial | Entry types, weekly goals | 🟡 Medium |
| Mood | ⚠️ Partial | Emoji definitions, threshold alerts | 🟡 Medium |
| Gujarati | ⚠️ Partial | Curriculum structure, lesson components | 🔴 High |
| Calendar | ✅ Mostly | Color coding | 🟡 Medium |
| Points Tracker | ✅ Yes | None | - |
| Settings | ✅ Mostly | Avatar system | 🟡 Medium |
| Notifications | ⚠️ Partial | Notification types catalog | 🔴 High |
| Onboarding | ✅ Yes | None (UI layer) | - |
| Drive Sync | ✅ Yes | None | - |
| Badges | ✅ Yes | None | - |
| Goals | ✅ Yes | None | - |
| Category Mastery | ⚠️ Partial | Mastery level progression | 🔴 High |
| Daily Challenge | ⚠️ Partial | Challenge rules & sequencing | 🔴 High |

---

## FINAL RECOMMENDATIONS

### ✅ PHASE 1 MUST ADD (14 tables)

**Priority 1 - Critical (8 tables):**
- trivia_tracking
- daily_quest_rules
- predefined_habits
- habit_recovery_tracking
- kung_fu_belt_levels
- quest_swaps
- category_mastery_progress
- notification_types

**Priority 2 - Important (6 tables):**
- reading_entry_types
- mood_settings
- daily_challenge_rules
- curriculum_phases
- lesson_components
- (event_colors can defer)

### ⏳ PHASE 1.5 (Can defer 1 table)
- reading_goals
- event_colors

---

## CHECKLIST FOR APPROVAL

- [ ] All 14 gap tables added to EXTENSIBILITY_SCHEMA.md
- [ ] All corresponding API endpoints added
- [ ] Original features re-validated against new tables
- [ ] No conflicts or duplications
- [ ] Ready to proceed with Phase 1 implementation

---

**Status:** Ready for your review

**Questions for you:**
1. ✅ Do you want all 14 gap tables in Phase 1, or split?
2. ✅ Any other gaps you see in the original features?
3. ✅ Ready to move forward with detailed Phase 1 planning?

