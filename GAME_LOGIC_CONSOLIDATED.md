# Family Hub - Game Logic & Calculations (Complete Reference)

**Purpose:** Single source of truth for all game mechanics, calculations, and business logic  
**Created:** 2026-06-29  
**Status:** COMPREHENSIVE - All major logic documented with gap identification  

---

## Part 1: Points Economy & Calculations

### Core Points Rules ✅ LOCKED
- Points accumulate permanently (no decay)
- Default floor: zero (parent can enable negative points)
- Default cap: none (parent can set daily cap)
- Negative points: requires confirmation dialog

### Daily Bonus Multiplier Tiers ✅ LOCKED
```
Days 1-2:   1.0×
Days 3+:    1.1×
Days 7+:    1.2×
Days 14+:   1.5×
Days 30+:   2.0×
```

### Points by Activity ✅ LOCKED

| Activity | Points | Notes |
|---|---|---|
| Wordle completion | 10 base × difficulty | + attempts remaining bonus |
| Quick-Fire correct | 10 base × difficulty | + combo multiplier + speed |
| Word Scramble word | 10 base × difficulty | + speed bonus |
| Hangman win | 10 base × difficulty | + lives remaining |
| Trivia Level 1 correct | 10 pts | + speed bonus if <10s |
| Trivia Level 2 correct | 15 pts | |
| Trivia Level 3 correct | 20 pts | |
| Trivia Level 4 correct | 30 pts | |
| Mood logging (base) | 1 pt | |
| Mood logging (3+ streak) | 3 pts | |
| Mood logging (7+ streak) | 5 pts | Stays at 5 |
| Reading | 1 pt per 5 minutes | |
| Reading completion bonus | +10 pts | Per book/item |
| Reading weekly goal | +15 pts | Default 60 min/week |
| Kung Fu session | +10 pts per 30 min | |
| Kung Fu flashcards | +5 pts per 15 min | Requires parent approval |
| Habits | 5 pts base | Parent can customize per habit |
| Habit streak 7+ | +2 pts | |
| Habit streak 30+ | +5 pts | |
| Gujarati lesson | 10 pts × phase multiplier | Phase: 1×, 1.5×, 2×, 2.5×, 3× |
| Gujarati time bonus | +1 pt per 5 min | |
| Gujarati perfect practice | +5 pts | |
| Gujarati phase completion | +50 pts | |
| Quest completion | +50 pts bonus | All 3 quests in one day |
| Weekly goal completion | 50 pts base × difficulty multiplier | Easy 50, Medium 75, Hard 100, Expert 150 |
| Monthly goal completion | 150 pts base × difficulty multiplier | Easy 150, Medium 225, Hard 300, Expert 450 |
| Goal early completion | +10 pts (weekly 2+ days early), +25 pts (monthly 5+ days early) | |
| Maintenance goal | +5 pts/day condition met + full period bonus | |
| Partial goal credit | 25%/50%/75% of bonus | At 50%, 75%, 90% progress |
| Daily Challenge game | Base × challenge multiplier | Multipliers: 1.5×/2.5×/3×/4× per mode |
| Daily Challenge lives bonus | +25 pts per life remaining | |
| Daily Challenge clean sweep | +200 pts | 4 wins, 3 lives remaining |
| Daily Challenge near clean sweep | +50 pts | 4 wins, 1-2 lives lost |
| Chores | Priority-based | Parent sets values per priority |

### Hint Penalties ✅ LOCKED
```
1st hint:  −5 pts   (configurable globally + per-game override)
2nd hint:  −10 pts
3rd hint:  −20 pts
```

---

## Part 2: Games System

### Core Game Rules ✅ LOCKED
- Difficulty multipliers (global, no per-game override):
  - Easy: 1×
  - Medium: 1.5×
  - Hard: 2×
- Lives/attempts bonuses:
  - Quick-Fire + Hangman: +2 pts per life remaining
  - Wordle: +5 pts per attempt remaining
  - Word Scramble: +2 pts per word solved on first attempt
- On-screen keyboard displays letter states
- No life lost for duplicate letter guess (prevented by keyboard)
- Session auto-saves continuously; resume prompt shown same calendar day; expires at midnight
- Declined resume = abandoned session, no points

### Wordle ✅ LOCKED

```
Word Length:
  Easy:      4-5 letters
  Medium:    5-7 letters
  Hard:      7-9 letters

Timer:         Untimed (scoring based on attempts)

Scoring:       Base 10 pts × difficulty + (attempts remaining × 5 pts speed bonus)

Hints:         3 available (Category, First Letter, Definition)
               Penalties: -5, -10, -20 pts (escalating)

Input:         On-screen keyboard + letter grid

Session Save:  Auto-saves continuously, same-day resume available
```

### Quick-Fire Trivia ✅ LOCKED

```
Structure:     Lives-based (play until 3 wrong answers, no fixed count)

Category:      Player picks specific category or "Random Mix"

Scoring:       (10 × difficulty multiplier) × combo multiplier + speed bonus
               + lives bonus

Combo:
  3+ correct:     1.1×
  5+ correct:     1.25×
  7+ correct:     1.5×

Speed Bonus:   +5 pts if answered in <50% of timer

Lives Bonus:   +2 pts per life remaining at game end

Timers:        Configurable per category (default 30s)
               Parent can set max session length

Input:         Multiple choice (no keyboard)
```

### Word Scramble ✅ LOCKED

```
Input:         Draggable/tappable letter tiles (primary)
               On-screen keyboard fallback

Hints:         Category, First Letter, Definition
               Penalties: -5, -10, -20 pts

Scoring:       (10 × difficulty) + 5 speed bonus (if <10s) + 2 first-attempt bonus
               Hint penalties deducted separately

Speed Bonus:   +5 pts if solved in <10s

First Attempt: +2 pts per word solved without hint

Difficulty:    Easy, Medium, Hard (affects word length/complexity)
```

