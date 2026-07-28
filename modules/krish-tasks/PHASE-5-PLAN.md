# Phase 5 Implementation Plan: Mini-Games & Power-ups

## Overview
Phase 5 extends the trivia system with engaging mini-games and power-ups to boost retention and reinforce learning through gamified variety. Building on Phases 1-4 (core trivia, badges, difficulty unlocks, streaks), this phase adds fast-paced gameplay mechanics while maintaining educational rigor.

**Target audience:** Krish (elementary school), ages 8-12  
**Primary goal:** 30% increase in daily engagement; reinforce learning through varied game modes  
**Estimated effort:** 4-5 sprints (staggered releases, not monolithic)

---

## 1. Unlock System & Milestones

### Unlock Tiers
| Milestone | Unlock | Trigger | Progress Gate |
|-----------|--------|---------|---|
| **Access** | First mini-game (Wordle) | Play 5 trivia questions | Can't skip |
| **Bronze** | Quick-Fire (3x speed) | 10 trivia correct answers + 70% accuracy | Recommended but not blocking |
| **Silver** | Memory Game | 50 total correct answers + bronze badge | Soft gate |
| **Gold** | Word Scramble | 100 correct + silver + 80% category accuracy | Soft gate |
| **Platinum** | Challenge Mode (timed, hard) | 200 correct + all badges + 80%+ overall | Aspirational |

### Milestone Triggers
- **Count-based**: Total correct answers across all time (global counter)
- **Accuracy-based**: Category accuracy, overall accuracy, streak maintenance (>3 days)
- **Badge-based**: Must earn bronze/silver/gold badges in ≥2 categories
- **Time-based**: Unlock new seasonal themes quarterly (spring, summer, fall, winter)

### Design Notes
- Games stay accessible; tiers are *recommendations*, not hard locks (except first game)
- Unlock notifications toast on trivia screen when criteria met
- UI shows "🔓 Unlocked!" with reward flavor text (e.g., "You've mastered the basics!")

---

## 2. Mini-Games: Descriptions & Build Priority

### Game #1: Wordle Variant — "Fact or Fiction" (PRIORITY: Now)
**Why first:** Low complexity, leverages existing question data, teaches critical thinking.

- **Mechanic:** Player guesses a 5-letter *category name* (Science, History, Geo, etc.) in 6 tries
- **Feedback:** Green (correct letter, right position), Yellow (correct letter, wrong spot), Gray (not in word)
- **Learning angle:** Reinforces category mastery; player must know which categories they've studied
- **Duration:** 2-3 minutes per game
- **Scoring:** 100 pts for correct in ≤3 tries, 50 pts for 4-6 tries, 0 pts for failure
- **Implementation:** 
  - Modify Wordle logic for 5-letter categories
  - Use existing category list from TRIVIA_QUESTION_BANK
  - Store daily play count (max 3/day) + weekly leaderboard

**Effort: 1.5 sprints (logic + UI + animations)**

---

### Game #2: Quick-Fire Trivia (PRIORITY: Sprint 2)
**Why second:** Builds on existing trivia engine; highest engagement ROI.

- **Mechanic:** 10 random questions, 15 seconds per question, no hints, 4 shuffled options
- **Twist:** Combo multiplier (2x after 3 correct, 3x after 5 correct)
- **Scoring:** Base 10 pts × combo multiplier × (time remaining / 15)
- **Learning angle:** Speed + accuracy; reinforces knowledge under pressure
- **Duration:** 2.5 minutes (10 × 15s) + results
- **Implementation:**
  - Reuse question bank; filter by player's unlocked difficulties
  - Simple timer countdown UI (big, bold numbers)
  - Combo counter animates when threshold hit

**Effort: 1 sprint (leverage existing render, add timer + multiplier)**

---

### Game #3: Memory Tiles (PRIORITY: Sprint 3)
**Why third:** Medium complexity; teaches memorization (aligned with learning goals).

- **Mechanic:** 12 tiles (4×3 grid) hiding trivia Q&A pairs. Flip 2, match pairs = 1 point
- **Difficulty levels:**
  - Easy: 8 tiles, 1 minute timer, science + history only
  - Medium: 12 tiles, 1.5 min timer, all categories
  - Hard: 16 tiles, 1 min timer, advanced difficulty Qs
