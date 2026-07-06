# Cross-System Gaps & Opportunities Discovered

**Status:** Emerging from Games + Trivia detailed planning  
**Date:** 2026-06-16

---

## CRITICAL GAPS (System-Level Issues)

### Gap 1: Daily Points Goal vs. Dynamic Trivia Goal Conflict

**Problem:**
- User has daily points goal: 50 points (in Settings)
- User has dynamic trivia goal: 5-20 questions (based on calendar)
- But calendar might be so full that user can't play enough to reach 50 points
- Could user feel like they're "failing" despite calendar being legitimately busy?

**Example:** 
- Wednesday: Full schedule → Trivia goal = 5 questions only
- 5 Quick-Fire questions × 10 points = 50 points (if all correct)
- But if even one wrong, they miss daily goal
- Feeling of failure despite respecting their schedule

**Questions:**
- Should daily points goal also be dynamic based on calendar?
- Or should trivia goal be separate from points goal?
- How do these interact?

---

### Gap 2: Daily Quest Impossibility Risk

**Problem:**
- Daily Quests are randomized (could be "Complete 2 Wordle games")
- But some games might be locked (user hasn't unlocked Wordle yet)
- Quest becomes impossible to complete

**Example:**
- Day 1: User unlocks only Quick-Fire + Scramble
- Day 2: Daily Quest: "Complete 2 Wordle games" → IMPOSSIBLE
- User can't complete quest even if they try hard

**Questions:**
- Should Daily Quests only use unlocked games?
- Should there be a "skip" or "swap" mechanism for impossible quests?
- How many retries if locked game required?

---

### Gap 3: Timezone Complexity Nightmare

**Problem:**
- Multiple systems reset at "midnight in user's timezone":
  - Daily Trivia Goal (calendar-based)
  - Daily Quest reset
  - Daily Bonus streak reset
  - Daily Challenge reset
- User needs timezone set correctly
- Google Drive syncing across timezones
- What if user travels? Changes timezone?

**Questions:**
- Is timezone auto-detected via GPS or manually set?
- What happens if user changes timezone mid-streak?
- Does Google Drive sync handle timezone differences?
- Edge case: User at midnight between two timezones?

---

### Gap 4: Hint Token Economy - Will It Feel Scarce?

**Problem:**
- User earns 1 token per perfect game (0 hints, no mistakes)
- Max 5 tokens
- But all 4 games + trivia (with 3 phases) need hints
- If user plays 5-10 games per day, earning 1 token/day
- Can spend 5 tokens per day easily
- Tokens might feel like constant bottleneck

**Math:**
- Earn: 1 token per day (if playing perfectly)
- Spend: Could use 3-5 tokens across games + trivia
- Result: Always out of tokens

**Questions:**
- Should earning rate be higher (2 tokens per perfect)?
- Should max be higher (10 tokens)?
- Should trivia hints use different economy (not tokens)?
- Or is scarcity intentional (encourages mastery)?

---

### Gap 5: Multiple Overlapping Streak Systems

**Problem:**
- We now have FIVE different streak systems:
  1. Daily Quest streak (consecutive days completing all 3)
  2. Daily Bonus streak (consecutive days of ANY activity)
  3. Game-specific streaks (consecutive wins in Wordle, etc.)
  4. Category streaks (consecutive wins in Geography, etc.)
  5. Habit streaks (consecutive days habit completed)

- User breaks one streak, but others still active
- Could be confusing: "Did I lose my streak?"
- Which streaks matter most?

**Questions:**
- Should these be unified or separate?
- What happens if user misses one day? (all break or just some?)
- How to display without overwhelming?
- Streak recovery affects all or just one?

---

### Gap 6: Achievement Badge Metric Inconsistency

**Problem:**
- We designed badges but didn't align metrics:
  - Wordle: "5 wins" (win-based)
  - Quick-Fire: "10 correct" (answer-based, not wins)
  - Word Scramble: "5 words solved" (action-based)
  - Hangman: "5 wins" (win-based)
  - Trivia: "10 correct" (answer-based)

- Some count wins, some count correct answers, some count actions
- Inconsistent progression across games

**Example:** 
- Wordle badge: "5 complete wins"
- Quick-Fire badge: "10 correct answers (across 12 attempts)"
- One feels like you beat the game, one feels like raw practice
- Should these be unified?

**Questions:**
- Should all badges use "wins" metric?
- Or keep game-specific metrics and adjust badge thresholds?
- How to make them feel equally challenging?

---

### Gap 7: Leaderboard Data Explosion

**Problem:**
- 1000+ trivia questions → potential 1000 leaderboards (one per question)
- 4 games × 3 difficulties = 12 game leaderboards
- 10+ categories × 3 difficulties = 30+ category leaderboards
- Time filters: All-time, This week, This month = 3x multiplier
- **Total potential leaderboards: 1000+ × 3 = 3000+ datasets**

- Data could become massive
- Queries could be slow
- Storage issues
- Performance degradation

**Questions:**
- Should we limit leaderboards to per-game, per-category (skip per-question)?
- How many leaderboard entries to store (top 10? 100? all-time)?
- Should old leaderboard data be archived/deleted?
- Database optimization strategy?

---

### Gap 8: Learn More Resources - Curation & Maintenance

**Problem:**
- Approved: External educational links for every question/game
- But NOT SPECIFIED:
  - Who curates links?
  - How many links per question?
  - What if links break over time?
  - How often to update/validate?
  - What sources are "approved"?

**Questions:**
- Should we pre-curate 5-10 resources for EACH of 1000 questions? (5000+ links!)
- Or curate per-category (10+ categories = 100+ link sets)?
- How to keep links fresh/valid?
- Manual curation or automated search?
- Cost implications?

---

### Gap 9: Question Cycling vs. Leaderboard Tracking

**Problem:**
- Questions cycle (7-day recently-played period, don't repeat)
- Leaderboards show "Best Score on [Question]"
- What happens if question is in cycling period?
- Can user retake and beat old score? Or can't see that question?

**Conflict:**
- User asks: "Why can't I play this question?" 
- Answer: "You played it yesterday, wait 7 days"
- User feels blocked from improving leaderboard score

**Questions:**
- Should cycling apply to leaderboard attempts?
- Or should users be able to retake recently-played questions (just less frequently)?
- How does this affect game balance?

---

### Gap 10: Complexity vs. Onboarding

**Problem:**
- 8 activity sections (Chores, Homework, Habits, Mood, Reading, Calendar, Gujarati, Kung Fu)
- 4 games
- Daily quests system
- Achievement badges
- Weekly/monthly goals
- Points system with multipliers
- Daily bonus streak system
- Daily challenge mode
- Category mastery
- Settings with timezone/notifications
- Learn More resources

**That's 15+ major features for first-time user!**

- Onboarding flow might need to be phased
- Not teach everything Day 1
- Introduce systems gradually
- Could overwhelm Krish

**Questions:**
- Should onboarding be phased (teach games first, quests later)?
- Should some features be hidden initially (revealed as earned)?
- How to avoid "feature explosion" anxiety?
- What's the MVP for Day 1 vs. Week 1 vs. Month 1?

---

### Gap 11: Parent Portal Design (Only Partially Defined)

**Problem:**
- We said "parent can toggle time tracking visibility"
- But parent portal is largely undefined:
  - What can parent see?
  - What can parent change?
  - Can parent set goals?
  - Can parent view detailed analytics?
  - Can parent see Learn More resources accessed?
  - Privacy implications?

**Questions:**
- Should parent portal show:
  - Real-time activity dashboard?
  - Detailed game-by-game stats?
  - Time tracking per activity?
  - Category mastery breakdown?
  - Streaks and achievements?
- Can parent adjust settings? (difficulty, goals, etc.)
- Can parent see which Learn More resources Krish accessed?
- Should there be privacy settings (what parent can/can't see)?

---

### Gap 12: Data Validation & Cheating Prevention

**Problem:**
- With complex points calculation (base × difficulty × speed × accuracy × multipliers)
- Multiple ways to game the system:
  - Rapid-click games
  - Offline play then sync
  - Manipulating timer
  - Purposely failing easy games then retaking
  - Token farming (getting perfect games for tokens)

**Questions:**
- What's the anti-cheat strategy?
- Should we validate game results server-side? (but we're local-only...)
- How to detect suspicious patterns?
- What are consequences of detected cheating?
- Do we trust user data or require verification?

---

## OPPORTUNITY GAPS (New Ideas Emerging)

### Opportunity 1: Adaptive Difficulty Across All Systems

**Insight:**
- Games have difficulty auto-scaling
- Trivia has difficulty unlocking
- But other sections (Chores, Homework) are static
- Could we make everything adaptive?

**Idea:**
- Homework estimated time: If user consistently finishes in 50% of time, suggest harder assignments
- Habits: If user completes 7 days perfect, introduce new habit?
- Reading: If speed increases 10%, suggest more challenging books?

**Questions:**
- Is this feature creep or genuine value?
- How to implement without overwhelming?
- When to trigger suggestions?

---

### Opportunity 2: Social Motivation (Future, but plan now)

**Insight:**
- All systems are individual
- User only sees own stats
- Could future versions support:
  - Friendly competition with sibling/cousin?
  - Shared challenges?
  - Leaderboards showing friends?

**Questions for Architecture:**
- Should we design state structure to support future multi-user?
- How would Google Drive sync work with multiple users?
- Privacy/security implications?
- Should we plan for this now or ignore?

---

### Opportunity 3: Contextual Learning Suggestions

**Insight:**
- User plays trivia question about photosynthesis
- Gets it wrong
- Shows Learn More resources
- But user never explores them
- What if system suggested: "Related reading assignment about photosynthesis" in Reading section?

**Idea:**
- Cross-system suggestions based on game activity
- "You got X wrong, maybe read about it?"
- "You were strong in Geography, try Geography-heavy daily quest?"

**Questions:**
- How to implement without pushing too hard?
- Would this feel helpful or intrusive?
- Technical complexity?

---

### Opportunity 4: Habit Linking to Activity Sections

**Insight:**
- Habits section (track Yoga, Meditation)
- But Kung Fu section is separate
- Could Kung Fu practice count toward "Exercise" habit?
- Could Reading practice count toward "Learn" habit?

**Idea:**
- Link activities to habits
- "Completed Kung Fu practice today!" also increments "Exercise" habit streak
- Show connected activities

**Questions:**
- How to define which activities link to which habits?
- What if user wants to track independently?
- Overcounting time/effort?

---

### Opportunity 5: "Recovery Day" Concept

**Insight:**
- With multiple streaks + goals + quests
- User could feel overwhelmed/guilty on busy day
- What if system acknowledged: "Calendar very full today - this is your recovery day"?

**Idea:**
- On days with 4+ hours of scheduled activities
- Show message: "You're doing great! Today is your recovery day - no pressure"
- Remove daily quest completion bonus requirement
- Just offer points for ANY activity (no quest multiplier)
- Encourage rest, normalize not hitting every goal

**Questions:**
- Would this reduce pressure or enable laziness?
- When to trigger?
- How to frame message?

---

## SUMMARY: 18 Gaps Identified

**Critical (Need to resolve before building):** 6
- Daily goal interaction
- Quest impossibility
- Timezone handling
- Token scarcity
- Streak system confusion
- Badge metric inconsistency

**Important (Plan before building):** 6
- Leaderboard data explosion
- Learn More resources curation
- Question cycling conflicts
- Complexity/onboarding balance
- Parent portal design
- Anti-cheat strategy

**Opportunities (Consider for v1 or later):** 5
- Adaptive difficulty across all systems
- Social/multiplayer foundation
- Contextual learning suggestions
- Activity-habit linking
- Recovery day concept

**Plus:** 1 practical note about mobile optimization

---

## RECOMMENDATION

Before moving to Daily Quests section, should we:

**Option A:** Resolve the 6 Critical gaps now
**Option B:** Continue with Daily Quests, loop back to gaps
**Option C:** Different prioritization

Which approach?

