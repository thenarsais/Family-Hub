# 🚀 Trivia System Implementation Plan & Risk Review

**Document:** Pre-implementation risk identification and detailed breakdown  
**Date:** 2026-06-11  
**Status:** Ready for review before coding begins

---

## 📋 Implementation Breakdown (25-Week Timeline)

### Phase 1: Question Bank & Foundation (Weeks 1-3)

**What to Build:**
- IndexedDB schema for questions
- Question storage/retrieval system
- UUID generation and versioning
- Question loading optimization (hybrid pre-load buffer)
- localStorage fallback mechanism

**File Structure:**
```
modules/
├── trivia-questions-data.js (1000+ questions)
├── trivia-db.js (IndexedDB schema + operations)
├── trivia-loader.js (pre-load buffer, lazy-load)
└── trivia-utils.js (UUID, helpers)
```

**Detailed Tasks:**
1. Create IndexedDB schema (questions, versions, categories)
2. Build question CRUD operations
3. Implement pre-load buffer (3-5 questions ahead)
4. Build localStorage fallback detection
5. Create sample 100-question test dataset
6. Test IndexedDB quota handling (50MB limit)
7. Build question validation checklist

**⚠️ Issues & Gaps Identified:**

#### **GAP 1: Image Storage Strategy (Not Specified)**
- Each question can have an image
- 1000+ questions = potentially large image files
- Problem: Where are images stored?
  - Option A: Base64 encode in IndexedDB (bloats data, slow)
  - Option B: Store URLs, lazy-load from server (need server)
  - Option C: Store locally, reference by ID
- **Recommendation:** Option C - store images in separate IndexedDB blob store, reference by ID
- **Action:** Define image storage schema before building

#### **GAP 2: Question Categories Edge Case**
- Design specifies 19+ categories
- Some categories have only 50-80 questions
- Problem: Weekly rotation wants 35-40 questions/week
- If Geography has 120 questions, that's 3 weeks before repeating
- If Arts has 60 questions, that's 1.5 weeks
- **Issue:** How do we handle categories with insufficient questions?
- **Options:**
  - A) Mix categories (don't isolate by category for weekly rotation)
  - B) Require minimum questions per category (60-80)
  - C) Shorter rotation cycle for small categories
- **Recommendation:** Mix categories, rotate across ALL questions (not per-category)
- **Action:** Clarify weekly rotation logic

#### **GAP 3: Source Attribution & Copyright**
- Questions have source attribution (Khan Academy, Wikipedia, etc.)
- Problem: Some sources might have licensing requirements
- **Issue:** Are we tracking/respecting licenses?
- **Action:** Define copyright/license tracking in question metadata

#### **GAP 4: Learning Links Validation**
- Each question has learning link (educational resource)
- Problem: Links could be broken, outdated, or disappear
- **Issue:** Phase 7 says "continuous link checks" but Phase 1 doesn't specify initial validation
- **Recommendation:** Validate all learning links at Phase 1 launch (before going live)
- **Action:** Add link validation step to sourcing workflow

#### **GAP 5: Question Difficulty Mapping**
- Design says "Rookie/Pro/Legend → backend: easy/medium/hard"
- Problem: 15 theme packs each have different names (Sidekick/Hero/Legend vs. Cadet/Captain/Commander)
- **Issue:** How do we map 15 different naming schemes to 3 backend difficulties?
- **Recommendation:** Store BOTH difficulty (easy/medium/hard) AND theme-specific name
- **Action:** Update question schema to include both

---

### Phase 2: Core Learning System (Weeks 4-5)

**What to Build:**
- Answer tracking system
- Performance metrics calculation
- Streak tracking (3 types)
- Learning reinforcement pool
- Google Drive backup system

**File Structure:**
```
modules/
├── trivia-tracker.js (answer history, metrics)
├── trivia-streaks.js (daily/category/accuracy streaks)
├── trivia-learning.js (organic reinforcement, incorrect pool)
├── trivia-backup.js (Google Drive export)
└── trivia-data-schema.js (IndexedDB schema)
```

**⚠️ Issues & Gaps Identified:**

#### **GAP 6: Google Drive Authentication**
- Design specifies Google Drive auto-export
- Problem: Requires OAuth authentication
- **Issue:** How do parents authenticate with Google Drive?
  - When? (First load? Phase 8 setup?)
  - Fallback if they decline?
  - What happens if auth revoked later?
