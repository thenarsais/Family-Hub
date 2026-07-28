# Phase 8C — Feature Dependencies

Maps all blocking relationships, external APIs, and risks across the 20 Phase 8C features.

---

## Feature Dependency Graph

```
Phase 8B.1 (Parent Auth) ──────────────────────────┐
Phase 8B.3 (Backend API) ──────────────────────────┤
                                                    ▼
                              #6 Parent Mobile App ──────► #7 Photo Carousel (upload)
                                                    │
Phase 8B.1 ─────────────────────────────────────── ┼────► #16 Spotify PIN lock
                                                    └────► #19 Guest Mode PIN

#1 Daily Tasks ─────────────────┬────► #2 Habit Tracker
                                ├────► #3 Trivia Section
                                └────► #4 Reading Challenges

#5 Family Announcements ────────────► #6 Parent App (posts to announcements)
                                   └► #17 Phone Shortcuts (lives in Announcements card)

#10 Home Status ────────────────────► #18 Google/Nest (thermostat tile feeds into Home Status)

#13 Traffic Colors ─────────────────► [extends existing Waze card — no blocker]

#8 Birthday Countdown ──────────────► [depends on Google Calendar ✅ already working]
#9 Moon Phase ──────────────────────► [depends on lunar API — must acquire in pre-sprint]
#14 Activity Finder ────────────────► [depends on Google Maps + Eventbrite API keys]
#15 Karishma ───────────────────────► [depends on TTS audio pipeline — no external blocker]
#20 Screen Time ────────────────────► [depends on Xfinity router API access]
```

---

## Feature-to-Feature Dependencies

| Feature | Blocked By | Blocks | Notes |
|---|---|---|---|
| #1 Daily Tasks | None | #2, #3, #4 | Foundation; must ship before sub-features |
| #2 Habit Tracker | #1 Daily Tasks | None | Lives inside Daily Tasks component |
| #3 Trivia Section | #1 Daily Tasks | None | Lives inside Daily Tasks component |
| #4 Reading Challenges | #1 Daily Tasks | None | Lives inside Daily Tasks component |
| #5 Family Announcements | None | #6, #17 | App posts to announcements; phone lives here |
| #6 Parent Mobile App | Phase 8B.1, Phase 8B.3, #5 | #7 (photo upload) | Needs auth + backend + announcements card |
| #7 Photo Carousel | None (scaffold), #6 (uploads) | None | Carousel works standalone; upload needs #6 |
| #8 Birthday Countdown | Google Calendar ✅ | None | Already working — no blocker |
| #9 Moon Phase | Lunar API key | None | API key needed in pre-sprint |
| #10 Home Status | None (partial), #18 (thermostat) | None | Can ship without thermostat; #18 adds it |
| #11 Maintenance Cards | None | None | Fully independent; HVAC pattern already built |
| #12 Weather Alerts | None | None | Uses Met.no which is already integrated |
| #13 Traffic Colors | None | None | Extends existing Waze card |
| #14 Activity Finder | Google Maps API, Eventbrite API | None | Both API keys needed in pre-sprint |
| #15 Karishma | TTS audio pipeline | None | ⚠️ Primrose deadline — August 2026 |
| #16 Spotify | Phase 8B.1 (for PIN), Spotify HA integration | None | Spotify integration may already exist in HA |
| #17 Phone Shortcuts | #5 (card location), VoIP provider | None | VoIP provider setup needed |
| #18 Google/Nest | Nest API (Device Access) | #10 (thermostat tile) | Device Access API has approval process |
| #19 Guest Mode | Phase 8B.1, All core features built | None | Needs to know what to hide — last |
| #20 Screen Time | Xfinity router API access | None | Most uncertain dependency in the plan |

---

## External API Dependencies

| API / Service | Used By | Status | Risk | Action Required |
|---|---|---|---|---|
| **Google Maps Places API** | #14 Activity Finder | ❌ Not acquired | Medium | Get API key in pre-sprint; $0 within free tier for family use |
| **Eventbrite API** | #14 Activity Finder | ❌ Not acquired | Low | Free public API; register app at eventbrite.com/platform |
| **Open Trivia Database** | #3 Trivia | ❌ Not acquired | Low | Free, no key required — just HTTP calls |
| **Lunar Calendar API** | #9 Moon Phase | ❌ Not acquired | Low | Use `ephem` Python library locally or `lunarcalendar` pip package — no external API needed |
| **Google Nest Device Access** | #18 Nest Integration | ❌ Not acquired | **High** | Requires Google approval ($5 one-time fee + review); apply early |
| **Rachio API** | #10 Home Status | ❌ Not acquired | Medium | Rachio v3 API; register at app.rach.io/settings/api |
| **Spotify API** | #16 Spotify | ❓ May exist in HA | Low | Check HA Spotify integration; may already be configured |
| **Xfinity xFi API** | #20 Screen Time | ❌ Not acquired | **High** | Unofficial API; may require router-level packet inspection as fallback |
| **VoIP Provider** | #17 Phone Shortcuts | ❌ Not acquired | Medium | Google Voice (free) or Twilio; decide before Sprint 10 |
| **TTS (Karishma audio)** | #15 Karishma | ❌ Not set up | Low | gTTS (free) or Piper (local) — no API key needed |

