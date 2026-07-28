# 🏠 Family Hub — An AI-Powered Smart Home for Families

A complete, self-hosted smart home dashboard and learning platform for families using Home Assistant. Control your home, manage chores, plan meals, and learn new languages — all from a touchscreen mounted on your wall.

**Status:** Phase 1 In Progress (Building with Node.js + React) | Phase 2 Planned (Activity Board) | Phase 3 Planned (Flutter Mobile)

---

## ✨ Phase 1: Core Features (In Progress)

### 📱 Smart Home Dashboard (React + Node.js)
- **Device control** — Lights, locks, climate, switches with real-time status
- **SmartThings integration** — Direct API integration with your SmartThings hub
- **Device status** — Real-time device state and responsiveness
- **Quick actions** — One-tap controls for frequently used devices
- **Error handling** — Graceful handling of offline devices

### 👦 Gujarati Learning Module (158 Lessons)
- **Learn** — Interactive lessons covering alphabet, numbers, vocabulary
- **Quiz** — Answer questions with instant feedback and scoring
- **Trace** — Guided writing practice with stroke-by-stroke instruction
- **Progress tracking** — Track completion, points, and achievements

### 📝 Chore System & Points
- **Daily chores** — Morning, afternoon, evening tasks
- **Auto-completion** — Mark chores done, points awarded instantly
- **Auto-reset** — Chores reset daily at 6 AM
- **Points tracking** — Daily/weekly/monthly totals
- **Leaderboards** — Competition between family members

---

## 🚀 Quick Start

### For Families Building Their Own Hub

1. **Clone this repo** — `git clone https://github.com/thenarsais/Family-Hub`
2. **Read the setup guide** — See `/docs/getting-started.md`
3. **Choose your hardware** — See `/docs/hardware-setup.md`
4. **Install software** — Follow `/docs/software-setup.md`
5. **Customize for your family** — Adapt integrations & automations

---

## 📚 Documentation

- [`getting-started.md`](/docs/getting-started.md) — Complete setup walkthrough
- [`hardware-setup.md`](/docs/hardware-setup.md) — Hardware options & installation
- [`software-setup.md`](/docs/software-setup.md) — Docker, Home Assistant, integrations
- [`features.md`](/docs/features.md) — Complete feature list with status
- [`roadmap.md`](/docs/roadmap.md) — Phase 8B expansion plan
- [`session-log.md`](/docs/session-log.md) — Build progression (7 sessions)

---

## 🛠️ Tech Stack

| Component | Purpose | Status |
|-----------|---------|--------|
| Node.js + Express | Backend API server | 🚧 Building |
| React 18 | Frontend dashboard | 🚧 Building |
| PostgreSQL | Database | 🚧 Setting up |
| TypeScript | Type-safe code | ✅ Configured |
| Docker | Containerization | ✅ Ready |
| SmartThings API | Smart home integration | ✅ Connected |
| Jest | Testing framework | ✅ Ready |

---

## 📊 Project Phases

**Phase 1: Core Platform** 🚧 In Progress
- 🚧 Smart Home Dashboard (React + Node.js)
- 🚧 Gujarati Learning Module (158 lessons)
- 🚧 Chore System with Points & Tracking
- **Timeline:** 4 weeks
- **Status:** Foundation & Database (Week 1-2)

**Phase 2: Activity Board & Enhancement** 📋 Planned
- 📋 Interactive Trivia System (400+ questions, multiplayer)
- 📋 Daily Habits Tracker (Streaks, achievements)
- 📋 Mood/Emotion Journal (Daily tracking)
- 📋 Reading Tracker (Book management, goals)
- 📋 Parent Portal Dashboard
- 📋 Enhanced Points & Leaderboard
- **Timeline:** 20 weeks
- **Status:** Design complete

**Phase 3: Mobile Apps** 📋 Planned (Future)
- 📋 Flutter iOS/Android native apps
- 📋 Flutter Web app (replaces React)
- 📋 Reuse Phase 1-2 Node.js backend
- **Timeline:** 8-12 weeks
- **Status:** Planned

---

## 🎯 For Friends Forking This Project

This repo is designed to be **customized for your family**:
1. Replace language modules (Gujarati → your language)
2. Modify chores to match your family
3. Adjust automations for your timezone/location
4. Add integrations for your smart devices

See [`docs/customize.md`](/docs/customize.md) for guides.

---

## 📈 Build Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Core Platform | 4 weeks | 🚧 In Progress |
| Phase 2: Activity Board | 20 weeks | 📋 Planned |
| Phase 3: Mobile Apps | 8-12 weeks | 📋 Planned |
| **Total Estimated** | **~32-36 weeks** | — |

**Architecture Notes:**
- Phase 1: Clean Node.js + React foundation (no throwaway code)
- Phase 2: Built on Phase 1 backend (100% code reuse)
- Phase 3: Reuses Phase 1-2 backend (single backend for all platforms)

---

## 📞 Questions?

- Setup help → See [`getting-started.md`](/docs/getting-started.md)
- Troubleshooting → See [`known-issues.md`](/docs/known-issues.md)
- Integration guides → Check [`/docs/integrations/`](/docs/integrations/)

---

**Built by:** Priya Narsai & Family 🏠
**Last Updated:** July 27, 2026 (Architecture Finalized - Node.js + React Approach)
**Status:** Phase 1 Building | Clean Architecture | Single Tech Stack
