# Activity Board Fresh Build - Final Decisions & Specifications

**Date:** 2026-06-16  
**Status:** Ready for Development  
**Owner:** Priya  
**Target Launch:** 2-3 weeks

---

## Part 1: Critical Decisions ✅ APPROVED

### Design & Platform
- **Display Target:** 27" desktop monitor (primary)
- **Mobile Optimization:** Document for future, implement later
- **Framework:** Single HTML file (keep under 8000 lines)
- **Hosting:** Google Drive (auto-backup, multi-device sync)

### Error Handling & Data
- **Error Handling:** Comprehensive (edge cases, corrupted data, offline)
- **Data Storage:** localStorage + Google Drive sync
- **Data Versioning:** Yes, include state versioning from start
- **Timezone:** Use user's local time (user sets timezone in settings)

### Accessibility & Quality
- **Accessibility:** Good practices (no formal audit, but WCAG-friendly)
- **Testing:** Unit tests for state, manual E2E testing
- **Performance:** Optimize from start (pagination, caching, efficient queries)

---

## Part 2: Feature Set ✅ APPROVED

### Games (4-6 minimum)
- ✅ **Wordle** (Category Wordle) — Guess word in 6 attempts
- ✅ **Quick-Fire Trivia** — Multiple choice questions
- ✅ **Word Scramble** — Unscramble letters
- ✅ **Hangman** — Guess letters to reveal word
- ⏳ **Fill-in-the-Blank** — Later (v1.5)
- ⏳ **Crossword** — Later (v1.5)

**Game Feature:** Hints system
- Hints available at start (helpful for learning)
- Hints gradually reduced as user gains experience/knowledge
- Hint system tracks user progress and adjusts difficulty
- Hints cost points directly (escalating per hint used) — no separate token currency in v1

### Core Activity Sections (All in v1)
- ✅ **Chores** — Tracking with completion status
- ✅ **Homework** — With due dates, priorities
- ✅ **Habits** — Daily habit tracking with streaks
- ✅ **Mood** — Daily mood logging (emoji + energy level)
- ✅ **Reading** — Book/passage tracking with pages
- ✅ **Gujarati** — Full learning module (lessons, timer, progress)
- ✅ **Kung Fu** — Session tracking, belt progression
- ✅ **Calendar** — Visual calendar of activities
- ✅ **Trivia** — Question system with 3 difficulty levels (Rookie/Pro/Legend)
- ✅ **Points Tracker** — Daily/weekly/monthly summary

### Settings (All in v1)
- ✅ **Daily Point Goal** — Customizable (default 50)
- ✅ **Theme Selector** — Manual season picker (4 options)
- ✅ **Notification Preferences** — Enable/disable, sounds, browser notifications
- ✅ **Timezone Selector** — For accurate daily reset
- ⏳ **Data Export/Import** — Later (v1.5)

### Notifications (Full System)
- ✅ **In-App Toasts** — Success/warning/error/info
- ✅ **Sound Effects** — Optional success/failure/unlock sounds
- ✅ **Browser Notifications** — For important events
- ✅ **Scheduled Reminders** — Daily reminder at user-selected time
- ✅ **Event Types:**
  - Quest completion
  - Daily goal achieved
  - Streak milestones
  - Achievement unlocked
  - Bonus multiplier changes

### Onboarding (Full v1)
- ✅ **Welcome Screen** — "Welcome to Activity Board"
- ✅ **Name & Avatar Setup** — User can set name + pick emoji avatar
- ✅ **Game Tutorials** — Brief how-to-play for each game (optional skip)
- ✅ **Features Overview** — Points, daily quests, achievements explanation

---

## Part 3: Rewards & Engagement ✅ APPROVED

### Points System
- **Base Points:** Varies by game and difficulty
- **Difficulty Multipliers:** Easy (1x), Medium (1.5x), Hard (2x)
- **Daily Bonus Multiplier:**
  - Days 1-2: 1.0x
  - Days 3-6: 1.1x
  - Days 7-13: 1.2x
  - Days 14-29: 1.5x
  - Days 30+: 2.0x
