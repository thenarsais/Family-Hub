# Games Review - Gaps & Suggestions

**Status:** Deep Review of Game 1-4 Specifications

---

## GAME 1: WORDLE - Gap Analysis

### What We Locked In ✅
- Category: User pick OR random toggle
- Word length: Random within difficulty range
- Hints: Unlimited with penalty
- Scoring: 50pts base + time remaining bonus + difficulty multiplier
- Replay: Per-difficulty, not repeatable same day/week
- Difficulty adjustment: Yes, suggest after 3+ losses

### Identified Gaps 🔴

**Gap 1: Hint Penalty Amount**
- We said "unlimited hints with penalty" but didn't define penalty
- Example: Is it -5 points per hint? -20 points? -50%?
- **Needs clarification:** What's the penalty formula?

**Gap 2: Time Bonus Calculation**
- Scoring is "50pts + time remaining bonus" but time isn't specified
- Should there be a timer at all? (Wordle traditionally is untimed)
- **Example:** If user solves word in 2 minutes, how much bonus?
- **Needs clarification:** Should Wordle have a timer or be untimed?

**Gap 3: Category Streak Tracking**
- We approved "Category Streak bonus" as quick win
- But didn't define: How many consecutive? What's the bonus?
- **Example:** 3 wins in Food = 1.5x multiplier? Or +50 points?
- **Needs clarification:** Category streak rules?

**Gap 4: Word Bank Size**
- How many words per category? What prevents word repetition?
- If user plays same category 10 times, will words repeat?
- **Needs clarification:** Word bank structure and size?

**Gap 5: 6 Attempts Display**
- Classic Wordle has visual hangman-like display
- Should we show remaining attempts as: [5/6] or ⬜⬜⬜ or something else?
- **Needs clarification:** Visual feedback for attempts remaining?

### Suggestions 💡

**Suggestion 1: Time Bonus Structure**
- Typical approach: 0-2min = full bonus, 2-5min = 50% bonus, 5+min = no bonus
- Example: Solve in 1:30 = +50 points. Solve in 7:00 = +0 points
- Prevents endless play on one word

**Suggestion 2: Hint Penalty Strategy**
- Option A: First hint free, second hint -10 points, third -20 points (escalating)
- Option B: Flat -20 points per hint (simple)
- Option C: Lose 1/X of earned points per hint (scaled to difficulty)
- **My recommendation:** Option A (escalating) - encourages minimal hints

**Suggestion 3: Category Streak System**
- Current spec has streak bonus but no clear details
- Suggested: 3+ consecutive in same category = 1.1x multiplier (stacks with difficulty)
- Show visual "🔥 3-game Food Streak!" when achieved
- Reset on loss or category switch

**Suggestion 4: Word Length Validation**
- Random length within difficulty means: Easy could be 4, 5, or 6 letters
- But we need to know exact ranges:
  - Easy: 4-6 letters
  - Medium: 5-7 letters
  - Hard: 6-8+ letters
- **Needs clarification:** Exact ranges per difficulty?

**Suggestion 5: Case Sensitivity**
- Should guesses be case-insensitive? (Proper nouns like "India" vs "india")
- **Recommendation:** Case-insensitive. Convert all to lowercase for comparison.

---

## GAME 2: QUICK-FIRE TRIVIA - Gap Analysis

### What We Locked In ✅
- Timer: User selectable 30s, 60s, 90s
- Lives: 3 lives (3 wrong answers = game over)
- Session structure: How many questions? (NOT SPECIFIED!)
- Scoring: Not fully specified

### Identified Gaps 🔴

**Gap 1: Questions Per Session**
- Critical detail: How many questions before session ends?
- Do they play until they lose all 3 lives, or fixed number?
- **Example:** "Play 10 questions, get as many right as possible" vs. "Keep playing until you lose 3"
- **Needs clarification:** Session structure - fixed or lives-based?

**Gap 2: Scoring Formula**
- We have 3 lives but no points calculation
- Example: Is it 10 points per correct? Does timer affect points?
- **Needs clarification:** Exact scoring formula?

**Gap 3: Combo/Streak System**
- Original spec mentioned "combo multiplier" but we didn't detail it
- Should 5+ correct in a row = 1.5x next question?
- **Needs clarification:** Streak multiplier system?

