# Family Hub - All Gaps LOCKED & Ready for Implementation

**Date:** 2026-06-29  
**Status:** Complete specification with locked decisions + reasonable defaults  
**Ready:** YES ✅ Can begin Phase 1 implementation

---

## CRITICAL GAPS (4/4 LOCKED) ✅

### Gap #1: Quest Generation Algorithm ✅ LOCKED

**Decision:**
```
Selection Method: HYBRID ROTATION (Daily rotation through 3 approaches)
  Day 1: Uniform Random (equal chance for all quests)
  Day 2: Weakness Bias (bias toward Krish's weak categories/modules)
  Day 3: Streak Maintenance (bias toward maintaining active streaks)
  Repeat 3-day cycle

Implementation:
  1. Count day of week (Monday = 1, use modulo 3 to determine approach)
  2. Filter pool based on unlocked activities
  3. Apply max 1 points quest, max 1 streak quest, no duplicates
  4. Apply calendar-aware filtering (Kung Fu only on class days, etc.)
  5. For bias: Calculate category performance or streak status
  6. Weighted random selection based on bias
  7. Generate 3 quests from filtered, biased pool

Swap Cost: TIERED & ESCALATING
  1st swap this week: 5% of daily goal
  2nd swap this week: 10% of daily goal
  3rd swap this week: 15% of daily goal
  4th+ swap: Cannot swap (max 3 swaps per week)
  Resets: Monday 00:00 local timezone
  
Example (daily goal = 50 pts):
  1st swap: 2.5 pts cost
  2nd swap: 5 pts cost
  3rd swap: 7.5 pts cost

Rationale:
  - Rotation prevents predictability and boredom
  - Weakness focus helps Krish develop weak areas
  - Streak maintenance keeps motivation high
  - Escalating swap cost prevents overuse while allowing flexibility
```

**Parent Portal Control:**
- Toggle quest bias on/off (default: on)
- Adjust bias strength: None / Light / Medium / Strong (default: Medium)
- Configure swaps per week: 1-5 (default: 3)
- Configure swap cost escalation: Flat / Linear / Aggressive (default: Linear)

---

### Gap #2: Anti-Cheat Detection Thresholds ✅ LOCKED

**Decision:**
```
Suspicious Activity Flagging:

1. POINTS SPIKE DETECTION (Any ONE of these triggers)
   a) Points earned in single session > 2× historical daily average
   b) Points earned in single session > 150% of 7-day rolling average
   
   Example: If Krish typically earns 50 pts/day
     - Trigger if earning > 100 pts in one game session
     - OR if 7-day average is 45 pts and earning > 67.5 pts
   
   Action: Flag for parent review with warning level
   
2. SPEED ANOMALY DETECTION (Only when combined with spike)
   - Don't flag speed alone (natural variance)
   - Only flag if BOTH speed AND points spike detected
   - Trivia speed: Consistent < 2 seconds per question (when spike also present)
   - Games: Complete game in < 50% of expected time (when spike also present)
   
   Example: 10 Quick-Fire questions at 2 min total (12 sec/question) + 150 pts earned
     - Normal (12 sec is acceptable)
   
   Example: 10 Quick-Fire questions at 1 min total (6 sec/question) + 300 pts earned
     - FLAGGED (both fast AND spike together)

3. CLOCK MANIPULATION DETECTION (Pattern-based)
   a) Device time changes by > 1 hour between activities
      - Example: Activity at 3:00 PM, next activity shows 1:30 PM = FLAG
   
   b) Multiple clock anomalies in 24 hours
      - Track 3+ unusual time changes in 24-hour window
      - Anomaly = > 1 hour change
      - If 3+ detected = FLAG for investigation
   
   Does NOT trigger on:
   - Timezone changes (expected)
   - Device time vs server time offset (handled separately)
   - Daylight saving time transitions (pre-detected)

Parent Action on Flag:
  [Approve] - "This is legitimate, mark as approved"
  [Request Verification] - "Ask Krish to explain the activity"
  [Reset Score] - "Don't count this activity, refund points"
  [Investigate More] - "Mark for manual review, parent will investigate"

Audit Trail:
  - Log all flagged activities with reasoning
  - Store parent's decision and notes
  - Use for pattern detection (3+ resets = investigate parent behavior)
```

