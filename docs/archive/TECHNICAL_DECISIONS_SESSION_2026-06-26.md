# Family Hub - Technical Decisions & Architecture (Session 2026-06-26)

**Date:** 2026-06-26  
**Status:** All Critical Questions Locked ✅  
**Next Steps:** Implementation Planning Phase

---

## Executive Summary

Comprehensive technical specification for Family Hub platform including:
- All 7 critical architecture questions answered and locked
- Complete tech stack (frontend, backend, libraries, services)
- Platform strategy (Flutter multi-platform)
- Smart home integration approach (Home Assistant v1 → Custom Server v2)
- Implementation roadmap ready for Phase 1

---

## CRITICAL QUESTIONS - ALL LOCKED ✅

### #1: Data Sync Latency ✅

**Decision: Two-Tier Sync Strategy**

```
Parent Updates (30-60 seconds):
├─ Parent marks chore done on monitor
├─ Parent adjusts points on Parent Portal
├─ Parent creates announcement
├─ Method: REST polling every 30-60 seconds
└─ Visible on monitor within 30-60 seconds

Krish Activity Board Updates (1-2 minutes):
├─ Krish completes quest on mobile
├─ Krish logs mood on mobile
├─ Krish earns points on mobile
├─ Method: REST polling every 60-120 seconds
└─ Syncs to monitor/backend within 1-2 minutes

Rationale:
├─ Monitor is primary (parent updates prioritized)
├─ Activity Board is secondary (not heavily used initially)
├─ Simple REST polling (no complex WebSocket)
├─ All configurable in database (no code changes for tuning)
└─ Can switch to WebSocket later if needed
```

---

### #2: Offline Behavior & Queueing ✅

**Decision: Full Offline Support with Smart Queueing**

```
All Devices Work Offline:
├─ Monitor (cached HA Dashboard data)
├─ Mobile Activity Board app (all activities work)
├─ Parent Portal app (read-only, no changes)
└─ Mini PC (queues actions, syncs on reconnect)

Queueing Strategy:
├─ Keep queued indefinitely (don't discard)
├─ Don't delete from local storage until confirmed synced
├─ If device reboots: queue survives
├─ Batch all together when syncing
└─ Process atomically (all-or-nothing)

Additional Considerations:
├─ Retry logic: Exponential backoff (5s → 15s → 30s)
├─ Data freshness on app startup: Immediate full fetch, then polling
├─ Notification deduplication: Don't push if app already open
├─ Storage limits: 500 MB cache, delete old synced data first
├─ Sync progress visibility: Simple "Syncing..." indicator (no progress bar)
├─ Lazy-load older data: Load recent on startup, older on scroll
└─ Timestamps: Use device time for actions, server time on sync
```

---

### #3: Krish Login Method ✅

**Decision: PIN or Pattern (4-digit minimum pattern)**

```
Both Enabled - Krish Chooses:

4-Digit PIN:
├─ On-screen keyboard (tap-based)
├─ Quick entry (5 seconds max)
├─ Can change anytime in settings
├─ Parent can also change if Krish forgets

Pattern Authentication:
├─ Draw on 3×3 grid
├─ Minimum 4 connected nodes
├─ User choice: Show path while drawing or not
├─ Faster than PIN (3 seconds)
├─ More intuitive for kids

Additional Features:
├─ Failed login lockout: 5 attempts → 5-min lockout
├─ Parent can reset anytime from Parent Portal
├─ Krish can change own PIN/pattern anytime in Settings
├─ Session timeout: 8 hours auto-logout
├─ Manual logout always available

No Biometric in v1
└─ Can add fingerprint/face in v2 if hardware supports
```

---

### #4: Parent 2FA (Two-Factor Authentication) ✅

**Decision: 2FA Optional, OFF by Default**

```
Methods Available:
├─ SMS (send code to phone)
├─ Email (send code to email address)
├─ Authenticator App (Google/Microsoft authenticator)
└─ None (password-only, not recommended)

Default Behavior:
├─ Optional: Parent can enable/disable anytime
├─ Default: OFF (less friction for family context)
├─ Trust this device: 30-day duration
│  ├─ Monitor: Can enable (safe home device)
│  ├─ Parent's phone: Can enable (reduces friction)
│  └─ Parent's laptop: Can enable (depends on setup)
└─ Recovery codes: 10 auto-generated on setup

Setup Flow:
├─ First login: Create password
├─ 2FA screen with explanation
├─ Parent chooses method
├─ Set up and test
└─ Account ready

Special Cases:
├─ Lost phone/access: Use recovery codes
├─ Can regenerate codes anytime
└─ Parent can reset their own 2FA from secure email
```

