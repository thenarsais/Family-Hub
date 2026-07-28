# Phase 8C Sprint Plan

**Total Features:** 20 (18 active + 2 deferred)  
**Total Duration:** 28 weeks (14 × 2-week sprints)  
**Team:** 2 people working in parallel (Person A: frontend/UI · Person B: backend/integrations)  
**Sprint Velocity:** ~20–22 hours per sprint (2 people × 5–6 hrs/week)  
**Phase Start:** June 2026  
**Phase End:** Late November 2026  

---

## Critical Constraint

> **Karishma starts Primrose — August 2026.**  
> Feature #15 (Karishma's Expanded Module) must ship by end of Sprint 3 (end of July).  
> This overrides normal tier ordering. Karishma runs in Sprints 1–3 as top priority.

---

## Pre-Sprint: Setup Week (Week 0)

**Goal:** Unblock everything before Sprint 1 begins.

| Task | Owner | Notes |
|---|---|---|
| Confirm Phase 8B.1 (parent auth) complete | Both | Blocks #6, #16, #19 |
| Confirm Phase 8B.3 (backend API) complete | Both | Blocks #6 |
| Acquire API keys: Google Maps, Eventbrite, Open Trivia, Lunar | Person B | Blocks #3, #9, #14 |
| Acquire Nest API access | Person B | Blocks #18 |
| Acquire Rachio API credentials | Person B | Blocks #10 |
| Verify mini PC + touchscreen operational | Both | Blocks all |
| Set up shared dev branch `phase-8c` | Person A | |
| Architecture decision: Daily Tasks data model | Both | Blocks #1–#4 |

---

## Sprint 1 — Weeks 1–2 | Karishma Foundation + Quick Wins

**Sprint Goal:** Start Karishma module (Primrose deadline); ship 3 small dashboard cards.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #15 Karishma — architecture + content DB | A | Data model, audio pipeline, category structure, skeleton UI | 10h |
| #7 Photo Carousel | B | Folder watcher, auto-rotate logic, HA card integration | 5h |
| #8 Birthday Countdown | B | Days-remaining calc, collapsed/expanded card, <30-day prominence | 4h |
| #13 Traffic/Commute colors | B | Color thresholds on existing Waze card (green/yellow/red) | 3h |

**Sprint Deliverables:**
- Photo Carousel live on dashboard ✅
- Birthday Countdown card live ✅
- Traffic card shows color-coded status ✅
- Karishma skeleton committed to `phase-8c` branch

---

## Sprint 2 — Weeks 3–4 | Karishma Games + Daily Tasks Foundation

**Sprint Goal:** Build all 4 Karishma game types; lay Daily Tasks scaffold.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #15 Karishma — 4 game types | A | Story time, shape/form, sing-along, matching game engines | 12h |
| #1 Daily Tasks — scaffold | B | Component architecture, collapsed/expanded views, chores + homework integration | 10h |

**Sprint Deliverables:**
- All 4 Karishma game engines playable (no full content yet)
- Daily Tasks card on dashboard — chores & homework sections visible

---

## Sprint 3 — Weeks 5–6 | Karishma SHIP + Daily Tasks Core

**Sprint Goal:** Ship Karishma complete before Primrose; Daily Tasks 60% done.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #15 Karishma — all 9 content categories + ship | A | Content (sounds, colors, numbers, animals, objects, rhymes, seasons, family, food), bilingual audio, badges, parental lock, session timer | 12h |
| #1 Daily Tasks — Kung Fu + Gujarati + Calendar | B | Kung Fu training section, Gujarati learning integration, calendar events pull, mood tracking widget | 10h |

**Sprint Deliverables:**
- 🚀 **Karishma module SHIPPED** — all content, games, audio, badges, parental lock
- Daily Tasks: chores, homework, Kung Fu, Gujarati, calendar, mood all visible

**Milestone: Karishma complete by end of July ✅**

---

## Sprint 4 — Weeks 7–8 | Maintenance Cards + Weather Alerts + Daily Tasks Polish

**Sprint Goal:** Ship 3 maintenance cards; weather alerts; close out Daily Tasks core.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #11 Maintenance Reminders (×3) | A | Water heater, mattress, dryer duct cards — HVAC pattern | 6h |
| #12 Weather Alerts | A | 10 alert types, school-aware timing, separate card | 6h |
| #1 Daily Tasks — weekly habits + polish | B | Weekly habits widget, collapsed summary view, responsive polish | 8h |

**Sprint Deliverables:**
- 3 maintenance cards live ✅
- Weather alerts card live ✅
- Daily Tasks feature-complete (ready for Habit/Trivia/Reading modules)

