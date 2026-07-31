# Krish Activity Board - Complete Requirements & Architecture

**Last Updated:** 2026-06-16  
**Status:** Ready for Fresh Build  
**Notes:** This documents lessons learned from previous implementation to inform clean rebuild

---

## 1. Feature Requirements

### Core Games (4 games minimum)
- **Wordle (Category Wordle)**
  - Select from trivia question pool
  - 6 attempts to guess the answer
  - Difficulty modes: Easy, Medium, Hard
  - Scoring based on attempts remaining
  - Leaderboard tracking

- **Quick-Fire Trivia**
  - Multiple choice questions
  - Timed answers (optional)
  - Difficulty modes
  - Accuracy percentage tracking
  - Leaderboard tracking

- **Word Scramble**
  - Unscramble letters to form words
  - Difficulty modes
  - Timer-based scoring
  - Leaderboard tracking

- **Future Games (Fill-in-the-Blank, Hangman, Crossword)**
  - Architecture should support adding games modularly
  - Each game self-contained with own styling
  - No cross-game styling pollution

### Daily Quests System
- 3 random daily quests from pool of 11+ templates
- Quest types:
  - "Complete 2 Wordle games"
  - "Score 150+ points in game X"
  - "Win 3 games in a row"
  - "Play 4 different games"
  - Custom metric tracking per quest
- Real-time progress bars
- +50 point bonus for completing all 3 daily
- Quest streak tracking (consecutive days completing all)
- Display on Trivia page (not main dashboard)

### Leaderboard System
- Multiple views: All-Time, This Week, This Month
- Multiple sorts: Highest Score, Most Recent, Most Played
- Per-game tracking
- Difficulty filtering
- Consistency metrics
- Top 20 display

