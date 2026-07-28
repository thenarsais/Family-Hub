# Sprint 5: Challenge Mode & Phase 5.1 Polish — Planning Document

**Status:** Ready to start | **Timeline:** 1 week | **Effort:** 2 weeks  
**Date Created:** 2026-06-12 | **Based on:** Phase 5.0 completion

---

## Context

Phase 5.0 is **100% complete** with all 4 mini-games fully implemented and tested:
- ✅ Wordle (Sprint 1)
- ✅ Quick-Fire (Sprint 2)
- ✅ Memory (Sprint 3)
- ✅ Word Scramble (Sprint 4)

Sprint 5 focuses on the **Challenge Mode** (composite game) plus **Phase 5.1 polish** (seasonal themes, daily bonus UI, leaderboard refinements).

---

## Sprint 5 Tasks

### Task 5.1: Challenge Mode Game Engine [4 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Game state machine:
  - `setup` → `playing` (difficulty selected)
  - `playing` → `won` (reach score target)
  - `playing` → `lost` (lose all 3 lives)
- [ ] Game mechanics:
  - Select 3 random mini-games (each appears once)
  - Play them sequentially: Wordle → Memory → Scramble (or random order)
  - Cumulative scoring (all games add to running total)
  - Health bar: Start with 3 lives
  - Lose 1 life for each game lost (not for doing poorly, but losing)
  - Win condition: Complete all 3 games AND reach score threshold (500 pts?)
- [ ] Score calculation:
  - Use each game's normal scoring
  - Bonus: 100 pts for clearing game without mistakes
  - Bonus: 50 pts per remaining life at end
- [ ] Game selection:
  - Randomly pick 3 from: Wordle, Quick-Fire, Memory, Scramble
  - Each game difficulty: Medium (balanced challenge)
  - Shuffle order each play
- [ ] UI display:
  - Header: "🏆 Challenge Mode"
  - Lives display: ❤️ ❤️ ❤️ (or ❤️ ❌ ❌ if 1 life left)
  - Running score
  - Game progress: "Game 2/3: Wordle"
  - Timer (if timed challenges)
- [ ] Results screen:
  - Final score (large)
  - Lives remaining
  - Games played (list with scores)
  - Personal best for Challenge Mode
  - Leaderboard (separate from individual games)