- **Quest Completion Bonus:** +50 points (all 3 daily quests completed)

### Daily Quest System
- **Structure:** 3 random quests per day
- **Quest Pool:** 11 templates
- **Reset:** Midnight in user's timezone
- **Completion Bonus:** +50 points for all 3 quests
- **Streak:** Track consecutive days completing all quests
- **Streak Recovery:** 
  - Free reset once per month
  - OR spend points (configurable amount) to restore broken streak anytime

### Achievement Badges ✅ v1
- **Tier System:** Bronze → Silver → Gold → Platinum
- **Categories:**
  - **Wordle:** 5 wins (Bronze) → 25 wins (Silver) → 50 wins (Gold) → 100 wins (Platinum)
  - **Quick-Fire:** 10 correct (B) → 50 correct (S) → 100 correct (G) → 200 correct (P)
  - **Word Scramble:** 5 words (B) → 25 words (S) → 50 words (G) → 100 words (P)
  - **Hangman:** 5 wins (B) → 25 wins (S) → 50 wins (G) → 100 wins (P)
  - **Trivia:** 10 correct (B) → 50 correct (S) → 100 correct (G) → 200 correct (P)
  - **Streaks:** 7 days (B) → 30 days (S) → 100 days (G) → 365 days (P)
  - **Habits:** 30 completions (B) → 100 completions (S) → 300 completions (G) → 1000 completions (P)
- **UI:** Show badges on profile/dashboard with unlock animations

### Weekly & Monthly Goals ✅ v1
- **Goal Types:**
  - Play X games this week
  - Score X points this week
  - Complete X trivia questions
  - Maintain habit streak
  - Custom goals (parent can set)
- **Tracking:** Real-time progress bars
- **Completion:** Bonus points when goal achieved
- **History:** Archive completed goals

### Category Mastery Tracking ✅ v1
- **Per-Category Stats:**
  - Correct answers / Total questions
  - Accuracy percentage
  - Category-specific streak
  - Category badges
- **UI:** Show in trivia panel
- **Achievement:** "Master this category" badges

### Daily Challenge Mode ✅ v1
- **Trigger:** Once per day, on-demand start
- **Structure:** 
  - Play all 4 games in sequence
  - 3 lives (lose game = -1 life)
  - Progressive difficulty
  - Bonus multiplier for clean sweep (no lives lost)
- **Rewards:**
  - Base points × 2.5x multiplier
  - Unlock "Daily Challenge Champion" badge on clean sweep
  - Leaderboard tracking

---

## Part 4: Data & Sync ✅ APPROVED

### Local Storage (localStorage)
```javascript
state = {
  _version: 1,  // Increment if schema changes
  profile: { name, avatar, createdDate },
  points: { total, today, weekly, monthly, dailyGoal, ledger },
  trivia: { onboarding, difficulty, stats },
  games: { unlocked, stats, dailyBonus },
  dailyQuests: { date, quests, streak },
  chores: { items },
  homework: { items },
  habits: { items },
  mood: { entries },
  reading: { entries },
  gujarati: { currentPhase, lessonsCompleted, totalWordsLearned },
  kungfu: { sessions },
  achievements: { badges },
  weeklyGoals: { goals },
  monthlyGoals: { goals },
  categories: { stats },
  settings: { dailyGoal, theme, notifications, timezone }
}
```

### Google Drive Sync
- **Setup:** Google OAuth integration (user links Google account once)
- **Backup:** Auto-save state after each action
- **Sync:** 
  - Push local changes to Drive
  - Pull latest from Drive on app load
  - Conflict resolution: Latest timestamp wins
- **Storage:** ~50KB per backup, negligible space usage
- **Frequency:** Save after each game/quest/activity update
- **Offline:** Works offline, syncs when connection restored

### Data Versioning
- Track `_version` in state
- Migration functions for schema changes:
  ```javascript
  if (state._version === 1) { /* upgrade to v2 */ }
  ```
