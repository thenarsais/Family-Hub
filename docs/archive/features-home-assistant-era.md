# Family Hub — Complete Feature List

Status key: ✅ Complete | 🚧 In Progress | 📋 Planned | 💡 Suggested

---

## Dashboard Features

### Core Dashboard (✅ Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| Clock + Weather Card | ✅ | 12hr time, 5-day forecast, animated icons, local + world weather |
| Family Calendar | ✅ | Google Calendar sync, school calendar, event management |
| Shopping List | ✅ | Shared list, barcode scanning (mobile app) |
| Meal Planner | ✅ | Custom drag-and-drop app, Mealie integration |
| Family Announcement Banner | ✅ | Dynamic messages, school countdown, weather alerts |
| Night Mode | ✅ | Auto-activate 9 PM - 6 AM, distraction-free display |

### Chore System (✅ Complete for Krish)

| Feature | Status | Notes |
|---------|--------|-------|
| Morning Chores (6 AM - 9 AM) | ✅ | 6 tasks: bed, dressed, teeth, lunchbag, backpack, dishes |
| Afternoon Chores (3 PM - 5 PM) | ✅ | 6 tasks: backpack, lunchbox, workbook, reading, papers, household |
| Evening Chores (5 PM - 9 PM) | ✅ | 8 tasks: cultural, water, shoes, shoes, practice, coats, clothes, shower |
| Daily Points (1-100) | ✅ | Resets 6 AM daily |
| Monthly Points (0-400) | ✅ | Resets 1st of month, tiered rewards |
| Tiered Rewards | ✅ | 🥉 200pts | 🥈 300pts | 🥇 400pts |
| Karishma Chore System | 📋 | To be built |

### School & Transit (✅ Complete)

| Feature | Status | Details |
|---------|--------|---------|
| Real-time Drive Times | ✅ | Waze integration, avoids tolls & I-25 |
| Morning Leave Time | ✅ | Calculated: 7:45 AM arrival - travel time - 5 min buffer |
| Afternoon Pickup | ✅ | Leave 2:30 PM, pickup 3:15 PM |
| Transit Card | ✅ | Hidden on no-school days & outside 6 AM - 3:30 PM |
| School Countdown | ✅ | Dynamic in announcement banner |
| Karishma Transit | 📋 | TBA when school starts August 2026 |

### Automations & Alerts (✅ Complete)

| Feature | Status | Trigger |
|---------|--------|---------|
| Car Start Reminder | ✅ | 3-8 AM when temp below 40°F |
| HVAC Filter Reminder | ✅ | 90-day cycle countdown, overdue warning |
| Trash & Recycling | ✅ | Weekly pickup reminders (7 AM & 6 PM) |
| Cold Weather Alert | ✅ | Dynamic banner message when temp drops |
| Night Mode On/Off | ✅ | 9 PM / 6 AM |

---

## Learning Module — Gujarati (MVP ✅ Complete, Phase 8B 📋 Planned)

### Learn Mode (✅ Complete)
- Browse lessons by phase
- Phase 1: Alphabet (48 lessons)
- Phase 2: Numbers (30 lessons)
- Phase 3: Vocabulary (80 lessons)
- Romanization, pronunciation, English translation
- Progress tracking per phase

### Quiz Mode (✅ Complete)
- Multiple choice questions
- Instant feedback (correct/incorrect)
- Show correct answer if wrong
- Points awarded based on accuracy
- Quiz score tracking

### Trace Mode (✅ Complete)
- Guided letter tracing on canvas
- Faded guide letter visible
- 10 traces required per letter before moving on
- Stroke counting
- Clear & practice again functionality
- Simple feedback (good/keep practicing)

### Phase 8B Expansion (📋 Planned, 16+ weeks)

**Phase 8B.2: Audio & Content**
- Open-source Gujarati TTS integration
- Example sentences for each word
- Cultural notes (greetings, holidays, significance)
- Mobile-optimized audio

