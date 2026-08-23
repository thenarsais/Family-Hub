# Family Hub — Phase 8B Roadmap (16+ Weeks)

**Current Status:** MVP Complete ✅ | Phase 8B Starting 🚧

---

## Overview

Phase 8B expands the learning module with AI-powered features, adds parent analytics, creates a toddler module, and optimizes performance. Total estimated effort: 16-18 weeks of development.

---

## Phase 8B.1: Parent Authentication & Session Management (2 weeks)

**Goal:** Secure the hub, enable multi-user experiences, protect sensitive data.

### Features to Build

- **Parent login** — PIN or password authentication for adult-only features
- **Session management** — Logout after 30 min of inactivity
- **Adult-only cards** — Gift lists, medical wiki, budget, etc. hidden from kids
- **Profile switching** — One-tap switch between Krish, Karishma, and Parent views
- **Access tokens** — Secure API endpoints for mobile companion app

### Technical Details

- Home Assistant user accounts + permissions
- LocalStorage encryption (simple XOR, not production-grade)
- Session timeout automation
- Card visibility templating

### Deliverables

- Parent dashboard with login tile
- Profile picker widget
- Hidden adult cards on Kids view
- Session timeout automation

**Estimated effort:** 10 hours

---

## Phase 8B.2: Audio Integration & Content Expansion (3 weeks)

**Goal:** Teach pronunciation, add cultural context, provide example sentences.

### Gujarati Audio

- **Open-source TTS** — Wyoming protocol + Piper (local, no cloud)
- **Word-level audio** — Each lesson can be played out loud
- **Pronunciation guide** — Listen before tracing
- **Sentence examples** — Hear phrases with words in context

### Content Expansion

- **Cultural notes** — Origin of words, usage context, significance
- **Example sentences** — 2-3 sentences per vocabulary word
- **Greetings & phrases** — "Hello", "Thank you", "Good morning" sets
- **Holiday phrases** — Diwali, Navaratri, Holi-specific vocabulary
- **Family terms** — Maa, Bhai, Bhabhi, etc. with relationships

### Mobile Support

- **Responsive audio player** — Phone-optimized interface
- **Background playback** — Continue audio while using other apps
- **Offline support** — Audio files stored locally

### Technical Details

- Python TTS backend (gTTS or PyTorch models)
- Audio file caching in Home Assistant
- WebAudio API for playback in browser
- Piper setup & configuration

### Deliverables

- TTS integration with Home Assistant
- Audio files for 158 lessons + 50 phrases
- Mobile-optimized audio player
- Cultural content expansion (150+ items)

**Estimated effort:** 20 hours

---

## Phase 8B.3: Backend Infrastructure (4 weeks)

**Goal:** Build scalable API, enable cloud sync, support offline mode.

### APIs to Build

**20+ endpoints including:**
- `GET /api/progress/{user}` — User progress summary
- `POST /api/progress/{user}/lesson` — Record lesson completion
- `GET /api/lessons/{id}` — Fetch lesson details
- `POST /api/quiz` — Submit quiz answer
- `POST /api/trace/{letter}` — Submit trace data
- `GET /api/stats/{user}` — Weekly/monthly stats
- `POST /api/notes/{user}` — Save notes per lesson
- `DELETE /api/progress/{user}/{lesson}` — Reset lesson

### Database

- **PostgreSQL** — Runs on mini PC
- **Schema:**
  - Users (id, name, age, created_at)
  - Lessons (id, phase, type, content, difficulty)
  - Progress (user_id, lesson_id, completed, accuracy, timestamp)
  - Quiz (user_id, question_id, answered, correct, timestamp)
  - Notes (user_id, lesson_id, note_text, timestamp)

### Cloud Sync (Optional)

- **Google Cloud Storage** — Sync progress to cloud (optional)
- **Conflict resolution** — Last-write-wins or merge strategy
- **Encryption** — End-to-end for sensitive data

### Offline Mode

- **Service Worker** — Caches API responses
- **LocalStorage** — Queues offline submissions
- **Sync on reconnect** — Auto-submit queued data when online

### Technical Stack

- **Framework:** Node.js + Express or Python + FastAPI
- **Database:** PostgreSQL with Sequelize/ORM
- **Hosting:** Docker container on mini PC
- **API docs:** OpenAPI/Swagger

### Deliverables

- Node.js + Express API server
- PostgreSQL database with schema
- Service Worker for offline sync
- API documentation (Swagger)
- Mobile app ready for backend calls

**Estimated effort:** 30 hours

---

## Phase 8B.4: SRS & AI Trace Validation (4 weeks)