- **Scoring:** 50 pts base + 25 pts per 10 sec remaining
- **Learning angle:** Active recall of answers; reinforces retention
- **Duration:** 2-3 minutes per game
- **Implementation:**
  - Generate pairs from TRIVIA_QUESTION_BANK questions + answers
  - CSS flip animations (transform + backface-visibility)
  - Prevent rapid flips; track matched pairs

**Effort: 1.5 sprints (grid logic + card flip anim + difficulty modes)**

---

### Game #4: Word Scramble (PRIORITY: Sprint 4)
**Why fourth:** Highest effort; builds on memory and spelling reinforcement.

- **Mechanic:** Anagram of answer from trivia question. Player has 20 seconds to unscramble
- **Format:** 5 scrambled words per round; fill in blanks or type answers
- **Difficulty:** Easy (3-letter answers), Medium (5-7 letters), Hard (8+ letters)
- **Scoring:** 10 pts per correct word + 5 pts per 5 sec remaining
- **Learning angle:** Spelling, vocabulary, problem-solving
- **Duration:** 2-2.5 minutes per round
- **Implementation:**
  - Extract single-word answers from question bank (filter multi-word)
  - On-screen keyboard (mobile) or text input
  - Highlight unmatched letters as user types

**Effort: 2 sprints (answer extraction, anagram gen, input logic, validation)**

---

### Game #5: Challenge Mode (PRIORITY: Post-Phase 5)
**Defer this to Phase 5.2 (future sprint).** This is the aspirational endgame.

- **Mechanic:** Composite game: 3 random mini-games in succession, cumulative scoring
- **Twist:** Health bar (3 lives; 1 wrong answer in any game = -1 life)
- **Scoring:** Chain bonus (1.5x per game completed without failure)
- **Duration:** 5-7 minutes
- **Implementation dependency:** Requires all 4 mini-games stable first

---

## 3. Power-up System

### Power-up Types & Effects
| Power-up | Cost | Effect | Recharges | Strategic Use |
|----------|------|--------|-----------|---|
| **Double Points** | 10 pts | 1 game: 2× scoring | Daily | Sprint to level up |
| **Skip Question** | 5 pts | Trivia: next Q auto-correct | Per session | Maintain streak |
| **Extra Time** | 8 pts | Mini-games: +10 sec | Daily | Speed games challenge |
| **Hint Unlock** | 3 pts | Trivia: reveal category/first letter | Unlimited | Learn strategically |
| **Combo Freeze** | 7 pts | Quick-Fire: combo stays if fail once | Per game | High-risk, high-reward |

### Earning Power-ups
- **Milestone rewards:** 5-point bundle at each badge tier (bronze = 1 Double Points, silver = 1 Extra Time, etc.)
- **Streaks:** 3-day streak = 1 free power-up (random)
- **Achievements:** Beat personal best in any game = 2 pts toward next power-up
- **Daily bonus:** First game of day = +5 pts (separate currency)

### Power-up Currency
- **Type:** "Boost Points" (tracked separately from main Points)
- **Storage:** `state.trivia.boosts = { double_points: 2, skip: 1, extra_time: 3, ... }`
- **UI:** Display in trivia panel as small stack (3-letter abbreviation + count)
- **Refresh:** Weekly reset for time-limited power-ups; unlimited ones never expire

### Implementation
- Add power-up modal in trivia panel ("Use a Boost?")
- Store usage log: `state.trivia.boostHistory = [ { type, date, gameId, score_gained } ]`
- Don't let power-ups trivialize learning: e.g., Skip still counts as "wrong" for streak purposes

---

## 4. UI/UX: Access & Navigation

### Entry Point
- **Add "Games" tab** in main activity board (next to Trivia, Habits, etc.)
  - Grid of 4-5 game cards: locked (🔒) or unlocked (🎮)
  - Show progress to unlock (e.g., "3 / 5 correct answers")
  - Tap to play or view stats

### In-Game UX
- **Header:** Game name, timer (if applicable), score/combo counter
- **Center:** Game board/question area (Wordle grid, memory tiles, Q display, etc.)
- **Footer:** 
  - Power-up quick-access bar (tap to activate)
  - "Back" button (confirm if mid-game)
  - Pause / Surrender option

