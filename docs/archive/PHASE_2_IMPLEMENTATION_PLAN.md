# Phase 2: Comprehensive Dashboard & Home Features Implementation

**Timeline**: 8-12 weeks (parallel development)  
**Target**: Full-featured family dashboard with activity tracking + home automation  
**Status**: Planning stage

---

## 📋 Overview

Phase 2 expands the Family Hub from basic activity tracking to a complete family management hub. The dashboard becomes the central control center for:
- Activity tracking (chores, learning, achievements)
- Home automation (devices, energy, status)
- Family communication (announcements, reminders)
- Family management (profiles, roles, permissions)

---

## 🎯 Work Streams

### Stream 1: Activity Module Completion (Weeks 1-4)

#### 1.1 Connect Real Chore Data
**Status**: Not started  
**Effort**: 4 days

Backend requirements:
- `GET /api/chores` — List user/family chores
- `GET /api/chores/:id` — Get chore details
- `POST /api/chores` — Create chore (parent)
- `PATCH /api/chores/:id` — Update chore status
- `DELETE /api/chores/:id` — Delete chore

Frontend requirements:
- Fetch chores from API in dashboard
- Replace mock data with real data
- Add chore completion UI
- Show real due dates & priorities
- Wire "View All Chores" button to full chores page

**Files to modify**:
- Backend: `backend/src/routes/chores.ts` (create)
- Backend: `backend/src/services/ChoreService.ts` (create)
- Frontend: `frontend/src/pages/Dashboard.tsx` (update)
- Frontend: `frontend/src/hooks/useChores.ts` (create)

#### 1.2 Build Full Chores Management Page
**Status**: Not started  
**Effort**: 5 days

Requirements:
- Full chores list with filtering (status, due date, assignee)
- Chore creation form (parent only)
- Chore edit dialog
- Bulk actions (mark complete, reassign)
- Chore history/activity log
- Mobile-responsive layout

Files to create:
- `frontend/src/pages/ChoresManagement.tsx`
- `frontend/src/components/Chores/ChoreForm.tsx`
- `frontend/src/components/Chores/ChoreList.tsx`
- `frontend/src/components/Chores/ChoreFilters.tsx`

#### 1.3 Connect Real Learning Data
**Status**: Not started  
**Effort**: 4 days

Backend requirements:
- `GET /api/learning/:userId` — Get user learning progress
- `GET /api/learning/courses` — List available courses
- `PATCH /api/learning/:courseId` — Update course progress
- `GET /api/learning/:courseId/lessons` — Get lessons

Frontend requirements:
- Fetch learning progress from API
- Replace mock data
- Wire "Continue Learning" button
- Show lesson details
- Track completion percentage

Files to modify:
- Backend: `backend/src/routes/learning.ts` (create)
- Frontend: `frontend/src/pages/Dashboard.tsx` (update)
- Frontend: `frontend/src/hooks/useLearning.ts` (create)

#### 1.4 Build Learning Module Page
**Status**: Not started  
**Effort**: 6 days

Requirements:
- Course listing by language
- Lesson progression UI
- Quiz/assessment interface
- Progress tracking with milestones
- Badge earned notifications
- Parent progress dashboard

Files to create:
- `frontend/src/pages/LearningModule.tsx`
- `frontend/src/components/Learning/CourseCard.tsx`
- `frontend/src/components/Learning/LessonView.tsx`
- `frontend/src/components/Learning/Quiz.tsx`

#### 1.5 Connect Real Leaderboard Data
**Status**: Not started  
**Effort**: 2 days

Backend requirements:
- `GET /api/leaderboard` — Get top users (with pagination)
- `GET /api/leaderboard/family` — Get family-only leaderboard
- `GET /api/users/:id/rank` — Get user's rank

Frontend requirements:
- Fetch real leaderboard data
- Show family vs. global rankings
- Add user profile preview on click
- Real-time updates via WebSocket (Phase 2B)

#### 1.6 Connect Real Activity Feed
**Status**: Not started  
**Effort**: 2 days

