# Sprint 2: Quick-Fire Game & Power-Up System — Task Breakdown

**Timeline:** 1 week | **Focus:** Speed-based trivia with combo multipliers + power-up spending  
**Owner:** Krish's Daily Tasks Team  
**Status:** Ready to start

---

## Deliverables (MVP)

1. Quick-Fire game engine (10 random Qs, 15 sec each, combo multiplier)
2. Scoring system (base × combo × time_bonus)
3. Power-up spending modal ("Use boost before playing?")
4. Visual feedback (timer, combo counter, score accumulation)
5. Post-game results screen (score, accuracy, personal best)
6. Persist game stats (plays, wins, best score)

---

## Task Breakdown

### Task 2.1: Quick-Fire Game Engine [3 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Game state machine:
  - `playing` → `won` (10 questions answered)
  - `playing` → `lost` (timeout, user quits)
  - State persists until player navigates away
- [ ] Question selection:
  - Pick 10 random questions from TRIVIA_QUESTION_BANK
  - Exclude recently answered questions (from exclusion list)
  - Pull from current difficulty mode (rookie/pro/legend)
- [ ] Timer logic:
  - 15 seconds per question (countdown)
  - When timer hits 0: auto-advance to next question (mark as skipped/wrong)
  - Display remaining time with visual indicator
- [ ] Combo system:
  - Start combo at 1×
  - After 3 correct in a row: 2× multiplier (visual feedback "🔥 Combo!")
  - After 5 correct in a row: 3× multiplier
  - Reset combo to 1× if wrong answer
  - Display combo counter prominently
- [ ] Scoring formula:
  - Base: 10 pts per correct answer
  - Combo bonus: × combo_multiplier (1x, 2x, or 3x)
  - Time bonus: (time_remaining / 15) × base (partial credit for fast answers)
  - Total: 10 × combo × (time_remaining / 15)
  - Examples:
    - Correct in 10s, no combo: 10 × 1 × (10/15) = 6.67 ≈ 7 pts
    - Correct in 5s, 2× combo: 10 × 2 × (5/15) = 6.67 ≈ 7 pts
    - Correct in 1s, 3× combo: 10 × 3 × (1/15) = 2 pts
- [ ] Answer submission:
  - Player selects answer (A/B/C/D buttons or tap)
  - If correct: add to score, increment streak, advance to next Q
  - If wrong: reset combo, advance to next Q
  - Visual feedback: green highlight (correct), red highlight (wrong)
