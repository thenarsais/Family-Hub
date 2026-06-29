# Phase 1: Implementation Plan & Execution

**Date:** 2026-06-29  
**Status:** ACTIVE - Implementation Begins Now  
**Duration:** Estimated 3-4 weeks  
**Goal:** Complete backend infrastructure + Activity Board MVP + HA Dashboard MVP

---

## Phase 1 Overview

### What We're Building (Phase 1)

**Backend:**
- PostgreSQL database (20+ tables)
- Supabase setup (auth, real-time, storage)
- REST API (30+ endpoints)
- Sync queue system (offline support)
- WebSocket for real-time updates

**Activity Board (MVP):**
- Games system (4 games: Wordle, Quick-Fire, Scramble, Hangman)
- Trivia system (1000 questions, 16 categories, 4 levels)
- Daily Quests (3 quests/day from 130+ pool)
- Points tracking & ledger
- Habits (11 predefined + custom)
- Badges (~100 core badges)
- Mood tracking
- Settings & Profile

**HA Dashboard (MVP):**
- Clock + Weather display
- Family Calendar (Google Calendar sync)
- Shopping List
- Family Announcements Banner
- Responsive design (monitor + mobile)

**Parent Portal (MVP):**
- Dashboard overview
- Activity log viewer
- Basic analytics
- Settings management

### Deliverables

**Week 1:**
- Database schema in Supabase
- API server running with 10 core endpoints
- Flutter project initialized with Riverpod
- Local development environment working

**Week 2:**
- Remaining 20 API endpoints
- Games system implemented
- Trivia system with question pool
- Points system working
- Offline queue functional

**Week 3:**
- Daily Quests generation
- Habits system
- Badges unlock system
- Dashboard MVP UI
- Calendar integration

**Week 4:**
- Activity Board MVP UI
- Parent Portal MVP
- Shopping list
- Announcements
- End-to-end testing

---

## Phase 1A: Environment & Database Setup (Days 1-2)

### Task 1A1: Development Environment Setup

**What to Install:**
- [ ] Flutter SDK (latest stable)
- [ ] Xcode (Mac) or Android Studio
- [ ] PostgreSQL 14+ (local development)
- [ ] Node.js 18+ (for backend/scripts)
- [ ] Git & GitHub CLI
- [ ] VSCode or IDE
- [ ] Postman (API testing)

**Verification:**
```bash
flutter --version
postgres --version
node --version
git --version
```

**Est. Time:** 1-2 hours

**Owner:** [You]

---

### Task 1A2: Supabase Project Setup

**Steps:**
1. Create Supabase account (supabase.com)
2. Create new project:
   - Name: "family-hub"
   - Region: US East (or closest to you)
   - Database: PostgreSQL 14
3. Get connection string
4. Enable real-time for tables
5. Setup authentication

**Config File to Create:**
```bash
# .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://postgres:password@localhost:5432/family_hub
```

**Verification:**
- [ ] Can connect to Supabase dashboard
- [ ] Can query database
- [ ] Real-time is enabled

**Est. Time:** 30 minutes

**Owner:** [You]

---

### Task 1A3: PostgreSQL Schema Implementation

**What to Do:**
1. Copy schema from UNIFIED_STATE_SCHEMA.md
2. Create migration script (V1__initial_schema.sql)
3. Run against local PostgreSQL
4. Push to Supabase

