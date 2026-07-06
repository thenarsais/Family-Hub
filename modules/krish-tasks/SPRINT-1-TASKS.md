# Sprint 1: Unlock System & Wordle Variant — Task Breakdown

**Timeline:** 1.5 weeks | **Focus:** Foundation for all Phase 5 games  
**Owner:** Krish's Daily Tasks Team  
**Status:** Ready to start

---

## Deliverables (MVP)
1. Unlock checker architecture (runs after each trivia answer)
2. Wordle variant game (category guessing, 6 tries, standard feedback)
3. Unlock toast notifications (when milestones hit)
4. "Games" tab skeleton in activity board (shows locked/unlocked status)
5. Boost points currency UI stub (display only, no spending yet)

---

## Task Breakdown

### Task 1.1: Unlock System Architecture [3 days]
**Owner:** Backend Logic  
**Acceptance Criteria:**
- [ ] Add `state.games.unlocked` array to localStorage schema
- [ ] Add `state.games.stats` object (per-game play data)
- [ ] Implement `checkGameUnlocks()` function:
  - Runs after each trivia answer submission
  - Checks all unlock criteria (correct count, accuracy, badge thresholds)
  - Returns array of newly unlocked games
  - Saves state + triggers notification
- [ ] Add `getGameUnlockProgress(gameId)` → returns `{ current, threshold, pct }`
- [ ] Code review: Ensure unlock checker doesn't block trivia flow

**Implementation Notes:**
```javascript
// Example: After user answers a trivia question
if (userAnsweredCorrectly) {
  points += basePoints;
  const newUnlocks = checkGameUnlocks(); // ← New function
  if (newUnlocks.length > 0) {
    newUnlocks.forEach(game => showUnlockToast(game));
  }
  saveState();
}
```

---

### Task 1.2: Wordle Variant Logic [4 days]
**Owner:** Game Engine  
**Acceptance Criteria:**
- [ ] Wordle engine implemented:
  - Takes category list from TRIVIA_QUESTION_BANK
  - Selects random category (must be 5 letters; backfill if needed)
  - Validates guesses against category list
  - Returns feedback: `{ guesses: [ { word, feedback: [letter, color] } ] }`
- [ ] Feedback logic:
  - Green: correct letter, correct position
  - Yellow: correct letter, wrong position
  - Gray: not in category name
- [ ] Game state machine:
  - `playing` → `won` (6 guesses or fewer)
  - `playing` → `lost` (7th incorrect guess)
  - Cannot submit without 5 letters
- [ ] Scoring: 100 pts (≤3 guesses), 50 pts (4-6), 0 pts (lose)
- [ ] Persist game result: `{ gameId, score, categoryName, guesses, won, playedAt }`

**Implementation Notes:**
- Categories with 5 letters in TRIVIA_QUESTION_BANK: Science, History, Sports, Nature, Animals (+ others)
- Backfill: If < 5 unique categories, use generic words (HAPPY, BRAIN, EARTH)
- Each category can be guessed multiple times (reset on win/lose)

---

### Task 1.3: Unlock Toast Notifications [2 days]
**Owner:** UI/UX  
**Acceptance Criteria:**
- [ ] Toast component styled:
  - 320px wide, 120px tall (mobile-safe)
  - Bottom-center position, 12px margin from bottom
  - Slide-in animation (ease-out, 0.3s)
  - Auto-dismiss after 4 seconds
  - Z-index: 1000 (above all game content)
- [ ] Content layout:
  ```
  🎉 You've unlocked QUICK-FIRE!
     You've answered 10 trivia questions correctly.
     Speed matters! Get 3 in a row for a 2x score combo.
     [Play Now] [Later]
  ```
- [ ] Buttons:
  - "Play Now" → Close toast, load game, show game modal
  - "Later" → Close toast, stay on current screen
- [ ] Color scheme:
  - Unlock milestone level (Bronze = 🥉, Silver = 🥈, etc.)
  - Background: semi-transparent dark + colored border
- [ ] Multiple toasts: Queue if 2+ unlocks at once; stagger by 400ms

**Design Notes:**
```css
.unlock-toast {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%) translateY(120px);
  width: 320px;
  background: rgba(0, 0, 0, 0.9);
  border-left: 4px solid var(--accent);
  border-radius: 12px;
  padding: 16px;
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateX(-50%) translateY(120px); }
  to { transform: translateX(-50%) translateY(0); }
}
```

---

### Task 1.4: "Games" Tab UI Skeleton [3 days]
**Owner:** UI/UX  
**Acceptance Criteria:**
- [ ] Add "Games" (🎮) icon to tab bar (between Trivia & Habits or at end)
- [ ] Create `#view-games` section in HTML:
  - Header: "🎮 Games" with subtitle "Unlock new challenges"
  - Grid: 2x2 (4 game cards visible)
  - Game card components (locked/unlocked state)
