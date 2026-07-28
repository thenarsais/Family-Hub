# Sprint 4: Word Scramble Game & Seasonal Content — Task Breakdown

**Timeline:** 2 weeks | **Focus:** Word puzzle game + seasonal theming  
**Owner:** Krish's Daily Tasks Team  
**Status:** Ready to start

---

## Deliverables (MVP)

1. Word Scramble game engine (5 anagrams per round, 3 difficulty levels)
2. Anagram generation from word list
3. Scoring system (base + time bonus)
4. Leaderboard infrastructure (similar to Memory)
5. Seasonal content stub (theme selector, CSS color swaps)
6. Daily bonus tracker (first game of day bonus)

---

## Task Breakdown

### Task 4.1: Word Scramble Game Engine [3 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Game state machine:
  - `playing` → `won` (5 words solved)
  - `playing` → `lost` (time expires)
  - State persists until player navigates away
- [ ] Difficulty levels:
  - **Easy:** 5 anagrams, 3-5 letter words, 20s per word
  - **Medium:** 5 anagrams, 5-7 letter words, 20s per word
  - **Hard:** 5 anagrams, 8+ letter words, 20s per word
- [ ] Word source:
  - Extract words from TRIVIA_QUESTION_BANK answers
  - Filter by length (3-5 easy, 5-7 medium, 8+ hard)
  - Shuffle 5 unique words per game
  - Generate anagrams (scramble letter order)
- [ ] Anagram generation:
  - Take word, shuffle letters randomly
  - Ensure scrambled ≠ original (re-shuffle if needed)
  - Display scrambled version as hint
- [ ] Game mechanics:
  - Player types answer in text input
  - Submit via Enter key or Submit button
  - Case-insensitive comparison
  - If correct: +points, advance to next word
  - If wrong: lose 1 attempt, can retry (same word)
  - Max 3 wrong guesses per word before auto-advance
  - Visual feedback: green (correct), red (wrong), gray (attempts left)
- [ ] Scoring:
  - Base: 10 pts per correct word
  - Time bonus: (time_remaining / 20) × 10
  - Difficulty multiplier: 1× (easy), 1.5× (medium), 2× (hard)
  - Formula: 10 × (time_remaining / 20) × diffMultiplier
  - Examples:
    - Easy, 15s remaining: 10 × (15/20) × 1 = 7.5 ≈ 8 pts
    - Medium, 10s remaining: 10 × (10/20) × 1.5 = 7.5 ≈ 8 pts
    - Hard, 5s remaining: 10 × (5/20) × 2 = 5 pts
- [ ] Timer:
  - 20 seconds per word (fixed)
  - 5 words × 20s = 100s total game time
  - Auto-advance on timeout
  - Display countdown (color changes: green → yellow → red)
- [ ] Game end:
  - Save stats: { gameId: 'scramble', score, difficulty, words_correct, total_words, time_used, won }
  - Return to Trivia panel

**Implementation Notes:**
- Word state: `{ id, original, scrambled, guesses: [], attempts: 0, correct: false, timeTaken: 0 }`
- Anagram algorithm: Fisher-Yates shuffle until ≠ original
- Accept word even if only first attempt is correct
- Track wrong guesses for UX feedback but don't penalize score (time penalty is enough)

---

### Task 4.2: Word Scramble UI & Animations [2 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Game board layout:
  - Header: Game title, difficulty badge, timer, score
  - Center: Scrambled word display (large, monospace)
  - Input field: Text input for answer
  - Buttons: Submit, Hint, Skip (grayed out if no boosts)
  - Progress: "Word 2/5" counter
  - Wrong attempts display: X/3 attempts left
- [ ] Scrambled word display:
  - Font size: 2em, monospace (courier or similar)
  - Letter spacing: 8px (easy to read scrambled)
  - Color: #94A3B8 (unsubmitted), #10B981 (correct), #EF4444 (wrong)
  - Animation: Slight wiggle on shake (wrong answer)
- [ ] Input field:
  - Placeholder: "Type the word here..."
  - Large text (1.1em)
  - Focus highlight: Blue border
  - Caps lock indicator: Optional, "CAPS LOCK ON" warning
  - Responsive: Full width on mobile