- Maintain backwards compatibility when possible

---

## Part 5: Trivia System Details ✅ APPROVED

### Question Bank
- **Size:** 130+ questions (expand to 200+ over time)
- **Structure:**
  ```javascript
  {
    uuid: "q001",
    question: "What is the capital of India?",
    options: ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
    correct: "Delhi",
    category: "Geography",
    difficulty: "easy",
    funFact: "Delhi has been the capital since 1931...",
    enhancedFunFact: "Detailed fact shown on 2nd wrong answer",
    hint: "It's on the Yamuna River"
  }
  ```

### Difficulty Progression
- **Rookie:** Always available, foundational questions, unlock Pro at 80% accuracy
- **Pro:** Medium difficulty, unlock Legend at 80% Pro accuracy
- **Legend:** Hard questions, critical thinking, no unlock requirement
- **Tracking:** Per-difficulty accuracy, per-category accuracy

### Hint System (Dynamic)
- **Early Learning (First 20 questions):** Hints always available, generous
- **Building Confidence (21-50 questions):** Hints available but discouraged
- **Gaining Mastery (50+ questions):** Hints disabled unless explicitly requested
- **Per-Category Reset:** Hints reset when user switches to new category

---

## Part 6: Seasonal Theming ✅ APPROVED

### 4 Themes (Spring, Summer, Fall, Winter)
```css
/* Spring: Fresh green theme */
--season-primary: #10B981
--season-accent-1: #A7F3D0 (Mint)
--season-accent-2: #FDBA74 (Warm)
--season-accent-3: #F97316 (Bold)
--season-bg-light: #ECFDF5
--season-bg-body: #F0FDFB
--season-text: #065F46
--season-border: #A7F3D0

/* Summer: Gold & bright theme */
--season-primary: #FBBF24
--season-accent-1: #FDE68A (Light)
--season-accent-2: #FB7185 (Coral)
--season-accent-3: #F97316 (Orange)
--season-bg-light: #FFFBEB
--season-bg-body: #FFFAF0
--season-text: #78350F
--season-border: #FCD34D

/* Fall: Warm orange theme */
--season-primary: #F97316
--season-accent-1: #FDBA74 (Light)
--season-accent-2: #FCA5A5 (Warm)
--season-accent-3: #FB923C (Darker)
--season-bg-light: #FEF3C7
--season-bg-body: #FFFBEB
--season-text: #92400E
--season-border: #FDBA74

/* Winter: Cool blue theme */
--season-primary: #0EA5E9
--season-accent-1: #BAE6FD (Light)
--season-accent-2: #86EFAC (Cool Green)
--season-accent-3: #67E8F9 (Cyan)
--season-bg-light: #F0F9FF
--season-bg-body: #E0F2FE
--season-text: #0C4A6E
--season-border: #7DD3FC
```

### Theme Implementation
- **Auto-Detect:** Detect by month, allow manual override
- **CSS Variables:** All colors use variables (no hardcoding)
- **Testing:** Test all 4 themes before launch
- **Transitions:** Smooth color transitions when theme changes

---

## Part 7: Build Phases ✅ APPROVED