### Hangman ✅ LOCKED

```
Scoring:       (10 × difficulty) + (lives remaining × 2) + 5 speed bonus (if <2 min)

Hints:         3 available (Category, First Letter, Definition)
               Penalties: -5, -10, -20 pts

Duplicate:     "Already guessed!" message, no life lost (prevented by keyboard)

Visual:        Classic stick figure progression (6 stages)

Input:         On-screen keyboard

Speed Bonus:   +5 pts if solved in <2 minutes

Lives:         Typically 6 (configurable in Parent Portal)
```

### Game Quest Pool ✅ LOCKED (20 templates)
1. Complete 2 Wordle games
2. Win Wordle with 5+ correct letters
3. Complete 2 Hangman games
4. Win Hangman without using a hint
5. Score 100+ points in Hangman
6. Solve 3 Word Scramble words
7. Solve 1 Scramble word in under 10 seconds
8. Answer 5 Quick-Fire questions
9. Get 8+ correct in Quick-Fire
10. Play 4 different games
11. Win 3 games in a row
12. Complete a Wordle in 3 guesses or fewer
13. Get a 5+ combo streak in Quick-Fire
14. Solve a Hard difficulty Scramble word
15. Win Hangman with all lives remaining
16. Complete any game without using a hint
17. Score 200+ points in a single game session
18. Play a game on Hard difficulty
19. Complete a full Word Scramble session (all words solved)
20. Win Hangman with category hidden

---

## Part 3: Trivia System

### Question Structure ✅ LOCKED
```json
{
  "uuid": "q001",
  "question": "What is the capital of India?",
  "options": ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
  "correct": "Delhi",
  "category": "Geography",
  "difficulty": "level1 | level2 | level3 | level4",
  "funFact": "Delhi has been the capital since 1931...",
  "enhancedFunFact": "Detailed learning fact shown on 2nd wrong answer",
  "hint": "It's on the Yamuna River",
  "learnMoreLinks": [],
  "tags": ["India", "Capitals", "Asia"],
  "addedDate": "2026-06-17"
}
```

### Question Bank ✅ LOCKED
- Size: 1,000 questions at launch (Claude curated), expandable
- Storage: IndexedDB with `_meta` version record
- Distribution: Level 1 (30%), Level 2 (30%), Level 3 (25%), Level 4 (15%)
- Parent Portal: Can review, edit, and add questions

### 16 Categories ✅ LOCKED
1. Geography
2. Science & Nature
3. History
4. Math & Logic
5. Language & Literature
6. Animals
7. Sports & Games
8. General Knowledge
9. Space & Astronomy
10. Indian Culture & Heritage
11. Mythology & Legends
12. Art & Music
13. Technology & Inventions
14. Food & Cooking
15. Human Body & Health
16. Movies & Entertainment

### 4 Difficulty Levels ✅ LOCKED

| Level | Unlock Requirement |
|---|---|
| Level 1 | Always available |
| Level 2 | 80% accuracy on last 20 Level 1 questions |
| Level 3 | 80% accuracy on last 20 Level 2 questions |
| Level 4 | 90% accuracy on last 30 Level 3 questions |

### 11 Difficulty Themes ✅ LOCKED

| Theme | Level 1 | Level 2 | Level 3 | Level 4 |
|---|---|---|---|---|
| Adventure (default) | Rookie | Pro | Legend | Master |
| Royalty | Noble | Royal | Sovereign | Emperor |
| Olympics | Qualifier | Athlete | Champion | Gold Medalist |
| Space | Cadet | Astronaut | Commander | Mission Director |
| Martial Arts | White Belt | Black Belt | Sensei | Grandmaster |
| Chef | Apprentice | Chef | Master Chef | Executive Chef |
| Science | Scientist | Researcher | Genius | Nobel Laureate |
| Music | Musician | Performer | Maestro | Virtuoso |
| Princess | Princess | Queen | Empress | High Queen |
| Gaming | Player | Gamer | Legend | God Mode |
| Academic | Novice | Expert | Virtuoso | Scholar |

### Category Mastery Thresholds ✅ LOCKED

```
Level 1 (e.g. Rookie):   10+ questions answered in category
Level 2 (e.g. Pro):      70%+ accuracy on 20+ questions
Level 3 (e.g. Legend):   80%+ accuracy on 40+ questions
Level 4 (e.g. Master):   90%+ accuracy on 60+ questions
```

### Session Structure ✅ LOCKED
- Session-based: Krish picks 5, 10, or 20 questions before starting
- Pre-session choices: Category (specific or Random Mix), Difficulty, Session length
- Last selections remembered
- Krish can change choices mid-session (abandons current, no points)
- Parent can customize available session lengths
- Parent can force "Random Mix" category (prevents cherry-picking)
- Results summary: score, accuracy, category breakdown, fun facts reviewed

### Question Cycling ✅ LOCKED
```
Correct answers:     Don't repeat for 14 days
Incorrect answers:   Resurface in 3-7 days (weighted by miss count)
Wrong-answer pool:   Prioritized over unseen questions
Category exhausted:  Greyed out, shows days until refresh
All thresholds:      Configurable in Parent Portal
```

### Hint System ✅ LOCKED
```
Phase 1 (0-20 questions):    Hint button prominent, green, "Get a Hint"
Phase 2 (21-50 questions):   Hint button smaller, gray, "Hint (-5 pts)"
Phase 3 (50+ questions):     Hint hidden, "Need a hint?" appears after 15s
Once revealed:               Hint stays visible, button disabled
Per-category tracking:       Resets when new category started
All thresholds:              Configurable in Parent Portal
```

