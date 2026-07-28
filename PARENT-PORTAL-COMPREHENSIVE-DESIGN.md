# Parent Portal - Comprehensive Design

**Status:** Complete design specification for v1  
**Date:** 2026-06-16  
**Scope:** Full parent monitoring, management, and customization interface

---

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Layout](#dashboard-layout)
3. [Parent Views & Features](#parent-views--features)
4. [Management Capabilities](#management-capabilities)
5. [Data Visibility & Privacy](#data-visibility--privacy)
6. [Settings & Customization](#settings--customization)
7. [Notifications & Alerts](#notifications--alerts)
8. [Multi-Parent Support](#multi-parent-support)
9. [UI/UX Flows](#uiux-flows)
10. [Integration with Activity Board](#integration-with-activity-board)

---

## Overview

**Purpose:** Give parents visibility into child's activity, ability to manage goals/streaks, and tools to customize the experience.

**Key Principles:**
- ✅ Parent can monitor without controlling (transparency not surveillance)
- ✅ Parent can guide without forcing (suggestions not mandates)
- ✅ Parent respects child's autonomy (can't delete achievements, just adjust)
- ✅ Clean, intuitive UI (parent-friendly, not engineer-focused)

**Access:**
- Web interface (responsive, works on desktop/tablet)
- Separate login from child's Activity Board
- Password-protected
- Can access from any device

---

## Dashboard Layout

### Main Parent Dashboard (Home View)

```
┌─────────────────────────────────────────────────┐
│  Parent Portal - [Child Name]                    │
│  [Home] [Activity] [Goals] [Settings] [Help]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  TODAY'S OVERVIEW                               │
│  ┌──────────────────────────────────────────┐  │
│  │ Points: 50/50 ✅                          │  │
│  │ Daily Streak: 5 days 🔥                   │  │
│  │ Quest Status: 2/3 completed               │  │
│  │ Time Scheduled: 8.5 hours                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ALERTS & NOTICES                               │
│  ┌──────────────────────────────────────────┐  │
│  │ 📋 Busy Day Detected (School + 4.5h)     │  │
│  │    [Set Recovery Day] [Dismiss]           │  │
│  │                                            │  │
│  │ ⭐ Achievement Unlocked: 5-Day Streak     │  │
│  │    "You're on a roll!"                    │  │
│  │                                            │  │
│  │ ⚠️  Flagged Activity at 3:15 PM           │  │
│  │    Quick-Fire: Speed anomaly detected     │  │
│  │    [Review] [Approve] [Investigate]       │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  QUICK ACTIONS                                  │
│  [Set Recovery Day] [View Activity Log]         │
│  [Manage Goals] [Feature Settings]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Top Stats Bar:**
- Points (today / goal)
- Current streak
- Quest progress
- Calendar status (busy/normal/light)

**Alerts Section:**
- Busy day notifications (with quick skip action)
- Achievement unlocks
- Flagged/suspicious activity
- Requests from child (skip day requests)

**Quick Actions:**
- Most common parent tasks at fingertips
- Don't require navigation away from dashboard

---

## Parent Views & Features

### 1. HOME (Dashboard)
**What Parent Sees:**
- Today's snapshot (points, streaks, quests, calendar)
- Real-time alerts (busy day, achievements, flags)
- Quick action buttons

**Actions Available:**
- Set recovery day (quick)
- Review flagged activity (quick)
- Access other views (Activity, Goals, Settings)

---

### 2. ACTIVITY VIEW

#### Activity Log (Real-Time)

```
Activity Log - Today
┌─────────────────────────────────────────────┐
│ [All Activities] [Flagged Only]             │
│ [Today] [This Week] [This Month]            │
├─────────────────────────────────────────────┤
│ 3:15 PM - Quick-Fire Game                   │
│ Score: 150 | 8/10 correct | Time: 2 min    │
│ ⚠️ Flag: Speed anomaly                      │
│ [Review] [Approve] [Investigate]            │
│                                             │
│ 3:16 PM - Word Scramble Game                │
│ Score: 95 | 5 words | No flags              │
│ [Details]                                   │
│                                             │
│ 2:45 PM - Completed Homework                │
│ Math assignment - 45 minutes                │
│ [Details]                                   │
│                                             │
│ 2:00 PM - Habit Check: Yoga                 │
│ ✅ Completed                                 │
│ [Details]                                   │
│                                             │
│ [Load more...]                              │
└─────────────────────────────────────────────┘
```

**Features:**
- Chronological activity log
- Filter by: All / Flagged only / By activity type
- Date range selection
- Click activity for full details

**Activity Details Modal:**
```
Quick-Fire Trivia - June 16, 3:15 PM
┌──────────────────────────────────┐
│ Score: 150 points                │
│ Difficulty: Medium               │
│ Questions: 8 correct / 10 total  │
│ Accuracy: 80%                    │
│ Time Spent: 2 minutes            │
│ Streak Before: 3                 │
│ Streak After: 4                  │
│                                  │
│ Flags Detected:                  │
│ ⚠️ Speed: 2 min for 10 questions │
│    (avg: 3-5 min expected)       │
│    Assessment: Possible skill or │
│    rushing. Review recommended.  │
│                                  │
│ Parent Actions:                  │
│ [Approve] [Request Verification] │
│ [Reset Score] [Adjust Points]    │
└──────────────────────────────────┘
```

#### Calendar View

```
June 2026 - Activity Calendar
┌─────────────────────────────────────────┐
│ S  M  T  W  T  F  S                     │
│ 1  2  3  4  5  6  7                     │
│ 8  9  10 11 12 13 14                    │
│ 15 16 17 18 19 20 21                    │
│    ✅ ✅ ✅ ⚠️ ✅ ⭐ ✅                    │
│                                         │
│ 22 23 24 25 26 27 28                    │
│    ✅ ✅ ✅ ...                          │
│                                         │
│ Legend:                                 │
│ ✅ = Daily goal met                     │
│ ⚠️ = Flagged activity                   │
│ ⭐ = Achievement unlocked               │
│ 🔥 = Streak maintained                 │
└─────────────────────────────────────────┘
```

**Click Day for Details:**
- All activities that day
- Points earned
- Achievements unlocked
- Any alerts/flags

---

### 3. GOALS VIEW

#### Current Goals

```
Weekly & Monthly Goals
┌──────────────────────────────────┐
│ THIS WEEK (Jun 16-22)            │
├──────────────────────────────────┤
│ Goal: Play 10 games              │
│ Progress: ████░░░░░░ 6/10 (60%)  │
│ Deadline: Sunday                 │
│ Status: On track                 │
│ [Edit] [Archive]                 │
│                                  │
│ Goal: Score 300 points           │
│ Progress: ██████░░░░ 180/300     │
│ Deadline: Sunday                 │
│ Status: On track                 │
│ [Edit] [Archive]                 │
│                                  │
│ THIS MONTH (June)                │
├──────────────────────────────────┤
│ Goal: Complete 50 Trivia Qs      │
│ Progress: ████████░░ 42/50 (84%) │
│ Deadline: Jun 30                 │
│ Status: Nearly done              │
│ [Edit] [Archive]                 │
│                                  │
│ [+ Add New Goal]                 │
└──────────────────────────────────┘
```

**Goal Details Modal:**

```
Goal: Play 10 games this week
┌──────────────────────────────────┐
│ Target: 10 games                 │
│ Progress: 6 games played         │
│ Time Remaining: 3 days           │
│                                  │
│ Breakdown by game:               │
│ • Wordle: 2 games                │
│ • Quick-Fire: 1 game             │
│ • Word Scramble: 2 games         │
│ • Hangman: 1 game                │
│                                  │
│ Reward: +50 bonus points         │
│ Likelihood: 85% (on track)       │
│                                  │
│ Parent Actions:                  │
│ [Edit Goal] [Extend Deadline]    │
│ [Remove Goal] [Award Bonus]      │
│ [Archive] [Change Target]        │
└──────────────────────────────────┘
```

**Parent Capabilities:**
- Create new goals
- Edit existing goals (target, deadline, reward)
- View progress real-time
- Award bonus points manually
- Archive/delete goals

---

### 4. ACHIEVEMENTS & STREAKS

#### Achievements Dashboard

```
Achievements & Streaks
┌──────────────────────────────────┐
│ CURRENT STREAKS                  │
├──────────────────────────────────┤
│ 🔥 Daily Activity: 5 days        │
│    Next milestone: 7 days (1 day away)
│    [Details]                     │
│                                  │
│ 🎮 Wordle Wins: 8 games in a row │
│    Next milestone: 10 wins       │
│    [Details]                     │
│                                  │
│ RECENT ACHIEVEMENTS              │
├──────────────────────────────────┤
│ ⭐ 5-Day Streak (Unlocked today) │
│    Daily activity 5 days         │
│    Reward: +50 points            │
│    [Details]                     │
│                                  │
│ 🏆 Quick-Fire Expert             │
│    15 correct answers            │
│    Reward: +25 points            │
│    [Details]                     │
│                                  │
│ ALL ACHIEVEMENTS                 │
├──────────────────────────────────┤
│ [Filter by game] [Sort by date]  │
│ ... complete list ...            │
│                                  │
│ Parent Actions:                  │
│ [View Details] [Award Manual]    │
└──────────────────────────────────┘
```

**Parent Capabilities:**
- View all achievements
- Filter by type (streaks, badges, milestones)
- Award manual achievements (for real-world accomplishments)
- View unlock history
- See reward points per achievement

---

## Management Capabilities

### 1. Recovery Day Management

```
Set Recovery Day - June 16
┌────────────────────────────────┐
│ Calendar is busy today:         │
│ School: 6 hours                 │
│ Homework: 2 hours               │
│ Kung Fu: 1.5 hours              │
│ ─────────────────               │
│ Total: 9.5 hours                │
│                                 │
│ SELECT ACTIVITIES TO SKIP       │
│ ☑ Gujarati Lesson               │
│ ☑ Trivia Questions              │
│ ☑ Daily Games                   │
│ ☐ Chores (keep required)        │
│ ☐ Homework (keep required)      │
│ ☐ Habits (keep)                 │
│                                 │
│ MESSAGE TO CHILD (optional):    │
│ [Big day! You've got a lot...   │
│  Just focus on the essentials.  │
│  Recovery day! Take it easy. 🌟 │
│                                 │
│ [Save Recovery Day]             │
│ [Cancel]                        │
└────────────────────────────────┘
```

**Parent Actions:**
- Approve recovery day automatically suggested by system
- Manually create recovery day on any day
- Selectively skip activities
- Add encouraging message
- View recovery day history

---

### 2. Skip Day Requests (Future)

```
Skip Day Request - Pending
┌────────────────────────────────┐
│ Krish is asking for a skip day  │
│                                 │
│ Reason Selected:                │
│ "Too much scheduled today"      │
│                                 │
│ Schedule Details:               │
│ School: 6 hours                 │
│ Homework: 2 hours               │
│ Activities: 3 hours             │
│ Total: 11 hours                 │
│                                 │
│ Current Streak: 8 days          │
│ Would be protected: YES ✅       │
│                                 │
│ Parent Actions:                 │
│ [Approve Full]                  │
│ [Approve Partial] (select activities)
│ [Deny + Encourage]              │
│ [Dismiss]                       │
└────────────────────────────────┘
```

**Parent Actions:**
- Approve / Deny skip day requests
- Approve selective skipping
- Send encouraging message if deny
- View request history

---

### 3. Activity Adjustment & Anti-Cheat

```
Flagged Activity Review
┌────────────────────────────────┐
│ Quick-Fire Game - June 16, 3:15 PM
│                                 │
│ SUSPICIOUS PATTERN DETECTED     │
│ ┌──────────────────────────────┐│
│ │ Speed Anomaly                 ││
│ │ 2 min for 10 questions        ││
│ │ Expected: 3-5 minutes         ││
│ │ Assessment: Possible skill    ││
│ │           OR rushing/cheating ││
│ └──────────────────────────────┘│
│                                 │
│ PARENT ASSESSMENT:              │
│ Krish was rushing? [ ]          │
│ Legitimate skill? [ ]           │
│ Needs investigation? [ ]        │
│                                 │
│ ACTIONS:                        │
│ [Approve - this is legitimate]  │
│ [Request Verification - ask K]  │
│ [Reset Score - didn't count]    │
│ [Investigate More]              │
│                                 │
│ NOTES:                          │
│ [Optional notes for future ref] │
└────────────────────────────────┘
```

**Parent Capabilities:**
- View all flagged activities
- Approve legitimate activity
- Request child to verify/explain
- Reset scores if suspicious
- Keep notes for patterns

---

### 4. Points & Rewards Management

```
Points & Rewards Control
┌────────────────────────────────┐
│ CURRENT BALANCE                 │
│ Points: 1,250 total             │
│ Daily Goal: 50 points           │
│ Today's Progress: 40/50         │
│                                 │
│ BONUS ADJUSTMENTS               │
│ Daily Bonus Streak: 5 days      │
│ [Manually Reset Streak]         │
│ [Manually Award Bonus Points]   │
│                                 │
│ AWARD CUSTOM POINTS             │
│ Reason: [Real-world achievement]│
│ Amount: [_____] points          │
│ Message: [Optional message]     │
│ [Award Points]                  │
│                                 │
│ POINTS LEDGER                   │
│ [View detailed history]         │
│ [Export report]                 │
│                                 │
│ DAILY GOAL SETTINGS             │
│ Current Goal: 50 points/day     │
│ [Change Goal]                   │
│ [View Progress]                 │
└────────────────────────────────┘
```

**Parent Capabilities:**
- View detailed points ledger
- Award bonus points manually
- Reset streaks (if needed for anti-cheat)
- Change daily goal
- View progress toward daily goal

---

## Analytics & Insights ✅ LOCKED

**Purpose:** Consolidated reporting, trend analysis, and actionable recommendations across both HA Dashboard and Activity Board.

**Organization:** Left sidebar navigation + main panel details

---

### 1. Dashboard Analytics

**Monitor family engagement with dashboard features:**

**Feature Usage Panel:**
- Which features used most (% of page loads)
- Time spent per feature (average session length)
- Feature engagement trends (increasing/decreasing over time)
- Feature adoption timeline (when each feature first used)

**Calendar Analytics:**
- Total events added (this week/month/year)
- Event breakdown (% meals, chores, school, personal, etc.)
- Calendar sync status (Google, Outlook, Apple — which active?)
- Multi-person event frequency (% of events involving multiple people)
- Calendar accuracy (% events marked complete)

**Shopping List Analytics:**
- List creation frequency (how often reset/cleared)
- Average items per list
- Items most frequently added (top 20)
- Store-specific list usage
- Shopping completion rate (% of items purchased)

**Meal Planner Analytics:**
- Weeks with complete meal plans (% coverage)
- Average meal plan coverage (% of meals planned)
- Cuisine preferences (which cuisines planned most)
- Recipe reuse rate (how often same recipe planned)
- Meal plan → shopping list conversion (% of planned meals added to list)

**Announcement Analytics:**
- Announcements sent (this week/month)
- Announcement breakdown (% critical vs. important vs. fun)
- Acknowledgment rate (% of Krish's acknowledgments)
- Most-seen announcement types
- Announcement effectiveness (did Krish act?)

**Dashboard Engagement:**
- Dashboard views (daily/weekly/monthly frequency)
- Time of day usage (when accessed most?)
- Mobile vs. monitor usage (% of views from each device)
- Session length (average time on dashboard)
- Feature discovery (which features accessed, in what order?)

---

### 2. Activity Board Analytics

**Track Krish's progress and engagement:**

**Engagement Metrics:**
- Daily/weekly/monthly activity (time spent, activities completed)
- Activity trend (increasing or decreasing)
- Best/worst days (when most active?)
- Time of day preference (morning vs. afternoon vs. evening)
- Session patterns (short bursts vs. long sessions)

**Points Analytics:**
- Total points earned (lifetime, this month, this week)
- Daily average points (trending?)
- Points by source (% from games, quests, habits, etc.)
- Multiplier effectiveness (how much does bonus multiplier boost?)
- Points cap hits (how often hitting daily cap?)

**Game Analytics:**
- Games played (frequency per game)
- Win rates per game (% wins vs. plays)
- Score trends per game (improving or stagnating?)
- Difficulty preference (% Easy vs. Medium vs. Hard plays)
- Favorite games (most played, highest scores)
- Game mastery (progress toward badges per game)

**Trivia Analytics:**
- Trivia sessions (frequency, duration)
- Overall accuracy (% correct, trending)
- Per-category performance (which categories strong/weak?)
- Difficulty progression (how quickly moving through levels?)
- Category mastery (progress toward expert per category)
- Learning improvement (is Krish getting smarter over time?)

**Quest Analytics:**
- Quest completion rate (% of daily quests completed)
- Quest streak (current + longest)
- Most attempted quest types
- Hardest quests (which abandoned most?)
- Quest difficulty match (are quests too easy/hard?)

**Goal Analytics:**
- Goal completion rate by type (reading 90%, game 60%, etc.)
- Average time to complete goals
- Goal difficulty effectiveness (are tiers appropriate?)
- Goal streak (current + longest per goal type)
- Suggestions ("Reading goals are too easy — try harder ones")

**Habit Analytics:**
- Habit completion rate (% of daily completions)
- Per-habit performance (which have high/low completion?)
- Habit streak (current + longest per habit)
- Habit consistency (which most/least consistent?)
- Best/worst habits (identifying problematic habits)

**Module Usage:**
- Time spent per module (games vs. trivia vs. habits, etc.)
- Module engagement (which most/least used?)
- Module diversity (is Krish trying all modules?)
- Module mastery (progress toward badges per module)

**Achievement Analytics:**
- Total badges earned (24 / 400)
- Badge unlock rate (badges per week/month)
- Badges by category (progress in each category)
- Closest badges to unlock (next 5 badges to target)
- Badge earning velocity (trending?)

**Streak Analytics:**
- All active streaks (current count + days since start)
- Longest streaks (personal records)
- Streak breaks (which break most often?)
- Recovery usage (how often using recovery per streak?)
- Streak sustainability (are streaks lasting longer?)

**Mood Tracking:**
- Mood logging frequency (consistent or sporadic?)
- Mood trends (is Krish happier, sadder, more energetic?)
- Mood patterns (certain times/days with specific moods?)
- Mood vs. activity correlation (mood when active vs. inactive?)

**Reading Analytics:**
- Reading frequency (sessions per week)
- Time spent reading (total minutes, trending)
- Books/items completed (progress toward goals)
- Genre preferences (which genres most read?)
- Reading consistency (steady reader or bursty?)

**Gujarati Analytics:**
- Study frequency (sessions per week)
- Time spent studying (total minutes, trending)
- Phase progression (which phase, pace through curriculum)
- Vocabulary growth (words learned per week)
- Accuracy in practice (% correct on exercises)
- Lesson completion rate (% lessons completed)

---

### 3. Cross-System Insights

**High-level family and child health:**

**Engagement Health:**
- Overall engagement score (composite metric: frequency, diversity, consistency)
- Engagement trend (up 20% vs. down 10% vs. stable)
- Anomalies (sudden drop/spike in activity)
- Health status (Green = engaged, Yellow = declining, Red = disengaged)

**Activity Correlation:**
- Mood vs. activity (happier on high-activity days?)
- Sleep vs. activity (when does Krish have most/least energy?)
- Time of day (peak performance hours)
- Day of week (most/least active days)

**Learning Trajectories:**
- Which modules show improvement (trivia accuracy up, Gujarati mastery up)
- Which modules stagnating (same win rate for 2 weeks)
- Learning velocity (how fast is Krish progressing?)
- Difficulty matching (is content too easy or too hard?)

**Motivational Insights:**
- Badge unlock impact (does unlocking boost engagement?)
- Goal effectiveness (do goals drive engagement?)
- Streak motivation (do streaks keep Krish engaged?)
- Point earning satisfaction (is current economy motivating?)

**Health Warnings (Red Flags):**
- Disengagement (no activity for 3+ days)
- Overuse (8+ hours in Activity Board today)
- Streak burnout (losing 3+ streaks per week)
- Goal frustration (failing multiple goals in a row)
- Difficulty mismatch (all games too easy or all too hard)
- Mood concerns (negative mood entries increasing)
- Sleep issues (activity late at night when should sleep)

**Recommendations Engine:**
- "Krish's engagement is down 30% — try setting a new goal in his favorite module (Games)"
- "Science category accuracy is 45% — consider a Science study goal"
- "Krish completes reading goals 90% of the time — try harder ones"
- "Krish hasn't touched Gujarati in 2 weeks — it's his least-accessed module"
- "Games are too easy (90% win rate) — suggest Hard difficulty"

---

### 4. Reports & Export

**Generate and share analytics:**

**Preset Reports:**
- **Weekly summary:** Engagement, points, badges, streaks (email or download)
- **Monthly report:** Full month analytics with trends and recommendations
- **Quarterly report:** Long-term trends and major milestones
- **Annual report:** Year in review with achievements and growth

**Custom Reports:**
- Select metrics to include (choose from 50+ available metrics)
- Date range (any start/end date)
- Format (PDF, CSV, JSON)
- Schedule report (send weekly/monthly automatically)
- Share report (email to other parent, download, print)

**Export Options:**
- Export all analytics data (JSON for backup/analysis)
- Export activity log (CSV, all events timestamped)
- Export points ledger (CSV, all transactions)
- Export achievement data (CSV, all badges with unlock dates)

**Report Customization:**
- Add notes/commentary to reports
- Compare periods (this month vs. last month, this quarter vs. last year)
- Filter by module/activity type
- Include/exclude recommendations

---

### 5. Custom Dashboards

**Parent-created analytics views:**

**Dashboard Creation:**
- Create custom dashboard (select which charts to display)
- Add metrics (drag-and-drop metric cards)
- Customize charts (bar, line, pie, heatmap)
- Set refresh rate (real-time, hourly, daily)
- Save dashboard (name and reuse)

**Shared Dashboards:**
- Share dashboard with other parent
- Lock dashboard (prevent accidental changes)
- View-only mode (other parent can view but not edit)

**Dashboard Examples:**
- "Krish's Growth" dashboard (all module progress)
- "Health Check" dashboard (engagement, mood, sleep)
- "Weekly Motivation" dashboard (streaks, goals, badges)
- "Module Mastery" dashboard (per-module progress)

---

### 6. Alerts & Recommendations

**Proactive notifications and suggestions:**

**Alert Types (Configurable, off by default):**
- Disengagement alert (no activity for X days)
- Overuse alert (X+ hours in Activity Board today)
- Streak burnout alert (losing X+ streaks per week)
- Goal frustration alert (failing X goals in a row)
- Difficulty mismatch alert (content too easy or too hard)
- Mood concern alert (negative mood entries increasing)
- Milestone alert (badge unlocked, goal completed, etc.)
- Anomaly alert (unusual activity pattern detected)

**Recommendation Types:**
- Engagement boost (suggest activities based on Krish's interests)
- Goal suggestions (recommend next goals based on performance)
- Difficulty adjustments (suggest easier/harder content)
- Module exploration (try underused modules)
- Learning path recommendations (focus on weak areas)

**Alert Delivery:**
- In-app notification (Parent Portal)
- Email digest (weekly summary with alerts)
- Push notification (on mobile)
- Quiet mode (no notifications during quiet hours)

---

**Analytics & Insights Locked Configuration:**
- ✅ All 6 components defined (Dashboard Analytics, Activity Board Analytics, Cross-System Insights, Reports & Export, Custom Dashboards, Alerts & Recommendations)
- ✅ v1 includes: Dashboard Analytics, Activity Board Analytics, Cross-System Insights (basic), Reports & Export (preset + basic custom)
- ✅ v2 adds: Advanced recommendations engine, behavioral predictions, custom dashboard builder, full alert system

---

## User Management ✅ LOCKED

**Purpose:** Multi-parent coordination with role-based permissions, invitations, audit trails, and communication.

---

### 1. Multi-Parent Support Architecture

**Parent Roles & Permissions:**

**Primary Parent (Creator):**
- Full access to all features
- Can invite/remove other parents
- Can change other parent roles
- Can view all audit logs
- Can disable other parent accounts
- Can transfer primary role to another parent
- Cannot be removed (unless transferred first)

**Co-Parent (Full Access):**
- Full access to all Activity Board features
- Can create/edit goals, manage points, adjust settings
- Can invite/remove other parents (except Primary)
- Can view all audit logs
- Cannot change other parents' roles
- Cannot disable other parent accounts
- Can be removed by Primary or other Co-Parent

**Guardian (Limited Access):**
- Read-only access to Activity Board (view activity, analytics, progress)
- Cannot modify goals, points, or settings
- Cannot invite/remove parents
- Cannot view audit logs
- Can approve recovery days (optional, configurable)
- Can review flagged activities (optional, configurable)
- Can be removed by Primary or Co-Parent

**Grandparent (Monitoring Only):**
- Read-only access to Dashboard Analytics and Activity Board summary
- Cannot access detailed activity logs
- Cannot make any modifications
- Cannot invite/remove parents
- Cannot view audit logs
- Can receive weekly/monthly email summaries (optional)
- Can be removed by Primary or Co-Parent

**Guest (Temporary Access):**
- Time-limited access (7 days, 30 days, or custom)
- Read-only dashboard view only
- Cannot access activity logs, settings, or analytics
- Cannot invite others
- Automatically expires or can be manually revoked
- Shows expiration countdown

---

### 2. Parent Invitation & Onboarding

**Invitation Flow:**
- Email address input
- Role selection (Co-Parent, Guardian, Grandparent, Guest)
- Custom permissions configuration (if Guardian)
- Optional message to invitee
- 7-day invitation expiry
- Auto-remove expired invites
- Manual resend and cancel options

**Invited Parent Experience:**
1. Click invitation link
2. Create/verify account
3. Set password (if new)
4. Review role and permissions
5. Accept or decline
6. Redirected to Parent Portal on acceptance

---

### 3. Parent Management Dashboard

**Current Parents List:**
- Primary Parent status and access
- Co-Parent list with last active timestamps
- Guardian list with custom permissions
- Pending invitations with expiry dates
- Quick actions: Change Role, Remove, Resend, Cancel

**Parent Details Modal:**
- Parent name and email
- Current role and permissions
- Activity summary (logins, actions last 30 days)
- Goals created, points adjusted, settings changed
- Account actions: Reset password, View activity log, Deactivate, Remove

---

### 4. Role-Based Permissions Matrix

| Feature | Primary | Co-Parent | Guardian | Grandparent | Guest |
|---------|---------|-----------|----------|-------------|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Activity Log | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ⚙️ | ❌ |
| Create Goals | ✅ | ✅ | ❌ | ❌ | ❌ |
| Adjust Points | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Recovery Days | ✅ | ✅ | ⚙️ | ❌ | ❌ |
| Review Flagged Activities | ✅ | ✅ | ⚙️ | ❌ | ❌ |
| Manage Parents | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Change Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite New Parents | ✅ | ✅ | ❌ | ❌ | ❌ |

⚙️ = Configurable | ✅ = Full access | ❌ = No access

---

### 5. Activity Audit Trail & Logging

**All parent actions tracked:**
- Parent invited/joined/removed
- Role changes (who changed it, from/to role)
- Goals created/edited/deleted
- Points adjusted (amount, reason, notes)
- Settings changed (what changed, old/new value)
- Recovery days approved/denied
- Activities reset/adjusted
- Account deactivations
- Password resets
- Feature toggles enabled/disabled

**Audit Log Features:**
- Filter by date range, parent, action type
- Export to CSV
- Search by parent name or action
- 90-day retention (auto-purged after)
- Timestamps with timezone
- Notes/reasons for significant actions
- Show which version was kept (conflict resolution)

---

### 6. Parent Communication & Preferences

**Parent Notification Settings:**
- Alert when other parent approves/denies skip day
- Alert when other parent adjusts significant points
- Alert when major settings changed
- Alert when goals created/removed
- Delivery methods: In-app, email digest, or real-time email
- Quiet hours (no notifications during specified times)

**Parent-to-Parent Communication:**
- Notes attached to significant actions (goals, points, settings)
- Optional notification to other parents
- In-app notification center
- Read receipts

---

### 7. Parent Account Security

**Account Management:**
- Email change option
- Password change with history (no reuse of last 5)
- Optional 2FA (SMS or authenticator app)
- Session management (view active sessions, sign out remotely)
- Login attempt tracking
- Account lock after 5 failed password attempts
- Automatic logout after 1 hour inactivity

**Deactivation Options:**
- Temporary deactivation (can reactivate)
- Permanent removal (delete from system)
- Deactivated parents remain visible in audit logs
- Inactive status option (keeps audit trail visible)

---

### 8. Multi-Parent Conflict Resolution

**Simultaneous Edit Handling:**
- Detect when two parents editing same goal/setting
- Show conflicting versions to current editor
- Options: Use my version, use other's version, merge manually, cancel
- Last-write-wins with notification to first editor
- Merge prompts for non-conflicting changes
- Audit trail shows which version was kept

---

**User Management Locked Configuration:**
- ✅ 5 parent roles defined (Primary, Co-Parent, Guardian, Grandparent, Guest)
- ✅ Permissions matrix complete
- ✅ Invitation & onboarding flow locked
- ✅ Parent management dashboard locked
- ✅ Audit trail system locked
- ✅ Communication preferences locked
- ✅ Account security features locked
- ✅ Conflict resolution strategy locked
- ✅ v1 includes: Primary, Co-Parent, Guardian roles; invitations; audit trail; basic communication
- ✅ v2 adds: Grandparent role, Guest role, full conflict resolution UI, login tracking

---

## Home Automations & Smart Home ✅ LOCKED

**Purpose:** Enable smart home device control, activity-triggered automations, bidirectional sync with HA Dashboard, automation learning (pattern suggestions).

---

### 1. Smart Home Device Management

**Supported Devices (v1):**
- Light (hue, brightness, color temperature)
- Thermostat (temperature control)
- Speaker (play sound, volume control)
- Door Lock (lock/unlock)
- Plug/Switch (on/off)
- **Camera (live feed, motion trigger, record)**
- **TV (on/off, input switching, volume)**

**Device Features:**
- Auto-discovery from Home Assistant
- Manual entry (entity ID) for unsupported devices
- Real-time status (on/off, brightness, temperature, battery)
- Quick control buttons (context-aware)
- Grouping by room or purpose
- Child access control (direct, automation-only, approval-required, disabled)
- Battery level monitoring with alerts
- Connection status indicator

---

### 2. Hybrid Control (Automation + Direct)

**Design: Both manual control + automations enabled**

**Krish can:**
- Manually toggle lights/devices anytime via Activity Board
- Trigger automations by completing activities
- Override automations with manual control

**Conflict Resolution: Smart Timeout**
- Krish's manual choice TAKES PRIORITY (respects agency)
- System notes override in audit log
- Parent notified of override (optional)
- After 5-10 minutes, automation can reclaim device
- Parent can force either choice anytime
- All tracked in audit trail

**Activity Board UI:**
- Direct control buttons (on/off, brightness, temp, etc.)
- Status showing automation conflicts (if any)
- Duration countdown (how long until automation expires)
- Override options (keep my choice / allow automation)

**Parent Portal:**
- View conflicts & overrides
- Choose conflict resolution strategy:
  - Option A: Let Krish override (default)
  - Option B: Automation always wins
  - Option C: Ask Krish permission
  - Option D: Quiet automation (suggestion mode)

---

### 3. Activity-Triggered Automations

**Trigger Types:**
- Activity Board events (quest completed, habit checked, goal achieved, etc.)
- HA Dashboard events (chore reminder, meal time, bedtime, etc.)
- Time-based (daily at X time, weekly on day, etc.)
- Sensor events (motion detected, temperature threshold, etc.)

**Action Types:**
- Device control (light on/off, brightness, color, temp, lock, speaker)
- Device duration (how long action lasts)
- Optional notifications (show to Krish and/or parent)
- Multiple actions per automation (all execute together)

**Conditions (Optional):**
- Only if mood is positive/negative/specific
- Only on weekdays/weekends
- Only between specific hours
- Only if sensor condition met (motion, temp, humidity)
- Only if another automation active/inactive

**Parent-Created Automation Examples:**

| Trigger | Action | Notes |
|---------|--------|-------|
| Gujarati lesson complete | Bedroom light ON (80%, 10 min) | Daily ritual reward |
| Daily goal achieved | Play celebration chime + flash lights | Motivation boost |
| 7-day streak reached | Speaker plays theme song, all lights flash | Major milestone |
| Game won (90%+ score) | Celebration lights for 3 minutes | Skill reward |
| Mood logged "anxious" | Dim lights (20%, blue), play calm music | Real-time emotional support |
| Reading started | Reading light ON (warm color) | Focus support |
| Bedtime reminder (9 PM) | Gradually dim all lights to 20% | Sleep prep |
| Motion detected (6 AM) | Bedroom light gradually brighten | Wake-up support |
| Homework started | Thermostat to 68°F (cool/focus) | Environment optimization |

---

### 4. HA Dashboard ↔ Activity Board Bidirectional Sync

**Real-Time WebSocket Sync (<1 second):**
- Activity Board → HA Dashboard: Chore completion, mood logs, milestones
- HA Dashboard → Activity Board: Critical alerts, emergency automations
- Latency: <1 second (time-critical events)

**Standard REST Polling (10-30 seconds):**
- Activity Board → HA Dashboard: Activity state updates
- HA Dashboard → Activity Board: Reminders, notifications, calendar updates
- Latency: <30 seconds (non-urgent events)

**Offline Queueing:**
- Activity Board offline: Queue automations, sync on reconnect
- HA Dashboard offline: Queue notifications, deliver on reconnect
- On reconnect: Fire all queued actions in order with timestamps

**Event Examples:**

| Activity Board Event | HA Dashboard Action | Sync Back? |
|---|---|---|
| Chore marked complete | Update chore card | ✅ Yes |
| Daily goal achieved | Send notification | ✅ Yes |
| Mood logged | Update mood sensor | ✅ Yes |
| Streak milestone | Send notification | ✅ Yes |
| HA chore reminder | Activity Board notification | ❌ No |
| HA meal time | Mood logging prompt | ✅ Yes |
| HA bedtime reminder | Quiet mode + dim lights | ❌ No |

---

### 5. Safety & Security Constraints

**Rate Limiting (Prevent spam/overload):**
- Max 5 automations per minute per device (prevent device spam)
- Max 20 automations per hour total (prevent system overload)
- Behavior: Queue automations (don't discard)
- Parent can override rate limits if needed

**Device-Specific Safety:**
- **Door Lock:** Unlock only via automation (not direct), log all unlocks, no unlock during sleep hours
- **Thermostat:** Allow ±5°F adjustments only, prevent extreme temps
- **Speaker:** Volume limit, no late-night activation (after 10 PM)
- **Light:** Brightness limit 10-100%, no strobe effects
- **Camera:** Parent-only view (child cannot see), no recording without consent
- **TV:** On/off + input only (no content selection by child)

**Prohibited Automations:**
- Cannot unlock doors outside home presence
- Cannot disable critical systems (heat, water pump)
- Cannot override manual safety locks
- Cannot activate without explicit parent consent

---

### 6. Automation Learning (Pattern Suggestions)

**v1 Simple Learning (Rule-Based):**

6 pattern detection rules with high confidence (70-85%+):

1. **Daily Time Pattern:** Same activity at same time ±15 min, 5+ days
   - Example: Gujarati at 3:30 PM daily
   - Suggestion: "Daily ritual detected, auto-activate light?"

2. **Weekly Recurring:** Activity on same day 3+ weeks, same time ±30 min
   - Example: Kung Fu on Tuesdays at 5 PM
   - Suggestion: "Weekly Kung Fu, warm up before?"

3. **Regular Frequency:** Activity X times/week consistently
   - Example: Trivia 4 times/week average
   - Suggestion: "Regular trivia player, celebrate milestones?"

4. **Mood After Activity:** Same mood logged 3+ times after activity
   - Example: Happy mood 4/5 times after games
   - Suggestion: "Games make Krish happy, celebrate wins?"

5. **Mood Pattern Timing:** Mood logged at same time 3+ times
   - Example: Anxious at 6 PM (3+ times)
   - Suggestion: "Evening anxiety detected, proactive calm scene?"

6. **Activity Chains:** Activity A → Activity B, 3+ times sequentially
   - Example: Reading → Mood log → Sleep
   - Suggestion: "Reading helps with mood & sleep ritual?"

**v1 Features:**
- Simple rule-based detection (no ML)
- High confidence threshold (70-85%+)
- Safe, obvious patterns only
- 5-10 suggestions per week max
- Parent reviews before automation creation
- Foundation for v2 ML

**v2 Advanced ML Learning:**

20+ sophisticated pattern detectors:
- Behavioral clustering (busy days, relax days)
- Time series analysis (mood trends, energy levels)
- Prediction models (forecast activities)
- Correlation analysis (sleep ↔ mood ↔ performance)
- Anomaly detection (unusual pattern changes)
- Causal inference (why, not just what)
- Flow state detection (deep focus identification)
- Motivation trajectory (when motivation declining)
- Seasonal/contextual patterns (school vs. summer)
- Learning from feedback (why did parent reject?)

**v2 Features:**
- ML-based pattern detection
- Lower confidence threshold (60%+)
- More sophisticated patterns
- 15-20 suggestions per week
- Learns from parent feedback
- Predicts future patterns
- Continuously improves accuracy

---

### 7. Parent Portal Smart Home Controls

**Automation Management Dashboard:**
- View all automations (active/inactive)
- Filter by type (learning, motivation, mood-based, rest/sleep, by device)
- Enable/disable without deleting
- Edit automation (trigger, action, conditions, duration)
- Test automation (simulate immediately)
- View automation history (when fired, success/failure)
- Edit history (show what changed, when, by whom)

**Device Status Dashboard:**
- Overall system health (connected/total devices)
- Per-device status (battery %, connection strength)
- Last activity timestamp
- Active automations per device
- Alerts (low battery, connection issues)
- Quick actions (manually control, adjust settings)

**Conflict Management:**
- View all overrides & conflicts
- See when Krish overrode automation
- Choose resolution (keep override / reset to automation)
- Set override timeout (5-10 min configurable)
- Audit log of all conflicts

**Automation Suggestions:**
- View suggested automations based on patterns
- See pattern analysis (confidence %, frequency, examples)
- [Accept] [Customize] [Dismiss] for each
- Preview automation before creation
- One-click creation on accept

---

### 8. Troubleshooting & Logs

**Smart Home System Health:**
- Overall status indicator (healthy/warning/error)
- Connected devices count
- Active automations count
- Last sync time
- Issues detected (battery low, connection lost, etc.)

**Recent Errors:**
- Automation failures (why)
- Device offline events
- Sync issues
- Rate limit hits

**Sync Status:**
- Last 24h sync count
- Success rate %
- Average latency
- Detailed sync log (view all syncs)

**Automation Success Rate:**
- Last 30 days success %
- Failed automations (which, when, why)
- View automation history (all instances)

---

### 9. Home Assistant Integration

**HA API Requirements:**
- REST API for device status polling
- WebSocket API for real-time sync
- MQTT support (optional, for edge devices)
- Authentication: API token or OAuth

**Supported Entity Types (v1):**
- `light.*` (hue, brightness, color_temp)
- `climate.*` (current temp, set point)
- `lock.*` (lock, unlock states)
- `switch.*` (on/off)
- `media_player.*` (speaker, volume)
- `camera.*` (streaming, snapshot)
- `media_player.*` (TV control)

**Sync Frequency:**
- WebSocket (critical): <1 second
- REST polling (standard): 10-30 seconds (configurable)
- Offline mode: Local-only operation, sync on reconnect

---

### 10. Voice Assistant Integration

**v1: Google Voice Support**
- Voice commands: "Turn on my desk light"
- Activity triggers: "Start my Gujarati lesson"
- Status queries: "Check my points", "What's my mood?"
- Quick actions: "Complete my yoga habit"
- Play sounds: "Play my study music"

**v1 Architecture (Future-Proof):**
```
Activity Board ←→ Voice Assistant Abstraction Layer
                  ├─ Google Assistant API (v1)
                  ├─ Alexa API (v2)
                  ├─ Apple Siri API (v2)
                  └─ Future voice assistants
```

**v2: Multi-Platform Support**
- Alexa commands (same as Google)
- Siri commands (same as Google)
- Custom voice routines
- Cross-platform consistency

---

## Home Automations & Smart Home — Locked Configuration

✅ **Device Support:** Light, Thermostat, Speaker, Lock, Plug/Switch, Camera, TV (v1)
✅ **Device Control:** Hybrid (manual + automation)
✅ **Conflict Resolution:** Smart timeout (Krish priority for 5-10 min)
✅ **Activity Triggers:** 20+ activity-based automations
✅ **HA Sync:** Bidirectional WebSocket + REST polling
✅ **Safety:** Rate limiting (5/min device, 20/hour total)
✅ **Mood Triggers:** Real-time automation + parent aware (Option C)
✅ **Automation Learning:** v1 simple rules + v2 advanced ML
✅ **Voice Control:** Google Voice v1, abstraction layer for Alexa/Siri v2
✅ **Parent Controls:** Full management dashboard + suggestions

✅ **v1 Includes:**
- Device management (7 types)
- Hybrid control (manual + automation)
- Activity-triggered automations
- HA bidirectional sync
- Simple automation learning (6 rules)
- Parent Portal controls
- Google Voice support
- Safety constraints & rate limiting

✅ **v2 Enhancements:**
- Advanced ML learning (20+ patterns)
- Scene builder (grouped device states)
- Presence-based automations
- Multi-platform voice (Alexa, Siri)
- Advanced analytics & insights
- Child direct control (optional)
- Guest temporary access
- Behavioral prediction

---

## Settings & Customization

### Feature Toggles

```
Feature Settings - Customize Experience
┌────────────────────────────────┐
│ GAMES & ACTIVITIES              │
│ ☑ Games section (Wordle, etc)  │
│ ☑ Daily Quests                  │
│ ☑ Trivia Questions              │
│ ☑ Chores                        │
│ ☑ Homework                      │
│ ☑ Habits                        │
│ ☑ Mood Logging                  │
│ ☑ Reading Tracking              │
│ ☑ Gujarati Learning             │
│ ☑ Kung Fu Tracking              │
│ ☑ Calendar                      │
│                                 │
│ ADVANCED FEATURES               │
│ ☑ Points System                 │
│ ☑ Daily Bonus Multiplier        │
│ ☑ Achievements & Badges         │
│ ☑ Leaderboards                  │
│ ☑ Weekly/Monthly Goals          │
│ ☑ Performance Dashboard         │
│                                 │
│ LEARNING RESOURCES              │
│ ☑ Learn More links              │
│ ☑ Related questions             │
│ ☑ Tutorials                     │
│                                 │
│ [Save Changes]                  │
│ [Reset to Defaults]             │
└────────────────────────────────┘
```

**Parent Capabilities:**
- Enable/disable any feature
- Customize feature visibility for child
- Progressive feature unlocking (introduce over time)
- Reset to defaults

---

### Data Visibility Settings

```
Data Visibility & Privacy
┌────────────────────────────────┐
│ WHAT CAN CHILD SEE?             │
│                                 │
│ Time Tracking                   │
│ ☑ Show time spent on activities │
│   └─ Your child sees: "Read for 1h"
│   └─ You can hide this          │
│                                 │
│ Leaderboards                    │
│ ☑ Show game leaderboards        │
│ ☑ Show personal rank            │
│ ☑ Show global top scores        │
│                                 │
│ Achievements                    │
│ ☑ Show all achievements         │
│ ☑ Show achievement requirements │
│ ☑ Show rewards                  │
│                                 │
│ Goals                           │
│ ☑ Show current goals            │
│ ☑ Show progress bars            │
│ ☑ Show deadlines                │
│                                 │
│ Points                          │
│ ☑ Show points earned            │
│ ☑ Show daily progress           │
│                                 │
│ [Save Changes]                  │
└────────────────────────────────┘
```

**Parent Capabilities:**
- Control what child can see
- Show/hide time tracking data
- Show/hide leaderboards
- Show/hide achievement details
- Customize transparency level

---

### Notification Preferences

```
Parent Notifications
┌────────────────────────────────┐
│ EMAIL NOTIFICATIONS             │
│ ☑ Daily summary email           │
│ ☑ Achievement unlocks           │
│ ☑ Flagged activities            │
│ ☑ Streak milestones             │
│ ☑ Skip day requests (future)    │
│ ☐ Every activity logged         │
│                                 │
│ NOTIFICATION FREQUENCY          │
│ ○ Real-time (as it happens)     │
│ ● Daily digest (end of day)     │
│ ○ Weekly summary (Sundays)      │
│                                 │
│ NOTIFICATION TYPES              │
│ ☑ Alerts (important)            │
│ ☑ Achievements (celebratory)    │
│ ☑ Busy day notifications        │
│ ☐ All activity logs             │
│                                 │
│ [Save Preferences]              │
└────────────────────────────────┘
```

---

### Activity Board Settings

```
Activity Board Configuration
┌────────────────────────────────┐
│ CHILD PROFILE                   │
│ Name: Krish                     │
│ Avatar: 🧠                       │
│ [Change Profile]                │
│                                 │
│ DAILY GOAL                      │
│ Current: 50 points/day          │
│ [Change Goal]                   │
│ [View Tracking]                 │
│                                 │
│ TIMEZONE                        │
│ Current: EST (Eastern)          │
│ [Change Timezone]               │
│                                 │
│ THEME                           │
│ Auto-detect by season           │
│ [Or choose: Spring/Summer/Fall/Winter]
│                                 │
│ RECOVER DAY THRESHOLDS          │
│ Auto-trigger at: School + 4h    │
│ [Customize Threshold]           │
│                                 │
│ [Save Settings]                 │
│ [Reset to Defaults]             │
│ [Contact Support]               │
└────────────────────────────────┘
```

---

## Notifications & Alerts

### Alert Types & Triggers

**Real-Time Alerts:**
1. **Achievement Unlocked** - Immediate
   - "🏆 5-Day Streak Unlocked!"
   - Shows in dashboard + email

2. **Busy Day Detected** - Morning
   - "📋 Today is packed (school + 4h activities)"
   - Offers recovery day option

3. **Flagged Activity** - Real-time
   - "⚠️ Suspicious activity detected at 3:15 PM"
   - Requires parent review

4. **Skip Day Request** - Real-time (future)
   - "🌟 Krish is asking for a skip day"
   - Awaiting parent decision

5. **Streak Milestone** - Real-time
   - "🔥 7-Day Streak! Keep going!"
   - Celebratory tone

### Daily Summary Email

```
Daily Summary - June 16, 2026
═══════════════════════════════════

👋 Today's Snapshot
• Points: 50/50 ✅ (Daily goal met!)
• Streak: 5 days 🔥
• Quests: 2/3 completed
• Activities: 8 logged

🎮 Games Played
• Quick-Fire: 150 pts (8/10 correct)
• Word Scramble: 95 pts (5 words)
• Wordle: 85 pts (unlocked with 5)

📋 Alerts
⚠️ Quick-Fire had speed anomaly at 3:15 PM
   [Review in Portal]

🎁 Achievements
None unlocked today (5 away from next)

📊 This Week
Points: 280/350 (80% to goal)
Streak: Maintained 5 days
Games: 12/20 played

🔗 [View Full Portal] [Manage Settings]
```

---

## Multi-Parent Support

**Single User = Single Board Assumption:**
- One Activity Board per child
- One primary parent/guardian per board
- No concurrent multi-parent editing
- Future: Could add view-only access for second parent

**For v1:**
- Single parent login
- Full management capabilities
- View-only mode not required

**For v2:**
- Could add: "Invite second parent" feature
- Second parent gets view-only or co-management access
- Sync approach: Last-write-wins (simple)

---

## UI/UX Flows

### Parent Login Flow

```
1. Parent visits: https://family-hub/parent-portal
2. Login screen (email + password)
3. "Which child?" (if managing multiple boards in future)
4. Dashboard loads with real-time data
5. Can navigate to Activity/Goals/Settings
```

### Daily Workflow (Parent)

```
Morning:
1. Check daily email summary
2. If "Busy Day" alert, decide on recovery day
3. Review any flagged activities (unlikely)

Evening:
1. Log into portal
2. View full activity log
3. Approve/investigate any flags
4. Check if child hit daily goal
5. Award bonus points if extra achievement

Weekly:
1. Review goals progress
2. Set new weekly goals
3. Check leaderboard standings
4. Review achievements
5. Plan next week's settings/features
```

### Recovery Day Setup Flow

```
1. Parent sees "Busy Day Detected" alert
2. Clicks "Set Recovery Day"
3. Modal shows calendar + activities
4. Parent selects which activities to skip
5. Parent writes optional message to child
6. Clicks "Save Recovery Day"
7. Child sees message on Activity Board
8. Skipped activities don't count toward goals/streaks
9. Activity Streak is protected
```

---

## Integration with Activity Board

### What Child Sees From Parent Actions

**When Parent Sets Recovery Day:**
```
Child's Activity Board shows:
"Recovery Day 🌟
Your parent noticed you have a busy day!
Today's focus: Chores + Homework
Gujarati + Trivia can wait 🌟

You got this! 💪"

Skipped activities are grayed out:
- ❌ Gujarati Lesson (skipped)
- ❌ Trivia Questions (skipped)
- ✅ Homework (still required)
- ✅ Kung Fu (still required)
```

**When Parent Approves Activity:**
```
Child doesn't see anything special
Parent approval is silent/behind-the-scenes
No impact on child experience
```

**When Parent Awards Bonus Points:**
```
Child sees: "+25 bonus points! 🎉"
Notification shows parent message (if included)
Points appear in ledger
```

**When Parent Sends Message:**
```
Depending on context:
- Recovery day message: Shows with recovery day banner
- Skip day approval: "Your parent approved! Great job!"
- Achievement award: "Your parent awarded you points for..."
```

---

## Data Security & Privacy

### Parent Authentication
- Email + strong password login
- Session tokens (1-hour expiry recommended)
- "Remember this device" option
- Two-factor authentication (optional)

### Data Access
- Parent can see all child data
- Cannot see: Other children's data, other parents' data
- Activity logs stored with timestamps
- Flagged activities archived for 90 days

### Data Deletion
- Parent can delete individual activities (rare)
- Cannot delete achievements (permanent record)
- Can reset streaks (anti-cheat)
- Cannot modify historical stats

---

## Mobile Responsiveness

**Parent Portal should work on:**
- Desktop (1920x1080 primary)
- Tablet (iPad landscape/portrait)
- Mobile (iPhone/Android, landscape preferred)

**Mobile Layout:**
- Hamburger menu for navigation
- Simplified daily view (top 5 items)
- Full activity log accessible
- Recovery day quick action prominent
- Settings simplified (fewer options visible)

---

## Success Metrics

✅ Parent can set recovery day in <2 clicks  
✅ Parent can review all activity in one view  
✅ Parent can approve/adjust activities in <1 minute  
✅ Parent can customize features in <5 minutes  
✅ Parent can see real-time alerts  
✅ Parent can understand anti-cheat flags  
✅ Portal loads in <2 seconds  

---

## Implementation Checklist

**v1 Launch (MVP):**
- [ ] Parent login/authentication
- [ ] Dashboard view with daily summary
- [ ] Activity log with filtering
- [ ] Recovery day management
- [ ] Flagged activity review
- [ ] Points/rewards adjustment
- [ ] Feature toggles
- [ ] Basic notifications
- [ ] Settings panel

**v1.5 Enhancement:**
- [ ] Achievements/streaks view
- [ ] Goals management
- [ ] Calendar view
- [ ] Email summaries

**v2 Future:**
- [ ] Multi-parent support
- [ ] Child skip day requests
- [ ] Advanced analytics (moved to v1)
- [ ] Custom reporting
- [ ] Integration with Home Assistant (moved to v1)
- [ ] Advanced automation learning (ML models)
- [ ] Scene builder (grouped device states)
- [ ] Presence-based automations