- **Recommendation:** Optional Google Drive in Phase 8, not Phase 1 (launch without backup if needed)
- **Action:** Defer Google Drive backup to Phase 8, add local backup plan for Phase 1-7

#### **GAP 7: Data Corruption Recovery**
- IndexedDB could corrupt or become inaccessible
- Problem: No recovery mechanism specified
- **Issue:** If IndexedDB fails, localStorage fallback is incomplete
- **Recommendation:** Build data validation check on every load, auto-repair if corruption detected
- **Action:** Add data integrity check and repair mechanism

#### **GAP 8: localStorage Fallback Trigger**
- Design says "IndexedDB with localStorage fallback"
- Problem: When do we use fallback?
  - Fallback is only 5-10MB
  - Full system needs 15MB+
- **Issue:** Fallback won't actually work for full data
- **Recommendation:** Fallback is for edge cases ONLY (IndexedDB unavailable), keep IndexedDB as primary
- **Action:** Document fallback as emergency-only, not long-term solution

#### **CONTRADICTION 1: Incorrect Answer Pool Implementation**
- Phase 6 says: "Time-weighted selection: Recent wrong answers appear more frequently"
- Problem: No algorithm specified
- **Issue:** How exactly does time-weighting work?
  - Wrong answer from yesterday = higher weight than 1 week ago?
  - By how much? 2x? 0.5x decay per week?
- **Recommendation:** Define time-decay formula before coding
  - Example: `weight = 1 / (1 + days_since_wrong * 0.2)`
- **Action:** Lock in formula before building

#### **GAP 9: Streak Reset Edge Case**
- Design says: "Grace-save cost: 10% of daily points earned"
- Problem: What if Krish earns 0 points today (answers 0 questions)?
- **Issue:** Can he use grace-save with 0 point cost? Abuse potential?
- **Recommendation:** Minimum grace-save cost (e.g., 1 point, or can't use if no activity)
- **Action:** Define edge case handling

#### **GAP 10: Weekly Rotation Logic**
- Design says: "No repeats within a week: Each child gets different 35-40 questions/week"
- Problem: Implementation not specified
- **Issue:** How exactly does rotation work?
  - A) Select 40 random questions Monday, same 40 all week?
  - B) Select random new question each answer, but exclude past 7 days?
  - C) Bucket logic (Monday-Wed get bucket A, Thu-Sun get bucket B)?
- **Recommendation:** Option B (exclude last 7 days of answers)
- **Action:** Implement exclusion list logic, clear daily

---

### Phase 3: User Experience & Accessibility (Weeks 6-8)

**What to Build:**
- HTML/CSS/JS interface
- Question display component
- Responsive design
- Accessibility features
- Day 1 onboarding flow

**File Structure:**
```
modules/krish-tasks/
├── krish-daily-tasks.html (main app, all in one)
├── css/
│   ├── theme-packs.css (15 theme variations)
│   ├── accessibility.css (high contrast, dyslexia font)
│   └── responsive.css (mobile/tablet)
└── js/
    ├── ui-components.js
    ├── themes.js
    └── accessibility.js
```

**⚠️ Issues & Gaps Identified:**

#### **GAP 11: Single-File Size Concern**
- Design specifies single HTML file
- Problem: File will contain:
  - All HTML markup
  - All CSS (15 themes)
  - All JS (IndexedDB, UI, logic)
  - Potentially 100+ KB
- **Issue:** Will this cause performance issues on load?
- **Recommendation:** Keep single file but optimize:
  - Minify CSS/JS
  - Lazy-load themes (only load current theme)
  - Test load time on real devices
- **Action:** Build performance monitoring into Phase 1

#### **GAP 12: Image Rendering Performance**
- Questions have images
- Problem: Loading + rendering images in hybrid pre-load buffer
- **Issue:** How many images in memory? 3-5 images * image size = ?
- **Recommendation:** Optimize images (compress, resize), lazy-load images after text
- **Action:** Add image optimization step to question sourcing

#### **GAP 13: Text-to-Speech Browser Support**
- Design specifies text-to-speech for accessibility
- Problem: Browser support varies (Chrome/Safari/Firefox all different)
- **Issue:** What's the fallback if TTS unavailable?
- **Recommendation:** TTS is enhancement, not required. Fallback to normal text display.
- **Action:** Test on target browsers, document limitations

