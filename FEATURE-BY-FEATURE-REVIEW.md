# Feature-by-Feature Deep Dive Review

**Status:** Work in Progress - Review Each Feature  
**Date:** 2026-06-16

---

## GAME 1: WORDLE (Category Wordle)

### Current Spec
- Guess word in 6 attempts
- Select category (Food, Animals, Geography, etc.)
- Difficulty modes: Easy, Medium, Hard
- Scoring: Based on attempts remaining
- Leaderboard tracking

### Questions for Review
1. **Category Selection:** Should user pick category before each game, or random?
2. **Word Length:** Fixed length or vary by difficulty?
3. **Hint System:** How many hints? (Current spec: hints lessen over time globally)
4. **Scoring Formula:** Exactly how many points for 6 attempts vs. 1 attempt?
5. **Replay Prevention:** Can user play same word twice, or blocked?

### Potential Gaps
- [ ] What happens if user runs out of words in a category?
- [ ] How to handle proper nouns (India vs. india)?
- [ ] Keyboard layout for entering guesses (letter buttons vs. keyboard)?
- [ ] Visual feedback for correct/wrong/misplaced letters (color coding)?
- [ ] Ability to see past games/history?

### Quick Win Ideas
- 🎯 **Category Streak:** Track consecutive wins in same category (bonus multiplier)
- 🎯 **Speed Challenge:** Bonus points if solved in <2 minutes
- 🎯 **Hint Conservation:** User can earn "hint tokens" by winning without hints
- 🎯 **Word Length Badges:** "Master 5-letter words", "Master 6-letter words", etc.

### Suggestions
1. **Difficulty Auto-Adjust:** If user loses 3+ in a row, suggest easier difficulty
2. **Word Preview:** Show word length + category before starting
3. **Letter Keyboard:** Mobile-friendly letter buttons instead of typing
4. **Statistics Tile:** Show "Best Streak", "Favorite Category", "Total Wins"
5. **Elo Rating:** Optional skill rating that adjusts per game

---

## GAME 2: QUICK-FIRE TRIVIA

### Current Spec
- Multiple choice questions
- Timed answers (optional)
- Difficulty modes
- Accuracy percentage tracking
- Leaderboard tracking

### Questions for Review
1. **Timer Duration:** How long per question? (5s, 10s, 30s user-choice?)
2. **Wrong Answer Handling:** Instant game over or continue with penalties?
3. **Question Set Size:** How many questions per session? (5, 10, 20?)
4. **Answer Hints:** Show before answering or after?
5. **Skipping Questions:** Allow skip without penalty?

### Potential Gaps
- [ ] Category selection per session?
- [ ] Category mixing vs. pure category?
- [ ] Combo multiplier mechanics not detailed
- [ ] What triggers "game over" (wrong answer, time up, both)?
- [ ] End-of-game summary (what was shown? stats?)

### Quick Win Ideas
- 🎯 **Streak Counter:** Large display of "X correct in a row" (visual motivation)
- 🎯 **Perfect Session Badge:** All questions correct in one session
- 🎯 **Timed Mastery:** Extra bonus if no timer used vs. 10s vs. 30s
- 🎯 **Category Blitz:** "Answer 5 questions from mixed categories" daily quest
- 🎯 **Difficulty Scaling:** Auto-increase difficulty if 3+ correct in a row

### Suggestions
1. **Visual Answer Feedback:** Green highlight for correct, red for selected wrong
2. **Learn Mode Option:** Take questions without timer, with explanations
3. **Speed Ranking:** "Fastest correct answer: 1.2 seconds"
4. **Category Performance:** Show which categories user is strongest/weakest in
5. **Sound Effects:** Correct ding, incorrect buzz (optional, respectful volume)

---

## GAME 3: WORD SCRAMBLE

### Current Spec
- Unscramble letters to form words
- Difficulty levels
- Timer-based scoring
- 30 seconds per word
- Leaderboard tracking

