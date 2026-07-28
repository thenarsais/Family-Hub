# Krish's Daily Tasks — Sprint 1

Single-file dashboard for Krish's daily activities. No build step required.

---

## Files

| File | Purpose |
|---|---|
| `krish-daily-tasks.html` | Complete app — HTML + CSS + JS in one file |

---

## Features

### Dashboard Cards (quick glance)
- **Chores** — done/total + pts earned, progress bar
- **Points** — today's pts + tier (Beginner → Explorer → Achiever → Champion → Legend)
- **Homework** — pending count, urgent due dates flagged
- **Gujarati** — current phase/lesson, minutes today
- **Calendar** — upcoming events, next event name
- **Habits** — today's status, best streak
- **Mood** — today's emoji or "Not set yet"

### Activity Board (tap any card to expand)
8 tabs accessible from the tab bar at the top:

| Tab | What's inside |
|---|---|
| ✅ Chores | Morning/Afternoon/Evening blocks, tap to toggle, pts awarded |
| 📚 Homework | Add assignments, mark done, 🍅 Pomodoro focus timer |
| 🥋 Kung Fu | Practice log, flash cards (15 terms), today's goals |
| 🇮🇳 Gujarati | Phase/lesson display, study timer, links to Learn/Quiz/Trace |
| 📅 Calendar | Upcoming events, add events (no delete, by design) |
| 💪 Habits | Meditate · Pull-ups · Water — 7-day grid, streaks, counters |
| 😊 Mood | 5 emoji options, 7-day history |
| ⭐ Points | Tier badge, today/week/month/all-time, points guide |

### Data persistence
All state saved to `localStorage` key `krish_tasks_v1`.  
Auto-resets daily: chore completion, mood, Kung Fu goals, Gujarati timer.  
Auto-resets weekly: habit week grids.  
Auto-resets monthly: monthly points counter.

---

## Home Assistant Integration

### Option 1 — Webpage Card (simplest, recommended)

Copy the file to your HA `www/` folder:

```bash
cp krish-daily-tasks.html /config/www/krish-tasks/krish-daily-tasks.html
```

Add to your dashboard YAML:

```yaml
type: iframe
url: /local/krish-tasks/krish-daily-tasks.html
aspect_ratio: 100%
title: Krish's Daily Tasks
```

Or as a custom card (full-height):

```yaml
type: custom:hui-iframe-card
url: /local/krish-tasks/krish-daily-tasks.html
```

### Option 2 — Panel (dedicated full-page view)

In `configuration.yaml`:

```yaml
panel_iframe:
  krish_tasks:
    title: "Krish's Tasks"
    icon: mdi:checkbox-marked-circle
    url: /local/krish-tasks/krish-daily-tasks.html
```

### Option 3 — Push updates from HA automations

The page exposes two global helpers for HA to call via a browser_mod `javascript` action:

#### Update chores from HA
```yaml
service: browser_mod.javascript
data:
  code: >
    window.haUpdateChores({
      morning: [
        { id: "m1", text: "Make Bed",    icon: "🛏️", pts: 5, done: false },
        { id: "m2", text: "Brush Teeth", icon: "🦷", pts: 3, done: false }
      ],
      afternoon: [],
      evening: []
    });
```

#### Update calendar from HA Google Calendar integration
```yaml
service: browser_mod.javascript
data:
  code: >
    window.haUpdateCalendar([
      { id: "ev1", title: "Swimming", date: "2026-06-05", time: "4:00 PM",
        type: "Sport", color: "#F97316" }
    ]);
```

### Touchscreen kiosk (tablet/mini PC)

For the Family Hub touchscreen, set the browser to open the page full-screen:

```yaml
# Kiosk mode (add to lovelace dashboard)
kiosk_mode:
  enabled: true
  admin_settings:
    kiosk: false
```

Or use `browser_mod` + `panel_iframe` and set the panel as the default view for the Krish profile.

---

## Gujarati Module Link

The three action buttons (Learn / Quiz / Trace) link to:
```
../../gujarati-learning/gujarati-learning-module.html?user=krish&tab=learn
```

Adjust the `GUJARATI_MODULE_PATH` constant at the top of the JS if the relative path changes:

```js
const GUJARATI_MODULE_PATH = '../../gujarati-learning/gujarati-learning-module.html';
```

If the Gujarati module stores progress under a localStorage key, update `tryReadGujaratiProgress()` to match.

---

## Points System

| Action | Points |
|---|---|
| Each chore | 3–10 pts |
| Homework done | 10 pts |
| Pomodoro session (25 min) | 15 pts |
| Kung Fu practice log | 6–18 pts (based on duration) |
| Flash cards viewed | 5 pts |
| Gujarati study (per 2 min) | 2 pts |
| Habit day logged | 6–10 pts |
| Mood logged | 5 pts |

**Tiers (monthly points):**
- 🌱 Beginner: 0–99
- 🔍 Explorer: 100–249
- ⭐ Achiever: 250–499
- 🏆 Champion: 500–999
- 🦁 Legend: 1000+

---

## Customising Default Chores

Edit the `DEFAULT_CHORES` constant near the top of the `<script>` tag.  
Changes only take effect on first load (before state is persisted to localStorage).  
To force a reset: open browser console and run `localStorage.removeItem('krish_tasks_v1')`.

---

## Sprint Roadmap

| Sprint | Feature | Status |
|---|---|---|
| Sprint 1 (current) | Daily Tasks scaffold — all 7 sections, Pomodoro, flash cards, habits, mood | ✅ |
| Sprint 2 | Trivia section (#3), Reading challenge (#4) | Planned |
| Sprint 3 | Parent admin view, habit badges, HA sensor sync | Planned |
| Sprint 4 | Weekly habits polish, collapsed summary, responsive QA | Planned |
