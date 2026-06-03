# Family Hub — Validation Report

**Date:** June 3, 2026  
**Validated by:** Claude Code  
**Environment:** Home Assistant http://localhost:8123 · Mealie http://localhost:9925  

---

## Summary

| Category | Count |
|---|---|
| ✅ Working | 19 |
| ⚠️ Issues | 2 |
| 🔴 Critical Bugs | 0 (1 resolved) |

---

## ✅ Resolved — Google Calendar Authentication (June 3, 2026)

The Google OAuth refresh token was permanently revoked (`invalid_grant`). Re-authenticated via Settings → Devices & Services → Google Calendar → Re-Authenticate. All 5 Google calendar entities confirmed live after re-auth:

| Entity | Before | After |
|---|---|---|
| `calendar.thenarsais_gmail_com` | `unavailable` | `off` ✅ |
| `calendar.birthdays` | `unavailable` | `off` ✅ |
| `calendar.family` | `unavailable` | `off` ✅ |
| `calendar.holidays_in_united_states` | `unavailable` | `off` ✅ |
| ThrillShare school calendar | `unavailable` | `on` ✅ |

---

## ⚠️ Issues Found

### 1. Both Waze Sensors Share the Same Route

Both `sensor.drive_to_pra` (morning drop-off) and `sensor.drive_to_pra_pickup_from_pra` (afternoon pickup) are configured with **identical** origin and destination:
- Origin: `13303 Clarkson St, Thornton, CO`
- Destination: `2555 Preble Creek Pkwy, Broomfield, CO 80023`

The dashboard displays them as distinct sensors for "Morning Drop-off" and "Afternoon Pickup" but they return the same route and duration (~12.5 min). Functionally this is acceptable (same road, same time), but if traffic differs significantly by direction at pickup time, the afternoon ETA is inaccurate.

**Optional fix:** Swap origin/destination on "Pickup from PRA" so it routes from school → home.

---

### 2. Mealie Meal Plans — No Meals Planned This Week

The `sensor.mealie_recipes` shows 7 recipes available in the library, but the meal planner has no meals planned for the current week (June 1–7, 2026). The meal planner iframe at `http://localhost:8080/meal-planner.html` is accessible (HTTP 200) and renders the drag-and-drop interface, but the week grid will appear empty.

This is not a bug — the meal planner is working, just no meals have been scheduled. Add meals by dragging recipes onto days in the meal planner.

---

## ✅ Working Features

### Dashboard Cards

| Feature | Entity/Source | Status | Notes |
|---|---|---|---|
| Clock + Weather | `weather.forecast_home_2` | ✅ Working | State: "cloudy", updated 16:53 UTC |
| World Clocks (sensors) | `sensor.cleveland_time_2`, `sensor.vadodara_time_2` | ✅ Working | Cleveland 13:33, Vadodara 23:03 — accurate |
| Shopping List | `todo.shopping_list` | ✅ Working | 0 items (empty, accessible) |
| Meal Planner iframe | `http://localhost:8080/meal-planner.html` | ✅ Working | HTTP 200, drag-drop UI renders |
| Krish Morning Chores | 6× `input_boolean.krish_*` | ✅ Working | Conditional card 6–9:30 AM |
| Krish Afternoon Chores | 6× `input_boolean.krish_*` | ✅ Working | Conditional card 3–5 PM |
| Krish Evening Chores | 8× `input_boolean.krish_*` | ✅ Working | Conditional card 5–9 PM |
| Monthly Points & Rewards | `counter.krish_monthly_points` | ✅ Working | 0 pts (reset June 1st), 3-tier system (200/300/400) |
| School Transit Tracker | `sensor.drive_to_pra` | ✅ Working | Live: 12.5 min, Route: Washington St Thornton → W 160th Ave Broomfield |
| Trash & Recycling | `sensor.trash_recycling_current_pickup` | ✅ Working | Next pickup: **June 4** (tomorrow!), Following: June 11 |
| HVAC Filter Countdown | `input_datetime.hvac_filter_last_replaced` | ✅ Working | Last replaced: 2026-05-22, Size: 25x20x1, ~78 days remaining |
| Car Start Reminder | Markdown template | ✅ Working | Triggers 3–8 AM when temp <40°F |
| Night Mode | `input_boolean.night_mode` | ✅ Working | Currently: off (daytime), Automations: 9 PM on / 6 AM off |
| Birthday Reminders | `calendar.birthdays` | ✅ Working | Restored after Google re-auth (June 3) |
| Family Calendar | `calendar.thenarsais_gmail_com` | ✅ Working | Restored after Google re-auth (June 3) |

### Integrations

| Integration | Status | Notes |
|---|---|---|
| Met.no / Weather | ✅ Working | 3 locations: Home, Cleveland, Vadodara |
| Waze Travel Time | ✅ Working | Both sensors returning live data |
| ReCollect Waste | ✅ Working | Place ID: DC53537C-9863-11E9-8F39-DFDB60BEC81C |
| Mealie | ✅ Working | 7 recipes, meal calendar entities active |
| Google Calendar | ✅ Working | Re-authenticated June 3; all 5 calendars live |
| Shopping List | ✅ Working | Built-in HA integration |
| World Clock | ✅ Working | 2 instances (America/New_York, Asia/Kolkata) |

### Automations

| Automation | Status |
|---|---|
| Krish Morning Chore Points | ✅ Registered |
| Krish Afternoon Chore Points | ✅ Registered |
| Krish Evening Chore Points | ✅ Registered |
| Krish Daily Chore Reset (6 AM) | ✅ Registered |
| Krish Monthly Points Reset (1st) | ✅ Registered |
| Night Mode On (9 PM) | ✅ Registered |
| Night Mode Off (6 AM) | ✅ Registered |
| Trash Pickup Reminder — Night Before | ✅ Registered |
| Trash Pickup Reminder — Bring Bins In | ✅ Registered |
| HVAC Filter Replaced Today | ✅ Registered |

### Learning Module

| Feature | Status | Notes |
|---|---|---|
| Learn Mode | ✅ Working | Present in module |
| Quiz Mode | ✅ Working | Present in module |
| Trace Mode | ✅ Working | Present in module |
| Progress Saving | ✅ Working | Uses `localStorage` |
| Curriculum | ✅ Working | 91 letter/word items |
| Accessibility | ✅ Working | Served at `/local/gujarati/gujarati-learning-module.html?v=29` |

---

## Action Required

1. **⚠️ Add meals to Mealie** — drag recipes onto the week grid in the meal planner
2. **⚠️ Optional: Fix Pickup from PRA Waze sensor** — swap origin/destination so it routes school → home for afternoon pickup

---

*Report generated: 2026-06-03 · Last updated: 2026-06-03 (Google Calendar re-auth resolved; world clock DST fix applied)*