**Phase 8B.3: Backend Infrastructure**
- Node.js + PostgreSQL on mini PC
- 20+ API endpoints
- Progress cloud sync
- Offline capability (LocalStorage fallback)

**Phase 8B.4: SRS & Difficulty Levels**
- Spaced Repetition System (SRS)
- Review scheduling (1 day, 3 days, 1 week, 2 weeks, 1 month)
- Difficulty levels (Easy/Medium/Hard) based on accuracy
- AI trace validation (TensorFlow.js or Python backend)
- Readiness checks (80%+ accuracy to advance)

**Phase 8B.5: Parent Dashboard**
- Daily/weekly statistics (minutes, accuracy, streaks)
- Weakness reports (items <70% accuracy)
- Goal setting (parent can set targets)
- Email/push notifications
- PDF/JSON export

**Phase 8B.6: Karishma Toddler Module (Age 3)**
- Sounds & Phonetics (23 items)
- Colors (15 with objects)
- Numbers 1-10 (visual + audio)
- Animals (10 with sounds)
- Objects/Household (10 items)
- Nursery rhymes (3-5 songs)
- No accuracy scoring, engagement only

**Phase 8B.7: Polish & Launch**
- Dark mode toggle
- Daily challenges & badges
- Certificates per phase
- End-to-end testing
- Performance optimization
- Deploy to mini PC

---

## Shopping & Meals (✅ Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Weekly Meal Planning | ✅ | Drag-and-drop, breakfast/lunch/dinner |
| Recipe Database | ✅ | 500+ recipes via Mealie |
| Custom Recipes | ✅ | Manual entry in Mealie |
| Shared Shopping List | ✅ | Phone app barcode scanning |
| Meal→ Shopping List | 📋 | Upcoming (requires recipe ingredients) |
| Import from URL | 📋 | Mealie supports this |
| 7-day Rolling View | 📋 | Replace month view on dashboard |

---

## Home Integration & Monitoring (🚧 In Progress)

### Trash & Recycling (✅ Complete)
- ReCollect integration
- Weekly pickup schedule
- Bin type tracking
- Night before reminder (7 AM)
- Bring bins in reminder (6 PM)
- Thornton City Events calendar

### Calendar (✅ Complete)
- Google Calendar (main)
- Google Birthdays
- Prospect Ridge Academy (iCal)
- ReCollect (trash/recycling)
- Thornton City Events

### Weather (✅ Complete)
- Met.no (primary)
- OpenWeatherMap (backup)
- Local (Thornton, CO)
- Multi-city (Cleveland, Vadodara)
- 5-day forecast

### Integrations (🚧 Connecting)
- Mealie (meal planning) — ✅ Complete
- Google Calendar — ✅ Complete
- Waze (travel times) — ✅ Complete
- ReCollect (trash) — ✅ Complete
- Met.no (weather) — ✅ Complete

### Coming Soon (📋 Planned)
- Bambu Lab 3D printer integration
- Nest cameras & doorbell
- Tesla solar monitoring
- Phone battery alerts
- Laundry monitoring (requires smart plugs)
- Voice wake word (Wyoming + Piper)

---

## Suggested Features (💡 Not Yet Committed)

| Feature | Why | Effort |
|---------|-----|--------|
| Voice wake word | Hands-free control | Medium |
| Homework timer | Pomodoro focus sessions | Low |
| Nearby gas prices | Cost tracking | Low |
| Auto-sleep mode | Screen on/off detection | Medium |
| Doorbell pop-up | Camera feed full-screen | Medium |
| Recipe photo upload | Visual cooking guides | Low |

---

## By the Numbers

**Dashboard Cards:** 12+ active  
**Chores:** 20 for Krish, 0 for Karishma (planned)  
**Integrations:** 8 connected  
**Automations:** 15+ active  
**Learning Module:** 158 lessons ready  
**Recipes:** 6+ added, unlimited available  