### Fun Fact Display ✅ LOCKED
```
Correct answer:    Show funFact (celebratory)
1st wrong answer:  Show hint, question stays active
2nd wrong answer:  Show enhancedFunFact + correct answer
Question skipped:  Show funFact only, no pressure
Never auto-dismiss: Krish taps "Next Question →"
```

### Learn More Integration ✅ LOCKED
- "Learn More →" link appears after every question
- Opens category's curated resources in modal (3-5 links per category)
- Non-intrusive, skippable
- Links open in new tab
- Usage tracked, visible in parent portal
- Sources: Wikipedia, Khan Academy, National Geographic, BBC Bitesize
- Parent can audit and update links in portal; manual review recommended once per season

### Stats Tracking ✅ LOCKED
- Total answered, correct, streak, longest streak, overall accuracy
- Per-category accuracy
- Per-difficulty accuracy
- Wrong-answer pool with decay weights
- `fastestCorrectAnswer` per category
- `favoriteCategory` auto-calculated from most-played
- `totalHintsUsed` across all trivia

### Daily Limit ✅ LOCKED
- No default limit
- Parent can set daily question cap in Parent Portal

---

## Part 4: Habits System

### 11 Predefined Habits ✅ LOCKED

| Habit | Emoji | Auto-Links To |
|---|---|---|
| Exercise | 💪 | Kung Fu session, mood tag "Exercise" |
| Prathna | 🙏 | Prathna chore (HA Dashboard), mood tag "Prayer" |
| Meditation | 🧘 | Meditation chore template, mood tag "Meditation" |
| Reading | 📚 | Reading module session |
| Gujarati Practice | 🇮🇳 | Gujarati lesson |
| Drink Water | 💧 | Drink Water chore template |
| Sleep on Time | 😴 | Sleep on Time chore template |
| Gratitude Journal | ✍️ | Mood log with gratitude note |
| Study | 📖 | Homework completion, Trivia session |
| Brain Exercise | 🧠 | Any game completion, Trivia session |
| Self-Reflection | 🪞 | Any mood log entry |

### Habit Equivalency ✅ LOCKED
- Each habit has optional `linkedActivities` array
- Completing linked activity auto-marks habit complete via `events.js`
- If already manually completed, auto-completion ignored (no double points)
- Shows subtle notification: "[Habit] auto-completed ✅"
- Parent configures via visual builder in Parent Portal
- One activity → multiple habits; multiple activities → one habit
- Drink Water and Sleep on Time have predefined chore templates

### Custom Habits ✅ LOCKED
- Parent can create directly (name, emoji, frequency)
- Krish can suggest (requires parent approval before activating)
- No limit on custom habits
- Habits archived (not deleted) to preserve history

### Points ✅ LOCKED
```
Default:           5 pts per completion
Customizable:      Parent sets per habit in Parent Portal
Streak bonus 7+:   +2 pts
Streak bonus 30+:  +5 pts
```

### Missed Day Handling ✅ LOCKED
```
Streak reset:      Default on missed day
Recovery options:
  - 1 free/month (no cost)
  - Points-based: flat cost (all habits) or per-habit
  - Recovery Day protection: parent marks day, all streaks protected
  
Longest streak:    Always preserved

Configuration:
  - Number of paid recoveries per month
  - Per-habit vs global recovery costs
  - All in Parent Portal
```

---

## Part 5: Daily Quests System

### Core Rules ✅ LOCKED
- 3 random quests per day from pool
- Filter pool to unlocked games/activities only
- 1 free swap per day (parent can adjust, optionally require points cost)
- Quest swap cost: contextual warning shows cost as % of daily goal
- No penalty for incomplete (missing +50 bonus is only consequence)
- Quest streak: counts fully completed days only
- Missed quests logged for parent visibility
- Midnight reset

### Quest Generation Algorithm ❓ PARTIALLY DEFINED
```
LOCKED Rules:
- Maximum 1 points/milestone quest per day
- Maximum 1 streak quest per day
- No duplicate quest types on same day
- Calendar-aware quests excluded when condition not met
- Filter to unlocked activities only

UNDEFINED:
- Exact random selection algorithm (weighted vs. uniform?)
- Bias for weak categories (mentioned as configurable, but algorithm not specified)
- Exact calculation for "contextual warning shows cost as % of daily goal"
```

### Complete Quest Pool ✅ LOCKED (130+ templates)

**Games (20)** — See Games section above

**Chores (10):**
1. Complete all chores for the day
2. Complete 3 chores in a single day
3. Complete a high-priority chore
4. Complete chores 3 days in a row
5. Complete a self-directed chore
6. Complete a chore without being reminded
7. Complete all weekly chores ahead of schedule
8. Complete a medium and high priority chore in the same day
9. Log a self-directed chore and complete it same day
10. Complete chores 5 days in a row

**Homework (10):**
1. Complete a homework assignment on time
2. Complete 2 homework assignments in one day
3. Complete a high priority assignment
4. Submit homework early (before due date)
5. Complete homework in less than the estimated time
6. Complete assignments in 3 different subjects in one day
7. Complete all homework for the week
8. Log homework notes or progress update
9. Complete a homework assignment without asking for hints/help
10. Finish all overdue homework

**Kung Fu (11):**
1. Log a class attendance session *(calendar-aware: only on scheduled class days)*
2. Log a home practice session
3. Practice for 60+ minutes in a single session
4. Log 2 Kung Fu sessions in one week
5. Study flashcards for 15+ minutes
6. Study flashcards for 30+ minutes
7. Create a new technique flashcard
8. Log a session and rate it 4 stars or higher
9. Log 3 techniques practiced in a single session
10. Complete a session and link it to the Exercise habit
11. Log consecutive sessions 2 days in a row