---

### #5: Push Notification Strategy ✅

**Decision: Smart, Non-Intrusive Notifications**

```
For Krish (Activity Board):

SEND PUSH:
├─ Badge unlocked (celebratory, motivational)
├─ 7-day/30-day/100-day streak milestone (big achievement)
├─ Daily goal achieved (encouraging)
├─ Announcement from parent (important message)
└─ Major milestone (goal completed, etc.)

IN-APP ONLY:
├─ Quest completed (frequent)
├─ Points earned (too many per day)
├─ Habit checked (frequent)
└─ User sees badges when opening app

Do-Not-Disturb:
├─ Default: 9 PM - 8 AM (school nights)
├─ Parent can customize in Parent Portal
├─ Critical alerts still come through
└─ Krish sees badge count while quiet hours active

For Parents (Parent Portal):

SEND PUSH:
├─ Flagged/suspicious activity detected (alert)
├─ Daily summary digest (1x/day, configurable time)
├─ Krish achieved major milestone (celebratory)
└─ Recovery day recommended (helpful)

IN-APP ONLY:
├─ Activity logs
├─ Analytics updates
└─ Status changes

Optional (Parent can enable/disable):
├─ All activity notifications (constant stream)
├─ Hourly summaries (detailed)
├─ Weekly email report (v2)
└─ Anomaly alerts (unusual patterns)

Delivery Methods:
├─ Mobile: Firebase Cloud Messaging (FCM)
├─ Monitor: In-app toast notification
├─ Parent Portal: In-app badge + push
├─ Sounds: Default on, customizable per event type
├─ Do-not-disturb: Silent (vibrate only or nothing)
└─ Parent can override quiet hours for critical alerts
```

---

### #6: Calendar Integration APIs ✅

**Decision: Full Bidirectional Sync with 3 APIs**

```
Supported APIs (v1):
├─ Google Calendar API
│  ├─ OAuth sign-in
│  ├─ Most common (Gmail users)
│  └─ Bidirectional sync
├─ Microsoft Outlook/Exchange
│  ├─ Microsoft Graph API
│  ├─ Office 365 users
│  └─ Bidirectional sync
├─ Apple Calendar (iCloud)
│  ├─ CalDAV protocol
│  ├─ macOS/iOS users
│  └─ Bidirectional sync
└─ CalDAV Generic (future)

Sync Architecture:
├─ Bidirectional: FULL read/write in v1
├─ Frequency: Every 30 seconds (non-critical, REST polling)
├─ OAuth: Full read/write scope (calendar permissions)
├─ Multiple calendars: Parent can add multiple per provider
├─ Parent control visibility: All shown by default, parent hides what they want

Recurring Events:
├─ Expand to individual instances (12-week window)
├─ Each instance can be edited independently
├─ Preserve recurring rule for sync back to source
├─ Parent can edit one instance without affecting series
├─ Show all instances on calendar for visibility

Event Creation from HA Dashboard:
├─ Full form available:
│  ├─ Title (required)
│  ├─ Date & time (required)
│  ├─ Duration (required)
│  ├─ Category (meal, school, appointment, personal, etc.)
│  ├─ Calendar to sync to (Google, Outlook, Apple, or HA-only)
│  ├─ Recurrence (one-time, weekly, monthly, etc.)
│  └─ Notes (optional)

Timezone Handling:
├─ Convert all to local time (user's device timezone)
├─ Store original timezone for sync back
├─ No confusion about time zones

Conflict Resolution:
├─ Last-write-wins with timestamp comparison
├─ Whichever source edited most recently wins
├─ Log conflicts for monitoring
├─ Timestamps prevent data loss

Revoked Access:
├─ Keep cached events if calendar disconnected
├─ Won't sync new changes
├─ User can reconnect to re-sync
└─ No event loss

All-Day Events:
├─ Styled differently in calendar UI
├─ Clear visual distinction from timed events
└─ Proper handling for recurring all-day events

Activity Board to Calendar:
├─ NOT synced to calendar APIs
├─ Activities stay in Activity Board calendar only
├─ Keeps systems cleanly separated
└─ Parent adds events through HA Dashboard if they want on calendar
```

---

### #7: Home Assistant Integration ✅

**Decision: Home Assistant v1 → Custom Server v2**