Backend requirements:
- `GET /api/activity/feed` — Get activity log
- `GET /api/activity/stats` — Activity statistics

Frontend requirements:
- Fetch recent activity
- Show real timestamps
- Display user avatars
- Filter by activity type

**Total Stream 1**: 23 days (~4-5 weeks)

---

### Stream 2: Home & Family Features (Weeks 2-6)

#### 2.1 Calendar Module
**Status**: Not started  
**Effort**: 8 days

Backend requirements:
- `GET /api/calendar/events` — List family events
- `POST /api/calendar/events` — Create event
- `PATCH /api/calendar/events/:id` — Update event
- `DELETE /api/calendar/events/:id` — Delete event
- `GET /api/calendar/events/:id/attendees` — Event attendees
- `POST /api/calendar/events/:id/attend` — RSVP to event
- Calendar sync with Google Calendar (optional)

Frontend requirements:
- Calendar widget on dashboard (month/week/day views)
- Event creation form
- Event details modal
- Color-coded event types (chore deadline, assignment, family event)
- RSVP functionality
- Event reminders

Files to create:
- Backend: `backend/src/routes/calendar.ts`
- Backend: `backend/src/services/CalendarService.ts`
- Frontend: `frontend/src/pages/Calendar.tsx`
- Frontend: `frontend/src/components/Calendar/CalendarWidget.tsx`
- Frontend: `frontend/src/components/Calendar/EventForm.tsx`
- Frontend: `frontend/src/hooks/useCalendar.ts`

#### 2.2 Announcements & Messaging
**Status**: Not started  
**Effort**: 7 days

Backend requirements:
- `GET /api/announcements` — List family announcements
- `POST /api/announcements` — Create announcement (parent only)
- `PATCH /api/announcements/:id/read` — Mark as read
- `DELETE /api/announcements/:id` — Delete announcement
- `GET /api/announcements/:id/readers` — See who read it
- WebSocket events for new announcements

Frontend requirements:
- Announcements widget on dashboard
- Full announcements page
- Create announcement form (parent only)
- Read/unread status
- Archive old announcements
- Real-time notifications

Files to create:
- Backend: `backend/src/routes/announcements.ts`
- Frontend: `frontend/src/pages/Announcements.tsx`
- Frontend: `frontend/src/components/Announcements/AnnouncementWidget.tsx`
- Frontend: `frontend/src/components/Announcements/AnnouncementForm.tsx`
- Frontend: `frontend/src/hooks/useAnnouncements.ts`

#### 2.3 Reminders & Notifications
**Status**: Not started  
**Effort**: 6 days

Backend requirements:
- `GET /api/reminders` — List user reminders
- `POST /api/reminders` — Create reminder
- `PATCH /api/reminders/:id` — Update reminder
- `DELETE /api/reminders/:id` — Delete reminder
- `PATCH /api/reminders/:id/dismiss` — Dismiss reminder
- Push notification service integration

Frontend requirements:
- Reminders widget on dashboard
- Full reminders management page
- Set reminders for chores, assignments, events
- Browser push notifications
- Reminder settings (frequency, timing)
- Notification history

Files to create:
- Backend: `backend/src/routes/reminders.ts`
- Backend: `backend/src/services/NotificationService.ts`
- Frontend: `frontend/src/pages/Reminders.tsx`
- Frontend: `frontend/src/components/Reminders/ReminderWidget.tsx`
- Frontend: `frontend/src/hooks/useReminders.ts`

#### 2.4 Energy Usage Dashboard
**Status**: Not started  
**Effort**: 5 days

Backend requirements:
- `GET /api/energy/usage` — Get energy consumption data
- `GET /api/energy/devices` — Device-level energy usage
- `GET /api/energy/goals` — Family energy goals
- SmartThings API integration for power usage

Frontend requirements:
- Energy widget on dashboard
- Full energy dashboard page
- Monthly/weekly charts
- Device breakdown
- Goals and achievements
- Energy saving tips

