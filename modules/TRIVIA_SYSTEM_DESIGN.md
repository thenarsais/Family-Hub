# 🧠 Family Hub Trivia System — Complete Design Document

**Status:** Design Complete ✅ | Ready for Implementation  
**Last Updated:** 2026-06-10  
**Total Design Decisions:** 150+ locked decisions across 8 phases

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Phase 1: Question Bank & Foundation](#phase-1-question-bank--foundation)
3. [Phase 2: Core Learning System](#phase-2-core-learning-system)
4. [Phase 3: User Experience & Accessibility](#phase-3-user-experience--accessibility)
5. [Phase 4: Gamification & Motivation](#phase-4-gamification--motivation)
6. [Phase 5: Advanced Engagement](#phase-5-advanced-engagement)
7. [Phase 6: Organic Learning Reinforcement](#phase-6-organic-learning-reinforcement)
8. [Phase 7: Question Expansion & Improvement](#phase-7-question-expansion--improvement)
9. [Phase 8: Customization & Parent Control](#phase-8-customization--parent-control)
10. [Cross-Phase Features & Suggestions](#cross-phase-features--suggestions)

---

## System Overview

### 🎯 Vision
A comprehensive, engaging trivia system for Krish (age 9) that:
- Makes learning fun through gamification
- Tracks progress with meaningful metrics
- Respects sibling differences (no cross-age competition)
- Maintains parent oversight and control
- Grows organically with seasonal content and monthly expansions

### 🏗️ Architecture
- **Frontend:** Single-file HTML/CSS/JS (Activity Board tab in Family Hub)
- **Storage:** IndexedDB (Phase 1-8, primary) with localStorage fallback, Cloud sync (Phase 9+)
- **Data:** Multi-user profiles, individual progress tracking, family-level insights
- **Sequential Enforcement:** Only one child playing at a time

### 👥 Users
- **Krish:** 9-year-old learner (primary)
- **Siblings:** Support for multiple children, individual profiles
- **Parents:** Oversight, customization, analytics dashboard

---

## Phase 1: Question Bank & Foundation

### ✅ What's Included
- **1,000 initial questions** across 19+ categories
- **Question structure:** Multiple choice, 4 options, only 1 correct
- **Metadata per question:**
  - Unique UUID identifier
  - Category (Science, History, Geography, Culture, etc.)
  - Difficulty (Rookie/Pro/Legend → backend: easy/medium/hard)
  - Fun fact (≤300 characters)
  - Learning link (educational resource)
  - Image (visual aid)
  - Hint
  - Source attribution (Khan Academy, Wikipedia, Parent-created, etc.)

### 📚 Question Sources & Sourcing Process
- **Reputable sources:** Khan Academy, Wikipedia, educational sites
- **Cultural content:** Diwali, Holi, Independence Day, Gujarati culture
- **Claude automation:** AI generates complete questions with metadata, fun facts, learning links
- **Quality validation:** 
  - Phase 1: Start with high automation (Claude generates, Priya spot-checks 20%)
  - Monitor accuracy and quality during Phase 1
  - Phase 7+: Adjust to moderate automation (Claude generates, Priya edits/approves ~50%) if feedback indicates lower quality
- **Validation checklist:** Accuracy ✓ Age-appropriate ✓ Quality ✓ Bias check ✓
- **Feedback loop:** User accuracy data informs whether to maintain high automation or shift to moderate

### 📂 Category Distribution (1000 questions)
| Category | Count | Focus |
|----------|-------|-------|
| Science | 150 | Physics, biology, chemistry, space |
| History | 100 | World history, local, family heritage |
| Geography | 120 | Maps, locations, cultures, climates |
| Culture | 100 | Gujarati, Indian, world traditions |
| Math | 100 | Numbers, logic, problem-solving |
| Literature | 80 | Books, authors, stories, reading |
| Arts | 60 | Music, visual art, creativity |
| Sports | 60 | Athletics, games, physical activity |
| Technology | 70 | Computers, innovation, how things work |
| General Knowledge | 80 | Interesting facts, trivia |
| **Other** | **80** | Life skills, social-emotional, misc |

### 🔄 Weekly Question Rotation
- **No repeats within a week:** Each child gets different 35-40 questions/week
- **Difficulty distribution:** Mix of Rookie, Pro, Legend questions
- **Random selection:** Questions pulled from pool, no predictable order

### 🎯 Sourcing Workflow (Parallel Batches)
- **3 batches in flight simultaneously** (different stages)
- **Weekly deployment** of completed batches
- **Claude sources questions automatically** (AI-assisted)
- **Priya approves/validates** before questions go live
- **Timeline:** Week 1 planning → Week 2-5 in flight → Deploy weekly

---

## Phase 2: Core Learning System

### ✅ What's Tracked
- **Answer history:** Every question, every answer, timestamp
- **Performance metrics:**
  - Accuracy by category (%)
  - Accuracy by difficulty (%)
  - Questions answered (total, today, this week, this month)
  - Streak data (daily, category, accuracy streaks)
  - Learning improvements (% week-over-week)
- **Metadata:** Thinking time (optional), attempt number, hint usage

### 📊 Data Structure (IndexedDB with localStorage Fallback)
**Primary:** IndexedDB (50MB+ capacity, optimized for large datasets)
**Fallback:** localStorage (for edge cases where IndexedDB unavailable)

```json
{
  "userId": "krish",
  "questionsAnswered": 147,
  "accuracy": 73,
  "categoryPerformance": {
    "Science": { "correct": 45, "total": 60, "accuracy": 75 },
    "Geography": { "correct": 30, "total": 55, "accuracy": 55 },
    ...
  },
  "streaks": {
    "daily": 12,
    "categoryBest": { "Science": 8 },
    "accuracyStreak": 5
  },
  "answerHistory": [
    { "id": "q123", "correct": true, "timestamp": "2026-06-10T14:30:00Z" },
    ...
  ]
}
```

### 🎯 Learning Metrics
- **Retention tracking:** Longitudinal accuracy trends over weeks/months
- **Improvement rate:** % improvement week-over-week per category
- **Mastery identification:** Categories where accuracy >85% sustained
- **Struggle areas:** Questions answered wrong 3+ times (flagged for parent)

### 🔄 Organic Learning Reinforcement
- **Incorrect answer pool:** Questions answered wrong tracked separately
- **Time-weighted selection:** Recent wrong answers appear more frequently
- **Enhanced learning content:** When incorrect answer re-appears:
  - "You found this tricky before. Let's learn more about it."
  - Extended fun fact
  - Additional learning resources
  - No separate scoring, just organic reinforcement

### 💾 Data Lifecycle
- **Backup strategy:** 
  - Phase 1-8: Auto-export to Google Drive on schedule (daily/weekly, parent-configurable)
  - Creates timestamped JSON backups in Google Drive folder
  - Phase 9: Cloud backend replaces Google Drive backups
- **Archival:** After 1 year, archive (keep but don't load actively)
- **Deletion:** Parents can request deletion with approval
- **Right to be forgotten:** Krish can request deletion, parent approves

### 🔐 Privacy & Security
- **Data encryption:** Sensitive data encrypted
- **Access control:** Family members only
- **Retention policy:** Archive after 1 year, notify parent to delete if desired
- **GDPR considerations:** Not applicable (personal/family use)

---

## Phase 3: User Experience & Accessibility

### 🎮 Interface Components
- **Question display:** Large, readable text (≥16px)
- **Answer options:** 4 buttons, clear visual hierarchy
- **Progress bar:** Visual feedback (questions answered this session)
- **Streak counter:** Prominent display of current streak (🔥 X day streak!)
- **Category tag:** Shows what category the question is
- **Difficulty display (Progressive Disclosure):**
  - Always visible: Color-coded icon + difficulty name (Easy/Medium/Hard)
  - On hover: Tagline appears ("Uses inference skills", "Tests memory")
  - On tap: Full explanation ("This question requires analyzing information to draw conclusions")
- **Hint button:** 💡 Easy access

### 📱 Responsive Design
- **Desktop-first:** Optimized for iPad/tablet (Activity Board primary interface)
- **Mobile-friendly:** Works on smaller phones, but not primary platform
- **Touch-friendly:** Large buttons (≥48px) for touch targets
- **Performance:** 
  - Target: <2 second full question load
  - Graceful degradation: Show question text immediately, images load in background
  - Never blocks Krish from answering while waiting for images

### 📥 Question Loading Strategy (Hybrid Pre-load + Lazy-load)
- **Buffer approach:** Pre-load 3-5 questions ahead (user never waits)
- **Background loading:** Load next batch while user plays current question
- **Depletion handling:** When buffer drops below 2 questions, refill automatically
- **Memory efficient:** Keeps 5-10 questions in memory max
- **Network resilient:** Graceful degradation if loading fails (show alternative activity suggestion)

### ♿ Accessibility Features
- **Text-to-speech:** Read questions aloud (high contrast mode)
- **Dyslexia-friendly font:** OpenDyslexic available (user-selectable)
- **High contrast mode:** Better readability for visual needs
- **Keyboard navigation:** Full keyboard support (Tab, Enter, Spacebar)
- **User testing:** Real users with accessibility needs test before launch

### 🎨 Customization
- **15 theme packs:** Difficulty names customizable (Rookie/Pro/Legend is default)
  - Sports: Rookie/Pro/Legend
  - Space: Cadet/Captain/Commander
  - Superheroes: Sidekick/Hero/Legend
  - Pirates: Deckhand/First Mate/Captain
  - Fantasy: Squire/Knight/Champion
  - Royalty: Prince/Princess/Sovereign
  - Fairy Tale: Maiden/Enchantress/Sorceress
  - Forest: Seedling/Sapling/Ancient Tree
  - Ocean: Pearl/Dolphin/Leviathan
  - Dragons: Hatchling/Wyrm/Ancient Dragon
  - Unicorns: Foal/Unicorn/Star Unicorn
  - Nature: Butterfly/Eagle/Phoenix
  - Music: Musician/Composer/Maestro
  - Art: Artist/Master/Visionary
  - Magic: Apprentice/Mage/Archmage
- **Avatar customization:** Krish creates/selects avatar (Phase 8)
- **Animation speed:** Control animation speed (accessibility)

### 📚 Day 1 Onboarding (Sectioned Tutorial)
- **Not one dump:** Spread across first 5 sessions
- **Day 1:** Profile setup + answer first 5 questions
- **Day 2:** Earn streak/points, celebrate
- **Day 3:** Unlock first mini-game
- **Day 4:** Earn first badge
- **Day 5:** Parents set family goal
- **Ongoing:** Learn features contextually as they're encountered
- **On-demand:** Full explanations in Help tab if needed

### 💬 Help & Documentation
- **In-app help:** Tooltips, FAQ accessible from dashboard
- **Context-sensitive hints:** Explanations appear when features first used
- **Separate guide:** PDF/webpage with comprehensive parent documentation

---

## Phase 4: Gamification & Motivation

### 🎯 Points System
- **Earning points:**
  - Correct answer: 5 points (base)
  - Accuracy streak bonus: +2 points per day streak (day 3 = +6 pts)
  - Difficulty bonus: Easy +3 / Medium +5 / Hard +10
  - Daily minimum: 0 points if no questions answered
- **Weekly/monthly tracking:** Separate counters for aggregation
- **Visible counter:** Shows "X points today" on dashboard

### 🔥 Streak System (Three Types)
1. **Daily streak:** Consecutive days of playing (any questions)
   - Resets if missed day (if no questions answered)
   - **Grace-save mechanic:** Costs 10% of previous day's points earned
     - Effect: Prevents streak reset (streak number preserved)
     - Does NOT affect question rotation (weekly rotation unaffected)
     - Used when: Krish misses a day but wants to keep streak alive
   - Visual: 🔥 X day streak display
2. **Category streak:** Consecutive correct answers in same category
   - Shows "5 correct in Science row"
3. **Accuracy streak:** Consecutive correct answers overall
   - Shows "7 in a row"

### 🏆 Badge & Achievement System
- **Category badges:**
  - Bronze: Auto-awarded at 0 correct (participation)
  - Silver: 20 correct + 75% accuracy
  - Gold: 50 correct + 85% accuracy
  - Platinum: 100 correct + 90% accuracy
  - **Proportional thresholds:** Scale with category size (large categories adjust up)
  - **Data-driven:** Monitor if achievable, adjust if too easy/hard
- **Special badges:**
  - Perfect week (100% accuracy one week)
  - 30-day streak
  - All categories Silver+
  - Etc. (30+ total badges planned)

### 🎯 Goals System
- **Goal types:**
  - Personal: "Answer 100 questions this month"
  - Family team: "Family goal: 500 correct answers"
  - Learning-focused: "Master Science category (85%+)"
- **Tracking:** Progress toward each goal visible
- **Notifications:** Weekly updates ("You're on track for 150 by month-end")
- **Goal suggestions:** System suggests goals based on performance/interests
- **Parent oversight:** Parents set family goals, monitor progress

### 🎪 Family Engagement (No Cross-Age Competition)
- **Team goals only:** Family works together (no leaderboards)
- **Weekly challenge card:** Appears Sundays on dashboard, dismissible
- **Family celebration:** "Great job! Family earned X points this week"
- **Separate sibling progress:** Each child's stats visible but not ranked
- **Encouragement mechanics:**
  - Growth messaging: "You improved 15% this week!"
  - Effort recognition: "You answered 147 questions!"
  - Personalized suggestions: "Keep working on Geography!"

### 📊 Family Stats View (Parent Dashboard Only — Not Visible to Krish)
**Krish's View:** Personal stats only (his own progress, no family comparison)
- Accuracy by category
- Current streaks
- Badges earned
- Personal goals progress
- Learning trends

**Parent Dashboard View:** Full family stats (for monitoring, not shown to Krish)
- Summary: Volume per child
- Comparison: Side-by-side stats (accuracy, streaks, badges)
- Trends: Week-over-week improvement/growth per child
- No ranking/leaderboard, but full visibility for parents
- **Design principle:** Krish never sees sibling comparison to avoid competition anxiety

### 🎓 Difficulty Progression
- **Unlock system:**
  - Rookie (default): Available day 1
  - Pro: Unlock at 80% accuracy on Rookie (data-driven, monitor)
  - Legend: Unlock at 80% accuracy on Pro
- **Explanation:** When unlocked, show "You hit 80% Rookie accuracy. Ready to challenge yourself?"
- **Invitation:** Offer to try new difficulty (not forced)
- **Pre-answer indicator:** Show difficulty (color-coded icon) before answering
- **Explanation layer:** Show skill needed ("Uses inference skills", "Tests memory")

### 💡 Hint System
- **How hints work:** Show clue relevant to question
- **Voting:** Krish votes if hint helpful/unhelpful
- **Improvement:** Hints with negative votes get rewritten by Claude, approved by parent
- **Hint discovery:** Tooltip shows what the hint does before using

---

## Phase 5: Advanced Engagement

### 🎮 Mini-Games (12 Total + Daily Wordle)
**Core mini-games:**
1. **Brain Teaser:** Single hard question for big points
2. **Speed Challenge:** Answer as many as possible in 60 seconds
3. **Category Expert:** All questions from one category
4. **Accuracy Challenge:** Get 10 in a row without mistakes
5. **Memory Match:** Match question-answer pairs (memory game)
6. **Guess the Category:** Read question, guess category before revealing
7. **Rhyme Time:** Find rhyming answers or clues
8. **Pattern Detective:** Identify pattern in answers
9. **Word Scramble:** Unscramble answer options
10. **Story Builder:** Connect questions to tell a story
11. **Elimination:** Knock out wrong answers one at a time
12. **Prediction:** Predict if you'll get answer correct, then answer

**Daily Wordle:**
- Available day 1
- Different puzzle each day
- Guessing game with feedback

### 🎮 Mini-Game Mechanics
- **Unlock progression:** Hybrid volume + achievement-based
  
| Game | Unlock Trigger |
|------|---|
| Daily Wordle | Day 1 (available immediately) |
| Brain Teaser | 25 correct answers |
| Speed Challenge | 50 correct answers |
| Category Expert | 75 correct answers |
| Accuracy Challenge | 100 correct answers |
| Memory Match | Silver badge earned |
| Guess the Category | 150 correct answers |
| Rhyme Time | Gold badge earned |
| Pattern Detective | 200 correct answers |
| Word Scramble | 30-day streak achieved |
| Story Builder | Pro difficulty unlocked |
| Elimination | 300 correct answers |
| Prediction | Legend difficulty unlocked |

- **Unlock presentation:** Subtle indicator with "NEW" badge, highlighted when opened
- **Base points:** Varies per game (10-50 base)
- **Bonuses:**
  - Speed bonus (finish fast)
  - Accuracy bonus (get it right)
  - Streak bonus (consecutive wins)

### ⚡ Power-Ups (9 Total)
**Available power-ups (earned from milestones):**
1. **Double Points:** 2x points for next answer
2. **Hint+:** Get 2 hints instead of 1
3. **Streak Shield:** Miss once without breaking streak
4. **Skip:** Skip to next question
5. **Second Chance:** Get question wrong, try again
6. **Category Lock:** Practice one category bonus
7. **Time Freeze:** Extra time on speed challenges
8. **Perfect Guarantee:** Automatically get answer correct (once)
9. **Learning Boost:** Enhanced fun fact for next answer

**Power-up mechanics:**
- **Earning:** Logic-based (100 correct → Double Points, Gold badge → Hint+, etc.)
- **Variety:** Strategic mix (not always earning same power-up)
- **Parent control:** Customize which power-ups from which milestones (Phase 8)
- **Discovery:** Pop-up when earned, inventory shows all, tooltips for help
- **Balance:** Monitor usage, adjust if too powerful/weak

### 🎨 Seasonal Content
- **Sourced monthly:** 50-100 new questions added each month
- **Seasonal themes:** Diwali, Holi, Independence Day, holiday-specific content
- **Timing:** Source 1 month ahead (October for Diwali, January for MLK, etc.)
- **Automation:** Claude sources, Priya approves (semi-automated)
- **Fallback:** Pre-source 3 months ahead, manual fallback pool, hybrid AI as backup

### 🎪 Family Challenges (Team-Based Only)
- **Challenge types:** Team goals only (no individual competition)
- **Examples:**
  - "Family goal: 500 correct answers this month"
  - "Family goal: Master 5 categories (85%+)"
  - "Family goal: 30-day streak as a family"
- **Visibility:** Weekly card shows progress ("247/500 - 49% done")
- **Presentation:** Appears every Sunday, dismissible

### 📱 Daily Featured Question
- **One per day:** Appears on main Family Hub dashboard
- **Family engagement:** All family members see same question
- **Passive design:** No pressure, just there if interested
- **Weekly check:** Parents can see participation stats

### 🎬 Engagement Sustainability (Long-Term)
- **Prestige system:** After earning all badges, reset at higher difficulty and earn again
- **Achievement tiers:** Each achievement has Bronze/Silver/Gold levels
- **Monthly additions:** Fresh content keeps system expanding
- **Seasonal theming:** UI themes change with seasons (full colors, decorations, animations)
- **Parent customization:** Control theme intensity (full/subtle/off)

### 🔔 Notifications (Smart Management)
- **Consolidation:** Single daily/weekly digest (not multiple notifications)
  - Contains: Goal progress + Learning improvements + Weekly summary + Suggestions
- **Persistence:** Digest stays on-screen until Krish dismisses (never auto-disappears)
- **Priority tiers:** Important → push, minor → in-app only
- **Parent control:** Customizable notification types, frequency, timing
- **Smart scheduling:** No notifications during school hours/bedtime (parent-set)

---

## Phase 6: Organic Learning Reinforcement

### 📚 Learning Model (Simplified)
**No formal Phase 6 review/spaced rep schedule. Instead:**
- Incorrect answers naturally re-appear in regular rotation
- **Higher priority:** Wrong answers appear more frequently than new questions
- **Enhanced content:** When re-answered:
  - "You found this tricky before. Let's learn more about it."
  - Extended fun fact (full 300 characters)
  - Additional learning resources
  - Optional learning link to explore further

### 🎯 Learning Validation (Two-Layer)
1. **Explicit tracking with Krish:** When question answered wrong 3+ times, Krish sees:
   - "You've struggled with this question. Want extra help?" (optional, not forced)
   - If yes: Enhanced learning content, learning link, fun fact
   - If no: Question continues to re-appear organically with extended fun facts
2. **Parent oversight:** Phase 8 alerts parent ("Krish answered Question #47 wrong 3x. Needs intervention in Geography")
   - Parents can proactively intervene or discuss with Krish

### 🧠 Learning Metrics Dashboard
- **Displayed to Krish:** Key stats (accuracy, streak, badges, favorite category)
- **Displayed to parents:** Full detail organized in tiers (summary → drill-down → full)
- **Learning trends:** Chart showing improvement arcs per category over weeks/months
- **Longitudinal validation:** Track if Krish's accuracy improvements sustain over time

### 📊 Learning Improvement Notifications
- **Weekly summary:** "Here's your improvement this week"
- **Milestone celebrations:** "You hit 75% accuracy on Science!"
- **Contextual praise:** Tied to specific categories/skills
- **Encouragement:** Focus on progress, not comparison

### 💬 Parent-Child Communication
- **Two-way chat:** Parent and Krish can message about progress/learning
- **In-dashboard:** Appears in main screen + dashboard
- **Fosters discussion:** About learning, struggles, achievements

---

## Phase 7: Question Expansion & Improvement

### 📊 Sourcing Workflow (Parallel Batches)
- **3 batches in flight:** Different stages simultaneously
- **Weekly deployment:** New batch completes and deploys each week
- **Monthly total:** 50-100 questions added per month
- **Claude automation:** AI sources questions from reputable sources
- **Priya approval:** Final validation before questions go live

### ✅ Question Quality Assurance
- **Validation checklist:** Accuracy ✓ Age-appropriate ✓ Grammar ✓ No bias ✓
- **Sampling QA:** Random 20% of new questions audited deeply
- **Quality feedback loop:**
  - Flag low performers (questions <40% correct rate)
  - Smart tagging (system suggests difficulty adjustment)
  - Manual review (Priya decides on changes)

### 🏷️ Difficulty Auto-Calibration
- **Data-driven:** Monitor actual performance vs. tagged difficulty
- **Suggestion system:** When 80%+ consensus that difficulty is wrong, system suggests change
- **Parent approval:** Priya reviews and approves before difficulty tag changed
- **Goal:** Keep difficulty labels accurate over time

### 🎨 Hint Improvement Workflow
- **Voting:** Krish votes helpful/unhelpful on hints
- **Auto-generation:** Claude generates 2-3 hint alternatives for flagged questions
- **Parent selection:** Priya picks best alternative (or edits)
- **Deployment:** Improved hints replace old ones

### 🔗 Learning Link Maintenance
- **Continuous checks:** System periodically tests if links work
- **Passive reporting:** Parents/Krish can report broken links in app
- **Priya fixes:** Replace broken links with working alternatives
- **Content quality:** Links stay relevant and accessible

### 📝 Question Retirement & Archiving
- **Update in place:** Time-sensitive questions (current President) just get updated
  - Updates create new version (UUID + version number)
  - Krish's old answers linked to old version (historical accuracy preserved)
  - New players see latest version
- **Retire & replace:** Obsolete questions removed, new similar ones added
- **Archive:** All retired questions kept (viewable for history, not shown to new players)
- **Lifecycle:** Auto-update old data, notify parents before deletion (manual approval required)

### 📊 Difficulty Voting Feedback
- **Tracking:** When questions get 3+ votes "too hard/easy", flag for review
- **Parent notification:** Phase 8 alerts ("Question #47 voted 'too hard' 5x")
- **Phase 7 review:** During expansion cycle, rebalance flagged questions

### 🌍 Diversity Auditing & Monitoring
- **Quarterly audit:** Every 3 months, human review of diversity across all questions
- **Automated flags:** Claude flags bias concerns during sourcing
- **Dashboard visibility:** Phase 8 shows diversity metrics (% Science, % History, % Cultural, etc.)
- **Continuous monitoring:** System alerts if recent additions are imbalanced

### 🔄 Content Refresh Strategy
- **Monthly additions:** 50-100 new questions added continuously
- **Continuous fixes:** Wrong/outdated questions fixed immediately
- **Batch review:** Phase 7 expansion reviews everything, makes strategic improvements
- **Archive management:** Old questions moved to archive, newer content featured

### 🆔 Question ID System
- **UUID-based:** Each question has unique UUID (not sequential)
- **Version tracking:** Questions can be updated, versions tracked
- **Answer linkage:** Answers linked to question UUID + version
- **Migration-safe:** Enables data migration (Phase 9+) without ID conflicts

---

## Phase 8: Customization & Parent Control

### 👤 User Profiles (Multi-Child Support)
- **Profile setup:** 5-step wizard (name → avatar → theme → goals → preferences)
- **Per-child settings:** Each child has separate progress, preferences, goals
- **Custom avatars:** Child selects/creates avatar
- **Theme selection:** Child picks from 15 theme packs (affects difficulty names)
- **Personal goals:** Child can set weekly/monthly targets
- **Notification control:** Child controls notification types (with parent override)

### 📊 Parent Dashboard (Context-Switching Interface)
- **Single dashboard with view toggles:** Settings | Analytics | Questions | Profiles
- **Dashboard cards:** Grid of feature cards for easy navigation
- **First-time wizard:** Guides new parents through features step-by-step
- **Preset profiles:** "Recommended", "Strict Parent", "Free Exploration", "Custom"
- **Context-aware:** Switch between analytics/settings/content seamlessly

### ⚙️ Parent Control Features

**Time management:**
- Custom daily limits (10/20/30/60 mins per child)
- Time warnings ("30 min left today")
- Session end message (network unavailable → "Go read a book!")

**Content filtering:**
- Block individual questions ("Question #47 rejected")
- Block topic/subtopic ("No Politics questions", "No Climate Change")
- Approve/deny questions before going live

**Notification customization:**
- Notification frequency (off/daily/weekly)
- Which notifications enabled (milestones, improvements, achievements)
- Smart timing (no notifications during school/bedtime)

**Feature management:**
- Feature flags for Phase 4-5 features (enable/disable)
  - Disabled features: Hidden from Krish's UI but progress tracked behind scenes
  - If re-enabled: Krish sees unlocks continue where they left off (progress preserved)
- Soft-launch features (gradual rollout over weeks, not all at once)
- Power-up customization (map which earned from which milestones)

**Customization:**
- Difficulty theme selection (15 packs)
- Animation speed control (accessibility)
- Sibling visibility settings (how much they see each other's stats)
- Goal-to-content workflow (alert parent if goal needs new content)

### 📈 Parent Analytics & Insights
- **Curated core metrics:** 5-7 key stats by default (clean view)
- **Smart insights:** "Krish improving in History!" "You're on track for 150 this month!"
- **Customizable:** Add/remove additional metrics if desired
- **Data access:** Full detail available in tiers (summary → drill-down → full)
- **Family stats view:** Volume | Performance comparison | Growth trends
- **Learning trends:** Chart of accuracy improvements per category over time
- **System health:** Storage, backups, last update, performance status

### 📧 Progress Reports (Optional)
- **Configurable frequency:** Weekly/monthly/off
- **Auto-send:** If enabled, email summary to parent
- **Report content:** Questions answered, accuracy, improvements, milestones
- **Example:** "Krish answered 147 questions this week. Accuracy: 73%. Big improvement in Geography!"

### 💾 Data Export Options
- **CSV export:** Question history as spreadsheet (for analysis)
- **PDF report:** Printable monthly/quarterly summary
- **JSON backup:** Full data export (for backup/migration)

### ❓ User-Created Questions
- **Krish creates:** Krish writes questions, submits for approval
- **Parent approves:** Parent reviews, can edit before publishing
- **Contribution recognition:**
  - Approval notification ("Your question was approved!")
  - Usage stats ("Your question was answered 5 times")
  - Contribution badge ("Question Creator")

### 🎓 Krish's Data Access
- **Age-appropriate transparency:** Krish sees key stats (accuracy, streak, badges)
- **Parents see everything:** Full data access for oversight
- **Data awareness:** Krish understands what's being tracked, why

### 📱 Mobile/Responsive
- **Activity Board:** Primary interface (iPad/tablet)
- **Parent app:** Web-based initially, mobile app planned (Phase 9+)
- **Single-device only:** Data stays on one device (Phase 1-8), cloud sync Phase 9+

### 📚 Parent Help & Documentation
- **In-app help:** Tooltips, FAQ accessible from dashboard
- **Separate guide:** PDF/webpage with comprehensive documentation (how-tos, explanations)

---

## Cross-Phase Features & Suggestions (25 Total)

### 0. Data Update & Maintenance Window
- **Off-peak update window:** 2-3 AM Denver time (Mountain Time)
- Updates only occur during this window (never during play hours)
- Includes: Question additions, improvements, fixes, syncs
- No disruptions to Krish's gameplay

### 1. First-Week Onboarding Path
- Day 1: Profile setup + first 5 questions
- Day 2: Earn streak/points celebration
- Day 3: Unlock first mini-game
- Day 4: Earn first badge
- Day 5: Parents set family goal together
- Structured introduction to system features

### 2. Cloud Storage & Backup Strategy
- **Phase 1-8:** Auto-export to Google Drive on schedule (daily/weekly, parent-configurable)
  - Timestamped JSON backups in Google Drive folder
- **Phase 9:** Dedicated cloud backend replaces Google Drive backups
- Two-layer approach: simple protection now, proper backend later

### 3. Parent Control Presets
- "Recommended (Default)" — balanced settings
- "Strict Parent" — strong limits, full oversight
- "Free Exploration" — minimal limits
- "Custom" — full manual configuration
- Reduces decision fatigue

### 4. Engagement Sustainability
- **Prestige system:** Earn badges again at higher difficulty after completing
- **Achievement tiers:** Bronze/Silver/Gold for each achievement
- Long-term progression prevents boredom

### 5. Error Recovery & Resilience
- Auto-save drafts locally (recover if app crashes)
- Submit confirmation (verify answer saved)
- Retry logic (if submit fails, offer retry)

### 6. Phase-Wide Accessibility Audit
- After all phases built, comprehensive accessibility testing
- Check: Mini-games, parent dashboard, settings, profiles
- Real users with accessibility needs test before launch

### 7. Learning Outcomes Measurement
- **Longitudinal tracking:** Monitor accuracy trends over weeks/months
- **Phase 8 visualization:** Learning Trends chart (improvement arcs per category)
- **Validates system:** Proof that learning actually improves over time

### 8. Storage Scalability (3-Layer)
- **IndexedDB primary:** 50MB capacity, optimized for large datasets (Phase 1+)
- **localStorage fallback:** For edge cases where IndexedDB unavailable
- **Compress data:** Gzip questions and metadata for efficiency
- **Archive old:** Move historical questions to archive storage
- Supports growth to 5000+ questions over years
- Migration strategy: Phase 9 transitions to cloud backend (IndexedDB → JSON migration straightforward)

### 9. Parent-Child Communication
- **Two-way chat:** Parent and Krish message about progress/learning
- **In-dashboard:** Visible on main screen
- **Fosters discussion:** About struggles, achievements, goals

### 10. System Documentation
- **Architecture guide:** How phases fit together, data flow, tech stack
- **Implementation guide:** Step-by-step for each phase
- **Decision log:** WHY for each major choice
- For future maintainers/extensions

### 11. Seasonal Content Contingency (3-Layer)
- Pre-source 2-3 months ahead (larger buffer)
- Manual fallback pool (Priya's backup seasonal questions)
- Graceful degradation (use regular questions + banner if missing)

### 12. A/B Testing Framework
- Implement A/B testing system for optimization
- Test variants: difficulty thresholds, badge rewards, unlock criteria
- Track engagement, accuracy, retention per variant
- Data-driven iteration

### 13. Quality Gates (Sampling)
- Random audit of 20% of new questions deeply
- Prevents quality degradation during rapid expansion
- Catches issues without slowing growth

### 14. Diversity Monitoring (Continuous + Quarterly)
- Automated flags during sourcing (Claude checks for bias)
- Real-time dashboard metrics (Phase 8)
- Quarterly human audit of full diversity
- Ensures cultural representation

### 15. Sibling Encouragement Mechanics
- Growth messaging: "You improved 15% this week!"
- Effort recognition: "You answered 147 questions!"
- Personalized suggestions: "Keep working on Geography!"

### 16. Data Privacy & Retention (Refined)
- Archive after 1 year (keep forever, don't auto-delete)
- Show notification to delete (requires parent approval)
- Krish can request deletion anytime (parent approves)
- Conservative: preserves data by default

### 17. Krish's Data Transparency
- Krish sees: Key stats (accuracy, streak, badges, favorite category)
- Parents see: Everything (full data access)
- Builds trust, teaches data awareness

### 18. Question Quality Feedback Loop
- Flag low performers (questions <40% correct)
- Smart tagging (system suggests difficulty adjustment)
- Manual review (Priya reviews and decides)
- Uses performance to continuously improve

### 19. Network Unavailable Handling
- When network fails: Show friendly message
- Suggest alternatives: "Read a book", "Work on a workbook", "Practice Kung Fu"
- Encourages alternative learning instead of waiting

### 20. Question Difficulty Explanation
- Label: Easy/Medium/Hard with color indicator
- Tagline: Brief skill reason ("Uses inference", "Tests memory")
- Tooltip: Detailed explanation (hover/tap)
- Transparent difficulty reasoning

### 21. System Health Monitoring (HA-Wide)
- Storage usage, backup status, performance metrics, error logs
- Applied to OVERALL Family Hub (not just trivia)
- Parents see at-a-glance system status
- Full monitoring for transparency

### 22. Content Curation (3-Layer)
- **Featured question:** Weekly highlighted question (curated)
- **Trending:** Popular, well-reviewed questions shown
- **Personalized:** AI suggests based on Krish's progress/interests
- Prevents question fatigue with large pool

### 23. Question Source Attribution
- Source tag: Shows origin (Khan Academy, Wikipedia, Parent-created)
- Source link: Tap to explore that source further
- Teaches where knowledge comes from, enables deeper learning

### 24. Krish's Contribution Recognition
- Approval notification: "Your question was approved!"
- Usage stats: "Your question was answered 5 times this week"
- Contribution badge: "Question Creator"
- Motivates quality question creation

### 25. Seasonal UI Theming (Customizable)
- Full theming: Colors, decorations, animations per season
- Examples: Diwali (warm colors + diyas), Holi (rainbow colors)
- Parent customizable: Full/subtle/off intensity
- Celebrates seasons, builds excitement

---

## 📋 Implementation Roadmap

### Pre-Implementation
- [ ] Create comprehensive architecture documentation
- [ ] Set up development environment
- [ ] Create implementation guides for each phase
- [ ] Decision log (this document)

### Phase 1 Launch (Weeks 1-3)
- [ ] Build 1000-question database
- [ ] Implement question storage (localStorage)
- [ ] Set up UUID system
- [ ] Test question loading performance

### Phase 2 Launch (Weeks 4-5)
- [ ] Implement data tracking
- [ ] Build localStorage persistence
- [ ] Create answer history system
- [ ] Build performance metrics dashboard

### Phase 3 Launch (Weeks 6-8)
- [ ] Build UI/UX components
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Create onboarding flow

### Phase 4 Launch (Weeks 9-11)
- [ ] Implement points system
- [ ] Build streak tracking
- [ ] Create badge system
- [ ] Build goals system

### Phase 5 Launch (Weeks 12-15)
- [ ] Build 12 mini-games
- [ ] Implement power-ups
- [ ] Add seasonal content
- [ ] Create family challenges

### Phase 6 Launch (Weeks 16-17)
- [ ] Implement organic reinforcement
- [ ] Build learning metrics
- [ ] Add parent-child chat

### Phase 7 Launch (Weeks 18-22)
- [ ] Set up parallel sourcing workflow
- [ ] Build QA system
- [ ] Create admin tools for content management
- [ ] Implement diversity auditing

### Phase 8 Launch (Weeks 23-25)
- [ ] Build parent dashboard
- [ ] Implement all customization controls
- [ ] Create analytics interface
- [ ] Add data export features

### Pre-Production
- [ ] Comprehensive testing (Phases 1-8)
- [ ] Accessibility audit with real users
- [ ] Performance optimization
- [ ] Final documentation

### Launch
- [ ] Deploy to Family Hub Activity Board
- [ ] Monitor performance
- [ ] Gather user feedback
- [ ] Begin Phase 7 improvements cycle

---

## 📊 Success Metrics

### Learning Outcomes
- Accuracy improvement week-over-week (target: +5%)
- Category mastery (target: 85%+ accuracy sustained)
- Retention rate (questions correct month after initial learning)

### Engagement
- Daily active play (target: 3-5 days/week)
- Average session length (target: 10-20 mins)
- Questions answered per week (target: 30-40)
- Mini-game adoption (target: 80%+ use each game)

### Motivation
- Badge completion rate (target: 70%+ earn all badges in first 3 months)
- Streak continuation (target: average 10+ day streaks)
- Goal completion (target: 80%+ complete monthly goals)

### Parent Satisfaction
- Dashboard usage (target: 3+ logins per week)
- Feature customization (target: 60%+ customize at least one setting)
- Positive feedback (target: 90%+ satisfaction)

---

## 🎯 Design Philosophy

### Principles
1. **Learning first:** Gamification serves learning, not vice versa
2. **Organic growth:** System grows naturally with seasons + monthly additions
3. **Respect differences:** No forced competition, celebrate individual progress
4. **Parent control:** Comprehensive oversight without micromanagement
5. **Transparency:** Krish understands what's tracked, why
6. **Joy:** Make learning fun, celebrate achievements
7. **Resilience:** Handle failures gracefully, encourage alternatives

### Trade-offs Made
- **No leaderboards:** Prevents comparison anxiety, focuses on personal growth
- **No auto-delete:** Conservative with data, requires active parent approval
- **No mobile app for kids (yet):** Simplifies Phase 1-8, enables Phase 9 mobile after proof
- **Organic learning (not formal spaced rep):** Simpler, still effective, less rigid
- **localStorage (not cloud initially):** Fast iteration, Phase 9 adds cloud

---

## 📝 Version History

- **v1.0 - 2026-06-10:** Complete design specification locked, 150+ decisions documented
- Ready for implementation phase

---

**Document prepared by:** Claude (Design Phase)  
**For:** Priya & Family Hub Team  
**Status:** Ready for Implementation ✅
