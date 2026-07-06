# Sprint 3: Memory Tiles Game & Leaderboard — Task Breakdown

**Timeline:** 1.5 weeks | **Focus:** Tile-matching game with 3 difficulty levels + score tracking  
**Owner:** Krish's Daily Tasks Team  
**Status:** Ready to start

---

## Deliverables (MVP)

1. Memory Tiles game engine (3 difficulty levels)
2. Tile flip mechanics with visual feedback
3. Scoring system (base + time bonus)
4. Difficulty selection UI
5. Leaderboard infrastructure (local high scores per difficulty)
6. Post-game results with personal best tracking

---

## Task Breakdown

### Task 3.1: Memory Game Engine [3 days]
**Owner:** Game Logic  
**Acceptance Criteria:**

- [ ] Game state machine:
  - `setup` → `playing` (difficulty selected)
  - `playing` → `won` (all pairs matched)
  - `playing` → `lost` (time expires)
  - State persists until player navigates away
- [ ] Difficulty levels:
  - **Easy:** 8 tiles (4 pairs, 6×2 grid OR 4×2 grid)
  - **Medium:** 12 tiles (6 pairs, 4×3 grid)
  - **Hard:** 16 tiles (8 pairs, 4×4 grid)
- [ ] Tile generation:
  - Use random question/answer pairs from TRIVIA_QUESTION_BANK
  - Each pair appears twice (one is question, one is matching answer)
  - Shuffle tiles randomly each game
  - Example pair: "Capital of France" ↔ "Paris"
- [ ] Game mechanics:
  - Click tile → flip to reveal (0.3s animation)
  - Click second tile → check if match
  - Match found: tiles stay flipped, score +50 points
  - No match: both tiles flip back after 1s, combo resets
  - Can't click already-matched tiles
  - Can't click more than 2 tiles per turn
- [ ] Matching logic:
  - Compare question text with answer text (case-insensitive)
  - Mark matched pairs with `matched: true` flag
  - Track attempts count (each 2-tile flip = 1 attempt)
- [ ] Scoring:
  - Base: 50 pts per correct match
  - Time bonus: (time_remaining / total_time) × 50
  - Combo: After 3 consecutive matches, 1.5× multiplier (not 2× like Quick-Fire)
  - Formula: 50 × (time_remaining / total_time) × comboMultiplier
  - Examples:
    - Match in 30s of 120s, no combo: 50 × (90/120) = 37 pts
    - Match in 10s, 3× combo: 50 × (110/120) × 1.5 ≈ 68 pts
- [ ] Timer:
  - Easy: 120 seconds (2 min)
  - Medium: 180 seconds (3 min)
  - Hard: 240 seconds (4 min)
  - Auto-end game on timeout
  - Display countdown in game
- [ ] Game end:
  - Save stats: { gameId: 'memory', score, difficulty, pairs_matched, total_pairs, time_used, won }
  - Return to Trivia panel

**Implementation Notes:**
- Tile state: `{ id, question, answer, flipped, matched, pairId }`
- Matched pairs share same `pairId` (e.g., pairId: 1)
- Don't flip tiles back if both are already matched
- Combo resets on mismatch (not timeout)

---

