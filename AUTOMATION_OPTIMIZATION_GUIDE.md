# Automation Optimization - Deployment Guide

## 📋 What Changed

**Before:** 11 automations (270 lines)  
**After:** 8 automations (240 lines)  
**Savings:** 3 automations (-27%), 30 lines of code (-11%)

### Consolidations:
1. ✅ **Merged 3 chore point automations into 1**
   - Morning/Afternoon/Evening all in one automation
   - All 20 chores in single entity list
   - Same trigger logic, cleaner structure

2. ✅ **Merged 2 night mode automations into 1**
   - Both 6am OFF and 9pm ON in one automation
   - Uses `trigger.id` to differentiate actions
   - Single point of control

3. ✅ **Added HVAC Filter Replacement Reminder (NEW)**
   - Uses new `sensor.hvac_filter_status` template sensor
   - Notifies when < 7 days left
   - Replaces manual toggle approach
   - Pulls real-time data from sensor

---

## 🚀 Deployment Steps

### Step 1: Add Template Sensors (if not already done)

Add this to your `configuration.yaml`:

```yaml
template: !include modules/krish-tasks/template-sensors.yaml
```

Then restart Home Assistant to load the template sensors.

### Step 2: Backup Current Automations

```bash
# Current automations are already saved as automations.yaml
# If you want extra safety, copy it:
cp /config/automations.yaml /config/automations_backup_original.yaml
```

### Step 3: Deploy Optimized Automations

Replace the contents of `/config/automations.yaml` with the optimized version:

**Option A: Copy from file**
```bash
docker cp automations_optimized.yaml homeassistant:/config/automations.yaml
```

**Option B: Manual replacement**
1. Go to Settings > Automations & Scenes > Automations
2. Delete the 3 chore point automations (Morning/Afternoon/Evening)
3. Delete the 2 night mode automations (On/Off)
4. Create one new automation with the consolidated chore points code
5. Create one new automation with the consolidated night mode code
6. Keep the other 5 automations as-is
7. Add the new HVAC Filter Reminder automation

### Step 4: Restart Home Assistant

```bash
# Either restart via UI: Settings > System > Restart Home Assistant
# Or restart the container:
docker restart homeassistant
```

### Step 5: Verify Automations

1. Go to Settings > Automations & Scenes > Automations
2. Should see 8 automations total (down from 11)
3. Try toggling a chore - should increment points (same as before)
4. Check Night Mode at 6am and 9pm (should toggle on/off)
5. Check HVAC Filter notification if `sensor.hvac_filter_status` < 7

---

## ✅ Testing Checklist

After deployment, verify everything works:

### Chore Points
- [ ] Toggle morning chore → points increment
- [ ] Toggle afternoon chore → points increment
- [ ] Toggle evening chore → points increment
- [ ] Toggle any chore off → points decrement
- [ ] Monthly counter tracks both daily and monthly

### Daily Reset
- [ ] All chores reset to OFF at 6am (check logs)
- [ ] Can verify manually: 6am - turn all off with automation

### Night Mode
- [ ] 6am: Night mode turns OFF
- [ ] 9pm: Night mode turns ON
- [ ] No separate automations (consolidated)

### HVAC Filter (NEW)
- [ ] Notification appears when filter days < 7
- [ ] Notification shows days remaining
- [ ] Shows filter size from sensor
- [ ] Shows last replaced date from sensor

### Points Reset
- [ ] Monthly counter resets on 1st of month at midnight

### Trash Reminders
- [ ] 7am: Notification if pickup is tomorrow
- [ ] 6pm: Notification if pickup is today

---

## 🔄 Rollback Plan

If something goes wrong:

1. **Restore original automations:**
   ```bash
   docker cp /config/automations_backup_original.yaml homeassistant:/config/automations.yaml
   docker restart homeassistant
   ```

2. **Or manually delete new automations** and recreate the original 3 chore and 2 night mode automations from the original `automations.yaml` file

---

## 📊 Benefits Gained

### Performance
- ✅ 27% fewer automations to evaluate
- ✅ Consolidated triggers reduce state change processing
- ✅ Template sensor handles math once instead of in markdown

### Maintainability
- ✅ Single automation for all chore points (easier to update)
- ✅ Single automation for night mode (easier to modify times)
- ✅ Template sensor for HVAC (no need for manual toggle)

### Functionality
- ✅ All original features preserved
- ✅ New automated filter reminders added
- ✅ Same user experience, cleaner backend

---

## 💡 Optional Enhancements (Future)

Once this is stable, consider:

1. **Points Milestone Notifications**
   ```yaml
   - When reaching 200/300/400 points, notify with celebration message
   ```

2. **School Day Awareness**
   ```yaml
   - Morning reset only on school days
   - Different reset time on weekends
   ```

3. **Smart Trash Reminders**
   ```yaml
   - Trigger on calendar event instead of time + condition
   - Smarter pickup detection
   ```

---

## 📁 Files

- **`automations.yaml`** - Original (keep as backup)
- **`automations_optimized.yaml`** - Optimized version (use this)
- **`AUTOMATION_EFFICIENCY_ANALYSIS.md`** - Detailed analysis
- **`template-sensors.yaml`** - Template sensors for HVAC filter

---

## ❓ FAQ

**Q: Will this change how chores work?**  
A: No. Same functionality, just one automation instead of three.

**Q: Do I need template sensors?**  
A: Required for the new HVAC filter reminder. Already created in Part 2.

**Q: Can I revert if something breaks?**  
A: Yes, just restore the original automations.yaml and restart HA.

**Q: Will the HVAC filter reminder work immediately?**  
A: Yes, once template sensors load after restart.

---

## 🎯 Success Criteria

✅ Same chore points functionality  
✅ Same night mode schedule  
✅ New automated filter reminders working  
✅ Fewer automations (8 vs 11)  
✅ No errors in HA logs  

---

**Ready to deploy? Just copy `automations_optimized.yaml` to `/config/automations.yaml` and restart!**