```
V1 IMPLEMENTATION: Home Assistant

Connection Method:
├─ REST API for device control
├─ WebSocket for real-time sync
├─ Long-lived access token authentication
└─ No admin panel access (safe, limited scope)

Setup Flow:
├─ Parent creates long-lived token in HA
├─ Parent enters: HA URL + token in Flutter app
├─ Test connection
├─ [Connected] ✓
└─ Device discovery auto-populates

Device Control Scope (7 Device Types):
├─ Lights (on/off, brightness, color)
├─ Thermostat (set temperature)
├─ Door locks (lock/unlock)
├─ Speakers (volume, play sound)
├─ Plugs/switches (on/off)
├─ TVs (on/off, input)
└─ Cameras (view status, trigger recording)

Cannot Control:
├─ Core HA functionality
├─ Settings/configuration
├─ Other integrations
└─ User management

Rate Limiting:
├─ 5 automations per minute per device
├─ 20 automations per hour total
├─ Behavior: Queue (don't discard)
└─ Parent can override if needed

Error Handling:
├─ Retry logic: Exponential backoff (5s → 15s → 30s)
├─ Graceful degradation: Show cached state if offline
├─ User-friendly error messages
└─ Queue locally if HA unreachable

Real-Time Sync:
├─ WebSocket for instant state updates
├─ Fallback to REST polling if WebSocket drops
├─ All devices stay in sync across apps
└─ <1 second latency for state changes

Security:
├─ Token-based auth (no password)
├─ Token stored encrypted locally
├─ Parent can revoke anytime
└─ Limited scope (no HA admin access)

V2 MIGRATION PLAN: Custom Lightweight Server

Timeline: v2 (future)
├─ Migrate to lightweight custom automation server
├─ No user-facing changes
├─ Gradual migration (no rush)
└─ Lighter architecture long-term

Benefits of V2 Migration:
├─ Reduce resource usage on mini PC
├─ Simpler setup for parents (less HA config)
├─ Custom automation engine (purpose-built)
├─ Same device control interface
├─ Full control over features
└─ Can improve based on v1 user feedback
```

---

## Platform & Architecture Decisions

### Platform Strategy ✅

```
Primary Display:
├─ 27" touchscreen monitor (family hub center)
├─ Connected to mini PC via HDMI
├─ Always-on, smart display mode
├─ Shows HA Dashboard or Activity Board
└─ Wakes with motion detection, shows screensaver/clock at night

Mini PC Hardware:
├─ Model: Intel NUC or ASUS PN50 (TBD)
├─ OS: Linux (Ubuntu) or Windows
├─ Runs: Flutter app (full-screen)
├─ Internet: WiFi or Ethernet
├─ Power: Consistent, auto-restart on power recovery

Motion Detection:
├─ PIR sensor (starting approach)
├─ Option C hybrid: PIR + camera (future)
├─ Wakes monitor from screensaver/clock
├─ Implementation details in v1, needs help with sensor integration

Display Management:
├─ Flutter app manages all screens
├─ Night mode: Clock or photo album screensaver (9 PM - 6 AM)
├─ Day mode: HA Dashboard default
├─ Activity Board accessible via Activity Board card or hamburger menu
├─ Parent Portal accessible via hamburger menu (login required)

Power Management:
├─ Always-on (24/7 operation)
├─ Weekly restart (3-4 AM) for maintenance
├─ Auto-restart on power recovery (BIOS setting)
├─ Graceful state recovery on reboot
└─ App auto-launches (systemd service)

Laptop to Mini PC Migration:
├─ Build/test on laptop first
├─ Migrate to mini PC when ready
├─ Data and config transfer plan (v2)
└─ Laptop can serve as backup initially
```

### Monitor Navigation ✅

```
Hamburger Menu (☰) - Primary Navigation:
├─ [Home] → HA Dashboard
├─ [Activity Board] → Krish's games & activities
├─ [Parent Portal] → Management (login required)
├─ [Settings] → System settings
└─ [Help] → Support

Activity Board Card on HA Dashboard:
├─ Direct shortcut to Activity Board
├─ Shows: Krish's name, badges, points, streak, status
├─ Visual design: Option 2 (emoji, badges, points, streak)
├─ One-tap access (faster than menu)
├─ Updates in real-time with dashboard (30-60s sync)

Boot Behavior:
├─ Monitor starts showing HA Dashboard
└─ Quick access to Activity Board via card or menu

Parent Portal Access:
├─ From hamburger menu [Parent Portal]
├─ Login required (email + password + optional 2FA)
├─ Rarely accessed from monitor (mostly from mobile)
└─ Returns to HA Dashboard when done
```

### Initial Setup Flow ✅

