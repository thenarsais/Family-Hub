# Manual Testing Checklist - Phase 1

## Test Environment Setup

- [ ] Backend server running: `npm run dev` in `/backend`
- [ ] Frontend dev server running: `npm run dev` in `/frontend`
- [ ] Database connected and tables created
- [ ] Environment variables configured (.env.local)
- [ ] Mock data initialized (optional)

---

## Dashboard Tests

### 1. Authentication & Navigation
- [ ] User can sign up with valid credentials
- [ ] User can log in with valid credentials
- [ ] Dashboard displays after successful login
- [ ] Navigation bar shows all menu items
- [ ] User can navigate to different pages (Dashboard, Activity, Smart Home)
- [ ] User can log out successfully
- [ ] Protected routes redirect to login when not authenticated

### 2. Dashboard Display
- [ ] Welcome message displays with user name
- [ ] Points card displays total points correctly
- [ ] Badges card displays total badges earned
- [ ] Streak card displays current streak
- [ ] All quick action buttons are visible
- [ ] Dashboard layout is responsive (desktop, tablet, mobile)
- [ ] Dark mode toggle works and persists

### 3. Dashboard Data Loading
- [ ] Points data loads without errors
- [ ] Badges data loads without errors
- [ ] Loading state displays while fetching data
- [ ] Error message displays if data fetch fails
- [ ] No console errors during normal operation

### 4. Quick Actions
- [ ] "Start Activity" button navigates to Activity page
- [ ] "Smart Home" button navigates to Smart Home page
- [ ] "View Badges" button is clickable (placeholder)
- [ ] "Check Leaderboard" button is clickable (placeholder)
- [ ] "Account Settings" button is clickable (placeholder)

---

## Chores Feature Tests

### 1. Chores Display
- [ ] Chores page loads without errors
- [ ] Loading state displays initially
- [ ] List of user's chores displays correctly
- [ ] Each chore shows: name, description, time slot, points value
- [ ] Chores are sorted by time slot (morning, afternoon, evening)
- [ ] Empty state displays when no chores exist

### 2. Create Chore
- [ ] "Add Chore" button opens form modal/dialog
- [ ] Form has fields: name, description, time slot, points value
- [ ] Form validates required fields (name, time slot, points)
- [ ] Form accepts valid time slot values (morning, afternoon, evening)
- [ ] Form rejects invalid points values (0, negative, non-numeric)
- [ ] Form can be closed/cancelled without creating chore
- [ ] Submit button creates chore and updates list
- [ ] New chore appears in list immediately (or after refresh)
- [ ] Confirmation message displays after creation
- [ ] Error message displays if creation fails

### 3. Complete Chore
- [ ] "Complete" button appears on each chore card
- [ ] Clicking "Complete" marks chore as done
- [ ] Points are awarded immediately after completion
- [ ] Completion confirmation displays
- [ ] Completed chore is removed from active list (or marked as completed)
- [ ] Points are reflected in dashboard points total
- [ ] Transaction history records completion
- [ ] Cannot complete same chore twice on same day (if applicable)

### 4. Chore Progress & Statistics
- [ ] Progress section shows: total completed, this week, this month
- [ ] Points summary shows: total, daily, weekly, monthly
- [ ] Statistics update after completing a chore
- [ ] Leaderboard reflects user's points (if implemented)
- [ ] Progress page loads without errors

### 5. Points System
- [ ] Points are awarded for completing chores
- [ ] Correct amount of points awarded (matches chore value)
- [ ] Daily points reset at appropriate time
- [ ] Weekly points reset every 7 days
- [ ] Monthly points reset every 30 days
- [ ] Transaction history shows all point transactions
- [ ] Transaction history includes: source, amount, description, timestamp

---

## Learning Feature Tests

### 1. Learning Module Display
- [ ] Learning page loads without errors
- [ ] Learning module displays all three phases:
  - [ ] Phase 1: Gujarati Alphabet (47 lessons)
  - [ ] Phase 2: Numbers (10 lessons)
  - [ ] Phase 3: Vocabulary (120+ lessons)
- [ ] Each phase shows progress bar
- [ ] Progress bars show: completed/total, percentage

### 2. Alphabet Learning
- [ ] Alphabet lessons load correctly
- [ ] Each lesson displays: letter, romanization, pronunciation, meaning
- [ ] Lesson navigation works (prev/next)
- [ ] Lessons can be marked as complete
- [ ] Completed lessons are tracked
- [ ] Points awarded for completing lessons (default: 10 points)
- [ ] Audio pronunciation plays (if audio available)

### 3. Numbers Learning
- [ ] Numbers lessons load correctly
- [ ] Each number displays: numeral, romanization, pronunciation, English
- [ ] Numbers can be marked as complete
- [ ] Progress updates when lessons completed
- [ ] All 10 numbers can be completed