**Goal:** Implement spaced repetition, validate handwriting with AI, adjust difficulty.

### Spaced Repetition System (SRS)

- **Review scheduling:** 1 day, 3 days, 1 week, 2 weeks, 1 month intervals
- **Difficulty levels:** Easy (2x faster reviews) / Medium / Hard (2x slower reviews)
- **Readiness checks:** 80%+ accuracy required to advance
- **Dashboard shows:** Next review date, % accuracy, current interval

### AI Trace Validation

**Two approaches (pick one):**

**Option A: TensorFlow.js (browser-based)**
- Pre-trained model for Gujarati letter recognition
- Works offline
- Model size: ~5-10 MB
- Accuracy: 85-92%

**Option B: Python backend (server-based)**
- Custom CNN trained on 500+ traced samples
- Higher accuracy (92-98%)
- Requires server power
- Latency ~200ms per trace

### Difficulty Adaptation

- **Easy:** Larger guide letter, thicker strokes required, 5 traces to unlock
- **Medium:** Standard (current system)
- **Hard:** Faded guide, precise strokes, 15 traces to unlock

### Content Recommendations

- **Smart suggestions:** "You're 82% accurate on ક — try these related letters"
- **Weakness detection:** Identify letters with <70% accuracy
- **Challenge mode:** Random letters daily, build streak

### Deliverables

- Spaced Repetition backend (DB + API)
- AI trace validation model (TF.js or Python)
- Difficulty level selection UI
- Review scheduling dashboard
- Weakness reporting

**Estimated effort:** 35 hours

---

## Phase 8B.5: Parent Dashboard & Analytics (3 weeks)

**Goal:** Give parents insight into learning progress, set goals, track engagement.

### Dashboard Components

- **Daily stats** — Minutes spent, lessons completed, accuracy trend
- **Weekly report** — Comparison to previous week, streak count
- **Weakness report** — Items <70% accuracy (show 5 weakest items)
- **Goal setting** — Parent sets daily/weekly minutes target, completion goal
- **Email digest** — Weekly summary sent to parent email

### Visualizations

- **Accuracy chart** — Line graph over 4 weeks (accuracy %)
- **Time spent chart** — Bar chart (min per day)
- **Phase progress** — Progress bar per phase (% complete)
- **Lesson heatmap** — Which lessons are hardest (color coded)

### Notifications

- **Daily push** — "Krish spent 15 min on Gujarati today"
- **Weekly email** — Full summary with charts
- **Alert on weakness** — When accuracy drops below 60%

### Reporting

- **PDF export** — Monthly report to print or share with tutor
- **JSON export** — Raw data for external analysis
- **Photo capture** — Screenshot of dashboard for sharing

### Technical Stack

- **Frontend:** React charts (Recharts or Chart.js)
- **Backend:** Analytics API endpoints
- **Email:** SMTP via Gmail or SendGrid
- **Reporting:** ReportLab (Python) or PDFKit (Node.js)

### Deliverables

- Parent dashboard (full-page view)
- Analytics APIs
- Email digest automation
- PDF/JSON export
- Goal management system

**Estimated effort:** 22 hours

---

## Phase 8B.6: Karishma's Toddler Module (3 weeks)

**Goal:** Build age-appropriate learning for 3-year-old, engagement-focused (no accuracy scoring).

### Karishma Module Contents

**Sounds & Phonetics (23 items)**
- Consonant sounds with example words
- Tap sound → hear pronunciation

**Colors (15 items)**
- Color name + object (e.g., "લાલ" + apple image)
- Tap color → hear name
- Match-the-color game

**Numbers 1-10 (10 items)**
- Visual dots + number
- Tap → hear count in Gujarati
- Simple counting game

**Animals (10 items)**
- Animal image + name
- Tap → hear animal sound + name
- "Spot the animal" game

**Objects/Household (10 items)**
- Common objects (spoon, cup, book)
- Tap → hear name
- "Find the object" game

**Nursery Rhymes (3-5)**
- Gujarati lullabies
- Animated illustrations
- Auto-play with music

### Design Principles

- **Bright colors** — Rainbow palette
- **Large tap targets** — 120px minimum
- **No text** — Icons and audio only
- **Sounds first** — Tap to hear, not read
- **Gamification** — Stars, celebrations, no failure states
- **Parent controls** — Mute option, session limits

### No Scoring/Accuracy

- No right/wrong answers
- Stars for participation (every tap = star)
- Celebration animations (confetti, applause)
- Progress shown as "5/10 colors explored" (not %)

### Deliverables