#### **CONTRADICTION 2: Difficulty Display vs. Theme Packs**
- Phase 3 says: "Color-coded icon (pre-answer visible)"
- Phase 3 also says: "15 theme packs" change difficulty names
- Problem: Color coding might not scale to 15 different themes
- **Issue:** How do colors map to 15 different theme visual styles?
- **Recommendation:** Color per difficulty (not per theme), theme only changes TEXT label
- **Action:** Clarify color/theme relationship

#### **GAP 14: Onboarding Tutorial Sections**
- Design says: "Spread across 5 days"
  - Day 1: Profile + first 5 questions
  - Day 2: Streak/points
  - Day 3: Mini-game
  - Day 4: Badge
  - Day 5: Family goal
- Problem: What if Krish doesn't play on Day 2?
- **Issue:** Does Day 3 content wait or trigger regardless?
- **Recommendation:** Tie to actions not calendar days (unlock when milestone hit)
- **Action:** Redefine onboarding as "action-based" not "day-based"

---

### Phase 4: Gamification & Motivation (Weeks 9-11)

**What to Build:**
- Points system calculations
- Streak tracking (3 types)
- Badge system (4 tiers per category + 30 special badges)
- Goals system
- Difficulty progression logic

**⚠️ Issues & Gaps Identified:**

#### **CONTRADICTION 3: Difficulty Unlock at 80%**
- Design says: "Unlock Pro at 80% accuracy on Rookie"
- Problem: What if Krish has 75% accuracy (between Rookie/Pro)?
- **Issue:** Can he answer Pro questions anyway? Or locked to Rookie?
- **Recommendation:** Clear rule - at 80% unlock, available immediately (not locked)
- **Action:** Specify unlock mechanics (immediately available, not forced)

#### **GAP 15: Badge Threshold Proportional Scaling**
- Design says: "Silver: 20 correct + 75%, Gold: 50 correct + 85%"
- Design also says: "Proportional thresholds: Scale with category size"
- Problem: How exactly do we calculate proportional thresholds?
- **Issue:** 
  - Science has 150 questions → Silver = 30 correct (20% of 150)?
  - Or still 20 correct regardless?
  - If percentage, what percentage?
- **Recommendation:** Threshold = larger of (absolute minimum OR category-proportional)
  - Example: Silver = max(20, 15% of category size)
  - This ensures small categories still achievable
- **Action:** Lock in formula before coding

#### **GAP 16: Grace-Save When No Points**
- Phase 4 says: "Grace-save cost: 10% of daily points"
- Problem: If earned 0 points today, cost is 0
- **Issue:** Can Krish abuse grace-save (free saves when no points)?
- **Recommendation:** Either:
  - A) Minimum cost (1 point floor)
  - B) Can't use if no points earned that day
  - C) Can't use on consecutive days
- **Action:** Pick one, document it

#### **GAP 17: Goals System Edge Cases**
- Design allows parents to set goals
- Problem: What if goal is impossible?
- **Issue:**
  - Parent sets goal: "Answer 1000 questions this month" (impossible for 9yo)
  - Krish sees goal, tries hard, fails
  - Demoralizing
- **Recommendation:** Validate goals before saving (warn parent if unrealistic)
- **Action:** Add goal sanity check (e.g., ≤ 50 questions/week max)

#### **GAP 18: Sibling Badge Comparison**
- Design says: "No cross-age competition, each child's stats visible but not ranked"
- Problem: But badges ARE visible (Gold badge, etc.)
- **Issue:** If older sibling has all Gold badges and younger has Bronze, isn't that implicit ranking?
- **Recommendation:** On Krish's dashboard, show only HIS badges (not sibling's visible)
- **Action:** Clarify what "visible but not ranked" means exactly

---

### Phase 5: Advanced Engagement (Weeks 12-15)

**What to Build:**
- 12 mini-games + Daily Wordle
- 9 power-ups system
- Seasonal content handling
- Family challenges
- Notification system

**⚠️ Issues & Gaps Identified:**

#### **GAP 19: Mini-Game Implementation Scope**
- Design lists 12 mini-games (Brain Teaser, Speed Challenge, etc.)
- Problem: Each game is essentially a different game type
- **Issue:** This is HUGE implementation effort
  - Speed Challenge (timing, counter)
  - Memory Match (DOM manipulation, flipping)
  - Wordle (logic, guess validation)
  - Etc.
- **Recommendation:** 
  - A) Build all 12 (significant effort, weeks 12-15)
  - B) Build 3-4 core mini-games, defer others to Phase 8
  - C) Make mini-games simpler (all just question variations)
- **Action:** Clarify scope - is this realistic for 4 weeks?