### Questions for Review
1. **Word Difficulty:** How determined? (letter count, common vs. rare words?)
2. **Hints:** Show letter count + hint? Or just scrambled letters?
3. **Session Structure:** Multiple words per session or single word?
4. **Wrong Guesses:** Limited attempts per word or infinite?
5. **Scoring:** How does time remaining convert to points?

### Potential Gaps
- [ ] What defines difficulty (Easy: 4-5 letters, Medium: 6-7, Hard: 8+)?
- [ ] Can user see word category before attempting?
- [ ] How many words per session?
- [ ] Acceptable word variations (plural, verb tenses)?
- [ ] Leaderboard: by score or by accuracy?

### Quick Win Ideas
- 🎯 **Speed Mastery Bonus:** 1.5x points if solved in <5 seconds
- 🎯 **Word Pattern Recognition:** After solving, show "contains pattern X"
- 🎯 **Vowel Hint:** Free vowel reveal once per session
- 🎯 **Category Twist:** Some scrambles are category-specific ("Fruit: T R A G E")
- 🎯 **Perfect Session:** Solve all words without hints = badge

### Suggestions
1. **Visual Feedback:** Show attempt timer visually (progress bar)
2. **Keyboard Support:** Type letters or click buttons
3. **Letter Rearrangement:** Highlight current arrangement
4. **Difficulty Progressive:** Start easy, automatically increase if winning streak
5. **Word Origin:** Show etymology after solving (learning bonus)

---

## GAME 4: HANGMAN

### Current Spec
- Guess letters to reveal word
- Limited wrong guesses before loss
- Session-based
- Leaderboard tracking

### Questions for Review
1. **Lives/Wrong Guesses:** How many? (6 for classic, 3 for hard?)
2. **Word Selection:** Categories or random?
3. **Hint System:** How many hints? Before or during game?
4. **Scoring:** Same base + difficulty multiplier?
5. **Session Length:** Multiple words or single word?

### Potential Gaps
- [ ] Visual hangman stages (stick figure progression)?
- [ ] Keyboard vs. letter buttons?
- [ ] Repeated letter guesses (allowed, penalized, or blocked)?
- [ ] Letter frequency hints (show common letters)?
- [ ] Category preview before starting?

### Quick Win Ideas
- 🎯 **Deduction Bonus:** Solve with 5+ wrong guesses but under 30s = bonus points
- 🎯 **Perfect Game:** Solve with 0 wrong guesses = 2x points
- 🎯 **Pattern Recognition:** Reveal one letter pattern per game (e.g., starts with "ST")
- 🎯 **Category Master:** Complete 10 wins in same category = badge
- 🎯 **Guess Wisely:** Bonus for guessing high-value letters first (Q, X, Z)

### Suggestions
1. **Visual Hangman:** Show stick figure progression (classic but fun)
2. **Hint Store:** Earn "hint tokens" from wins, use when needed
3. **Difficulty Categories:** Animal words, movie titles, book names
4. **Word Length Progression:** Start with 4-letter words, unlock longer
5. **Stats Tracking:** Show "Favorite letter", "Words completed", "Best streak"

---

## GAME 5: FILL-IN-THE-BLANK (v1.5)

### Current Spec
- Complete sentences/paragraphs with missing word(s)
- Educational (learns context, grammar)
- Multiple difficulty levels

### Questions for Review
1. **Blank Count:** Single word per sentence or multiple blanks?
2. **Word Pool:** Multiple choice or type answer?
3. **Context Length:** Single sentence, paragraph, or passage?
4. **Educational Value:** Grammar focus or vocabulary focus?
5. **Difficulty Scaling:** More complex sentences or obscure words?

### Potential Gaps
- [ ] Example: "The ___ is the largest planet" (easy) vs. "The ___ of the matter is..." (harder)
- [ ] How to handle multiple correct answers (e.g., "The ___ flew away" = "bird", "eagle", "parrot")?
- [ ] Category system for context (Science, Literature, History)?
- [ ] Hint types (definition, first letter, category)?