**Habits (10):**
1. Complete all habits for today
2. Complete a specific habit 3 days in a row
3. Complete 2 different habits in one day
4. Maintain a 7-day habit streak
5. Complete a habit before 9am *(requires timestamp tracking)*
6. Complete all habits for 5 days in a row
7. Add a new habit and complete it same day
8. Complete a habit you haven't done in 3+ days
9. Complete every habit for an entire week
10. Complete a habit linked to Kung Fu (Exercise)

**Mood (10):**
1. Log your mood today
2. Log your mood 3 days in a row
3. Log your mood with a note
4. Log your mood and energy level
5. Log your mood 7 days in a row
6. Log your mood in the morning (before noon)
7. Log your mood after a Kung Fu session *(cross-module via events.js)*
8. Log your mood after completing all chores *(cross-module via events.js)*
9. Log a positive mood (😄 or 😊)
10. Log your mood and tag an activity

**Reading (12):**
1. Log a reading session today
2. Read for 20+ minutes in one session
3. Read for 30+ minutes in one session
4. Log 2 reading sessions in one day
5. Complete a book
6. Log a reading session and add a rating
7. Read 3 days in a row
8. Log a reading session and add notes
9. Read for 5 days in a row
10. Start a new book
11. Read in the morning (before noon)
12. Log a reading session after completing homework *(cross-module via events.js)*

**Gujarati (12):**
1. Complete a Gujarati lesson today
2. Complete 2 Gujarati lessons in one day
3. Study Gujarati for 15+ minutes
4. Study Gujarati for 30+ minutes
5. Complete 3 Gujarati lessons in a row
6. Learn 5 new words in a session
7. Learn 10 new words in a session
8. Complete a lesson and score 80%+ accuracy
9. Complete a lesson without using any hints
10. Study Gujarati 5 days in a row
11. Complete a lesson in a new phase/level
12. Study Gujarati after completing homework *(cross-module via events.js)*

**Cross-Module & General (15):**
1. Complete activities in 5 different sections today
2. Hit your daily points goal
3. Complete all 3 daily quests
4. Log at least one activity in every section today
5. Earn 100+ points in a single day
6. Earn 200+ points in a single day
7. Complete a quest from 3 different categories
8. Maintain daily activity streak for 7 days
9. Complete a game AND a homework assignment on the same day
10. Complete a Kung Fu session AND study Gujarati on the same day
11. Log mood, habits, and reading all in one day
12. Complete all chores AND all homework on the same day
13. Use the app 5 days in a row
14. Earn points before 10am
15. Complete an activity in every section this week

**Points & Milestones (10):**
1. Earn 50+ points today
2. Earn 100+ points in a single day
3. Earn 200+ points in a single day
4. Earn points from 4 different activity types in one day
5. Maintain daily bonus streak for 7 days
6. Maintain daily bonus streak for 14 days
7. Reach a new personal best points day
8. Earn points in every section today
9. Earn bonus points from a completed quest streak
10. Earn 500+ points in a single week

**Streaks & Achievements (12):**
1. Maintain your daily activity streak today
2. Extend your quest completion streak to 3+ days
3. Extend your quest completion streak to 7+ days
4. Maintain a habit streak for 5+ days
5. Maintain a mood logging streak for 5+ days
6. Maintain a reading streak for 3+ days
7. Maintain a Gujarati study streak for 3+ days
8. Unlock a new badge today
9. Reach a new personal best in any game
10. Unlock a new trivia difficulty level *(only appears when milestone is close)*
11. Earn a category mastery upgrade *(only appears when milestone is close)*
12. Complete your first Level 4 trivia question *(only appears when Level 4 is unlocked)*

