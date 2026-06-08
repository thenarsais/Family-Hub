# Calendar-Based Trash Reminders Setup Guide

**Status:** Ready to implement  
**Type:** Home Assistant automations + template sensors  
**Benefit:** Smart, calendar-aware notifications (only on trash days)

---

## 🎯 What You're Getting

Instead of checking every day at 6pm/6am with conditions, these automations:

✅ **Trigger only on trash pickup days** (not every day)  
✅ **Persistent notifications** - stay until user dismisses  
✅ **Two-stage reminders:**
- 6pm night before: "Put out the bins tonight"
- 6am morning of: "Bins are going out - remember to bring them in tonight"
- 6pm evening of: "Bring the bins back in"

✅ **Uses calendar events** - works with your `calendar.trash_recycling`  
✅ **Flexible timing** - easily change times if needed

---

## 📋 Implementation Steps

### Step 1: Backup Current Automations
```bash
cp automations.yaml automations.yaml.backup
```

### Step 2: Replace Trash Automations in `automations.yaml`

**Remove these current automations:**
- "Trash Pickup Reminder - Night Before"
- "Trash Pickup Reminder - Bring Bins In"

**Add these new ones** (from trash-reminders-calendar-based.yaml):

```yaml
# AUTOMATION 1: Night Before Reminder (6pm)
- id: trash_reminder_night_before
  alias: 'Trash Pickup - Night Before Reminder'
  description: 'Sticky reminder at 6pm the night before trash pickup'
  trigger:
    - platform: time
      at: '18:00:00'  # 6:00 PM
  condition:
    - condition: template
      value_template: >
        {% set trash_event = state_attr('calendar.trash_recycling', 'message') %}
        {% set today = now().date() %}
        {% set tomorrow = (now().date() + timedelta(days=1)) %}
        {{ state_attr('calendar.trash_recycling', 'start_time')|default(None) != None
           and as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == tomorrow }}
  action:
    - service: notify.notify
      data:
        title: '🗑️ Trash Pickup Tomorrow!'
        message: >
          Don't forget to put out the bins tonight.
          Trash pickup is tomorrow morning.
        notification_id: trash_night_before_reminder
        data:
          timeout: 0  # Persistent notification
          tag: trash_before

# AUTOMATION 2: Morning Of Reminder (6am)
- id: trash_reminder_morning_of
  alias: 'Trash Pickup - Morning Of Reminder'
  description: 'Sticky reminder at 6am on trash pickup day'
  trigger:
    - platform: time
      at: '06:00:00'  # 6:00 AM
  condition:
    - condition: template
      value_template: >
        {% set today = now().date() %}
        {{ state_attr('calendar.trash_recycling', 'start_time')|default(None) != None
           and as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == today
           and states('calendar.trash_recycling') == 'on' }}
  action:
    - service: notify.notify
      data:
        title: '🗑️ Trash Pickup Today!'
        message: >
          It's trash day! Make sure the bins are out by 6am.
          Don't forget to bring them back in this evening.
        notification_id: trash_morning_reminder
        data:
          timeout: 0  # Persistent notification
          tag: trash_morning

# AUTOMATION 3: Evening Reminder (6pm) to Bring Bins In
- id: trash_reminder_evening_bring_in
  alias: 'Trash Pickup - Evening Bring Bins In'
  description: 'Sticky reminder at 6pm on trash pickup day'
  trigger:
    - platform: time
      at: '18:00:00'  # 6:00 PM (same time as night-before, but different day)
  condition:
    - condition: template
      value_template: >
        {% set today = now().date() %}
        {{ state_attr('calendar.trash_recycling', 'start_time')|default(None) != None
           and as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == today }}
  action:
    - service: notify.notify
      data:
        title: '🗑️ Bring Bins In!'
        message: >
          Trash pickup was this morning.
          Don't forget to bring the bins back to the side of the house.
        notification_id: trash_evening_reminder
        data:
          timeout: 0  # Persistent notification
          tag: trash_evening
```

### Step 3: Add Template Sensors (Optional but Recommended)

Add to your `modules/krish-tasks/template-sensors.yaml`:

```yaml
# Trash pickup tracking sensors
- sensor:
    - name: "Trash Pickup Today"
      unique_id: trash_pickup_today
      state: >
        {% if state_attr('calendar.trash_recycling', 'start_time') %}
          {% set today = now().date() %}
          {% if as_datetime(state_attr('calendar.trash_recycling', 'start_time')).date() == today %}
            yes
          {% else %}
            no
          {% endif %}
        {% else %}
          no
        {% endif %}

    - name: "Trash Pickup Tomorrow"
      unique_id: trash_pickup_tomorrow
      state: >
        {% if state_attr('calendar.trash_recycling', 'start_time') %}
          {% set tomorrow = (now().date() + timedelta(days=1)) %}
          {% if as_datetime(state_attr('calendar.trash_recycling', 'start_time')).date() == tomorrow %}
            yes
          {% else %}
            no
          {% endif %}
        {% else %}
          no
        {% endif %}

    - name: "Next Trash Pickup Date"
      unique_id: next_trash_pickup_date
      state: >
        {% if state_attr('calendar.trash_recycling', 'start_time') %}
          {{ as_datetime(state_attr('calendar.trash_recycling', 'start_time')).date() }}
        {% else %}
          Unknown
        {% endif %}
```

