# Feature Implementation Notes

## 1. Customizable Daily Goals

**Status:** Foundation added (state structure + logic functions)  
**Next:** Add UI for editing goal (Settings modal or inline edit)

### Quick Implementation Path:
- Add settings gear icon to dashboard header
- Click opens modal with goal slider (10-500 pts)
- Save updates state.settings.dailyGoal
- Re-render dashboard to show new goal

### Code Locations:
- Function: `updateDailyGoal(newGoal)` at line ~9770
- State: `state.settings.dailyGoal` initialized in buildDefaultState()
- Dashboard: Uses `state.settings.dailyGoal` at line 8180-8184

## 2. Enhanced Daily Bonuses

**Status:** Foundation added (multiplier logic + tracking)  
**Next:** Wire up bonus calculation when daily bonus is claimed

### Multiplier System:
- Tracks dailyStreak in state.dailyBonusEnhanced
- calculateBonusMultiplier() returns 1.0x to 2.0x based on streak
- Need to apply multiplier when awarding daily bonus points

### Code Locations:
- Function: `calculateBonusMultiplier()` at line ~9789
- Function: `updateAchievements()` at line ~9800
- State: `state.dailyBonusEnhanced` initialized in buildDefaultState()

## 3. Weekly/Monthly Achievements

**Status:** Foundation added (state + award functions)  
**Next:** Display achievement progress + wire up auto-award

### Achievement Types:
- **Weekly:** 7-day streak = +50 bonus points
- **Monthly:** 30-day streak = +150 bonus points
- Auto-check and award when milestones reached

### Code Locations:
- Functions: `awardWeeklyAchievement()` and `awardMonthlyAchievement()` at line ~9819
- State: `state.achievements` initialized in buildDefaultState()

## Testing Checklist

- [ ] Change daily goal to 75 pts, verify progress bar scales
- [ ] Check that daily streak increments
- [ ] Verify bonus multiplier calculates correctly (test with known streak)
- [ ] Confirm achievement unlock notifications appear
- [ ] Test weekly achievement at 7-day streak
- [ ] Test monthly achievement at 30-day streak

