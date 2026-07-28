# Krish Activity Board - Complete Architecture & Features

**Last Updated:** 2026-06-16  
**Status:** Ready for Fresh Build  
**Scope:** Entire Activity Board (all sections & features)

---

## Table of Contents

1. [Overview & Sections](#overview--sections)
2. [Main Dashboard Grid Layout](#main-dashboard-grid-layout)
3. [All Feature Sections](#all-feature-sections)
4. [Games System](#games-system)
5. [Trivia System (Detailed)](#trivia-system-detailed)
6. [Daily Quest System](#daily-quest-system)
7. [Points & Rewards](#points--rewards)
8. [Data Model & State Structure](#data-model--state-structure)
9. [Architecture Patterns](#architecture-patterns)
10. [Known Issues & Lessons Learned](#known-issues--lessons-learned)

---

## Overview & Sections

The Activity Board is a comprehensive activity tracking and gamification system for Krish. It includes:

**Main Sections (in Bento Grid Layout):**
1. **Chores** — Chore tracking with interactive completion
2. **Homework** — Homework assignments with status
3. **Kung Fu** — Martial arts practice tracking
4. **Trivia** — Question-based learning system (with Games nested)
5. **Reading** — Book/passage reading log
6. **Habits** — Daily habit tracker (Yoga, etc.)
7. **Mood** — Daily mood logging (emoji-based)
8. **Gujarati** — Language learning module
9. **Calendar** — Calendar view of activities
10. **Points** — Points tracker with time-based views

**Secondary Systems:**
- Performance Dashboard (modal with stats & heatmap)
- Daily Quests (progress tracked in Trivia page)
- Leaderboards (in-game stats per game)
- Achievement system
- Daily bonus multiplier system

---

## Main Dashboard Grid Layout

**Bento Grid Structure (4-column):**

```
┌─────────────────────────────────────────────────────┐
│  COL 1          │  COL 2            │  COL 3  │ COL 4    │
├─────────────────┼───────────────────┼─────────┼──────────┤
│   CHORES        │  HOMEWORK         │ HABITS  │  MOOD    │
│   (clickable)   │  (clickable)      │         │          │
│                 │                   │         │          │
│                 ├───────────────────┤         ├──────────┤
│                 │  CALENDAR         │         │GUJARATI  │
│                 │                   │         │          │
│                 │                   │         ├──────────┤
│                 ├───────────────────┤         │ POINTS   │
│                 │  KUNG FU          │         │          │
├─────────────────┼───────────────────┼─────────┼──────────┤
│  TRIVIA         │  READING          │         │          │
│  (clickable)    │  (clickable)      │         │          │
└─────────────────┴───────────────────┴─────────┴──────────┘
```

**Card Design:**
- Each card is clickable to open interactive panel
- Shows mini summary of section (status, count, etc.)
- Header with emoji icon and section name
- Seasonal theming applied to all cards
- Smooth transitions when expanding panels

---

## All Feature Sections

### 1. **CHORES**
**Purpose:** Track daily chores  
**Type:** Interactive checklist  
**UI Pattern:** Click card → Open panel → Manage items  

**Features:**
- Add new chores
- Mark complete/incomplete
- Show completed count vs total
- Persist to localStorage
- Seasonal color theming

**State Structure:**
```javascript
state.chores = {
  items: [
    { id, name, completed, dueDate, priority },
    ...
  ],
  completedToday: 2,
  total: 5
}
```

**Display on Dashboard:**
- Shows: "2/5 completed" badge
- Progress visual indicator
- Last chore completed timestamp (optional)

---

### 2. **HOMEWORK**
**Purpose:** Track homework assignments  
**Type:** Task list with deadlines  

**Features:**
- Add homework with due dates
- Mark complete/incomplete
- Sort by due date
- Show overdue items (red highlight)
- Estimated time remaining

**State Structure:**
```javascript
state.homework = {
  items: [
    { id, subject, description, dueDate, completed, priority },
    ...
  ]
}
```

**Display on Dashboard:**
- Shows next due date
- Completed count
- Overdue warning if any

---

### 3. **KUNG FU**
**Purpose:** Track martial arts practice  
**Type:** Session tracker  

**Features:**
- Log practice sessions (date, duration, techniques practiced)
- Mark belt progression checkpoints
- Performance ratings
- Weekly practice counts
- Linked to Habits system (consistency tracking)

**State Structure:**
```javascript
state.kungfu = {
  sessions: [
    { id, date, duration, techniques, rating, notes },
    ...
  ],
  weeklyCount: 3,
  currentBelt: 'yellow',
  nextBelt: 'orange'
}
```

---

### 4. **TRIVIA** ⭐ (PRIMARY FOCUS)
See detailed section below. Includes games, quests, difficulty system, leaderboards.

---

### 5. **READING**
**Purpose:** Log reading progress  
**Type:** Reading journal  

**Features:**
- Log books/passages read
- Track pages/chapters completed
- Rate books (1-5 stars)
- Reading speed tracking (pages/minute)
- Genre filtering
- Total books read counter

**State Structure:**
```javascript
state.reading = {
  entries: [
    { id, date, book, pagesRead, rating, genre, notes },
    ...
  ],
  booksCompleted: 7,
  totalPagesRead: 1240
}
```

---

### 6. **HABITS**
**Purpose:** Track daily habits  
**Type:** Habit checker  

**Features:**
- Pre-defined habits (e.g., "Yoga", "Meditation", "Read for 20min")
- Daily check-in system
- Streak tracking (consecutive days)
- Weekly habit completion percentage
- Visual habit calendar (green/red days)

**State Structure:**
```javascript
state.habits = {
  items: [
    { 
      id, 
      name, 
      emoji,
      frequency: 'daily' | 'weekly',
      completedDates: ['2026-06-16', ...],
      currentStreak: 5,
      longestStreak: 12
    }
  ],
  todayCompleted: 1,
  todayTotal: 3
}
```

**Display on Dashboard:**
- Shows: "1/3 habits completed today"
- Habit checklist with checkboxes
- Streak display for each

---

### 7. **MOOD**
**Purpose:** Daily mood logging  
**Type:** Emoji mood tracker  

**Features:**
- 6 mood options: 😄 (Great), 😊 (Good), 😐 (Okay), 😕 (Not great), 😢 (Bad), 😡 (Angry)
- Optional notes (what made you feel this way)
- Energy level scale (1-10)
- Activity tagged (what were you doing)
- Mood trends over time (last 7 days)

**State Structure:**
```javascript
state.mood = {
  entries: [
    { 
      id, 
      date, 
      emoji: '😊',
      energyLevel: 7,
      notes: 'Had fun with friends',
      activity: 'Playing',
      timestamp
    }
  ],
  todayMood: '😊'
}
```

**Display on Dashboard:**
- Shows today's mood emoji large
- Mood trend chart (last 7 days)
- Energy level graph

---

### 8. **GUJARATI**
**Purpose:** Language learning  
**Type:** Lesson-based curriculum  

**Features:**
- Structured curriculum (phases/levels)
- Vocabulary lessons with pronunciation
- Writing practice
- Timed learning sessions
- Lesson completion tracking
- Parent notes/feedback integration

**State Structure:**
```javascript
state.gujarati = {
  currentPhase: 3,
  lessonsCompleted: [1, 2, 3, 4, 5],
  sessionHistory: [
    { date, duration, lessonId, wordsLearned: 5 },
    ...
  ],
  totalWordsLearned: 87,
  estimatedNextLevel: '2026-07-01'
}
```

---

### 9. **CALENDAR**
**Purpose:** Visual calendar of activities  
**Type:** Month/week view calendar  

**Features:**
- Calendar grid (month view)
- Activity indicators per day (color-coded)
- Activity counts per day
- Click day to see all activities for that day
- Week/month view toggle
- Streak visualization
- Hover tooltips showing activity summary

**State Structure:**
```javascript
// Calculated view, not stored directly
// Uses data from: chores, homework, habits, reading, mood, etc.
calendar = {
  [date]: {
    activities: ['Completed habit', 'Did yoga', 'Read 10 pages'],
    completedCount: 3,
    totalCount: 5,
    emoji: '✅'
  }
}
```

---

### 10. **POINTS**
**Purpose:** Track and display points/rewards  
**Type:** Points ledger and summary  

**Features:**
- Total points display (all-time)
- Daily points breakdown
- Weekly points summary
- Monthly points summary
- Points source breakdown (which activity earned what)
- Points history/ledger
- Daily goal progress (default 50 points/day)
- Points projection (if trend continues)

**State Structure:**
```javascript
state.points = {
  total: 1250,
  today: 50,
  weekly: 280,
  monthly: 1200,
  dailyGoal: 50,
  ledger: [
    { date, activity, points, multiplier, reason },
    ...
  ],
  projection: {
    weeklyAtCurrentRate: 300,
    monthlyAtCurrentRate: 1200
  }
}
```

---

## Games System

The Trivia page includes **4 Mini-Games** in a locked/unlocked progression system.

### Game Architecture

Each game has:
1. **Unlock System** — Progress toward unlock requirements
2. **Stats Tracking** — Plays, best score, accuracy, history
3. **Leaderboard** — Per-game leaderboard with difficulty filters
4. **Seasonal Theming** — Cards use CSS variables
5. **Modular Design** — Each game self-contained (no cross-pollution)

**Game Cards Display:**
```
┌─────────────────────────┐
│ 🎯 Category Wordle      │  (Unlocked)
│ Best: 450 pts          │
│ Played: 5x             │
│      [PLAY]            │
└─────────────────────────┘

┌─────────────────────────┐
│ 🔒⚡ Quick-Fire         │  (Locked)
│ Unlock: 10 correct     │
│ Progress: [████░░░░] 6/10
│      [LOCKED]          │
└─────────────────────────┘
```

### Game 1: Category Wordle

**Rules:**
- Guess a word from a trivia answer in 6 attempts
- Select from multiple categories/difficulty levels
- Each guess shows correct (🟩), misplaced (🟨), or wrong (⬜) letters
- Points based on attempts remaining

**Points System:**
- 6 attempts left: 100 points
- 5 attempts left: 80 points
- 4 attempts left: 60 points
- 3 attempts left: 50 points
- 2 attempts left: 40 points
- 1 attempt left: 30 points

**Difficulty Modes:**
- Easy: Shorter words, common answers
- Medium: Standard words
- Hard: Complex words, uncommon answers

**Unlock Requirement:** Complete 5 correct trivia answers

**Leaderboard Fields:**
- Score, Difficulty, Date, Attempts Used, Category

### Game 2: Quick-Fire Trivia

**Rules:**
- Answer multiple-choice trivia questions as fast as possible
- Optional timer (5-10 seconds per question)
- Accuracy percentage tracked
- Combo system (X correct in a row)

**Points System:**
- Base: 10 points per correct answer
- Speed bonus: +5 if answered in <3 seconds
- Combo multiplier: 1.5x for 5+ correct streak
- Difficulty multiplier: 1x (easy), 1.5x (medium), 2x (hard)

**Unlock Requirement:** 10+ correct answers, 70%+ accuracy

**Leaderboard Fields:**
- Score, Accuracy %, Streak, Difficulty, Date

### Game 3: Memory Tiles (Proposed for Removal in Fresh Build)

**Rules:**
- Flip tiles to match pairs
- Remember tile positions
- Timed or untimed modes
- Get faster each time

**Points System:**
- Base: 20 points per match
- Speed bonus: +10 if completed in <60 seconds
- Accuracy: Track combo (X matches without mistake)

**Unlock Requirement:** 50 correct trivia answers

**Leaderboard Fields:**
- Score, Time, Matches Made, Date

---

### Game 4: Word Scramble

**Rules:**
- Unscramble letters to form valid words
- Multiple difficulty levels
- Timer-based scoring
- 30 seconds per word

**Points System:**
- Easy word: 10 points
- Medium word: 20 points
- Hard word: 40 points
- Speed bonus: +5 if solved in <10 seconds

**Difficulty Modes:**
- Easy: 4-5 letter words, common
- Medium: 6-8 letter words, varied
- Hard: 8-10 letter words, uncommon

**Unlock Requirement:** 100+ correct trivia answers

**Leaderboard Fields:**
- Score, Words Solved, Time, Difficulty, Date

---

## Trivia System (Detailed)

### Trivia Architecture

**Question Pool:** 130+ curated questions in `trivia-questions.js`

**Question Structure:**
```javascript
{
  uuid: "q001",
  question: "What is the capital of India?",
  options: ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
  correct: "Delhi",
  category: "Geography",
  difficulty: "easy",
  funFact: "Delhi has been the capital since 1931...",
  enhancedFunFact: "Detailed learning fact for when answered incorrectly twice",
  hint: "It's on the Yamuna River"
}
```

### Difficulty System

**3 Modes with Progression:**

1. **Rookie** (Always Available)
   - Easier, foundational questions
   - Unlock Pro at 80% overall accuracy
   - Focus: Building knowledge base

2. **Pro** (Unlock at 80% Rookie Accuracy)
   - Medium difficulty, deeper knowledge
   - Unlock Legend at 80% Pro accuracy
   - Focus: Testing understanding

3. **Legend** (Unlock at 80% Pro Accuracy)
   - Hard questions, critical thinking
   - No unlock requirement
   - Focus: Mastery

**Accuracy Tracking:**
- Per-difficulty accuracy calculated
- Overall accuracy (all questions)
- Category-specific accuracy
- Recent 10-question accuracy (momentum)

### Trivia Progression System

**Data Tracking:**
- Questions answered (correct/incorrect)
- Wrong pool with decay weights (harder questions you got wrong resurface)
- Category performance tracking
- Consecutive correct streak
- Daily quest progress (integrated)

**State Structure:**
```javascript
state.trivia = {
  onboarding: {
    name: "Krish",
    avatar: "🧠",
    completed: true
  },
  difficulty: {
    currentMode: 'rookie', // rookie | pro | legend
    proUnlocked: true,      // 80% rookie accuracy
    legendUnlocked: false
  },
  stats: {
    totalAnswered: 42,
    correct: 38,
    streak: 3,
    longestStreak: 7,
    overall_accuracy: 0.904,
    by_category: {
      'Geography': { correct: 5, total: 6, accuracy: 0.833 },
      'History': { correct: 8, total: 9, accuracy: 0.888 },
      // ...
    },
    by_difficulty: {
      'easy': { correct: 15, total: 16, accuracy: 0.938 },
      'medium': { correct: 12, total: 14, accuracy: 0.857 },
      'hard': { correct: 2, total: 3, accuracy: 0.667 }
    }
  }
}

state.triviaProgress = {
  answeredQuestions: ['q001', 'q005', ...],
  incorrectPool: [
    { questionId: 'q012', count: 2, lastWrongDate: '2026-06-15' },
    ...
  ]
}
```

### Badges System

**Trivia Badges (Visual Achievements):**
- Category Rookie (answered 5 in category)
- Category Pro (80% in category)
- Category Master (answer 20 in category)
- Streak badges (5-day, 10-day, 30-day streaks)
- Accuracy badges (80%, 85%, 90%+ accuracy)

---

## Daily Quest System

### Quest Pool (11 Templates)

Each day, 3 random quests are selected from this pool:

1. **"Complete 2 Wordle games"** — Progress: 0/2
2. **"Win with 5+ correct letters"** (Wordle) — Progress: 0/1
3. **"Complete 2 Memory games"** — Progress: 0/2
4. **"Get 4+ combo in Memory"** — Progress: 0/1
5. **"Score 150+ points in Memory"** — Progress: 0-150 points
6. **"Solve 3 Word Scramble words"** — Progress: 0/3
7. **"Solve 1 in under 10 seconds"** (Scramble) — Progress: 0/1
8. **"Answer 5 Quick-Fire questions"** — Progress: 0/5
9. **"Get 8+ correct in Quick-Fire"** — Progress: 0/8
10. **"Play 4 different games"** — Progress: Set of unique games
11. **"Win 3 games in a row"** — Progress: Current streak

### Quest Display

**Location:** Trivia page, top section (3-card grid)

**Card Layout:**
```
┌──────────────────┐
│       🎯         │
│  Complete 2      │
│   Wordle games   │
│     1/2          │
│  [Progress Bar]  │
└──────────────────┘
```

### Quest Mechanics

**Daily Reset:**
- Quests reset at midnight (00:00)
- New 3 random quests selected
- Previous day's incomplete quests discarded

**Real-Time Tracking:**
- Progress updates immediately when game completes
- Triggered by `recordGamePlay()` function
- Uses Set data structure for "play 4 games" uniqueness tracking

**Completion Logic:**
- All 3 quests marked complete → +50 point bonus
- Toast notification with celebration emoji
- Streak incremented (consecutive days completing all)
- If broken, resets to 0

**State Structure:**
```javascript
state.dailyQuests = {
  date: "2026-06-16",
  quests: [
    {
      id: 'wordle-1',
      game: 'wordle',
      name: 'Complete 2 Wordle games',
      icon: '🎯',
      progress: 1,
      target: 2,
      completed: false
    },
    // ...
  ],
  allCompleted: false,
  streak: 5
}
```

---

## Points & Rewards

### Points Earning

**Base Points per Activity:**
- Trivia correct answer: 10 points (varies by difficulty & streak)
- Game win (Wordle): 30-100 points (based on difficulty)
- Game win (Quick-Fire): 10-20 points per correct
- Game win (Memory): 20 points per match
- Game win (Scramble): 10-40 points per word
- Habit completion: 5 points
- Mood logging: 2 points
- Reading: 1 point per page

### Multipliers

**Daily Bonus Streak System:**
- Day 1-2: 1.0x (base)
- Day 3+: 1.1x
- Day 7+: 1.2x
- Day 14+: 1.5x
- Day 30+: 2.0x

**Quest Completion:**
- +50 point bonus for completing all 3 daily quests
- Only awarded once per day when last quest completes

### Points Display

**Dashboard Card Shows:**
- Total points (all-time)
- Today's points progress toward daily goal
- Daily goal completion %
- Visual bar graph

**Points Panel Shows:**
- Daily breakdown (last 7 days)
- Weekly summary
- Monthly summary
- Points ledger (what earned what)
- Projection (if trend continues)

---

## Data Model & State Structure

### Main State Object

```javascript
const DEFAULT_STATE = {
  // User Profile
  profile: {
    name: "Krish",
    avatar: "🧠",
    createdDate: "2026-06-01"
  },

  // Points System
  points: {
    total: 1250,
    today: 50,
    weekly: 280,
    monthly: 1200,
    dailyGoal: 50,
    ledger: []
  },

  // Trivia & Questions
  trivia: {
    onboarding: { name, avatar, completed },
    difficulty: { currentMode, proUnlocked, legendUnlocked }
  },
  triviaProgress: {
    answeredQuestions: [],
    incorrectPool: []
  },

  // Games Tracking
  games: {
    unlocked: ['wordle', 'quickfire'],
    stats: {
      wordle: { played: 5, bestScore: 450, leaderboard: [] },
      quickfire: { played: 3, bestScore: 280, leaderboard: [] },
      memory: { played: 0, bestScore: 0, leaderboard: [] },
      scramble: { played: 0, bestScore: 0, leaderboard: [] }
    },
    dailyBonus: {
      streak: 12,
      claimed: true,
      lastClaimedDate: "2026-06-16",
      bonusHistory: []
    }
  },

  // Daily Quests
  dailyQuests: {
    date: "2026-06-16",
    quests: [],
    allCompleted: false,
    streak: 5
  },

  // Activity Sections
  chores: { items: [], completedToday: 0 },
  homework: { items: [] },
  habits: { items: [], todayCompleted: 0 },
  mood: { entries: [], todayMood: null },
  reading: { entries: [], booksCompleted: 0, totalPages: 0 },
  gujarati: { currentPhase: 1, lessonsCompleted: [], totalWordsLearned: 0 },
  kungfu: { sessions: [], currentBelt: 'white', weeklyCount: 0 },

  // Settings
  settings: {
    dailyGoal: 50,
    theme: 'auto', // 'auto' | 'spring' | 'summer' | 'fall' | 'winter'
    notifications: true
  }
};
```

### localStorage Structure

```javascript
// Saved as JSON with key 'krish_activity_state'
localStorage.setItem('krish_activity_state', JSON.stringify(state));

// Load
const state = JSON.parse(localStorage.getItem('krish_activity_state') || '{}');
```

### IndexedDB (For Trivia Questions)

**Database Name:** `krish_activity_db`

**Stores:**
1. **trivia_questions** — Full question bank (130+ questions)
2. **trivia_buffer** — Working set of questions for current session
3. **game_sessions** — Historical game play records

---

## Architecture Patterns

### 1. **State Management Pattern**

- Single `state` object as source of truth
- Save to localStorage on every change
- Load on page initialization
- No external API calls (all local)

```javascript
function saveState() {
  localStorage.setItem('krish_activity_state', JSON.stringify(state));
}

function loadState() {
  return JSON.parse(localStorage.getItem('krish_activity_state')) || DEFAULT_STATE;
}

// After any change:
state.points.total += 50;
saveState();
```

### 2. **Render Pattern**

Each section has a `render{SectionName}()` function that:
1. Reads from `state`
2. Generates HTML string
3. Injects into panel element
4. Adds event listeners

```javascript
function renderChoresPanel() {
  const chores = state.chores.items;
  const html = `
    ${chores.map(c => `<div class="chore">${c.name}</div>`).join('')}
  `;
  document.getElementById('chores-panel').innerHTML = html;
}
```

### 3. **Panel Modal Pattern**

Click card → Opens modal panel with full view
- Click X or outside → Closes
- Each panel handles its own UI
- Panel content is generated on demand

```javascript
function showBoard(boardType) {
  const panel = document.getElementById(`${boardType}-panel`);
  if (boardType === 'chores') renderChoresPanel();
  if (boardType === 'homework') renderHomeworkPanel();
  // etc.
  
  panel.style.display = 'block';
}

function closeBoard() {
  document.querySelectorAll('[id$="-panel"]').forEach(p => p.style.display = 'none');
}
```

### 4. **Seasonal Theming Pattern**

All colors are CSS variables:
- `--season-primary`: Main color
- `--season-accent`: Accent color
- `--season-bg-light`: Light background
- etc.

```css
.card {
  background: var(--season-bg-light);
  border: 1px solid var(--season-border);
  color: var(--season-text);
}
```

Change theme by updating CSS variables:
```javascript
function applySeasonalTheme(season) {
  const themes = {
    spring: { '--season-primary': '#10B981', '--season-accent': '#A7F3D0', ... },
    summer: { '--season-primary': '#FBBF24', '--season-accent': '#FDE68A', ... },
    // ...
  };
  
  Object.entries(themes[season]).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}
```

### 5. **Modular Game Architecture**

Each game is:
- **Self-contained:** No dependencies on other games
- **Scoped styling:** `.wordle-*`, `.memory-*` class prefixes
- **Own state:** `state.games.stats[gameId]`
- **Pluggable:** Adding new game doesn't affect existing ones

---

## Known Issues & Lessons Learned

### Previous Implementation Issues

1. **File Size**
   - ❌ 9,900 lines in single HTML file
   - ⚠️ Became unmaintainable
   - ✅ Recommendation: Keep under 8,000 lines or split into modules

2. **Emoji Encoding**
   - ❌ UTF-8 emoji characters caused corruption during edits
   - ✅ Solution (when needed): Use HTML numeric entities (&#127919;)
   - ✅ Better solution: Use separate CSS class for emoji

3. **Hardcoded Colors**
   - ❌ Colors scattered throughout CSS
   - ❌ Theme switching required finding/replacing 50+ instances
   - ✅ Solution: All colors must use CSS variables (tested before shipping)

4. **Component Boundaries**
   - ❌ No clear separation between sections
   - ❌ Changes rippled unpredictably
   - ✅ Solution: Isolated render functions per section, scoped CSS classes

### Fresh Build Recommendations

1. **Code Organization**
   - Organize HTML into clear sections (Dashboard, Trivia, Games, etc.)
   - Use `<!-- SECTION: Title -->` comments
   - Keep CSS organized by component
   - Max 8000 lines per file

2. **Color Strategy**
   - Define all season themes upfront `:root` CSS variables
   - Never hardcode colors
   - Test all 4 themes before committing

3. **State Management**
   - Keep state flat (avoid deep nesting when possible)
   - Use ISO date format ("2026-06-16")
   - Version state for migrations (if needed later)
   - Test localStorage persistence

4. **Testing Checklist**
   - ✅ Seasonal theme switching
   - ✅ localStorage persistence across page reloads
   - ✅ Game unlock progression
   - ✅ Points calculation with multipliers
   - ✅ Daily quest reset at midnight
   - ✅ Mobile responsiveness (390px, 768px, 1920px)
   - ✅ All WCAG AA color contrast

---

## Next Phase: Fresh Build Plan

### Phase 1: Foundation
- [ ] Clean HTML structure with clear section organization
- [ ] Complete CSS variable system (all 4 seasons defined)
- [ ] State management (load/save functions)
- [ ] Dashboard grid layout

### Phase 2: Core Activity Sections
- [ ] Chores section
- [ ] Homework section
- [ ] Habits section
- [ ] Mood logging section
- [ ] Reading section

### Phase 3: Trivia & Games
- [ ] Trivia question system
- [ ] Difficulty progression
- [ ] Wordle game
- [ ] Quick-Fire game
- [ ] Game unlock system
- [ ] Leaderboards

### Phase 4: Rewards & Engagement
- [ ] Points system with multipliers
- [ ] Daily quest system
- [ ] Daily bonus streak
- [ ] Performance dashboard

### Phase 5: Polish & Features
- [ ] Gujarati learning section
- [ ] Kung Fu tracking
- [ ] Calendar view
- [ ] Animations & transitions
- [ ] Mobile optimization

---

## Success Criteria for Fresh Build

✅ Single source of truth (state object)  
✅ No hardcoded colors (all CSS variables)  
✅ Each section independently testable  
✅ Games modular (adding/removing won't break others)  
✅ Seasonal theming works across all sections  
✅ localStorage persistence verified  
✅ Points calculations accurate  
✅ Daily quests reset properly  
✅ Mobile responsive  
✅ WCAG AA color contrast throughout  
✅ Code under 8,000 lines (or properly modularized)  