### Post-Game
- **Results screen:** Score, accuracy %, personal best, rank (if multiplayer future)
- **Loot notification:** Boost points earned, milestones unlocked
- **CTA:** "Play Again" (next 3 are free) or "Try Another Game"

### Mobile-first design
- Vertical stacking, full-width cards
- Touch-friendly tap targets (48px minimum)
- No hover states; use active states for feedback

---

## 5. Complexity & Build Sequencing

### Relative Effort Map
```
Easy (0.5 sprint)    [Wordle Variant]
      ↓
Medium (1 sprint)    [Quick-Fire]
      ↓
Medium+ (1.5 sp)     [Memory Tiles]
      ↓
Hard (2 sprints)     [Word Scramble]
      ↓
Very Hard (2 sp)     [Challenge Mode] — *defer*
```

### Quick Wins (Sprint 1)
- [ ] Add "Games" tab navigation stub
- [ ] Implement Wordle variant (with category list from question bank)
- [ ] Unlock notification system (toast + onboarding)
- [ ] Boost points UI (display in trivia panel)

### Sprint 2–3
- [ ] Quick-Fire mini-game (10Q, 15s each, combo multiplier)
- [ ] Memory Tiles (8/12 tile variants)
- [ ] Power-up "Use?" modal in all games
- [ ] Leaderboard infrastructure (optional: local high scores)

### Sprint 4
- [ ] Word Scramble (anagram engine, difficulty levels)
- [ ] Seasonal content stub (theme selectors; actual assets = Phase 5.2)
- [ ] Daily bonus tracker & reset logic
- [ ] Metrics & telemetry (game plays, avg scores, retention)

### Sprint 5+
- [ ] Challenge Mode (composite game flow)
- [ ] Seasonal assets (holiday Wordle words, themed tile backgrounds)
- [ ] Multiplayer leaderboards (if Parent Admin view added in Sprint 3)
- [ ] A/B testing different unlock thresholds

---

## 6. Seasonal Content Approach

### Themes (Quarterly Rotation)
- **Spring** (Mar–May): Garden/nature color scheme, plant-themed Wordle words, memory tiles with flower/insect icons
- **Summer** (Jun–Aug): Beach colors, vacation/travel questions, sunny happy-hour bonus (2x pts, 4–6 PM)
- **Fall** (Sep–Nov): Harvest/school colors, back-to-school trivia, free power-up daily
- **Winter** (Dec–Feb): Snow/holiday colors, holiday trivia questions, gift-themed rewards (badges with 🎁)

### Implementation (Light Weight)
- **Phase 5.0 MVP:** Background gradient + accent colors shift by season (CSS variables)
- **Phase 5.1:** Swap emoji sets in games (e.g., memory tiles use seasonal icons)
- **Phase 5.2:** New trivia question subset per season (maybe 20-30 holiday-themed Qs)

### Mechanics
- **No paywall.** All seasonal content is free; badges have seasonal emoji variants.
- **Auto-switch:** Themes change at season start (Mar 1, Jun 1, Sep 1, Dec 1)
- **Player choice:** Optional toggle "I like [Season X], keep that theme" (stored in prefs)

---

## 7. Technical Implementation Steps

### Codebase Structure
```
krish-daily-tasks.html (main app, 4805 lines → ~5500 by end of Phase 5)
├── CSS (existing: dashboard, trivia, habits)
│   ├── Add: .game-tab, .game-card, .wordle-grid, .memory-tile, .timer
│   └── Add: .power-up-bar, .achievement-toast, .seasonal-theme
├── JS (existing: trivia engine, badge system, state management)
│   ├── Add: Game engines (wordle, quickfire, memory, scramble)
│   ├── Add: Power-up logic (spend, earn, check balance)
│   ├── Add: Unlock checker (milestone triggers)
│   └── Add: Seasonal renderer (CSS class swap)
└── HTML (existing: view-dashboard, view-trivia)
    ├── Add: view-games (new tab)
    ├── Add: game-wordle, game-quickfire, game-memory, game-scramble
    └── Add: modals (power-up, results, milestone unlock)
```