- [ ] Game end:
  - Save game result: { gameId: 'quickfire', score, plays, won, accuracy, timestamp }
  - Return to Trivia panel (don't close tab)

**Implementation Notes:**
- Reuse TRIVIA_QUESTION_BANK and question display logic from main trivia
- Timer runs via `setInterval()`, check every 100ms
- Combo system: track consecutive correct answers in game state
- Score calculation: round down to nearest integer

---

### Task 2.2: Power-Up Spending Modal [2 days]
**Owner:** UI/UX + Logic  
**Acceptance Criteria:**

- [ ] Modal appears **before game starts**:
  - Trigger: User clicks "Play" on Quick-Fire card
  - Title: "⚡ Quick-Fire — Use a Power-up?"
  - Show available boosts from `state.boosts`
  - "Play Now" (no boost), "Skip" (dismiss)
- [ ] Power-up selection UI:
  - Display only power-ups with count > 0
  - Format: `[Icon] Name (count) — Effect`
  - Examples:
    ```
    💡 Hint (3) — Reveal 1 incorrect answer
    ⏱️ Extra Time (0) — +10 seconds per question (grayed out)
    2️⃣ Double Points (1) — 2× your score (grayed out if 0)
    ⏭️ Skip (1) — Auto-correct on 1 question
    ```
  - Clicking a power-up highlights it (border, bg color change)
  - Show effect description below
- [ ] Selection validation:
  - If count = 0: disable (grayed out, no click)
  - If count > 0: enable, selectable
  - Only 1 power-up per game
- [ ] Confirmation:
  - "Play with [Power-up Name]" button (blue, enabled if selected)
  - "Play without boost" button (gray, always enabled)
  - Both trigger game start
- [ ] State update on confirm:
  - Deduct 1 from `state.boosts[selectedPowerup]`
  - Pass `{ selectedBoost: 'skip', ... }` to game state
  - **Do NOT save state yet** (save only on game end)
- [ ] Styling:
  - Modal: 500px wide, centered
  - Buttons: 100px × 50px each
  - Power-up items: flex row, border, padding 10px
  - Selected: blue border (#0EA5E9), light blue bg (#EEF2FF)
  - Disabled: gray, opacity 0.5, cursor: not-allowed

**Implementation Notes:**
- Call modal before `startQuickFireGame()`
- Modal should block further interaction until dismissed
- Z-index: 10000 (above game modal)

---

### Task 2.3: Quick-Fire UI & Visuals [2 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Game board layout:
  - Header: Game name, timer (large), combo counter
  - Center: Question + 4 answer buttons
  - Footer: Current score, progress (X/10 answered)
  - Mobile-optimized: full width, vertical stacking
- [ ] Timer display:
  - Format: "0:15" → "0:00" (MM:SS)
  - Color change as time runs out:
    - 0-5s: green
    - 5-10s: yellow
    - 10-15s: gray
  - Animated countdown (visual ease)
- [ ] Combo counter:
  - Display: "🔥 Combo: 3×"
  - Show only when combo > 1
  - Animate on increase (pop effect, +0.2s scale)
- [ ] Answer buttons:
  - 4 buttons (A/B/C/D)
  - On click: lock, highlight (green/red), wait 500ms, auto-advance
  - Disabled during transition
  - Cursor: pointer (unlocked), not-allowed (locked)
- [ ] Score display:
  - "Score: 157 pts" (top-right)
  - Increment animates (+10 pts pop)
  - Running total updates in real-time
- [ ] Progress bar:
  - "Question 7/10"
  - Visual bar below: 7 filled, 3 empty circles
- [ ] Post-game results:
  - Large score display: "Final Score: 287 pts"
  - Accuracy: "Accuracy: 70%"
  - Personal best: "Best: 350 pts"
  - Combo achieved: "Max Combo: 3×"
  - Time played: "Time: 2:34"
  - Buttons: "Play Again", "Back to Trivia"
- [ ] Animations:
  - Question fade-in on display (0.3s)
  - Answer highlight on select (0.2s)
  - Score pop (+points, 0.5s scale)

**Design Notes:**
```
┌─────────────────────────────┐
│ ⚡ Quick-Fire    ⏱ 0:12      │
│                  🔥 3×      │
├─────────────────────────────┤
│ Which planet is largest?    │
│ ⊙ A) Mercury               │
│ ⊙ B) Venus                 │
│ ⊙ C) Jupiter  ← SELECTED   │
│ ⊙ D) Saturn                │
├─────────────────────────────┤
│ Score: 156 pts  7/10 ●●●●●●●○○
└─────────────────────────────┘
```

---

### Task 2.4: Power-Up Effects Implementation [2 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Effect: **Skip** (auto-correct 1 question)
  - Before game start: user selects "Skip"
  - During game: first time user submits answer, mark as correct regardless
  - Visual: "Skipped with ⏭️ boost" (green, +points)
  - One-time use per game
- [ ] Effect: **Hint** (reveal 1 wrong answer)
  - Before game start: user selects "Hint"
  - During question: gray out 1 wrong answer
  - Visual: "1 incorrect answer hidden" (in question area)
  - One-time use per game
- [ ] Effect: **Double Points** (2× score multiplier)
  - Before game start: user selects "Double Points"
  - During game: all points × 2
  - Scoring formula: 10 × combo × (time_remaining / 15) × 2
  - Visual: "2x multiplier active" (gold accent)
  - Applies to entire game
- [ ] Effect: **Extra Time** (not for Quick-Fire, defer to Sprint 3)
  - For now: disable in Quick-Fire modal
  - Reserve for Memory Tiles game
- [ ] Effect: **Combo Freeze** (not for Quick-Fire, defer to Sprint 3)
  - For now: disable in Quick-Fire modal
  - Reserve for Challenge Mode

- [ ] Game state tracking:
  - `{ selectedBoost, boostUsed, boostEffect }`
  - Pass through game lifecycle
  - Verify effect applies before final save

**Implementation Notes:**
- Skip: check `game.selectedBoost === 'skip' && !game.boostUsed` on first answer
- Hint: add flag `game.hintRevealed`, show grayed answer in UI
- Double Points: apply in scoring function: `pts * (selectedBoost === 'double_points' ? 2 : 1)`

---

## Testing Checklist

### Unit Tests (Manual)
- [ ] Play Quick-Fire, answer 10 Qs correctly → score calculated (10 pts base, +time bonus, +combo)
- [ ] Get 3 in a row → see "🔥 Combo!" and 2× display
- [ ] Get 5 in a row → see 3× multiplier
- [ ] Wrong answer → combo resets to 1×
- [ ] Answer in <5 seconds → higher score than in >10 seconds
- [ ] Reach 10 questions → game ends, results screen appears
- [ ] Don't answer, wait 15s → auto-advance to next question (marked wrong, combo resets)

### Power-Up Tests
- [ ] Open Quick-Fire → modal appears with available boosts
- [ ] Boost count = 0 → button grayed out
- [ ] Select "Skip" → 1st answer auto-correct, deduct 1 from state.boosts.skip
- [ ] Select "Hint" → 1 wrong answer hidden during first question
- [ ] Select "Double Points" → final score × 2
- [ ] Play without boost → no deduction, no effect

### Integration Tests
- [ ] Trivia streak unaffected by Quick-Fire plays
- [ ] Quick-Fire stats saved: plays, wins, best score
- [ ] Unlock check: Quick-Fire appears as "Unlocked" after meeting criteria
- [ ] Post-game: clicking "Back to Trivia" returns to trivia panel
- [ ] Post-game: clicking "Play Again" launches new game
- [ ] Mobile: timer readable, buttons tappable, score visible

### Regression Tests
- [ ] Wordle still works
- [ ] Main trivia unaffected
- [ ] Unlock toasts still appear
- [ ] Boost bar display still shows updated counts (after spending)

---

## Definition of Done

- [ ] All tasks completed and code-reviewed
- [ ] Manual testing checklist passed (tablet + mobile)
- [ ] No console errors or warnings
- [ ] Power-up spending deducts correctly from state
- [ ] Quick-Fire scores persist to state.games.stats['quickfire']
- [ ] Post-game results screen displays all metrics
- [ ] Krish playtests Quick-Fire and gives feedback
- [ ] Commit with clear messaging

---

## Blockers & Dependencies

- **Dependency:** TRIVIA_QUESTION_BANK must support filtering by difficulty (✓ already exists)
- **Dependency:** Boost system must be persisted in state (✓ from Sprint 1)
- **Blocker:** None identified

---

## Effort Estimate

- Task 2.1 (Quick-Fire engine): 3 days
- Task 2.2 (Power-up modal): 2 days
- Task 2.3 (UI & visuals): 2 days
- Task 2.4 (Power-up effects): 2 days
- **Testing & polish: 1-2 days**
- **Total: ~7 days (1 week) ✓**

---

## Success Criteria (Sprint 2 Exit)

1. Quick-Fire game is fully playable end-to-end
2. Combo system works (1x → 2x → 3x multiplier)
3. Scoring formula includes base × combo × time_bonus
4. Power-up modal appears before game start
5. At least 2 power-ups work correctly (Skip + Hint)
6. Game stats persist (plays, wins, best score)
7. Post-game results show all metrics
8. Krish playtests and enjoys Quick-Fire (feedback collected)
9. No regression in existing features (Wordle, trivia, unlocks)

---

**Next Sprint:** Sprint 3 will add Memory Tiles game + leaderboard infrastructure.
