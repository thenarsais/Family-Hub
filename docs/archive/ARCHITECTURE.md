# Family Hub Architecture
**Version:** 2.0 (Phase 2)  
**Date:** July 27, 2026  
**Status:** Active

---

## System Overview

Family Hub is a multi-phase family management system combining smart home automation with educational and gamification features.

**Current Phase:** Phase 2 (Activity Board Implementation)  
**Tech Stack:** Node.js + Express + PostgreSQL + React + SmartThings

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Dashboard & Apps                  │
│  (Smart Home Dashboard, Activity Board, Learning Module UI) │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js + Express API Server                   │
│  (Auth, Users, Smart Home, Activity Board, Learning, Points)│
└────────────┬──────────────────────────────────────────┬─────┘
             │                                          │
             │ PostgreSQL                               │ SmartThings
             ▼                                          ▼
    ┌─────────────────┐                        ┌──────────────────┐
    │  PostgreSQL DB  │                        │  SmartThings Hub │
    │                 │                        │ (Lights, Locks,  │
    │ • Users/Auth    │                        │  Climate, etc.)  │
    │ • Devices       │                        │                  │
    │ • Activity Data │                        │  Webhooks ←→     │
    │ • Points/Badges │                        │                  │
    │ • Learning      │                        │  Direct API      │
    │ • Parent Portal │                        │  Calls           │
    └─────────────────┘                        └──────────────────┘
```

---

## Phase Architecture

### Phase 1: Smart Home Dashboard (✅ COMPLETE)
- Home Assistant YAML configuration
- Custom web dashboard
- Learning module (Gujarati)
- Chore system with basic points
- **Status:** Live, maintain only

### Phase 2: Activity Board & Backend (🚧 IN PROGRESS)
- Node.js + PostgreSQL backend
- React web dashboard rebuild
- SmartThings integration
- Activity Board (Trivia, Habits, Mood, Reading)
- Enhanced points system
- Parent portal
- **Timeline:** 20 weeks
- **Status:** Design phase

### Phase 3: Mobile Migration (📋 PLANNED)
- Flutter iOS/Android apps
- Flutter web app
- Single codebase approach
- Reuse Phase 2 Node.js backend
- **Timeline:** 8-12 weeks after Phase 2
- **Status:** Planned

---

## Core Technology Stack

### Backend
- **Runtime:** Node.js v26+
- **Framework:** Express.js v4.x
- **Language:** TypeScript
- **Database:** PostgreSQL v15+
- **ORM:** pg (node-postgres) or Prisma
- **Authentication:** JWT tokens + bcrypt
- **Testing:** Jest
- **Deployment:** Docker containers

### Frontend (Phase 2)
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** CSS Modules / TailwindCSS
- **Build:** Vite or Create React App
- **State Management:** Redux or Context API
- **Testing:** Jest + React Testing Library

### Infrastructure
- **Containerization:** Docker Compose
- **Database:** PostgreSQL (self-hosted)
- **API Documentation:** OpenAPI/Swagger
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus metrics

### External Integrations
- **Smart Home:** SmartThings REST API
- **Weather:** OpenWeatherMap API
- **Calendar:** Google Calendar API (future)
- **Meals:** Mealie API (Phase 1, maintain)

---

## Database Schema

### Core Entities

```sql
-- Users & Authentication
users
  ├── id (UUID)
  ├── email (VARCHAR)
  ├── name (VARCHAR)
  ├── role (parent|child|toddler)
  ├── password_hash (VARCHAR)
  ├── created_at, updated_at

-- Smart Home Integration
smartthings_devices
  ├── id (UUID)
  ├── device_id (VARCHAR, external SmartThings ID)
  ├── name (VARCHAR)
  ├── type (light|lock|climate|etc)
  ├── room (VARCHAR)
  ├── status (JSON)
  ├── last_updated

smartthings_automations
  ├── id (UUID)
  ├── name (VARCHAR)
  ├── trigger (time|event|manual)
  ├── actions (JSON)
  ├── enabled (BOOLEAN)

-- Activity Board
trivia_questions
  ├── id (UUID)
  ├── category (science|history|language|etc)
  ├── question (TEXT)
  ├── options (JSON)
  ├── correct_answer (INTEGER)
  ├── difficulty (1-5)
  ├── points_reward (INTEGER)

user_trivia_progress
  ├── id (UUID)
  ├── user_id (FK)
  ├── question_id (FK)
  ├── answered_correct (BOOLEAN)
  ├── attempts (INTEGER)
  ├── points_earned (INTEGER)
  ├── answered_at