---

## Phase 8B Prerequisites

| Phase 8B Feature | Used By Phase 8C | Status | Risk if Missing |
|---|---|---|---|
| **8B.1 Parent Auth** | #6 Parent App, #16 Spotify PIN, #19 Guest Mode | Must verify in Pre-Sprint | Without auth, #6 cannot ship |
| **8B.3 Backend API** | #6 Parent App (photo upload endpoint, announcement API) | Must verify in Pre-Sprint | Parent App cannot post to dashboard |
| **8B.2 Audio** | #15 Karishma (if TTS reused) | Nice-to-have | Karishma can use its own TTS pipeline |
| **8B.6 Karishma base** | #15 (expansion) | Partial overlap | 8C builds on or replaces 8B.6 |

---

## Hardware Prerequisites

| Hardware | Used By | Status | Risk |
|---|---|---|---|
| Mini PC operational | All | Must verify | If not running, nothing ships |
| 10"+ Touchscreen | All (tap targets) | Must verify | Karishma designed for touch |
| Solar monitoring sensor | #10 Home Status | Unknown | Card shows placeholder if missing |
| VoIP-capable network | #17 Phone | Unknown | Need SIP passthrough on router |
| Nest devices (doorbell, cam, thermostat) | #18 Nest | Must verify | Need hardware to test integration |
| Rachio sprinkler controller | #10 Home Status | Must verify | Placeholder if missing |

---

## Risk Register

| Risk | Features Affected | Probability | Impact | Mitigation |
|---|---|---|---|---|
| **Nest Device Access API approval delayed** | #18, #10 (thermostat) | Medium | High | Apply in pre-sprint; design #10 to work without thermostat initially |
| **Xfinity API unavailable** | #20 Screen Time | High | Medium | Fallback: manual router log parsing or defer #20 to Phase 8D |
| **Phase 8B.1/8B.3 incomplete** | #6, #16, #19 | Low | High | Verify in pre-sprint; descope PIN features to Phase 8D if needed |
| **Karishma audio quality poor** | #15 | Medium | Medium | Test gTTS early; switch to Piper (local) if quality insufficient |
| **Google Maps API billing** | #14 | Low | Low | $200 free credit/month; family usage well under limit |
| **Primrose start date moves earlier** | #15 | Low | High | Karishma is Sprint 1–3 top priority; one sprint buffer |
| **Scope creep on Daily Tasks (#1)** | #1, #2, #3, #4 | High | High | Strict feature gate: only what's in spec; defer "nice-to-haves" |
| **VoIP quality issues** | #17 | Medium | Low | Test Google Voice first; Phone Shortcuts is low-priority |
| **Parent App App Store review delay** | #6 | Low | Medium | Distribute via TestFlight (iOS) / APK sideload (Android) for family use |

---

## Critical Path

The longest unbroken dependency chain determines the minimum possible duration:

```
Pre-Sprint (API keys + Phase 8B verify)
  → #1 Daily Tasks scaffold (Sprint 2)
    → #1 Daily Tasks core (Sprint 3)
      → #2 Habit Tracker (Sprint 5)
        → Sprint 6 (Trivia + Reading)
          → [Tier 1 complete, Sprint 6]
```

And in parallel:
```
Pre-Sprint (Nest API apply)
  → Nest approval (~4 weeks)
    → #18 Nest Integration (Sprint 8–9)
      → #10 Home Status thermostat tile (Sprint 9)
```

**Minimum duration if all external dependencies unblock immediately:** ~21 weeks  
**Expected duration with normal delays:** 26–28 weeks  
**Buffer budget:** 2 sprints (Sprints 13–14 are QA + launch — can absorb 1 sprint of slippage)

---

## Dependency Resolution Timeline

| Week | Action | Unblocks |
|---|---|---|
| Week 0 | Apply for Nest Device Access API | #18, #10 thermostat |
| Week 0 | Get Google Maps + Eventbrite API keys | #14 |
| Week 0 | Verify Rachio API credentials | #10 |
| Week 0 | Confirm Phase 8B.1 + 8B.3 complete | #6, #16, #19 |
| Week 0 | Choose VoIP provider | #17 |
| Week 0 | Set up gTTS for Karishma audio | #15 |
| Week 4 | Nest API approval expected | #18 can start Sprint 8 |
| Week 10 | Confirm Xfinity API access feasibility | #20 go/no-go decision |
| Week 18 | All external APIs confirmed working | #19 Guest Mode design finalized |

---

*See PHASE_8C_SPRINTS.md for schedule · See SPRINT_TASKS.md for task cards*