**Parent Portal Control:**
- Enable/disable anti-cheat (default: on)
- Adjust spike threshold: 1.5×, 2×, 2.5× (default: 2×)
- Adjust speed threshold: 1s, 2s, 3s per activity (default: 2s trivia)
- Adjust clock threshold: 30 min, 1 hour, 2 hours (default: 1 hour)
- View all flagged activities, make decisions

---

### Gap #3: Analytics Formula Specifications ✅ LOCKED

**Decision:**
```
ENGAGEMENT SCORE CALCULATION:

Base Components (Individual scores 0-100):
  1. Frequency Score = (Days with any activity this week / 7) × 100
     Example: Active 5/7 days = 71 points
  
  2. Diversity Score = (Modules attempted this week / Total modules) × 100
     Example: Tried 10 modules out of 20 = 50 points
  
  3. Consistency Score = Based on standard deviation of daily activity
     Formula: 100 - min((StdDev / Mean) × 100, 100)
     Example: If daily activity is steady (low variance) = 85 points
  
Base Engagement = (Frequency × 0.4) + (Diversity × 0.3) + (Consistency × 0.3)
  Example: (71 × 0.4) + (50 × 0.3) + (85 × 0.3) = 28.4 + 15 + 25.5 = 68.9

Streak Multiplier Bonus:
  Count active streaks (currently > 0)
    0-2 streaks active: ×1.0
    3-5 streaks active: ×1.1
    6+ streaks active: ×1.2
  
Final Score = Base Engagement × Streak Multiplier
  Example: 68.9 × 1.1 = 75.8 (rounds to 76)

Color Coding:
  Green (Engaged): 70-100 ✅
  Yellow (Declining): 40-69 ⚠️
  Red (Disengaged): 0-39 🔴

STATUS: Track if score increasing/stable/decreasing (week-over-week)

---

ANOMALY DETECTION:

1. Calculate 7-day rolling average of daily activity
   Example: Last 7 days = [50, 45, 55, 60, 50, 48, 200]
   7-day average = 65.7 pts/day

2. Check if today's activity is anomaly
   Today's value: 200 pts
   Threshold: 65.7 × 1.5 = 98.6
   Since 200 > 98.6: ANOMALY DETECTED ⚠️

3. Confirm anomaly persists next day
   Don't alert parent yet (could be one-off)
   Tomorrow: Check if value still > threshold
   If yes → Send alert to parent

Benefits:
   - Prevents false positives from single-day spikes
   - Captures true behavior changes
   - Gives parent actionable intelligence

---

RECOMMENDATION ENGINE:

Activation: On-demand only (parent clicks "Get Recommendations" in Analytics)

Calculation (Real-time):
  1. Analyze all available metrics
  2. Calculate confidence score for each recommendation (0-100)
  3. Filter to confidence >= 70%
  4. Sort by confidence descending
  5. Show top 5 recommendations

Recommendation Types:

  A) Engagement Boost (When engagement score declining)
     Message: "Krish's engagement is down 30% vs last week. Try setting a new goal in his favorite module (Games)"
     Confidence: (Engagement_decline %) + (Favorite_module_bonus)
  
  B) Goal Suggestion (When category performance low)
     Message: "Science category accuracy is 45%. Consider a Science study goal to boost"
     Confidence: (100 - accuracy_score)
  
  C) Difficulty Adjustment (When completion rate extreme)
     Message: "Wordle win rate is 95% (too easy). Try Hard difficulty for more challenge"
     Confidence: Completion_rate_deviation_from_target_80%
  
  D) Module Exploration (When module underused)
     Message: "Gujarati hasn't been practiced in 2 weeks. It's one of your least-used modules"
     Confidence: Days_since_last_activity / 7
  
  E) Learning Path (When specific skill low)
     Message: "History category is your weakest (30% accuracy). Focus here next week"
     Confidence: (100 - accuracy_score)

Confidence Threshold: >= 70%
  - High bar prevents noisy recommendations
  - Only actionable, high-certainty suggestions shown

Parent Control:
  - View recommendations on-demand
  - Accept/dismiss each recommendation
  - System tracks which recommendations helped (correlation with engagement)
```