- Toddler module HTML app
- Gujarati TTS audio for 58 items
- 5 games (sounds, colors, numbers, animals, objects)
- 5 nursery rhymes with animations
- Parent controls panel
- Parental lock (PIN to exit app)

**Estimated effort:** 20 hours

---

## Phase 8B.7: Polish, Launch & Optimization (2 weeks)

**Goal:** Production-ready, optimized, beautiful, fully tested.

### Polish

- **Dark mode toggle** — System preference or manual toggle
- **Accessibility** — WCAG AA compliance, keyboard nav
- **Responsive design** — iPad, Android tablets, phones
- **Animations** — Smooth transitions, celebratory animations
- **Sound design** — UI sounds (success, error, chime)

### Gamification

- **Daily challenges** — "Trace 5 new letters today" → star
- **Achievement badges** — "Alphabet Master", "Quiz Genius", "Streak King"
- **Certificates** — Downloadable PDF per phase completed
- **Leaderboard** (optional) — Weekly accuracy ranking

### Performance

- **Asset optimization** — Minify CSS/JS, compress images
- **Code splitting** — Load modules lazily
- **Caching strategy** — Service Worker + HTTP cache
- **Database indexing** — Fast queries on large datasets
- **Load testing** — Simulate 100 concurrent users

### Testing

- **Unit tests** — 80%+ code coverage
- **Integration tests** — Full learning flow
- **E2E tests** — Trace mode accuracy, quiz submission
- **Accessibility audit** — Screen reader compatibility
- **Performance audit** — Lighthouse >90

### Deployment

- **Docker image** — Package everything for mini PC
- **One-click setup** — Run script, everything starts
- **Backup system** — Automated daily progress backups
- **Update mechanism** — Pull updates from GitHub

### Deliverables

- Production-ready dashboard
- Dark mode implementation
- Badge/certificate system
- Full test suite (unit + integration + E2E)
- Docker production image
- Deployment documentation

**Estimated effort:** 18 hours

---

## Timeline Summary

| Phase | Duration | Status | Start Date (est.) | End Date (est.) |
|-------|----------|--------|-------------------|-----------------|
| 8B.1 | 2 weeks | Not started | June 2026 | Mid-June 2026 |
| 8B.2 | 3 weeks | Not started | Mid-June 2026 | Early July 2026 |
| 8B.3 | 4 weeks | Not started | Early July 2026 | Early August 2026 |
| 8B.4 | 4 weeks | Not started | Early August 2026 | Early September 2026 |
| 8B.5 | 3 weeks | Not started | Early September 2026 | Late September 2026 |
| 8B.6 | 3 weeks | Not started | Late September 2026 | Mid-October 2026 |
| 8B.7 | 2 weeks | Not started | Mid-October 2026 | Late October 2026 |
| **Total** | **16 weeks** | — | June 2026 | **Late October 2026** |

---

## Resource Estimates

- **Developer time:** 165 hours total (5-6 hours/week)
- **Testing time:** 30 hours (professional QA or user testing)
- **Documentation:** 10 hours
- **Contingency (20%):** 40 hours
- **Total:** ~245 hours (60 days at 4 hours/day)

---

## Success Criteria

### By Phase 8B.1
- ✅ Parents can log in securely
- ✅ Kids view doesn't show adult content

### By Phase 8B.2
- ✅ All 158 lessons have audio
- ✅ Pronunciation is clear and accurate
- ✅ Mobile audio player works on phones

### By Phase 8B.3
- ✅ All APIs return <200ms response time
- ✅ Offline mode syncs correctly on reconnect
- ✅ 500+ concurrent API calls handled

### By Phase 8B.4
- ✅ SRS scheduling works (intervals accurate)
- ✅ AI validation >85% accuracy
- ✅ Difficulty levels feel balanced

### By Phase 8B.5
- ✅ Parent sees accurate progress data
- ✅ Email digest arrives weekly on time
- ✅ Dashboard loads in <2 seconds

### By Phase 8B.6
- ✅ Karishma engages 5+ min/session
- ✅ No crashes or errors on toddler interactions
- ✅ Parental lock works

### By Phase 8B.7
- ✅ No known bugs at launch
- ✅ Lighthouse score >90
- ✅ All tests passing (>80% coverage)
- ✅ Deploy to mini PC in <5 minutes

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI model accuracy <85% | High | Start with TF.js, upgrade to server-based if needed |
| Email delivery unreliable | Medium | Test with multiple providers, add SMS backup |
| Performance degrades at scale | Medium | Load test weekly, cache aggressively |
| Gujarati audio quality poor | Medium | Test multiple TTS engines, get native speaker review |
| Scope creep | High | Strictly follow phase deliverables, defer "nice-to-have" |