**Core Tables to Create (in order):**
```
1. users
2. children
3. sessions
4. activities
5. points_ledger
6. badges
7. child_badges
8. habits
9. habit_logs
10. goals
11. streaks
12. moods
13. events
14. calendar_sync_log
15. notifications
16. automations
17. audit_log
18. sync_queue
```

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 18 tables
```

**Est. Time:** 3-4 hours

**Owner:** [You] OR Backend Developer

**Dependency:** Task 1A2 complete

---

### Task 1A4: Database Seeding (Initial Data)

**Seeds to Create:**
- [ ] 1,000 Trivia Questions (categories, difficulty levels)
- [ ] 11 Predefined Habits
- [ ] 130+ Daily Quest Templates
- [ ] ~100 Core Badges
- [ ] 4 Trivia Difficulty Themes (partial)

**File Format:**
```json
// seeds/trivia-questions.json
[
  {
    "uuid": "q001",
    "question": "What is the capital of India?",
    "options": ["Delhi", "Mumbai", "Bangalore", "Hyderabad"],
    "correct": "Delhi",
    "category": "Geography",
    "difficulty": "level1",
    "funFact": "Delhi has been the capital since 1931",
    "hint": "It's on the Yamuna River"
  }
]
```

**Verification:**
```sql
SELECT COUNT(*) FROM trivia_questions; -- Should be ~1000
SELECT COUNT(*) FROM badges; -- Should be ~100
```

**Est. Time:** 4-6 hours (mostly data entry/scripts)

**Owner:** Backend Developer OR automated script

**Dependency:** Task 1A3 complete

---

## Phase 1B: Backend API Development (Days 3-7)

### Task 1B1: API Server Setup

**Technology Stack:**
- Framework: Node.js + Express (or Supabase Functions if preferred)
- ORM: Prisma (for type-safe database access)
- Validation: Zod (request validation)
- Authentication: JWT + Supabase Auth

**Folder Structure:**
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── children.ts
│   │   ├── activities.ts
│   │   ├── points.ts
│   │   ├── badges.ts
│   │   ├── goals.ts
│   │   ├── calendar.ts
│   │   ├── automations.ts
│   │   └── index.ts (route aggregator)
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── services/
│   ├── types/
│   ├── db/
│   │   └── schema.prisma
│   └── server.ts
├── .env.local
├── package.json
└── tsconfig.json
```

**Setup Steps:**
```bash
# Initialize backend
mkdir backend && cd backend
npm init -y
npm install express prisma zod dotenv cors
npm install -D typescript ts-node @types/express

# Setup Prisma
npx prisma init
# Update .env with DATABASE_URL
```

**Verification:**
```bash
npm run dev
# Should start server on http://localhost:3000
```

**Est. Time:** 2-3 hours

**Owner:** Backend Developer

---

### Task 1B2: Authentication Endpoints

**Endpoints to Implement:**

```
POST /auth/register
  Request: { email, password, fullName, timezone }
  Response: { id, email, token, expiresIn }

POST /auth/login
  Request: { email, password, deviceInfo? }
  Response: { id, email, token, expiresIn, user_type }

POST /auth/refresh
  Request: { refreshToken }
  Response: { token, expiresIn }

POST /auth/logout
  Response: { success: true }
```

**Implementation Notes:**
- Use Supabase Auth for users table
- JWT tokens: 1 hour expiry
- Refresh tokens: 7 days expiry
- Hash passwords with bcrypt
- Rate limit: 5 attempts per minute per IP

**Verification:**
```bash
# Test registration
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User","timezone":"America/New_York"}'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Est. Time:** 2-3 hours

**Owner:** Backend Developer

**Dependency:** Task 1B1 complete

---

### Task 1B3: Activity & Points Endpoints

**Endpoints to Implement:**

```
POST /activities
  Create activity (game, quest, trivia, etc.)

GET /activities
  List activities with filtering

PUT /activities/{id}
  Update activity status

GET /points/summary
  Get points summary for child

GET /points/ledger
  Get detailed points ledger

POST /points/adjust
  Parent adjusts points manually
```

**Key Logic:**
- Activities locked to child (can only see own)
- Points calculated based on activity type & difficulty
- Multipliers applied on insert
- Ledger tracks all transactions

**Verification:**
- [ ] Can create activity
- [ ] Points calculated correctly
- [ ] Ledger updated
- [ ] Multipliers applied

**Est. Time:** 4-5 hours

**Owner:** Backend Developer

**Dependency:** Task 1B2 complete

---

### Task 1B4: Badges & Goals Endpoints

**Endpoints to Implement:**

```
GET /badges
  Get all available badges

GET /children/{id}/badges
  Get unlocked badges

POST /goals
  Create weekly/monthly goal

GET /goals
  List active goals

PUT /goals/{id}
  Update goal progress

GET /goals/{id}/progress
  Get goal progress details
