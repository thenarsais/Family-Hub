# Phase 2: Activity Board Implementation Plan
**Version:** 1.0  
**Date:** July 27, 2026  
**Duration:** 20 weeks  
**Status:** Ready to start

---

## Phase 2 Overview

Transform Family Hub from a smart home dashboard into a comprehensive family engagement platform with gamification, learning, and habit tracking.

**Goal:** Build Activity Board system with Node.js backend, React frontend, and SmartThings smart home integration

**Success Criteria:**
- ✅ All Activity Board modules implemented (Trivia, Habits, Mood, Reading)
- ✅ Points/rewards system fully functional
- ✅ Parent portal dashboard live
- ✅ SmartThings integration working
- ✅ <200ms API response times
- ✅ Zero critical bugs at launch

---

## Timeline Overview

```
Week 1-4:    STABILIZATION & ARCHITECTURE (4 weeks)
Week 5-8:    BACKEND DEVELOPMENT (4 weeks)
Week 9-16:   ACTIVITY BOARD IMPLEMENTATION (8 weeks)
Week 17-18:  INTEGRATION & TESTING (2 weeks)
Week 19-20:  LAUNCH PREPARATION (2 weeks)
```

---

## Week 1-4: Stabilization & Architecture

### Objectives
- [ ] Finalize Node.js + SmartThings technical design
- [ ] Database schema design & review
- [ ] API contract definition
- [ ] Development environment setup
- [ ] SmartThings API verification
- [ ] Documentation consolidation

### Deliverables
- [ ] Complete database schema (PostgreSQL)
- [ ] OpenAPI/Swagger specification
- [ ] SmartThings integration plan
- [ ] Development setup guide
- [ ] Architecture documentation (DONE)
- [ ] Phase 2 implementation plan (THIS DOC)

### Detailed Tasks

#### Week 1: Design & Planning
**Database Schema**
- [ ] User authentication tables
- [ ] Smart home device tables
- [ ] Activity Board tables (trivia, habits, mood, reading)
- [ ] Points & rewards tables
- [ ] Parent analytics tables
- Review & finalize schema
- Create migration scripts

**API Design**
- [ ] Define all endpoints (50+)
- [ ] Define request/response schemas
- [ ] Define error codes
- [ ] Create OpenAPI/Swagger spec
- [ ] Add to documentation

**SmartThings Planning**
- [ ] Verify SmartThings developer account active
- [ ] List all connected devices
- [ ] Document device IDs and types
- [ ] Plan device state polling strategy
- [ ] Design automation trigger system

**Team Setup**
- [ ] Configure development environment
- [ ] Create .env.local template
- [ ] Set up Docker Compose for local dev
- [ ] Create Git branches for Phase 2 work

#### Week 2: Development Environment
**Node.js Project Structure**
- [ ] Create backend directory structure
  ```
  backend/
  ├── src/
  │   ├── server.ts
  │   ├── database/
  │   │   ├── connection.ts
  │   │   ├── migrations/
  │   │   └── schema.sql
  │   ├── routes/
  │   │   ├── auth.ts
  │   │   ├── smartthings.ts
  │   │   ├── trivia.ts
  │   │   ├── habits.ts
  │   │   ├── mood.ts
  │   │   ├── reading.ts
  │   │   ├── points.ts
  │   │   └── parent.ts
  │   ├── middleware/
  │   │   ├── auth.ts
  │   │   ├── errorHandler.ts
  │   │   └── logging.ts
  │   ├── services/
  │   │   ├── smartthings.ts
  │   │   ├── points.ts
  │   │   └── notifications.ts
  │   ├── types/
  │   ├── utils/
  │   └── tests/
  ├── package.json
  ├── tsconfig.json
  ├── jest.config.js
  └── Dockerfile
  ```

- [ ] Set up Express.js with TypeScript
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up logging (Winston or Pino)
- [ ] Configure environment variables
- [ ] Set up testing framework (Jest)

