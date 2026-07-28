# HA Family Hub Dashboard — Decisions Log

**Created:** 2026-06-24  
**Status:** Foundations Locked | Feature Reviews In Progress  
**Purpose:** Single source of truth for all Core Dashboard decisions. Platform-agnostic (works with Home Assistant OR Flutter/Dart + Firebase/Superbase/Node.js + PostgreSQL)

---

## PART 1: FOUNDATIONAL ARCHITECTURE (All 12 Questions Locked)

### Question 1: Dashboard Layout & Architecture ✅

**Locked Decisions:**
- **Primary display:** 27" touchscreen monitor (portrait orientation)
- **Layout approach:** Card-based grid layout
- **Main focal point:** Family Calendar (largest, most prominent)
- **Card interaction:** Expandable/collapsible cards (tap to expand → modal or fullscreen detail view)
- **Navigation:** Persistent navigation system (for switching between main sections)
- **Responsive design:** Must work on 27" monitor AND mobile companion app
- **Grid dimensions:** Flexible (determined by content + phase of build)
- **Mobile-first consideration:** All features designed to work on both touchscreen monitor AND mobile app

---

### Question 2: User Roles & Visibility ✅

**Locked Decisions:**
- **Public view:** All family members (Krish, Karishma, Parents) see the same Core Dashboard
- **Authentication method:** Password entry OR phone notification (to authenticate via push)
- **Locked/Adult-only features:**
  - Budget
  - Medical Wiki
  - Gift Lists
  - Parent Analytics
  - Family Finances
  - WiFi/Network Control
  - Notification Preferences

**Home Security:**
- View access: All family members
- Edit/delete access: Parents only

**Chore Management:**
- Kids can add chores → Parents approve in Parent Portal
- One unified chore system (single source of truth)
- Displayed in: HA Dashboard AND Activity Board
- Sync: Bidirectional real-time sync between both platforms

---

### Question 3: Responsive Design & Multiple Platforms ✅

**Locked Decisions:**
- **Monitor layout:** Optimized for 27" touchscreen (card grid, calendar focal point)
- **Mobile layout:** Different/simplified layout optimized for small screens
- **Interaction model:** More clicking/navigation acceptable on mobile
- **Night Mode:** Monitor-only (auto 9 PM - 6 AM)
- **Real-time sync:** All changes sync instantly between monitor and mobile app

