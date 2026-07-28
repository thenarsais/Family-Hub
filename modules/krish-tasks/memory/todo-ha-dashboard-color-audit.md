---
name: ha-dashboard-color-audit-todo
description: TODO - Apply same comprehensive color/theme audit to HA Dashboard after Activity Board completion
metadata:
  type: project
---

# HA Dashboard Color Audit - Future Work

**Status:** Planned for after Activity Board (krish-tasks) completion  
**Priority:** High  
**Related:** [[comprehensive-color-audit-activity-board]]

## Background

After completing a comprehensive color and theme audit on the Activity Board (krish-daily-tasks.html), we identified and fixed 280+ color/styling inconsistencies. The same patterns likely exist in the HA Dashboard.

## Work to Apply to HA Dashboard

### 1. Add Missing CSS Variables
Create variables for:
- `--text-muted`: #94A3B8
- `--border-light`: #E2E8F0
- `--border-darker`: #CBD5E1
- `--bg-light-extra`: #F8FAFC
- `--bg-overlay-dark`: rgba(0,0,0,0.6)
- `--btn-disabled-bg`: #64748B
- `--btn-disabled-text`: #94A3B8

### 2. Global Find & Replace
- Replace 88+ `color:#94A3B8` with `var(--text-muted)`
- Replace 64+ `color:#E2E8F0` with `var(--border-light)`
- Replace 44+ `color:#475569` with `var(--mid)`
- Replace hardcoded button colors with theme variables

### 3. Button Standardization
- Back buttons: Use `var(--theme-primary)`
- Play Again buttons: Use `var(--theme-primary)`
- Secondary buttons: Use `var(--mid)` with consistent styling
- Disabled buttons: Use `--btn-disabled-bg` and `--btn-disabled-text`

### 4. Modal Consistency
- Ensure all modal backgrounds use `var(--dark)` consistently
- Fix text colors for readability
- Update close button styling

### 5. Consolidate Classes
- Create `.btn-back` class for navigation buttons
- Create `.btn-secondary` class for grey buttons
- Create `.text-muted` class for secondary text
- Create `.btn-disabled` class for disabled states

## Expected Impact
- Consistent theming across entire dashboard
- Better theme switching (all colors now CSS-based)
- Improved readability
- Easier to maintain and update colors globally

## Timeline
- Start after Activity Board color audit is complete and tested
- Estimate: 2-3 hours for comprehensive fix
- Same systematic approach as Activity Board