#### **GAP 20: Daily Wordle Puzzle Generation**
- Design mentions "Daily Wordle: Different puzzle each day"
- Problem: How are puzzles generated/stored?
- **Issue:**
  - Need 365 unique puzzles
  - Pre-generated? Or algorithmic?
  - How do we ensure fairness (difficulty consistent)?
- **Recommendation:** Pre-generate 365 puzzles, store in IndexedDB
- **Action:** Define Wordle generation system

#### **GAP 21: Power-Up Balance**
- Design specifies 9 power-ups earned from milestones
- Problem: "Balance: Monitor usage, adjust if too powerful/weak"
- **Issue:** How do we know if balanced?
  - Usage data? (Krish uses Double Points in 50% of games?)
  - Win rate? (Does Double Points increase win rate unfairly?)
  - Feels good? (Subjective)
- **Recommendation:** Track power-up usage, adjust in Phase 8 if data shows imbalance
- **Action:** Build usage telemetry into power-up system

#### **GAP 22: Seasonal Content Timing**
- Design says: "Source 1 month ahead"
- Problem: Phase 7 doesn't start until Week 18
- **Issue:** Phase 1-5 (weeks 1-15) need seasonal content but sourcing not ready
- **Recommendation:** 
  - A) Pre-source seasonal content in Phase 1 (before launch)
  - B) Delay Phase 1 launch until seasonal content ready
  - C) Launch without seasonal content, add in Phase 7
- **Action:** Clarify content readiness timeline

#### **GAP 23: Feature Flags Soft-Launch**
- Design says: "Soft-launch features (gradual rollout over weeks)"
- Problem: If mini-games roll out gradually, testing is harder
- **Issue:** Different kids might unlock different games at different times
- **Recommendation:** Feature flags for TESTING only, not user-facing rollout
- **Action:** Simplify to: all features available on launch day (remove soft-launch complexity)

#### **CONTRADICTION 4: Notification Consolidation**
- Phase 5 says: "Single daily/weekly digest"
- But implementation needs:
  - Daily points check-in (for streaks)
  - Weekly learning summary
  - Goal progress updates
  - Power-up notifications
- **Issue:** Are these all one digest or separate?
- **Design decision:** Single digest (we resolved this)
- **Implementation challenge:** Complex to bundle all notifications into one view
- **Action:** Build notification consolidation system carefully

---

### Phase 6: Organic Learning Reinforcement (Weeks 16-17)

**What to Build:**
- Incorrect answer pool management
- Enhanced content system (extended fun facts)
- Learning validation (flag if wrong 3+ times)
- Parent-child chat system

**⚠️ Issues & Gaps Identified:**

#### **GAP 24: Incorrect Answer Pool Weight Algorithm**
- Design says: "Time-weighted selection"
- Problem: Algorithm not specified
- **Issue:** Needs exact formula
- **Example:**
  - Question wrong yesterday: weight = 1.0
  - Question wrong 1 week ago: weight = 0.5
  - Question wrong 1 month ago: weight = 0.1
- **Recommendation:** Implement exponential decay: `weight = exp(-days_since * decay_rate)`
- **Action:** Lock in algorithm, test with real data

#### **GAP 25: Enhanced Content Source**
- Design says: "Extended fun fact, additional resources"
- Problem: Who writes/sources this?
- **Issue:** Need another content creation workflow
- **Recommendation:** Claude generates enhanced content when sourcing questions (include in question metadata)
- **Action:** Update question schema to include "enhanced_fun_fact"

#### **GAP 26: Parent-Child Chat Security**
- Design adds parent-child chat in Phase 6
- Problem: Chat is stored where? IndexedDB? Google Drive?
- **Issue:** No security/privacy specified for chat
- **Recommendation:** Store chat in IndexedDB, include in Google Drive backups, no encryption (local only, parents/kids)
- **Action:** Define chat storage and privacy model

#### **CONTRADICTION 5: Learning Validation vs. Organic**
- Phase 6 says: "No formal scheduling, organic reinforcement"
- But also says: "Flag if answered wrong 3+ times"
- Contradiction resolved: Explicit tracking with optional help
- **Implementation note:** Need to track count of wrong answers per question
- **Action:** Add tracking in answer history

---

### Phase 7: Question Expansion & Improvement (Weeks 18-22)

**What to Build:**
- Parallel batch sourcing system
- Quality gates (sampling audit 20%)
- Difficulty auto-calibration
- Hint improvement workflow
- Learning link maintenance
- Diversity auditing
- Question retirement logic