**Parent Portal Control:**
- View engagement score anytime
- See trend (↑/→/↓)
- View anomaly detection dashboard
- On-demand recommendations
- Configure anomaly thresholds (1.5×, 2×, 2.5× average)
- Accept/dismiss recommendations to tune algorithm

---

### Gap #4: Unified State Schema ✅ LOCKED

**Decision:**
```
Organization: HYBRID (Core data at root, system-specific nested)

Root-Level (Shared by all systems):
  - _metadata (version, device info, sync state)
  - _sync (offline queue, connection status)
  - _system (theme, language, timezone, device type)
  - users (parent/child accounts)
  - profile (parent profile, child profile)
  - calendar (events, personal items)
  - chores (tasks)
  - meals (weekly plan)
  - shopping (items list)

Nested by System:
  - activityBoard.* (games, trivia, quests, habits, goals, etc.)
  - haDashboard.* (weather, devices)
  - parentPortal.* (dashboard, analytics, automations, settings)

Sync State Management: CENTRALIZED
  - Global _sync object (not per-system)
  - Single offline queue for all systems
  - Each entity has lastSyncedAt timestamp
  - On reconnect: Process queue atomically, update all timestamps

Rationale:
  - Shared data is truly shared (no duplication)
  - System-specific data isolated (easy to expand)
  - Centralized sync prevents conflicts
  - Clear boundaries for team development

Database Mapping:
  - Root-level objects → main tables (users, calendar, chores)
  - Nested arrays → separate tables with foreign keys
  - Example: activityBoard.games.sessions → game_sessions table

See: UNIFIED_STATE_SCHEMA.md for complete JSON structure
```

**Implementation:** See UNIFIED_STATE_SCHEMA.md (complete JSON provided)

---

## REMAINING GAPS (6 gaps: Reasonable Defaults) ✅

### Gap #5: Leaderboard Ranking Algorithm 🟡 DEFAULT

**Decision:**
```
Leaderboard Ranking (Locked):
  
PRIMARY SORT: Score DESC (highest score first)
SECONDARY SORT (Tiebreaker): Timestamp ASC (earliest score first)

Example:
  Rank 1: Krish - 450 pts (completed 2026-06-29 14:30)
  Rank 2: Ali - 450 pts (completed 2026-06-29 14:45)
  Rank 3: Maya - 400 pts

Rationale:
  - Score is primary measure of skill
  - Timestamp tiebreaker is fair (early achievement is harder, more impressive)
  - Prevents gaming the system (can't improve rank just by playing more)

Four Time Views:
  1. All-Time: All sessions ever
  2. This Month: Sessions in current month
  3. This Week: Sessions in current week (Sun-Sat)
  4. Streak Board: Consecutive challenge completions
     - Rank by current streak length
     - Secondary by longest streak (historical)

"Streak Board" Definition (Clarified):
  - Shows challenges won consecutively (without losing a challenge)
  - Rank by current active streak count
  - If tied, secondary by longest historical streak
  - Reset when challenge lost

Completion Rate Display:
  - Show % of challenges attempted that were won
  - Example: "15/20 challenges won (75%)"
  - Helps context (high score with 50% completion ≠ high score with 90% completion)

Personal Best Notification:
  - When Krish beats his previous personal best
  - Shows old score vs new score
  - Celebratory notification + badge candidate
```