### Seasonal Theming System
- **4 Themes:**
  - Spring: Green primary (#10B981), Mint accents
  - Summer: Gold primary (#FBBF24), Mint + Coral + Orange accents
  - Fall: Orange primary (#F97316), Warm accents
  - Winter: Blue primary (#0EA5E9), Cool accents

- **CSS Variable Architecture:**
  - `--season-primary`: Main theme color
  - `--season-accent`: Primary accent
  - `--season-secondary`: Light accent
  - `--season-bg-light`: Light background
  - `--season-bg-body`: Page background tint
  - `--season-text`: Text color for season
  - `--season-border`: Border color

- **Key lesson:** NO hardcoded colors. All colors use CSS variables.
- Auto-detect season by month, manual override support

### Performance Dashboard
- Overview stats: Total points, games played, current streak, today's points
- Activity heatmap: Last 7 days color-intensity visualization
- Game performance: Stats by game (wins/losses, personal bests, win rates)
- Modal interface with responsive grid

### Daily Bonus System
- Track consecutive days of activity
- Bonus multiplier scaling:
  - Day 3+: 1.1x
  - Day 7+: 1.2x
  - Day 14+: 1.5x
  - Day 30+: 2.0x
- Bonus claim UI with status indicator

### Points & Reward System
- Points awarded per game based on difficulty
- Streak multipliers applied
- Daily bonus system
- Leaderboard tracking per user
- Daily goal tracking (default 50 points)

### Trivia Integration
- Question pool: 130+ questions with difficulty levels
- Category system
- Difficulty badges (Rookie/Pro/Legend)
- Unlock progression (Pro at 80%, Legend at 80%)

### Other Features
- Daily Streak display
- Achievements system (weekly/monthly)
- Habits tracking (linked to Yoga/Kung Fu)
- Mood logging (emoji-based)
- Calendar integration
- Gujarati learning (timer-based)
- Reading tracking
- Points tracker with daily/weekly/monthly views

---

## 2. Data Model & State Management

### localStorage Structure
```javascript
state = {
  // User profile
  trivia: {
    onboarding: {
      name: "Krish",
      avatar: "🧠",
      completed: true
    },
    difficulty: {
      currentMode: 'rookie',
      proUnlocked: false,
      legendUnlocked: false
    }
  },

  // Points system
  points: {
    total: 1250,
    today: 50,
    weekly: 280,
    monthly: 1200,
    dailyGoal: 50
  },

  // Games tracking
  games: {
    unlocked: ['wordle', 'quickfire', 'scramble'],
    stats: {
      wordle: {
        played: 5,
        bestScore: 450,
        leaderboard: [{score, difficulty, date, won}, ...]
      },
      quickfire: { ... },
      scramble: { ... }
    },
    dailyBonus: {
      streak: 12,
      claimed: true,
      lastClaimedDate: "2026-06-16",
      bonusHistory: [{date, points, multiplier}, ...]
    }
  },

  // Daily Quests
  dailyQuests: {
    date: "2026-06-16",
    quests: [
      { id: 'quest-1', game: 'wordle', name: '...', progress: 1, target: 2, completed: false },
      ...
    ],
    allCompleted: false,
    streak: 5
  },

  // Habits, Mood, Calendar, etc.
  habits: { ... },
  mood: { ... },
  calendar: { ... },
  settings: { dailyGoal: 50, theme: 'auto' }
}
```

### Key Principles
- Single source of truth in `state` object
- Serialize to localStorage on each state change
- Date keys use ISO format ("2026-06-16")
- Arrays for leaderboards (sorted by score descending)
- Streak calculations based on consecutive dates

---

## 3. Architecture Lessons & Patterns

### What Went Well
✅ Seasonal CSS variables system - clean, maintainable  
✅ Modular game functions - easy to add new games  
✅ localStorage persistence - reliable state management  
✅ Leaderboard design - flexible multi-view sorting  
✅ Quest pool pattern - 11 templates → random daily selection  

### What Was Problematic
❌ Single 9000+ line HTML file - became unmaintainable  
❌ Emoji encoding issues with file editing - caused corruption  
❌ Hardcoded colors scattered throughout - broke when updating theme  
❌ No clear component boundaries - changes rippled unpredictably  
❌ Dynamic HTML generation in JavaScript - hard to find/edit  

### Recommended Architecture for Fresh Build

**Option 1: Single HTML (Improved)**
- Keep single-file approach but:
  - Organize with clear section comments
  - Use separate `<style>` blocks per card component
  - Use template literals cleanly with proper indentation
  - Define all colors in :root CSS variables upfront
  - No hardcoded colors anywhere

**Option 2: Modular Build (More complex)**
- Separate HTML/CSS/JS files
- Build process to bundle
- Better IDE support for encoding

**Recommendation:** Start with Option 1 (single file, but much cleaner structure). Has worked well, just needs better organization.

### Styling System for Fresh Build

**CSS Variable Strategy:**
```css
:root {
  /* Seasonal variables - these CHANGE per theme */
  --season-primary: #10B981;     /* Main color */
  --season-accent-1: #A7F3D0;    /* Light mint accent */
  --season-accent-2: #FDBA74;    /* Warm accent */
  --season-accent-3: #F97316;    /* Bold accent */
  --season-bg-light: #ECFDF5;
  --season-bg-body: #F0FDFB;
  --season-text: #065F46;
  --season-border: #A7F3D0;

  /* Fixed colors - never change */
  --success: #10B981;
  --danger: #EF4444;
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Spacing & sizing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --radius: 10px;
}
```

**Component Styling Rule:**
- Each card/section gets isolated `<style>` block
- All colors use CSS variables
- No inline styles except for dynamic values
- Class names scoped: `.wordle-*`, `.habit-*`, etc.

---

## 4. Trivia Integration

### Question Bank Format
```javascript
TRIVIA_QUESTION_BANK = [
  {
    uuid: "q001",
    question: "What is the capital of India?",
    options: ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
    correct: "Delhi",
    category: "Geography",
    difficulty: "easy",
    fun_fact: "Delhi has been inhabited since..."
  },
  // 130+ questions total
]
```

### Difficulty System
- Easy: 60% win rate expected
- Medium: 40% win rate expected
- Hard: 20% win rate expected
- Unlock progression at 80% accuracy

---

## 5. Implementation Checklist for Fresh Build

### Phase 1: Foundation
- [ ] Set up clean HTML file structure
- [ ] Define complete CSS variable system
- [ ] Implement localStorage state management
- [ ] Create saveState() and loadState() functions
- [ ] Set up seasonal theme switching

### Phase 2: Core Games
- [ ] Wordle game
- [ ] Quick-Fire game
- [ ] Word Scramble game
- [ ] Leaderboard system for each

### Phase 3: Daily Quests & Rewards
- [ ] Daily quest system
- [ ] Quest tracking in state
- [ ] Daily bonus multiplier
- [ ] Streak tracking

### Phase 4: UI Polish & Features
- [ ] Performance dashboard
- [ ] Seasonal theming across all elements
- [ ] Responsive design
- [ ] Animations & transitions

### Phase 5: Additional Games
- [ ] Fill-in-the-Blank
- [ ] Hangman
- [ ] Future games

---

## 6. Key Lessons to Remember

1. **File Size:** Keep single HTML under 8000 lines if possible. If it grows beyond that, consider modular build.

2. **Colors:** NEVER hardcode colors. Every color should be a CSS variable. Test theme switching before considering feature complete.

3. **Encoding:** If using emoji extensively, establish encoding rules upfront (all files UTF-8, no BOM).

4. **Testing:** After any styling change, test in all 4 seasonal themes before committing.

5. **State:** Keep state shape flat where possible. Nested objects are harder to serialize/debug.

6. **Game modularity:** Each game should be completely independent. Adding a new game shouldn't require changes to other games.

---

## 7. Success Metrics for Fresh Build

- [x] Can switch between 4 seasonal themes without broken colors
- [x] Each game can be added/removed without affecting others
- [x] Daily quests track real-time progress
- [x] Leaderboards filter and sort efficiently
- [x] localStorage state persists across sessions
- [x] Mobile responsive (tested at 390px, 768px, 1920px)
- [x] All WCAG AA color contrast requirements met