**Parent-Assigned & Special Events (10):**
1. Complete a parent-assigned special task
2. Earn a parent bonus
3. Complete a family activity together
4. Help a family member with a task
5. Complete a parent challenge (custom one-time quest)
6. Complete all activities on a school day *(calendar-aware: school days)*
7. Complete a full recovery day checklist *(calendar-aware: recovery days)*
8. Complete 3 activities on a weekend *(calendar-aware: Sat/Sun)*
9. Hit daily goal on a holiday *(calendar-aware: holidays)*
10. Complete a birthday challenge *(calendar-aware: Krish's birthday)*

**Wellness (4):**
1. Drink water before starting activities
2. Take a screen break (30+ min away from device)
3. Get outside for 20+ minutes
4. Go to bed on time (parent verifies)

**Creative (4):**
1. Draw or create something today
2. Write a journal entry
3. Practice a musical instrument
4. Create something and share it with a family member

**Family & Social (4):**
1. Help a family member without being asked
2. Share an achievement with a parent
3. Teach someone something you learned today
4. Complete a family activity together

---

## Part 6: Reading System

### Entry Types ✅ LOCKED

| Type | Emoji | Tracks |
|---|---|---|
| Book | 📚 | Minutes |
| Article | 📰 | Minutes |
| Comic/Graphic Novel | 💬 | Minutes |
| Passage/Excerpt | 📄 | Minutes |
| Other | 📖 | Minutes |

### Time Tracking ✅ LOCKED
- Built-in Start/Done timer (default, encouraged)
- Manual time entry (fallback)
- Activity log shows which method was used

### Points ✅ LOCKED
```
Per session:        1 pt per 5 minutes read
Completion bonus:   +10 pts (per book/item)
Weekly goal bonus:  +15 pts (default 60 min/week)
All values:         Configurable in Parent Portal
```

### Rating System ✅ LOCKED
- 1-5 stars + optional reaction emoji (😄 😊 😐 😕)
- Both optional/skippable
- "Krish's favorites" view shows highest-rated reads

### Genres (10 Predefined) ✅ LOCKED
Adventure 🗺️, Fantasy 🧙, Science Fiction 🚀, Mystery 🔍, History 🏛️, Science & Nature 🔬, Biography 👤, Humor 😂, Sports ⚽, Other 📖

### Book Completion ✅ LOCKED
- "I finished this book!" checkbox on session log
- +10 pt bonus, celebration animation
- Book moves to Completed Books shelf
- Parent notified in portal
- One completion bonus per book

### Weekly Goal ✅ LOCKED
- Default: 60 minutes per week (parent adjustable)
- Progress shown on dashboard card
- Resets every Monday
- Completion = +15 pts bonus

---

## Part 7: Gujarati System

### Curriculum (5 Phases) ✅ LOCKED

| Phase | Focus |
|---|---|
| Phase 1 | Foundations — Alphabet, basic sounds |
| Phase 2 | Core Vocabulary — Numbers, colors, family, food |
| Phase 3 | Sentences — Basic building, greetings, phrases |
| Phase 4 | Conversation — Everyday dialogue |
| Phase 5 | Fluency — Reading & writing, short stories |

Parent manually advances Krish to next phase when ready. No automated progression.

### Lesson Structure (4 Components) ✅ LOCKED
1. **Vocabulary** — 5-10 new words with Gujarati script, phonetic, English meaning
2. **Flashcards** — Review previous words, tap to flip, mark known/unknown
3. **Practice** — Fill-in-the-blank or matching exercises
4. **Writing** — Trace or type Gujarati characters (Phase 3+, optional)

Parent can enable/disable components per lesson. Typical length: 10-20 minutes.

### Session Tracking ✅ LOCKED
- Built-in auto-timer during lesson
- Both time spent AND lesson completion tracked separately
- Mid-lesson resume available same day, expires at midnight
- Parent sees both metrics in activity log

### Points ✅ LOCKED
```
Per lesson:              10 pts × phase multiplier
                         (Phase: 1×, 1.5×, 2×, 2.5×, 3×)

Time bonus:              +1 pt per 5 min

Perfect practice score:  +5 pts

Phase completion:        +50 pts (parent marks)

All values:              Configurable in Parent Portal
```

### Progress Visualization ✅ LOCKED
- **Dashboard card:** Current phase + progress bar, words learned counter, study streak
- **Module view:** Phase roadmap, lesson grid, words gallery, stats
- **Parent Portal:** Session history, lesson notes, phase advancement controls

### Parent Involvement ✅ LOCKED
- Create custom lessons in Parent Portal
- Add notes/instructions per lesson
- Enable/disable lesson components
- See struggle words (marked "unknown" in flashcards)
- Manually advance phases
- Audio pronunciation: deferred to v2

---

## Part 8: Goals System

### Goal Creation ✅ LOCKED
- Parent creates directly in Parent Portal
- Krish suggests goals → requires parent approval before activating
- Both types identical once active
- Form: type, target, time period, custom name, completion reward points

### Goal Types ✅ LOCKED
- **Weekly** — Resets every Monday
- **Monthly** — Resets every 1st of month
- **Custom Period** — Parent sets specific start/end date
- **Maintenance** — Sustain a metric above threshold (daily micro-bonus)
- **Collaborative** — Parent + Krish work toward shared target
- Goal cloning/duplication available for recurring setups

### Predefined Goal Templates (18) ✅ LOCKED
Play X games, Score X points, Complete X trivia questions, Maintain habit streak, Read X minutes, Complete X Gujarati lessons, Complete X homework assignments, Complete X daily quests, Log mood X times, Kung Fu sessions, Perfect quest days, Trivia accuracy %, Earn points from X activity types, Complete all habits daily, Unlock X badges, No missed homework, Kung Fu flashcard study minutes, Book completion

### Goal Difficulty Levels ✅ LOCKED

```
Easy:      1× (historical baseline)
Medium:    1.5×
Hard:      2×
Expert:    3×

System suggests difficulty based on historical performance
Adaptive suggestion after 3 consecutive completions at same level
Parent can adjust difficulty of active goal anytime
```

### Completion Bonus Amounts ✅ LOCKED

| Period | Base | Easy | Medium | Hard | Expert |
|---|---|---|---|---|---|
| Weekly | 50 pts | 50 | 75 | 100 | 150 |
| Monthly | 150 pts | 150 | 225 | 300 | 450 |
| Custom | Parent sets | Parent sets × multiplier |

Additional bonuses:
- **Goal streak bonus:** Consecutive completions → stacking extra pts (shown as 🔥)
- **Early completion:** Weekly 2+ days early = +10 pts; Monthly 5+ days early = +25 pts
- **Maintenance goals:** +5 pts/day condition met + full period bonus if maintained throughout
- **Collaborative goals:** Bonus split proportionally by contribution (parent decides allocation)

### Partial Completion (Tiered Credit) ✅ LOCKED

| Progress | Credit |
|---|---|
| 0-49% | No points |
| 50-74% | 25% of bonus |
| 75-89% | 50% of bonus |
| 90-99% | 75% of bonus |
| 100% | Full bonus × multiplier |

- "Almost there" notifications at 75%, 90%, and 1 day remaining
- Collaborative goal partial credit split proportionally
- Parent can disable partial credit per goal
- Parent can manually award full credit

### Overdue & Expired Goals ✅ LOCKED
- Goals expire at midnight — no grace period
- Partial credit auto-calculated and awarded at expiry
- Moves to "Past Goals" history with ✅ or ⏰ status
- No carry-over of progress (fresh start each period)
- Parent notified if goal expires under 50% complete
- Recurring goals: auto-reset each period, progress clears, streak tracked separately
- Goal pause: Parent can pause anytime (deadline extends by days paused)
- Recovery Day auto-pauses daily-activity goals (doesn't count as miss)
- Goal abandonment: Parent or Krish (with approval) can cancel active goal
- Carry-over limit: Maximum 2 carry-overs per goal → auto-archives with parent suggestion
- Active goal limits: Max 3 weekly + 2 monthly active simultaneously

---

## Part 9: Category Mastery System

### Display Locations ✅ LOCKED
- **Trivia module:** 16-category grid with star ratings
- **Dashboard card:** Top 3 strongest + 1 weakest category
- **Parent Portal:** Full breakdown with raw accuracy %

### Category-Specific Stats ✅ LOCKED
- Questions answered, accuracy, streaks (current/longest)
- Response times (average + personal best)
- Hints used, points earned, improvement rate
- Per-difficulty accuracy breakdown (4 tiers)
- Progress toward next mastery level
- Wrong answer pool (most-missed questions)
- Status: active | struggling | neglected
- Active goal linking

### Features ✅ LOCKED
- All 16 categories available Day 1
- Favorite category vs. strongest category displayed distinctly
- Weak/neglected category recommendations
- Wrong Answer Review per category (most-missed first)
- Category recovery celebration animation
- Parent notification if category < 50% after 15+ questions
- Quest bias toward weak categories (configurable)
- Category goal progress overlay on category cards

---

## Part 10: Daily Challenge Mode

### Structure ✅ LOCKED
- 4 games in randomized order (determined at midnight daily)
- Difficulty progression: Easy → Medium → Medium → Hard
- 4 selectable challenge modes: Rookie/Pro/Legend/Master (multipliers 1.5×/2.5×/3×/4×)
- 3 lives (lose game = −1 life)
- Points awarded per game + lives remaining bonus (+25 pts/life) + clean sweep bonus (+200 pts)

### Game Selection Algorithm ❓ UNDEFINED
```
LOCKED: 4 games per day, randomized order, predetermined at midnight

UNDEFINED:
- How are 4 games selected from the 4 available games?
  (Always all 4? Always different ones? Random subset?)
- Exact randomization algorithm
- Whether selection changes if daily reset happens (unlikely but unclear)
```

### Loss Conditions & Lives ✅ LOCKED
- Wordle: Fail in 6 attempts
- Quick-Fire: Lose all 3 lives
- Word Scramble: Fail to solve required words in time
- Hangman: Run out of letter guesses
- Lives display persistent (❤️❤️❤️), last life warning (pulsing red)
- Hints allowed (cost points as normal), forfeit option with confirmation

### Points Calculation ✅ LOCKED
```
Per-game points:        Base × difficulty multiplier
All 4 games:            Summed
Lives bonus:            +25 pts per remaining life
Challenge multiplier:   Applied to total (1.5×/2.5×/3×/4×)
Clean sweep bonus:      +200 pts (before multiplier)
Near clean sweep:       +50 pts (4 wins, 1 life lost)
```

### Results Screen ✅ LOCKED
- Personalized motivational message
- Tomorrow's countdown timer
- Animated score reveal
- Challenge streak display
- Personal best comparison
- Badges earned this challenge

### Leaderboards ✅ LOCKED
- Separate per mode (Rookie/Pro/Legend/Master)
- Four time views: All-time, This week, This month, Streak board
- Top 50 entries per mode
- Completion rate shown
- Personal best notification when beaten

### Leaderboard Ranking Algorithm ❓ UNDEFINED
```
LOCKED: Top 50 entries, separate per mode, 4 time views

UNDEFINED:
- Exact ranking criteria (score? completion rate? streak?)
- Tie-breaking algorithm
- How "Streak board" differs from other boards
- Whether Krish's personal scores appear separately
```

---

## Part 11: Streak Recovery System

### Recoverable Streaks (5 Core Types) ✅ LOCKED
- Daily activity streak
- Daily quest streak
- Daily goal streaks (weekly + monthly)
- 11 habit-specific streaks
- Daily Challenge streak

### Recovery Mechanics ✅ LOCKED
```
Streak breaks:      At midnight if activity incomplete
Recovery window:    Next 24 hours
Free recovery:      1 per streak type per month (restores to yesterday's count)
Paid recovery:      Points-based (restores to yesterday's count)
Does NOT advance:   Recovery prevents loss but doesn't advance streak
```

### Free Recovery Cadence ✅ LOCKED
- Per streak type per month (each streak gets 1 free)
- Resets on 1st at midnight (local timezone)
- No carryover
- Parent can grant additional free recovery mid-month

### Paid Recovery Cost ✅ LOCKED
```
Base cost per streak type:
  Activity:    50 pts
  Quest:       50 pts
  Challenge:   60 pts
  Goals:       40-75 pts
  Habits:      30 pts

Optional scaling:  +10 pts per 10 days of streak (caps at +50 pts)
Configurable:      Parent Portal
```

### UI/UX & Notifications ✅ LOCKED
- 2-step notification on streak break
- Detail panel with cost, 24h countdown, confirmation
- Success message with next-action guidance
- Streak card glow animation
- Personal recovery history visible
- 24h countdown reminders (12h, 6h)

### Parent Controls ✅ LOCKED
- Override/grant recovery per streak type
- Toggle recovery on/off per streak type
- Custom point costs, free cadence, scaling
- Recovery usage dashboard + recommendations

---

## Part 12: Badge System (~400+ badges)

### Badge Tiers ✅ LOCKED
- 4 tiers per badge category
- Names aligned with selected difficulty theme (Rookie/Pro/Legend/Master, etc.)
- Unlock triggers celebration animation + notification

### Badge Categories ✅ MOSTLY LOCKED
- Games (20+ badges) — volume, mastery, streaks, comebacks
- Trivia (50+ badges) — volume, accuracy, speed, per-category, streaks
- Homework (20+ badges) — volume, on-time, early, per-subject, streaks
- Kung Fu (20+ badges) — sessions, classes, home practice, flashcards, belts, attendance, performance
- Habits (40+ badges) — overall, per-habit streaks, daily completions, early bird, custom habits
- Mood (15+ badges) — logging volume, streaks, self-awareness, positive, resilience
- Reading (20+ badges) — sessions, time, completions, streaks, genre explorer, ratings, marathons
- Gujarati (20+ badges) — lessons, vocabulary, time, streaks, phases, writing, consistency
- Daily Quests (15+ badges) — volume, perfect days, streaks, early completion, quest variety
- Points Milestones (15+ badges) — lifetime total, daily goals, big days, consistent earning, monthly
- Streaks (10+ badges) — activity streaks, 100-day super badge, 365-day year-round, multi-streak, recovery
- Special/General (30+ badges) — explorer, badge collection, balance, feedback, themes, parent's pride, seasonal
- Calendar (5+ badges) — personal items, appointments, family connector, planner
- Data Hygiene (1 badge) — backup champion

### Badge Unlock Conditions ❓ SOME UNDEFINED
Most badges have specific unlock conditions, but some are vague:
- "Balanced Earner" — exact criteria unclear
- "Milestone celebrations" trigger — not specified
- Some "Special" badges lack specific unlock criteria

---

## Part 13: Homework System

### Time Estimates ✅ LOCKED
- No system-generated estimate
- Parent sets estimate at creation
- Krish enters his own estimate when starting
- Parent sees both, can approve/adjust in Parent Portal

### Subjects ✅ LOCKED
- Predefined: Math, Science, English, Social Studies, History, Art, Music, PE, Other
- Each subject color-coded
- Parent can add, rename, or hide subjects in Parent Portal

### Points Formula ✅ LOCKED
```
Base Points (Priority):  Low=5, Medium=10, High=15
Time Bonus:              +1 pt per 15 min estimated
Deadline Multiplier:     On-time = ×1.5 | Late = ×0.5
Total = (Base + Time Bonus) × Deadline Multiplier
```

### Late & Missed ✅ LOCKED
- Late (any number of days): flat −50% penalty
- Never completed: marked missed, logged for parent, no points
- Parent can configure optional point deduction
- Parent can always override points manually

---

## Part 14: Kung Fu System

### Session Logging ✅ LOCKED
- Type field: Class vs. Home Practice
- Missed class triggers parent portal notification
- Both parent and Krish can log sessions

### Points ✅ LOCKED
```
Session:              +10 pts per 30 min
Flashcards:           +5 pts per 15 min (requires parent approval)
```

### Habit Linking ✅ LOCKED
- Auto-links to Exercise habit by default
- Parent can configure linked habits (change, add multiple, or disable)
- Increment happens silently on session log

### Belt Progression ✅ LOCKED
- Parent manually marks belt advancement
- Current belt and next target belt displayed
- Belt history tracked

---

## Part 15: Mood System

### Points ✅ LOCKED
```
Base:               1 pt per log
3+ day streak:      3 pts
7+ day streak:      5 pts (stays at 5 indefinitely)
```

### Mood Options ✅ LOCKED
- 😄 Great, 😊 Good, 😐 Okay, 😕 Not great, 😢 Bad, 😡 Angry
- Optional energy level (1-10) and optional notes (200 char soft limit, live counter)
- Mood trends shown (last 7 days)

### Privacy ✅ LOCKED
- Krish can mark entries as sensitive/private
- Parent view hides sensitive entries by default
- Parent can choose to reveal sensitive entries if needed

### Display ✅ LOCKED
- Last 7 days emoji strip on dashboard card
- Full trends view inside module: weekly mood chart, energy level graph, most common mood, best energy day, monthly calendar view
- All visual, no raw numbers shown to Krish
- Mood streak visual on dashboard card
- Badges for mood logging and streaks (all 4 tiers)

### Parent Visibility ✅ LOCKED
- All mood entries visible in activity log (sensitive hidden by default)
- Same visual trends as Krish
- Gentle alert after 3+ consecutive 😢 or 😡 entries ("worth checking in" framing)

---

## Part 16: Chores System (HA Dashboard)

### Architecture ✅ LOCKED
- **Chores live in the HA Dashboard — NOT the Activity Board**
- Activity Board has no Chores module in v1
- Bidirectional sync deferred to v2
- Chore points deferred to v2 (no Activity Board points for chores in v1)

### Chore Rules ✅ LOCKED
- Points auto-awarded on completion — parent can review and reverse
- Per-chore parent settings: carry-over vs. expire, optional point deduction on miss
- Points based on priority (parent sets values per priority level)
- Missed chores: marked as missed at midnight, logged for parent
- Self-directed chores require parent approval of point value before activating
- Parent can modify chore point values anytime

### HA Integration ✅ LOCKED
- Bidirectional HA calendar sync: deferred to v2
- Calendar-triggered chores: deferred to v2
- v1: Parent manually creates date-specific chores in HA Dashboard

---

## Part 17: Notifications System

### Krish Notification Types ✅ LOCKED
**Achievements & Rewards:** Badge unlocked, streak milestone, daily goal met, all quests complete, bonus points  
**Games & Trivia:** New game unlocked, personal best beaten, new difficulty unlocked, category mastery level up  
**Habits:** Streak milestone, auto-completion, new habit added  
**Calendar:** New event, changed/cancelled, chore rule triggered, reminder due  
**Homework:** New assignment, due tomorrow, overdue  
**Reading & Gujarati:** Weekly goal met, book completed, phase advanced, new lesson available  
**Goals:** Weekly/monthly goal met, deadline approaching, quest expiring soon  
**Streak Protection:** Streak at risk warning, recovery used, approaching points cap  
**Family:** Added to family calendar event  
**System:** New trivia questions added, new feature unlocked  
**General:** Parent message, recovery day set, quest swapped, daily bonus multiplier increased

### Parent Notification Types ✅ LOCKED
**Anti-Cheat:** Suspicious activity, unusual points spike, clock manipulation  
**Wellbeing:** 3+ consecutive difficult mood days, major streak milestone, significant achievement  
**Homework/Chores:** Homework complete, overdue, time estimate needs approval, self-directed chore needs approval  
**Kung Fu:** Missed class, flashcard needs approval  
**Habits/Goals:** Custom habit suggested, goal complete, goal behind pace  
**Calendar:** Krish added calendar item, HA sync occurred, chore rule triggered  
**System:** Backup status, localStorage limit warning, portal login attempt

### Priority Levels ✅ LOCKED
- 🔴 High: Immediate, persistent banner, sound always plays, cannot dismiss without acknowledgement
- 🟡 Medium: 8s toast, stored in panel
- 🟢 Low: 4s toast, stored in panel, sound optional

### Do-Not-Disturb ✅ LOCKED
```
School Hours:  Calendar-aware (only on actual school days), low + medium held
Bedtime:       Fixed window, all held except High
Focus Mode:    Manual parent trigger
High priority: Always bypasses all quiet hours
Held:          Batch-delivered when period ends
```

### Preferences ✅ LOCKED
- Krish: sound on/off, per-event sound toggles
- Parent: any notification type on/off, quiet hours, email vs portal-only, frequency
- High priority: cannot be fully disabled (delivery method only)

---

## CRITICAL GAPS IDENTIFIED ❓

### Algorithms Not Fully Defined:

1. **Quest Generation Algorithm**
   - Current: "Filter pool, max 1 points/streak quest, no duplicates, calendar-aware"
   - Missing: Random selection method (weighted? uniform?), bias calculations, exact cost percentage calculation

2. **Daily Challenge Game Order**
   - Current: "4 games in randomized order determined at midnight"
   - Missing: Selection algorithm for which 4 games, exact randomization method

3. **Leaderboard Ranking**
   - Current: "Top 50 entries, 4 time views, completion rate shown"
   - Missing: Exact ranking criteria, tie-breaking algorithm, "Streak board" definition

4. **Trivia Question Selection**
   - Current: "Correct answers don't repeat 14 days, wrong resurface 3-7 days weighted by miss count"
   - Missing: Exact weighting formula, how "weighted by miss count" is calculated numerically

5. **Word Selection for Games**
   - Current: Difficulty tiers defined (Easy 4-5 letters, etc.)
   - Missing: Word list source, algorithm for selecting specific word per difficulty, word pool size

6. **Hangman Word Selection**
   - Current: Categories available
   - Missing: Word selection algorithm, obscure vs. common word balance

7. **Badge Unlock Conditions**
   - Current: Most specified
   - Missing: Some "Special" badges lack clear unlock criteria (e.g., "Balanced Earner")

8. **Anti-Cheat Detection** ❓
   - Mentioned in notifications ("Suspicious activity, unusual points spike, clock manipulation")
   - Missing: What constitutes suspicious? Points spike thresholds? Clock manipulation detection method?

9. **Performance Optimization Thresholds** ❓
   - Current: "Archive calendar after 1 year"
   - Missing: When to archive activity history? When to delete notifications? Cache invalidation strategy?

10. **Parent Portal Recommendation Engine** ❓
    - Current: "AI insights + recommendations, anomaly detection"
    - Missing: How are insights generated? What is anomaly threshold? What recommendations are made?

### Specifications That Need Clarification:

1. **Exact Notification Wording** — All notification messages need finalization
2. **Animation Timing** — Celebration animations, transitions not specified
3. **Visual Specifications** — Colors beyond "seasonal", icon styles, typography
4. **Sound Effects List** — Which sounds for which events? Audio files?
5. **Daily Bonus Streak Visual** — How is the 🔥 flame and "continuous colored arc" rendered?
6. **Game Resume Logic** — "Session auto-saves continuously" — save frequency? Data structure?
7. **Trivia Session State** — Mid-session abandon behavior in detail
8. **Hint System Phases** — Exact transitions between phases based on question count
9. **Quick-Fire Timer Options** — What are the available timers per category?

---

## Summary

✅ **COMPREHENSIVE:** All major logic, calculations, and mechanics are defined  
✅ **GAME SYSTEMS:** All 4 games, trivia, habits, reading, gujarati systems fully specified  
✅ **POINTS ECONOMY:** Complete with multipliers, bonuses, and all activity types  
✅ **BADGES:** ~400+ badges with detailed unlock conditions  
✅ **NOTIFICATIONS:** All notification types and priority levels defined  

❓ **MINOR GAPS:** Some algorithms need detail (quest generation, word selection, anti-cheat)  
❓ **CLARIFICATIONS NEEDED:** Exact wording, animation timing, visual specifications  

**NEXT STEPS:** Can now begin development with high confidence. Gaps are refinements, not blockers.