---

## Phase 8C Expansion (21-29 Weeks) — 📋 Planned

### Krish's Core Features

| Feature | Status | Details |
|---------|--------|---------|
| Krish's Daily Tasks | 📋 | Unified board: Chores + Homework + Kung Fu + Gujarati + Calendar + Habits + Mood |
| Habit Tracker | 📋 | Weekly habits: Meditate, Pull-ups, Water intake (5/7 days each) with streaks |
| Trivia Section | 📋 | 16 categories, daily question, streak tracker, 1-click or unlimited replay |
| Reading Challenges | 📋 | Daily 20 min, weekly 100 min, 10+ topics, manual logging |

### Family Features

| Feature | Status | Details |
|---------|--------|---------|
| Family Announcements | 📋 | Time & day-based messages, custom posts, status updates, dismissible |
| Parent Mobile App | 📋 | MVP: Post announcements + upload photos; future: calendar, tracking |
| Photo Carousel | 📋 | Auto-rotating family photos, local folder, photo upload via app |
| Birthday Countdown | 📋 | Collapsed/expanded cards, age turning, celebration announcements for 6 family members |
| Moon Phase & Hindu Astrology | 📋 | Current moon + 30-day festivals, astronomy facts, Tithi/Nakshatra details |

### Home & Utilities

| Feature | Status | Details |
|---------|--------|---------|
| Home Status Card | 📋 | Solar, energy, temp/humidity, water, WiFi, lights, sprinklers, HVAC filter |
| Maintenance Reminders | 📋 | Water heater (Jan), Mattress (6mo), Dryer ducts (Jan) |
| Weather Alerts | 📋 | 10 alert types: snow, storms, air quality, extreme temps, frost, flood, pollen, UV |

### School & Navigation

| Feature | Status | Details |
|---------|--------|---------|
| Traffic Summary | 📋 | Green/yellow/red status on transit card, "leave early" alerts |
| Activity Finder | 📋 | Local (15 min) + travel search, 6+ sources, filters, highlight/dismiss |

### Karishma's Module

| Feature | Status | Details |
|---------|--------|---------|
| Karishma's Expanded Features | 📋 | 4 games, 9 content categories, bilingual, badges, time limits, parental lock |

### System Features

| Feature | Status | Details |
|---------|--------|---------|
| Spotify Profile Selector | 📋 | Krish default, PIN for Anand's profile |
| Phone Shortcuts | 📋 | Call family from existing phone number |
| Google/Nest Integration | 📋 | Doorbell + camera (live + clips), thermostat, speaker integration |

### Future/Deferred

| Feature | Status | Notes |
|---------|--------|-------|
| Guest Mode | 💡 | Simplified view for visitors (define later) |
| Screen Time Tracking | 💡 | Device & streaming monitoring via Xfinity (research needed) |
| Nest Self-Hosting | 💡 | Wyze, Reolink, Frigate alternatives (Phase 8D+) |

---

## Roadmap Timeline

| Phase | Duration | Status | Focus |
|-------|----------|--------|-------|
| MVP (Sessions 1-7) | 2-3 weeks | ✅ Complete | Core hub, chores, learning |
| 8B.1+ | 2 weeks | 🚧 In Progress | Parent auth, session management |
| 8B.2-7 | 14-18 weeks | 📋 Planned | Audio, SRS, analytics, toddler module |
| **8C** | **21-29 weeks** | **📋 Planned** | **Family features, home integrations, Karishma expansion** |

---

## Feature Stability

All ✅ marked features are production-ready and tested.  
🚧 features are functional but may see improvements.  
📋 features are designed but not yet built.  
💡 features are nice-to-have ideas.

---

For detailed roadmap: See [`roadmap.md`](./roadmap.md)  
For session-by-session progress: See [`session-log.md`](./session-log.md)
