# Home Assistant Validation Task

You are validating the Family Hub Home Assistant setup to ensure all MVP features work correctly.

## Environment
- Home Assistant: http://localhost:8123
- Mealie: http://localhost:9925

## What to Test

### Dashboard Features (20+ items):
1. Clock + Weather card (local + world clocks) - verify accurate time/weather
2. Family calendar - verify Google Calendar events showing
3. Shopping list - verify accessible and editable
4. Meal planner - verify Mealie recipes/meals display
5. Krish's chores (morning/afternoon/evening) - verify toggles work, points increment
6. Monthly points & rewards - verify display and tier system
7. School transit tracker - verify real-time Waze drive time shows
8. Trash & recycling - verify ReCollect schedule displays
9. HVAC filter countdown - verify days remaining calculation
10. Car start reminder - verify shows when temp <40F (or similar)
11. Birthday reminders - verify upcoming birthdays show
12. Night mode - verify activates at 9 PM, off at 6 AM

### Integrations
- Google Calendar (events syncing)
- Weather/Met.no (accurate data)
- Waze (real-time drive times)
- ReCollect (trash schedule)
- Mealie (recipes/meals)

### Automations
- Daily chore reset at 6 AM
- Monthly points reset on 1st
- Night mode on/off
- Chore point updates

### Learning Module
- Gujarati Learn/Quiz/Trace modes
- Progress saves

### Output
Create VALIDATION_REPORT.md with:
- ✅ Working features
- ⚠️ Issues found
- 🔴 Critical bugs
- Update docs/known-issues.md
