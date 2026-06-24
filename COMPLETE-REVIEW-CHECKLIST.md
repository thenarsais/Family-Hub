# Complete Feature Review Checklist

**Status:** 20 Sections Complete ✅ | ALL SYSTEMS LOCKED  
**Last Updated:** 2026-06-24

---

## ✅ COMPLETED SECTIONS

### Games (4 games + Learn More system)
- ✅ Wordle (untimed, 10pts base × difficulty, attempts remaining bonus, escalating hint penalties)
- ✅ Quick-Fire (lives-based, compound scoring, category/random mix selection)
- ✅ Word Scramble (tile-based input, 3 hint types, time-based scoring)
- ✅ Hangman (lives-based, stick figure, on-screen keyboard, category hidden option)
- ✅ Learn More System (per-category curated links, Claude-curated, parent auditable)
- ⏳ Cross-Game: Hint Token system — deferred to v2 (v1 uses points directly)
- ✅ Cross-Game: Normalized scoring (Base × Difficulty + Bonuses - Penalties)
- ✅ Cross-Game: Auto-save with resume (same calendar day, midnight expiry)
- ✅ Cross-Game: Filtered leaderboards (personal best, time filters)
- ✅ Cross-Game: On-screen keyboards for Wordle + Hangman
- ✅ Cross-Game: Lives/attempts remaining bonuses across all games

### Trivia System ✅
- ✅ 1,000 questions, 16 categories, 4 difficulty levels, 11 themes
- ✅ Question structure with learnMoreLinks, tags, addedDate
- ✅ Unlock progression (80%/80%/90% accuracy with minimums)
- ✅ Dynamic hint reduction (3 phases, per-category)
- ✅ Fun fact display rules (correct/wrong/skip scenarios)
- ✅ Question cycling (14 days correct, 3–7 days incorrect)
- ✅ Session-based (5/10/20 questions, player choice)
- ✅ Category mastery (4 levels aligned with difficulty themes)
- ✅ Stats tracking (with fastestCorrectAnswer, favoriteCategory, totalHintsUsed)

### Daily Quest System ✅
- ✅ Full quest pool (130+ templates across all modules)
- ✅ Calendar-aware quests
- ✅ Quest generator rules (no duplicate types, max 1 streak/points quest per day)
- ✅ 1 free swap per day, optional points cost
- ✅ No penalty for incomplete — miss bonus only

### Chores ✅ (HA Dashboard — not Activity Board)
- ✅ Lives in HA Dashboard only in v1
- ✅ Activity Board points deferred to v2
- ✅ All chore rules defined for HA Dashboard context
- ✅ Bidirectional sync deferred to v2

### Homework ✅
- ✅ Time estimate (parent sets, Krish enters own)
- ✅ Subjects (10 predefined, parent customizable)
- ✅ Points formula (base + time bonus + deadline multiplier)
- ✅ Late/missed handling

### Kung Fu ✅
- ✅ Session types (Class/Home Practice)
- ✅ Missed class notification to parent
- ✅ Built-in flashcard timer
- ✅ Habit linking (auto-links to Exercise)
- ✅ Belt progression (manual parent update)

### Habits ✅
- ✅ 11 predefined habits with auto-link equivalencies
- ✅ Habit equivalency system via events.js
- ✅ Custom habits (parent direct, Krish with approval)
- ✅ One-tap check-in with celebration animation
- ✅ Points (5 pts base + streak bonuses)
- ✅ Missed day handling (free recovery + points-based)
- ✅ No reminders needed (visual check)

### Reading ✅
- ✅ 5 entry types (all time-based, no pages)
- ✅ Built-in timer + manual fallback
- ✅ Points (1 pt/5 min + completion bonus)
- ✅ Rating system (stars + reaction emoji)
- ✅ 10 genres + custom
- ✅ Weekly time goal (60 min default)
- ✅ State structure updated

### Mood ✅
- ✅ 6 emoji options + energy level + optional notes
- ✅ Activity tag removed
- ✅ Privacy (sensitive entries, parent can reveal)
- ✅ Trends display (7-day strip + full trends view)
- ✅ Parent alert for 3+ difficult mood days
- ✅ State structure updated

### Gujarati ✅
- ✅ 5-phase curriculum
- ✅ 4-component lesson structure
- ✅ Built-in timer + lesson completion tracking
- ✅ Points aligned with existing system
- ✅ Progress visualization (3 levels)
- ✅ Parent involvement (custom lessons, struggle words)
- ✅ State structure updated