---

## Sprint 5 — Weeks 9–10 | Habit Tracker + Moon Phase + Family Announcements

**Sprint Goal:** Add Habit Tracker to Daily Tasks; ship Moon Phase and Family Announcements.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #2 Habit Tracker | A | Weekly habit widgets (3 habits), streak counter, badge system, progress rings | 10h |
| #9 Moon Phase & Hindu Astrology | B | Lunar API integration, 30-day festival calendar, tithi/nakshatra, collapsed/expanded | 8h |
| #5 Family Announcements — start | B | Time/day-based message engine, color-coded types | 4h |

**Sprint Deliverables:**
- Habit Tracker live inside Daily Tasks ✅
- Moon Phase card live ✅
- Announcements card foundation committed

---

## Sprint 6 — Weeks 11–12 | Trivia + Reading + Announcements + Home Status Start

**Sprint Goal:** Complete Tier 1 (all Daily Tasks modules); ship Announcements; start Home Status.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #3 Trivia Section | A | 16-category question DB, daily rotation, streak calc, explanation display | 8h |
| #4 Reading Challenges | A | Daily/weekly targets, manual log, quick-tap, 10 topic filters, parent-customizable | 6h |
| #5 Family Announcements — complete | B | Custom parent messages, auto-clear, manual dismiss, status updates | 4h |
| #10 Home Status Card — start | B | Card scaffold, temperature/humidity sensors, WiFi signal, HVAC filter days | 4h |