```

**Badge Logic:**
- Unlock conditions checked on activity completion
- Only lock badge once (immutable)
- Notification sent on unlock
- Points awarded immediately

**Goal Logic:**
- Target metric tracked separately
- Progress updated real-time
- Partial credit calculated at expiry
- Bonus points awarded on completion

**Est. Time:** 4-5 hours

**Owner:** Backend Developer

**Dependency:** Task 1B3 complete

---

### Task 1B5: Offline Sync Queue

**Endpoint:**

```
POST /sync/queue
  Queue action for later sync

POST /sync/batch
  Sync batched offline actions
```

**Sync Queue Logic:**
- Store in sync_queue table
- Track: action_type, resource_type, payload
- Retry with exponential backoff
- Process atomically on reconnect
- Timestamps preserve order

**Database Trigger:**
- Auto-retry after 5s, 15s, 30s
- Max 3 retries before manual review
- Log all retry attempts

**Verification:**
- [ ] Offline action queued
- [ ] Queue persists across restarts
- [ ] Batch sync processes all items
- [ ] Timestamps preserved

**Est. Time:** 3-4 hours

**Owner:** Backend Developer

**Dependency:** Task 1B4 complete

---

### Task 1B6: WebSocket for Real-Time (Optional Phase 1)

**Defer to Phase 2 if time constraint**

If implementing:
- Setup Socket.IO
- Subscribe to critical events
- Broadcast to connected clients
- Fallback to polling if WebSocket down

**Est. Time:** 4-6 hours (defer if needed)

**Owner:** Backend Developer

---

## Phase 1C: Flutter Project Setup (Days 3-4)

### Task 1C1: Flutter Project Initialization

**Create Project:**
```bash
flutter create family_hub
cd family_hub
```

**Update pubspec.yaml:**

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  riverpod: ^2.4.0
  flutter_riverpod: ^2.4.0
  
  # Routing
  go_router: ^10.0.0
  
  # HTTP Client
  dio: ^5.3.0
  
  # Local Storage
  isar: ^3.1.0
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_messaging: ^14.6.0
  firebase_analytics: ^10.6.0
  firebase_crashlytics: ^3.3.0
  
  # UI
  flutter_material_3: ^0.0.0
  
  # Utilities
  freezed_annotation: ^2.4.1
  json_serializable: ^6.7.0

dev_dependencies:
  build_runner: ^2.4.0
  freezed: ^2.4.1
```

**Run:**
```bash
flutter pub get
flutter pub run build_runner build
```

**Folder Structure:**
```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── providers.dart
│   └── router.dart
├── features/
│   ├── auth/
│   │   ├── presentation/
│   │   ├── application/
│   │   └── domain/
│   ├── games/
│   ├── trivia/
│   ├── activities/
│   ├── points/
│   └── ...
├── shared/
│   ├── providers/
│   ├── widgets/
│   ├── utils/
│   └── constants/
└── generated/ (auto-generated)
```

**Verification:**
```bash
flutter run
# App should launch on emulator/device
```

**Est. Time:** 1-2 hours

**Owner:** Flutter Developer

---

### Task 1C2: Riverpod State Management Setup

**Create Core Providers:**

```dart
// lib/shared/providers/api_provider.dart
final dioProvider = Provider((ref) {
  final dio = Dio();
  dio.options.baseUrl = 'http://localhost:3000/api';
  dio.interceptors.add(AuthInterceptor());
  return dio;
});

// lib/shared/providers/auth_provider.dart
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final dio = ref.watch(dioProvider);
  return AuthNotifier(dio);
});

final currentUserProvider = FutureProvider((ref) async {
  final authState = ref.watch(authStateProvider);
  return authState.maybeWhen(
    authenticated: (user) => user,
    orElse: () => null,
  );
});

// lib/shared/providers/child_provider.dart
final currentChildProvider = StateProvider<Child?>((ref) => null);

final childActivitiesProvider = FutureProvider.family<List<Activity>, String>(
  (ref, childId) async {
    final dio = ref.watch(dioProvider);
    final response = await dio.get('/activities?childId=$childId');
    return (response.data as List)
        .map((e) => Activity.fromJson(e))
        .toList();
  },
);
```

**Create Models:**

