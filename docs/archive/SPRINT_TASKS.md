# Phase 8C — Sprint Task Cards

Detailed task breakdown for all 20 features across 14 sprints.  
Format: `[ID] Task — Hours — Person — Acceptance Criteria`

---

## Sprint 1 (Weeks 1–2)

### Feature #15 — Karishma Module: Foundation (Person A, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| K-1 | Define content schema (category, item, gujarati, english, audio_file, image) | 1h | JSON schema committed |
| K-2 | Build audio pipeline (gTTS or local TTS → /www/karishma/audio/) | 2h | Test audio plays for 3 sample words |
| K-3 | Scaffold HTML app shell with category nav and player state | 2h | App loads, navigation between 9 categories works |
| K-4 | Build game engine base class (shared tap/audio/animation logic) | 3h | Base class handles tap → play audio → show animation |
| K-5 | Implement parental lock (PIN to exit) | 2h | PIN prompt appears on exit; wrong PIN rejected |

### Feature #7 — Photo Carousel (Person B, 5h)

| ID | Task | Hours | AC |
|---|---|---|---|
| P7-1 | HA iframe card pointing to `/local/photos/carousel.html` | 1h | Card renders in dashboard |
| P7-2 | Build carousel.html — reads filenames from `/www/photos/` via API | 2h | Auto-rotates through images every 8s |
| P7-3 | Add crossfade transition + pause on tap | 1h | Tap pauses rotation; tap again resumes |
| P7-4 | Add "no photos yet" placeholder state | 1h | Shows message when folder empty |

### Feature #8 — Birthday Countdown (Person B, 4h)

| ID | Task | Hours | AC |
|---|---|---|---|
| P8-1 | HA template sensor: days until next birthday per family member | 1h | `sensor.next_birthday_days` returns integer |
| P8-2 | Dashboard markdown card — collapsed (next birthday + days) | 1h | Shows "Karishma's birthday in 54 days" |
| P8-3 | Expanded view: full list of 6 family members + ages they'll turn | 1h | Tap expands to full list |
| P8-4 | Auto-prominent mode when < 30 days (bold, highlight) | 1h | Card border changes color when < 30 days |

### Feature #13 — Traffic Colors (Person B, 3h)

| ID | Task | Hours | AC |
|---|---|---|---|
| P13-1 | Add color conditional to existing Waze sensor display | 1h | Green <15 min / Yellow 15–25 min / Red >25 min |
| P13-2 | Add "Leave early!" alert text when Red | 1h | Alert text appears when duration > 25 min |
| P13-3 | Restrict display to 6:30–7:30 AM (morning) and 2:15–3:00 PM (afternoon) | 1h | Card only visible in those windows |

---

## Sprint 2 (Weeks 3–4)

### Feature #15 — Karishma: 4 Game Engines (Person A, 12h)

| ID | Task | Hours | AC |
|---|---|---|---|
| K-6 | Story time game: sequential card reveal with audio narration | 3h | Tapping advances story; audio plays each card |
| K-7 | Shape/form learning: shape shown, Gujarati name + tap to hear | 2h | All 15 shape items play audio on tap |
| K-8 | Sing-along: nursery rhyme text + highlighted word sync with audio | 4h | Word highlights as audio plays for 3 rhymes |
| K-9 | Matching game: tap two matching cards to clear | 3h | Game completes; celebration animation fires |

### Feature #1 — Daily Tasks: Scaffold (Person B, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| DT-1 | Design component layout (collapsed summary / expanded full view) | 2h | Wireframe approved; responsive at 1024px+ |
| DT-2 | Build collapsible card component (tap header to expand/collapse) | 2h | Expands smoothly; state persists in localStorage |
| DT-3 | Chores section: pull from existing `input_boolean.krish_*` entities | 2h | Existing chore toggles render in new card |
| DT-4 | Homework section: manual input + check-off (localStorage) | 2h | Add homework item; check off; persists on reload |
| DT-5 | Daily summary header (points today, tasks done/total) | 2h | Header shows "5/12 done · 14 pts today" |

---

## Sprint 3 (Weeks 5–6)

### Feature #15 — Karishma: Content + Ship (Person A, 12h)