```
Phase 1: Parent Onboarding (2-3 min)
├─ Mini PC boots → "Welcome to Family Hub"
├─ Parent creates account (email + password)
├─ 2FA setup (optional, default off)
├─ Parent Portal login successful
└─ Next phase

Phase 2: Walkthrough/Tutorial (3-5 min)
├─ Tour of Parent Portal (optional, can skip)
├─ Tour of HA Dashboard (optional, can skip)
├─ Accessible again via FAQ in hamburger menu
└─ Skip anytime button

Phase 3: Krish Account Setup (2 min)
├─ Parent creates Krish account
├─ Krish name
├─ Krish avatar selection
├─ Initial PIN or pattern (4-digit min)
├─ Show: "Krish can change PIN/pattern anytime in Settings"
└─ Next phase

Phase 4: Krish's First Login (1-2 min)
├─ Monitor shows: "Enter your PIN to start"
├─ Krish enters PIN/pattern
├─ Activity Board opens with tutorial
│  ├─ "Welcome Krish!" message
│  ├─ Game overview (can skip)
│  ├─ Quest explanation (can skip)
│  └─ Tips & tricks (can skip)
├─ Tutorial accessible again via FAQ
└─ Ready to use!

Phase 5: Configuration (5 min)
├─ Parent returns to Parent Portal
├─ Customize settings:
│  ├─ Daily goal (default 50 pts)
│  ├─ Notification preferences
│  ├─ Do-not-disturb hours
│  ├─ Krish's feature access
│  └─ Monitor display settings (screensaver, motion detection, etc.)
└─ System ready!

Total Setup Time: 15-20 minutes
```

### Account Recovery ✅

```
Parent Password Reset:
├─ Parent Portal login: "Forgot password?"
├─ Email reset link sent (valid 1 hour)
├─ Parent sets new password
├─ Auto-login after reset
└─ No data loss

Krish PIN/Pattern Reset:
├─ Parent Portal → Settings → Krish's Login
├─ "Reset PIN" button
├─ Confirmation required (or 2FA if enabled)
├─ New PIN set immediately
├─ Parent can auto-send to Krish or set manually
└─ Logged as admin action in audit trail
```

---

## Complete Tech Stack ✅

### Backend
```
├─ Supabase + PostgreSQL
│  ├─ Real-time WebSocket subscriptions
│  ├─ Auth built-in (JWT, OAuth)
│  ├─ File storage (backups, exports)
│  ├─ REST API
│  └─ Managed infrastructure
└─ Home Assistant (smart home hub v1)
```

### Frontend
```
├─ Flutter (single codebase)
│  ├─ Android app
│  ├─ iOS app
│  ├─ Web app (desktop/browser)
│  ├─ Linux desktop (mini PC)
│  └─ Material 3 UI
├─ Riverpod (state management)
├─ GoRouter (type-safe routing)
├─ Isar (local offline storage)
└─ Dio (HTTP client)
```

### Libraries & Services
```
├─ Code Generation:
│  ├─ json_serializable (model serialization)
│  └─ freezed (immutable models)
├─ Dependency Injection:
│  └─ GetIt (service locator)
├─ Visualizations:
│  └─ fl_chart (charts & graphs)
├─ Notifications:
│  └─ Firebase Cloud Messaging (FCM)
├─ Analytics:
│  └─ Firebase Analytics
└─ Error Tracking:
   └─ Sentry (crash reporting)
```

### Environment Configuration
```
V1: Simple approach
├─ Hardcoded Supabase URL
├─ Single environment
└─ Works fine during dev

V2: Multi-environment
├─ Dev environment (localhost Supabase)
├─ Staging environment (staging.supabase.io)
├─ Production environment (prod.supabase.io)
├─ Managed via build flavors & CI/CD
└─ Easy to manage different configs
```

---

## Supporting Decisions

### Account Model ✅

**Single Shared Parent Login with Multi-Child Support (v2)**

```
V1: Single Child
├─ Parent creates account
├─ Parent creates Krish's account
├─ PIN/pattern for Krish
├─ Shared parent login (email + password)
└─ Works perfectly for single child

V2: Multiple Children
├─ Same parent login
├─ Multiple child accounts
├─ Each child has own PIN/pattern
├─ Each child's data isolated in database
├─ Architecture supports this in v1 (just not UI for it)
└─ Easy to unlock in v2 when needed
```

### Krish's Privacy & Transparency ✅

```
Full Transparency Model:
├─ Parent can see everything (activity, mood, achievements)
├─ No private entries in Activity Board
├─ No hidden activities or data
├─ Parent monitoring is transparent to Krish
├─ This is family context (trust-based)
└─ All audit trails available in Parent Portal
```