**Parent Portal Control:**
- View leaderboards (all 4 time views)
- Filter by game type (Wordle, Quick-Fire, etc.)
- View Krish's rank and completion rate

---

### Gap #6: Daily Challenge Game Order Selection 🟡 DEFAULT

**Decision:**
```
Daily Challenge Game Selection (Locked):

ALWAYS USE ALL 4 GAMES (no random subset)
  - Ensures complete daily challenge experience
  - All 4 games: Wordle, Quick-Fire, Word Scramble, Hangman

Game Order Randomization:
  - Randomized daily at midnight UTC (server-side)
  - Seed: Date-based deterministic (same seed = same order)
  - Algorithm: Fisher-Yates shuffle with date seed
  
Example:
  2026-06-29 midnight UTC: Seed = 20260629
    Order: [Hangman, Wordle, Quick-Fire, Scramble]
  2026-06-30 midnight UTC: Seed = 20260630
    Order: [Wordle, Scramble, Hangman, Quick-Fire]

Benefits:
  - Predictable for testing (same date = same order)
  - Prevents players from gaming (can't avoid hard games)
  - Variety keeps challenge fresh
  - Consistent experience across devices

Difficulty Progression (Locked):
  1st game: Easy
  2nd game: Medium
  3rd game: Medium
  4th game: Hard
  
  Rationale: Warm up (Easy), challenge (Medium/Medium/Hard)

Challenge Modes (Locked):
  - Rookie: 1.5× multiplier
  - Pro: 2.5× multiplier
  - Legend: 3× multiplier
  - Master: 4× multiplier
```

**Parent Portal Control:**
- View daily challenge order
- View Krish's performance per game
- View historical challenge streak

---

### Gap #7: Anomaly Detection Edge Cases 🟡 DEFAULT

**Decision:**
```
Anomaly Detection Details (Refined):

Calculation Method:
  1. Compute 7-day rolling average of daily activity
  2. Compute standard deviation of those 7 values
  3. Upper threshold: Mean + (1.5 × StdDev)
  4. Lower threshold: Mean - (1.5 × StdDev)
  5. If today's value > upper OR < lower: ANOMALY_DETECTED

Confirmation Period: 2 days
  - Day 1 of anomaly: Mark as "potential anomaly"
  - Day 2 of anomaly: Confirm "anomaly detected", notify parent
  - Prevents false positives (single off day)

Parent Notification:
  - Dashboard banner: "Unusual activity pattern detected this week"
  - Link to detailed analysis
  - Don't auto-dismiss (wait for parent to review)

Anomaly Type Classification:
  - Spike: Value > mean (overactivity, possible cheating, or just excited)
  - Drop: Value < mean (disengagement, busy, or sick)
  - Consistent: Value stable = no anomaly (good state)

Parent Actions:
  [Approve] - Mark as expected/explained
  [Investigate] - Flag for deeper analysis
  [Set Recovery] - If drop, auto-suggest recovery day
```

**Parent Portal Control:**
- View anomaly detection dashboard
- See which anomalies were confirmed
- Classify anomalies (expected/investigate)
- Adjust sensitivity (1.5×, 2×, 2.5× standard deviation)

---

### Gap #8: Calendar Sync Conflict Resolution 🟡 DEFAULT