**⚠️ Issues & Gaps Identified:**

#### **GAP 27: Content Sourcing vs. Phase Timeline**
- Phase 7 starts Week 18
- But Phase 1-5 need monthly content additions
- Problem: Parallel sourcing system not ready until Week 18
- **Issue:** What sourcing process do we use for Phase 1-6?
- **Recommendation:** 
  - Option A: Manual sourcing in Phase 1-6 (Priya does it)
  - Option B: Phase 7 process starts in Phase 1 (design parallel system early)
- **Action:** Clarify sourcing process for weeks 1-17

#### **GAP 28: QA Sampling Acceptance Rate**
- Design says: "Sample 20% of new questions"
- Problem: What if sample fails QA?
- **Issue:** Do we retry? Fix all? Accept rate threshold?
- **Recommendation:** If <95% of sample passes, review entire batch
- **Action:** Define acceptance criteria

#### **GAP 29: Difficulty Auto-Calibration Data**
- Design says: "Suggest change at 80% consensus"
- Problem: 80% consensus from what sample size?
- **Issue:** 
  - If 5 kids answer question, 4/5 say "too hard" = 80% = change?
  - If 100 kids answer, 80/100 say "too hard" = 80% = change?
- **Recommendation:** Require minimum sample size (e.g., 20+ answers) before suggesting change
- **Action:** Define sample size threshold

#### **GAP 30: Diversity Auditing Targets**
- Design says: "Quarterly diversity audit"
- Problem: What's the TARGET diversity?
- **Issue:** Is 20% cultural questions enough? 30%? 50%?
- **Recommendation:** Define diversity goals:
  - Example: 25% cultural/diversity, 25% science, 20% history, 30% other
- **Action:** Lock in diversity targets before implementation

#### **GAP 31: Learning Link Validation Ongoing**
- Design says: "Continuous checks" for links
- Problem: Which links? How often?
- **Issue:** Check all 1000 links weekly? Monthly? Only recent additions?
- **Recommendation:** Monthly full audit + continuous passive reporting (kids report broken)
- **Action:** Define link maintenance frequency

---

### Phase 8: Customization & Parent Control (Weeks 23-25)

**What to Build:**
- Multi-child profile system
- Parent dashboard (cards + wizard)
- All customization controls
- Analytics and insights
- Data export system
- User-created questions workflow
- Google Drive backup

**⚠️ Issues & Gaps Identified:**

#### **GAP 32: Parent Authentication**
- Phase 8 includes parent dashboard
- Problem: How do parents access it?
- **Issue:** 
  - Same activity board? Different URL?
  - Parent login required?
  - How to prevent Krish from accessing parent dashboard?
- **Recommendation:** Separate parent URL/mode, password or PIN protected
- **Action:** Design parent access system

#### **CONTRADICTION 6: Multi-Parent Customization**
- Design assumes one parent (Priya)
- Problem: What if both parents want to customize?
- **Issue:** Whose settings take precedence?
- **Recommendation:** Support multiple parents, settings are "family-level" not per-parent
- **Action:** Define multi-parent access model

#### **GAP 33: Dashboard Complexity**
- Phase 8 dashboard includes:
  - View all child profiles
  - Customize settings per child (time limits, feature flags, filters, notifications)
  - Analytics (curated core + drill-down + full detail)
  - Family stats (volume, performance, trends)
  - User-created questions approval
  - Data export
  - Help/documentation
- Problem: This is COMPLEX
- **Issue:** Will parents understand all controls?
- **Recommendation:** Build step-by-step with explanations, parent presets (Recommended/Strict/Free), help system
- **Action:** Focus on UX for parent dashboard

#### **GAP 34: Data Export Format**
- Design says: "CSV export, PDF report, JSON backup"
- Problem: Specifications not detailed
- **Issue:** 
  - CSV: Which columns? All answer history? Or summary?
  - PDF: What does report look like? Charts?
  - JSON: What structure?
- **Recommendation:** Define each format before coding
- **Action:** Create example exports

#### **GAP 35: User-Created Questions Workflow**
- Design says: "Krish creates, parent approves"
- Problem: Editor needed for question creation
- **Issue:** Krish needs interface to:
  - Write question
  - Add 4 answer options
  - Mark correct answer
  - Add fun fact
  - Add difficulty
- **Recommendation:** Simple modal with guided form
- **Action:** Design question creation UI

