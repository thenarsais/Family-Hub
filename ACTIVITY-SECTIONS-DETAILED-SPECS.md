# Activity Sections - Detailed Specifications (v1)

**Status:** Sections 1-3 complete, locked for v1 build  
**Date:** 2026-06-16  
**Sections Reviewed:** Chores, Homework, Kung Fu  
**Pending:** Trivia, Reading, Habits, Mood, Gujarati, Calendar, Points

---

## SECTION 1: CHORES

### Purpose
Track daily household chores with parent oversight and self-directed tasks.

### Key Decisions ✅

**Recurrence Types:**
- Daily (e.g., "Make bed")
- Weekly (e.g., "Clean room")
- Calendar-triggered (e.g., "Take out trash" — synced from HA dashboard trash pickup calendar)

**Creation & Management:**
- Parent creates assigned chores (via Parent Portal)
- Krish creates self-directed chores
- Both types visible in Activity Board

**Integration with HA Dashboard:**
- **Bidirectional sync:** Check off in Activity Board = checked in HA dashboard (and vice versa)
- Real-time synchronization required
- Architectural note: Design for low effort to add this integration

**Points System:**
- Chores award points based on priority
- Parent sets point values for each priority level in Parent Portal
- Example: Low = 5 pts, Medium = 10 pts, High = 15 pts
- Parent can customize these values per chore if needed

**Streaks & Gamification:**
- Contribute to daily activity streak (consecutive days of activity)
- Count toward "all chores completed" badges
- No separate chore-only streak (integrated into activity streak)

**Time Windows:**
- ⏳ **DEFERRED TO v2:** Chore deadlines/time windows (e.g., "make bed by 8 AM")
- v1: Chores are simply "today's chore" or "this week's chore"
- v2 planning: Define before implementation

### State Structure

```javascript
state.chores = {
  items: [
    {
      id: "chore-1",
      name: "Make bed",
      description: "Fold covers and arrange pillows",
      createdBy: "parent" | "krish",
      assignedDate: "2026-06-16",
      dueDate: "2026-06-16",
      recurrence: "daily" | "weekly" | "calendar",
      calendarEventId: null,  // If calendar-triggered
      priority: "low" | "medium" | "high",
      pointsValue: 5,  // Set by parent
      completed: true,
      completedDate: "2026-06-16",
      completedTime: "2026-06-16T07:30:00Z",
      hasDashboardSync: true
    }
  ],
  completedToday: 2,
  totalToday: 5
}
```

### Points Calculation
```
Points = Parent-set priority value (5, 10, or 15)
Example: High priority chore = 15 points
```

### Parent Portal Controls
- [ ] Create chores (name, description, recurrence, priority)
- [ ] Set point values for priorities
- [ ] Mark chores complete/incomplete
- [ ] Override/verify Krish's completion
- [ ] View completion history

---

## SECTION 2: HOMEWORK

### Purpose
Track homework assignments with estimated time tracking and deadline incentives.

### Key Decisions ✅

**Creation & Management:**
- Parent creates and assigns homework
- Krish creates self-directed homework (learning goals)
- Both types visible in Activity Board

**HA Dashboard Integration:**
- ⏳ **v1:** Activity Board only (separate system)
- ⏳ **v2 Planning:** Design for easy bidirectional sync with HA dashboard if needed
- Architecture: Keep state structure clean and independent

**Time Estimation Flow:**
1. System generates estimated time suggestion (based on subject/description)
2. Parent sets target estimate when creating homework (can accept/modify system suggestion)
3. Krish provides actual estimate when starting homework
4. Parent reviews and approves Krish's estimate in Parent Portal
5. All timestamps and estimates visible to parent

**Subject Color Coding:**
- Each subject has assigned color (e.g., Math = blue, Science = green)
- Homework tagged with subject + color
- Subjects support detailed categorization (Math > Algebra, Science > Biology)

**Points System:**
Homework awards points based on three factors:

```
Base Points (Priority):
  Low = 5 pts
  Medium = 10 pts
  High = 15 pts

Time Bonus:
  +1 point per 15 minutes estimated
  Example: 30 min homework = +2 pts, 60 min = +4 pts

Deadline Bonus:
  +50% if completed by due date
  -50% if completed late (half points)

Total Points = (Base + Time Bonus) × Deadline Multiplier
Example: Medium (10) + 30min (2) = 12 pts
         On-time: 12 × 1.5 = 18 pts
         Late: 12 × 0.5 = 6 pts
```

**Streaks & Gamification:**
- Contribute to daily activity streak
- "X homework completed" badges (e.g., "Homework Hero — 10 assignments")
- Count toward daily quest completion if applicable

### State Structure

```javascript
state.homework = {
  items: [
    {
      id: "hw-1",
      subject: "Math",
      subjectColor: "#3B82F6",  // Blue
      category: "Algebra",  // Detailed categorization
      description: "Chapter 5 exercises 1-20",
      createdBy: "parent" | "krish",
      createdDate: "2026-06-14",
      dueDate: "2026-06-17",
      dueTime: null,  // v2 feature: specific time
      priority: "low" | "medium" | "high",
      systemEstimate: 45,  // minutes (system suggestion)
      parentEstimate: 50,  // minutes (parent set target)
      krishEstimate: 60,  // minutes (Krish's actual estimate)
      krishEstimateApproved: true,
      parentNotes: "Focus on problems with fractions",
      krishNotes: "Started, need help with #15",
      completed: false,
      completedDate: null,
      completedTime: null,
      completedLate: false,
      pointsAwarded: 0
    }
  ]
}
```

### Parent Portal Controls
- [ ] Create homework (subject, category, description, priority, due date)
- [ ] Review system time estimate
- [ ] Approve Krish's time estimate
- [ ] Add parent notes/instructions
- [ ] Verify completion
- [ ] View Krish notes/progress
- [ ] Adjust points if needed

---

## SECTION 3: KUNG FU

### Purpose
Track martial arts practice with session logging, technique flashcards, and belt progression.

### Key Decisions ✅

**Session Logging:**
- Parent logs sessions (class attendance, home practice)
- Krish logs sessions (after practice, with details)
- Instructor does NOT have system access (no logging from instructor)
- Both parent and Krish can view all logged sessions

**Flashcard System:**
- Parent creates technique flashcards (for Krish to study)
- Krish creates technique flashcards (self-study notes)
- All flashcards require parent approval before counting toward points
- Stored in Parent Portal for management

**Belt Progression:**
- Parent manually marks belt advancement when instructor confirms
- Infrequent (typically every 3-6 months)
- No automated progression system in v1
- Current belt and next target belt displayed

**Points System:**

```
Session Points:
  +10 points per 30 minutes of session duration

Flashcard Points:
  +5 points per 15 minutes spent practicing flashcards
  (Only counts after parent approval)

Example:
  60-min session = 20 pts
  45-min flashcard study = 15 pts
  Total daily Kung Fu points = 35 pts
```

**Habit Integration:**
- Kung Fu sessions automatically increment linked habits
- Example: Logging a Kung Fu session counts toward "Exercise" habit streak
- Parent can create/link custom habits (optional)

**Streaks & Gamification:**
- Contribute to daily activity streak
- "X sessions logged" badges (e.g., "Kung Fu Warrior — 20 sessions")
- "Consistent practice" streak badges (e.g., "7-day practice streak")

### State Structure

