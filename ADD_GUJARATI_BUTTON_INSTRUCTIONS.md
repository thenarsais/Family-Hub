# How to Add the "Open Gujarati Learning" Button

## Quick Steps

### 1. Still in Edit Mode
- You should still be in "Edit Dashboard" mode
- If not, click ⋯ menu → "Edit Dashboard"

### 2. Add a New Card
- Click the **"+ Add Card"** button (usually at the bottom or in top-right)
- Or click the **"Create Card"** button

### 3. Choose Card Type: Button
- Select "Button" card type
- Or search for "button" in the card type search

### 4. Configure the Button
Fill in these fields:

**Name:**
```
📚 Open Gujarati Learning
```

**Icon:**
```
mdi:book-open-page-variant
```

**Tap Action:**
- Type: URL
- URL Path: `/local/gujarati/gujarati-learning-module.html?v=29`

### 5. Save the Card
- Click "Save" on the card
- Then click "Save" on the dashboard

---

## What the Button Should Look Like

- **Icon:** 📚 (book)
- **Label:** "Open Gujarati Learning"
- **Action:** Opens Gujarati learning module in new tab/window when clicked
- **Size:** Small button (not a large card)

---

## Button Configuration JSON (If Manual Entry)

If HA allows JSON editing, you can paste this:

```json
{
  "type": "button",
  "name": "📚 Open Gujarati Learning",
  "icon": "mdi:book-open-page-variant",
  "tap_action": {
    "action": "url",
    "url_path": "/local/gujarati/gujarati-learning-module.html?v=29"
  }
}
```

---

## Location Suggestion

The button should go near other action buttons or in a section near:
- Admin controls
- System settings
- Or top section near other shortcuts

---

Once you add it, you'll have:
✅ Button for parents to access Gujarati learning
✅ Tab in Activity Board for kids
✅ Clean main dashboard
