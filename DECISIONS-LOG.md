# Activity Board — Decisions Log

**Created:** 2026-06-17  
**Status:** Living document — updated as decisions are made  
**Purpose:** Single source of truth for all locked decisions. References BUILD-DECISIONS-FINAL.md for original approved specs. This log captures all refinements, additions, and changes made during the detailed review sessions.

---

## ARCHITECTURE

### File Structure
- Modular HTML files per section (not one monolithic file)
- `index.html` — main dashboard shell
- `parent-portal.html` — password-protected parent mode (inside same app, v1)
- `module-games.html`, `module-trivia.html`, `module-chores.html`, `module-homework.html`, `module-kungfu.html`, `module-habits.html`, `module-mood.html`, `module-reading.html`, `module-gujarati.html`, `module-calendar.html`
- `shared/` folder:
  - `state.js` — state management + localStorage
  - `config.js` — all configurable values (single source of truth for Parent Portal settings)
  - `events.js` — cross-module event bus (modules never reference each other directly)
  - `theme.js` — seasonal CSS variables + theme switching
  - `styles.css` — shared base styles

### Modularity Principles
- Each module owns its state slice, render function, and event handlers
- Cross-module communication via `events.js` event bus only
- Adding/removing a module requires no changes to other modules
- All colors use CSS variables — zero hardcoded colors anywhere

### Platform
- v1: Chrome browser
- v2: PWA (Progressive Web App) — standalone installable app on dashboard display
- On-screen pop-up keyboard required for any text input (no physical keyboard on dashboard)

### Parent Portal
- v1: Password-protected parent mode inside same HTML file
- v2: Google Drive as middleware (separate interface reading/writing Drive JSON)

---

## POINTS ECONOMY

### Core Rules
- Points accumulate permanently — no decay
- Default floor: zero (parent can enable negative points in Parent Portal)
- Default cap: none (parent can set a daily cap in Parent Portal)
- Negative points: requires confirmation dialog listing all affected penalty systems + option to set a negative floor (e.g. −50 pts)
- Daily cap: Parent Portal shows Daily Goal Estimator + warning if cap set below daily goal + Krish sees visual indicator as he approaches cap

### Daily Bonus Multiplier Tiers
- Days 1–2: 1.0×
- Days 3+: 1.1×
- Days 7+: 1.2×
- Days 14+: 1.5×
- Days 30+: 2.0×

### Points by Activity
| Activity | Points |
|---|---|
| Trivia Level 1 correct | 10 pts |
| Trivia Level 2 correct | 15 pts |
| Trivia Level 3 correct | 20 pts |
| Trivia Level 4 correct | 30 pts |
| Trivia speed bonus (<10s) | +3 pts |
| Quest completion (all 3) | +50 pts bonus |
| Mood logging (base) | 1 pt |
| Mood logging (3+ day streak) | 3 pts |
| Mood logging (7+ day streak) | 5 pts (stays at 5) |
| Reading | Time-based (rate TBD — Reading section review) |
| Calendar | No points |
| Chores | Priority-based (parent sets values) |
| Homework | Base + time bonus + deadline multiplier |
| Kung Fu session | +10 pts per 30 min |
| Kung Fu flashcards | +5 pts per 15 min (after parent approval) |
| Habits | TBD — Habits section review |

### Hint Costs (All Games & Trivia)
- 1st hint: −5 pts
- 2nd hint: −10 pts
- 3rd hint: −20 pts
- Escalating, configurable in Parent Portal (global default + per-game override)
- **Tokens deferred to v2** — v1 uses points directly

### Wrong Answer Penalties
- Games: No direct point deduction for wrong answers (losing lives/attempts is consequence)
- Trivia: No point deduction for wrong answers

---

## GAMES

### Cross-Game Rules
- Difficulty multipliers (global, no per-game override): Easy 1×, Medium 1.5×, Hard 2×
- Lives/attempts bonuses:
  - Quick-Fire + Hangman share one setting: +2 pts per life remaining
  - Wordle: +5 pts per attempt remaining
  - Word Scramble: +2 pts per word solved on first attempt
- On-screen keyboard displays letter states for Wordle and Hangman
- No life lost for duplicate letter guess (prevented visually by keyboard)
- Session auto-saves continuously; resume prompt shown if same calendar day; expires at midnight
- Declined resume = session abandoned, no points

### Wordle
- **Word length:** Easy 4–5 letters, Medium 5–7 letters, Hard 7–9 letters
- **Timer:** Untimed — scoring based on attempts remaining only
- **Hint penalties:** −5, −10, −20 pts (escalating, Parent Portal adjustable)
- **Scoring:** Base 10 pts × difficulty + (attempts remaining × 5 pts speed bonus)
- **Hints:** 3 available (Category, First Letter, Definition)
- **Input:** On-screen keyboard + letter grid

### Quick-Fire Trivia
- **Structure:** Lives-based — play until 3 wrong answers (no fixed question count)
- **Category:** Player picks specific category or "Random Mix" before session
- **Scoring:** (10 × difficulty multiplier) × combo multiplier + speed bonus
- **Combo multipliers:** 3+ correct = 1.1×, 5+ = 1.25×, 7+ = 1.5×
- **Speed bonus:** +5 pts if answered in <50% of selected timer
- **Lives bonus:** +2 pts per life remaining at game end
- **Input:** Multiple choice (no keyboard needed)

### Word Scramble
- **Input:** Draggable/tappable letter tiles (primary); on-screen keyboard fallback
- **Hints:** Category, First Letter, Definition — −5, −10, −20 pts
- **Scoring:** (10 × difficulty) + 5 speed bonus (if solved in <10s) + 2 first-attempt bonus
- **Hint penalties deducted separately**
- **All values adjustable in Parent Portal**

### Hangman
- **Scoring:** (10 × difficulty) + (lives remaining × 2) + 5 speed bonus (if solved in <2 min)
- **Hint penalties:** −5, −10, −20 pts (same escalating scale)
- **Duplicate letter:** "Already guessed!" message, no life lost (prevented by on-screen keyboard)
- **Visual:** Classic stick figure progression
- **Input:** On-screen keyboard

### Games Quest Pool (20 quests)
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

## TRIVIA SYSTEM

### Question Structure
```javascript
{
  uuid: "q001",
  question: "What is the capital of India?",
  options: ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
  correct: "Delhi",
  category: "Geography",
  difficulty: "level1", // level1 | level2 | level3 | level4
  funFact: "Delhi has been the capital since 1931...",
  enhancedFunFact: "Detailed learning fact shown on 2nd wrong answer",
  hint: "It's on the Yamuna River",
  learnMoreLinks: [],
  tags: ["India", "Capitals", "Asia"],
  addedDate: "2026-06-17"
}
```

### Question Bank
- **Size:** 1,000 questions at launch (Claude curated), expandable
- **Storage:** IndexedDB with `_meta` version record for seamless updates
- **Distribution across 4 levels:** Level 1 (30%), Level 2 (30%), Level 3 (25%), Level 4 (15%)
- **Parent Portal:** Can review, edit, and add questions

### 16 Categories
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

### 4 Difficulty Levels (Unified with Category Mastery)
| Level | Unlock Requirement |
|---|---|
| Level 1 | Always available |
| Level 2 | 80% accuracy on last 20 Level 1 questions |
| Level 3 | 80% accuracy on last 20 Level 2 questions |
| Level 4 | 90% accuracy on last 30 Level 3 questions |

### 11 Difficulty Themes (Player Selects in Settings)
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

Theme names apply everywhere: difficulty selector, category mastery display, badge names, unlock progression notifications. Parent can add custom themes in Parent Portal.

### Category Mastery Levels
Aligned with difficulty theme names. Thresholds:
- Level 1 (e.g. Rookie): 10+ questions answered in category
- Level 2 (e.g. Pro): 70%+ accuracy on 20+ questions
- Level 3 (e.g. Legend): 80%+ accuracy on 40+ questions
- Level 4 (e.g. Master): 90%+ accuracy on 60+ questions

Display: star rating grid for all 16 categories inside trivia module. Visual bars, no raw percentages shown to Krish.

### Session Structure
- Session-based: Krish picks 5, 10, or 20 questions before starting
- Pre-session choices: Category (specific or Random Mix), Difficulty, Session length
- Last selections remembered
- Krish can change choices mid-session (abandons current session, no points awarded)
- Parent can customize available session lengths and set maximum in Parent Portal
- Parent can force "Random Mix" category (prevents cherry-picking)
- Results summary at end: score, accuracy, category breakdown, fun facts reviewed