**Gap 4: Category Handling**
- Does user select category before session?
- Random mix or pure single category?
- **Needs clarification:** Category selection rules?

**Gap 5: Difficulty Scaling**
- We approved "difficulty per question" but not how difficulty shows
- Does user see question difficulty before answering?
- **Needs clarification:** Should difficulty be revealed upfront?

**Gap 6: Session End Summary**
- What does user see when game ends? (Score, accuracy %, lives remaining?)
- Is there a "play again" button?
- **Needs clarification:** End-of-session UI/flow?

### Suggestions 💡

**Suggestion 1: Session Structure - Lives-Based (Recommended)**
- Play until all 3 lives lost (no fixed question count)
- Keeps user engaged, shows final score as "questions completed before 3 losses"
- Example: User gets 8 correct, loses 3rd life on question 12 → "8/12 correct"
- More dynamic than fixed 10 questions

**Suggestion 2: Scoring System - Speed + Accuracy**
- Base: 10 points per correct answer
- Speed bonus: +5 if answered in <15 seconds (half the timer)
- Accuracy bonus: After session, if 80%+ accuracy = 1.2x multiplier
- Difficulty multiplier: Easy (1x), Medium (1.5x), Hard (2x)
- **Formula:** 10 × (1 + difficulty) × (1 + speed_bonus) × accuracy_multiplier

**Suggestion 3: Streak Combo System**
- Display: "Correct in a row: 3" (large, prominent)
- Multiplier: 3+ correct = 1.1x, 5+ correct = 1.2x, 7+ = 1.5x
- Combo resets on wrong answer (showing importance of streaks)
- Bonus notification: "🔥 5-game streak! +1.5x multiplier active"

**Suggestion 4: Category Selection**
- Pre-game: User picks category OR "Random Mix" option
- Mixed mode: Cycle through different categories (more variety)
- Single category: Focus mode (master one category)

**Suggestion 5: Difficulty Visibility**
- Show: "🟢 Easy" or "🟡 Medium" or "🔴 Hard" next to question
- Helps user understand challenge level
- Informs strategy (easier questions still build streak)

**Suggestion 6: Session Flow**
```
1. User selects: Timer (30/60/90s), Category (or Mixed)
2. Game starts, questions appear with difficulty badge
3. User answers or timer expires (auto-wrong)
4. Lives counter visible at top (❤️❤️❤️)
5. When 3rd life lost, show:
   - Final score
   - Accuracy % (8/12 = 67%)
   - Longest streak
   - Category breakdown
   - "Play Again" button
```

---

## GAME 3: WORD SCRAMBLE - Gap Analysis

### What We Locked In ✅
- Session: User selectable 1, 5, or 10 words
- Difficulty: Hybrid (length + familiarity)
- Hints: Multiple types + tokens
- Timer: 30s, 60s, 90s, or unlimited
- Quick wins: All 4 included
- Difficulty progression: Auto-increase on streak

### Identified Gaps 🔴

**Gap 1: Hint Token Economy**
- We said "earn from perfect words, spend as needed" but no numbers
- How many tokens per perfect word?
- How many tokens to use 1 hint?
- **Example:** 1 perfect word = 1 hint token? Or 5 tokens?
- **Needs clarification:** Token earning/spending ratio?

**Gap 2: Word Difficulty Ranges**
- Hybrid means length + familiarity, but exact ranges unclear
- Example:
  - Easy: 4-5 letters, common words (cat, tree, book)
  - Medium: 6-7 letters, varied (garden, bicycle, knowledge)
  - Hard: 8+ letters, uncommon (bureaucracy, aesthetic, phenomenon)
- **Needs clarification:** Exact examples per tier?

**Gap 3: Hint Types Specification**
- We approved "multiple hint types" but which ones?
- Options: Category, First Letter, Vowel Count, Definition, Word Length
- **Needs clarification:** Exactly which 3-4 hints available?

**Gap 4: Scoring per Word**
- Base points per word? Does it vary by difficulty?
- Example: Easy word = 20pts? Hard word = 50pts?
- Does timer/speed affect scoring?
- **Needs clarification:** Points per word formula?