**React Project Structure**
- [ ] Create frontend directory
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   │   ├── Dashboard/
  │   │   ├── ActivityBoard/
  │   │   ├── SmartHome/
  │   │   ├── ParentPortal/
  │   │   └── Common/
  │   ├── pages/
  │   ├── hooks/
  │   ├── services/
  │   ├── store/ (Redux or Context)
  │   ├── types/
  │   ├── styles/
  │   └── App.tsx
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  └── Dockerfile
  ```

- [ ] Set up React with TypeScript
- [ ] Configure routing (React Router)
- [ ] Set up state management
- [ ] Configure API client (axios/fetch)

**Docker & Deployment**
- [ ] Create Docker Compose for local development
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Set up PostgreSQL container
- [ ] Verify all services start correctly

#### Week 3: Database & Authentication
**Database Setup**
- [ ] Create PostgreSQL instance (Docker)
- [ ] Run migration scripts
- [ ] Verify all tables created
- [ ] Set up backups
- [ ] Create indexes for performance

**Authentication System**
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT token generation
- [ ] Implement password hashing (bcrypt)
- [ ] Implement role-based access control
- [ ] Write unit tests for auth

**Basic API Scaffolding**
- [ ] Create Express server
- [ ] Set up middleware (CORS, logging, error handling)
- [ ] Implement health check endpoints
- [ ] Implement basic user endpoints
- [ ] Test all endpoints with Postman

#### Week 4: SmartThings Integration & Review
**SmartThings Integration**
- [ ] Implement SmartThings device discovery
- [ ] Store device list in database
- [ ] Implement device state polling
- [ ] Implement device control commands
- [ ] Handle device state sync
- [ ] Error handling for API failures
- [ ] Test with real SmartThings devices

**Code Review & Documentation**
- [ ] Code review all Week 1-4 work
- [ ] Update API documentation
- [ ] Update database schema documentation
- [ ] Create developer setup guide
- [ ] Create troubleshooting guide

**Launch Readiness Check**
- [ ] All development environments working
- [ ] All tests passing
- [ ] No blocking issues
- [ ] Ready to start Week 5

---

## Week 5-8: Backend Development

### Objectives
- [ ] Complete Node.js API with 50+ endpoints
- [ ] PostgreSQL schema fully implemented
- [ ] All core business logic implemented
- [ ] Comprehensive integration tests
- [ ] API documentation complete

### Key Endpoints by Week

#### Week 5: Core Infrastructure & Auth (Continued)
- [ ] User profile endpoints (GET, PUT)
- [ ] User search/discovery endpoints
- [ ] Leaderboard base functionality
- [ ] Integration with SmartThings device data

#### Week 6: Activity Board - Trivia & Habits
- [ ] Trivia question endpoints (GET, POST)
- [ ] Trivia answer submission
- [ ] Trivia progress tracking
- [ ] Habits management (CRUD)
- [ ] Habit completion tracking
- [ ] Streak calculation algorithm
- [ ] Leaderboard calculations

#### Week 7: Activity Board - Reading & Mood
- [ ] Reading books management
- [ ] Reading progress tracking
- [ ] Mood logging
- [ ] Mood history & analytics
- [ ] Points calculation system
- [ ] Badge system implementation

#### Week 8: Integration & Testing
- [ ] Points transaction system
- [ ] Notification system (email alerts)
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] Integration testing (all endpoints)
- [ ] API documentation finalization
- [ ] Load testing

### Testing Requirements
- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All endpoints tested
- **Performance Tests:** <200ms response time p95
- **Security Tests:** SQL injection, XSS, CSRF tests

---

## Week 9-16: Activity Board Implementation

### Objectives
- [ ] Complete React dashboard rebuild
- [ ] Implement all Activity Board features
- [ ] Implement parent portal
- [ ] Full end-to-end testing
- [ ] Performance optimization

### Detailed Features

#### Week 9-10: Dashboard & Smart Home UI (2 weeks)

**Smart Home Dashboard**
- [ ] Device list view
- [ ] Device control interface
  - Lights: on/off, brightness, color
  - Locks: lock/unlock
  - Climate: temperature, mode
  - Switches: on/off
- [ ] Device status real-time updates
- [ ] Automation triggers
- [ ] Quick actions
- [ ] Responsive mobile design

**Components to Build**
- Device card component
- Device control panel
- Automation creator
- Status indicator
- Loading/error states

#### Week 11-12: Trivia Game Engine (2 weeks)

**Trivia Features**
- [ ] Question display
- [ ] Multiple choice interface
- [ ] Instant feedback (correct/incorrect)
- [ ] Point display
- [ ] Category selection
- [ ] Difficulty selection
- [ ] Session history
- [ ] Category-based leaderboard
- [ ] Weekly challenge mode
- [ ] Difficulty progression

**Content**
- [ ] 400+ trivia questions (hardcoded or DB)
- [ ] 5+ categories
- [ ] 5 difficulty levels
- [ ] Points per question based on difficulty

**Scoring Rules**
- Easy (1 point): 10 points
- Medium (2 points): 20 points
- Hard (3 points): 30 points
- Expert (4 points): 50 points
- Master (5 points): 100 points

**Components to Build**
- Question card
- Answer options
- Score display
- Feedback overlay
- Category selector
- Leaderboard

#### Week 13: Habits Tracking (1 week)

**Habits Features**
- [ ] Create daily/weekly habits
- [ ] Mark habits complete
- [ ] Streak tracking
- [ ] Habit history
- [ ] Completion calendar
- [ ] Habit recommendations
- [ ] Progress visualization

**Streak System**
- Daily completion = +1 streak
- Missed day = streak reset (0)
- Achievements at 7, 14, 30, 100 days
- Points earned per completion

**Components to Build**
- Habit list
- Habit creator
- Daily check-in
- Streak display
- Habit detail view
- Habit calendar

#### Week 14: Mood & Reading (2 weeks)

**Mood Journal**
- [ ] Daily mood entry
- [ ] Mood scale (1-5)
- [ ] Mood categories (happy, sad, angry, excited, etc.)
- [ ] Notes/journal entry
- [ ] Mood history graph
- [ ] Weekly mood summary
- [ ] Parent view of mood trends

**Reading Tracker**
- [ ] Add books (title, author, pages)
- [ ] Log reading progress
- [ ] Reading goals
- [ ] Book recommendations
- [ ] Reading list (to-read, reading, completed)
- [ ] Reading stats

**Components to Build**
- Mood selector
- Mood entry form
- Mood calendar
- Mood trend graph
- Book list
- Book detail view
- Progress updater

#### Week 15: Points & Rewards System (1 week)

**Points Display**
- [ ] Daily points earned
- [ ] Weekly points earned
- [ ] Monthly points earned
- [ ] All-time points
- [ ] Points breakdown by source
- [ ] Point transaction history

**Rewards System**
- [ ] Available rewards list
- [ ] Redeem points for rewards
- [ ] Reward history
- [ ] Custom rewards (parent-defined)

**Leaderboard**
- [ ] Weekly leaderboard
- [ ] Monthly leaderboard
- [ ] All-time leaderboard
- [ ] Category-based leaderboards

**Badge System**
- [ ] Achievement badges
- [ ] Badge display
- [ ] Badge unlock animation
- [ ] Badge details

**Components to Build**
- Points summary
- Point transaction list
- Leaderboard
- Badge display
- Rewards shop
- Redeem dialog

#### Week 16: Parent Portal (1 week)

**Parent Dashboard**
- [ ] Children list
- [ ] Child profile with photo
- [ ] This week's summary (points, activities, badges)
- [ ] Quick statistics
- [ ] Recent activity feed

**Child Analytics**
- [ ] Points earned (daily, weekly, monthly)
- [ ] Activity completion rate
- [ ] Habit streaks
- [ ] Mood trends
- [ ] Reading progress
- [ ] Time spent in app
- [ ] Achievement timeline

**Parental Controls**
- [ ] Approve/reject habits
- [ ] Create custom habits
- [ ] Set point values
- [ ] Create custom rewards
- [ ] View all transactions
- [ ] Notifications settings
- [ ] Feature toggles per child

**Settings**
- [ ] Profile settings
- [ ] Notification preferences
- [ ] Kids' access levels
- [ ] Backup & export data

**Components to Build**
- Parent dashboard
- Child summary card
- Analytics graphs
- Activity timeline
- Settings panel
- Control toggles

---

## Week 17-18: Integration & Testing

### Objectives
- [ ] End-to-end testing (all features)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Bug fixes
- [ ] Documentation updates

### Testing Plan

**Manual Testing**
- [ ] Walk through entire user journey
- [ ] Test all features on mobile
- [ ] Test all features on desktop
- [ ] Test with multiple users
- [ ] Test error scenarios

**Automated Testing**
- [ ] Run full test suite
- [ ] Verify code coverage >80%
- [ ] Load testing (concurrent users)
- [ ] Stress testing (high load)
- [ ] Security scanning

**Performance Optimization**
- [ ] Database query optimization
- [ ] API response time optimization
- [ ] Frontend bundle size optimization
- [ ] Caching strategy implementation
- [ ] CDN setup for static assets

**Security Review**
- [ ] OWASP top 10 scan
- [ ] Dependency vulnerability scan
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication/authorization review

---

## Week 19-20: Launch Preparation

### Objectives
- [ ] Final bug fixes
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User documentation
- [ ] Support runbook

### Deployment Checklist

**Pre-Launch**
- [ ] All tests passing (100%)
- [ ] No critical/high severity bugs
- [ ] Performance acceptable (<200ms p95)
- [ ] Security review passed
- [ ] Database backups tested
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Support team trained

**Launch Day**
- [ ] Final sanity test on production
- [ ] Rollback procedure ready
- [ ] Support team on standby
- [ ] Database backup taken
- [ ] Gradual rollout (10% → 50% → 100% if blue-green)

**Post-Launch**
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] 48-hour rollback window active

### Documentation
- [ ] API documentation complete
- [ ] User guide (parents)
- [ ] User guide (children)
- [ ] Installation/deployment guide
- [ ] Troubleshooting guide
- [ ] Architecture documentation
- [ ] Database schema documentation

### User Support
- [ ] FAQ document created
- [ ] Email support setup
- [ ] Issue tracking (GitHub Issues)
- [ ] Known issues documented
- [ ] Feedback collection mechanism

---

## Key Metrics & Success Criteria

### By End of Week 8 (Backend Complete)
- [ ] 50+ API endpoints implemented
- [ ] 80%+ test coverage
- [ ] Database schema proven
- [ ] SmartThings integration working
- [ ] All integration tests passing

### By End of Week 16 (Features Complete)
- [ ] All Activity Board modules complete
- [ ] Parent portal functional
- [ ] <200ms API response p95
- [ ] 0 critical/high bugs
- [ ] 95%+ test coverage

### By End of Week 20 (Launch Ready)
- [ ] 100% production ready
- [ ] All security reviews passed
- [ ] Monitoring/alerting active
- [ ] Documentation complete
- [ ] Support team trained

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| SmartThings API delays | Low | Verify account Week 1, fallback to polling |
| Database performance issues | Medium | Load testing Week 8, indexing strategy |
| React component complexity | Medium | Component testing, storybook docs |
| Timeline slippage | Medium | Weekly check-ins, buffer built in |
| Security vulnerabilities | Low | Security scan Week 18, penetration testing |

---

## Dependency Map

```
Phase 2 Start
    ↓