Files to create:
- Backend: `backend/src/services/EnergyService.ts`
- Backend: `backend/src/routes/energy.ts`
- Frontend: `frontend/src/pages/Energy.tsx`
- Frontend: `frontend/src/components/Energy/EnergyWidget.tsx`
- Frontend: `frontend/src/hooks/useEnergy.ts`

#### 2.5 Family Profiles & Management
**Status**: Not started  
**Effort**: 8 days

Backend requirements:
- `GET /api/family/members` — List family members
- `POST /api/family/members` — Add member (parent only)
- `PATCH /api/family/members/:id` — Update member profile
- `DELETE /api/family/members/:id` — Remove member (parent only)
- `GET /api/family/members/:id/role` — Get member role
- `PATCH /api/family/members/:id/role` — Update role (parent only)
- `GET /api/family/settings` — Family settings
- `PATCH /api/family/settings` — Update settings

Frontend requirements:
- Family members page
- Member profile editing
- Role management (parent/child)
- Parental control settings
- Family settings dashboard
- Invite system for new members

Files to create:
- Backend: `backend/src/routes/family.ts`
- Backend: `backend/src/services/FamilyService.ts`
- Frontend: `frontend/src/pages/Family.tsx`
- Frontend: `frontend/src/components/Family/MemberCard.tsx`
- Frontend: `frontend/src/components/Family/MemberForm.tsx`
- Frontend: `frontend/src/hooks/useFamily.ts`

**Total Stream 2**: 34 days (~6-7 weeks)

---

### Stream 3: Dashboard Integration & Polish (Weeks 3-7, overlapping)

#### 3.1 Update Main Dashboard Layout
**Status**: Not started  
**Effort**: 3 days

Changes:
- Add widgets for Calendar, Announcements, Reminders, Energy
- Reorganize layout to show all modules
- Add quick action buttons for each section
- Make widgets clickable → navigate to full pages
- Responsive design (mobile: 1 column, tablet: 2 columns, desktop: 3-4 columns)

Files to modify:
- `frontend/src/pages/Dashboard.tsx` (major refactor)
- `frontend/src/styles/dashboard.css` (create if needed)

#### 3.2 Add Navigation & Routing
**Status**: Not started  
**Effort**: 2 days

Changes:
- Add routes for all new pages
- Update navigation menu
- Add breadcrumbs
- Add back buttons
- Mobile navigation drawer

Files to modify:
- `frontend/src/App.tsx` (add routes)
- `frontend/src/components/Navigation.tsx` (update)

#### 3.3 Real-time Updates via WebSocket
**Status**: Not started  
**Effort**: 6 days

Requirements:
- WebSocket connection for:
  - Leaderboard updates
  - Activity feed updates
  - Announcements
  - Reminders
  - Calendar event updates
  - Smart home device status

Backend requirements:
- WebSocket server setup
- Event broadcasting
- Connection management

Frontend requirements:
- WebSocket hook
- Auto-reconnect logic
- Fallback to polling

Files to create:
- Backend: `backend/src/websocket/index.ts`
- Frontend: `frontend/src/hooks/useWebSocket.ts`

#### 3.4 Offline Support & Caching
**Status**: Not started  
**Effort**: 4 days

Requirements:
- Service Worker for offline support
- Local storage caching
- Sync when online
- Cache invalidation strategy

Files to create:
- Frontend: `frontend/src/serviceWorker.ts`
- Frontend: `frontend/src/hooks/useCache.ts`

#### 3.5 Performance Optimization
**Status**: Not started  
**Effort**: 5 days

Requirements:
- Code splitting by route
- Lazy loading for components
- Image optimization
- Lighthouse audit & fixes
- Bundle size analysis

#### 3.6 Mobile Responsiveness
**Status**: Not started  
**Effort**: 4 days

Requirements:
- Test all pages on mobile
- Touch-friendly interactions
- Portrait/landscape support
- Fast load times
- Mobile navigation

**Total Stream 3**: 24 days (~4-5 weeks)