**Gap 5: Difficulty Progression Rules**
- "Auto-increase on streak" - but how many words?
- After 3 correct Medium words, go to Hard?
- Can difficulty decrease if user struggles?
- **Needs clarification:** Progression rules exactly?

**Gap 6: Wrong Guess Handling**
- If user types wrong answer, what happens?
- Can they try again same word, or game over?
- Penalty for wrong guess?
- **Needs clarification:** Wrong answer consequences?

### Suggestions 💡

**Suggestion 1: Hint Token Economy**
- Earn: 1 token per "perfect word" (solved without any hints)
- Spend: 1 token = 1 hint revealed
- Max tokens: 5 (can't hoard more)
- Bonus: Using 0 hints on hard word = +2 tokens (rewards expert play)
- Shows tokens like: "🎫 3/5" in corner

**Suggestion 2: Difficulty Ranges**
- Easy (4-5 letters): Common everyday words
  - Examples: food, play, house, smile, think
- Medium (6-7 letters): Standard vocabulary
  - Examples: garden, bicycle, discover, library, example
- Hard (8+ letters): Challenging vocabulary
  - Examples: knowledge, beautiful, elephant, adventure, butterfly

**Suggestion 3: Hint Types (Choose 3)**
- Recommended set:
  1. **Category:** "This is a [noun/verb/animal]"
  2. **First Letter:** Show first letter of answer
  3. **Word Length:** "This word has _ letters"
- Alternative: Add Definition as 4th hint

**Suggestion 4: Scoring Formula**
- Base: 20 points × difficulty multiplier (Easy 1x, Medium 1.5x, Hard 2x)
- Speed bonus: +10 if solved under 10 seconds
- Hint penalty: -5 points per hint used
- **Example:** Hard word, 2 hints, 8 seconds = (20 × 2) - 10 + 10 = 50 points

**Suggestion 5: Difficulty Progression**
- Start at Medium difficulty
- Progress: 3 correct in a row → upgrade to Hard
- Regress: 2 wrong in a row → downgrade one tier
- Show message: "🎯 You're on a roll! Moving to Hard mode"

**Suggestion 6: Wrong Answer Handling (Recommended)**
- User types answer, if wrong:
  1. Show "Not quite! Try again." message
  2. Allow retry same word (max 3 attempts)
  3. After 3 wrong attempts, skip word, -10 points penalty
  4. Move to next word in session
- Keeps momentum going, doesn't halt game

---

## GAME 4: HANGMAN - Gap Analysis

### What We Locked In ✅
- Lives: User selectable 3-6
- Session: User selectable 1, 5, 10 words
- Category: User toggle (show or hide)
- Hints: Multiple types + tokens
- Scoring: Lives + Speed bonus
- Quick wins: All 4 included

### Identified Gaps 🔴

**Gap 1: Scoring Formula**
- "Lives + Speed" approved but no exact calculation
- Example: Solve with 5/6 lives, in 1 minute = how many points?
- **Needs clarification:** Exact formula?

**Gap 2: Letter Guessing - Duplicates**
- What if user guesses same letter twice?
- Count as wrong? Ignore? Just say "already guessed"?
- **Needs clarification:** Duplicate letter handling?

**Gap 3: Vowel Strategy Handling**
- Vowels are limited, consonants abundant
- Should revealing vowels cost more? Or same as consonants?
- **Needs clarification:** Any distinction in guessing?

**Gap 4: Hint Token Economy**
- Same as Word Scramble? Earn from perfect games, spend 1 token = 1 hint?
- **Needs clarification:** Same token system as Scramble?

**Gap 5: Visual Hangman Display**
- Do we show stick figure progression? Or just "4 wrong / 6 allowed"?
- Classic hangman has: head, body, left arm, right arm, left leg, right leg (6 stages)
- **Needs clarification:** Visual feedback preference?

**Gap 6: Category Difficulty Impact**
- Some categories easier than others (Animals easier than Shakespeare)
- Should hidden category be harder than shown?
- Scoring adjustment if category hidden?
- **Needs clarification:** Category difficulty compensation?

### Suggestions 💡

**Suggestion 1: Scoring Formula**
- Base: 30 points × (lives remaining / total lives)
- Speed bonus: +20 if solved in under 2 minutes
- Difficulty multiplier: Easy hidden (1x), Easy shown (1.5x), Hard hidden (2x), Hard shown (2.5x)
- **Example:** Hard category hidden, 5/6 lives, 1:30 → 30 × (5/6) × 2 + 20 = 70 pts

**Suggestion 2: Duplicate Letter Handling (Recommended)**
- If user guesses already-guessed letter:
  1. Show "You already guessed that!"
  2. Don't count against lives
  3. Still uses a guess (prompt to guess new letter)
- Prevents accidental rule breaking

**Suggestion 3: Letter Guessing - Equal Treatment**
- All letters (vowels & consonants) treated equally
- No special rules for common letters
- Encourages strategy (which letters most likely in context?)

**Suggestion 4: Hint Token System**
- Same as Word Scramble (1 perfect word = 1 token, 1 token = 1 hint)
- Consistent across games
- Max 5 tokens

**Suggestion 5: Visual Hangman**
- Show classic stick figure progression with each wrong guess
- Stage 1: Head
- Stage 2: Body
- Stage 3: Left arm
- Stage 4: Right arm
- Stage 5: Left leg
- Stage 6: Right leg (game over)
- Shows 6 lives = 6 stages (natural progression)

**Suggestion 6: Category Difficulty**
- If category hidden: More challenging (worth more points)
- Points multiplier: Hidden category = 2x, Shown category = 1x
- User choice creates difficulty variance
- Encourages trying both modes

---

## Cross-Game Issues 🔄

### Issue 1: Points Consistency
- Each game has different scoring formula
- Wordle: 50 + time + difficulty
- Quick-Fire: 10 × (1 + difficulty) × speed × accuracy
- Word Scramble: 20 × difficulty - hints + speed
- Hangman: 30 × (lives / total) × difficulty + speed

**Suggestion:** Normalize to similar formula across games for consistency
- Base points vary (20-50 depending on game)
- Difficulty multiplier: 1x, 1.5x, 2x (consistent)
- Time/speed bonus: similar window (under X seconds = bonus)
- Penalties: similar magnitude (-5, -10, -20)

### Issue 2: Hint Token System
- Mentioned in 3 games (Wordle, Scramble, Hangman)
- But never defined as global system
- Should all games share same token pool or separate?

**Suggestion:** Unified system
- One token pool across all games
- "Hint Tokens: 3/5" shown in top bar
- Earn from any perfect game, spend in any game
- Creates meta-strategy (which game to use tokens on?)

### Issue 3: Session Continuity
- All games allow "user selectable 1, 5, or 10 words/questions"
- What if user closes browser mid-session?
- Does progress save or reset?

**Suggestion:** Auto-save session
- Save current session state
- Show "Resume last session?" on game restart
- Or just save score but reset game (simpler)

### Issue 4: Leaderboard Granularity
- We approved per-game leaderboards
- But with so many difficulty levels (Easy/Medium/Hard) + other modifiers
- Leaderboard could be huge with little relevance

**Suggestion:** Leaderboard filtering
- Show: All-time, This week, This month
- Filter by: Difficulty, Category (if applicable), Session type
- Keep top 10-20 for each filter to avoid overwhelm

---

## Summary: Gaps Needing Approval

**High Priority (Need immediate answers):**
1. [ ] Wordle: Hint penalty amount, Timer vs. untimed, Word length ranges
2. [ ] Quick-Fire: Fixed questions or lives-based? Scoring formula?
3. [ ] Word Scramble: Token earning/spending ratio, Exact hint types
4. [ ] Hangman: Scoring formula, Duplicate letter handling
5. [ ] Cross-game: Normalize points formulas? Unified token pool?

**Medium Priority (Nice to clarify):**
6. [ ] All games: Category streaks bonuses (exact amounts)
7. [ ] Word Scramble & Hangman: Difficulty progression rules
8. [ ] Visual feedback preferences (stick figure vs. counter, etc.)
9. [ ] Session resumption on browser close

**Low Priority (Can decide later):**
10. [ ] Leaderboard filtering strategy
11. [ ] Category difficulty compensation