| ID | Task | Hours | AC |
|---|---|---|---|
| K-10 | Content: Sounds (23 items) — Gujarati + English + audio | 1.5h | All 23 play correctly |
| K-11 | Content: Colors (15) + color swatch visual | 1h | Color shown; tap plays name |
| K-12 | Content: Numbers (10) + dot visual counter | 1h | Dots animate on tap |
| K-13 | Content: Animals (10) + animal image | 1h | Image + name + sound plays |
| K-14 | Content: Objects (10) household items | 0.5h | All 10 items complete |
| K-15 | Content: Nursery Rhymes (10+) with sing-along engine | 1h | 10 rhymes in sing-along engine |
| K-16 | Content: Seasons, Family members, Food/vegetables (remaining categories) | 1h | All 9 categories have content |
| K-17 | Achievement badges system (participation stars, category complete) | 1.5h | Stars earned on each tap; badge unlocks on category finish |
| K-18 | Session timer (auto-stop after 15 min with warning at 13 min) | 1h | Timer fires; "Time to take a break!" screen shows |
| K-19 | Final QA + ship to `/local/karishma/` | 1.5h | Full play-through on tablet; no crashes |

### Feature #1 — Daily Tasks: Kung Fu + Gujarati + Calendar (Person B, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| DT-6 | Kung Fu training section: practice log (minutes + type) | 2h | Log entry saved; weekly total displayed |
| DT-7 | Gujarati learning integration: pull progress from learning module localStorage | 2h | Shows "Lesson 12 of 91 complete · 78% quiz accuracy" |
| DT-8 | Calendar events section: pull today's events from `calendar.thenarsais_gmail_com` | 3h | Today's events list from Google Calendar |
| DT-9 | Mood tracking widget: 5 emoji tap (😄😊😐😔😢) + localStorage persist | 2h | Tap emoji → saved; shown in summary header |
| DT-10 | Weekly habits widget scaffold (placeholder for Sprint 5) | 1h | Section visible with "Coming soon" state |

---

## Sprint 4 (Weeks 7–8)

### Feature #11 — Maintenance Reminders ×3 (Person A, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| M-1 | Water heater card: last cleaned date input, annual reminder, days remaining | 2h | Shows "Next cleaning: January 2027 · 215 days" |
| M-2 | Mattress card: last turned date, 6-month cycle, days remaining | 2h | Shows correct next-turn date |
| M-3 | Dryer duct card: last cleaned date, annual reminder | 2h | Overdue alert fires correctly |

### Feature #12 — Weather Alerts (Person A, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| WA-1 | HA template sensor for 10 alert conditions using Met.no attributes | 3h | Each alert type evaluates correctly in HA dev tools |
| WA-2 | Dashboard card: alert display, severity color coding | 2h | Active alerts show; no alert shows "All clear" state |
| WA-3 | School-aware timing (suppress non-critical alerts outside school hours) | 1h | Thunderstorm alert suppressed at 2 AM |

### Feature #1 — Daily Tasks: Weekly Habits + Polish (Person B, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| DT-11 | Weekly habits widget: 3 habits (Meditate, Pull-ups, Water intake) with 5/7 progress | 3h | Tap day to mark; streak counter increments |
| DT-12 | Collapsed summary view (all sections visible at-a-glance) | 2h | Collapsed shows 1-line status per section |
| DT-13 | Responsive polish: tablet (1024px) and large phone (768px) | 2h | No overflow; readable at both sizes |
| DT-14 | Daily reset automation: habits and mood clear at midnight | 1h | Automation runs; mood/habits reset correctly |

---

## Sprint 5 (Weeks 9–10)

### Feature #2 — Habit Tracker (Person A, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| HT-1 | 3 habit definitions (Meditate 5/7, Pull-ups 5/7, Water intake 5/7) configurable | 1h | Habits configurable via JSON |
| HT-2 | Streak counter: consecutive days all habits hit | 2h | Streak increments correctly; resets on missed day |
| HT-3 | Progress rings: circular progress per habit (SVG) | 2h | Rings fill as days completed |
| HT-4 | Badge system: 1-week streak, 1-month streak, "Perfect Week" | 2h | Badge unlocks trigger correctly |
| HT-5 | Parent view: weekly habit history summary | 2h | Parent can see past 4 weeks per habit |
| HT-6 | HA automation: daily habit reminder notification at 7 PM | 1h | HA persistent notification fires |

### Feature #9 — Moon Phase & Hindu Astrology (Person B, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| MP-1 | Lunar API integration (lunarcalendar library or open API) | 2h | Current moon phase returned correctly |
| MP-2 | Moon phase display: icon + name + % illumination | 1h | Visual moon icon matches current phase |
| MP-3 | 30-day festival calendar: Ekadashi, Purnima, Amavasya, major festivals | 2h | Next 5 upcoming events shown |
| MP-4 | Tithi/Nakshatra details (expandable) | 1h | Expand shows today's tithi + nakshatra |
| MP-5 | Dismissible/markable festivals (tick off observed) | 1h | Festival marked; check persists |
| MP-6 | Daily astronomy fact (rotating from curated list of 50) | 1h | Different fact each day |