```dart
// lib/shared/models/user.dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String email,
    required String name,
    required String role,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) =>
      _$UserFromJson(json);
}

@freezed
class Child with _$Child {
  const factory Child({
    required String id,
    required String name,
    required int pointsTotal,
    required int currentStreak,
  }) = _Child;

  factory Child.fromJson(Map<String, dynamic> json) =>
      _$ChildFromJson(json);
}
```

**Verification:**
- [ ] Providers compile without errors
- [ ] Models serialize/deserialize correctly
- [ ] Riverpod can access providers

**Est. Time:** 3-4 hours

**Owner:** Flutter Developer

**Dependency:** Task 1C1 complete

---

### Task 1C3: Local Storage (Isar) Setup

**Create Collections:**

```dart
// lib/shared/storage/isar_collections.dart
@Collection()
class CachedActivity {
  Id id = Isar.autoIncrement;
  late String activityId;
  late String title;
  late String status;
  late DateTime createdAt;
  late DateTime? syncedAt;
}

@Collection()
class SyncQueueItem {
  Id id = Isar.autoIncrement;
  late String action;
  late String resourceType;
  late DateTime createdAt;
  late bool synced;
}

@Collection()
class CachedUser {
  Id id = Isar.autoIncrement;
  late String userId;
  late String email;
  late String name;
  late DateTime cachedAt;
}
```

**Setup Isar:**

```dart
// lib/shared/storage/isar_service.dart
final isarProvider = FutureProvider((ref) async {
  final isar = await Isar.open(
    [
      CachedActivitySchema,
      SyncQueueItemSchema,
      CachedUserSchema,
    ],
  );
  return isar;
});
```

**Verification:**
- [ ] Isar opens successfully
- [ ] Collections created
- [ ] Can read/write data

**Est. Time:** 2-3 hours

**Owner:** Flutter Developer

**Dependency:** Task 1C2 complete

---

## Phase 1D: Games System Implementation (Days 8-10)

### Task 1D1: Wordle Game

**Game Logic:**

```
- Player picks difficulty (Easy 4-5 letters, Medium 5-7, Hard 7-9)
- Player has 6 attempts to guess the word
- Visual: Letter grid with color feedback (green=correct, yellow=position, gray=wrong)
- Hints: 3 available (Category, First Letter, Definition)
- Scoring: Base 10 × difficulty + (attempts remaining × 5)
- Session: Auto-saves continuously, resume same day
```

**Implementation:**

```dart
// lib/features/games/domain/models/wordle_game.dart
@freezed
class WordleGame with _$WordleGame {
  const factory WordleGame({
    required String id,
    required String word,
    required String difficulty,
    required int attemptCount,
    required List<String> guessHistory,
    required bool completed,
    required int score,
  }) = _WordleGame;
}

// lib/features/games/application/wordle_notifier.dart
class WordleNotifier extends StateNotifier<WordleGame> {
  WordleNotifier(this.ref) : super(initialState);
  
  final Ref ref;
  
  void makeGuess(String letter) {
    // Guess logic
  }
  
  void useHint(String hintType) {
    // Hint logic: -5/-10/-20 pts
  }
  
  Future<void> completeGame() async {
    // Save to backend
  }
}
```

**Verification:**
- [ ] Can start game with difficulty selection
- [ ] Letter grid displays correctly
- [ ] Scoring calculated
- [ ] Hints deduct points
- [ ] Session saved

**Est. Time:** 4-5 hours

**Owner:** Flutter Developer

**Dependency:** Task 1C2 complete

---

### Task 1D2: Quick-Fire Trivia

**Game Logic:**

```
- Player picks category & difficulty
- Lives-based: 3 lives, lose one per wrong answer
- Multiple choice: 4 options
- Scoring: (10 × difficulty) × combo × speed bonus + lives bonus
- Combo multipliers: 3+ correct = 1.1×, 5+ = 1.25×, 7+ = 1.5×
- Speed bonus: +5 if answered in <50% of timer
- Lives bonus: +2 per life remaining
```

**Implementation:**