---

## 📊 Dependency Map

```
Week 1: Setup & Core APIs
├─ Backend: Chores API → Feed into Stream 1.1
├─ Backend: Learning API → Feed into Stream 1.3
├─ Backend: Calendar API → Feed into Stream 2.1
├─ Backend: Announcements API → Feed into Stream 2.2
├─ Backend: Family API → Feed into Stream 2.5
└─ Dashboard: Add widget framework → Prep for Stream 3.1

Week 2-3: Parallel Feature Development
├─ Stream 1.1: Connect chore data
├─ Stream 1.3: Connect learning data
├─ Stream 2.1: Calendar widget
├─ Stream 2.2: Announcements widget
└─ Dashboard: Start integrating widgets

Week 4-5: Feature Pages & Expansion
├─ Stream 1.2: Full chores page
├─ Stream 1.4: Learning module page
├─ Stream 2.4: Energy dashboard
├─ Stream 2.5: Family profiles
└─ Stream 3.1: Complete dashboard redesign

Week 6-7: Integration & Polish
├─ Stream 1.6: Activity feed integration
├─ Stream 2.3: Reminders system
├─ Stream 3.2: Routing & navigation
├─ Stream 3.3: WebSocket integration
└─ Stream 3.4: Caching & offline support

Week 8+: Quality & Performance
├─ Stream 3.5: Performance optimization
├─ Stream 3.6: Mobile responsiveness
├─ Testing & bug fixes
└─ Security audit
```

---

## 🗓️ Weekly Breakdown

### Week 1: Foundation
- [x] Create Phase 2 plan
- [ ] Set up database tables for new features
- [ ] Create API route stubs for all endpoints
- [ ] Create frontend hook stubs
- [ ] Dashboard widget framework

**Deliverable**: All API endpoints stubbed, ready for implementation

### Week 2: Activity Features (Parallel)
- [ ] Implement chores API (backend)
- [ ] Connect chores dashboard (frontend)
- [ ] Implement learning API (backend)
- [ ] Connect learning dashboard (frontend)
- [ ] Start calendar API

**Deliverable**: Chores & learning working with real data

### Week 3: Home Features (Parallel)
- [ ] Calendar API complete
- [ ] Calendar widget on dashboard
- [ ] Announcements API complete
- [ ] Announcements widget
- [ ] Start energy tracking

**Deliverable**: Calendar & announcements on dashboard

### Week 4: Feature Pages (Parallel)
- [ ] Full chores management page
- [ ] Full learning module page
- [ ] Leaderboard real data
- [ ] Activity feed real data
- [ ] Family profiles page

**Deliverable**: All major feature pages implemented

### Week 5: Additional Features
- [ ] Energy dashboard
- [ ] Reminders system
- [ ] Complete dashboard redesign
- [ ] Add navigation & routing
- [ ] Mobile optimization

**Deliverable**: Full feature set complete

### Week 6-7: Integration & Polish
- [ ] WebSocket integration
- [ ] Caching & offline support
- [ ] Performance optimization
- [ ] Accessibility testing
- [ ] Security audit

**Deliverable**: Production-ready Phase 2

### Week 8+: Testing & Launch Prep
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security testing
- [ ] UAT documentation
- [ ] Launch checklist

**Deliverable**: Ready for Phase 2 launch

---

## 🔌 API Endpoint Summary

### Chores API
```
GET    /api/chores                    # List all chores
POST   /api/chores                    # Create chore
GET    /api/chores/:id                # Get chore details
PATCH  /api/chores/:id                # Update chore
DELETE /api/chores/:id                # Delete chore
PATCH  /api/chores/:id/complete       # Mark complete
POST   /api/chores/:id/assign         # Assign to user
```

### Learning API
```
GET    /api/learning/courses          # List courses
GET    /api/learning/:userId/progress # User progress
GET    /api/learning/:courseId/lessons # Course lessons
PATCH  /api/learning/:courseId        # Update progress
POST   /api/learning/:courseId/quiz   # Submit quiz
```