---

## Notes

- **Karishma's school starts August 2026** — Phase 8B.1-3 must be done before
- **Summer break July-August** — Adjust timeline if unavailable
- **Bambu Lab integration** — Deferred to Phase 8C (not critical path)
- **Flexibility:** Phases can be re-ordered if priorities change

---

---

## Phase 8C: Family Hub Expansion (21-29 Weeks)

**Status:** Planning 📋

**Goal:** Expand dashboard with family engagement features, add smart home integrations, enhance learning experiences, and build companion mobile app.

---

### TIER 1: KRISH'S CORE FEATURES (5-8 weeks)

**1. Krish's Daily Tasks** (Unified Activity Board)
- Chores + Homework + Kung Fu Training + Gujarati Learning + Calendar Events + Weekly Habits + Daily Mood Tracking
- Collapsed view (summary) / Expanded view (details)
- **Effort:** 3-4 weeks

**2. Habit Tracker** (in Daily Tasks)
- Weekly habits: Meditate (5/7), Pull-ups (5/7), Water intake (5/7)
- Streaks, badges, progress tracking
- **Effort:** 1-2 weeks

**3. Trivia Section** (in Daily Tasks)
- 16 categories (Science, History, Space, Animals, Gujarati Culture, Mythology, Sports, Math, etc.)
- Daily question + explanation
- Streak calculator
- **Effort:** 1 week

**4. Reading Challenges** (in Daily Tasks)
- Daily: 20 min | Weekly: 100 min
- Manual logging + quick-tap checkmark
- 10+ reading topics (customizable via parent app)
- **Effort:** 1-2 weeks

---

### TIER 2: FAMILY FEATURES (4-5 weeks)

**5. Family Announcements** (Dashboard Card)
- Time & day-based messages (weekday vs weekend)
- Custom parent messages ("Great job!", "Movie night!")
- Status updates ("Dad's Working Late")
- Auto-clear + manual dismiss
- Color-coded by type
- **Effort:** 1-2 weeks

**6. Parent Mobile App** (Companion App - MVP)
- Post announcements to family hub
- Upload photos to local folder (from phone or Google Photos)
- Future: Calendar management, progress tracking, thermostat control
- **Effort:** 2-3 weeks

**7. Photo Carousel** (Dashboard Card)
- Auto-rotating family photos from local mini PC folder
- Photo upload via Parent Mobile App
- Curated family photos only
- **Effort:** 3-5 days

**8. Birthday Countdown** (Dashboard Card)
- Separate card with collapsed/expanded views
- <1 month away: always expanded/prominent
- Countdown + age turning
- Celebration announcements (Anand, Priya, Krish, Karishma, Jaya, Raju)
- Gift ideas (parent console only)
- Extensible via parent app
- **Effort:** 3-5 days

**9. Moon Phase & Hindu Astrology** (Dashboard Card)
- Current moon phase + 30-day festival calendar
- Collapsed/expanded views
- Dismissible/markable festivals
- Daily astronomy facts
- Tithi/Nakshatra details (expandable)
- **Effort:** 1-2 weeks

---

### TIER 3: HOME & UTILITIES (4-5 weeks)

**10. Home Status Card** (Enhanced Dashboard)
- Real-time display: Solar production, energy usage, temperature/humidity, water usage, WiFi signal, porch light status, Rachio sprinkler, HVAC filter days
- Icons + tap-to-expand
- Alerts if <2 weeks to due date
- **Effort:** 2-3 weeks

**11. Maintenance Reminder Cards** (3 separate cards)
- Water heater cleaning (January, yearly)
- Mattress turning (every 6 months)
- Dryer ducts cleaning (January, yearly)
- Same pattern as HVAC filter card
- **Effort:** 3-5 days each

**12. Weather Alerts** (Enhanced Weather Card)
- 10 alert types: Snow days, thunderstorms, hail, air quality, extreme cold (<10°F), extreme heat (>100°F), frost/freeze, flood/flash flood, pollen count, UV index
- Year-round display
- School-aware timing
- Separate weather card (not merged with announcements)
- **Effort:** 1-2 weeks

---

### TIER 4: SCHOOL & NAVIGATION (2-3 weeks)

**13. Traffic/Commute Summary** (Enhance Transit Card)
- Green/yellow/red traffic status
- Color thresholds: Green <15 min, Yellow 15-25 min, Red >25 min
- "Leave early!" alert when heavy traffic
- Display: 6:30-7:30 AM (morning), 2:15-3:00 PM (afternoon)
- **Effort:** 3-5 days

