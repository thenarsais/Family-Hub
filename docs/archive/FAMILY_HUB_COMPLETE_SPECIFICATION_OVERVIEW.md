# Family Hub Complete Specification Overview

**Date:** 2026-06-25  
**Status:** ALL SYSTEMS LOCKED ✅  
**Scope:** Comprehensive specification for HA Dashboard, Activity Board, and Parent Portal

---

## Executive Summary

The Family Hub is a comprehensive digital platform designed to gamify family activities, encourage learning, and provide parental oversight. It consists of three interconnected systems:

1. **HA Dashboard** — Shared family monitor (27" touchscreen) showing real-time family information
2. **Activity Board** — Gamified activity tracking app for Krish with games, learning, and rewards
3. **Parent Portal** — Parental monitoring, management, and customization interface

**Total Scope:** 32+ major features across 3 integrated systems, all fully specified and locked for implementation.

---

## SYSTEM 1: HA FAMILY HUB DASHBOARD

### Scope & Purpose
- **Primary Display:** 27" touchscreen monitor (portrait orientation)
- **Purpose:** Single source of truth for family information, accessible to all family members
- **Design Philosophy:** Information-rich, real-time, responsive, accessible
- **Platform:** Home Assistant OR Flutter/Dart + Firebase/Superbase/Node.js + PostgreSQL (platform-agnostic)

### Architectural Foundations (12 Locked)

| Foundation | Decision |
|-----------|----------|
| **Layout & Architecture** | Card-based grid layout with Family Calendar as focal point |
| **User Roles & Visibility** | Public view for all family members; locked features for parents only |
| **Responsive Design** | Monitor (27") + mobile companion app with responsive layouts |
| **Data Persistence** | Centralized database (PostgreSQL or Firebase) as single source of truth |
| **Real-Time Updates** | WebSocket for critical (chores, announcements), REST polling for standard (10-30s) |
| **Loading & Errors** | Skeleton loaders (>500ms), cached fallback, user-friendly error messages |
| **Theming** | 4 seasonal themes (Spring/Summer/Fall/Winter) shared with Activity Board |
| **Notifications** | 2-step system: HA pointer → Activity Board detail |
| **Accessibility** | WCAG standards, touch targets 48px+, high contrast |
| **Activity Board Integration** | Bidirectional sync (real-time WebSocket) for chores, mood, milestones |
| **Security** | Password auth + optional push notification verification, session tokens |
| **Smart Home Integration** | Controls lights, thermostat, locks, speakers, cameras, TVs via automations |

### Core Features (6 Locked)

#### 1. Clock + Weather Card
- 12-hour format (no seconds), local timezone, auto-update
- Date display
- Current weather (icon, temp, condition)
- 7-day forecast (expandable)
- Customizable weather location
- Real-time updates every 5-10 minutes

#### 2. Family Calendar
- Unified calendar (multiple sources: Google, Outlook, Apple)
- Color-coded by person
- Event types: Meals, School, Appointments, Activities, Holidays, Custom
- Expand to see full day agenda
- Multi-timezone support (primary + 2 configurable)
- 7-day rolling view (not Mon-Sun fixed)
- Shows busy indicator (total hours scheduled)

#### 3. Shopping List
- Grouped by store (Whole Foods, Target, etc.)
- Add from menu items in Meal Planner
- Check-off items (track completion)
- Persist across sessions
- Mobile companion (barcode scanning, batch actions)

#### 4. Meal Planner
- 7-day rolling view (Mon-Sun)
- Meals: Breakfast, Lunch, Snack, Dinner
- Card view: Shows week overview
- Expand: Full 7-day calendar with recipe panel (drag-and-drop)
- Recipe suggestions panel on right side
- Convert to shopping list items
- Integrate with calendar

#### 5. Family Announcement Banner
- Scroll through current announcements
- 3 priority levels: Critical (red), Important (yellow), Fun (blue)
- Krish acknowledges (tracked in Activity Board)
- Auto-archive after X days
- Parent creates via Parent Portal
- Real-time push notification to devices

#### 6. Night Mode
- Auto-activate 9 PM - 6 AM (configurable hours)
- Low-blue-light theme (warm colors)
- Reduced brightness
- Essential info only (time, urgent announcements)
- Manual override (parent can force on/off)

### Additional HA Dashboard Elements
- Connection status indicator
- Sync status (when updating)
- Manual refresh button
- Mobile companion app link
- Quick action buttons (per card)
- Offline indicator (when unavailable)

### HA Dashboard Data Model
```
State structure:
├─ calendar (events, multi-source, timezone-aware)
├─ weather (current, forecast, location)
├─ meals (7-day rolling, recipes, categories)
├─ shopping (items, categories, store grouping)
├─ announcements (current, priority, acknowledgments)
├─ chores (linked from Activity Board, bidirectional sync)
├─ mood (current mood of Krish, logged in Activity Board)
└─ smartHome (device status, automation state)
```

---

## SYSTEM 2: ACTIVITY BOARD

### Scope & Purpose
- **Primary User:** Krish (child)
- **Purpose:** Gamified activity tracking with games, learning, social features
- **Design:** Single HTML file (v1) → PWA (v2)
- **Platform:** Chrome browser (v1), cross-platform (v2)

### Architecture (Modular, Event-Driven)
- **File Structure:** Modular HTML files + shared folder (state.js, config.js, events.js, theme.js, styles.css)
- **State Management:** localStorage (v1) → Google Drive Sync (v2)
- **Communication:** Event bus (events.js) — no direct module references
- **Parent Portal:** Password-protected mode (v1) → Separate interface (v2)
- **Offline:** Full offline support with sync on reconnect
- **State Versioning:** Migrations for schema evolution

### 20 Locked Sections

#### 1. Games (4 Games + Learn More System)
**Games:**
- **Wordle:** Guess word in X attempts (untimed), base 10pts × difficulty
- **Quick-Fire Trivia:** Lives-based multiple choice, combo multipliers
- **Word Scramble:** Unscramble letters with tile/keyboard input
- **Hangman:** Guess letters with stick figure, on-screen keyboard

**Cross-Game Features:**
- Difficulty multipliers: Easy 1×, Medium 1.5×, Hard 2×
- Lives/attempts bonuses: +2-5 pts per remaining
- Auto-save + resume (same day, expires midnight)
- Filtered leaderboards (personal best, time filters)
- On-screen keyboards (Wordle, Hangman)
- Hint system (escalating costs: -5, -10, -20 pts)

**Learn More System:**
- Per-category curated links (Claude-curated)
- Parent auditable (can review/block links)
- Contextual (shown during trivia)

#### 2. Trivia System
- **1,000 questions** across 16 categories
- **4 difficulty levels** with unlock progression (80% accuracy thresholds)
- **11 themes** aligned with UI
- **Category mastery:** 4 levels per category
- **Dynamic hints:** 3 phases (generous → discouraged → disabled)
- **Fun facts:** Conditional display (correct/wrong/skip scenarios)
- **Question cycling:** 14 days if correct, 3-7 days if incorrect
- **Session modes:** 5, 10, or 20 questions
- **Stats tracking:** Fastest answer, favorite category, hints used

#### 3. Daily Quest System
- **130+ quest templates** across all modules
- **3 random quests/day** (calendar-aware, no duplicates)
- **Rewards:** +50 pts bonus for completing all 3
- **Streak tracking:** Consecutive days completing all quests
- **1 free swap/day** (additional swaps cost points)
- **No penalties:** Miss bonus only, no streak break
- **Reset:** Midnight in user's timezone

#### 4. Chores (HA Dashboard Integration)
- **Lives in HA Dashboard** (v1), Activity Board points deferred (v2)
- **Recurrence:** Daily, weekly, calendar-triggered
- **Priority-based points:** Parent sets values (Low/Medium/High)
- **Bidirectional sync:** Activity Board → HA Dashboard (real-time)
- **Streak contribution:** Counts toward daily activity streak
- **Parent controls:** Create, assign, verify completion

#### 5. Homework
- **Time estimation:** Parent sets target, Krish enters own, parent approves
- **10 predefined subjects** (Math, Science, English, etc.) + custom
- **Points formula:** Base + time bonus + deadline multiplier
- **Late handling:** -50% points for late completion
- **Deadline incentives:** +50% for on-time
- **Subject color-coding:** Visual category system
- **Detailed categorization:** Math > Algebra, Science > Biology, etc.
- **Parent dashboard:** Review estimates, verify completion

#### 6. Kung Fu
- **Session logging:** Parent logs classes, Krish logs practice
- **Session types:** Class or home practice
- **Flashcards:** Parent creates, Krish creates (parent approval required)
- **Belt progression:** Manual parent update
- **Points:** 10 pts/30 min sessions + 5 pts/15 min flashcard study
- **Habit integration:** Auto-links to Exercise habit
- **Streak badges:** Practice consistency tracking

#### 7. Habits
- **11 predefined habits:** Yoga, Meditation, Read, Exercise, etc.
- **Custom habits:** Parent direct, Krish with approval
- **Equivalency system:** Kung Fu → Exercise, Reading → Read, etc.
- **Points:** 5 pts base + streak bonuses
- **Streak tracking:** Consecutive days with visual calendar
- **Recovery:** 1 free/month + points-based option
- **No reminders:** Visual check-in only
- **Celebration animations:** One-tap check-in with feedback

#### 8. Mood Logging
- **6 emoji options:** Happy, Sad, Anxious, Excited, Tired, Focused
- **Energy level scale:** 1-10 or good/ok/bad
- **Optional notes:** Text field for context
- **Privacy:** Sensitive entries (parent can reveal if needed)
- **Trends display:** 7-day strip + full trend analysis
- **Parent alerts:** Notification if 3+ difficult moods
- **Real-time automations:** Can trigger smart home (calm scenes)
- **Mood correlation:** Activity Board analytics track mood patterns

#### 9. Reading
- **5 entry types:** Book, Article, Passage, Comic, Website (all time-based)
- **Built-in timer:** Start/stop + manual fallback
- **Points:** 1 pt/5 min + completion bonus
- **Rating system:** Stars + reaction emoji
- **10 genres:** Fantasy, Sci-Fi, Mystery, etc. + custom
- **Weekly goal:** 60 min default (customizable)
- **Progress tracking:** Genre breakdowns, time analytics

#### 10. Gujarati Learning
- **5-phase curriculum:** Intro → Beginner → Intermediate → Advanced → Mastery
- **Lesson structure:** Vocabulary + Grammar + Exercises + Assessment
- **Built-in timer:** Timed drills + open-ended
- **Progress tracking:** Percent complete per phase
- **Points:** Aligned with rest of system
- **Parent involvement:** Custom lessons, struggle word tracking
- **Vocabulary growth:** Words learned per week analytics

#### 11. Calendar
- **Two-system architecture:** HA Dashboard + Activity Board
- **Permanent history:** Append-only activity log
- **9 item types:** Chore, Homework, Game, Trivia, Habit, Mood, Reading, Kung Fu, Calendar event
- **Color-coded:** By person (multi-person support)
- **Chore rules:** Parent sets rules (v1 manual, v2 auto-trigger)
- **Bidirectional sync:** HA Dashboard ↔ Activity Board
- **Krish-filtered view:** Only shows relevant activities

#### 12. Points Tracker
- **Summary view:** Total, today, this week, this month
- **Detailed ledger:** All transactions with timestamps
- **Projection:** 7-day rolling average (requires 3+ days)
- **Weekly/monthly visuals:** Bar chart + heatmap
- **Parent visibility:** CSV export, spike alerts, category trends
- **Daily goal:** Customizable (default 50 pts)
- **Cap/floor:** Parent can set limits

#### 13. Settings (Krish View)
- **Theme selector:** Manual season picker (4 options)
- **Difficulty theme:** Color palette selection (11 themes)
- **Sound effects:** On/off + volume control
- **Avatar customization:** Emoji picker
- **Display name:** User-set (privacy)
- **Notification prefs:** Sound, browser, reminders
- **Timezone:** For accurate daily reset

#### 14. Notifications & Alerts
- **35+ notification types:** Across all modules
- **3 priority levels:** Critical, Important, Standard
- **Delivery:** In-app toast + optional sound + optional browser
- **Do-not-disturb:** Calendar-aware (school hours, bedtime, focus mode)
- **Scheduled reminders:** Daily at user-selected time
- **Event types:** Quest completion, daily goal, streaks, badges, multiplier, etc.

#### 15. Onboarding Flow
- **Welcome screen:** Introduction
- **Name/avatar setup:** User customization
- **Choice screen:** Select starting activity
- **Contextual tutorials:** Help icon on every module
- **Interactive demos:** Game tutorial mode
- **Feedback system:** 💬 icon for feedback (4 types, auto-screenshot)

#### 16. Google Drive Sync (v2)
- **OAuth flow:** Parent-initiated, folder-scoped
- **Sync scope:** Full state + config + custom questions + activity log + feedback
- **Event-driven:** 30-second debounce on changes
- **Conflict resolution:** Section-aware (merge vs. last-write-wins)
- **Offline:** Full offline functionality with queue
- **Drive folder:** Organized structure (backups, restore points)
- **Retention:** 30-day auto + manual indefinite
- **Restore:** Full/partial with typed confirmation
- **Privacy:** Encrypted, GDPR-compliant

#### 17. Achievement Badges (~400+ Badges)
- **4 tiers:** Bronze → Silver → Gold → Platinum (aligned with difficulty themes)
- **13 categories:** Games, Trivia, Homework, Kung Fu, Habits, Mood, Reading, Gujarati, Daily Quests, Points, Streaks, Special, Calendar
- **Per-category badges:** Volume, accuracy, speed, streak, specialty
- **Unlock animations:** Visual celebration when earned
- **Display:** Profile, dashboard, leaderboards
- **Progression:** Clear requirements for each tier

#### 18. Weekly & Monthly Goals
- **18 predefined templates:** Play X games, Score X points, Complete X trivia, Maintain habit streak, Custom
- **Goal creation:** Parent direct + Krish with approval
- **4 difficulty tiers:** Easy/Medium/Hard/Expert with adaptive suggestions
- **Completion bonuses:** Weekly 50pts base, monthly 150pts + streak + early completion
- **Partial credit:** Tiered (50%/75%/90%/100%) + "almost there" notifications
- **Expired handling:** Auto-awarded partial credit
- **Active limits:** 3 weekly + 2 monthly max
- **Real-time tracking:** Progress bars with ETA

#### 19. Category Mastery Tracking
- **Per-category stats:** Correct/total, accuracy %, streaks
- **Category badges:** Master this category achievements
- **Display:** In trivia panel, leaderboards, analytics
- **Per-category streaks:** Consecutive correct tracking
- **Weak area highlighting:** Show where Krish struggles

#### 20. Daily Challenge Mode
- **Frequency:** Once per day, on-demand start
- **Structure:** All 4 games in sequence, 3 lives, progressive difficulty
- **Rewards:** Base points × 2.5× multiplier
- **Clean sweep bonus:** No lives lost = extra bonus
- **Leaderboard:** Separate tracking (per-game + daily challenge)
- **Difficulty options:** Selectable upfront

### Activity Board Data Model
```
state = {
  _version: 1,  // For schema migrations
  profile: { name, avatar, createdDate },
  points: { total, today, weekly, monthly, dailyGoal, ledger },
  games: { unlocked, stats, dailyBonus, sessions },
  trivia: { difficulty, stats, categoryStats, sessions },
  dailyQuests: { date, quests, streak, history },
  chores: { items, completedToday },
  homework: { items, bySubject },
  habits: { items, streaks },
  mood: { entries, trends, alerts },
  reading: { entries, byGenre, weeklyGoal },
  gujarati: { currentPhase, lessonsCompleted, vocabulary },
  kungfu: { sessions, flashcards, beltProgression },
  calendar: { events, activityHistory },
  achievements: { badges, unlocked },
  goals: { weekly: [], monthly: [] },
  categories: { stats, masteryLevels },
  dailyChallenge: { stats, leaderboard },
  streaks: { active, longest, recoveries },
  settings: { theme, difficulty, sounds, timezone, notifications }
}
```

---

## SYSTEM 3: PARENT PORTAL

### Scope & Purpose
- **Primary User:** Parents (1-4 per household)
- **Purpose:** Monitor Krish's activity, manage goals/rewards, customize settings, understand insights
- **Design Philosophy:** Clear, actionable, non-invasive, trust-based

### 6 Locked Sections

#### 1. Dashboard Management
- **Feature toggles:** Enable/disable any feature for Activity Board
- **Card arrangement:** Customize order and visibility
- **Notification settings:** Per-action type (approval of recovery days, goals completed, etc.)
- **Mobile management:** View/sync status across devices
- **Theme customization:** Set seasonal theme, difficulty theme
- **Reset/export:** Full data reset (3 levels), JSON backup

#### 2. Activity Board Parent Controls
- **Real-time monitoring:** View all Activity Board activity with timestamp
- **Flagged activities:** Anti-cheat detection, speed anomalies, unusual patterns
- **Goal management:** Create, edit, delete goals with templates
- **Points adjustment:** Award/deduct points manually with notes
- **Badge oversight:** Award manual achievements for real-world accomplishments
- **Recovery day approval:** Quick action to set recovery days
- **Feedback review:** See Krish's feedback entries, respond

#### 3. Settings & Configuration
- **8 configurable tabs:**
  1. **Notifications:** Per-event-type control
  2. **Theme:** Color scheme selection
  3. **Account:** Email, password, 2FA
  4. **Data/Backups:** Export, import, restore options
  5. **Activity Monitoring:** What to see, how often
  6. **Krish's Limits:** Daily cap, difficulty restrictions, feature access
  7. **Recovery System:** Free recovery frequency, points cost
  8. **Advanced Settings:** State versioning, conflict resolution, debugging
- **Data management:** Export CSV/JSON, automated backups
- **Security:** Password management, session control, account lock settings

#### 4. Analytics & Insights (Session 2026-06-25)
- **Dashboard Analytics:** Feature usage, calendar stats, shopping list, meal planner, announcements, engagement
- **Activity Board Analytics:** Engagement metrics, points, games, trivia, quests, goals, habits, modules, achievements, streaks, mood, reading, Gujarati
- **Cross-System Insights:** Engagement health, activity correlation, learning trajectories, motivational insights, red flags, recommendations
- **Reports & Export:** Preset + custom reports (PDF, CSV, JSON), scheduled delivery, sharing
- **Custom Dashboards:** Parent-created views (drag-and-drop, shared, view-only)
- **Alerts & Recommendations:** Configurable alerts (disengagement, overuse, streak burnout, goal frustration, difficulty mismatch, mood concerns, anomalies), 5 recommendation types

#### 5. User Management (Session 2026-06-25)
- **5 parent roles:** Primary, Co-Parent, Guardian, Grandparent, Guest
- **Permissions matrix:** Detailed access controls per role
- **Invitations:** Email-based, 7-day expiry, role selection
- **Parent management dashboard:** View all parents, pending invites, activity summary
- **Audit trail:** 90-day retention, all parent actions logged, CSV export
- **Communication:** Parent-to-parent notes, notifications, preferences
- **Account security:** Password management, 2FA, session control, deactivation options
- **Conflict resolution:** Simultaneous edit handling, merge prompts

#### 6. Home Automations & Smart Home (Session 2026-06-25)
- **Device management:** 7 device types (light, thermostat, speaker, lock, plug, camera, TV)
- **Hybrid control:** Manual + automation both enabled (smart timeout conflict resolution)
- **Activity-triggered automations:** 20+ automation types
- **HA bidirectional sync:** WebSocket (real-time) + REST polling (10-30s)
- **Rate limiting:** 5/min per device, 20/hour total
- **Mood triggers:** Real-time automation + parent aware (Option C)
- **Safety constraints:** Device-specific rules, prohibited automations
- **Automation learning:** v1 simple rules (6 patterns) + v2 advanced ML (20+ patterns)
- **Voice assistant:** Google v1, future-proof for Alexa/Siri v2
- **Troubleshooting:** System health, sync status, error tracking

### Parent Portal Data Model
```
Parent Portal state includes:
├─ parentUsers: { Primary, CoParents[], Guardians[], Guests[] }
├─ automations: { all rules, templates, history }
├─ customDashboards: { user-created views }
├─ alerts: { configurable per type }
├─ settings: { 8 tab configurations }
├─ auditLog: { all parent actions, 90-day history }
├─ notifications: { preferences, history }
└─ smartHome: { devices, automations, sync status }
```

---

## CROSS-SYSTEM INTEGRATION

### Bidirectional Sync Architecture
```
HA Dashboard ←→ Activity Board
│                           │
├─ Chores (real-time)       ├─ Chores (real-time)
├─ Calendar (30s polling)   ├─ Calendar (30s polling)
├─ Announcements (WebSocket)├─ Mood (WebSocket)
├─ Meal events (30s polling)└─ Activity logs (30s polling)
└─ Notifications (WebSocket)

Parent Portal ↔ Activity Board
├─ Monitor all activity
├─ Create/manage goals
├─ Adjust points/badges
├─ Control automations
├─ View analytics
└─ Manage users
```

### Real-Time Sync Strategy
- **WebSocket (Critical):** Chore completion, announcements, mood logs, milestones (<1 second)
- **REST Polling (Standard):** Calendar, shopping list, meal planner, activity state (10-30 seconds)
- **Offline Queueing:** Both systems queue actions, sync on reconnect
- **Conflict Resolution:** 
  - Additive for points (merge)
  - Last-write-wins for settings
  - Highest value for streaks

### Data Consistency
- **Single source of truth:** Backend database (PostgreSQL or Firebase)
- **Versioning:** State versioning with migrations
- **Audit trail:** All actions logged with timestamps
- **Backup/restore:** Google Drive sync (v2), local export

---

## PLATFORM-AGNOSTIC ARCHITECTURE

The Family Hub is designed to work with multiple platforms:

### Frontend Options (Any Can Be Used)
- Home Assistant (HA Dashboard)
- Flutter/Dart (Mobile app)
- React/Vue (Web interface)
- Custom HTML/JS (Current Activity Board)

### Backend Options (Choose One)
- **Option A:** PostgreSQL + Node.js REST API
- **Option B:** Firebase/Supabase (managed)
- **Option C:** Home Assistant (if HA-native)

### Benefits
- Easy to add new platforms (smartwatch, car display, etc.)
- Backend-agnostic (swap implementations)
- Multi-device sync (all platforms see same data)
- Future-proof (not locked into one stack)

---

## PHASED ROLLOUT

### Phase 1: Activity Board MVP (v1)
- 4 games + trivia system
- Basic activities (chores, homework, habits, mood, reading, gujarati)
- Points system with multipliers
- Achievement badges
- Daily quests
- Parent Portal (basic)
- localStorage only

### Phase 2: HA Dashboard (v1)
- 6 core features
- Real-time sync with Activity Board
- Mobile companion app
- 12 architectural foundations locked

### Phase 3: Parent Portal Enhancement (v1)
- All 6 sections implemented
- Multi-parent support
- Analytics & insights
- Smart home integrations

### Phase 4+: v2 Enhancements
- Google Drive sync
- PWA (installable app)
- Advanced ML learning
- More games (Fill-in-blank, Crossword)
- Voice assistant integration
- Scene builder
- And more...

---

## SUMMARY OF LOCKED DECISIONS

**Total Locked Items:** 32+ major features/sections across 3 systems

**Activity Board:** 20 sections  
**HA Dashboard:** 12 foundations + 6 features  
**Parent Portal:** 6 sections  

**Status:** ✅ ALL LOCKED AND READY FOR IMPLEMENTATION

---

## Next Steps

1. **Implementation Planning:** Break down into sprints, identify dependencies
2. **Technical Architecture:** Detailed API design, database schema, component structure
3. **Development:** Begin coding Phase 1 (Activity Board MVP)
4. **Testing Strategy:** Unit tests, E2E tests, User testing
5. **Deployment:** Hosting strategy, CI/CD pipeline, monitoring

**All specification documents available in:**
- `BUILD-DECISIONS-FINAL.md` — Original Activity Board specs
- `DECISIONS-LOG.md` — Activity Board detailed decisions
- `HA-DASHBOARD-DECISIONS-LOG.md` — HA Dashboard specifications
- `PARENT-PORTAL-COMPREHENSIVE-DESIGN.md` — Parent Portal design
- `COMPLETE-REVIEW-CHECKLIST.md` — Comprehensive checklist of all locked items