```dart
// lib/features/games/domain/models/quickfire_game.dart
@freezed
class QuickfireGame with _$QuickfireGame {
  const factory QuickfireGame({
    required String id,
    required String category,
    required String difficulty,
    required int livesRemaining,
    required int correctCount,
    required int totalQuestions,
    required int comboStreak,
    required bool completed,
    required int score,
  }) = _QuickfireGame;
}
```

**Verification:**
- [ ] Category selection works
- [ ] Multiple choice displays
- [ ] Combo multiplier calculates
- [ ] Speed bonus applied
- [ ] Lives decrease on wrong answer

**Est. Time:** 4-5 hours

**Owner:** Flutter Developer

**Dependency:** Task 1D1 complete

---

### Task 1D3: Word Scramble & Hangman

**Similar implementation to Tasks 1D1 & 1D2**

**Est. Time:** 4-5 hours per game

**Owner:** Flutter Developer

---

## Phase 1E: Trivia System (Days 11-12)

### Task 1E1: Trivia Question Pool

**Load Questions:**

```dart
// lib/features/trivia/data/trivia_repository.dart
class TriviaRepository {
  Future<List<TriviaQuestion>> getQuestionsByCategory(String category, String difficulty) async {
    // Fetch from backend or local cache
    // Filter: correct answers don't repeat 14 days
    // Filter: incorrect answers resurface 3-7 days weighted by miss count
  }
  
  Future<void> recordAnswer(String questionId, bool correct, int timeSpent) async {
    // Record answer + time
    // Check for new badge unlocks
  }
}
```

**Verification:**
- [ ] Can load 1000 questions
- [ ] Category filtering works
- [ ] Difficulty levels correct
- [ ] Question cycling logic works

**Est. Time:** 3-4 hours

**Owner:** Backend + Flutter Developer

---

### Task 1E2: Trivia Session & Category Mastery

**Session Logic:**

```dart
// Track accuracy per category
// Update category mastery levels
// Calculate unlock requirements for next level
// Display category mastery grid
```

**Verification:**
- [ ] Session records answers correctly
- [ ] Category accuracy calculates
- [ ] Mastery levels unlock appropriately
- [ ] Visual display correct

**Est. Time:** 3-4 hours

**Owner:** Flutter Developer

---

## Phase 1F: Daily Quests & Points System (Days 13-14)

### Task 1F1: Quest Generation & Daily Reset

**Quest Generator:**

```dart
// lib/features/quests/application/quest_generator.dart
class QuestGenerator {
  List<Quest> generateDailyQuests() {
    // Day of week determines bias (rotate through 3 approaches)
    // Hybrid rotation: Uniform → Weakness → Streak maintenance
    // Apply max 1 points quest, max 1 streak quest
    // Return 3 quests
  }
  
  int calculateSwapCost(int swapsUsedThisWeek) {
    // Tiered escalation: 5%, 10%, 15% of daily goal
  }
}
```

**Verification:**
- [ ] Generates 3 quests daily
- [ ] Rotation algorithm works
- [ ] Swap cost escalates correctly
- [ ] Resets at Monday midnight

**Est. Time:** 3-4 hours

**Owner:** Flutter Developer

---

### Task 1F2: Points Ledger & Daily Bonus Multiplier

**Points System:**

```dart
// lib/features/points/application/points_service.dart
class PointsService {
  int calculatePoints(Activity activity) {
    // Base points by activity type
    // Apply difficulty multiplier
    // Apply daily bonus multiplier (1.0× → 2.0× on day 30+)
    // Return final points
  }
  
  Future<void> awardPoints(String childId, int points, String reason) async {
    // Insert into points_ledger
    // Update daily total
    // Check for point cap
    // Check for badge unlocks
  }
}
```

**Verification:**
- [ ] Points calculated correctly
- [ ] Multipliers applied
- [ ] Ledger updated
- [ ] Cap respected

**Est. Time:** 3-4 hours

**Owner:** Flutter Developer

**Dependency:** Task 1F1 complete

---

## Phase 1G: UI Implementation (Days 15-18)

### Task 1G1: Activity Board Dashboard

**Screens to Build:**

```
ActivityBoardScreen (Dashboard)
├── DailyProgressCard (points, streak, goal)
├── QuestsCard (3 daily quests)
├── GamesSectionCard (4 games)
├── TriviaSectionCard
├── HabitsSectionCard
├── PointsTrackerCard
└── BottomNav (Games, Trivia, Quests, Habits, Settings)
```