### Quick Win Ideas
- 🎯 **Context Mastery:** Solve 5 in same context area = bonus
- 🎯 **Grammar Focus:** Bonus points for identifying word type (noun, verb, adjective)
- 🎯 **Multiple Correct:** Show all accepted answers after solving
- 🎯 **Learning Bonus:** Read full text after completing (reading comprehension)
- 🎯 **Author Recognition:** "This quote is from [Author]" = educational

### Suggestions
1. **Sentence Difficulty Scaling:** Start with simple sentences, auto-increase
2. **Part-of-Speech Hints:** "Need a verb" or "Need an adjective"
3. **Reading Integration:** Pull sentences from books in Reading section
4. **Grammar Learning:** After each game, brief grammar tip
5. **Contextual Challenges:** "Complete sentences from famous speeches/books"

---

## GAME 6: CROSSWORD (v1.5)

### Current Spec
- Mini crosswords (5x5 or 7x7 grid)
- Category-themed
- Daily puzzle or on-demand

### Questions for Review
1. **Grid Size:** Fixed or variable difficulty?
2. **Clue Types:** Definitions only or wordplay/cryptic?
3. **Session Length:** Single puzzle per play session?
4. **Hint System:** Letter reveals, word reveals?
5. **Difficulty:** Too hard for age 9-10 initially?

### Potential Gaps
- [ ] Crossword generation vs. pre-made? (generation is complex)
- [ ] Mobile vs. desktop difficulty (touch controls)
- [ ] Across/Down separation clear in UI?
- [ ] Word list leaderboard (easiest clues solved fastest)?
- [ ] Daily puzzle consistency?

### Quick Win Ideas
- 🎯 **Theme Mastery:** 5 crosswords with same theme = themed badge
- 🎯 **No-Hint Perfect:** Solve without any hints = 2x points
- 🎯 **Speed Run:** Complete puzzle in <3 minutes = speed badge
- 🎯 **Vocabulary Learning:** After solving, show word origins/definitions
- 🎯 **Collaborative Learning:** Partner can solve together (if multiplayer later)

### Suggestions
1. **Start with Easier Clues:** "Simple definitions, no cryptic initially"
2. **Pre-made Puzzles:** Use standard crossword database vs. generating
3. **Check Feature:** Verify grid without solving
4. **Reveal Feature:** Show one word at a time
5. **Learning Mode:** After solving, show all clues + answers explained

---

## Summary: Games Quick Wins & Ideas

### Tier 1 Quick Wins (Easy to Add, High Impact)
- [ ] **Streak Counters:** Large visible streak display in all games
- [ ] **Category Streaks:** Bonus for consecutive wins in same category
- [ ] **Perfect Games:** No-hint/no-mistake solves get 2x points
- [ ] **Speed Bonuses:** Solve fast = bonus points (5s, 10s thresholds)
- [ ] **Visual Feedback:** Color highlighting (green correct, red wrong)
- [ ] **Sound Effects:** Optional success/failure audio

### Tier 2 Enhancements (Medium Effort)
- [ ] **Difficulty Auto-Scaling:** Automatically increase if winning streak
- [ ] **Hint Tokens:** Earn from perfect games, spend on harder games
- [ ] **Game History:** See past games played + results
- [ ] **Category Performance:** Which categories strongest/weakest
- [ ] **Daily Challenges:** "Speed run this game" or "No hints mode"

### Tier 3 Advanced Features (Post-Launch)
- [ ] **Leaderboard Filters:** This week, this month, by category
- [ ] **Elo Rating:** Optional skill-based rating system
- [ ] **Difficulty Badges:** "Master Hard Wordle", "Perfect Quick-Fire"
- [ ] **Learning Mode:** Games without timer/pressure, with explanations
- [ ] **Multiplayer (Future):** Play with friend, compare scores

**Total Quick Win Opportunities: 20+**

---

## Next: Ready to Review?

Shall we move on to review:
1. **Trivia System** (question bank, difficulty progression, hints)
2. **Daily Quests** (structure, reset timing, completion)
3. **Points System** (formulas, multipliers, calculations)
4. **Achievement Badges** (tier progression, unlock conditions)
5. **Other Features** (goals, category mastery, daily challenge, etc.)

Which next?