### Question Cycling
- Correct answers: don't repeat for 14 days
- Incorrect answers: resurface in 3–7 days (weighted by miss count — more misses = sooner)
- Wrong-answer pool prioritized over unseen questions
- Category greyed out when questions exhausted (shows days until refresh)
- All thresholds configurable in Parent Portal

### Hint System
- One hint per question (`hint` field text)
- Phase 1 (0–20 questions in category): Hint button prominent, green, "Get a Hint"
- Phase 2 (21–50 questions): Hint button smaller, gray, "Hint (−5 pts)"
- Phase 3 (50+ questions): Hint hidden by default; "Need a hint?" text appears after 15s
- Once revealed, hint stays visible; button disabled (no double-dipping)
- Per-category phase tracking; resets when new category started
- All thresholds configurable in Parent Portal

### Fun Fact Display Rules
- **Correct answer:** `funFact` shown (celebratory context)
- **1st wrong answer:** `hint` shown, question stays active
- **2nd wrong answer:** `enhancedFunFact` + correct answer revealed
- **Question skipped:** `funFact` only, no pressure
- Fun facts never auto-dismiss — Krish taps "Next Question →"

### Learn More Integration
- "Learn More →" link appears after every question below fun fact
- Opens category's curated resources in a modal (3–5 links per category, Claude-curated)
- Non-intrusive — skippable
- Links open in new tab
- Usage tracked, visible to parent in portal
- Sources: Wikipedia, Khan Academy, National Geographic, BBC Bitesize
- Parent can audit and update links in Parent Portal; manual review recommended once per season

### Stats Tracking
- Total answered, correct, streak, longest streak, overall accuracy
- Per-category accuracy
- Per-difficulty accuracy
- Wrong-answer pool with decay weights
- `fastestCorrectAnswer` — personal best response time per category
- `favoriteCategory` — auto-calculated from most-played
- `totalHintsUsed` — across all trivia
- `trivia.onboarding` removed — name/avatar in `state.profile` only

