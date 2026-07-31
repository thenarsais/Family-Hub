# Priority 2 Optimization Analysis

## Current Conditional Time Blocks:

### Morning Chores (6:00 - 9:30)
```json
"condition": "time",
"after": "06:00:00",
"before": "09:30:00"
```

### Afternoon Chores (15:00 - 17:00)
```json
"condition": "time",
"after": "15:00:00",
"before": "17:00:00"
```

### Evening Chores (17:00 - 21:00)
```json
"condition": "time",
"after": "17:00:00",
"before": "21:00:00"
```

### School Transit (6:00 - 15:30 + calendar condition)
```json
"conditions": [
  {
    "condition": "state",
    "entity": "calendar.thrillshare_cmsv2_services_thrillshare_com",
    "state": "on"
  },
  {
    "condition": "time",
    "after": "06:00:00",
    "before": "15:30:00"
  }
]
```

---

## Optimization Strategy:

### ✅ Replace Markdown with Template Sensors
**Current:** Complex Jinja2 recalculates in markdown
**Better:** HA templates recalculate once, markdown displays value

**Candidates:**
1. School Transit (drive time math) - 6 lines of Jinja2
2. HVAC Filter (90-day countdown) - 4 lines of Jinja2
3. World Clocks (timezone math) - 2 lines of Jinja2

**Benefits:**
- Sensors can be used in automations
- Faster dashboard updates
- Reusable across dashboards

### ✅ Keep Conditional Cards (don't consolidate further)
Reason: Each time block is independent and distinct
- Morning: specific morning tasks
- Afternoon: different afternoon tasks
- Evening: different evening tasks

Consolidating would add complexity without benefit.

---

## Removing Gujarati Section:

**Current Structure:**
- Line 367-375: Gujarati iframe (always-on, takes up 8 rows)
- Part of Right Section (Security Cameras area)

**New Structure:**
- Remove iframe entirely
- Add button: "📚 Open Gujarati Learning" → opens in new window/modal

---

## Implementation Order:
1. Remove Gujarati iframe
2. Add Gujarati button (simple button card)
3. Create template sensors for complex markdown
4. Replace markdown cards with sensor display