### Task 3.2: Tile Flip Animation & UI [2 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Tile display:
  - Tiles: 60×60px (easy), 50×50px (medium/hard) to fit grid
  - Unflipped: dark gray background (#475569), shows question mark (?)
  - Flipped: shows text (question or answer), white background
  - Matched: light green background (#DCFCE7), faded text
  - Hover (unflipped): slightly lighter, cursor: pointer
  - Hover (matched): cursor: default
- [ ] Flip animation:
  - Click → 0.3s scale-y transform (flip effect)
  - Rotate Y: 0° → 90° → 180°
  - Text appears at 90° (hidden during flip)
  - Smooth easing: cubic-bezier(0.68, -0.55, 0.265, 1.55) (bounce)
- [ ] Grid layout:
  - Easy (4×2): 2 columns, 4 rows, centered
  - Medium (4×3): 4 columns, 3 rows
  - Hard (4×4): 4 columns, 4 rows
  - Responsive: adjust tile size on mobile (<480px)
- [ ] Game header:
  - Title: "🧠 Memory Tiles [Easy/Medium/Hard]"
  - Timer: Large countdown (MM:SS)
  - Score: Real-time pts display
  - Attempts counter: "Attempts: 3/8"
- [ ] Game footer:
  - Quit button
  - Stats: Pairs matched X/Y
  - Combo display (only when > 1): "🔥 1.5× Combo"
- [ ] Matched pair feedback:
  - Both tiles turn light green (#DCFCE7)
  - Text remains visible but grayed (#94A3B8)
  - +50 pts animation (pop, fade out)
- [ ] Mismatch feedback:
  - Flash red highlight (#EF4444) for 200ms
  - Both tiles flip back after 1s
  - Combo resets to 1×
- [ ] Mobile optimization:
  - <480px: single-column grid (stack tiles)
  - Reduce tile size (40×40px)
  - Increase touch target padding (8px)

**Design Notes:**
```
Easy Grid (4×2):
┌─────────────────┐
│  ?    ?    ?    ?│
│  ?    ?    ?    ?│
│                 │
│   ⏱ 2:00        │
│ Score: 250 pts  │
│Attempts: 3/4    │
└─────────────────┘

Hard Grid (4×4):
┌──────────────────────┐
│ ? ? ? ?              │
│ ? ? ? ?              │
│ ? ? ? ?              │
│ ? ? ? ?              │
│                      │
│ ⏱ 3:45  Score: 400   │
│ Matched: 5/8   🔥 1.5×
└──────────────────────┘
```

---

### Task 3.3: Difficulty Selection & Boost Modal [1.5 days]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Difficulty selector modal:
  - Title: "🧠 Memory Tiles — Select Difficulty"
  - Three buttons: Easy, Medium, Hard
  - Display grid preview (small tiles)
  - Show time limit for each: "2 min", "3 min", "4 min"
  - Show tile count: "8 tiles (4 pairs)", etc.
- [ ] Reuse boost modal from Quick-Fire:
  - Same three boosts: Hint, Double Points, Skip
  - Disabled: Extra Time (for Sprint 4)
  - Button text: "Play with [boost]"
- [ ] Selection flow:
  - User clicks difficulty → shows boost modal
  - User selects boost (or plays without) → game starts
  - Cancel button on both modals returns to Trivia panel

**Implementation Notes:**
- Create `selectMemoryDifficulty(level)` function
- Store selected difficulty in game state
- Pass difficulty to boost modal context

---

### Task 3.4: Leaderboard Infrastructure [2 days]
**Owner:** Data/UI  
**Acceptance Criteria:**

- [ ] Local high scores tracking:
  - Store in `state.games.stats.memory.leaderboard`
  - Schema: `{ difficulty: 'easy'|'medium'|'hard', score, date, won }`
  - Keep top 5 scores per difficulty
  - Sort by score (descending)
- [ ] Personal best display:
  - Show on Memory card in Trivia panel: "Best: 450 pts (Medium)"
  - Show in results screen: "Personal Best: 450 pts"
  - Update after each game if beat previous
- [ ] Results screen enhancements:
  - "Your Best: 450 pts" (if beaten)
  - "Personal Record!" (celebration if new best)
  - Leaderboard preview (top 3 scores for that difficulty)
- [ ] Stats persistence:
  - Save leaderboard to localStorage
  - Migrate on app load
  - Include: score, difficulty, date, won flag
- [ ] Display leaderboard in game modal (optional, Task 3.5):
  - Small leaderboard widget in results screen
  - Shows top 3 scores for that difficulty
  - Format: "🥇 450 pts (3 days ago)", etc.

**Implementation Notes:**
- When game ends, check if score > current personal best
- If yes, update `state.games.stats.memory.leaderboard`
- Keep array sorted and sliced to top 5
- Format dates relative to today ("today", "3 days ago", etc.)

---

### Task 3.5: Post-Game Results & Personal Best [1 day]
**Owner:** UI/UX  
**Acceptance Criteria:**

- [ ] Results screen layout:
  - Large emoji (🎉 if won, 🧠 if timeout)
  - Final score (large)
  - Accuracy: "Pairs matched: 5/6" with progress bar
  - Time taken: "2m 45s"
  - Max combo achieved (if > 1)
  - Difficulty badge: "🟢 Easy" / "🟡 Medium" / "🔴 Hard"
- [ ] Personal best section:
  - Shows if this is new best: "🏆 New Personal Best! 450 pts"
  - Shows current best: "Your Best: 400 pts"
  - Show previous best in leaderboard preview
- [ ] Leaderboard preview:
  - "Top Scores (Easy)" header
  - List top 3 scores:
    - "🥇 450 pts — You (today)"
    - "🥈 420 pts — 2 days ago"
    - "🥉 380 pts — 1 week ago"
- [ ] Action buttons:
  - "Play Again" (same difficulty)
  - "Try Different Difficulty"
  - "Back to Trivia"

---

## Testing Checklist

### Unit Tests (Manual)
- [ ] Flip tile → shows text (0.3s animation smooth)
- [ ] Click two non-matching tiles → both flip back after 1s
- [ ] Click two matching tiles → stay flipped, green highlight
- [ ] Get 3 matches in a row → see "🔥 1.5× Combo"
- [ ] Score calculation: match in 30s of 120s = ~37 pts (without combo)
- [ ] Easy: 8 tiles, 120s timer, 4 pairs
- [ ] Medium: 12 tiles, 180s timer, 6 pairs
- [ ] Hard: 16 tiles, 240s timer, 8 pairs
- [ ] Reach all pairs matched → game ends, results screen
- [ ] Hit timer → game ends, results screen
- [ ] Beat personal best → see "🏆 New Personal Best!"

### Integration Tests
- [ ] Unlock check: Memory unlocks at 50 correct trivia answers
- [ ] Memory card shows in Trivia panel: "Best: X pts (Difficulty)"
- [ ] Quick-Fire still works (no regression)
- [ ] Wordle still works (no regression)
- [ ] Power-ups work: Double Points, Skip, Hint in Memory
- [ ] Boost inventory decrements correctly
- [ ] Stats save to localStorage
- [ ] Reload page → leaderboard persists

### Regression Tests
- [ ] Trivia flow unaffected
- [ ] Unlock toasts still appear
- [ ] Unlock modal still works
- [ ] Power-up modal appears before game
- [ ] Results screens all display correctly

---

## Definition of Done

- [ ] All tasks completed and code-reviewed
- [ ] Manual testing checklist passed
- [ ] No console errors or warnings
- [ ] Leaderboard persists to localStorage
- [ ] Personal best tracking works correctly
- [ ] Memory Tiles playable end-to-end
- [ ] Results screen shows all metrics
- [ ] Krish playtests Memory game (feedback collected)
- [ ] No regression in existing features
- [ ] Commit with clear messaging

---

## Blockers & Dependencies

- **Dependency:** TRIVIA_QUESTION_BANK must support extracting Q&A pairs (✓ available)
- **Dependency:** Boost system working (✓ from Sprint 1-2)
- **Blocker:** None identified

---

## Effort Estimate

- Task 3.1 (Memory engine): 3 days
- Task 3.2 (Tile flip UI): 2 days
- Task 3.3 (Difficulty + boost modal): 1.5 days
- Task 3.4 (Leaderboard): 2 days
- Task 3.5 (Results screen): 1 day
- **Testing & polish: 2 days**
- **Total: ~11 days (1.5 weeks) ✓**

---

## Success Criteria (Sprint 3 Exit)

1. Memory Tiles game fully playable (all 3 difficulties)
2. Tile flip animations smooth (0.3s)
3. Scoring includes base + time bonus + combo
4. Leaderboard tracks top 5 scores per difficulty
5. Personal best display works on card + results
6. Game unlocks at 50 correct trivia answers
7. Power-ups work in Memory (Double Points, Skip, Hint)
8. Post-game results show all metrics + leaderboard preview
9. Krish playtests and enjoys Memory game
10. No regression in Quick-Fire, Wordle, or Trivia

---

**Next Sprint:** Sprint 4 will add Word Scramble game + Seasonal content stub.