**Implementation Notes:**
- Reuse existing game engines (don't reinvent)
- Chain game modals (one closes, next opens)
- Save composite score to `state.games.stats.challenge.leaderboard`

---

### Task 5.2: Seasonal CSS Theme Application [2 days]
**Owner:** UI/Theme  
**Acceptance Criteria:**

- [ ] CSS var system:
  - Define: `--primary-color`, `--accent-color`, `--secondary-color`
  - Apply to: Game cards, buttons, progress bars, headers
  - Current system: Hardcoded colors, switch to CSS vars
- [ ] Theme switcher UI:
  - Add to settings panel or gear icon menu
  - Show current season (auto-detected or manual)
  - 4 options: Spring 🌱, Summer ☀️, Fall 🍂, Winter ❄️
  - Visual preview of theme colors
- [ ] Color mapping per season:
  - Spring: Primary #10B981 (green), Accent #BFDBFE (light blue), Secondary #D1FAE5
  - Summer: Primary #FBBF24 (gold), Accent #FEF3C7 (light yellow), Secondary #FDE047
  - Fall: Primary #F97316 (orange), Accent #FED7AA (light orange), Secondary #FDBA74
  - Winter: Primary #0EA5E9 (blue), Accent #BAE6FD (light blue), Secondary #E0F2FE
- [ ] Apply to:
  - Game unlock progress bars
  - Leaderboard best score display
  - Power-up buttons
  - Game card borders
  - Challenge Mode header and UI
  - Streak indicators
- [ ] Persistence:
  - Save theme choice to `state.games.seasonal.theme`
  - Auto-apply on page load via `applySeasonalTheme()`

**Design Notes:**
- Seasonal swap should be subtle, not jarring
- Should enhance not distract from game content
- Test readability across all 4 themes

---

### Task 5.3: Daily Bonus UI & Notifications [1.5 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Notification system:
  - Show "🎁 Daily Bonus: +10 pts!" on first game of day
  - Display briefly (3s), then fade out
  - Toast-style positioning (similar to unlock toasts)
  - Include streak count: "🎁 Daily Bonus: +10 pts! Streak: 3 days"
- [ ] Bonus display in trivia panel:
  - Show current streak: "Streak: 3 days 🔥"
  - Show if bonus already claimed: "Bonus claimed today ✓"
  - Show if eligible for bonus: "Claim daily bonus (first game)" hint
- [ ] Streak indicator:
  - Display in dashboard or side panel
  - Visual: "Daily Streak: 3 🔥"
  - Show progress to milestone bonuses (e.g., "5-day bonus: +50 pts")
- [ ] Wiring:
  - Call `awardDailyBonus()` on first game start
  - Show notification if bonus awarded
  - Update UI after award

**Implementation Notes:**
- Reuse toast notification system from unlock toasts
- Keep animation consistent with existing notifications
- Streak data already tracked, just need UI

---

### Task 5.4: Leaderboard UI Refinements [1.5 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Enhanced leaderboard display:
  - Sort by score (descending, always)
  - Add difficulty filter (Easy, Medium, Hard)
  - Add date range filter (Last 7 days, This month, All time)
  - Show medal progression: 🥇 🥈 🥉 🏅 🎖️
- [ ] Personal best comparison:
  - Show your score vs. leaderboard scores
  - Highlight your entry if in top 5
  - Show "Your Best" summary above leaderboard
- [ ] Game card improvements:
  - Show all 4 games on Memory/Scramble cards
  - Display best score per difficulty (not just overall)
  - Add mini leaderboard preview (top 3)
- [ ] Results screen tweaks:
  - Show rank in leaderboard (e.g., "🥇 Rank 2 (Medium)")
  - Show percent to next milestone
  - Add "Share" button (optional, for future)

**Implementation Notes:**
- Extend leaderboard data structure with difficulty filters
- Cache results for performance
- Use seasonal theme colors for medal badges

---

### Task 5.5: Performance Optimizations [1 day]
**Owner:** Engineering  
**Acceptance Criteria:**

- [ ] Game initialization:
  - Lazy-load games (don't init until first play)
  - Cache word lists and anagram sets
  - Memoize scrambled words per game
- [ ] Rendering:
  - Minimize DOM updates during gameplay
  - Use CSS animations instead of JS transitions
  - Debounce leaderboard updates
- [ ] Storage:
  - Compress leaderboard entries (trim old entries > 30 days)
  - Archive game stats (move 6-month+ data to archive table)
- [ ] Profiling:
  - Measure game load time (<1s)
  - Measure word scramble generation (<100ms)
  - Monitor localStorage size (<5MB)

**Implementation Notes:**
- Use browser DevTools to profile
- No external performance libs (keep it simple)

---

## Testing Checklist

### Unit Tests
- [ ] Challenge Mode: Win with all 3 games, check cumulative score
- [ ] Challenge Mode: Lose mid-way, check game stops
- [ ] Challenge Mode: Personal best tracked separately from single games
- [ ] Seasonal theme: Switch theme, verify colors apply
- [ ] Seasonal theme: Reload page, verify theme persists
- [ ] Daily bonus: First game awards bonus, second doesn't
- [ ] Daily bonus: Streak increments, resets after gap
- [ ] Leaderboard: Filter by difficulty, verify correct scores
- [ ] Leaderboard: Personal best display matches top score

### Integration Tests
- [ ] Challenge Mode plays smoothly without loading delays
- [ ] Unlock system still works alongside Challenge Mode
- [ ] Boost system works in Challenge Mode
- [ ] All 4 games integrate into Challenge Mode without errors
- [ ] Seasonal theme applies to all game components
- [ ] Daily bonus integrates with all 4 games

### Regression Tests
- [ ] Individual games (Wordle, Quick-Fire, Memory, Scramble) still work
- [ ] Unlock system unaffected
- [ ] Leaderboards for Memory/Scramble still display correctly
- [ ] Boost inventory still deducts correctly
- [ ] Personal best tracking still works

---

## Definition of Done

- [ ] All 5 tasks completed and code-reviewed
- [ ] Manual testing checklist passed
- [ ] No console errors or warnings
- [ ] Challenge Mode playable end-to-end
- [ ] Seasonal themes apply to all relevant UI
- [ ] Daily bonus notifications working
- [ ] Leaderboard filters functional
- [ ] Performance benchmarks met (<1s load, <100ms operations)
- [ ] Krish playtests Challenge Mode (feedback collected)
- [ ] No regression in Phase 5.0 games
- [ ] Commit with clear messaging

---

## Effort Estimate

- Task 5.1 (Challenge Mode engine): 4 days
- Task 5.2 (Seasonal themes): 2 days
- Task 5.3 (Daily bonus UI): 1.5 days
- Task 5.4 (Leaderboard polish): 1.5 days
- Task 5.5 (Performance): 1 day
- **Testing & polish: 1-2 days**
- **Total: ~11-12 days (1.5-2 weeks)**

---

## Success Criteria (Sprint 5 Exit)

1. Challenge Mode is fully playable (3 random games, cumulative scoring)
2. Health/lives system working (lose game = lose life)
3. Personal best tracked separately for Challenge Mode
4. Seasonal themes apply to all game UI
5. Daily bonus awarded and displays correctly
6. Streak counter shows in dashboard
7. Leaderboards support difficulty/date filtering
8. Personal best comparison shows on leaderboards
9. Performance: Games load <1s, word scramble <100ms
10. Krish playtests and provides feedback
11. Zero regressions in all 4 games

---

## Next Steps After Sprint 5

**Phase 5.2 (Optional):**
- [ ] Multiplayer leaderboards (friend comparisons)
- [ ] Social features (share scores)
- [ ] Achievement badges (e.g., "Perfect game", "Unbeaten streak")
- [ ] Advanced analytics dashboard

**Phase 5.3+:**
- [ ] Mobile app integration
- [ ] Cloud sync for multi-device play
- [ ] Seasonal content rotation (new questions per season)

---

**Status:** Ready to kickoff  
**Quality gate:** Phase 5.0 complete, no known regressions  
**Estimated shipping date:** 1.5-2 weeks from now  

🎮 **Phase 5: Complete Mini-Games System** ✅