**Decision:**
```
Calendar Conflict Resolution (Locked):

Conflict Scenario:
  - Event edited in Activity Board at 3:00 PM
  - Same event edited in Google Calendar at 3:05 PM (by parent)
  - Who wins?

SOLUTION: Last-write-wins (timestamp comparison)
  - Google Calendar edit timestamp: 3:05 PM
  - Activity Board edit timestamp: 3:00 PM
  - Winner: Google Calendar version (newer)

Resolution Behavior:
  - Silent sync (don't interrupt user)
  - Activity Board reflects Google version on next sync (within 30s)
  - Log conflict in sync log (parent can review)
  - Notify parent only if conflict is >1 hour old
    (Prevents notification storm for simultaneous edits)

Conflict Log Retention:
  - Keep 24-hour detailed conflict log
  - Archive older conflicts (searchable)
  - Parent can view conflict history anytime

Multi-Source Conflict (Activity Board, Google, Outlook):
  - All use same timestamp comparison
  - Newest always wins
  - If all different times, newest wins clearly
  - If multiple at same timestamp, priority: Google > Outlook > Activity Board

Example Timeline:
  2:00 PM: Parent creates "Dentist" event in Google Calendar
  2:05 PM: Activity Board auto-syncs, shows same event
  2:10 PM: Parent edits in Outlook ("Dentist - Dr. Smith, Room 101")
  2:12 PM: Google Calendar reflects Outlook edit (Google has webhook)
  2:15 PM: Activity Board syncs, shows latest version
  Result: Outlook version (newest) displayed everywhere
```

**Parent Portal Control:**
- View calendar sync status (last sync time)
- View conflict log (24 hours detailed)
- Manual conflict resolution (if needed)
- Configure conflict notification threshold (30 min, 1 hour, 2 hours)

---

### Gap #9: HA Device Discovery Edge Cases 🟡 DEFAULT

**Decision:**
```
Home Assistant Device Discovery (Locked):

Discovery Triggers:
  1. Automatic: Hourly (every 60 minutes)
  2. Manual: Parent clicks "Scan for Devices" in smart home settings
  3. On Connection: When Activity Board connects to HA (rare)

Device Status Tracking:
  - Online devices: Show live status
  - Offline devices: Mark with "⚠️ Offline" badge
  - Never-seen devices: Mark with "❓ Unresolved"

Stale Device Handling:
  - If device offline for 7 days: Show warning ("Device hasn't been seen in 7 days")
  - If device offline for 30 days: Auto-remove from list
    - Store in archive (parent can restore)
    - Notify parent: "Removed 'Office Speaker' (offline 30 days)"
    - Can be re-added on next discovery

Duplicate Device Prevention:
  - Entity ID must be unique (HA enforces)
  - If duplicate found: Prompt parent to choose which one
  - Store mapping (entity_id → device_name)

Unsupported Device Handling:
  - If device found but not in supported list (light, lock, etc.)
  - Show as "Unknown Device"
  - Parent can:
    [Add Manually] - Type entity_id + choose type
    [Ignore] - Don't show again
    [Learn More] - Help docs

Device Removal:
  - Parent can remove device anytime (not synced to HA)
  - Just removes from Family Hub UI
  - Device remains in HA
  - Can re-add anytime

Battery Level Monitoring:
  - Check battery on discovery
  - Alert if < 20%
  - Suggest replacement with brand/model
  - Track battery history (trend analysis)
```

**Parent Portal Control:**
- Manual device discovery trigger
- View device status (online/offline/unknown)
- Edit device names/room assignment
- Remove/archive devices
- View battery level warnings
- Configure stale device timeout (7/14/30 days)

---

### Gap #10: Automation Learning Feedback Loop 🟡 DEFAULT