### Data Retention ✅

```
Permanent Storage:
├─ Activity history: Keep forever
├─ Achievements/badges: Keep forever (permanent record)
├─ Points ledger: Keep forever (historical context)
├─ Mood entries: Keep forever (trend analysis)
└─ Conflicts log: Keep for debugging/monitoring

Configurable Later:
├─ Calendar sync history: User can decide (v2)
├─ Activity logs: Potentially auto-delete (v2)
└─ Analytics data: Retention policy (v2)
```

### Weekly Restart Maintenance ✅

```
Automatic Weekly Restart:
├─ When: 3-4 AM (night hours, no usage)
├─ Frequency: Once per week
├─ Trigger: Systemd timer or cron job
├─ Process:
│  ├─ Graceful shutdown
│  ├─ Restart mini PC
│  ├─ App auto-launches
│  ├─ Back online (2-3 seconds)
│  └─ Family wakes to fresh system
├─ Benefits:
│  ├─ Clear memory (prevent slow drift)
│  ├─ Fresh connections to services
│  ├─ Natural maintenance window
│  └─ Transparent (happens during sleep)
└─ Configurable in settings (day/time)
```

### App Updates ✅

```
V1: Auto-Update (Simple)
├─ Flutter app auto-updates
├─ No manual update setup needed
├─ User sees: "Updating app..." banner
├─ Process: Download → Install → Restart app
├─ No disruption (happens in background)
└─ Automatic, transparent

V2: Enhanced (Optional)
├─ Configure auto-update windows
├─ Staged rollout (5% → 25% → 100%)
├─ Rollback capability
└─ More sophisticated version management
```

---

## Implementation Roadmap (Next Steps)

### Phase 1: Technical Architecture Planning
- Create detailed API specifications (endpoints, request/response)
- Design database schema (PostgreSQL)
- Create component architecture (Flutter modules)
- Design state management flow (Riverpod setup)
- Document integration points (Supabase, Home Assistant, Firebase)

### Phase 2: Development Environment Setup
- Flutter project setup
- Supabase project setup
- Firebase project setup (notifications, analytics, crashlytics)
- Home Assistant test environment
- Mini PC hardware selection (NUC or ASUS PN50)
- PIR sensor integration planning

### Phase 3: MVP Build (Activity Board Focus)
- Core state management
- Basic UI framework
- Games module (4 games)
- Trivia system
- Points/badges system
- Offline functionality

### Phase 4: Dashboard & Integration
- HA Dashboard implementation
- Home Assistant integration
- Calendar sync
- Real-time sync infrastructure

### Phase 5: Parent Portal & Polish
- Parent Portal implementation
- Analytics & insights
- User management
- Smart home automations

---

## Notes for Future Sessions

1. **PIR Sensor Implementation:** Need help integrating HC-SR501 (or similar) PIR sensor with mini PC for motion detection wake-up

2. **Mini PC Hardware Selection:** Final decision between Intel NUC and ASUS PN50 (or other options) - consider CPU, RAM, power consumption, size

3. **HA Setup & Configuration:** Plan for how parent will set up Home Assistant instance on mini PC (YAML config vs. UI-based)

4. **Multi-Child Support:** Designed for v2, but foundation is in place (database schema supports multiple children)

5. **Custom Server Migration (v2):** When ready, migrate away from HA to lightweight custom automation server

6. **Laptop to Mini PC Migration:** Document process for transferring development to mini PC hardware

---

## Decision Lock Status

| Decision | Status | Details |
|----------|--------|---------|
| Data Sync Latency | ✅ LOCKED | 30-60s parent, 1-2 min Krish, configurable |
| Offline Behavior | ✅ LOCKED | Full offline, smart queueing, retry logic |
| Krish Login | ✅ LOCKED | PIN or pattern (4-digit min), both options |
| Parent 2FA | ✅ LOCKED | Optional, OFF by default, SMS/Email/App |
| Notifications | ✅ LOCKED | Smart push strategy, quiet hours, delivery methods |
| Calendar APIs | ✅ LOCKED | Google/Outlook/Apple, full bidirectional, 12-week recurring |
| Home Assistant | ✅ LOCKED | v1 with HA, migrate to custom server v2 |
| Platform & Architecture | ✅ LOCKED | Flutter multi-platform, Supabase backend, mini PC host |
| Tech Stack | ✅ LOCKED | All 11 major tools/services selected |
| Supporting Decisions | ✅ LOCKED | Setup, account model, privacy, data retention, updates |

---

**Ready for implementation planning in next session.**