### Calendar API
```
GET    /api/calendar/events           # List events
POST   /api/calendar/events           # Create event
PATCH  /api/calendar/events/:id       # Update event
DELETE /api/calendar/events/:id       # Delete event
POST   /api/calendar/events/:id/rsvp  # RSVP to event
```

### Announcements API
```
GET    /api/announcements             # List announcements
POST   /api/announcements             # Create announcement
PATCH  /api/announcements/:id/read    # Mark as read
DELETE /api/announcements/:id         # Delete announcement
```

### Reminders API
```
GET    /api/reminders                 # List reminders
POST   /api/reminders                 # Create reminder
PATCH  /api/reminders/:id             # Update reminder
DELETE /api/reminders/:id             # Delete reminder
PATCH  /api/reminders/:id/dismiss     # Dismiss reminder
```

### Energy API
```
GET    /api/energy/usage              # Energy consumption
GET    /api/energy/devices            # Device usage
GET    /api/energy/goals              # Energy goals
PATCH  /api/energy/goals              # Update goals
```

### Family API
```
GET    /api/family/members            # List members
POST   /api/family/members            # Add member
PATCH  /api/family/members/:id        # Update member
DELETE /api/family/members/:id        # Remove member
PATCH  /api/family/settings           # Update settings
```

### Leaderboard API
```
GET    /api/leaderboard               # Global leaderboard
GET    /api/leaderboard/family        # Family leaderboard
GET    /api/users/:id/rank            # User rank
```

### Activity API
```
GET    /api/activity/feed             # Activity log
GET    /api/activity/stats            # Activity statistics
```

---

## 📈 Success Metrics

### By Week 2
- ✅ 3+ API endpoints working
- ✅ 2+ dashboard widgets updated with real data
- ✅ Tests passing for new endpoints

### By Week 4
- ✅ All activity features working (chores, learning, leaderboard)
- ✅ Calendar & announcements on dashboard
- ✅ 80%+ test coverage maintained

### By Week 6
- ✅ All feature pages built
- ✅ Real-time updates working (WebSocket)
- ✅ Mobile responsive design complete

### By Week 8
- ✅ Full Phase 2 feature set complete
- ✅ Lighthouse scores maintained (80+)
- ✅ All tests passing
- ✅ Security audit passed
- ✅ Ready for UAT

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| WebSocket complexity | High | Start with polling, add WebSocket in week 6 |
| Database schema changes | Medium | Plan migrations in week 1, test thoroughly |
| Mobile performance | Medium | Profile early, optimize as you go |
| API rate limits (SmartThings, Google) | Low | Implement caching, request batching |
| Feature scope creep | High | Stick to this plan, defer extras to Phase 3 |

---

## 🎯 Phase 2 Success Criteria

- [ ] Dashboard shows 6+ widgets (chores, learning, leaderboard, calendar, announcements, energy)
- [ ] All activity tracking features complete (chores, learning, achievements)
- [ ] All home automation features complete (calendar, announcements, reminders, energy)
- [ ] All feature pages built and functional
- [ ] Real-time updates working for key features
- [ ] Mobile responsive design complete
- [ ] Lighthouse scores maintained (80+)
- [ ] 80%+ test coverage maintained
- [ ] Zero security vulnerabilities (npm audit)
- [ ] Full documentation updated
- [ ] Ready for user acceptance testing (UAT)

---

## Next Steps

1. **This Week**: 
   - [ ] Approve this plan
   - [ ] Set up database tables
   - [ ] Create API route stubs
   - [ ] Create dashboard widget framework

2. **Next Week**:
   - [ ] Start implementing chores API & frontend
   - [ ] Start implementing learning API & frontend
   - [ ] Continue with calendar API

3. **After That**:
   - [ ] Build feature pages
   - [ ] Add home/family features
   - [ ] Integrate WebSocket & caching

---

**Status**: Ready for implementation  
**Last Updated**: 2026-08-06  
**Owner**: Priya

