# Data Model & State Structure - Complete Specification

**Status:** Complete v1 data architecture specification  
**Date:** 2026-06-16  
**Purpose:** Blueprint for all data storage, structure, and management

---

## Table of Contents

1. [Overview](#overview)
2. [Complete State Object](#complete-state-object)
3. [Subsystem Details](#subsystem-details)
4. [Data Types & Constraints](#data-types--constraints)
5. [Initialization & Defaults](#initialization--defaults)
6. [Storage Strategy](#storage-strategy)
7. [Versioning & Migrations](#versioning--migrations)
8. [Access Patterns](#access-patterns)
9. [Examples](#examples)

---

## Overview

### Core Principles

1. **Single Source of Truth**: One `state` object in localStorage
2. **Immutability Pattern**: Never mutate state directly, create new objects
3. **Flat Structure**: Avoid deep nesting (easier to serialize/debug)
4. **ISO Dates**: All dates use ISO 8601 format ("2026-06-16")
5. **UTC Timestamps**: All server sync uses UTC timestamps
6. **Atomic Saves**: Save entire state after any change (not partial updates)
7. **Type Safety**: Define strict types for each field
8. **Backwards Compatibility**: Version state, support migrations

### Storage Layers

```
┌─────────────────────────────────┐
│  Active State (in-memory)        │
│  window.APP_STATE               │
└──────────────────┬──────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│  localStorage   │   │  Session Cache │
│  (persistent)   │   │  (temp views)   │
└────────┬────────┘   └────────────────┘
         │
┌────────▼────────────────────────┐
│  Google Drive Backup (JSON)      │
│  Synced on every state change    │
└─────────────────────────────────┘
```

---

## Complete State Object

### Root State Shape

```javascript
state = {
  _meta: {
    version: 1,
    lastSaved: "2026-06-16T15:30:00Z",
    deviceId: "device-uuid-12345",
    platform: "web" | "ha" | "mobile"
  },
  
  // User Profile
  user: { ... },
  
  // Game Systems
  games: { ... },
  trivia: { ... },
  
  // Activity Tracking
  dailyQuests: { ... },
  points: { ... },
  achievements: { ... },
  
  // Goal Systems
  weeklyGoals: { ... },
  monthlyGoals: { ... },
  
  // Category Tracking
  categories: { ... },
  
  // Streak Systems
  streaks: { ... },
  
  // Activity Sections
  chores: { ... },
  homework: { ... },
  habits: { ... },
  mood: { ... },
  reading: { ... },
  gujarati: { ... },
  kungfu: { ... },
  calendar: { ... },
  
  // Settings
  settings: { ... },
  
  // Parent Portal Data
  parentPortal: { ... },
  
  // Logging & Anti-Cheat
  activityLog: { ... },
  flags: { ... }
}
```

---

## Subsystem Details

### 1. USER Profile

```javascript
user: {
  profile: {
    name: "Krish",
    avatar: "🧠",
    createdDate: "2026-06-01",
    ageGroup: "8-12" | "13-17" | "18+",
    timezone: "EST" | "CST" | "MST" | "PST" | "GMT" | "IST" | "JST" | "AEST"
  },
  preferences: {
    theme: "auto" | "spring" | "summer" | "fall" | "winter",
    themeSetByUser: false, // auto-detect by month if false
    language: "en" | "gu" // future: Gujarati UI
  }
}
```

---

### 2. GAMES System

```javascript
games: {
  unlocked: ["wordle", "quickfire", "scramble", "hangman"], // unlocked game IDs
  stats: {
    wordle: {
      played: 15,
      won: 12,
      bestScore: 450,
      totalPoints: 5200,
      leaderboard: [
        {
          id: "game-session-001",
          difficulty: "easy" | "medium" | "hard",
          score: 450,
          pointsAwarded: 150,
          category: "Geography",
          date: "2026-06-16",
          timestamp: "2026-06-16T15:30:00Z",
          attempts: 2,
          timeSpent: 120, // seconds
          won: true
        },
        // ... more entries, newest first
      ],
      personalBest: {
        score: 450,
        difficulty: "hard",
        category: "Geography",
        date: "2026-06-14"
      }
    },
    quickfire: {
      played: 8,
      won: 6,
      bestScore: 280,
      totalPoints: 1200,
      leaderboard: [
        {
          id: "game-session-002",
          difficulty: "medium",
          score: 280,
          pointsAwarded: 100,
          correct: 8,
          total: 10,
          accuracy: 0.80,
          timeSpent: 120,
          date: "2026-06-16",
          timestamp: "2026-06-16T15:16:00Z",
          streak: 5 // consecutive correct before loss
        }
      ]
    },
    scramble: {
      played: 5,
      won: 4,
      bestScore: 180,
      totalPoints: 450,
      leaderboard: [
        {
          id: "game-session-003",
          difficulty: "medium",
          score: 180,
          pointsAwarded: 60,
          wordsCorrect: 5,
          timeSpent: 300,
          date: "2026-06-16"
        }
      ]
    },
    hangman: {
      played: 3,
      won: 2,
      bestScore: 120,
      totalPoints: 180,
      leaderboard: [
        {
          id: "game-session-004",
          difficulty: "medium",
          score: 120,
          pointsAwarded: 60,
          livesUsed: 2,
          categoryHidden: false,
          date: "2026-06-16"
        }
      ]
    }
  },
  
  dailyBonus: {
    streak: 5,
    claimed: true,
    lastClaimedDate: "2026-06-16",
    bonusHistory: [
      {
        date: "2026-06-16",
        streak: 5,
        multiplier: 1.1,
        bonusPointsAwarded: 50
      }
    ]
  }
}
```

**Unlock Logic:**
```javascript
unlockThresholds = {
  wordle: { metric: "trivia_correct", threshold: 5 },
  quickfire: { metric: "trivia_correct", threshold: 10, accuracy: 0.70 },
  scramble: { metric: "trivia_correct", threshold: 100 },
  hangman: { metric: "games_played", threshold: 3 }
}
```

---

### 3. TRIVIA System

```javascript
trivia: {
  onboarding: {
    completed: true,
    completedDate: "2026-06-01"
  },
  
  difficulty: {
    currentMode: "rookie" | "pro" | "legend",
    proUnlocked: true, // 80% rookie accuracy
    legendUnlocked: false, // 80% pro accuracy
    unlockHistory: [
      { mode: "pro", unlockedDate: "2026-06-10", accuracy: 0.82 }
    ]
  },
  
  stats: {
    totalAnswered: 87,
    correct: 72,
    incorrect: 15,
    overallAccuracy: 0.828,
    streak: {
      current: 8,
      longest: 15,
      longestDate: "2026-06-10"
    },
    
    byDifficulty: {
      rookie: {
        answered: 50,
        correct: 48,
        accuracy: 0.96,
        streak: 8
      },
      pro: {
        answered: 37,
        correct: 24,
        accuracy: 0.65,
        streak: 2
      },
      legend: {
        answered: 0,
        correct: 0,
        accuracy: 0,
        streak: 0
      }
    },
    
    byCategory: {
      Geography: {
        answered: 12,
        correct: 10,
        accuracy: 0.833,
        streak: 3,
        personalBest: 95 // points
      },
      History: {
        answered: 15,
        correct: 13,
        accuracy: 0.867,
        streak: 5
      },
      Science: {
        answered: 10,
        correct: 8,
        accuracy: 0.80,
        streak: 1
      },
      Literature: {
        answered: 8,
        correct: 7,
        accuracy: 0.875,
        streak: 2
      },
      "Indian Culture": {
        answered: 20,
        correct: 18,
        accuracy: 0.90,
        streak: 8
      },
      Sports: {
        answered: 22,
        correct: 16,
        accuracy: 0.727,
        streak: 0
      }
    }
  },
  
  progressTracking: {
    answeredQuestions: ["q001", "q005", "q012", ...], // UUID list
    incorrectPool: [
      {
        questionId: "q012",
        count: 2, // wrong attempts
        lastWrongDate: "2026-06-15",
        decayWeight: 0.8 // higher = more likely to resurface
      }
    ],
    hintsUsed: {
      phase1LearningFree: 15,
      phase2BuildingPenalty: 8,
      phase3MasteryPenalty: 2
    }
  },
  
  dailyGoal: {
    target: 15, // questions suggested
    targetToday: 15, // may be dynamic based on calendar
    answeredToday: 8,
    completed: false
  }
}
```

---

### 4. DAILY QUESTS System

```javascript
dailyQuests: {
  date: "2026-06-16",
  
  quests: [
    {
      id: "quest-1",
      game: "wordle",
      name: "Complete 2 Wordle games",
      icon: "🎯",
      progress: 1,
      target: 2,
      completed: false,
      questType: "game_completion"
    },
    {
      id: "quest-2",
      game: "quickfire",
      name: "Get 8+ correct in Quick-Fire",
      icon: "⚡",
      progress: 0,
      target: 8,
      completed: false,
      questType: "accuracy"
    },
    {
      id: "quest-3",
      game: "all",
      name: "Play 4 different games",
      icon: "🏆",
      progress: ["wordle", "quickfire"], // Set of game IDs played
      target: 4,
      completed: false,
      questType: "variety"
    }
  ],
  
  allCompleted: false,
  streak: 5, // consecutive days all quests completed
  completionHistory: [
    { date: "2026-06-15", completed: true, bonusPointsAwarded: 50 },
    { date: "2026-06-14", completed: true, bonusPointsAwarded: 50 }
  ]
}
```

---

### 5. POINTS System

```javascript
points: {
  total: 1250,
  today: 50,
  weekly: 280,
  monthly: 1200,
  
  dailyGoal: 50, // customizable by parent
  dailyGoalHistory: [
    { date: "2026-06-16", goal: 50, achieved: 50 },
    { date: "2026-06-15", goal: 50, achieved: 65 }
  ],
  
  ledger: [
    {
      id: "ledger-001",
      date: "2026-06-16",
      timestamp: "2026-06-16T15:30:00Z",
      activity: "wordle_win",
      basePoints: 100,
      difficulty: "medium",
      multipliers: {
        difficulty: 1.5,
        dailyBonus: 1.1,
        questCompletion: 1.0
      },
      finalPoints: 165,
      totalAfter: 1250
    }
  ],
  
  projection: {
    weeklyAtCurrentRate: 300,
    monthlyAtCurrentRate: 1200,
    calculatedDate: "2026-06-16"
  }
}
```

---

### 6. ACHIEVEMENTS & BADGES System

```javascript
achievements: {
  badges: [
    {
      id: "wordle-bronze",
      name: "Wordle Bronze",
      category: "games",
      game: "wordle",
      tier: "bronze",
      requirement: 5,
      metric: "wins",
      unlockedDate: "2026-06-12",
      pointsAwarded: 25
    },
    {
      id: "streak-5day",
      name: "5-Day Streak",
      category: "streaks",
      requirement: 5,
      metric: "consecutive_days",
      unlockedDate: "2026-06-16",
      pointsAwarded: 50
    }
  ],
  
  unlockedCount: 12,
  totalPointsFromBadges: 875,
  
  progressTowardNext: {
    "wordle-silver": {
      requirement: 25,
      current: 12,
      percentComplete: 0.48
    },
    "streak-7day": {
      requirement: 7,
      current: 5,
      percentComplete: 0.71
    }
  }
}
```

---

### 7. GOALS System

```javascript
weeklyGoals: [
  {
    id: "goal-001",
    createdDate: "2026-06-16",
    weekStart: "2026-06-16",
    weekEnd: "2026-06-22",
    goal: "Play 10 games",
    target: 10,
    metric: "games_played",
    progress: 6,
    reward: { points: 50 },
    completed: false,
    completedDate: null
  }
],

monthlyGoals: [
  {
    id: "goal-002",
    createdDate: "2026-06-01",
    month: "2026-06",
    goal: "Score 500 points",
    target: 500,
    metric: "points_earned",
    progress: 450,
    reward: { points: 100 },
    completed: false,
    completedDate: null
  }
],

goalHistory: [
  { id: "goal-000", completedDate: "2026-06-15", earned: 50 }
]
```

---

### 8. CATEGORY MASTERY

```javascript
categories: {
  Geography: {
    answered: 12,
    correct: 10,
    accuracy: 0.833,
    streak: 3,
    personalBest: 95,
    badge: "unlocked", // bronze/silver/gold/platinum
    difficultyBreakdown: {
      rookie: { answered: 8, correct: 8, accuracy: 1.0 },
      pro: { answered: 4, correct: 2, accuracy: 0.5 }
    }
  },
  History: { ... },
  Science: { ... }
  // ... more categories
}
```

---

### 9. STREAK SYSTEMS

```javascript
streaks: {
  activityDaily: {
    current: 5,
    longest: 15,
    longestDate: "2026-06-10",
    lastActivityDate: "2026-06-16",
    history: [
      { startDate: "2026-06-12", endDate: "2026-06-16", length: 5 },
      { startDate: "2026-06-01", endDate: "2026-06-11", length: 11 }
    ]
  },
  
  dailyQuests: {
    current: 5,
    longest: 8,
    longestDate: "2026-06-10",
    lastCompletionDate: "2026-06-16",
    recoveryUsedThisMonth: 0 // track recovery day usage
  },
  
  gameSpecific: {
    wordle: {
      winStreak: 3,
      winStreakLongest: 12
    },
    quickfire: {
      winStreak: 0,
      winStreakLongest: 5
    }
  },
  
  category: {
    Geography: {
      correctStreak: 3,
      correctStreakLongest: 5
    }
  }
}
```

---

### 10. ACTIVITY SECTIONS

```javascript
chores: {
  items: [
    {
      id: "chore-1",
      name: "Make bed",
      completed: true,
      completedDate: "2026-06-16",
      points: 5,
      priority: "high" | "medium" | "low",
      recurring: true
    }
  ]
},

homework: {
  items: [
    {
      id: "hw-1",
      subject: "Math",
      description: "Chapter 5 exercises",
      dueDate: "2026-06-17",
      completed: false,
      points: 10,
      estimatedMinutes: 45
    }
  ]
},

habits: {
  items: [
    {
      id: "habit-1",
      name: "Yoga",
      emoji: "🧘",
      frequency: "daily" | "weekly",
      completedDates: ["2026-06-16", "2026-06-15", "2026-06-14"],
      currentStreak: 3,
      longestStreak: 12,
      points: 10
    }
  ],
  todayCompleted: 1,
  todayTotal: 3
},

mood: {
  entries: [
    {
      id: "mood-1",
      date: "2026-06-16",
      emoji: "😊",
      energyLevel: 7,
      notes: "Had fun at Kung Fu",
      activity: "Kung Fu",
      timestamp: "2026-06-16T18:00:00Z"
    }
  ],
  todayMood: "😊",
  sevenDayTrend: ["😢", "😕", "😐", "😊", "😊", "😊", "😊"]
},

reading: {
  entries: [
    {
      id: "reading-1",
      date: "2026-06-16",
      book: "Harry Potter",
      pagesRead: 25,
      rating: 5,
      genre: "Fantasy",
      notes: "Really exciting",
      points: 25
    }
  ],
  booksCompleted: 3,
  totalPagesRead: 450
},

gujarati: {
  currentPhase: 2,
  lessonsCompleted: [1, 2, 3, 4, 5],
  sessionHistory: [
    {
      date: "2026-06-16",
      duration: 15,
      lessonId: 6,
      wordsLearned: 5,
      points: 15
    }
  ],
  totalWordsLearned: 87,
  estimatedNextLevel: "2026-07-01"
},

kungfu: {
  sessions: [
    {
      id: "kf-1",
      date: "2026-06-16",
      duration: 60,
      techniques: ["Roundhouse Kick", "Front Kick"],
      rating: 4,
      notes: "Good form",
      points: 10
    }
  ],
  currentBelt: "Yellow",
  nextBelt: "Orange",
  weeklyCount: 2
},

calendar: {
  events: [
    {
      id: "cal-1",
      date: "2026-06-17",
      title: "Swimming",
      time: "4:00 PM",
      type: "Sport",
      color: "#F97316",
      estimatedMinutes: 60
    }
  ]
}
```

---

### 11. SETTINGS

```javascript
settings: {
  profile: {
    dailyGoal: 50, // customizable
    dailyGoalHistory: [
      { date: "2026-06-16", goal: 50 },
      { date: "2026-06-01", goal: 50 }
    ]
  },
  
  display: {
    theme: "auto" | "spring" | "summer" | "fall" | "winter",
    themeSetByUser: false
  },
  
  timezone: {
    selected: "EST",
    autoDetected: false,
    lastChanged: "2026-06-01"
  },
  
  notifications: {
    enabled: true,
    toastsEnabled: true,
    soundEnabled: true,
    browserNotificationsEnabled: true,
    scheduleReminder: {
      enabled: true,
      time: "08:00" // morning reminder
    }
  },
  
  privacy: {
    timeTrackingVisible: true,
    leaderboardsVisible: true,
    achievementsVisible: true
  },
  
  features: {
    gamesEnabled: true,
    dailyQuestsEnabled: true,
    pointsEnabled: true,
    achievementsEnabled: true,
    goalsEnabled: false, // parent can disable
    leaderboardsEnabled: true
  }
}
```

---

### 12. PARENT PORTAL DATA

```javascript
parentPortal: {
  settings: {
    featureToggles: {
      games: true,
      dailyQuests: true,
      points: true,
      achievements: true,
      goals: false // parent disabled
    },
    
    dataVisibility: {
      timeTrackingVisible: true,
      leaderboardsVisible: true,
      achievementsVisible: true
    },
    
    recoveryDayThreshold: {
      schoolHours: 6,
      voluntaryHoursThreshold: 4 // school + 4h = recovery day alert
    }
  },
  
  recoveryDays: [
    {
      id: "recovery-1",
      date: "2026-06-16",
      approvedByParent: true,
      skippedActivities: ["gujarati", "trivia"],
      requiredActivities: ["chores", "homework"],
      message: "Big day! You've got a lot going on.",
      schoolHours: 6,
      voluntaryHours: 4.5
    }
  ],
  
  approvedActivities: [
    {
      date: "2026-06-16",
      activity: "quick_fire",
      timestamp: "2026-06-16T15:15:00Z",
      flaggedReason: "Speed anomaly",
      parentApproval: true,
      parentNotes: "Legitimate skill"
    }
  ]
}
```

---

### 13. ACTIVITY LOG & ANTI-CHEAT

```javascript
activityLog: [
  {
    timestamp: "2026-06-16T15:15:00Z",
    event: "game_completed",
    gameType: "quick_fire",
    difficulty: "medium",
    score: 150,
    correct: 8,
    total: 10,
    timeSpent: 120,
    flags: [],
    offline: false
  },
  {
    timestamp: "2026-06-16T15:16:00Z",
    event: "game_completed",
    gameType: "word_scramble",
    difficulty: "hard",
    score: 95,
    wordsCorrect: 5,
    timeSpent: 300,
    flags: ["speed_anomaly"],
    offline: false
  }
],

flags: {
  flaggedActivities: [
    {
      id: "flag-1",
      timestamp: "2026-06-16T15:16:00Z",
      activity: "word_scramble",
      reason: "speed_anomaly",
      description: "50 words in 2 minutes (avg: 3-5 min expected)",
      severity: "warning",
      parentReview: {
        reviewed: false,
        decision: null,
        notes: null
      }
    }
  ],
  
  suspiciousPatterns: [
    {
      pattern: "perfect_games_spike",
      date: "2026-06-16",
      description: "5 perfect games in 1 hour",
      severity: "warning",
      action: "monitor"
    }
  ]
}
```

---

## Data Types & Constraints

### Basic Types

```typescript
// Dates
type Date = "2026-06-16" // ISO format, no time
type DateTime = "2026-06-16T15:30:00Z" // ISO format with time

// Difficulty
type Difficulty = "easy" | "medium" | "hard"

// Game Types
type GameType = "wordle" | "quickfire" | "scramble" | "hangman"

// Category Types
type Category = "Geography" | "History" | "Science" | "Literature" 
  | "Indian Culture" | "Sports" | "Military" | "Gujarati"

// Metric Types
type MetricType = "games_played" | "points_earned" | "games_won" 
  | "trivia_correct" | "accuracy_percentage"

// Streak Types
type StreakType = "activity" | "games" | "category" | "habit"

// Points
type Points = number // Always positive integer

// Accuracy
type Accuracy = 0..1 // 0.0 to 1.0 (80% = 0.80)
```

### Constraints

```
- All dates must be ISO format
- All timestamps must be UTC
- Accuracy always 0-1 range
- Points always positive
- Streak always >= 0
- No null values in active records (use empty arrays instead)
- Difficulty always lowercase
- Game IDs always lowercase with hyphens
```

---

## Initialization & Defaults

### New User Initialization

```javascript
function getDefaultState() {
  return {
    _meta: {
      version: 1,
      lastSaved: new Date().toISOString(),
      deviceId: generateUUID(),
      platform: "web"
    },
    
    user: {
      profile: {
        name: "Krish",
        avatar: "🧠",
        createdDate: todayISO(),
        ageGroup: "8-12",
        timezone: detectTimezone() // or "EST"
      },
      preferences: {
        theme: "auto",
        themeSetByUser: false,
        language: "en"
      }
    },
    
    games: {
      unlocked: [], // empty, unlock as user progresses
      stats: {
        wordle: { played: 0, won: 0, bestScore: 0, totalPoints: 0, leaderboard: [] },
        quickfire: { played: 0, won: 0, bestScore: 0, totalPoints: 0, leaderboard: [] },
        scramble: { played: 0, won: 0, bestScore: 0, totalPoints: 0, leaderboard: [] },
        hangman: { played: 0, won: 0, bestScore: 0, totalPoints: 0, leaderboard: [] }
      },
      dailyBonus: { streak: 0, claimed: false, lastClaimedDate: null, bonusHistory: [] }
    },
    
    trivia: {
      onboarding: { completed: false, completedDate: null },
      difficulty: { currentMode: "rookie", proUnlocked: false, legendUnlocked: false },
      stats: {
        totalAnswered: 0,
        correct: 0,
        incorrect: 0,
        overallAccuracy: 0,
        streak: { current: 0, longest: 0, longestDate: null },
        byDifficulty: { /* ... */ },
        byCategory: { /* ... */ }
      },
      progressTracking: {
        answeredQuestions: [],
        incorrectPool: [],
        hintsUsed: { phase1LearningFree: 0, phase2BuildingPenalty: 0, phase3MasteryPenalty: 0 }
      },
      dailyGoal: { target: 10, targetToday: 10, answeredToday: 0, completed: false }
    },
    
    // ... initialize all other sections with empty/zero values
    
    settings: {
      profile: { dailyGoal: 50, dailyGoalHistory: [] },
      display: { theme: "auto", themeSetByUser: false },
      timezone: { selected: "EST", autoDetected: true, lastChanged: todayISO() },
      notifications: { /* default: all enabled */ },
      privacy: { /* default: all visible */ },
      features: { /* default: all enabled */ }
    }
  };
}
```

---

## Storage Strategy

### localStorage

```javascript
// Key: krish_activity_state_v1
localStorage.setItem(
  'krish_activity_state_v1',
  JSON.stringify(state)
);

// Load
const savedState = JSON.parse(
  localStorage.getItem('krish_activity_state_v1') || '{}'
);
```

**Size Estimate:**
- Initial state: ~5KB
- After 1 month of play: ~100KB
- After 1 year of play: ~500KB
- localStorage limit: 5-10MB (plenty of headroom)

### Google Drive Backup

```javascript
// File: ActivityBoard-Krish-Backup.json
{
  _meta: { version: 1, lastSynced: "2026-06-16T15:30:00Z" },
  deviceId: "device-uuid-12345",
  state: { /* full state object */ }
}

// Sync timing: After every state change
// Storage: ~500KB per user
// Retention: Keep last 90 days of backups
```

---

## Versioning & Migrations

### Version Tracking

```javascript
state._meta.version = 1 // Increment on breaking changes
```

### Migration Path (v1 → v2)

```javascript
function migrateState(oldState, fromVersion, toVersion) {
  let state = { ...oldState };
  
  if (fromVersion === 1 && toVersion === 2) {
    // Example v2 changes:
    // - Add social features
    // - Refactor goal system
    // - Add new metrics
    state._meta.version = 2;
  }
  
  return state;
}

// On app init
let state = loadState();
if (state._meta.version < CURRENT_VERSION) {
  state = migrateState(state, state._meta.version, CURRENT_VERSION);
  saveState(state);
}
```

---

## Access Patterns

### Read Patterns

```javascript
// Get user's current streak
const currentStreak = state.streaks.activityDaily.current;

// Get all games played
const gamesPlayed = Object.values(state.games.stats)
  .reduce((sum, game) => sum + game.played, 0);

// Get accuracy for category
const geoAccuracy = state.trivia.stats.byCategory.Geography.accuracy;

// Get today's points
const todaysPoints = state.points.today;
```

### Write Patterns

```javascript
// Record game completion
function recordGamePlay(gameType, result) {
  // 1. Add to game stats
  state.games.stats[gameType].leaderboard.unshift(result);
  state.games.stats[gameType].played++;
  
  // 2. Add to points ledger
  const points = calculatePoints(result);
  state.points.ledger.push({
    activity: `${gameType}_win`,
    basePoints: points,
    finalPoints: points,
    timestamp: new Date().toISOString()
  });
  state.points.total += points;
  state.points.today += points;
  
  // 3. Update quest progress
  updateQuestProgress(gameType);
  
  // 4. Save state
  saveState(state);
}

// Save to localStorage + Google Drive
function saveState(newState) {
  state = newState;
  state._meta.lastSaved = new Date().toISOString();
  
  localStorage.setItem('krish_activity_state_v1', JSON.stringify(state));
  
  // Queue async sync to Google Drive
  syncToGoogleDrive(state);
}
```

---

## Examples

### State After First Game Win

```javascript
state.games.stats.wordle = {
  played: 1,
  won: 1,
  bestScore: 450,
  totalPoints: 450,
  leaderboard: [{
    id: "game-1",
    difficulty: "easy",
    score: 450,
    pointsAwarded: 150,
    category: "Geography",
    date: "2026-06-16",
    attempts: 2
  }]
}

state.points.total = 150;
state.points.today = 150;
state.points.ledger = [{
  activity: "wordle_win",
  basePoints: 100,
  multipliers: { difficulty: 1.5 },
  finalPoints: 150,
  totalAfter: 150
}]

state.games.dailyBonus.claimed = false; // Not claimed yet
state.streaks.activityDaily.current = 1;
state.dailyQuests.quests[0].progress = 1; // 1/2 Wordle games done
```

### State After Daily Streak Milestone

```javascript
state.streaks.activityDaily.current = 7;
state.streaks.activityDaily.longest = 7;

state.achievements.badges.push({
  id: "streak-7day",
  name: "7-Day Streak",
  unlockedDate: "2026-06-23",
  pointsAwarded: 50
});

state.points.total += 50; // Achievement bonus
```

---

## Implementation Checklist

- [ ] Define TypeScript interfaces for type safety (optional but recommended)
- [ ] Implement saveState() function
- [ ] Implement loadState() function
- [ ] Implement saveToGoogleDrive() function
- [ ] Test localStorage persistence across sessions
- [ ] Test state initialization for new users
- [ ] Test state migration logic
- [ ] Implement activity logging for anti-cheat
- [ ] Set up backup and restore procedures