### Phase 1: Foundation (Days 1-5)
- [ ] State management & localStorage
- [ ] Google Drive OAuth integration
- [ ] Dashboard bento grid layout
- [ ] Seasonal theming system
- [ ] Responsive design (27" monitor primary, mobile notes for later)

### Phase 2: Trivia & Games (Days 6-10)
- [ ] Trivia question system + IndexedDB
- [ ] Difficulty progression (Rookie/Pro/Legend)
- [ ] Dynamic hint system
- [ ] Wordle game
- [ ] Quick-Fire game
- [ ] Word Scramble game
- [ ] Hangman game
- [ ] Game unlock system

### Phase 3: Rewards & Engagement (Days 11-15)
- [ ] Points system with multipliers
- [ ] Daily bonus streak system
- [ ] Daily quest system (3 random quests/day)
- [ ] Streak recovery (free 1x/month + points option)
- [ ] Achievement badges (all tiers)
- [ ] Weekly & monthly goals
- [ ] Category mastery tracking
- [ ] Daily challenge mode
- [ ] Leaderboards (per-game)

### Phase 4: Core Activities (Days 16-18)
- [ ] Chores section
- [ ] Homework section
- [ ] Habits section with streaks
- [ ] Mood logging with energy levels
- [ ] Reading tracking
- [ ] Calendar view
- [ ] Kung Fu tracking

### Phase 5: Gujarati & Polish (Days 19-21)
- [ ] Gujarati learning module (full)
- [ ] Notifications system (toasts, sounds, browser, scheduled)
- [ ] Onboarding flow (welcome, name/avatar, tutorials)
- [ ] Settings panel (goal, theme, notifications, timezone)
- [ ] Performance dashboard
- [ ] Animations & transitions
- [ ] Bug fixes & testing

### Phase 6: Launch Prep (Days 22-23)
- [ ] Final testing (all 4 themes, all games, Google Drive sync)
- [ ] Performance optimization
- [ ] Browser compatibility check
- [ ] Documentation & instructions for parent
- [ ] Data export guide
- [ ] **LAUNCH** ✅

---

## Part 8: Success Criteria ✅

Before launch, verify:

- [ ] ✅ All 4 games working
- [ ] ✅ Points calculation accurate with multipliers
- [ ] ✅ Daily quests reset at midnight
- [ ] ✅ Google Drive auto-sync working
- [ ] ✅ Streak recovery system tested
- [ ] ✅ Achievement badges unlocking correctly
- [ ] ✅ Weekly/monthly goals tracking
- [ ] ✅ Category mastery calculating
- [ ] ✅ Daily challenge mode playable
- [ ] ✅ All 4 themes display correctly
- [ ] ✅ Notifications working (toasts, sounds, browser)
- [ ] ✅ Mobile responsive (documented for future)
- [ ] ✅ Offline mode works (syncs on reconnect)
- [ ] ✅ Onboarding completes smoothly
- [ ] ✅ Settings save & apply
- [ ] ✅ localStorage + Google Drive in sync

---

## Part 9: Post-Launch Roadmap (v1.5+)

### Quick Wins (Low Effort)
- [ ] Fill-in-the-Blank game
- [ ] Crossword game
- [ ] Data export (JSON/CSV)
- [ ] Sound effect volume control
- [ ] Custom color themes

### Medium Effort (v1.5)
- [ ] Leaderboard time-based filters (this week, this month)
- [ ] Habit streak calendar grid view
- [ ] Comparative analytics ("up 3% this week")
- [ ] Gujarati pronunciation guides
- [ ] Challenge mode variants

### Higher Effort (v2.0)
- [ ] Multi-device true sync (tested across devices)
- [ ] Parental dashboard (see Krish's activity)
- [ ] Trivia learning paths (chapters/progression)
- [ ] Hint Token system (separate token currency, earned from perfect games, spent on hints)
- [ ] Mobile-first redesign
- [ ] Custom quest editor (parent creates quests)

---

## Summary: What We're Building

**A comprehensive activity gamification platform for Krish featuring:**
- 4-6 engaging games with adaptive difficulty and hints
- Daily quests system with streak tracking
- Achievement badges with tier progression
- Weekly & monthly goal setting
- Full Gujarati learning integration
- Category mastery tracking
- Daily challenge mode
- Comprehensive points system with multipliers
- Google Drive auto-backup + multi-device sync
- Notification system (toasts, sounds, browser, scheduled)
- Complete onboarding + settings panel
- Seasonal theming (4 themes)
- Mobile-optimizable architecture (optimize later)

**Timeline:** 3 weeks to launch  
**Cost:** $0 (free tier for everything)  
**Scope:** Comprehensive but achievable  

---

**Status:** ✅ Ready for Development  
**Next Step:** Start Phase 1 (Day 1)