### Calendar ✅
- ✅ Two-system architecture (HA Dashboard + Activity Board)
- ✅ Activity history stored permanently (append-only log)
- ✅ 9 personal item types + custom types
- ✅ Multi-person color-coded entries
- ✅ Chore rules system in Parent Portal (v1 manual, v2 auto-trigger)
- ✅ v2 integration design (instant bidirectional sync, Krish-filtered)
- ✅ Two-step notification system
- ✅ State structure defined

### Points Tracker Module ✅
- ✅ Summary view + detailed ledger
- ✅ Projection (7-day rolling average, 3+ days data required)
- ✅ Weekly/monthly visuals (bar chart + heatmap)
- ✅ Parent visibility (CSV export, spike alerts, category trends)
- ✅ State structure updated

### Settings & Customization ✅
- ✅ Two-area structure (Krish + Parent Portal 8 tabs)
- ✅ Krish controls (theme, difficulty theme, sounds, avatar, display name)
- ✅ Parent-only controls defined
- ✅ Data management (export, 3 reset levels, JSON backup)
- ✅ 8 additional settings defined
- ✅ v2 avatar creator noted

### Notifications & Alerts ✅
- ✅ Two-step system (HA pointer → Activity Board detail)
- ✅ 35+ Krish notification types across all categories
- ✅ Parent notification types defined
- ✅ 3 priority levels with different behaviors
- ✅ Do-not-disturb (calendar-aware school hours, bedtime, focus mode)
- ✅ Preference controls (Krish + parent)
- ✅ State structure defined

### Onboarding Flow ✅
- ✅ Welcome screen → name/avatar → choice screen → destination
- ✅ Contextual progressive disclosure tutorials
- ✅ ❓ help icon on every module
- ✅ Interactive game tutorials (demo mode)
- ✅ Feedback & Help system (💬 icon, 4 types, auto-screenshot)
- ✅ State structure defined

### Google Drive Sync ✅ (v2)
- ✅ OAuth flow (parent-initiated, folder-scoped)
- ✅ Sync scope defined (full state + config + custom questions + activity log + feedback)
- ✅ Event-driven sync with 30s debounce
- ✅ Section-aware conflict resolution
- ✅ Full offline functionality
- ✅ Drive folder structure defined
- ✅ 30-day auto + manual indefinite backups
- ✅ Full/partial restore with typed confirmation
- ✅ Privacy & security measures
- ✅ State versioning + migration system

### Achievement Badges ✅
- ✅ ~400+ badges across 13 categories
- ✅ 4 tiers aligned with difficulty theme names
- ✅ Games (volume + mastery + cross-game + first win + comeback)
- ✅ Trivia (volume + accuracy + speed + 64 category badges + streak + explorer)
- ✅ Homework (volume + on-time + early + per-subject + estimate accuracy + streak)
- ✅ Kung Fu (sessions + attendance + practice + flashcards + belt + attendance + performance)
- ✅ Habits (volume + per-habit streaks 44 badges + 365-day ultimate + early bird + synergy)
- ✅ Mood (volume + streaks + self-awareness + variety + honesty + resilience)
- ✅ Reading (volume + time + completions + streaks + genres + diversity + consistency)
- ✅ Gujarati (lessons + vocabulary + time + streaks + phases + heritage connection)
- ✅ Daily Quests (volume + perfect days + streaks + early + bonus streak + quest legend)
- ✅ Points Milestones (lifetime + goal achievement + big days + 10,000 legend)
- ✅ Streaks (activity + 100-day + 365-day ultimate + multi-streak + recovery + weekend warrior)
- ✅ Special/General (explorer + collector + balance + feedback + theme + parent + seasonal)
- ✅ Calendar (volume + appointment + planner)
- ✅ Data hygiene badge

---

## 🔄 REMAINING SECTIONS TO REVIEW

### 1. TRIVIA SYSTEM
**What's locked in:** 130+ questions, 3 difficulty levels (Rookie/Pro/Legend), unlock at 80%

**Gaps to review:**
- [ ] Question bank structure & curation
- [ ] Category system (how many categories? which ones?)
- [ ] Unlock progression mechanics (exact 80% calculation)
- [ ] Hint system (how does dynamic hint reduction work?)
- [ ] Category accuracy tracking
- [ ] Fun facts vs. enhanced fun facts
- [ ] Question refresh/cycling (avoid repetition)
- [ ] Daily question limit (if any)

---