- [ ] Submit button:
  - Active: Blue (#0EA5E9) when input has text
  - Disabled: Gray (#64748B) when input empty
  - Enter key: Auto-submit (same as clicking Submit)
  - Feedback: Green flash on correct, red flash on wrong
- [ ] Difficulty indicator:
  - Easy: 🟢, Medium: 🟡, Hard: 🔴
  - Show multiplier: "🟡 Medium (1.5×)"
- [ ] Progress display:
  - "Word 2/5" in header
  - Visual bar: 2 filled, 3 empty circles
  - Updates on word completion
- [ ] Attempts display:
  - "❌ ❌ ○" (filled = used, empty = remaining)
  - Updates on each wrong guess
  - Full (❌ ❌ ❌) triggers auto-advance
- [ ] Keyboard support:
  - Enter key: Submit answer
  - Escape key: Clear input
  - Tab: Jump to Submit button (if needed)
- [ ] Animations:
  - Correct answer: Input turns green, shake animation (success)
  - Wrong answer: Input turns red, shake animation (error), 300ms
  - New word load: Fade in scrambled word (0.3s)
  - Word reveal: Show original word after correct (0.5s delay)
- [ ] Mobile optimization:
  - <480px: Stack layout (word, input, buttons vertical)
  - Larger touch targets (48px button height)
  - Keyboard doesn't cover input on focus
  - Full-width input field

**Design Notes:**
```
┌──────────────────────────────┐
│ 🎲 Word Scramble 🟡(1.5×)   │
│              ⏱ 0:15         │
│            Score: 45        │
├──────────────────────────────┤
│                              │
│        S  C  R  M  B  L  E   │
│                              │
│  Word 2/5                    │
│  Attempts: ❌ ❌ ○           │
│                              │
│  ┌──────────────────────┐    │
│  │ Type the word here   │    │
│  └──────────────────────┘    │
│                              │
│  [Submit]  [Hint]  [Skip]    │
└──────────────────────────────┘
```

---

### Task 4.3: Anagram Generation & Word Source [1.5 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Word extraction:
  - Extract from TRIVIA_QUESTION_BANK (use `q.correct` answers)
  - Filter by length: Easy (3-5 chars), Medium (5-7), Hard (8+)
  - Remove duplicates
  - Select 5 random unique words per game
- [ ] Anagram algorithm:
  - Fisher-Yates shuffle (in-place random permutation)
  - Ensure scrambled ≠ original (re-shuffle if needed)
  - Maximum 3 re-shuffles to avoid infinite loop
  - Return scrambled string with letter spacing for display
- [ ] Word validation:
  - Case-insensitive matching (convert both to lowercase)
  - Trim whitespace (user input may have leading/trailing)
  - Accept partial matches? NO—must match exactly
  - No typo tolerance (no spell-check)
- [ ] Hint system (for Task 4.4):
  - Hint: Reveal first letter + length hint ("S______ (7 letters)")
  - Consume Hint boost if used
  - Can use hint on any word (not just first)
- [ ] Skip system:
  - Skip: Auto-mark correct, give partial points (50% of base)
  - Consume Skip boost
  - Mark word as "skipped" (different visual)
  - Award: 10 × 0.5 × diffMultiplier = 5-10 pts

**Implementation Notes:**
- Anagram: `function scrambleWord(word) { ... return shuffled.join(' '); }`
- Word source: Pre-filter on game init to avoid frame drops
- Accept only exact matches (no fuzzy matching)

---

### Task 4.4: Difficulty Selection & Boost Modal [1.5 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Difficulty selection modal (same as Memory):
  - Easy, Medium, Hard options
  - Display: word count, word length range, time per word
  - Example: "5 words • 3-5 letters • 20s each"
- [ ] Boost modal (reuse from Memory/Quick-Fire):
  - Three boosts: Hint, Double Points, Skip
  - Same layout and styling
  - Skip effect: Auto-mark as correct (50% pts)
  - Hint effect: Reveal first letter
  - Double Points: 2× all scores
- [ ] Selection flow:
  - User clicks Play on Scramble card → difficulty selector
  - Select difficulty → boost modal
  - Select/skip boost → game starts
  - Cancel returns to Trivia

---

### Task 4.5: Leaderboard & Results Screen [2 days]
**Owner:** Data/UI  
**Acceptance Criteria:**

- [ ] Leaderboard infrastructure:
  - Same schema as Memory: top 5 per difficulty
  - Store in `state.games.stats.scramble.leaderboard`
  - Track: score, difficulty, date, won, combo
- [ ] Personal best display:
  - Show on Scramble card: "Best: X pts"
  - Show in results screen
  - Update if beaten
- [ ] Results screen:
  - Final score (large)
  - Words correct / total
  - Time used (MM:SS)
  - Difficulty badge (color-coded)
  - Boost summary (if used)
  - Leaderboard preview (top 3)
  - "🏆 New Personal Best!" if beaten
  - Action buttons: Play Again, Try Different Difficulty, Back to Trivia

---

### Task 4.6: Seasonal Content Stub [1 day]
**Owner:** UI/Theme  
**Acceptance Criteria:**

- [ ] Seasonal stub (skeleton, no actual theme swaps yet):
  - Add `state.seasonal = { theme: 'default', lastUpdated: null }`
  - Create seasonal theme selector modal:
    - Spring 🌱, Summer ☀️, Fall 🍂, Winter ❄️
    - Show current season
    - Allow manual override (for testing)
  - CSS var placeholders:
    - `--primary-color`, `--accent-color`, `--bg-color`
    - Initialize with default theme
  - Theme switcher function: `applySeasonalTheme(theme)`
  - Display theme name in settings area (optional)
- [ ] Daily bonus stub:
  - Add `state.games.dailyBonus = { lastClaimedDate: null, streak: 0 }`
  - First game of day (trivia, memory, scramble, or wordle):
    - Award +10 bonus points
    - Show notification: "🎁 Daily bonus: +10 pts!"
  - Track in-game or trivia panel
  - Streak counter: Increments daily, resets after 1 day gap
- [ ] Seasonal theme data (no visual swap yet):
  - Spring: Primary #10B981 (green), Accent #BFDBFE (light blue)
  - Summer: Primary #FBBF24 (gold), Accent #FEF3C7 (light yellow)
  - Fall: Primary #F97316 (orange), Accent #FED7AA (light orange)
  - Winter: Primary #0EA5E9 (blue), Accent #BAE6FD (light blue)

**Implementation Notes:**
- For now, just store theme preference (don't apply CSS yet)
- Seasonal detection: Use `new Date().getMonth()` to auto-detect
  - Spring: 2-4 (Mar-May), Summer: 5-7 (Jun-Aug), Fall: 8-10 (Sep-Nov), Winter: 11,0-1 (Dec-Feb)
- Daily bonus check: Compare `state.date` with `lastClaimedDate`

---

## Testing Checklist

### Unit Tests (Manual)
- [ ] Anagram generation: Word shuffled ≠ original
- [ ] Word comparison: Case-insensitive, trims whitespace
- [ ] Scoring: Easy word 15s = ~8 pts, Hard word 10s = ~10 pts
- [ ] Difficulty levels: Easy 3-5 chars, Medium 5-7, Hard 8+
- [ ] Timer: 20s per word, 5 words = 100s total
- [ ] Wrong attempts: 3 attempts trigger auto-advance
- [ ] Boost effects: Double Points 2×, Skip +5 pts, Hint shows first letter
- [ ] All 5 words completed → game ends, results screen

### Integration Tests
- [ ] Unlock check: Scramble unlocks at 100 correct trivia answers
- [ ] Leaderboard: Top 5 scores per difficulty persist
- [ ] Personal best: Updates card display
- [ ] Quick-Fire, Memory, Wordle unaffected
- [ ] Power-ups work: All 3 boosts functional
- [ ] Daily bonus: +10 pts first game of day

### Regression Tests
- [ ] All 4 games still playable
- [ ] Unlock system works
- [ ] Boost inventory decrements
- [ ] Leaderboards all tracking

---

## Definition of Done

- [ ] All tasks completed and code-reviewed
- [ ] Manual testing checklist passed
- [ ] No console errors or warnings
- [ ] Word Scramble playable end-to-end (all 3 difficulties)
- [ ] Leaderboard persists to localStorage
- [ ] Personal best tracking works
- [ ] Results screen shows all metrics + leaderboard
- [ ] Seasonal theme selector UI present (CSS not applied yet)
- [ ] Daily bonus logic implemented and tested
- [ ] Krish playtests Scramble (feedback collected)
- [ ] No regression in existing features
- [ ] Commit with clear messaging

---

## Blockers & Dependencies

- **Dependency:** TRIVIA_QUESTION_BANK answers must have variety of lengths (✓ available)
- **Dependency:** Boost system working (✓ from Sprint 1-3)
- **Blocker:** None identified

---

## Effort Estimate

- Task 4.1 (Game engine): 3 days
- Task 4.2 (UI & animations): 2 days
- Task 4.3 (Anagrams & word source): 1.5 days
- Task 4.4 (Difficulty + boost modal): 1.5 days
- Task 4.5 (Leaderboard & results): 2 days
- Task 4.6 (Seasonal stub + daily bonus): 1 day
- **Testing & polish: 2-3 days**
- **Total: ~13-14 days (2 weeks) ✓**

---

## Success Criteria (Sprint 4 Exit)

1. Word Scramble game fully playable (all 3 difficulties)
2. Anagrams generated correctly (shuffled, matching works)
3. Scoring includes base + time bonus + difficulty multiplier
4. Leaderboard tracks top 5 scores per difficulty
5. Personal best display works on card + results
6. Game unlocks at 100 correct trivia answers
7. Power-ups work in Scramble (Double Points, Skip, Hint)
8. Post-game results show all metrics + leaderboard preview
9. Seasonal theme selector UI present (CSS stub)
10. Daily bonus logic working (first game = +10 pts)
11. Krish playtests and enjoys Scramble game
12. No regression in 3 existing games (Wordle, Quick-Fire, Memory)

---

**Next Sprint:** Sprint 5 will add Challenge Mode (composite game) + leaderboard UI refinements.

---

## Quick Reference: Game Stats Summary

| Game | Status | Unlock | Difficulty | Scoring | Leaderboard |
|------|--------|--------|------------|---------|-------------|
| Wordle | ✅ Sprint 1 | 5 correct | 1 level | 100/50/0 | No |
| Quick-Fire | ✅ Sprint 2 | 10 + 70% | 1 level | 10×combo×time | No |
| Memory | ✅ Sprint 3 | 50 correct | 3 levels | 50×time×combo | Yes |
| Scramble | 🔨 Sprint 4 | 100 correct | 3 levels | 10×time×diff | Yes |
| Challenge | 📅 Sprint 5 | 200 correct | 3 levels | Composite | Yes |

**Phase 5 Progress: 4/5 games planned, 1/5 remaining** ✅