**Material 3 Design:**
- Use seasonal color scheme (default: Spring)
- Card-based layout
- Rounded corners
- Smooth animations
- Accessibility (WCAG AA)

**Verification:**
- [ ] Dashboard displays all cards
- [ ] Colors use seasonal theme
- [ ] Interactive elements work
- [ ] Responsive on different screen sizes

**Est. Time:** 5-6 hours

**Owner:** UI/Flutter Developer

---

### Task 1G2: Games UI

**Wordle Screen:**
```
- Difficulty selector (Easy/Medium/Hard)
- Word grid (6 rows, letter colors)
- Hint button
- Timer
- Submit button
```

**Quick-Fire Screen:**
```
- Category selector
- Difficulty selector
- Questions with multiple choice
- Lives indicator ❤️❤️❤️
- Timer per question
```

**Similar for Scramble & Hangman**

**Verification:**
- [ ] All 4 games have UI
- [ ] Interactive elements work
- [ ] Scoring displays correctly

**Est. Time:** 8-10 hours (all 4 games)

**Owner:** UI/Flutter Developer

---

### Task 1G3: HA Dashboard UI

**Screens to Build:**

```
HADashboardScreen (Main)
├── WeatherCard
├── CalendarCard (7-day view)
├── AnnouncementBanner (top)
├── ShoppingListCard
└── BottomNav (Dashboard, ActivityBoard, ParentPortal, Settings)

CalendarDetailScreen
├── Event list
└── Event creation form
```

**Verification:**
- [ ] Weather displays correctly
- [ ] Calendar shows events
- [ ] Announcement rotates
- [ ] Shopping list functional
- [ ] Responsive layout

**Est. Time:** 6-8 hours

**Owner:** UI/Flutter Developer

---

## Phase 1H: Testing & Integration (Days 19-20)

### Task 1H1: Backend API Testing

**Test Each Endpoint:**

```bash
# Test auth
curl -X POST http://localhost:3000/api/auth/register ...
curl -X POST http://localhost:3000/api/auth/login ...

# Test activities
curl -X POST http://localhost:3000/api/activities ...
curl -X GET http://localhost:3000/api/activities?childId=xxx ...

# Test points
curl -X GET http://localhost:3000/api/points/summary?childId=xxx ...
curl -X POST http://localhost:3000/api/points/adjust ...

# Test sync queue
curl -X POST http://localhost:3000/api/sync/queue ...
curl -X POST http://localhost:3000/api/sync/batch ...
```

**Use Postman Collection:**
- Create collection with all endpoints
- Set environment variables
- Test each endpoint
- Verify response formats

**Est. Time:** 4-5 hours

**Owner:** Backend Developer + QA

---

### Task 1H2: UI Testing

**Test Flows:**

```
1. Login flow
   - Register new account
   - Login
   - See dashboard

2. Game flow
   - Select game
   - Play game
   - Complete game
   - Check points awarded
   - Check streak updated

3. Trivia flow
   - Select category & difficulty
   - Answer questions
   - See results
   - Check category mastery updated

4. Quest flow
   - Complete daily quest
   - Swap quest
   - Complete all 3 quests
   - Check bonus awarded
```

**Device Testing:**
- Emulator (Android)
- Simulator (iOS) if available
- Check responsive layout

**Est. Time:** 4-5 hours

**Owner:** QA + Flutter Developer

---

### Task 1H3: End-to-End Testing

**Critical Paths:**

1. **User Registration → Login → Complete Game → Points Awarded**
2. **Parent Portal → Adjust Points → Child Sees Update**
3. **Offline: Queue Action → Go Offline → Go Online → Sync**
4. **Trivia: Answer Questions → Unlock Badge → See Notification**

**Performance Testing:**

```
- Load 1000 trivia questions
- Measure load time
- Measure sync time (offline queue)
- Measure API response times
  Target: <200ms for GET, <500ms for POST
```

**Est. Time:** 4-5 hours

**Owner:** QA + Engineering

---