habits
  ├── id (UUID)
  ├── user_id (FK)
  ├── name (VARCHAR)
  ├── description (TEXT)
  ├── frequency (daily|weekly)
  ├── points_reward (INTEGER)
  ├── created_at

habit_completions
  ├── id (UUID)
  ├── habit_id (FK)
  ├── completed_at
  ├── streak_count (INTEGER)

-- Reading & Learning
reading_books
  ├── id (UUID)
  ├── user_id (FK)
  ├── title (VARCHAR)
  ├── author (VARCHAR)
  ├── pages_total (INTEGER)
  ├── pages_read (INTEGER)
  ├── status (reading|completed|paused)
  ├── points_reward (INTEGER)

mood_entries
  ├── id (UUID)
  ├── user_id (FK)
  ├── mood (happy|sad|angry|excited|etc)
  ├── intensity (1-5)
  ├── notes (TEXT)
  ├── created_at

-- Points & Rewards
user_points
  ├── id (UUID)
  ├── user_id (FK)
  ├── total_points (INTEGER)
  ├── weekly_points (INTEGER)
  ├── monthly_points (INTEGER)
  ├── updated_at

point_transactions
  ├── id (UUID)
  ├── user_id (FK)
  ├── amount (INTEGER)
  ├── source (trivia|habit|chore|reading|mood|etc)
  ├── description (VARCHAR)
  ├── created_at

badges
  ├── id (UUID)
  ├── name (VARCHAR)
  ├── description (TEXT)
  ├── criteria (JSON)

user_badges
  ├── id (UUID)
  ├── user_id (FK)
  ├── badge_id (FK)
  ├── earned_at

-- Parent Portal
parent_analytics
  ├── id (UUID)
  ├── user_id (FK)
  ├── date (DATE)
  ├── data (JSON)
  │   ├── points_earned
  │   ├── activities_completed
  │   ├── time_spent
  │   ├── mood_summary
```

---

## API Endpoints (Phase 2)

### Authentication
```
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login (returns JWT)
POST   /api/auth/refresh         - Refresh token
POST   /api/auth/logout          - Logout
```

### Users
```
GET    /api/users/me             - Current user profile
PUT    /api/users/:id            - Update user
GET    /api/users/:id/profile    - User public profile
GET    /api/users/:id/points     - User points summary
```

### Smart Home
```
GET    /api/smartthings/devices  - List all devices
PUT    /api/smartthings/devices/:id - Update device state
GET    /api/smartthings/status   - System status
POST   /api/smartthings/automations - Create automation
GET    /api/smartthings/automations - List automations
```

### Activity Board - Trivia
```
GET    /api/trivia/questions          - Get random question
GET    /api/trivia/questions/:id      - Get specific question
POST   /api/trivia/answer             - Submit answer
GET    /api/trivia/progress           - User progress
GET    /api/trivia/categories         - List categories
GET    /api/trivia/leaderboard        - Weekly leaderboard
```

### Activity Board - Habits
```
POST   /api/habits                - Create habit
GET    /api/habits                - List user habits
PUT    /api/habits/:id            - Update habit
POST   /api/habits/:id/complete   - Mark complete
GET    /api/habits/:id/streak     - Streak info
```

### Activity Board - Mood
```
POST   /api/mood                  - Log mood entry
GET    /api/mood                  - Get mood history
GET    /api/mood/summary          - Weekly mood summary
```

### Activity Board - Reading
```
POST   /api/reading/books         - Add book
GET    /api/reading/books         - List books
PUT    /api/reading/books/:id     - Update progress
POST   /api/reading/books/:id/complete - Mark complete
```

### Points & Rewards
```
GET    /api/points/summary        - Points summary
GET    /api/points/history        - Transaction history
GET    /api/points/badges         - User badges
POST   /api/points/redeem         - Redeem points for reward
```

### Parent Portal
```
GET    /api/parent/dashboard      - Overview dashboard
GET    /api/parent/children       - List children
GET    /api/parent/children/:id/analytics - Child analytics
PUT    /api/parent/settings       - Update settings
```

### System
```
GET    /health                    - Liveness check
GET    /ready                     - Readiness check
GET    /metrics                   - Prometheus metrics
```

---

## Authentication & Security

### JWT Authentication
- **Token Format:** Bearer token in Authorization header
- **Payload:** user_id, role, email, exp
- **Secret:** 32+ character random string (from .env.local)
- **Expiry:** 24 hours for access token
- **Refresh:** Refresh token for long-lived sessions

### Password Security
- **Hashing:** bcrypt with 10+ rounds
- **Validation:** Minimum 8 characters
- **Storage:** Hash only (never plain text)

### Role-Based Access Control
```
parent   - Full access to all children's data, settings
child    - Own data, shared family features
toddler  - Limited access, supervised features
```

### Data Protection
- Row-level security for multi-user data
- HTTPS only (in production)
- SQL injection prevention (parameterized queries)
- XSS protection (input validation, output encoding)
- CSRF tokens for state-changing requests

---

## SmartThings Integration

### Device Control
- **Devices:** Lights, locks, climate, switches, etc.
- **API:** SmartThings REST API v1
- **Authentication:** Personal access token
- **Webhooks:** Real-time device updates (optional)
- **Polling:** Fallback device state refresh (30-second intervals)

### Example Flow
```
User taps "Turn on lights" in React dashboard
  ↓