Week 1-4: Architecture & Setup
    ├── SmartThings verification
    ├── Database schema
    └── API design
    ↓
Week 5-8: Backend Development
    ├── Depends: Architecture complete
    ├── Auth system
    ├── SmartThings integration
    └── Core APIs
    ↓
Week 9-16: Frontend & Activity Board
    ├── Depends: Backend complete
    ├── Dashboard rebuild
    ├── Trivia engine
    ├── Habits system
    ├── Mood & Reading
    ├── Points system
    └── Parent portal
    ↓
Week 17-18: Testing & Optimization
    ├── Depends: All features complete
    ├── Performance testing
    ├── Security testing
    └── Bug fixes
    ↓
Week 19-20: Launch Prep
    ├── Depends: All systems tested
    ├── Production deployment
    ├── Monitoring setup
    └── Documentation
    ↓
Phase 2 Complete ✅
```

---

## Success Definition

Phase 2 is complete when:

✅ **Features**
- Trivia system working (400+ questions, multiplayer, leaderboard)
- Habits system working (daily/weekly, streaks, achievements)
- Mood journal functional (entries, trends, analytics)
- Reading tracker complete (books, goals, stats)
- Parent portal live (dashboard, analytics, controls)
- Smart home dashboard rebuilt in React

✅ **Quality**
- 95%+ test coverage
- <200ms API response p95
- 0 critical bugs
- 0 security vulnerabilities
- Monitoring/alerts active

✅ **Documentation**
- API docs complete
- User guides complete
- Architecture documented
- Deployment runbook done

✅ **Performance**
- <3 second page load
- <200ms API response
- Supports 10+ concurrent users
- Database handles 1000+ queries/second

✅ **Security**
- All OWASP tests passed
- No dependency vulnerabilities
- JWT authentication working
- Role-based access control enforced

---

**Document Version:** 1.0  
**Created:** July 27, 2026  
**Last Updated:** July 27, 2026  
**Status:** Ready to execute