## Phase 1 Deliverables Checklist

### Backend ✅
- [ ] PostgreSQL schema with 20+ tables
- [ ] Supabase project configured
- [ ] 30+ API endpoints implemented
- [ ] Authentication working
- [ ] Offline sync queue functional
- [ ] Error handling & logging
- [ ] Rate limiting on auth endpoints
- [ ] Postman collection for testing

### Frontend (Flutter) ✅
- [ ] Flutter project initialized
- [ ] Riverpod providers setup
- [ ] Isar local storage working
- [ ] 4 games implemented
- [ ] Trivia system working
- [ ] Daily quests generating
- [ ] Points tracking
- [ ] Basic badges system
- [ ] Dashboard UI
- [ ] Games UI
- [ ] HA Dashboard UI
- [ ] Settings screen

### Database ✅
- [ ] 1000 trivia questions seeded
- [ ] 11 habits predefined
- [ ] 130+ quest templates
- [ ] ~100 badges defined
- [ ] Initial unlock conditions set

### Documentation ✅
- [ ] API documentation (Postman)
- [ ] Database schema diagram
- [ ] Riverpod provider hierarchy
- [ ] Game rules reference
- [ ] Implementation decisions log

### Testing ✅
- [ ] Unit tests (core logic)
- [ ] Integration tests (API + Database)
- [ ] UI tests (critical flows)
- [ ] Performance testing
- [ ] Offline sync testing

---

## Success Criteria for Phase 1

**Must Have (Blocking):**
- [ ] User can register & login ✅
- [ ] User can play all 4 games ✅
- [ ] Points system works ✅
- [ ] Daily quests generate ✅
- [ ] Offline sync works ✅
- [ ] Badges unlock ✅
- [ ] Dashboard displays data ✅

**Should Have:**
- [ ] Calendar syncs with Google ✅
- [ ] Shopping list functional ✅
- [ ] Parent Portal basics ✅
- [ ] Announcements work ✅

**Nice to Have:**
- [ ] WebSocket for real-time ✅
- [ ] Full analytics ✅
- [ ] Voice integration ✅

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Database schema changes | Medium | Version all migrations, test rollback |
| API rate limiting hits | Low | Implement caching, batch requests |
| Flutter state management complex | Medium | Use Riverpod examples, pair programming |
| Trivia question quality | Low | Claude-curated list, parent review optional |
| Offline sync conflicts | Medium | Last-write-wins strategy, conflict log |
| Performance regression | Medium | Load test early, optimize before Phase 2 |

---

## Timeline

```
Week 1: Environment + Database (Days 1-5)
├─ Day 1-2: Environment setup, Supabase, PostgreSQL
├─ Day 3: Schema implementation
├─ Day 4-5: Data seeding, API server setup
└─ Deliverable: Database running, API endpoints scaffold

Week 2: API + State Management (Days 6-10)
├─ Day 6: Core endpoints (auth, activities)
├─ Day 7-8: Games system implemented
├─ Day 9-10: Riverpod setup, local storage
└─ Deliverable: Backend functional, Flutter scaffold

Week 3: Games + Points (Days 11-15)
├─ Day 11-13: Wordle, Quick-Fire, Scramble, Hangman
├─ Day 14-15: Trivia, Points, Quests
└─ Deliverable: Games playable, points awarding

Week 4: UI + Testing (Days 16-20)
├─ Day 16-17: Activity Board UI
├─ Day 18: HA Dashboard UI
├─ Day 19-20: Testing, bug fixes
└─ Deliverable: MVP complete, ready for Phase 2
```

---

## Next Immediate Steps

**TODAY (Session Start):**
1. [ ] Choose technology stack confirmation (Node.js? Supabase? Flutter?)
2. [ ] Setup development environment
3. [ ] Create Supabase project
4. [ ] Begin Task 1A (Environment setup)

**THIS WEEK:**
1. [ ] Complete all database setup
2. [ ] Implement core API endpoints
3. [ ] Get Flutter project running
4. [ ] Begin games implementation

**THEN: Phase 1A Complete → Move to Phase 1B**

---

**Ready to Begin Task 1A: Environment Setup?**

Or would you like clarification on any task first?