#### **GAP 36: Google Drive Backup Implementation**
- Design says: "Auto-export to Google Drive on schedule"
- Problem: Complex OAuth, API quota, rate limits
- **Issue:** 
  - Need Google OAuth library
  - Handle auth failures gracefully
  - What if Google Drive full?
  - What if rate limited?
- **Recommendation:** 
  - Start without Google Drive backup in Phase 1-8
  - Add in Phase 9 or later
  - Use local backup as fallback
- **Action:** Defer Google Drive to Phase 9

---

## 🔴 Critical Issues Summary

| # | Issue | Severity | Phase | Action |
|---|-------|----------|-------|--------|
| 1 | Image storage strategy | HIGH | 1 | Define before coding |
| 2 | Weekly rotation logic | HIGH | 2 | Clarify algorithm |
| 6 | Google Drive auth | HIGH | 2 | Defer to Phase 9 |
| 11 | Single-file size | MEDIUM | 3 | Add performance monitoring |
| 19 | Mini-game scope (12 games) | CRITICAL | 5 | Reassess feasibility or defer |
| 22 | Seasonal content timing | MEDIUM | 5 | Pre-source before launch |
| 24 | Incorrect answer weighting | HIGH | 6 | Lock in algorithm |
| 27 | Content sourcing timeline | MEDIUM | 7 | Clarify Phase 1-6 process |
| 32 | Parent authentication | HIGH | 8 | Design access system |
| 36 | Google Drive complexity | MEDIUM | 8 | Defer to Phase 9 |

---

## 🟡 Medium-Priority Gaps

- Cache strategy for themes/images
- Browser compatibility testing plan
- Accessibility testing with real users
- Performance benchmarking on real devices
- Error logging/monitoring system
- Data backup/restore testing
- Security audit before launch

---

## 🔵 Suggestions for Enhancement

### Pre-Implementation
1. **Create threat model** - Security review before any code
2. **Performance budget** - Define acceptable load times
3. **Browser matrix** - Which browsers/versions to support?
4. **Mobile testing** - iPad, iPhone, Android specifics?
5. **Accessibility audit checklist** - What exactly to test?

### During Implementation
1. **Feature branch strategy** - How to organize code across phases?
2. **Testing approach** - Unit tests? Integration tests? E2E?
3. **CI/CD pipeline** - Auto-test before merge?
4. **Documentation** - Keep code docs updated per phase?

### Before Launch
1. **Load testing** - Can system handle expected usage?
2. **Security testing** - Penetration testing, XSS tests, etc.?
3. **User testing** - Krish test Phase 1-3 before wider rollout?
4. **Fallback testing** - Test failure scenarios (IndexedDB fails, network fails, etc.)?

---

## 📊 Revised Implementation Timeline

| Phase | Original | Revised | Notes |
|-------|----------|---------|-------|
| 1 | Weeks 1-3 | Weeks 1-4 | +1 week for image/schema decisions |
| 2 | Weeks 4-5 | Weeks 5-7 | +2 weeks for backup/recovery systems |
| 3 | Weeks 6-8 | Weeks 8-10 | +2 weeks for accessibility testing |
| 4 | Weeks 9-11 | Weeks 11-13 | No change |
| 5 | Weeks 12-15 | Weeks 14-19 | +4 weeks due to mini-game complexity |
| 6 | Weeks 16-17 | Weeks 20-21 | No change |
| 7 | Weeks 18-22 | Weeks 22-26 | No change |
| 8 | Weeks 23-25 | Weeks 27-29 | No change |
| **Total** | **25 weeks** | **29 weeks** | **+4 weeks for quality, testing, decisions** |

---

## ✅ Pre-Coding Checklist

Before writing a single line of code:

- [ ] Resolve all 36 gaps (confirm decisions)
- [ ] Lock in algorithms (time-decay formula, badge scaling, etc.)
- [ ] Define image storage strategy
- [ ] Clarify weekly rotation logic
- [ ] Assess mini-game scope (12 games = realistic?)
- [ ] Define parent authentication model
- [ ] Create threat model / security review
- [ ] Define browser compatibility matrix
- [ ] Create example data structures (IndexedDB schema)
- [ ] Document all edge cases (0 points grace-save, etc.)
- [ ] Create testing strategy (what to test, how)
- [ ] Get stakeholder (Krish!) buy-in on scope

---

**This implementation is solid, but the gaps above should be addressed before coding begins.**

**Recommended next step:** Go through critical issues (1, 2, 6, 11, 19, 22, 24, 27, 32, 36) and lock in decisions.