```javascript
state.kungfu = {
  sessions: [
    {
      id: "kf-1",
      date: "2026-06-16",
      timestamp: "2026-06-16T18:00:00Z",
      duration: 60,  // minutes
      loggedBy: "parent" | "krish",
      instructorName: "Sensei Mike",  // If parent logged
      techniques: ["Roundhouse Kick", "Front Kick", "Punch Combo"],
      rating: 4,  // 1-5 stars (self-assessment)
      beltLevel: "Yellow",  // Current belt during session
      notes: "Good form on kicks, needs work on timing",
      pointsAwarded: 20  // (60 min / 30) × 10
    }
  ],
  
  flashcards: [
    {
      id: "fc-1",
      technique: "Roundhouse Kick",
      description: "Rotate body, extend leg in arc",
      createdBy: "parent" | "krish",
      createdDate: "2026-06-10",
      approved: true,
      approvedDate: "2026-06-11"
    }
  ],
  
  beltProgression: {
    currentBelt: "Yellow",
    nextBelt: "Orange",
    lastBeltDate: "2026-03-15",
    beltHistory: [
      { belt: "White", earnedDate: "2025-09-01" },
      { belt: "Yellow", earnedDate: "2026-03-15" }
    ]
  },
  
  weeklySessionCount: 2,
  totalSessionsLogged: 24,
  totalFlashcardsCreated: 12
}
```

### Parent Portal Controls
- [ ] Log sessions (date, duration, instructor, techniques, rating, notes)
- [ ] Approve flashcards (Krish-created)
- [ ] Create flashcards (for Krish)
- [ ] Update belt progression when ready
- [ ] View session history and statistics
- [ ] Track flashcard practice time

---

## Cross-Section Notes

### Bidirectional HA Sync (v1 vs v2)
- **CHORES:** Bidirectional sync in v1 (already planned)
- **HOMEWORK:** Activity Board only in v1, v2 design for easy sync
- **KUNG FU:** Activity Board only in v1

### Points Architecture
All three sections use similar points logic:
- Base value (priority or duration-based)
- Optional bonuses/multipliers
- Deadline or completion incentives
- Stored in `state.points.ledger` with activity source

### Parent Portal Management
All three sections require Parent Portal functionality:
- Creation/assignment
- Approval workflows (Kung Fu flashcards, Homework time estimates)
- Completion verification
- Points adjustment if needed
- Historical view

### Contribution to Streaks
All three count toward:
- Daily activity streak (consecutive days of any activity)
- Activity-specific badges ("Homework Hero", "Kung Fu Warrior", etc.)

---

## v2 Deferred Items

**CHORES:**
- [ ] Time windows/deadlines (e.g., "Make bed by 8 AM")
- [ ] Photo proof requirement for certain chores
- [ ] Alarm/reminder system for approaching deadlines

**HOMEWORK:**
- [ ] HA dashboard bidirectional sync
- [ ] Specific due times (not just due dates)
- [ ] Difficulty progression (suggest harder assignments if completing early)

**KUNG FU:**
- [ ] Automated belt progression tracking
- [ ] Video form checking for techniques
- [ ] Competition/tournament tracking
- [ ] Multiple instructor support with ratings

---

## Implementation Checklist (v1)

### CHORES
- [ ] State structure and defaults
- [ ] Add chore form (parent create)
- [ ] Krish create self-directed form
- [ ] Completion checkbox UI
- [ ] HA dashboard bidirectional sync
- [ ] Points calculation
- [ ] Streak integration
- [ ] Dashboard card display

### HOMEWORK
- [ ] State structure and defaults
- [ ] Subject color mapping
- [ ] Homework creation form (parent)
- [ ] Krish create self-directed form
- [ ] System time estimate logic
- [ ] Parent approval workflow
- [ ] Points calculation (priority + time + deadline)
- [ ] Completion tracking
- [ ] Parent Portal review interface
- [ ] Dashboard card display

### KUNG FU
- [ ] State structure and defaults
- [ ] Session logging form (parent & Krish)
- [ ] Flashcard creation & approval flow
- [ ] Flashcard study UI (practice interface)
- [ ] Belt progression tracking
- [ ] Points calculation (sessions + flashcards)
- [ ] Habit linking logic
- [ ] Parent Portal session review
- [ ] Dashboard card display

---

**Next:** Continue with Section 4 (TRIVIA) — already heavily documented, may need refinement review