### Feature #5 — Family Announcements start (Person B, 4h)

| ID | Task | Hours | AC |
|---|---|---|---|
| FA-1 | Time/day message engine: weekday vs weekend auto-messages | 2h | "Good morning!" weekday; "Happy Saturday!" weekend |
| FA-2 | Message type definitions + color coding (info=blue, alert=red, celebration=gold) | 2h | 3 types render with correct colors |

---

## Sprint 6 (Weeks 11–12)

### Feature #3 — Trivia Section (Person A, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| TV-1 | Open Trivia DB API integration + local Gujarati Culture / Mythology category | 2h | API returns question; custom categories load from JSON |
| TV-2 | 16-category question bank (local JSON fallback) | 2h | All 16 categories have ≥ 10 questions each |
| TV-3 | Daily question rotation (date-seeded, same question all day) | 1h | Same question shown morning and evening |
| TV-4 | Answer reveal + explanation display | 1h | Correct/incorrect state + explanation shown |
| TV-5 | Streak counter: consecutive correct daily answers | 1h | Streak increments daily; resets on wrong |
| TV-6 | Category selector (Krish picks daily category or uses rotation) | 1h | Category dropdown works; selection persists |

### Feature #4 — Reading Challenges (Person A, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| RC-1 | Daily target: 20 min timer with start/stop/pause | 2h | Timer accurate; auto-stops at 20 min |
| RC-2 | Weekly target: 100 min accumulation bar | 1h | Weekly total shown; fills correctly |
| RC-3 | Quick-tap checkmark for "I read today!" without timing | 1h | Tap marks day; no timer needed |
| RC-4 | 10 reading topic tags (customizable via parent app later) | 1h | Tags selectable; stored with log entry |
| RC-5 | Reading history: last 7 days shown as calendar dots | 1h | Green dots for days read; grey for missed |

### Feature #5 — Family Announcements: complete (Person B, 4h)

| ID | Task | Hours | AC |
|---|---|---|---|
| FA-3 | Custom parent messages via HA input_text helper | 1h | Parent types in HA → shows on dashboard |
| FA-4 | Auto-clear: message disappears after 24h | 1h | Old messages gone next day |
| FA-5 | Manual dismiss: swipe/tap X on each message | 1h | Dismiss persists; message gone until next trigger |
| FA-6 | Status updates: "Dad's Working Late" mode (toggleable) | 1h | HA toggle → status message appears |

### Feature #10 — Home Status: Scaffold (Person B, 4h)

| ID | Task | Hours | AC |
|---|---|---|---|
| HS-1 | Card layout: icon grid with tap-to-expand detail | 1h | Grid renders, expand/collapse works |
| HS-2 | Temperature + humidity sensor integration | 1h | Current temp/humidity shown |
| HS-3 | WiFi signal strength display | 1h | Signal bars shown correctly |
| HS-4 | HVAC filter days (from existing entity) | 1h | Reuses `input_datetime.hvac_filter_last_replaced` |

---

## Sprint 7 (Weeks 13–14)