### 4. Vocabulary Learning
- [ ] Vocabulary lessons load correctly
- [ ] Words display with: word, romanization, pronunciation, English meaning
- [ ] Words are organized by category (11 categories)
- [ ] Lessons can be marked as complete
- [ ] Progress tracks across all vocabulary

### 5. Quiz System
- [ ] Quiz questions appear after lessons
- [ ] Quiz questions test understanding of lessons
- [ ] Multiple choice answers are displayed correctly
- [ ] User can select answer
- [ ] Correct/incorrect feedback displays immediately
- [ ] Points awarded for correct answers (default: 5 points)
- [ ] No points awarded for incorrect answers
- [ ] Quiz results are recorded
- [ ] Quiz performance metrics display:
  - [ ] Total questions answered
  - [ ] Number of correct answers
  - [ ] Accuracy percentage
  - [ ] Total points earned from quizzes

### 6. Learning Statistics
- [ ] Overall progress shows across all phases
- [ ] Statistics display:
  - [ ] Total lessons completed
  - [ ] Total points earned
  - [ ] Progress for each phase (alphabet, numbers, vocabulary)
- [ ] Recent activity shows completed lessons and quiz attempts
- [ ] Statistics update immediately after completing content

### 7. Progress Tracking
- [ ] Progress persists after page reload
- [ ] Progress visible on dashboard
- [ ] Completed lessons don't reappear as incomplete
- [ ] Points are permanently awarded

---

## SmartThings Integration Tests

### 1. Device Discovery
- [ ] Devices page loads without errors
- [ ] "Discover Devices" button is present
- [ ] Clicking discover loads devices from SmartThings API
- [ ] Device list displays all connected devices
- [ ] Each device shows: name, type, status, room
- [ ] Loading state displays during discovery
- [ ] Error message displays if discovery fails

### 2. Device Display
- [ ] Lights display: status (on/off), brightness level, toggle button
- [ ] Locks display: status (locked/unlocked), lock/unlock buttons
- [ ] Thermostats display: current temperature, temperature control
- [ ] Devices are grouped by room
- [ ] Room headers display device count
- [ ] Icons correctly represent device types

### 3. Device Control
- [ ] Toggle buttons control light on/off
- [ ] Brightness slider adjusts light brightness (0-100%)
- [ ] Temperature slider adjusts thermostat (60-85°F)
- [ ] Lock/unlock buttons control door locks
- [ ] Control actions are reflected immediately in UI (optimistic update)
- [ ] Confirmation messages display after successful control
- [ ] Error messages display if control fails
- [ ] Loading indicators show during control operations

### 4. System Status
- [ ] Status page shows total devices connected
- [ ] Device count by type displays correctly
- [ ] Online/offline device count displays
- [ ] Last sync timestamp displays
- [ ] Status page loads without errors

---

## Cross-Feature Integration Tests

### 1. Points Integration
- [ ] Points earned from chores + learning = total points
- [ ] Dashboard points update after any point-earning activity
- [ ] Transaction history includes all sources (chores, learning, etc.)
- [ ] Points cannot go negative

### 2. Navigation & Routing
- [ ] All navigation links work correctly
- [ ] Back button returns to previous page
- [ ] URL patterns match expected routes
- [ ] Deep links work (can share URLs and navigate directly)

### 3. Data Persistence
- [ ] User data persists after page reload
- [ ] Chores created persist across sessions
- [ ] Learning progress persists across sessions
- [ ] Points totals persist across sessions
- [ ] Completed items don't revert to incomplete

### 4. Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Database errors don't crash the app
- [ ] Invalid data is handled gracefully
- [ ] 404 errors show appropriate page
- [ ] 500 errors show error message with retry option

---

## Performance & Usability Tests

### 1. Performance
- [ ] Dashboard loads in < 2 seconds
- [ ] Learning module loads in < 3 seconds
- [ ] Chores list loads in < 2 seconds
- [ ] Device control responds in < 1 second
- [ ] No significant lag when scrolling or navigating
- [ ] No memory leaks (check browser dev tools)

### 2. Usability
- [ ] Text is readable on all screen sizes
- [ ] Buttons are clickable size (≥ 44px)
- [ ] Form fields have proper labels
- [ ] Error messages are clear and actionable
- [ ] Success messages confirm actions
- [ ] Loading states indicate waiting
- [ ] Animations are smooth and not excessive

### 3. Accessibility
- [ ] Color contrast meets WCAG standards
- [ ] Form inputs have associated labels
- [ ] Navigation is keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader text is appropriate

---

## Browser Compatibility Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Test Results Summary

### Passed Tests
- [ ] Total: ___ / ___

### Failed Tests
- [ ] Total: ___ / ___

### Issues Found
1. ___
2. ___
3. ___

### Notes
___

---

## Sign-off

- Tester Name: ___
- Test Date: ___
- Environment: ___
- Status: ☐ PASS ☐ FAIL ☐ PARTIAL