POST /api/smartthings/devices/{deviceId}/commands
  ↓
Node.js backend calls SmartThings API
  ↓
SmartThings API sends command to physical device
  ↓
Device state updated in database
  ↓
React UI refreshes device status
```

### Device State Sync
- **On startup:** Fetch all device states from SmartThings
- **Every 30 seconds:** Poll device status
- **On webhook:** Instant update (if enabled)
- **Fallback:** Database cache if API unavailable

---

## Deployment Architecture

### Development
```
Local Machine
├── Node.js dev server (localhost:3000)
├── PostgreSQL (local Docker container)
└── React dev server (localhost:3000 or 5173)
```

### Production
```
Docker Host
├── nginx (reverse proxy, port 80/443)
├── Node.js app (port 3000, multiple instances)
├── PostgreSQL (persistent volume)
├── Redis (caching, optional)
└── Prometheus (metrics collection)
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment: DB_NAME, DB_USER, DB_PASSWORD
    volumes: db_data:/var/lib/postgresql/data
    
  backend:
    build: ./backend
    ports: 3000:3000
    environment: NODE_ENV, DATABASE_URL, JWT_SECRET
    depends_on: postgres
    
  frontend:
    build: ./frontend
    ports: 3000:3000
    depends_on: backend
```

---

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| API response | <200ms p95 | Web dashboard smoothness |
| Page load | <3s | Mobile-friendly |
| Database queries | <100ms p95 | SmartThings sync speed |
| Concurrent users | 10+ | Typical family size |
| Uptime | 99.5% | Home automation reliability |

---

## Monitoring & Observability

### Metrics Collected
- HTTP request latency and count
- Database query performance
- SmartThings API response times
- Error rates (HTTP 4xx, 5xx)
- System resources (CPU, memory, disk)

### Logging
- Application logs (Node.js console)
- Access logs (HTTP requests)
- Error logs (exceptions, failures)
- Audit logs (user actions)

### Alerting (Future)
- High error rate (>5%)
- Database connection failures
- SmartThings API unavailable
- Server CPU/memory high

---

## Migration Strategy (Phase 1 → Phase 2)

### Timeline
- **Week 1-4:** Build Phase 2 backend in parallel with Phase 1 (HA still running)
- **Week 5-8:** Rebuild dashboard UI in React, migrate data
- **Week 9-16:** Build Activity Board on Phase 2 backend
- **Cutover:** Switch traffic to Phase 2 (week 16-17)
- **Phase 1 sunset:** Maintain HA dashboard for 2-4 weeks after cutover

### Data Migration
1. Export Phase 1 device state from Home Assistant (if needed)
2. Import into Phase 2 PostgreSQL
3. Map HA device IDs to SmartThings device IDs
4. Verify device control works
5. Sunset HA dashboard

### Rollback Plan
- Keep Phase 1 (HA) running until Phase 2 proven stable
- Database backups before cutover
- DNS quick-switch if needed
- 48-hour rollback window

---

## Future Enhancements

### Phase 3 (Mobile)
- Flutter iOS/Android apps
- Reuse Phase 2 Node.js backend (zero backend changes)
- Flutter Web version (replaces React)

### Potential Additions
- Google Calendar sync
- Screen time tracking
- Xfinity xFi integration
- Voice control (Alexa/Google Home)
- Machine learning for habit predictions
- Social features (family challenges)

---

## Development Workflow

### Local Setup
1. Clone repo
2. Copy `.env.local.example` to `.env.local`
3. Start Docker Compose (`docker-compose up`)
4. Run migrations
5. Start Node.js dev server
6. Start React dev server
7. Open http://localhost:3000

### Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e` (optional)

### Deployment
1. Push to GitHub
2. GitHub Actions runs tests
3. Merge to main → automatic deploy to production
4. Docker images built and pushed to registry
5. Production server pulls new images and restarts

---

**Document Version:** 2.0  
**Last Updated:** July 27, 2026  
**Next Review:** After Phase 2 week 4 stabilization