### 2. DAILY QUEST SYSTEM
**What's locked in:** 3 random quests per day, +50 bonus for all 3, streak tracking, midnight reset in user's timezone

**Gaps to review:**
- [ ] Quest pool expansion (11 templates enough? more needed?)
- [ ] Quest difficulty scaling (should some be harder than others?)
- [ ] Quest completion detection (prevent gaming)
- [ ] Partial completion tracking (show progress in real-time)
- [ ] Failed quest handling (what if user can't complete?)
- [ ] Quest failure penalties (lose streak on incomplete quest?)
- [ ] Timezone edge cases (midnight definition)
- [ ] Quest skip/swap option (can user change a quest?)

---

### 3. POINTS SYSTEM (Base Calculations)
**What's locked in:** Normalized base × difficulty + bonuses - penalties

**Gaps to review:**
- [ ] Base point amounts per game (Wordle: 50, Quick-Fire: 10, Scramble: 20, Hangman: 30 - confirm?)
- [ ] Difficulty multipliers (Easy 1x, Medium 1.5x, Hard 2x - confirm across all?)
- [ ] Daily bonus streak multipliers (Days 1-2: 1x, 3-6: 1.1x, 7-13: 1.2x, 14-29: 1.5x, 30+: 2x - confirm?)
- [ ] Quest completion bonus (50 points - confirm?)
- [ ] Speed bonus amounts (+5, +10, +20 - standardize)
- [ ] Hint/penalty amounts (-5, -10, -20 - standardize)
- [ ] Points cap per day (if any)
- [ ] Rounding rules (round, floor, ceil?)
- [ ] Negative points (can user go below 0?)
- [ ] Points decay (old points expire? or permanent?)

---

### 4. ACHIEVEMENT BADGES
**What's locked in:** Bronze/Silver/Gold/Platinum tiers, multiple categories

**Gaps to review:**
- [ ] Exact unlock requirements per badge per tier
- [ ] Badge visual design (icon, animation, display)
- [ ] Badge categories to include:
  - [ ] Wordle badges (5/25/50/100 wins)
  - [ ] Quick-Fire badges (10/50/100/200 correct)
  - [ ] Word Scramble badges (5/25/50/100 words)
  - [ ] Hangman badges (5/25/50/100 wins)
  - [ ] Trivia badges (10/50/100/200 correct)
  - [ ] Streak badges (7/30/100/365 day streaks)
  - [ ] Habit badges (30/100/300/1000 completions)
  - [ ] Other badge types?
- [ ] Badge notifications (show when unlocked?)
- [ ] Badge display location (dashboard, profile, leaderboard?)
- [ ] Badge sharing (can user share achievements?)
- [ ] Duplicate badge prevention (can you earn same badge twice?)

---

### 5. WEEKLY & MONTHLY GOALS
**What's locked in:** Goals exist, completion = bonus points, history archive

**Gaps to review:**
- [ ] Goal types (Play X games, Score X points, Complete X trivia, etc.)
- [ ] Goal creation flow (user creates or parent creates?)
- [ ] Goal difficulty levels (Easy: 5 games, Medium: 10, Hard: 20?)
- [ ] Default goals vs. custom goals
- [ ] Goal tracking (real-time progress bars)
- [ ] Goal completion bonus (how many points?)
- [ ] Partial goal handling (missed target - still get partial credit?)
- [ ] Overdue goals (what if goal expires uncompleted?)
- [ ] Goal reset timing (Sunday for weekly? 1st for monthly?)
- [ ] Goal history (how far back to keep?)

---

### 6. CATEGORY MASTERY TRACKING
**What's locked in:** Per-category stats, badges, achievements

**Gaps to review:**
- [ ] Categories to track (Geography, History, Science, Literature, etc. - how many?)
- [ ] Category stats format (X correct / Y total, accuracy %)
- [ ] Category streaks (track consecutive correct per category?)
- [ ] Category badges (unlock at what thresholds?)
- [ ] Category difficulty per game (does Wordle Food differ from Quick-Fire Food?)
- [ ] Category switching penalties (lose streak if switch?)
- [ ] Category leaderboards (separate from game leaderboards?)
- [ ] Weak category highlighting (show where user struggles?)

---

### 7. DAILY CHALLENGE MODE
**What's locked in:** Once/day, all games in sequence, 3 lives, progressive difficulty, 2.5x bonus multiplier

**Gaps to review:**
- [ ] Game order (random order? or fixed?)
- [ ] Difficulty progression (start easy, get harder?)
- [ ] Lives mechanic (lose game = -1 life?)
- [ ] Points calculation (base × 2.5x multiplier - confirm?)
- [ ] Clean sweep bonus (3 lives remaining = extra bonus?)
- [ ] Leaderboard tracking (separate from regular games?)
- [ ] Daily limit (once per calendar day?)
- [ ] Timezone handling (which timezone for "daily"?)
- [ ] Challenge difficulty options (can user pick difficulty upfront?)

---

### 8. STREAK RECOVERY SYSTEM
**What's locked in:** Free 1x/month, or spend points anytime

**Gaps to review:**
- [ ] Streak recovery cost (how many points to restore?)
- [ ] Monthly reset timing (calendar month or 30 days from last use?)
- [ ] Notification (alert user when streak is about to break?)
- [ ] Recovery limits (only once per month? or more?)
- [ ] Partial recovery (restore some streak, not full?)
- [ ] Notification timing (when should user see recovery option?)

---

### 9. ACTIVITY SECTIONS (Chores, Homework, Habits, Mood, Reading, Calendar, Gujarati, Kung Fu)

#### 9A. CHORES
**Gaps to review:**
- [ ] Chore templates (predefined list or fully custom?)
- [ ] Completion tracking (checkbox or full flow?)
- [ ] Priority levels (High/Medium/Low?)
- [ ] Due dates (daily, specific date, or optional?)
- [ ] Recurring chores (repeat daily/weekly/monthly?)
- [ ] Points per chore (all worth same or customizable?)
- [ ] Completion deadline (by end of day?)
- [ ] Parent verification (parent approves before points awarded?)

#### 9B. HOMEWORK
**Gaps to review:**
- [ ] Subject tracking (Math, Science, English, etc.)
- [ ] Assignment types (worksheet, reading, project, test prep, etc.)
- [ ] Estimated time (how long to complete?)
- [ ] Due date enforcement (overdue highlighting?)
- [ ] Completion proof (notes, upload, checkbox only?)
- [ ] Points per assignment (all same or vary by subject?)
- [ ] Parent notification (notify parent when completed?)

#### 9C. HABITS
**Gaps to review:**
- [ ] Predefined habit list (Yoga, Meditation, Read, Exercise, etc.)
- [ ] Custom habits (user can create own?)
- [ ] Daily check-in UX (simple checkbox or detailed form?)
- [ ] Habit reminders (at specific time each day?)
- [ ] Streak display (show current + personal best?)
- [ ] Points per habit (all same or weighted?)
- [ ] Missed day handling (can you recover streak?)
- [ ] Habit combinations (do related habits sync?)

#### 9D. MOOD LOGGING
**Gaps to review:**
- [ ] Mood options (6 emoji choices - which ones?)
- [ ] Energy level scale (1-10, simple good/ok/bad, or detailed?)
- [ ] Activity tracking (what were you doing when mood = happy?)
- [ ] Notes field (optional text why?)
- [ ] Mood patterns (show weekly trends?)
- [ ] Mood sharing (private or parent can see?)
- [ ] Mood recommendations (if sad, suggest activity?)

#### 9E. READING
**Gaps to review:**
- [ ] Reading entry types (book, article, passage, comic?)
- [ ] Pages/chapters tracking (required or optional?)
- [ ] Rating system (1-5 stars, thumbs up/down, or none?)
- [ ] Genre categorization (auto-detect or manual?)
- [ ] Reading speed calculation (pages/hour metric?)
- [ ] Book completion bonus (extra points for finishing?)
- [ ] Reading time (track total reading time per book?)
- [ ] Reading goal (pages/week target?)

#### 9F. CALENDAR
**Gaps to review:**
- [ ] Calendar view (month, week, or both?)
- [ ] Activity visualization (color coding, dots, full agenda?)
- [ ] Click day to see (all activities that day in detail?)
- [ ] Streak highlighting (show habit/quest streaks?)
- [ ] Mobile vs. desktop (different layouts?)
- [ ] Year/month navigation (easy switching?)
- [ ] Export calendar (Google Calendar sync, iCal, etc.?)

#### 9G. GUJARATI LEARNING
**Gaps to review:**
- [ ] Curriculum phases (what phases exist?)
- [ ] Lesson structure (vocabulary, grammar, exercises?)
- [ ] Timer-based sessions (timed drills or open-ended?)
- [ ] Progress tracking (percentage complete per phase?)
- [ ] Pronunciation (audio guides included?)
- [ ] Writing practice (input Gujarati characters?)
- [ ] Difficulty levels (beginner through advanced?)
- [ ] Assessment/testing (quizzes to verify learning?)
- [ ] Parent dashboard (can parent see progress?)

#### 9H. KUNG FU TRACKING
**Gaps to review:**
- [ ] Session logging (date, duration, techniques, rating?)
- [ ] Belt progression (track belt levels?)
- [ ] Techniques list (which techniques tracked?)
- [ ] Practice frequency (weekly count, streak?)
- [ ] Instructor notes (can save feedback from class?)
- [ ] Video references (links to technique videos?)
- [ ] Sparring tracking (sparring partner, results?)

---

### 10. SETTINGS & CUSTOMIZATION
**What's locked in:** Daily goal, theme selector, notification prefs, timezone

**Gaps to review:**
- [ ] Daily goal customization (default 50, user can change?)
- [ ] Goal adjustment frequency (change daily, weekly, monthly?)
- [ ] Theme selector (4 seasons, auto or manual?)
- [ ] Notification preferences:
  - [ ] Toast notifications (on/off)
  - [ ] Sound effects (on/off)
  - [ ] Browser notifications (on/off)
  - [ ] Scheduled reminders (enable/disable, time selection)
- [ ] Timezone selector (list of timezones or GPS auto-detect?)
- [ ] Difficulty preference (remember last difficulty used?)
- [ ] Category preference (remember last category used?)
- [ ] Data management (export, import, reset all?)

---

### 11. NOTIFICATIONS & ALERTS
**What's locked in:** Full system (toasts, sounds, browser, scheduled)

**Gaps to review:**
- [ ] Toast types (success, warning, error, info - exactly which?)
- [ ] Toast duration (how long before disappearing?)
- [ ] Toast position (top-right, bottom-left, center?)
- [ ] Sound effects (which events trigger sounds?)
- [ ] Sound volume (user controllable?)
- [ ] Browser notifications (permission flow?)
- [ ] Notification content (what message text?)
- [ ] Scheduled reminders:
  - [ ] Daily reminder time (user selectable?)
  - [ ] Reminder message (what to say?)
  - [ ] Reminder frequency (daily, weekly, or both?)
- [ ] Notification history (can user see past notifications?)
- [ ] Do-not-disturb mode (quiet hours?)

---

### 12. ONBOARDING FLOW
**What's locked in:** Full onboarding (welcome, name/avatar, tutorials)

**Gaps to review:**
- [ ] Welcome screen (what copy/messaging?)
- [ ] Name setup (text input with validation?)
- [ ] Avatar selection (predefined emojis or custom?)
- [ ] Game tutorials (skip optional or required?)
- [ ] Tutorial content (video, text, interactive demo?)
- [ ] Points system explanation (how detailed?)
- [ ] Daily quests intro (show example quest?)
- [ ] Skip onboarding (can experienced users skip?)
- [ ] Onboarding data save (detect if completed?)
- [ ] Replay onboarding (can user re-watch tutorials?)

---

### 13. GOOGLE DRIVE SYNC
**What's locked in:** Cloud-ready architecture, auto-backup, multi-device

**Gaps to review:**
- [ ] OAuth flow (user links Google account)
- [ ] First-time setup (what's the process?)
- [ ] Backup frequency (every action? daily batch?)
- [ ] Conflict resolution (which data wins if device offline)
- [ ] Sync status indicator (show when syncing?)
- [ ] Manual backup button (let user force backup?)
- [ ] Backup restore (can user restore old backup?)
- [ ] Offline mode (what works without connection?)
- [ ] Storage location (folder structure in Drive?)
- [ ] Privacy (is data encrypted? GDPR compliant?)

---

## REVIEW PRIORITY ORDER

### Tier 1: Critical (Core functionality)
1. Trivia System
2. Daily Quest System
3. Points System (base calculations)
4. Activity Sections (all 8)
5. Google Drive Sync

### Tier 2: Important (Engagement)
6. Achievement Badges
7. Weekly/Monthly Goals
8. Category Mastery
9. Daily Challenge Mode
10. Streak Recovery

### Tier 3: Support (Polish)
11. Settings & Customization
12. Notifications & Alerts
13. Onboarding Flow

---

## STATS

- ✅ Completed: 1 section (Games + cross-game systems)
- 🔄 Remaining: 12 major sections
- 📊 Total gaps to review: ~120 detailed questions
- ⏱️ Estimated review time: 4-6 hours at current pace