- [ ] Each game card shows:
  - Game name + emoji (Wordle = 🎯, Quick-Fire = ⚡, Memory = 🧠, Scramble = 🔤)
  - Locked/Unlocked status (🔒 vs 🎮)
  - Progress bar if locked (current / threshold)
  - "Play" button if unlocked, "Unlock requirements" if locked
  - Personal best score (if played)
- [ ] Locked card styling:
  - Grayed out background, reduced opacity (0.6)
  - Tooltip on hover: "Earn 10 correct trivia answers to unlock"
- [ ] Responsive: Stack to 1 column on mobile (<480px)

**Sample Card (Unlocked):**
```
┌─────────────────────────┐
│ 🎯 Fact or Fiction      │
│                         │
│ Best: 250 pts           │
│ Played: 5 times         │
│        [Play]           │
└─────────────────────────┘
```

**Sample Card (Locked):**
```
┌─────────────────────────┐
│ 🔒 ⚡ Quick-Fire        │
│                         │
│ Unlock: 10 correct Q's  │
│ Progress: ▓▓░░░░░░░░ 3/10
│      [Unlock required]  │
└─────────────────────────┘
```

---

### Task 1.5: Boost Points UI Stub [1 day]
**Owner:** UI/UX  
**Acceptance Criteria:**
- [ ] Add boost points display to trivia panel:
  - Location: Top-right corner of trivia-options (where difficulty selector is)
  - Format: Icon + count (e.g., "⭐ 5 boosts")
  - Show 3-4 active power-up types (from `state.boosts`)
  - No click handler yet (grey out as "Coming soon")
- [ ] State structure:
  ```javascript
  state.boosts = {
    double_points: 2,
    skip: 1,
    extra_time: 0,
    hint: 3,
    combo_freeze: 0
  }
  ```
- [ ] Initialize on first load: Give player 1 random boost (flavor text: "Welcome bonus!")
- [ ] Persist to localStorage

**Rendering:**
```html
<div class="trivia-boost-bar">
  <span class="boost-item">2x💰 (2)</span>
  <span class="boost-item">⏭️ (1)</span>
  <span class="boost-item">⏱️ (0)</span>
  <span class="boost-item">💡 (3)</span>
</div>
```

---

## Testing Checklist

### Unit Tests (Manual, on tablet)
- [ ] Play 5 trivia questions → Wordle unlocks (verify toast appears)
- [ ] Get 10 correct + 70% accuracy → Quick-Fire unlocks
- [ ] Unlock toast: Click "Play Now" → Navigate to game, dismiss tab
- [ ] Unlock toast: Click "Later" → Toast closes, stay on trivia
- [ ] Multiple unlocks: Play until 2 games unlock simultaneously → Both toasts queue correctly
- [ ] Reload page → Unlocked games persist in Games tab
- [ ] Games tab shows correct progress bars for locked games
- [ ] Wordle game: Guess category in 3 tries → 100 pts awarded
- [ ] Wordle game: Lose in 7 guesses → 0 pts, can play again

### Integration Tests
- [ ] Trivia streak logic unaffected by unlock system
- [ ] Points earned for trivia independent of game unlocks
- [ ] Badge system still triggers correctly (unlock checker doesn't interfere)
- [ ] Dark mode + high-contrast mode: Games tab readable
- [ ] Mobile (480px viewport): Cards stack correctly, toast visible

---

## Definition of Done
- [ ] All tasks completed and code-reviewed
- [ ] Manual testing checklist passed (tablet testing, mobile testing)
- [ ] No console errors or warnings
- [ ] LocalStorage schema documented in code comments
- [ ] Wordle variant playable end-to-end (ask Krish to try, get feedback)
- [ ] Unlock toast shows for naturally unlocked game (not forced)
- [ ] Push to `main` branch, PR reviewed by 1 peer
- [ ] Krish can access "Games" tab and see Wordle card

---

## Blockers & Dependencies
- **Dependency:** TRIVIA_QUESTION_BANK must have category list (✓ already exists)
- **Dependency:** State management (localStorage schema) must support new fields (✓ flexible)
- **Blocker:** None identified; can start immediately

---

## Effort Estimate
- Task 1.1 (Unlock system): 3 days
- Task 1.2 (Wordle logic): 4 days
- Task 1.3 (Toast notifications): 2 days
- Task 1.4 (Games tab UI): 3 days
- Task 1.5 (Boost UI stub): 1 day
- **Testing + polish: 2 days**
- **Total: ~10-11 days (1.5 weeks) ✓**

---

## Success Criteria (Sprint 1 Exit)
1. Wordle variant is fully playable
2. At least 1 game naturally unlocks when Krish plays trivia
3. Unlock toast displays with correct messaging
4. Games tab is visible and shows game card status (locked/unlocked)
5. Power-up UI displays in trivia panel (not clickable yet)
6. No performance regression in trivia flow
7. Krish playtests and gives 👍 (feedback incorporated in Sprint 2)

---

**Next Sprint:** Sprint 2 will add Quick-Fire game + Power-up spending logic.