### Step 4: Restart Home Assistant

```
Settings > System > Restart Home Assistant
```

Or reload automations:
```
Developer Tools > YAML > Reload Automations
```

---

## 🧪 Testing

### Test Night Before Reminder:
1. Go to Developer Tools > Template
2. Test if tomorrow is trash day:
```
{% set tomorrow = (now().date() + timedelta(days=1)) %}
{{ as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == tomorrow }}
```
3. Should return `true` if tomorrow is trash day

### Test Morning Reminder:
```
{% set today = now().date() %}
{{ as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == today }}
```
4. Should return `true` if today is trash day

### Test the Notifications:
1. Go to Developer Tools > Actions
2. Call `notify.notify` service manually with the trash reminder data
3. Check if notification appears and is dismissible

---

## 🎛️ Customization

### Change Times

**Night Before:** Change `at: '18:00:00'` to your preferred time
- `'20:00:00'` = 8pm
- `'19:00:00'` = 7pm

**Morning:** Change `at: '06:00:00'` to your preferred time
- `'07:00:00'` = 7am
- `'05:00:00'` = 5am

### Change Messages

Edit the `message:` field in the `action:` section:

```yaml
message: >
  Your custom message here.
  Can span multiple lines.
```

### Send to Specific Device

Instead of `notify.notify`, use:

```yaml
service: notify.mobile_app_[phone_name]
# Example: notify.mobile_app_iphone_14
```

Or find your device:
1. Developer Tools > Services
2. Search for "notify"
3. See available notify services

### Add to Dashboard

Create a custom card to show trash status:

```yaml
type: entities
entities:
  - entity: sensor.trash_pickup_today
    name: 'Trash Today?'
  - entity: sensor.trash_pickup_tomorrow
    name: 'Trash Tomorrow?'
  - entity: sensor.next_trash_pickup_date
    name: 'Next Pickup'
```

---

## 🔍 How It Works

### Notification IDs

Each notification has a unique `notification_id`:
- `trash_night_before_reminder` - Night before at 6pm
- `trash_morning_reminder` - Morning at 6am
- `trash_evening_reminder` - Evening at 6pm

**Important:** If the same `notification_id` fires again before being dismissed, it will **replace** the previous notification (won't create duplicates).

### Timeout: 0

`timeout: 0` makes the notification **persistent** - it won't disappear automatically. Users must dismiss it manually.

### Conditions

The conditions check:
1. The calendar event exists
2. The event date matches (tomorrow for night-before, today for morning/evening)
3. The calendar is "on" (event is active)

This ensures notifications **only fire on actual trash days**.

---

## ✅ Verification Checklist

After implementation:

- [ ] Removed old trash automations from automations.yaml
- [ ] Added 3 new trash automations
- [ ] Added optional template sensors
- [ ] Restarted Home Assistant or reloaded automations
- [ ] Tested notifications manually in Developer Tools
- [ ] Verified conditions work with template testing
- [ ] Checked that notifications appear and are dismissible
- [ ] Customized times if needed
- [ ] Updated dashboard to show trash status (optional)

---

## 🐛 Troubleshooting

### Notifications Don't Appear

**Check 1:** Is `calendar.trash_recycling` available?
```
Developer Tools > States > Search for "calendar.trash_recycling"
```

**Check 2:** Is the calendar event properly formatted?
- Event should show as "on" when trash is happening
- Should have a `start_time` attribute with the trash day date

**Check 3:** Are automations enabled?
```
Settings > Automations > Check if automations are enabled
```

### Notifications Fire Every Day

**Cause:** Condition might be too broad or calendar not working

**Fix:** Check the template condition in Developer Tools > Templates:
```
{% set today = now().date() %}
{{ as_datetime(state_attr('calendar.trash_recycling', 'start_time')|default(now())).date() == today }}
```

Should only return `true` on trash days.

### Want to Test the Automation

1. Developer Tools > Services
2. Service: `automation.trigger`
3. Entity ID: `automation.trash_reminder_night_before`
4. Check if it fires

---

## 📝 Files Affected

- `automations.yaml` - Replace trash automations (or keep both if testing)
- `modules/krish-tasks/template-sensors.yaml` - Add optional sensors

---

## 🎉 Result

When implemented, you'll have:

✅ **6pm Night Before:** "🗑️ Trash Pickup Tomorrow!" notification  
✅ **6am Morning Of:** "🗑️ Trash Pickup Today!" notification  
✅ **6pm Evening Of:** "🗑️ Bring Bins In!" notification  

All **sticky and dismissible** - no repeated notifications!

---

**Questions?** Check the trash-reminders-calendar-based.yaml file for the complete YAML.