**Sprint Deliverables:**
- 🚀 **Tier 1 COMPLETE** — All Daily Tasks modules shipped (#1–#4) ✅
- Family Announcements live ✅
- Home Status card (partial sensors) live

**Milestone: Tier 1 + Tier 2 quick features done**

---

## Sprint 7 — Weeks 13–14 | Home Status + Activity Finder Start + Daily Tasks QA

**Sprint Goal:** Complete Home Status; start Activity Finder; full QA pass on Daily Tasks.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #10 Home Status Card — complete | A | Solar production, energy usage, water, Rachio sprinkler, porch light, alerts | 10h |
| #14 Activity Finder — architecture | B | API integrations (Google Maps, Eventbrite, local parks), search backend | 8h |
| QA: Daily Tasks + Announcements | Both | Bug fixes from dog-fooding sprints 1–6 | 4h |

**Sprint Deliverables:**
- Home Status card fully live ✅
- Activity Finder API backbone committed
- QA bug list resolved

---

## Sprint 8 — Weeks 15–16 | Activity Finder UI + Google/Nest Start

**Sprint Goal:** Ship Activity Finder UI; begin Nest integration.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #14 Activity Finder — UI + filters | A | Search UI, kid-friendly filters, price/rating filters, Krish favorites + dismiss | 10h |
| #18 Google/Nest Integration — start | B | Nest API auth, doorbell live view, camera clip display, motion detection alert | 10h |

**Sprint Deliverables:**
- Activity Finder UI live (MVP) ✅
- Nest doorbell + camera live view working

---

## Sprint 9 — Weeks 17–18 | Activity Finder Polish + Nest Complete + Parent App Start

**Sprint Goal:** Ship Activity Finder complete; finish Nest; start Parent Mobile App.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #14 Activity Finder — polish + additional sources | A | Movie theaters, rec centers, city sites; travel search; performance | 6h |
| #6 Parent Mobile App — architecture | A | React Native scaffold, auth flow, HA API connection | 6h |
| #18 Google/Nest — complete | B | Nest thermostat control, Google Mini speaker routing, Home Status thermostat tile | 8h |

**Sprint Deliverables:**
- 🚀 **Activity Finder SHIPPED** ✅
- 🚀 **Nest Integration SHIPPED** ✅
- Parent Mobile App scaffold committed

---

## Sprint 10 — Weeks 19–20 | Parent Mobile App + Spotify + Phone Shortcuts

**Sprint Goal:** Ship Parent Mobile App MVP; ship Spotify and Phone system features.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #6 Parent Mobile App — core | A | Post announcements, photo upload to mini PC, Google Photos import | 12h |
| #16 Spotify Profile Selector | B | Default Krish profile, PIN-protected Anand profile, HA integration | 6h |
| #17 Phone Shortcuts | B | VoIP setup on mini PC, quick-dial family card | 6h |

**Sprint Deliverables:**
- Parent Mobile App MVP live ✅
- Spotify profile selector live ✅
- Phone shortcuts card live ✅

---

## Sprint 11 — Weeks 21–22 | Parent App Polish + Photo Carousel Update + Guest Mode Start

**Sprint Goal:** Polish Parent App; update Photo Carousel to use app uploads; start Guest Mode.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #6 Parent Mobile App — polish | A | Offline queue, error handling, photo gallery picker, push notifications | 8h |
| #7 Photo Carousel — app integration | A | Connect carousel to app-uploaded photos folder | 4h |
| #19 Guest Mode — start | B | Identify which cards to hide, HA user role approach, PIN activation | 8h |

**Sprint Deliverables:**
- Parent Mobile App polished + Photo Carousel updated ✅
- Guest Mode foundation committed

---

## Sprint 12 — Weeks 23–24 | Guest Mode + Screen Time Tracking

**Sprint Goal:** Ship Guest Mode; build Screen Time Tracking.

| Feature | Person | Tasks | Est. Hours |
|---|---|---|---|
| #19 Guest Mode — complete | A | Card visibility rules, PIN flow, auto-timeout back to family view | 8h |
| #20 Screen Time Tracking | B | Xfinity router API/monitoring, Netflix/streaming profile parsing, display card | 10h |

**Sprint Deliverables:**
- Guest Mode live ✅
- Screen Time Tracking live ✅

---

## Sprint 13 — Weeks 25–26 | Full Integration QA + Performance

**Sprint Goal:** No new features. Full regression + performance pass.

| Activity | Both | Est. Hours |
|---|---|---|
| End-to-end integration testing (all 20 features) | Both | 10h |
| Performance audit (Lighthouse, load times) | Both | 4h |
| Mobile responsiveness (iPad, phone) | Both | 4h |
| Bug fix sprint (triage + resolve P0/P1) | Both | 6h |

**Sprint Deliverables:**
- All known bugs resolved
- Dashboard loads < 2s with all features
- No critical regressions

---

## Sprint 14 — Weeks 27–28 | Launch Prep + Deployment

**Sprint Goal:** Production-ready. Docs, deployment, handoff.

| Activity | Owner | Est. Hours |
|---|---|---|
| Docker image packaging (all Phase 8C additions) | B | 4h |
| One-click setup script update | B | 2h |
| docs/session-log.md update | A | 2h |
| docs/features.md update (all new features) | A | 2h |
| docs/roadmap.md Phase 8C → complete | A | 1h |
| User documentation / how-to for Parent App | A | 3h |
| Final smoke test on fresh install | Both | 4h |
| Phase 8D planning kickoff | Both | 2h |

**Sprint Deliverables:**
- 🚀 **Phase 8C LAUNCHED** — all 20 features in production
- Updated documentation set
- Phase 8D scope defined

---

## Timeline Summary

| Sprint | Weeks | Features Shipped | Milestone |
|---|---|---|---|
| Pre-Sprint | Week 0 | — | All APIs + hardware unblocked |
| Sprint 1 | 1–2 | #7, #8, #13 (partial) | Quick wins live |
| Sprint 2 | 3–4 | — | Karishma games + Daily Tasks scaffold |
| Sprint 3 | 5–6 | **#15 Karishma** | 🎓 Karishma ships before Primrose |
| Sprint 4 | 7–8 | #11, #12 | Maintenance + weather live |
| Sprint 5 | 9–10 | #2, #9 | Habit tracker + Moon Phase |
| Sprint 6 | 11–12 | #3, #4, #5 | **Tier 1 complete** |
| Sprint 7 | 13–14 | #10 | Home Status live |
| Sprint 8 | 15–16 | — | Activity Finder UI + Nest started |
| Sprint 9 | 17–18 | **#14, #18** | Activity Finder + Nest ship |
| Sprint 10 | 19–20 | **#6, #16, #17** | Parent App + System features |
| Sprint 11 | 21–22 | — | Parent App polish + Guest start |
| Sprint 12 | 23–24 | #19, #20 | All deferred features ship |
| Sprint 13 | 25–26 | — | Full QA pass |
| Sprint 14 | 27–28 | — | 🚀 **Phase 8C Launch** |

---

## Resource Allocation Summary

| Person | Focus Area | Features |
|---|---|---|
| **Person A** | Frontend, UI, Karishma, Daily Tasks modules | #1–#4, #6, #7, #15, #19 |
| **Person B** | Backend, integrations, APIs, system features | #5, #9, #10, #13, #14 (API), #16, #17, #18, #20 |
| **Both** | QA, architecture decisions, launch prep | Sprints 13–14 |

---

*Generated: June 2026 · See SPRINT_TASKS.md for per-task breakdowns · See DEPENDENCIES.md for dependency graph*