**14. Activity Finder** (Dashboard Card)
- Local search (15 min radius)
- Travel search (city/zipcode input)
- 6+ data sources: Google Maps, local parks, Eventbrite, movie theaters, rec centers, city sites
- All activity types: Parks, playgrounds, pools, restaurants, movies, museums, sports, events
- Filters: kid-friendly, price, ratings
- Krish can highlight favorites + dismiss activities
- **Effort:** 2-3 weeks

---

### TIER 5: KARISHMA'S MODULE (3-4 weeks)

**15. Karishma's Expanded Features** (Toddler Module - Comprehensive)
- 4 interactive game types: Story time, shape/form learning, sing-along nursery rhymes, matching games
- 9 content categories: Sounds (23), Colors (15), Numbers (10), Animals (10), Objects (10), Nursery rhymes (10+), Seasons, Family members, Food/vegetables
- Bilingual: Gujarati + English
- Text + Audio for all content
- Achievement badges, daily activity suggestions, time-limited sessions (auto-stop after 15 min)
- Parental lock (PIN to exit)
- **Effort:** 3-4 weeks

---

### TIER 6: SYSTEM FEATURES (2 weeks)

**16. Spotify Profile Selector** (in Krish's Tasks)
- Open Krish's profile by default
- PIN-protected access to Anand's profile
- **Effort:** 1 week

**17. Phone Shortcuts** (in Family Announcements)
- Call family using existing phone number
- VoIP setup on mini PC
- **Effort:** 1 week

**18. Google/Nest Integration** (Dashboard)
- Doorbell + camera (live view + recording/clips)
- Motion detection (small pop-up alert)
- Nest thermostat control (view temp, set heating/cooling)
- Google Mini speaker integration (announcement routing)
- Thermostat on Home Status card
- **Effort:** 1-2 weeks

---

### DEFERRED/FUTURE

**19. Guest Mode** (Simplified View)
- For when guests visit
- Hides family privacy content
- Define specifics later once features built
- **Effort:** 1-2 weeks

**20. Screen Time Tracking** (Separate Card)
- Device & streaming profile monitoring via Xfinity router
- Track Netflix, Paramount, Hulu, Disney+ usage
- **Effort:** 2-3 weeks

---

## Timeline & Prioritization

| Tier | Features | Duration | Status |
|------|----------|----------|--------|
| 1: Krish Core | 4 features | 5-8 weeks | 🎯 Start here |
| 2: Family | 5 features | 4-5 weeks | 🎯 Parallel |
| 3: Home & Utilities | 3 features | 4-5 weeks | 🎯 Parallel |
| 4: School & Navigation | 2 features | 2-3 weeks | 🎯 Parallel |
| 5: Karishma Module | 1 feature | 3-4 weeks | 🎯 High priority |
| 6: System | 3 features | 2 weeks | After Tiers 1-4 |
| Future | 2 features | 3-5 weeks | Phase 8C+ |
| **TOTAL** | **20 features** | **21-29 weeks** | — |

---

## Success Criteria

### By End of Phase 8C
- ✅ Krish's Daily Tasks fully functional (all 4 features)
- ✅ Family announcements system working
- ✅ Parent mobile app MVP (announcement + photo upload)
- ✅ Home Status card displaying correctly
- ✅ All integrations connected (Nest, Google, Rachio, Tesla, Met.no)
- ✅ Karishma's toddler module engaging and bug-free
- ✅ Dashboard loads in <2 seconds with all features
- ✅ No critical bugs at launch

---

## Dependencies & Prerequisites

- **Phase 8B must be complete** — Parent auth & session management needed
- **Hardware:** Mini PC + Touchscreen (from hardware setup)
- **Integrations:** Tesla API, Rachio API, Google Calendar, Nest API access
- **Third-party APIs:** Open Trivia Database, lunar calendar, Eventbrite, etc.

---

## Notes

- **Parallel building:** Tiers 1-4 can be built simultaneously
- **Karishma's school:** Primrose starts August 2026 — plan Karishma features accordingly
- **Flexibility:** Phases can shift based on priorities or discoveries
- **Guest Mode & Screen Time:** Define specifics once core features are built

---

## Next: After Phase 8C

Potential Phase 8D+ features:
- Nest camera self-hosting alternatives (Wyze, Reolink, Frigate)
- Advanced Gujarati proficiency levels (CEFR A1/A2)
- Voice recording & playback (record own pronunciation)
- Live tutor integration (video call with native speaker)
- Community challenges (compare with other learners)
- School grades & homework integration
- Medical wiki / family health tracking

---

For detailed progress: See [`session-log.md`](./session-log.md)