**Mobile-specific features (ALL):**
- ✅ Push notifications (chores, announcements, calendar, shopping)
- ✅ Home screen widgets (today's chores, upcoming meals, shopping preview)
- ✅ Biometric auth (fingerprint/face for parent features)
- ✅ Dark mode (system default, user-configurable override)
- ✅ Swipe gestures (complete chore, undo)
- ✅ Quick entry forms (minimize taps, auto-suggest)
- ✅ Calendar quick views (Today, This week, Full)
- ✅ Notification badges (pending items)
- ✅ Search functionality (calendar, shopping, meals)
- ✅ Batch actions (mark multiple items)
- ✅ Barcode scanning (shopping list)
- ✅ Quick action buttons (wherever applicable)

---

### Question 4: Data Persistence & Storage ✅

**Locked Decisions:**
- **Architecture:** Centralized backend approach
- **Backend options:**
  - PostgreSQL + Node.js API (full control)
  - Firebase/Supabase (managed, less ops overhead)
- **Single source of truth:** Database is authoritative
- **Sync method:** Real-time API (WebSocket or REST)
- **Local caching:** Both monitor and mobile cache data for offline access
- **Conflict resolution:** Last-write-wins or merge logic
- **Platform-agnostic:** Works with Home Assistant OR Flutter/Dart OR any other frontend
- **Scalability:** Easy to add more platforms later (car display, smartwatch, etc.)

---

### Question 5: Real-Time Updates & Refresh Strategy ✅

**Locked Decisions:**

| Feature | Priority | Update Method | Frequency |
|---------|----------|---|---|
| **Chore System** | 🔴 CRITICAL | WebSocket | Real-time |
| **Family Announcements** | 🔴 CRITICAL | Push notification + WebSocket | Real-time |
| **Shopping List** | 🟡 HIGH | REST polling | 10-30 seconds |
| **Calendar** | 🟡 HIGH | REST polling | 10-30 seconds |
| **Meal Planner** | 🟡 HIGH | REST polling | 30-60 seconds |
| **Weather** | 🟢 LOW | REST polling | 5-10 minutes |

**Additional Details:**
- **Offline mode:** All data cached locally, pending changes queue until reconnected
- **Push notifications:** Critical events trigger mobile alerts
- **User refresh:** Manual refresh always available
- **Auto-retry:** Transient failures auto-retry (2s, 5s, 10s exponential backoff)
- **User-retry:** Persistent failures show "Retry" button

---

### Question 6: Loading States & Error Handling ✅

**Locked Decisions:**
- **Loading states:** Skeleton loaders (not spinners) — shows card outline while loading
- **Quick threshold:** Show skeleton only if load takes >500ms
- **Progressive loading:** Load critical data first, secondary data later
- **Cached data fallback:** If API fails, show last known data with "Offline" indicator
- **User-friendly messages:** "Can't reach server" instead of "API Error 503"
- **Retry buttons:** Offer "Retry" button on failed cards
- **App resilience:** If one card fails, others still work

**Offline-Specific Behavior:**

| Feature | Offline Behavior |
|---------|---|
| **Chore System** | ✅ Full offline - show cached, mark complete offline, sync when online |
| **Shopping List** | ✅ Full offline - add items offline, sync when online |
| **Calendar** | ✅ Full offline - show cached events |
| **Meal Planner** | ✅ Full offline - show cached meals |
| **Weather** | ⚠️ Cached only - show last known, "Data from X hours ago" |
| **Announcements** | ⚠️ Cached only - show previous announcements |

**Visual Feedback:**
- **Connection status:** Subtle indicator (top right) showing "Online" or "Offline"
- **Error toast:** Brief notification when sync fails, option to dismiss or retry
- **Sync indicator:** Small pulse/dot showing when data is syncing

---

### Question 7: Theme & Branding Consistency ✅

**Locked Decisions:**

**Shared Foundation (both Dashboard + Activity Board):**
- Same **base design system** (typography, spacing, colors, components)
- Same **4 seasonal color schemes** (Spring/Summer/Fall/Winter)
- Same **accessibility standards** (contrast, readability, touch targets)
- Same **modular component library** (buttons, cards, modals, etc.)

**Activity Board (kid-focused):**
- ✅ Keep full **11 difficulty themes** (Adventure, Princess, Pirate, etc.)
- ✅ Playful/gamified visual personality (animations, celebration states, rewards)
- ✅ Kid chooses their own theme

**Core Dashboard (family/functional):**
- ✅ Use **4 seasonal colors only** (no 11 themes)
- ✅ Minimal/functional visual personality (clean, professional, easy to scan)
- ✅ Parent chooses dashboard color scheme (light/dark/seasonal)
- ✅ Less "gamification," more straightforward information display

---

### Question 8: Notifications & Alert System ✅

**Locked Decisions:**

**Three-tier notification system:**

| Tier | Urgency | Delivery | Example |
|------|---------|----------|---------|
| 🔴 **CRITICAL** | Immediate | Push notification + banner on app | Announcement (school cancelled), Security alert |
| 🟡 **IMPORTANT** | Soon | Toast notification + badge | Chore due soon, Calendar reminder |
| 🟢 **INFORMATIONAL** | Background | Badge/dot only, no interruption | New shopping item added, Meal planned |

**Where alerts appear:**
- **27" Dashboard:** Banner at top, toast in corner, badge on card
- **Mobile app:** Push notification, in-app toast, badge on app icon
- **Both:** Sound/haptic feedback (optional, user-configurable)

**User control:**
- Parents set which alerts they receive (in locked Notification Preferences)
- Kids get default alerts (chores, announcements)
- Do-not-disturb mode (quiet hours: bedtime, school, focus time)
- Can mute specific alert types

**Notification deduplication (per-user, not per-device):**
- Track WHO performed the action (not just which device)
- Send notifications to OTHER users on ALL their devices
- Don't notify the originating user (they already initiated the action)
- If user has multiple devices, notify the device they DIDN'T use

**Smart notifications (avoid fatigue):**
- Batch non-urgent alerts (combine "3 items added to shopping list" instead of 3 separate ones)
- Learn from user behavior (reduce frequency of ignored alert types)

---

### Question 9: Accessibility & Inclusive Design ✅

**Locked Decisions:**

**Core accessibility features:**

| Feature | Purpose | Implementation |
|---------|---------|---|
| **Voice control** | Hands-free operation | "Hey Siri/Google, mark dishes done" via Shortcuts/Routines |
| **Large text mode** | Vision accessibility | Adjustable font sizes (100%, 125%, 150%, 200%) |
| **High contrast mode** | Low vision support | Dark mode + high-contrast color options |
| **Keyboard navigation** | Motor accessibility | Full keyboard support (Tab, Enter, arrow keys) |
| **Screen reader support** | Blind/low vision | ARIA labels, semantic HTML, tested with VoiceOver/TalkBack |
| **Simple mode** | Cognitive accessibility | Stripped-down view with just essential cards |
| **Haptic feedback** | Motor feedback | Vibration on button press (mobile), accessible toggle |
| **Reading guide** | ADHD/dyslexia support | Visual indicator following text, adjust reading speed |
| **Audio announcements** | Multiple modalities | Speak important alerts aloud |
| **No time limits** | Cognitive/motor | No forced timeouts, forms don't auto-submit |
| **Color blindness support** | Vision accessibility | Don't rely on color alone; use icons + text, patterns |
| **Reduced motion** | Motion sensitivity | Respect user's `prefers-reduced-motion` setting |
| **Dyslexia-friendly fonts** | Dyslexia support | Option to use OpenDyslexic |
| **Customizable animations** | Motion control | Adjust animation speed (0%, 50%, 100%) |

**Age-appropriate access:**
- **Young kids (5-8):** Simple mode, large buttons, voice commands
- **Older kids (9-13):** Full interface, keyboard support
- **Parents/Grandparents:** Standard + accessibility options

**Multilingual support:**
- Core languages: English + Gujarati
- Expandable to additional languages later

**Standards compliance:**
- Target: **WCAG 2.1 Level AA** (internationally recognized)
- Accessibility testing with real users with disabilities
- Clear visual focus states for keyboard navigation

---

### Question 10: Integration with Activity Board ✅

**Locked Decisions:**

**Navigation model (monitor 27" display):**
1. **Dashboard** (family hub, main focal point)
   - All family members see the same public view
   - Calendar, chores, shopping, meals, announcements
   - Menu option: "Access Activity Board"

2. **Activity Board access from Dashboard:**
   - Tap "Activity Board" → Age-appropriate authentication screen
   - **Authentication by age:**
     - Older kids (9+): Type name or select from list
     - Younger kids (5-8): Tap picture authentication (choose animal/character/emoji)
     - Parents: Password or phone notification
   - Opens that user's personalized Activity Board
   - User can tap "Back to Dashboard" anytime

3. **Parent access:**
   - Parents tap "Activity Board" → authenticate as parent
   - View Activity Board in **admin/parent mode** (not as a player)
   - Can see all user activity, approve goals/chores, view analytics
   - Cannot play games or earn points as a user

4. **Return to Dashboard:**
   - "Back to Dashboard" button visible from Activity Board
   - "Back to Dashboard" button visible from all locked features
   - Auto-return on timeout (parent 30 min, kids 5-10 min)
   - Dashboard always accessible via home button

**Multi-user ready:**
- Currently: Krish's Activity Board (built)
- Future: Support for Karishma's Activity Board (not yet planned, but architecture ready)
- Each user has separate Activity Board, same unified dashboard

**Data sharing:**
- **Unified backend** — One database for all data
- **Real-time sync** — Changes on Dashboard sync to Activity Board and vice versa
- Chores, calendar, points, announcements all shared

**Mobile app:**
- Same navigation model (Dashboard → tap to Activity Board → authenticate)
- Consistent UX across monitor and mobile

---

### Question 11: Security & Data Privacy ✅

**Locked Decisions:**

**Data Encryption:**
- ✅ **At rest:** Encrypt all sensitive data in database (passwords, medical info, financial data)
- ✅ **In transit:** HTTPS/TLS for all API calls
- ✅ **Local device:** Encrypt cache on mobile app (iOS Keychain, Android Keystore)
- ✅ **Backup:** Encrypted backups to cloud

**Password Security:**
- Minimum 8 characters, mix of upper/lower/numbers (configurable by parent)
- Hash with bcrypt or Argon2 (never store plaintext)
- **Reset options:**
  - Email verification (standard)
  - **SMS/text code** (primary method for families)
- No password hints or recovery questions

**Session Management:**
- **Dashboard (family view):** No timeout (always accessible)
- **Activity Board (user view):** 5-10 min inactivity → auto-revert to Dashboard
  - Countdown warning before revert
  - Prevents another person from accessing
- **Parent locked features:** 30 min inactivity → auto-logout

**Data Deletion & Retention:**
- **User data deletion:** Parents can request deletion of own + kids' data
- **Permanent deletion:** Chores, calendar, points deleted within 30 days
- **Activity logs:** Kept for 1 year, then anonymized
- **Backups:** Retained per backup retention policy (user-configurable)

**Privacy by Design (minimize data collection):**
- Collect only what's needed (chores, calendar, points, mood — no tracking)
- No behavioral tracking or profiling
- No analytics on kids' activity (parents can see, but not aggregated/sold)
- No third-party data sharing

**Compliance & Standards:**
- **COPPA-compliant** (since Krish is 9 — under 13)
  - Parental consent/notice for data collection
  - No marketing/targeted ads to kids
  - Limited data collection
  - Parental access & deletion rights
- **GDPR-ready** (if deployed in EU)
  - Right to access own data
  - Right to delete (forgotten)
  - Data portability
  - Privacy policy in plain language

**Parental Controls & Transparency:**
- Parents see all kids' data (with parental consent)
- Parents can export kids' data anytime
- Parents notified of any privacy changes
- Kids can see what data is collected (age-appropriate explanation)

**Data Breach Response:**
- If breach occurs: Notify users within 48 hours
- Reset all passwords
- Audit logs to understand scope
- 3rd-party security audit post-incident

**API Security:**
- Rate limiting (prevent brute force attacks)
- Input validation (prevent injection attacks)
- CORS policy (only allow dashboard/mobile app domains)
- API keys for mobile app (rotated regularly)

**Admin Access:**
- Parents/developers with admin access logged
- Two-factor authentication for admin accounts
- Audit trail of admin actions
- Regular access reviews

---

### Question 12: Home Automations & Smart Home Integration ✅

**Locked Decisions:**

**Kid-safe controls (accessible to Krish/Karishma/all kids):**
- ✅ **Lights** — Turn on/off in **any room** (full house)
- ✅ **Fan/ventilation** — Simple on/off
- ✅ **Music/entertainment** — Play music, pause, next track (curated playlists only)
- ✅ **TV** — Limited to kid-safe inputs (not browsing, only approved apps)
- ✅ **Smart speaker broadcast** — Send voice message to any room speaker
- ✅ **Voice assistant** — Ask questions via smart speaker ("What's the weather?", "Play a song", "Set a timer")
- ❌ Locks, doors, security, thermostats (too dangerous)

**Parent-only controls (locked features):**
- 🔒 **Locks** — Front door, garage (security-critical)
- 🔒 **Security system** — Arm/disarm, view cameras
- 🔒 **Thermostat** — Temperature control (prevent abuse)
- 🔒 **All lights** — Full house control (override)
- 🔒 **Major appliances** — Oven, washer, dryer (safety)

**Automations & Alerts (display-only, no control):**
- 🔔 Trash pickup reminders (Tuesday 7 AM)
- 🔔 HVAC filter countdown (90 days)
- 🔔 Cold weather car start reminders
- 🔔 School countdown timer

**Smart speaker integration:**
- **Broadcast card on Dashboard** — Type message → sends to all speakers or specific room
- **Voice commands** — "Alexa/Google, turn on kitchen lights" via voice assistant
- **Accessibility feature** — Voice broadcast helps kids with reading difficulties
- **Family announcements** — Parents can broadcast announcements to all rooms

**Offline capability:**
- ✅ Automations/reminders work offline (stored locally)
- ❌ Live controls (lights, locks) require internet connection

**Integration:**
- **If using Home Assistant:** Native integration (HA entities)
- **If using Flutter/Firebase:** Custom API to smart home (Philips Hue, Apple HomeKit, Google Home, etc.)
- **Platform-agnostic:** Works with any smart home system

---

## PART 2: CORE DASHBOARD FEATURES (All 6 Locked) ✅

---

### Feature 1: Clock + Weather Card ✅

**Clock Display:**
- **Time format:** 12-hour (3:45 PM)
- **Seconds:** Not displayed by default, parent-configurable toggle in Parent Portal
- **Auto-update:** Real-time (every second if enabled, every minute if disabled)
- **Date display:** "Tuesday, June 24" format (day of week large + date)
- **Timezone:** Local timezone (user-set in settings)

**Clock Enhancements:**
- ✅ School day indicator (visual badge "School Day" or "No School")
- ✅ Time until next event ("School pickup in 2h 15m")
- ✅ Sunrise/sunset times ("Sunrise: 5:47 AM, Sunset: 8:32 PM")
- ✅ World clock - secondary timezone (default: Eastern Time, configurable in Parent Portal)
- ✅ Holiday/special day ("Happy Birthday Krish!", vacation countdowns)
- ✅ 24-hour toggle (parent preference in settings)
- ✅ Alarm indicator (shows if alarms set)

**Weather Display:**
- **Current weather:** Large temperature + condition + animated icon, feels-like temp, wind description (Calm/Breezy/Windy), humidity, location (auto-detected)
- **5-day forecast:** 7 cards showing day name, high/low temps, condition icon, expandable for hourly
- **Animated icons:** Match current conditions (rain animation, snow, sun rays rotating)
- **Temperature format:** Fahrenheit (default), Celsius toggle (settings)
- **Severe weather alerts:** Banner at top of card, color-coded (red=severe, yellow=watch, blue=advisory)
- **Multi-location:** Swipeable between 3 locations (primary auto-detect, defaults: Avon Lake OH, Vadodara India — all configurable)
- **Optional toggles (off by default, parent-configurable):**
  - ✅ Air Quality Index (AQI badge)
  - ✅ Pollen count
  - ✅ Rainfall probability
  - ✅ UV Index
  - ✅ Severe weather timeline ("Thunderstorms expected 3-5 PM")

**Dashboard animation:** Smooth overlay animation when screen wakes up (across entire dashboard)

---

### Feature 2: Family Calendar ✅

**Primary view: 7-day rolling view**
- Shows next 7 days from today (not always Mon-Sun)
- Swipe left/right to navigate weeks
- Switchable to month grid view (tap grid icon)

**Month view (alternate):**
- Full month grid with brief text for "high priority" events
- Tap any date to switch to 7-day view

**Event display:**
- **Color-coded by type:** Blue (school), Green (chores), Yellow (meals), Red (birthday), Purple (trash), Teal gradient (Activity Board items), Gray (custom)
- **Person badges:** Customized avatars (shows who's involved in event)
- **Optional assignees:** Not all events need people assigned (meals, general reminders)

**Calendar purpose:** Activities, events, AND tasks

**Sync sources:**
- Primary: Google Calendar (currently)
- Secondary: Microsoft Outlook (future)
- Tertiary: Apple Calendar (future)
- **Bidirectional sync:** Custom events added to dashboard sync back to source calendar, vice versa

**Features:**
- ✅ Recurring events with cycle icon + text ("Every Monday")
- ✅ Recurring event exceptions (edit single instance or whole series)
- ✅ Holiday auto-populate (US + Indian holidays: Diwali, Holi, Navaratri, etc.) + manual add
- ✅ Past events stay (searchable, scrollable history)
- ✅ Event descriptions (space-based display + full detail on event view)
- ✅ Smart recurring suggestions (detect pattern if user adds weekly event)
- ✅ Conflict detection (alert if two events overlap, user chooses action)
- ✅ Calendar visibility toggles (show/hide specific event types)
- ✅ Event duration visualization (event blocks proportional to length)
- ✅ Fixed colors by default (customizable in Parent Portal)
- ✅ Notification sounds (different sound per event type)
- ✅ 4 adult profiles (Mom, Dad, Grandpa, Grandma) + kids profiles
- ✅ Location display (show event location on calendar)
- ✅ Undo/redo (ability to undo accidental changes)
- ✅ Event templates (save recurring event types for quick creation)
- ✅ Custom reminders per event (different reminder times per event type/specific event)
- ✅ Access control for sensitive events (parents can hide certain events from kids)

**Add events:**
- Kids: Quick-entry form → requires parent approval
- Parents: Direct add (no approval)
- Both: Auto-suggest from history + recurring templates

---

### Feature 3: Shopping List ✅

**List organization:**
- Categorized by aisle (Produce, Dairy, Meat, Pantry, Frozen, etc.)
- Alternative: Flat list (swipe to see categories)
- Smart sorting: Group by meal (if items from meal plan)

**Add items (multiple methods):**
- ✅ Voice input ("Add milk" via Siri/Google)
- ✅ Barcode scanning (scan at store, mobile camera)
- ✅ Manual typing (quick search + auto-suggest from history)
- ✅ Recipe auto-suggest (add ingredients from meals)
- ✅ Recently bought (show frequently purchased for quick re-add)
- ✅ Voice grocery list (multi-item from voice: "Add eggs, milk, bread")

**Cross-off/complete:**
- Mobile: Swipe right to check off
- Monitor: Tap checkbox
- Crossed items: Move to bottom (grayed out) until cleared

**Quantity tracking:**
- Show quantity: "2x milk", "1 lb chicken"
- Auto-suggest quantities based on typical purchases

**Who can edit:**
- Parents: Full edit (add, remove, modify)
- Kids: Can add items (parent approval OR auto-add with review)
- Show who added each item (small badge/initial)

**Sharing:**
- Extended family: Read-only access for grandparents (view but not edit)
- Togglable on/off in Parent Portal

**Meal integration:**
- "Add ingredients from meal" (when viewing Meal Planner, add meal ingredients to list)
- Ingredients auto-added with quantities
- Meal-based grouping (show which meal each item came from)

**Mobile optimization:**
- Large buttons & text (tap with gloves/wet hands)
- Offline mode: Full functionality without internet
- Fullscreen mode: Hide nav, maximize list space
- Night mode: Dark display for low-light stores
- One-handed swipe: Whole list swipeable with thumb
- Voice at checkout: "I have eggs, milk, bread — what's missing?"
- Quick reset: "Clear list" button at end of shopping

**Additional features:**
- ✅ Item notes ("Almond milk, not whole milk")
- ✅ Store-specific lists (Whole Foods, Costco, Target)
- ✅ Shopping history (view what was bought when)
- ✅ Notifications (reminder if list hasn't been cleared in X days)
- ✅ Sharesheet (export/share list via text, email, print)

---

### Feature 4: Meal Planner ✅

**Weekly view:**
- 7-day rolling grid (Mon-Sun, always shows next 7 days)
- Breakfast, Lunch, Dinner for each day
- Drag-and-drop meals (desktop/tablet)

**Meal selection:**
- Recipe database: Mealie + Spoonacular API (with Indian/Gujarati filters)
- Family custom recipes (upload feature)
- URL import (AllRecipes, NYT, Indian blogs)
- Photo OCR (take photo of recipe → extract ingredients)
- Favorites: Save frequently-used recipes
- Recently used: Show last 10 meals

**Dietary management:**
- Family dietary restrictions (Mom = vegetarian, Krish = no shellfish)
- Smart filtering ("Show vegetarian options for Mom")
- Allergy alerts (flag recipes with common allergens)
- Custom meal variants ("Chicken OR tofu version")

**Cooking details:**
- Tap meal → view recipe (ingredients, prep/cook time, instructions, nutrition)
- Scale recipe (adjust servings)
- Ingredients linked to shopping list (one-click add)
- Prep notes (parent adds notes like "thaw chicken night before")

**Multi-meal planning:**
- Theme weeks ("Taco Tuesday", "Pasta week")
- Bulk plan week (suggest week of meals → family votes/approves)
- Seasonal menus (Spring veggies, summer grilling, fall soups, winter comfort)
- Quick plan ("Feed 6 people, 30 min prep")

**Leftovers & meal prep:**
- Mark as leftover ("Monday dinner = Wednesday lunch")
- Meal prep tracking ("Cook 3x chicken on Sunday")
- Reduce shopping (don't buy if leftover available)

**Kid involvement:**
- Kids suggest meals (added to "Meal suggestions" → parent approves)
- Family voting on meal options
- Cook difficulty indicators (great for helping)

**Shopping integration:**
- "Add week of ingredients" (all meals → shopping list)
- "Add this meal" (single meal ingredients)
- Smart quantities (chicken appears 3x = "3 lbs chicken")
- Cross-reference (don't re-add milk if already on list)

**Calendar integration:**
- Meals appear on calendar ("Spaghetti night Tuesday 6 PM")
- Click calendar meal → view/edit recipe

**Recipe ratings & feedback:**
- Family feedback ("Everyone loved this", "Kids hated it")
- Star ratings (know what works for family)
- Notes ("Add extra salt next time", "Krish picked out peas")
- Frequency tracking (how often family enjoyed recipe)

**Serving size & portions:**
- Adjust servings ("feeds 4" → scale to "feeds 6")
- Default servings (scale from family size)
- Portion sizes shown per person

**Quick-cook filters:**
- "30 mins or less" (weeknight survival)
- "One-pot meals" (less cleanup)
- "Uses pantry staples" (already have ingredients)

**Cooking method options:**
- Filter by method (stovetop, oven, instant pot, slow cooker, grill, microwave)
- Show method on recipe (plan kitchen use)

**Batch cooking suggestions:**
- "These meals share ingredients" (reduce shopping trips, save money)
- "Cook once, eat 3 ways" (versatile base recipes)

**Mobile optimization:**
- Fullscreen week view (easy to read)
- Quick meal tap (view details)
- Send to shopping (prominent button)
- Recipe cards (swipeable)

**Recipe integration phase plan:**
- **Phase 1 (v1):** Mealie + Spoonacular API + family custom + URL import
- **Phase 2 (soon):** Gujarati recipe database (50-100 authentic) + Indian regional filters + community contributions
- **Phase 3 (later):** Edamam API (nutritional focus) + cultural/seasonal menus

---

### Feature 4B: Meal Planner Card (Dashboard Widget) ✅

**Card display (collapsed):**
- Today's meals (Breakfast, Lunch, Dinner) + Tomorrow's preview
- Quick actions: "View full week", "Add to shopping list", "Change dinner"
- Mobile optimized (touch-friendly buttons)

**Expanded view (on tap):**
- **Left side:** Rolling 7-day calendar grid
  - Days: Mon-Sun (rolling, always next 7 days from today)
  - Columns: Breakfast, Lunch, Snack, Dinner
  - Drag-and-drop zones for each meal slot
  - Shows currently planned meals
- **Right side:** Recipe options panel
  - Search/filter recipes (all sources)
  - Scrollable recipe cards
  - Drag recipes → drop on calendar slot
  - Click recipe → full details (ingredients, instructions, time)
  - "Random meal" button
- **Interactions:**
  - Drag-and-drop
  - Swipe left/right to navigate weeks
  - "Add to shopping" (entire week's ingredients)
  - "Clear week" (reset all meals)

---

### Feature 5: Family Announcement Banner ✅

**Banner location & visibility:**
- Top of dashboard (always visible, 80-120px height)
- Auto-rotate between messages (10-15s, configurable)
- Priority display (most urgent shows first)

**Message types & priority:**

| Type | Priority | Duration | Example |
|------|----------|----------|---------|
| 🔴 **Critical** | Immediate | Until dismissed | "School closed today" |
| 🟠 **Important** | High | Visible all day | "Trash pickup today 7 AM" |
| 🟡 **Countdown** | Medium | Until event | "School starts in 30 min" |
| 🟢 **Fun** | Low | Can rotate | "Great job on chores!" |

**Message sources:**
- ✅ Calendar-triggered (countdown, event reminders, holidays)
- ✅ Weather-triggered (severe warnings, alerts)
- ✅ Chore/task reminders (trash, HVAC, recycling)
- ✅ Parent-posted announcements (custom messages, schedule changes)
- ✅ Seasonal/holiday (countdowns: Diwali, Holi, Christmas, Thanksgiving)
- ✅ Achievement notifications (badges, milestones, new meals)

**Display & interaction:**
- Color-coded by priority (red/orange/yellow/green)
- Icon + text format
- Animated background (pulse, gradient shift)
- Tap to view full details
- Swipe for next announcement
- X button to dismiss
- Settings icon to configure

**Scheduling:**
- School countdown: 30 min before start
- Trash reminder: 6 AM on trash day
- Birthday countdown: Days before (customizable)
- Holiday countdown: Auto-show based on cultural calendar
- Weather alerts: When condition triggers
- Parent announcement: Immediately when posted

**Content personalization:**
- School-specific (show Krish's school, not all)
- Cultural calendar (Indian holidays + US holidays)
- Family-specific (relevant to specific kids)
- Timezone-aware (correct times for remote family)

**Mobile appearance:**
- Banner at top (same as monitor)
- Fullscreen option (tap to expand)
- Push notification (critical only)

**Final features:**
- ✅ Snooze functionality (hide, remind later in X minutes)
- ✅ Acknowledgment (everyone can read/acknowledge)
  - Parent can re-post same announcement via mobile/Parent Portal
- ✅ Activity Board sync (only show relevant announcements to that user)
- ✅ Critical override (break through Do Not Disturb, but muted display)

**Parent controls (Parent Portal):**
- Create custom announcements (type, priority, schedule)
- Configure holiday calendar (which holidays to count down)
- Message frequency (rotation speed)
- Auto-trigger settings (which events trigger announcements)
- Quiet hours (don't show low-priority 9 PM - 6 AM)
- Archive history (view past announcements)

**Animation & attention:**
- Critical alerts: Bold red, pulsing, sound/vibration
- Important notices: Color shift, subtle bounce
- Fun messages: Gentle glow, celebratory animation
- Respect reduced-motion setting

---

### Feature 6: Night Mode ✅

(Locked in Foundational Architecture - Question 3)

**Specifications:**
- Monitor-only (auto-activate 9 PM - 6 AM, user's local timezone)
- Distraction-free display (minimal text, large visuals)
- Parent can manually toggle on/off anytime
- Not applicable to mobile app

---

## SUMMARY: CORE DASHBOARD COMPLETE ✅

**All 6 features fully locked with comprehensive specifications:**
1. ✅ Clock + Weather Card
2. ✅ Family Calendar
3. ✅ Shopping List
4. ✅ Meal Planner (+ Card widget)
5. ✅ Family Announcement Banner
6. ✅ Night Mode

**Total documentation:**
- 12 Foundational Questions (locked)
- 6 Core Dashboard Features (locked)
- All specifications ready for development

---

**Last Updated:** 2026-06-25  
**Status:** 12 Foundations + 6 Features ALL LOCKED ✅ | Ready for Implementation Planning