### Feature #10 — Home Status: Complete (Person A, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| HS-5 | Solar production integration (existing HA energy sensor) | 2h | kW production + daily total shown |
| HS-6 | Energy usage integration | 1h | Current draw (kWh) displayed |
| HS-7 | Water usage sensor (if available, else placeholder) | 1h | Gallons today shown or "sensor pending" |
| HS-8 | Rachio sprinkler status + next schedule | 2h | "Next run: Thursday 6 AM, Zone 2" |
| HS-9 | Porch light status + toggle | 1h | On/off toggle in card |
| HS-10 | Alert logic: <14 days on any maintenance item → warning badge | 2h | Badge appears on card icon |
| HS-11 | Nest thermostat tile (once #18 complete) | 1h | Current temp + setpoint; up/down control |

### Feature #14 — Activity Finder: API Backend (Person B, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| AF-1 | Google Maps Places API: search by category, radius, kid-friendly filter | 3h | Returns ranked results for "parks near 80023" |
| AF-2 | Eventbrite API: local events by city + radius | 2h | Returns upcoming family-friendly events |
| AF-3 | Local parks / rec centers: static data layer + city site scraping | 2h | 20+ local venues in data layer |
| AF-4 | Unified search response schema | 1h | All sources return consistent JSON shape |

### QA: Daily Tasks + Announcements (Both, 4h)

| ID | Task | Hours |
|---|---|---|
| QA-1 | Dog-food Daily Tasks for one full week; log all bugs | 2h |
| QA-2 | Fix P0/P1 bugs from QA-1 | 2h |

---

## Sprint 8 (Weeks 15–16)

### Feature #14 — Activity Finder: UI (Person A, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| AF-5 | Search UI: location input + category picker | 2h | Search runs; results appear <3s |
| AF-6 | Result cards: name, type, distance, rating, kid-friendly badge | 2h | All fields shown; tapping opens detail |
| AF-7 | Kid-friendly, price, ratings filter bar | 2h | Filters reduce results correctly |
| AF-8 | Krish favorites: star to save; favorited appear at top | 2h | Starred items persist across sessions |
| AF-9 | Dismiss: swipe to hide activity for 7 days | 1h | Dismissed activity hidden; reappears in 7 days |
| AF-10 | Travel search: city/zip input for out-of-town trips | 1h | Search returns results for entered location |

### Feature #18 — Google/Nest: Start (Person B, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| N-1 | Nest API auth flow in HA (OAuth2 device access) | 2h | HA shows Nest devices; entities created |
| N-2 | Doorbell live view: embed camera stream in HA card | 3h | Live feed visible in dashboard iframe |
| N-3 | Camera clip display: last 3 clips shown as thumbnails | 3h | Thumbnails load; tap plays clip |
| N-4 | Motion detection alert: HA automation → persistent notification | 2h | Notification appears within 30s of motion |

---

## Sprint 9 (Weeks 17–18)

### Feature #14 — Activity Finder: Polish (Person A, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| AF-11 | Movie theater showtimes integration | 2h | Today's showtimes for nearest 2 theaters |
| AF-12 | Museum + sports venue data layer | 2h | Major local venues in search results |
| AF-13 | Performance: cache results for 2h; skeleton loading state | 2h | Results load <2s on repeat search |

### Feature #6 — Parent Mobile App: Scaffold (Person A, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| PA-1 | React Native project setup + HA API connection | 2h | App connects to local HA instance |
| PA-2 | Auth screen (Phase 8B.1 credentials) | 2h | Login works; session persists |
| PA-3 | Navigation: Announcements tab, Photos tab | 2h | Both tabs accessible |

### Feature #18 — Google/Nest: Complete (Person B, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| N-5 | Nest thermostat: current temp, set target, heat/cool mode | 3h | Dashboard card shows temp; +/- changes setpoint |
| N-6 | Google Mini speaker: send HA TTS announcements via speaker | 2h | "Dinner is ready!" plays on Mini |
| N-7 | Thermostat tile added to Home Status card | 1h | Home Status shows thermostat widget |
| N-8 | QA: full Nest flow end-to-end | 2h | Doorbell, camera, thermostat, speaker all work |

---

## Sprint 10 (Weeks 19–20)

### Feature #6 — Parent Mobile App: Core (Person A, 12h)

| ID | Task | Hours | AC |
|---|---|---|---|
| PA-4 | Post announcement: type, message, color, auto-clear time | 3h | Posted → appears on dashboard within 5s |
| PA-5 | Photo upload from phone camera roll | 2h | Selected photo saved to mini PC; carousel shows it |
| PA-6 | Google Photos import: browse + select from album | 3h | Google Photos OAuth; selected photo copied locally |
| PA-7 | Push notifications: receive HA alerts on phone | 2h | Motion alert sent to phone via Companion app |
| PA-8 | Basic offline queue: announcement queued if no network | 2h | Queued announcement sends on reconnect |

### Feature #16 — Spotify Profile Selector (Person B, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| S-1 | Spotify integration in HA (existing integration) | 1h | Spotify entity available in HA |
| S-2 | Default: Krish's Spotify profile auto-selected | 1h | Krish's profile active on dashboard load |
| S-3 | PIN-protected Anand profile switch | 3h | PIN entry → switches to Anand's profile |
| S-4 | Profile indicator on Daily Tasks card | 1h | Shows which Spotify profile is active |

### Feature #17 — Phone Shortcuts (Person B, 6h)

| ID | Task | Hours | AC |
|---|---|---|---|
| PH-1 | VoIP setup: Linphone or Baresip on mini PC | 2h | Can make/receive calls via mini PC |
| PH-2 | Quick-dial card: 6 family contacts with photo + tap to call | 2h | Tap Jaya → calls Jaya's number |
| PH-3 | Call status display: "Calling Jaya…" / "In call" / idle | 1h | Status updates correctly |
| PH-4 | HA integration: call log entity (last caller, duration) | 1h | Entity shows last call info |

---

## Sprint 11 (Weeks 21–22)

### Feature #6 — Parent App: Polish (Person A, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| PA-9 | Error handling: network failures, upload failures (retry UI) | 2h | Clear error message; retry works |
| PA-10 | Photo gallery view in app: browse + delete from library | 2h | Gallery shows all uploaded photos |
| PA-11 | Haptic feedback + animations | 1h | Taps feel responsive |
| PA-12 | TestFlight / APK build for internal use | 3h | Installable on Priya's phone |

### Feature #7 — Photo Carousel: App Integration (Person A, 4h)

| ID | Task | Hours | AC |
|---|---|---|---|
| P7-5 | Connect carousel to `/www/photos/` folder populated by Parent App | 1h | New uploads appear in carousel within 1 min |
| P7-6 | Caption support (filename as caption) | 1h | Photo shows filename as caption |
| P7-7 | Pinch-to-expand on touchscreen | 2h | Tap photo → full screen; swipe to dismiss |

### Feature #19 — Guest Mode: Foundation (Person B, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| GM-1 | Define "hide in guest mode" list per card | 1h | List documented in config |
| GM-2 | HA `input_boolean.guest_mode` toggle | 1h | Toggle exists and fires correctly |
| GM-3 | Card visibility: conditionally show/hide based on guest_mode | 4h | All private cards hidden when guest_mode=on |
| GM-4 | PIN activation for guest mode | 2h | PIN prompt on mode switch |

---

## Sprint 12 (Weeks 23–24)

### Feature #19 — Guest Mode: Complete (Person A, 8h)

| ID | Task | Hours | AC |
|---|---|---|---|
| GM-5 | Simplified guest view layout (remove clutter) | 3h | Guest sees: clock, weather, calendar, announcements only |
| GM-6 | Auto-timeout back to family view after 2h | 2h | Automation reverts guest_mode after 2h |
| GM-7 | Guest mode indicator banner ("Guest Mode Active") | 1h | Banner visible at top of dashboard |
| GM-8 | QA: full guest mode flow | 2h | Private cards confirmed hidden; PIN works |

### Feature #20 — Screen Time Tracking (Person B, 10h)

| ID | Task | Hours | AC |
|---|---|---|---|
| ST-1 | Xfinity router API access (xFi API or router admin scraping) | 3h | Device list with MAC addresses + usage data |
| ST-2 | Device → profile mapping (Krish's iPad, Fire TV, etc.) | 2h | Devices correctly labeled per family member |
| ST-3 | Streaming detection: Netflix, Paramount, Hulu, Disney+ via traffic analysis | 3h | App usage correctly identified |
| ST-4 | Dashboard card: daily/weekly usage per device + per streaming service | 2h | Card shows "Krish iPad: 2h 15m today" |

---

## Sprint 13 (Weeks 25–26) — QA Sprint

### Integration Testing (Both, 20h)

| ID | Task | Hours | AC |
|---|---|---|---|
| QA-10 | Full regression: all 20 features end-to-end | 8h | All features function correctly together |
| QA-11 | Touchscreen UX: tap targets, scroll, gestures | 4h | No mis-taps; all gestures work on 10" screen |
| QA-12 | Performance audit: Lighthouse + manual timing | 3h | Dashboard <2s initial load; all cards <500ms |
| QA-13 | Mobile: Parent App on iOS + Android | 2h | App works on both platforms |
| QA-14 | Bug triage: P0/P1 fix during sprint | 3h | No P0 open at end of sprint |

---

## Sprint 14 (Weeks 27–28) — Launch

### Deployment & Documentation (Both, 20h)

| ID | Task | Hours | AC |
|---|---|---|---|
| L-1 | Docker Compose update with all Phase 8C services | 3h | `docker compose up` starts everything |
| L-2 | One-click install script updated | 2h | Fresh install completes in <15 min |
| L-3 | docs/features.md updated with all 20 new features | 2h | All features documented |
| L-4 | docs/session-log.md updated | 1h | Phase 8C session complete |
| L-5 | Parent App deployment guide (TestFlight / APK sideload) | 2h | Non-technical family member can install |
| L-6 | Karishma user guide (for Primrose handoff) | 1h | 1-page guide for teachers if needed |
| L-7 | Final smoke test: fresh install → all 20 features working | 4h | Zero regressions on fresh install |
| L-8 | Phase 8C retrospective + Phase 8D scope | 2h | 8D features prioritized |
| L-9 | Tag release: `v8c.0` | 1h | Git tag on clean main commit |
| L-10 | Announce Phase 8C complete to family 🎉 | 2h | Dashboard demo for family |

---

*See PHASE_8C_SPRINTS.md for schedule · See DEPENDENCIES.md for dependency graph*