### Stats Display
- Dashboard card: compact (streak, today's accuracy, favorite category)
- Trivia module: full visual breakdown (category bars, difficulty progress, personal bests, hint trend)

### Daily Limit
- No default limit — parent can set a daily question cap in Parent Portal

---

## CHORES

### Architecture (IMPORTANT)
- **Chores live in the HA Dashboard — NOT the Activity Board**
- Activity Board has no Chores module in v1
- Bidirectional sync (HA Dashboard ↔ Activity Board) is v2
- Chore points deferred to v2 (no Activity Board points for chores in v1)
- Eventually manageable from both places (v2)

### Chore Rules (Apply in HA Dashboard)
- Points auto-awarded on completion — parent can review and reverse
- Per-chore parent settings: carry-over vs. expire, optional point deduction on miss
- Points based on priority (parent sets values per priority level)
- Missed chores: marked as missed at midnight, logged for parent
- Self-directed chores require parent approval of point value before activating
- Parent can modify chore point values anytime

### HA Integration
- Bidirectional HA calendar sync: deferred to v2
- Calendar-triggered chores: deferred to v2
- v1: Parent manually creates date-specific chores in HA Dashboard

---

## HOMEWORK

### Time Estimates
- No system-generated estimate
- Parent sets estimate at creation
- Krish enters his own estimate when starting
- Parent sees both, can approve/adjust in Parent Portal

### Subjects
- Predefined: Math, Science, English, Social Studies, History, Art, Music, PE, Other
- Each subject color-coded
- Parent can add, rename, or hide subjects in Parent Portal

### Points Formula
```
Base Points (Priority):  Low=5, Medium=10, High=15
Time Bonus:              +1 pt per 15 min estimated
Deadline Multiplier:     On-time = ×1.5 | Late = ×0.5
Total = (Base + Time Bonus) × Deadline Multiplier
```

### Late & Missed
- Late (any number of days): flat −50% penalty
- Never completed: marked missed, logged for parent, no points
- Parent can configure optional point deduction
- Parent can always override points manually

---

## KUNG FU

### Session Logging
- Type field: Class vs. Home Practice
- Missed class triggers parent portal notification (reminder to schedule makeup)
- Both parent and Krish can log sessions

### Points
- Session: +10 pts per 30 min
- Flashcards: +5 pts per 15 min (requires parent approval first)
- Built-in Start/Done timer for flashcard study sessions

### Habit Linking
- Auto-links to Exercise habit by default
- Parent can configure linked habits (change, add multiple, or disable) in Parent Portal
- Increment happens silently on session log

### Belt Progression
- Parent manually marks belt advancement
- Current belt and next target belt displayed
- Belt history tracked

---

## DAILY QUESTS

### Core Rules
- 3 random quests per day from pool
- Filter pool to unlocked games/activities only
- 1 free swap per day (parent can adjust number, optionally require points cost)
- Quest swap cost: contextual warning shows cost as % of daily goal
- No penalty for incomplete — missing +50 bonus is the only consequence
- Quest streak: counts fully completed days only
- Missed quests logged for parent visibility
- Midnight reset

### Quest Pool — Games (20 templates)
See Games section above.

### Quest Pool — Chores (10 templates)
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

### Quest Pool — Homework (10 templates)
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

### Quest Pool — Kung Fu (11 templates)
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

### Quest Pool — Habits (10 templates)
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

### Quest Pool — Mood (10 templates)
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

### Quest Pool — Reading (12 templates)
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

### Quest Pool — Gujarati (12 templates)
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

### Quest Pool — Cross-Module & General (15 templates)
1. Complete activities in 5 different sections today
2. Hit your daily points goal
3. Complete all 3 daily quests
4. Log at least one activity in every section today
5. Earn 100+ points in a single day
6. Earn 200+ points in a single day
7. Complete a quest from 3 different categories
8. Maintain daily activity streak for 7 days
9. Complete a game AND a homework assignment on the same day
10. Complete a Kung Fu session AND study Gujarati on the same day *(calendar-aware)*
11. Log mood, habits, and reading all in one day
12. Complete all chores AND all homework on the same day
13. Use the app 5 days in a row
14. Earn points before 10am
15. Complete an activity in every section this week

### Quest Pool — Points & Milestones (10 templates)
*Max 1 points/milestone quest selected per day*
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

### Quest Pool — Streaks & Achievements (12 templates)
*Max 1 streak quest selected per day*
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

### Quest Pool — Parent-Assigned & Special Events (10 templates)
1. Complete a parent-assigned special task
2. Earn a parent bonus
3. Complete a family activity together
4. Help a family member with a task
5. Complete a parent challenge (custom one-time quest)
6. Complete all activities on a school day *(calendar-aware: school days)*
7. Complete a full recovery day checklist *(calendar-aware: recovery days)*
8. Complete 3 activities on a weekend *(calendar-aware: Sat/Sun)*
9. Hit daily goal on a holiday *(calendar-aware: holidays)*
10. Complete a birthday challenge *(calendar-aware: Krish's birthday from state.profile)*

### Quest Pool — Wellness (4 templates)
1. Drink water before starting activities
2. Take a screen break (30+ min away from device)
3. Get outside for 20+ minutes
4. Go to bed on time (parent verifies)

### Quest Pool — Creative (4 templates)
1. Draw or create something today
2. Write a journal entry
3. Practice a musical instrument
4. Create something and share it with a family member

### Quest Pool — Family & Social (4 templates)
1. Help a family member without being asked
2. Share an achievement with a parent
3. Teach someone something you learned today
4. Complete a family activity together

### Calendar-Aware Quest Rules
Quests only appear in pool when condition is true:
- **Kung Fu class quests:** Kung Fu class scheduled (parent sets class days in Settings)
- **School day quests:** Today is a school day (parent sets school days in Settings, Mon–Fri default)
- **Weekend quests:** Today is Saturday or Sunday (auto-detected)
- **Holiday quests:** Today is marked as holiday (parent marks in Settings)
- **Birthday quest:** Today matches `state.profile.birthDate`
- **Homework quests:** Homework assigned in Activity Board today
- **Milestone quests:** Player is close to achieving the milestone

### Quest Generator Rules
- Filter pool to unlocked games/activities only
- Maximum 1 points/milestone quest per day
- Maximum 1 streak quest per day
- No duplicate quest types on same day
- Calendar-aware quests excluded when condition not met
- Parent can create custom one-time quests via Parent Portal

---

## RECOVERY DAY

- Included in v1
- Parent marks a busy day, selects which activities to skip
- Streak protected on recovery days
- Parent can write optional message to Krish
- System detects busy days from calendar and suggests recovery day to parent
- Parent approves or dismisses suggestion

---

## LEADERBOARDS

- Personal best tracking — Krish competes against his own past scores
- `playerId` field included from day one for future multi-user
- Views: All-time, This Week, This Month
- Future: shared leaderboards when multiple Activity Boards created (possibly surfaced on HA Dashboard)

---

## DASHBOARD LAYOUT

### Tier Structure (Bento Grid)
- **Top banner:** Daily points progress, streak indicators, daily quests (3 cards)
- **Primary cards (larger):** Games, Trivia, Chores, Homework
- **Secondary cards (smaller):** Habits, Mood, Reading, Kung Fu, Gujarati
- **Utility/compact:** Calendar (read-only), Points history, Achievements

### Calendar (v1)
- Read-only visual reference — shows activity history in calendar format
- No adding calendar items from Activity Board (use HA Dashboard)
- Bidirectional sync deferred to v2

### Customization
- Parent can reorder and resize sections in Parent Portal

---

## MOOD

### Points
- Base: 1 pt per log
- 3+ day streak: 3 pts
- 7+ day streak: 5 pts (stays at 5 indefinitely)

### Mood Options
- 😄 Great, 😊 Good, 😐 Okay, 😕 Not great, 😢 Bad, 😡 Angry
- Optional energy level (1–10) and optional notes (200 char soft limit, live counter)
- Activity tag removed — not needed
- Mood trends shown (last 7 days)

### Privacy
- Krish can mark entries as sensitive/private
- Parent view hides sensitive entries by default
- Parent can choose to reveal sensitive entries if needed

### Display
- Last 7 days emoji strip on dashboard card
- Full trends view inside module: weekly mood chart, energy level graph, most common mood, best energy day, monthly calendar view
- All visual, no raw numbers shown to Krish
- Mood streak visual on dashboard card
- Badges for mood logging and streaks (all 4 tiers)

### Parent Visibility
- All mood entries visible in activity log (sensitive hidden by default)
- Same visual trends as Krish
- Gentle alert after 3+ consecutive 😢 or 😡 entries ("worth checking in" framing)

### State Structure
```javascript
state.mood = {
  entries: [
    {
      id,
      date,
      timestamp,
      emoji: '😊',
      energyLevel: 7,
      notes: 'Had a great day',
      isSensitive: false
    }
  ],
  todayMood: '😊',
  currentStreak: 5,
  longestStreak: 12,
  weeklyEntries: ['😄','😊','😐','😊','😄','😊','😄']
}
```

---

## HABITS

### Predefined Habits (11)
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

### Habit Equivalency System
- Each habit has optional `linkedActivities` array
- Completing linked activity fires event via `events.js` → auto-marks habit complete
- If habit already manually completed, auto-completion ignored (no double points)
- Auto-completion shows subtle notification: "[Habit] auto-completed ✅"
- Parent configures equivalencies per habit in Parent Portal (visual builder)
- One activity can link to multiple habits; multiple activities can link to one habit
- Drink Water and Sleep on Time have predefined chore templates parents can activate

### Custom Habits
- Parent can create custom habits directly (name, emoji, frequency)
- Krish can suggest habits — requires parent approval before activating
- No limit on custom habits
- Habits archived (not deleted) to preserve history

### Check-In UX
- One-tap completion — tap habit card to mark done
- Card shows: habit name, emoji, current streak 🔥
- Completion triggers celebration animation
- Optional skippable note field after tapping
- Completed habits show checkmark with rewarding visual treatment (colored, not grayed out)

### Points
- Default: 5 pts per completion
- Parent can set individual habit point values in Parent Portal
- Streak bonus: +2 pts at 7+ day streak, +5 pts at 30+ day streak
- All values in Daily Goal Estimator

### Missed Day Handling
- Streak resets to 0 on missed day by default
- 1 free recovery per month (no cost)
- Recovery Day protection (parent marks day, all streaks protected)
- Points-based recovery: flat cost (all habits) by default, parent can set per-habit cost
- Number of paid recoveries per month configurable in Parent Portal
- Longest streak always preserved
- Missed habits logged for parent visibility

### Reminders
- No reminders — Krish visually sees uncompleted habits on dashboard
- Browser notifications deferred (not needed for habits)

---

## READING

### Entry Types
| Type | Emoji | Tracks |
|---|---|---|
| Book | 📚 | Minutes |
| Article | 📰 | Minutes |
| Comic/Graphic Novel | 💬 | Minutes |
| Passage/Excerpt | 📄 | Minutes |
| Other | 📖 | Minutes |

All types track time only — no pages tracked.

### Time Tracking
- Built-in Start/Done timer (default, encouraged)
- Manual time entry (fallback)
- Activity log shows which method was used

### Points
- 1 pt per 5 minutes read
- Book/item completion bonus: +10 pts
- Weekly goal completion: +15 pts
- All values configurable in Parent Portal

### Rating System
- 1–5 stars + optional reaction emoji (😄 😊 😐 😕)
- Both optional/skippable
- "Krish's favorites" view shows highest-rated reads

### Genres (10 predefined)
Adventure 🗺️, Fantasy 🧙, Science Fiction 🚀, Mystery 🔍, History 🏛️, Science & Nature 🔬, Biography 👤, Humor 😂, Sports ⚽, Other 📖. Parent can add custom genres.

### Book Completion
- "I finished this book!" checkbox on session log
- +10 pt bonus, celebration animation
- Book moves to Completed Books shelf
- Parent notified in portal
- One completion bonus per book

### Weekly Goal
- Default: 60 minutes per week (parent adjustable)
- Progress shown on dashboard card
- Resets every Monday
- Completion = +15 pts bonus

### State Structure
```javascript
state.reading = {
  entries: [
    {
      id, date, title,
      type: 'book'|'article'|'comic'|'passage'|'other',
      minutesRead,
      timerUsed: true|false,
      rating: 1-5,
      reactionEmoji: '😄'|'😊'|'😐'|'😕'|null,
      genre, notes,
      completed: false,
      completedDate: null
    }
  ],
  booksCompleted: 7,
  totalMinutesRead: 480,
  weeklyGoal: 60,
  weeklyMinutesRead: 35
}
```

---

## GUJARATI

### Curriculum (5 Phases)
| Phase | Focus |
|---|---|
| Phase 1: Foundations | Alphabet, basic sounds |
| Phase 2: Core Vocabulary | Essential words (numbers, colors, family, food) |
| Phase 3: Sentences | Basic sentence building, greetings, phrases |
| Phase 4: Conversation | Everyday dialogue |
| Phase 5: Fluency | Reading & writing, short stories |

Parent manually advances Krish to next phase when ready. No automated progression.

### Lesson Structure (4 Components)
1. **Vocabulary** — 5–10 new words with Gujarati script, phonetic pronunciation, English meaning
2. **Flashcards** — Review previous words, tap to flip, mark known/unknown
3. **Practice** — Fill-in-the-blank or matching exercises
4. **Writing** — Trace or type Gujarati characters (Phase 3+, optional)

Parent can enable/disable components per lesson. Lesson length: 10–20 minutes typical. Parent can add notes per lesson.

### Session Tracking
- Built-in auto-timer runs during lesson
- Both time spent AND lesson completion tracked separately
- Mid-lesson resume available same day, expires at midnight
- Parent sees both metrics in activity log

### Points
- Per lesson: 10 pts × phase multiplier (Phase 1=1×, Phase 2=1.5×, Phase 3=2×, Phase 4=2.5×, Phase 5=3×)
- Time bonus: +1 pt per 5 min
- Perfect practice score: +5 pts
- Phase completion bonus: +50 pts (parent marks phase complete)
- All values configurable in Parent Portal

### Progress Visualization
- **Dashboard card:** Current phase + progress bar, words learned counter, study streak
- **Module view:** Phase roadmap, lesson grid (colored=complete, gray=incomplete), words gallery, stats
- **Parent Portal:** Session history, lesson notes field, phase advancement controls

### Parent Involvement
- Create custom lessons in Parent Portal
- Add notes/instructions per lesson
- Enable/disable lesson components
- See struggle words (marked "unknown" in flashcards)
- Manually advance phases
- Audio pronunciation: deferred to v2

### State Structure
```javascript
state.gujarati = {
  currentPhase: 2,
  phases: [
    { id: 1, name: 'Foundations', completed: true, completedDate: '2026-05-01' }
  ],
  lessons: [
    {
      id: 'lesson-1', phase: 1, name: 'Gujarati Alphabet',
      completed: true, completedDate: '2026-04-15',
      timeSpent: 18, perfectPractice: true, parentNotes: 'Focus on vowels'
    }
  ],
  vocabulary: [
    {
      word: 'namaste', gujaratiScript: 'નમસ્તે',
      meaning: 'Hello/Greetings', phase: 1,
      learnedDate: '2026-04-15', known: true
    }
  ],
  sessionHistory: [
    { date, duration, lessonId, wordsLearned, timerUsed: true, perfectPractice: false }
  ],
  totalWordsLearned: 87,
  totalStudyMinutes: 420,
  currentStreak: 5
}
```

---

## BADGES (ALL MODULES)

---

## PARENT PORTAL

### Architecture (v1)
- Password-protected parent mode inside same HTML file
- No separate app or backend required

### Cross-Dependency Rules
1. **Hint penalties:** Global default (−5/−10/−20) + optional per-game override. Warning shows affected games and which have custom values.
2. **Any point value change:** Live Daily Goal Estimator shown (estimated daily earnings by category, typical total, achievability). Informational only.
3. **Difficulty multipliers:** Global only — no per-game override.
4. **Lives bonuses:** Quick-Fire + Hangman share one setting. Wordle separate. Scramble separate.
5. **Negative points toggle:** Confirmation dialog listing all affected systems + optional negative floor option.
6. **Quest swap cost:** Shows as % of daily goal with recommended range (5–10 pts).
7. **Daily points cap:** Estimator + warning if cap below daily goal. Krish sees visual indicator approaching cap.

### Key Parent Capabilities
- Feature toggles (enable/disable any module)
- Recovery day management
- Activity log with filtering and flagged activity review
- Points adjustment (award bonus, reverse, adjust)
- Goal management (weekly, monthly)
- Notification preferences
- Theme and timezone settings
- Question bank management (trivia)
- Chore/homework/kung fu management
- Reorder/resize dashboard sections

---

## SOUND EFFECTS

- Default: Off (opt-in)
- Events: correct answer, wrong answer, quest complete, achievement unlock, streak milestone, points awarded
- Parent controls default on/off and per-event toggles in Parent Portal

---

## ONBOARDING

- Full onboarding flow planned for v1
- Name and avatar stored in `state.profile` (not in trivia state)
- Profile accessible to all modules via shared state

---

## TOKENS (DEFERRED)

- Hint token system deferred to v2
- v1: hints cost points directly (no separate currency)
- v2: separate token pool earned from perfect games, spent on hints

---

## CALENDAR

### Two Calendar Systems
| | HA Dashboard Calendar | Activity Board Calendar |
|---|---|---|
| Purpose | Family scheduling — what's planned | Krish's personal view — scheduled + history |
| Content | All family events, school, appointments | Krish's events + activity history + personal items |
| Who manages | Parent primarily | Krish (personal items) + auto-generated (history) |
| v1 | Standalone, no AB connection | History + Krish's personal items |
| v2 | Receives AB items (opt-in), triggers chore rules | Shows HA events as layer, full bidirectional sync |

### Activity Data Per Day (History Layer)
Each day cell shows compact visual indicators:
- 🟢/🟡/⭕ Goal achievement dot
- 🔥 Active streak day
- ⭐ Achievement unlocked
- 📚 Reading session, 🎮 Game played
- 😊 Actual mood emoji logged
- 📝 Homework due
- ✅ All quests completed
- Max 2–3 most important shown, tap for full detail

### Day Color Coding
- Deep seasonal color: 100% daily goal met
- Medium seasonal color: 50–99% progress
- Light seasonal color: 1–49% activity
- Gray/neutral: no activity
- White/empty: future day
- Subtle border: today
- Uses seasonal CSS variables — automatic theme matching

### Day Detail View (Slide-up Panel)
**Header:** Date, total points, goal status
**Sections:** Quests, Games, Learning, Habits, Mood, Homework, Achievements, Personal items
Future days show personal items and homework due dates only

### Streak Visualization
- 🔥 flame + continuous colored arc for activity streaks
- ✅ indicator for quest completion days
- Arc gaps make streak breaks clearly visible
- Milestone markers: ⭐ on 7th and 30th consecutive days

### Krish's Personal Items
**9 default item types:**
| Type | Emoji | Links To | HA Sync Default |
|---|---|---|---|
| Reminder | 🔔 | Nothing | Optional |
| Task | ✅ | Nothing | Optional |
| Note | 📝 | Nothing | No (always private) |
| Homework | 📚 | Homework module (bidirectional) | Optional |
| Sports Event | ⚽ | Nothing | Optional |
| Social Event | 🎉 | Nothing | Optional |
| Extra Practice | 💪 | Kung Fu module (if Kung Fu) | Optional |
| General Event | 📅 | Nothing | Optional |
| Appointment | 🏥 | Nothing | ON by default |

- Parent Portal can create custom item types with configurable module links
- Parent can flag any type as "always sync to HA Calendar"
- Tap any day → day detail panel → "Add Item +" button
- Each item: title, type, time (optional), visibility (🔒 Private / 👁️ Shared), HA Sync toggle
- HA Sync toggle: grayed out v1, active v2

### Multi-Person Entries
- Each family member has an assigned color (configured in HA Dashboard settings)
- Multi-person entries display all connected members' colors (split stripe or colored dots)
- Krish only sees entries he's connected to
- "with Mom 👩" indicator shows co-attendees
- Parent manages family member connections in Parent Portal

### All Calendar Data Stored Permanently
- All entries stored regardless of completion status
- `activityHistory` is append-only permanent log
- `personalItems` stores ALL items — scheduled, completed, missed, or ongoing
- Archive after 1 year for performance

### State Structure
```javascript
state.calendar = {
  activityHistory: [
    {
      id, date, timestamp,
      type: 'habit'|'game'|'mood'|'reading'|'gujarati'|'homework'|'quest'|'achievement'|'points',
      title, summary, pointsEarned,
      moduleReference: { module: 'habits', itemId: 'habit-1' }
    }
  ],
  personalItems: [
    {
      id, date, title,
      type: 'reminder'|'task'|'note'|'homework'|'sports'|'social'|'practice'|'event'|'appointment'|'custom',
      emoji, time: null, allDay: true,
      visibility: 'private'|'shared',
      haSyncEnabled: false, haSynced: false,
      linkedModuleId: null, linkedModuleType: null,
      connectedPeople: ['krish', 'mom'],
      completed: false, completedDate: null, notes: null
    }
  ],
  choreRules: [
    {
      id, triggerEventKeyword: 'basketball',
      choresToCreate: [{ name: 'Pack basketball', priority: 'high' }],
      advanceNotice: 60
    }
  ],
  customItemTypes: [
    { id, name, emoji, linkedModule: null, alwaysSyncToHA: false }
  ]
}
```

### v2 Integration Design
**HA Dashboard → Activity Board:**
- Krish-specific events only (filtered by his calendar tag/color)
- Calendar-triggered chore rules fire automatically
- School days, holidays, class days auto-detected
- Recovery day suggestions triggered by busy days
- Recurring events appear as independent occurrences

**Activity Board → HA Dashboard:**
- Personal items (if HA Sync ON or type set to always sync)
- Homework due dates
- Achievement milestones (parent configures)
- Appointments (default sync ON)
- All pushed items tagged "Krish" + "Activity Board" source tag

**Conflict Resolution:**
- HA Dashboard: source of truth for all scheduled events
- Activity Board: source of truth for completion status (completion always wins)
- Last-write-wins for edits, with notification shown in both systems
- 24-hour conflict log for parent review
- Parent can manually resolve in Parent Portal

**Sync:** Instant bidirectional. Queued when offline, fires on reconnect.

**Chore Rule Outputs:**
- Generated chores appear in HA Dashboard chores module
- Also appear as task items on HA Calendar for that day
- Tagged as Krish's color, chore type
- Completion in HA Dashboard marks calendar task complete

### Notification System (All Activity Board Notifications)
- **Step 1:** Simple pointer on HA Dashboard or browser notification: "🔔 3 new notifications in your Activity Board"
- **Step 2:** Full detailed notifications inside Activity Board notification panel (bell icon + unread badge)
- Applies to ALL notification types: calendar changes, achievements, quests, streaks, parent messages, etc.
- Notification history kept 30 days
- Individual or bulk dismiss
- v1: Browser notification pointer + in-app toast
- v2: HA Dashboard notification as primary, Activity Board as detailed view

---

## DASHBOARD LAYOUT (UPDATED)

### Tier Structure (Bento Grid) — Updated
- **Top banner:** Daily points progress, streak indicators, daily quests (3 cards)
- **Primary cards (larger):** Games, Trivia, Homework, Kung Fu *(Chores removed — lives in HA Dashboard)*
- **Secondary cards (smaller):** Habits, Mood, Reading, Gujarati
- **Utility/compact:** Calendar (read-only), Points history, Achievements

---

## POINTS TRACKER MODULE

### Views
**Summary (default):** Category bar chart, daily goal progress ring, current bonus multiplier
**Detailed ledger:** Chronological transactions — time, activity, points, multiplier applied, final points. Filters: date range + activity type.

### Projection
- 7-day rolling average × days remaining
- Simple statements: "At your current pace: ~320 pts this week"
- Requires 3+ days of data, updates daily
- Shown in weekly/monthly summary only

### Weekly/Monthly Visuals
- Weekly: daily bar chart + week-over-week comparison + best day highlight
- Monthly: heatmap grid + total, average, best day/week + projection statement
- Seasonal colors, visual-first

### Parent Visibility
- All Krish views + flagged transaction history, category trend analysis, goal achievement history, manual adjustment panel, Daily Goal Estimator, unusual spike alerts, CSV export

### State Structure
```javascript
state.points = {
  total: 1250, today: 50, weekly: 280, monthly: 1200,
  dailyGoal: 50, dailyBonusMultiplier: 1.1, dailyBonusStreak: 5,
  ledger: [
    {
      id, timestamp, date, activity,
      activityType: 'game'|'trivia'|'habit'|'reading'|'gujarati'|'homework'|'kungfu'|'mood'|'quest'|'bonus'|'manual',
      points, multiplierApplied, finalPoints,
      flag: null,
      moduleReference: { module: 'games', itemId: 'wordle-session-1' }
    }
  ],
  projection: { rollingAverage: 45, weeklyProjected: 315, monthlyProjected: 1350, dataPointsAvailable: 7 },
  cap: null, floor: 0, negativeEnabled: false
}
```

---

## SETTINGS & CUSTOMIZATION

### Two Settings Areas
**Krish's Settings:** Appearance (theme, difficulty theme), Notifications (sounds), Calendar (default view), Profile (name/displayName, avatar)
**Parent Portal Settings (8 tabs):** Goals & Points, Games, Activities, Schedule, Notifications, Access & Security, Data, Advanced

### Krish Controls
- Seasonal theme (freely, anytime — no restriction)
- Difficulty theme (Adventure/Princess/etc.)
- Sound effects on/off + per-event toggles
- Avatar emoji (emoji picker, 5 categories)
- Notification sound volume
- Display name/nickname

### Parent-Only Controls
- All point values, goals, caps, floors
- Module visibility/enable
- Difficulty unlock requirements
- Hint penalties, quest swap rules
- Chore rules, custom item types
- Family member colors
- Data export, reset, backup

### Krish Can Request (Parent Approves)
- Custom habits, custom calendar item types, daily goal adjustment

### Avatar
- v1: Emoji picker (20–30 options, 5 categories)
- v2: Full custom avatar creator (unlockable items via badges)

### Data Management
- Export: CSV (activity history, points ledger, trivia performance), iCal (calendar). Parent-only, timestamped.
- Reset levels: Module reset, Points reset, Full reset — all require typed confirmation ("TYPE RESET TO CONFIRM")
- v1: Manual JSON backup/restore
- v2: Google Drive auto-backup

### Additional Settings (8)
- Language/locale (date + number format)
- Font size (accessibility, 27" display)
- Animation speed (reduced motion option)
- Quest difficulty bias (parent biases pool toward easier/harder)
- Leaderboard history limit (default 50 entries)
- Auto-recovery day threshold (parent configures hours trigger)
- Session length defaults (remember last trivia/game selections)
- Parent portal timeout (auto-lock timer)

---

## NOTIFICATIONS & ALERTS

### Notification System
- **Step 1:** Simple pointer on HA Dashboard or browser: "🔔 X new notifications in your Activity Board"
- **Step 2:** Full detail in Activity Board notification panel (bell icon + unread badge)
- Applies to ALL notification types
- 30-day notification history
- Individual or bulk dismiss

### Krish's Notification Types (35+)
**Achievements & Rewards:** Badge unlocked, streak milestone, daily goal met, all quests complete, bonus points from parent
**Games & Trivia:** New game unlocked, personal best beaten, new difficulty unlocked, category mastery level up
**Habits:** Habit streak milestone, habit auto-completed, new habit added by parent
**Calendar:** New event, event changed/cancelled, chore rule triggered, personal reminder due
**Homework:** New assignment, due tomorrow, overdue
**Reading & Gujarati:** Weekly reading goal met, book completed, phase advanced, new lesson available
**Goals:** Weekly/monthly goal met, deadline approaching, quest expiring soon
**Streak Protection:** Streak at risk warning, streak recovery used, approaching points cap
**Family:** Added to family calendar event
**System:** New trivia questions added, new feature unlocked
**General:** Parent message, recovery day set, quest swapped, daily bonus multiplier increased

### Parent Notification Types
**Anti-Cheat:** Suspicious activity, unusual points spike, clock manipulation
**Wellbeing:** 3+ consecutive difficult mood days, major streak milestone, significant achievement
**Homework/Chores:** Homework complete, homework overdue, time estimate needs approval, self-directed chore needs approval
**Kung Fu:** Missed class, flashcard needs approval
**Habits/Goals:** Custom habit suggested, weekly/monthly goal complete, goal behind pace
**Calendar:** Krish added calendar item, HA sync occurred, chore rule triggered
**System:** Backup status, localStorage limit warning, parent portal login attempt

### Priority Levels
- 🔴 High: Immediate, persistent banner, sound always plays, cannot be dismissed without acknowledgement
- 🟡 Medium: 8s toast, stored in panel
- 🟢 Low: 4s toast, stored in panel, sound optional

### Do-Not-Disturb
- School Hours: Calendar-aware (only on actual school days), low + medium held
- Bedtime: Fixed window, all held except High
- Focus Mode: Manual parent trigger
- High priority always bypasses all quiet hours
- Held notifications batch-delivered when period ends

### Preferences
- Krish: sound on/off, per-event sound toggles
- Parent: any notification type on/off, quiet hours, email vs portal-only, frequency
- High priority: cannot be fully disabled (delivery method only)

### State Structure
```javascript
state.notifications = {
  unreadCount: 3,
  items: [
    {
      id, timestamp, type, priority: 'high'|'medium'|'low',
      title, message, emoji, read: false, dismissed: false,
      requiresAcknowledgement: false, acknowledgedAt: null,
      moduleReference: { module: 'habits', itemId: 'habit-1' },
      actionable: true, actionLabel: 'View', actionTarget: 'module-habits'
    }
  ],
  heldNotifications: [],
  preferences: {
    soundEnabled: true,
    soundEvents: { correctAnswer: true, wrongAnswer: false, questComplete: true, achievementUnlock: true, streakMilestone: true, pointsAwarded: false },
    quietHours: {
      schoolHours: { enabled: true, start: '08:00', end: '15:00', calendarAware: true },
      bedtime: { enabled: true, start: '21:00', end: '07:00' },
      focusMode: { enabled: false, until: null }
    }
  },
  history: []
}
```

---

## ONBOARDING FLOW

### First Run Sequence
1. Welcome screen (seasonal animation, "Welcome to Your Activity Board! 🎉", "Let's Get Started →")
2. Name & avatar setup (pre-filled "Krish", can set nickname/displayName, emoji avatar picker)
3. Choice screen: "What do you want to do first?" — Play games 🎮 / Check my habits 💪 / Log how I'm feeling 😊 / Explore everything 🗺️
4. Routes to chosen destination, contextual tutorial fires on arrival

### Contextual Tutorials (Progressive Disclosure)
- Each module/feature shows tutorial on first access
- Format: 2–3 screen overlay, large visual, simple explanation, "Got it! →" button
- Skip always available
- ❓ help icon on every module page replays tutorial anytime
- Feature Guides library in Settings shows all tutorials

### Game Tutorials
- Interactive demo mode (no real points)
- Each game has dedicated walkthrough (tile colors, lives/combo, tile dragging, letter guessing)
- ❓ icon replays from game screen

### Tutorial State Tracking
```javascript
state.onboarding = {
  completed: true,
  completedDate: '2026-06-18',
  profile: {
    name: 'Krish', displayName: 'KrishStar',
    avatar: '🧠', createdDate: '2026-06-18'
  },
  tutorialsSeen: ['welcome', 'trivia', 'quests', 'wordle', 'quickfire', 'scramble', 'hangman', 'streaks', 'badges', 'mood', 'gujarati', 'calendar', 'recoveryDay', 'points', 'habits', 'reading'],
  firstChoiceMade: 'habits',
  feedback: {
    items: [
      {
        id, timestamp,
        type: 'bug'|'idea'|'question'|'screenshot',
        message, screenshotData: null,
        status: 'sent'|'read'|'replied',
        parentReply: null, parentReplyDate: null
      }
    ]
  }
}
```

### Feedback & Help System
- 💬 icon on every page (near ❓)
- 4 types: Bug 🐛, Idea 💡, Question ❓, Screenshot 📸
- Auto-screenshot capture
- 300 char message limit
- Delivered to parent portal as medium priority notification
- Parent reply appears in Krish's notification panel
- 90-day history, unread reply badge on 💬 icon

### Replay Options
- Full onboarding reset: Parent Portal → Settings → Data
- Individual tutorials: ❓ icon on each module
- Feature Guides library: Settings → Feature Guides
- Welcome screen: Never replays (shown once only)

---

## GOOGLE DRIVE SYNC (v2)

### OAuth Flow
- Parent-initiated: Parent Portal → Settings → Data → "Connect Google Drive"
- Requests read/write to "Activity Board" folder only (not full Drive access)
- OAuth token persists with auto-refresh
- Disconnect option stops sync without deleting Drive data

### What Gets Synced
**Included:**
- Full `state` object (all modules, points ledger, calendar, quests, streaks, achievements, notifications, onboarding)
- `config.js` parent portal values (separate file)
- Custom trivia questions (`state.trivia.customQuestions[]`)
- Anti-cheat activity log
- Feedback items
- Chore rules

**Excluded:**
- Trivia question bank (IndexedDB, ~400KB — too large)
- Active mid-game session state (too transient)
- Parent portal password/PIN (security)
- OAuth tokens (security)
- Custom avatar image (v2 future)

### Sync Triggers
**Immediate:** Achievement unlocked, quest completion, streak milestone, parent settings change, manual "Sync Now"
**Debounced (30s):** Points earned, habit checked, mood logged, reading/Gujarati session, calendar item added
**Sync status indicator:** ☁️ Synced / 🔄 Syncing / 📴 Offline / ⚠️ Failed

### Conflict Resolution (Section-Aware)
- Points/activities: Merge additively
- Settings/config: Last-write-wins
- Streaks: Take higher value
- Achievements/badges: Always additive (never removed)
- Calendar items: Merge by ID
- Conflict notification to parent, 24-hour conflict log

### Offline Behavior
- Full functionality offline (localStorage)
- 📴 indicator + subtle banner
- Changes accumulate locally
- On reconnect: immediate sync + full section-aware merge
- Parent notified if significant conflicts detected

### Drive Folder Structure
```
📁 Activity Board/
├── 📄 activity-board-state.json
├── 📄 config.json
├── 📁 backups/
│   └── 📄 backup-YYYY-MM-DD.json (30-day auto + manual indefinite)
├── 📁 exports/
│   └── 📄 [exports].csv/.ics
└── 📄 sync-log.json
```

### Backup System
- Auto: Daily snapshot, 30-day retention, then auto-deleted
- Manual: Parent-triggered, kept indefinitely, parent-deletable
- Parent Portal shows all backups (date, size, type) with preview stats
- Download any backup as local JSON

### Restore Process
- Full or partial restore (select specific sections)
- Preview stats before confirming
- Typed confirmation ("RESTORE")
- Auto-saves pre-restore snapshot before running
- Rollback if restore fails
- Parent notified on completion

### Privacy & Security
- HTTPS transmission (Google Drive API standard)
- Data in user's own Drive — app has no access
- OAuth token in secure browser storage
- Passwords/PINs never synced
- No public Drive folder sharing
- Privacy note + Google privacy policy link shown during OAuth setup

### State Versioning & Migrations
```javascript
state._version = 1
state._lastSynced = '2026-06-18T10:30:00Z'
state._appVersion = '1.0.0'
```
- Sequential migration functions (additive only, never deletes)
- Auto-backup before migration, rollback on failure
- Migrations run on both localStorage and Drive state

---

## ACHIEVEMENT BADGES

### Badge System Overview
- 4 tiers per badge, names aligned with selected difficulty theme (e.g. Rookie/Pro/Legend/Master)
- Unlock triggers celebration animation + notification
- Display in Achievements section on dashboard
- Chore badges deferred to v2 (chores live in HA Dashboard)
- ~400+ total badges across all categories

### Games Badges
**Per-game volume (4 tiers each):**
- Wordle wins: 5/25/50/100
- Quick-Fire correct answers: 10/50/100/200
- Word Scramble words solved: 10/50/100/250
- Hangman wins: 5/25/50/100

**Mastery badges (per game):** Perfect game (no hints), Speed Demon (Wordle ≤2 guesses ×5), Hard Mode (10 Hard games), Win Streak (5 consecutive wins)

**Cross-game:** All-Rounder (play all 4 once), Hint-Free Hero (full session no hints), Daily Gamer (play daily 7 days), Game Master (Tier 3 in all 4 games)

**First win badges:** One per game, immediate Day 1 rewards

**Comeback badge:** Win with 1 life remaining, 5 times

### Trivia Badges
**Volume:** 10/50/100/200 correct answers
**Difficulty unlock:** Rising Scholar (Pro), Knowledge Seeker (Legend), True Master (Master)
**Accuracy tiers:** 70%/80%/90%/95%+ (min questions required)
**Speed:** Lightning Thinker (10 questions <5s each)
**Per-category mastery:** 16 categories × 4 tiers = 64 badges (Explorer/Learner/Expert/Master)
**Streak tiers:** 5/10/25/50 correct in a row
**Category collector:** Well-Rounded Scholar (Tier 1 all 16), Supreme Master (Tier 4 all 16)
**Learn More Explorer tiers:** 10/25/50/100 taps
**Daily Learner tiers:** 7/30/60/100 days
**Perfect session badge:** 100% accuracy, no hints
**First correct answer badge**

### Homework Badges
**Volume tiers:** 5/25/50/100 assignments
**On-time tiers:** 5/15/30/60 on-time submissions
**Early submission tiers:** 5/15/30/50 early submissions
**Per-subject badges:** 10 assignments per subject (one badge per subject)
**Estimate accuracy tiers:** 5/15/30/50 times within 20% of estimate
**Homework streak tiers:** 5/14/30/60 consecutive days
**Special:** First Assignment, Speed Scholar, Perfect Week, No Overdue (30 days), Multi-Subject Day badge

### Kung Fu Badges
**Session volume tiers:** 5/20/50/100 sessions
**Class attendance tiers:** 5/20/50/100 classes
**Home practice tiers:** 5/15/30/60 sessions
**Flashcard creation tiers:** 5/20/50/100 cards
**Belt progression:** Unique badge per belt earned (most prestigious)
**Perfect attendance tiers:** 1/3/6/12 perfect months (calendar-aware)
**High performance tiers:** 10/25/50/100 sessions rated 4+ stars
**Above & Beyond tiers:** 3/10/20/40 weeks with class + home practice
**Flashcard study streak tiers:** 3/7/14/30 days
**Special:** First Session, Dedicated Warrior, Study Master, Technique Collector

### Habits Badges
**Overall completion tiers:** 30/100/300/1000 completions
**Per-habit streak tiers (×11 habits):** 7/30/60/100 days = 44 badges
**All habits in a day tiers:** 5/15/30/60 times
**365-day ultimate badge:** Maintain any single habit 365 consecutive days
**Early bird tiers:** 5/15/30/60 times (all habits before noon)
**Habit Creator badge:** Suggest + maintain custom habit 30 days
**Habit Synergy tiers:** 20/50/100/200 auto-completions
**Special:** First Habit, Perfect Week, Habit Collector (Tier 1 all 11), Habit Master (Tier 4 any habit)

### Mood Badges
**Logging volume tiers:** 7/30/60/100 entries
**Logging streak tiers:** 3/7/30/60 days
**Self-awareness tiers:** 5/20/50/100 entries with notes
**Positive streak tiers:** 5/10/20/30 consecutive positive days
**Mood Variety badge:** Log all 6 mood types at least once
**Honest Reporter badge:** Log 😢 or 😡 at least 5 times
**Morning Reflector tiers:** 5/15/30/60 times before noon
**Resilience badge:** Difficult → positive mood within 3 days, 5 times
**Special:** First Check-In, Consistent Reflector, Energy Tracker, Deep Thinker

### Reading Badges
**Session volume tiers:** 5/20/50/100 sessions
**Time tiers:** 60/300/600/1500 minutes
**Completion tiers:** 1/5/10/25 books completed
**Streak tiers:** 3/7/14/30 days
**Genre Explorer:** Read in 5 genres | **Genre Master:** Read in all 10 genres
**Diverse Reader badge:** Log all 5 entry types
**5-Star Collector tiers:** 5/15/30/50 top-rated items
**Consistent Reader tiers:** 4/8/16/26 consecutive weeks hitting goal
**Marathon Reader tiers:** 3/8/15/25 sessions of 90+ minutes
**Special:** First Book, Weekly Goal (4 weeks), Speed Reader, Book Reviewer

### Gujarati Badges
**Lesson completion tiers:** 5/20/50/100 lessons
**Vocabulary tiers:** 25/100/250/500 words
**Study time tiers:** 60/300/600/1500 minutes
**Study streak tiers:** 3/7/14/30 days
**Phase completion badges (5 unique):** Foundation Builder, Word Collector, Sentence Crafter, Conversationalist, Gujarati Scholar
**Heritage Connection badge:** Complete all 5 phases (ultimate Gujarati achievement)
**Writing Practice tiers:** 5/15/30/60 writing components completed
**Consistent Learner tiers:** 4/8/16/26 consecutive weeks hitting goal
**Zero Struggle badge:** No unknown words in flashcard review for a week
**Special:** First Lesson, Perfect Practice (×10), Flashcard Fan (50 reviews), No Hints (×5)

### Daily Quests Badges
**Volume tiers:** 10/50/100/250 quests completed
**Perfect quest day tiers:** 5/20/50/100 days with all 3 complete
**Quest streak tiers:** 3/7/14/30 consecutive days
**Early Completer tiers:** 5/15/30/60 times (all 3 before noon)
**Bonus Streak tiers:** 3/7/14/21 consecutive +50 bonus days
**Quest Legend badge:** 100 consecutive perfect quest days
**Quest Collector badge:** Complete quest from every category
**Special:** First Quest, Perfect Week, Perfect Month, No Swap (×10), Quest Variety

### Points Milestone Badges
**Lifetime total tiers:** 100/500/1,000/5,000 points
**Points Legend badge:** 10,000 lifetime points
**Daily goal achievement tiers:** 5/20/50/100 days
**Daily goal streak tiers:** 3/7/14/30 consecutive days
**Big day tiers:** 100/200/300/500 pts in one day
**Consistent Earner tiers:** 7/14/30/60 consecutive days earning any points
**Monthly Milestone tiers:** 500/1,000/2,000/3,000 pts in one month
**Special:** First Points, Multiplier Master (2.0×), Point Overflow (2× goal ×5), Balanced Earner

### Streaks Badges
**Daily Activity Streak tiers:** 7/14/30/60 days
**100-day super badge:** Single prestigious badge
**365-day Year-Round badge:** Ultimate streak achievement (most prestigious in app)
**Multi-streak:** Double Streak, Triple Threat, Streak Champion
**Recovery:** Bounce Back (×3), Never Give Up (restore 30+ day streak)
**Weekend Warrior tiers:** 4/8/16/26 weekends
**Special:** Streak Starter, Iron Will

### Special/General Badges
**Explorer:** First Day, Explorer (all modules), Completionist (Tier 1 in every category)
**Badge collection tiers:** 10/25/50/100 badges earned | Badge Master (all Tier 4 in any category)
**Balance:** Renaissance Kid, All-Star Day, Well-Rounded (Tier 1 in 8 categories)
**Feedback:** Voice (first feedback), Tester (×10), Bug Hunter
**Theme Collector:** Try all 11 difficulty themes
**Parent's Pride tiers:** 1/5/15/30 parent-assigned quests
**Seasonal Champion:** Earn points in all 4 seasons
**Tutorial Graduate:** Watch all tutorials
**Special:** Birthday Badge, Anniversary (1 year)

### Calendar Badges
**Personal item volume tiers:** 10/30/60/100 items added
**Appointment Keeper:** Mark 10 appointments attended
**Family Connector:** Sync 5 items to HA Calendar (v2)
**Planner:** Add items across all 9 calendar types
**Advance Planner:** Add item 7+ days in advance, 10 times

### Data Hygiene Badge
**Backup Champion:** Create 3 manual backups (single special badge)

---

## DECISIONS PENDING (Next Review Sessions)

### Sections Completed ✅
- Games (all 4 games + cross-game systems)
- Trivia system (fully locked)
- Daily Quest system + full quest pool
- Chores (HA Dashboard, v2 sync)
- Homework
- Kung Fu
- Habits
- Reading
- Mood
- Gujarati

### Sections Completed ✅ (Updated)
- Games, Trivia, Daily Quests, Chores (HA Dashboard), Homework, Kung Fu
- Habits, Reading, Mood, Gujarati
- Calendar (fully locked including v2 integration)
- Points Tracker Module
- Settings & Customization
- Notifications & Alerts
- Onboarding Flow

## WEEKLY & MONTHLY GOALS

### Goal Creation
- Parent creates directly in Parent Portal
- Krish suggests goals → requires parent approval before activating
- Both types identical once active
- Form: type, target, time period, custom name, completion reward points

### Goal Types
- **Weekly** — resets every Monday
- **Monthly** — resets every 1st of month
- **Custom Period** — parent sets specific start/end date
- **Maintenance** — sustain a metric above threshold (daily micro-bonus)
- **Collaborative** — parent + Krish work toward shared target
- Goal cloning/duplication available for recurring setups

### Predefined Goal Templates (18 templates)
Play X games, Score X points, Complete X trivia questions, Maintain habit streak, Read X minutes, Complete X Gujarati lessons, Complete X homework assignments, Complete X daily quests, Log mood X times, Kung Fu sessions, Perfect quest days, Trivia accuracy %, Earn points from X activity types, Complete all habits daily, Unlock X badges, No missed homework, Kung Fu flashcard study minutes, Book completion

### Goal Difficulty Levels (4 tiers — aligned with app-wide system)
- Easy (1×), Medium (1.5×), Hard (2×), Expert (3×)
- System suggests difficulty based on historical performance
- Adaptive suggestion to parent after 3 consecutive completions at same level
- Parent can adjust difficulty of active goal anytime

### Completion Bonus Amounts
| Period | Base | Easy | Medium | Hard | Expert |
|---|---|---|---|---|---|
| Weekly | 50 pts | 50 | 75 | 100 | 150 |
| Monthly | 150 pts | 150 | 225 | 300 | 450 |
| Custom | Parent sets | Parent sets × multiplier |

- **Goal streak bonus:** Consecutive completions of same goal type → stacking extra pts (shown on goal card 🔥)
- **Early completion bonus:** Finish weekly goal 2+ days early = +10 pts; monthly 5+ days early = +25 pts
- **Maintenance goals:** +5 pts/day condition met + full period bonus if maintained throughout
- **Collaborative goals:** Bonus split proportionally by contribution (parent decides allocation)
- All values configurable in Parent Portal + Daily Goal Estimator

### Partial Completion (Tiered Credit)
| Progress | Credit |
|---|---|
| 0–49% | No points |
| 50–74% | 25% of bonus |
| 75–89% | 50% of bonus |
| 90–99% | 75% of bonus |
| 100% | Full bonus × multiplier |

- "Almost there" notifications at 75%, 90%, and 1 day remaining
- Collaborative goal partial credit split proportionally
- Parent can disable partial credit per goal
- Parent can manually award full credit

### Overdue & Expired Goals
- Goals expire at midnight — no grace period (partial credit handles near-misses)
- Partial credit auto-calculated and awarded at expiry
- Moves to "Past Goals" history with ✅ or ⏰ status
- No carry-over of progress (fresh start each period)
- Parent notified if goal expires under 50% complete

**Recurring goals:** Auto-reset each period, progress clears, streak tracked separately

**Goal pause:**
- Parent can pause anytime (deadline extends by days paused)
- Recovery Day auto-pauses daily-activity goals (doesn't count as miss)
- Krish sees ⏸️ on goal card

**Goal abandonment:**
- Parent or Krish (with approval) can cancel active goal
- Archived as "Cancelled" — no points
- Useful when circumstances change

**Carry-over limit:** Maximum 2 carry-overs per goal → auto-archives with parent suggestion to adjust target

**Active goal limits:** Max 3 weekly + 2 monthly active simultaneously (configurable in Parent Portal)

**Goal trend analysis (parent-only):** Shows which goal types Krish consistently completes vs. struggles with

### Goal History
- Full permanent retention of all goals (completed, expired, cancelled)
- Three-tab display: Active, Past, Stats
- Personal bests per goal type shown on cards
- Completion rate trend chart
- Parent CSV export

### Goal State Structure
```javascript
state.goals = {
  active: [{ id, name, type, difficulty, target, current, period, bonus, status, streak, createdBy, ... }],
  history: [{ id, name, type, difficulty, target, finalProgress, pointsAwarded, status, period, ... }],
  personalBests: { 'template-id': { value, date, period } },
  stats: { totalCompleted, totalCancelled, overallCompletionRate, completionRateByDifficulty, ... },
  customTemplates: [...],
  limits: { maxActiveWeekly: 3, maxActiveMonthly: 2 },
  settings: { partialCreditEnabled: true, adaptiveDifficultyEnabled: true, ... }
}
```

---

## CATEGORY MASTERY

### Display Locations
- Trivia module: 16-category grid with star ratings
- Dashboard card: Top 3 strongest + 1 weakest category  
- Parent Portal: Full breakdown with raw accuracy %

### Category-Specific Stats
- Questions answered, accuracy, streaks (current/longest)
- Response times (average + personal best)
- Hints used, points earned, improvement rate
- Per-difficulty accuracy breakdown (4 tiers)
- Progress toward next mastery level
- Wrong answer pool (most-missed questions)
- Status: active | struggling | neglected
- Active goal linking

### Features
- All 16 categories available Day 1
- Favorite category vs. strongest category displayed distinctly
- Weak/neglected category recommendations
- Wrong Answer Review per category (most-missed first)
- Category recovery celebration animation
- Parent notification if category < 50% after 15+ questions
- Quest bias toward weak categories (configurable)
- Category goal progress overlay on category cards

### State Structure
```javascript
state.trivia.categoryMastery = {
  [categoryName]: {
    questionsAnswered, correctAnswers, accuracy, currentLevel, levelAchievedDate,
    currentStreak, longestStreak, lastPlayed, totalTimesPlayed,
    averageResponseTime, fastestCorrectAnswer, hintsUsed, pointsEarned, improvementRate,
    recentAccuracy: [1,0,1,...], difficultyBreakdown: { level1: {...}, ... },
    progressToNextLevel, wrongAnswerPool, status, activeGoalId
  }
}
```

---

## DAILY CHALLENGE MODE

### Structure
- 4 games in randomized order (determined at midnight daily)
- Difficulty progression: Easy → Medium → Medium → Hard
- 4 selectable challenge modes: Rookie/Pro/Legend/Master (1.5×/2.5×/3×/4× multiplier)
- 3 lives (lose game = −1 life)
- Points awarded per game + lives remaining bonus (+25 pts/life) + clean sweep bonus (+200 pts before multiplier)
- Game results count toward regular stats + separate challenge leaderboard

### Loss Conditions & Lives
- Wordle: Fail in 6 attempts
- Quick-Fire: Lose all 3 lives
- Word Scramble: Fail to solve required words in time
- Hangman: Run out of letter guesses
- Lives display persistent (❤️❤️❤️), last life warning (pulsing red)
- Hints allowed (cost points as normal), forfeit option with confirmation

### Points Calculation
- Per-game points = base × difficulty multiplier
- All 4 games summed
- +25 pts per remaining life
- Challenge multiplier (1.5×/2.5×/3×/4×) applied to total
- Clean sweep (+200 pts) before multiplier
- Near clean sweep (4 wins, 1 life lost): +50 pts

### Results Screen
- Personalized motivational message
- Tomorrow's countdown timer
- Animated score reveal
- Challenge streak display
- Personal best comparison
- Badges earned this challenge

### Leaderboards
- Separate per mode (Rookie/Pro/Legend/Master)
- Four time views: All-time, This week, This month, Streak board
- Top 50 entries per mode
- Completion rate shown
- Personal best notification when beaten

### State Structure
```javascript
state.dailyChallenge = {
  today: { date, mode, gameOrder, difficulties, status, livesRemaining, gameResults: [...], finalScore, pointsAwarded },
  history: [...],
  leaderboard: { rookie: [], pro: [], legend: [], master: [] },
  stats: { totalChallengesCompleted, totalCleanSweeps, currentStreak, longestStreak, personalBests },
  settings: { availableModes, defaultMode }
}
```

---

## STREAK RECOVERY SYSTEM

### Recoverable Streaks (5 core types, parent customizable)
- Daily activity streak
- Daily quest streak
- Daily goal streaks (weekly + monthly)
- 11 habit-specific streaks
- Daily Challenge streak

### Recovery Mechanics
- Streak breaks at midnight if activity incomplete
- Next 24 hours: recovery option available
- Free recovery (1 per streak type per month) → restores to yesterday's count
- Paid recovery (points, configurable) → same result
- Recovery doesn't advance streak, just prevents loss

### Free Recovery Cadence
- Per streak type per month (each streak gets 1 free)
- Resets on 1st at midnight (local timezone)
- No carryover
- Parent can grant additional free recovery mid-month

### Paid Recovery Cost
- Base cost per streak type (activity: 50, quest: 50, challenge: 60, goals: 40-75, habits: 30)
- Optional scaling: +10 pts per 10 days of streak (caps at +50 pts)
- Configurable in Parent Portal

### UI/UX & Notifications
- 2-step notification on streak break
- Detail panel with cost, 24h countdown, confirmation
- Success message with next-action guidance
- Streak card glow animation
- Personal recovery history visible
- 24h countdown reminders (12h, 6h)

### Parent Controls
- Override/grant recovery per streak type
- Toggle recovery on/off per streak type
- Custom point costs, free cadence, scaling
- Recovery usage dashboard + recommendations

### Recovery Badges
- "Unbroken" badge: 30-day streak without recovery

### State Structure
```javascript
state.streaks = {
  active: { dailyActivity, dailyQuest, dailyChallenge, weeklyGoals, monthlyGoals, habits: {...} },
  recoveryHistory: [...],
  recoveryStats: { thisMonth, allTime },
  settings: { recoveryEnabled, recoveryByStreakType, costs, scaling }
}
```

---

## PARENT PORTAL

### 8 Main Sections
1. Dashboard — Status, weekly summary, streaks, goals, alerts, activity feed
2. Krish's Profile — Name, avatar, restrictions, limits, communication
3. Activity Management — Goals, quests, chores, homework, habits, reading, gujarati, kung fu, calendar
4. Points & Rewards — Ledger, badge progress, multiplier status
5. Settings & Preferences — 8 configuration tabs
6. Analytics — Trends, category performance, goal performance, engagement, recovery, badges
7. Data & Backups — Google Drive sync, backup/restore, exports
8. Help & Documentation — FAQ, guides, troubleshooting

### Authentication
- Email/password login (one parent per Activity Board in v1)
- 30-day persistent sessions, 7-day auto-logout
- Pre-logout warning, login audit trail
- Logout from all devices option

### Dashboard Features
- Real-time updates (30s refresh)
- 8 customizable cards (reorder, hide, favorites)
- Alert banner, time filtering, quick-edit, comparisons

### Per-Module Controls
- Create/edit/delete/archive/bulk-action/undo per module
- Item duplication for templates
- Confirmation dialogs for destructive actions

### Analytics & Insights
- 6 tabs: Trends, Category Performance, Goal Performance, Engagement, Recovery Health, Badges
- Date range filtering, export to CSV/PDF/JSON
- AI insights + recommendations, anomaly detection
- Milestone celebrations

### Data Management
- Auto-backup every 30s to Google Drive
- Manual backup, backup history with restore
- Selective restore (specific sections only)
- Encryption at rest (AES-256)
- Backup comparison/diff
- Conflict resolution (merge by default)

### Krish Profile Management
- Display name, avatar, age/grade
- Parent-set restrictions: daily cap, screen time, session duration, access windows, content restrictions, difficulty caps
- Communication: messages, announcements, feedback replies
- Account controls: pause, reset, archive
- Device management + optional PIN
- Krish-created items audit, activity log, milestone timeline

### Settings & Customization (8 Tabs)
1. Notifications: which events, timing, channels, quiet hours
2. Theme & Display: color, density, range, font size
3. Account & Security: password, sessions, login audit
4. Data & Backups: sync status, backup frequency, retention
5. Activity Monitoring: refresh rate, analytics range, anomaly sensitivity
6. Krish's Limits & Restrictions: all caps and time windows
7. Recovery System: enable/disable, per-streak settings
8. Advanced: dev mode, language, cache

Plus: Settings presets (Relaxed/Balanced/Strict), help text, quick-access favorites, device sync

### Activity Logging & Audit Trail
- Logs: Krish actions, parent actions, system actions
- Chronological list, filterable, searchable, expandable, exportable
- Retention: Forever (full history) with 90-day searchable index
- Pattern analysis, sensitive data marked [SENSITIVE], incident reconstruction

### State Structure
```javascript
state.parent = {
  profile: { email, passwordHash, createdDate, lastLoginDate, timezone },
  linkedAccounts: { krishAccountId, krishProfileName },
  settings: { notifications, display, dataSyncBackup, analyticsMonitoring, krishLimits, recoverySystem, advancedSettings },
  dashboardCustomization: { cardOrder, hiddenCards, favoriteSettings },
  activityLog: [...],
  sessionHistory: [...],
  _version, _lastModified, _appVersion
}
```

---

## ✅ ACTIVITY BOARD REBUILD — COMPLETE

**All 20 major sections fully locked and specified.**

**Last Updated:** 2026-06-24 (Session 5 — All sections completed)  
**Status:** Ready for development  
**Next Step:** Implementation Phase 1