### State Schema Extensions
```javascript
// Add to localStorage schema (krish_tasks_v1)
state.games = {
  unlocked: ['wordle'],  // games user has access to
  favorites: ['wordle'], // most-played
  stats: {
    wordle:    { plays: 5, bestScore: 250, totalScore: 900, lastPlayed: '2026-06-12' },
    quickfire: { plays: 0, bestScore: 0, totalScore: 0, lastPlayed: null }
  }
}

state.boosts = {
  points: [ { id, type: 'double_points', earned: '2026-06-10', spent: null } ],
  used: []
}

state.milestones = {
  firstGame:      { date: '2026-06-10', game: 'wordle' },
  unlockedGames: { quickfire: '2026-06-14', memory: '2026-06-20' }
}

state.seasonal = {
  currentTheme: 'spring', // auto or manual
  themes:       { spring: { unlocked: true, plays: 12 }, summer: { ... } }
}
```

### Unlock Checker Logic
```javascript
function checkGameUnlocks() {
  const unlockedGames = [];
  
  // Wordle: always available after 5 questions
  if (getTriviaStats().total >= 5 && !isGameUnlocked('wordle')) {
    unlockedGames.push('wordle');
  }
  
  // Quick-Fire: 10 correct + 70% accuracy
  if (getTriviaStats().correct >= 10 && getOverallAccuracy() >= 0.70 && !isGameUnlocked('quickfire')) {
    unlockedGames.push('quickfire');
  }
  
  // Memory: 50 correct + bronze badge in 2 cats
  const bronzeBadges = countBadgesByTier('bronze');
  if (getTriviaStats().correct >= 50 && bronzeBadges >= 2 && !isGameUnlocked('memory')) {
    unlockedGames.push('memory');
  }
  
  // Word Scramble: 100 correct + silver badge + 80% category
  if (getTriviaStats().correct >= 100 && getHighestCategoryAccuracy() >= 0.80 && !isGameUnlocked('scramble')) {
    unlockedGames.push('scramble');
  }
  
  return unlockedGames;
}
```

### Key Integration Points
1. **Trivia → Games:** After every trivia question answered, call `checkGameUnlocks()`
2. **Power-ups:** On trivia answer submission, check if player has "Skip" boost and show option
3. **Streaks:** 3+ day streak logic already exists; tie to daily bonus boost award
4. **Metrics:** Log game plays to analytics (if HA integration exists) or localStorage history

---

## 8. Timeline & Dependencies

### Critical Path
1. **Sprint 1 (Now):** Wordle variant (foundation for unlock system)
2. **Sprint 2:** Quick-Fire (leverages existing trivia engine; high engagement ROI)
3. **Sprint 3:** Memory Tiles (independent; teaches memorization)
4. **Sprint 4:** Word Scramble (builds on answer extraction)
5. **Sprint 5:** Polish, seasonal assets, Challenge Mode (defer if time-boxed)

### Dependency Graph
```
Unlock System
├── Wordle
│   └── Quick-Fire
│   └── Memory Tiles (parallel, no deps)
├── Word Scramble (depends on answer cleaning)
└── Power-up Currency (can build in parallel with any game)

Seasonal Content
└── Theme CSS (low priority, can mock now, real assets Phase 5.2)
```

### Risk Mitigation
- **Risk:** Scope creep on mini-game count. **Mitigate:** Lock Sprint 5 to "Challenge Mode only"; defer cosmetic polish to 5.2
- **Risk:** Power-ups make game too easy. **Mitigate:** Playtest with Krish; ensure Skip doesn't count as "learning" (no streak bonus)
- **Risk:** Mobile tile flipping is janky. **Mitigate:** Use CSS transforms (GPU-accelerated), test on actual tablet

---

## 9. Success Metrics (Post-Phase 5)

- **Engagement:** 30% increase in daily app opens (from current baseline)
- **Retention:** 70% of players unlock ≥2 games by end of week 1
- **Learning:** No decrease in trivia accuracy (power-ups don't degrade learning)
- **Monetization readiness:** Boost system validates eventual IAP model (future)

---

## Appendix: Sample Unlock Notification

```
🎉 You've unlocked QUICK-FIRE!
   You've answered 10 trivia questions correctly.
   
   Speed matters! Get 3 in a row for a 2x score combo.
   [Play Now] [Later]
```

---

**Owner:** Krish's Daily Tasks — Phase 5  
**Status:** Planning (Ready for Sprint 1 kickoff)  
**Last Updated:** 2026-06-12