**Decision:**
```
Automation Learning Feedback Loop (Locked):

v1 Simple Learning (6 Pattern Rules):

After suggestion is created:
  Parent has 3 options:
  [Accept] → Create automation, learn from this acceptance
  [Customize] → Modify, then create (learn from the modification)
  [Dismiss] → Don't create (learn that this pattern isn't useful)

Learning System:
  - Track feedback count per pattern type
  - 1-2 accepts: Pattern is good (show more)
  - 3+ dismisses: Pattern isn't working for this family (show less)
  - Track customizations (if always customized, pattern needs refinement)

Pattern Performance Metrics:
  Pattern Type: "Daily Time Pattern"
  - Total suggested: 10
  - Accepted: 6
  - Customized: 2
  - Dismissed: 2
  - Success rate: 80%
  
  Decision: Show more (high success)

Feedback Requirement:
  - Parent must click [Accept/Customize/Dismiss] (not auto-create)
  - Forces parent to think about each suggestion
  - Prevents mindless automation bloat

Learning Output:
  - Personalized pattern detection (knows what works for THIS family)
  - Learns Krish's schedule over time
  - Learns family's preferences (what automations they value)
  - Foundation for v2 ML (has ground truth data)

v2 Advanced ML (Future):
  - 20+ patterns instead of 6
  - Behavioral clustering (busy days, relax days)
  - Correlation analysis (mood ↔ activity ↔ performance)
  - Predictive modeling (forecast patterns)
  - Confidence scores with explanation ("Based on 8 weeks of data")
```

**Parent Portal Control:**
- View suggested automations
- Accept/Customize/Dismiss each
- View pattern performance (success %)
- Configure which pattern types to enable/disable
- Clear learning history (reset preferences)

---

## IMPLEMENTATION CHECKLIST ✅

### Phase 1A: Database & Backend (Week 1)
- [ ] Create PostgreSQL schema from UNIFIED_STATE_SCHEMA.md
- [ ] Implement sync queue system
- [ ] Build API endpoints (30+ endpoints)
- [ ] Setup authentication (JWT, OAuth)
- [ ] Implement offline queueing logic

### Phase 1B: State Management & Sync (Week 1-2)
- [ ] Setup Riverpod providers
- [ ] Implement sync algorithms
- [ ] Setup WebSocket for real-time updates
- [ ] Implement offline detection & fallback
- [ ] Test sync scenarios (offline, reconnect, conflicts)

### Phase 1C: Activity Board MVP (Week 2-3)
- [ ] Games system (4 games core logic)
- [ ] Trivia system (1000 questions, cycling)
- [ ] Daily Quests (130+ templates, generation)
- [ ] Points tracking
- [ ] Badges (unlock conditions)

### Phase 1D: HA Dashboard MVP (Week 2-3)
- [ ] Weather card
- [ ] Calendar (events, sync)
- [ ] Shopping list
- [ ] Announcements banner

### Phase 1E: Parent Portal MVP (Week 3-4)
- [ ] Dashboard overview
- [ ] Analytics (engagement score, recommendations)
- [ ] Activity log viewer
- [ ] Settings management

### Phase 2: Full Implementation (Week 4+)
- [ ] Complete all 20 Activity Board sections
- [ ] Complete all 6 HA Dashboard features
- [ ] Complete all Parent Portal sections
- [ ] Smart home automations
- [ ] Mobile app optimization
- [ ] Comprehensive testing

---

## VERIFICATION CHECKLIST ✅

All gaps addressed:
- ✅ Quest generation algorithm (LOCKED - Hybrid rotation)
- ✅ Anti-cheat detection (LOCKED - Multi-factor detection)
- ✅ Analytics formulas (LOCKED - Detailed calculations)
- ✅ Unified state schema (LOCKED - Complete JSON)
- ✅ Leaderboard ranking (DEFAULT - Score DESC, timestamp ASC)
- ✅ Daily Challenge selection (DEFAULT - All 4 games, deterministic shuffle)
- ✅ Anomaly detection (DEFAULT - 7-day rolling avg, 2-day confirmation)
- ✅ Calendar sync resolution (DEFAULT - Last-write-wins with timestamp)
- ✅ HA device discovery (DEFAULT - Hourly scan, 30-day auto-remove)
- ✅ Automation learning (DEFAULT - Pattern-based feedback)

---

## FINAL STATUS

**Ready for Implementation:** YES ✅

**Confidence Level:** 95%

**Remaining Decisions:** None (only refinements during coding)

**Go/No-Go Decision:** 🟢 GO - Begin Phase 1 Implementation

---

**Next Action:** Begin Technical Architecture & Implementation Planning

