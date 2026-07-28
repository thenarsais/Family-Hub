# Timezone Strategy: Current (v1) and Future (v2+)

**Status:** Implementation strategy for timezone handling  
**Current Phase:** v1 - Option E (UTC + Explicit Preference)  
**Future Phase:** v2 - Option A (Server-Side)

---

## PHASE 1 (v1): Option E - UTC + Explicit Timezone Preference

### Architecture

**Storage:**
- All dates/times stored in ISO UTC format
- Example: `2026-06-17T03:55:00Z` (always UTC, Z = Zulu/UTC)
- Stored in both localStorage and Google Drive (consistent)

**User Settings:**
```javascript
state.settings = {
  timezone: "EST",  // User's explicit preference
  timezoneOffset: -5,  // For display purposes
  timezoneCity: "New York"  // Human-readable
}
```

**Available Timezones:**
```
EST (UTC-5) - Eastern Standard
CST (UTC-6) - Central Standard
MST (UTC-7) - Mountain Standard
PST (UTC-8) - Pacific Standard
GMT (UTC+0) - Greenwich Mean Time
CET (UTC+1) - Central European
IST (UTC+5:30) - Indian Standard (Gujarati!)
JST (UTC+9) - Japan Standard
AEST (UTC+10) - Australian Eastern
... (add others as needed)
```

### Implementation Details

**Midnight Calculation (v1):**
```javascript
function getMidnightUTC(userTimezone) {
  // User's stored timezone (e.g., "EST" = UTC-5)
  // Get current UTC time
  const now = new Date();
  
  // Calculate "midnight" in user's timezone
  const userLocalTime = new Date(now.getTime() + (timezoneOffset * 60 * 60 * 1000));
  const midnightLocal = new Date(userLocalTime);
  midnightLocal.setHours(0, 0, 0, 0);
  
  // Convert back to UTC
  const midnightUTC = new Date(midnightLocal.getTime() - (timezoneOffset * 60 * 60 * 1000));
  
  return midnightUTC.toISOString();
}
```

**Daily Reset Check:**
```javascript
function shouldResetDaily(lastResetUTC, userTimezone) {
  // Check if we've crossed midnight in user's timezone since last reset
  const lastReset = new Date(lastResetUTC);
  const now = new Date();
  
  const lastResetLocal = new Date(lastReset.getTime() + (timezoneOffset * 60 * 60 * 1000));
  const nowLocal = new Date(now.getTime() + (timezoneOffset * 60 * 60 * 1000));
  
  return lastResetLocal.toDateString() !== nowLocal.toDateString();
}
```

**Google Drive Sync:**
- All dates sent to Drive in UTC
- On restore, read UTC dates and convert for display

### User Experience (v1)

**Timezone Setup (Onboarding):**
```
Welcome to Activity Board!
"What's your timezone?"
[Dropdown: EST, CST, MST, PST, GMT, CET, IST, JST, AEST, ...]

Or: [Auto-detect from browser] [Manual entry]
```

**If User Travels:**
1. User travels from EST to PST (3-hour difference)
2. Opens app in PST
3. System shows: "Your timezone is EST (last set in NYC)"
4. User taps Settings → Timezone
5. Changes to "PST"
6. System recalculates all reset times
7. Daily reset happens at PST midnight (not EST)

**Display Format:**
- Show time as user's local timezone: "Last played: 3:45 PM EST"
- Store as UTC: `2026-06-17T19:45:00Z`

### Limitations (v1)

- ❌ Doesn't handle device clock errors well
- ❌ If user forgets to update timezone when traveling, resets off by hours
- ❌ No validation of "is user really in PST or pretending?"
- ❌ Edge cases at exact midnight boundary

### Testing Checklist (v1)

- [ ] Test timezone calculation for all 12 timezones
- [ ] Test daily reset happens at correct local midnight
- [ ] Test changing timezone mid-week
- [ ] Test Google Drive sync with UTC dates
- [ ] Test timezone offset calculations (+5:30 for IST, etc.)
- [ ] Test daylight saving time edge cases (if relevant)

---

## PHASE 2 (v2+): Option A - Server-Side Timezone

### Why Migrate to Server-Side

**Current Limitations:**
- Device clock could be wrong (user has 2030 date set)
- User might forget to update timezone when traveling
- No validation of actual location
- Manual timezone selection error-prone

**Server-Side Benefits:**
- Server provides authoritative time (not device-dependent)
- Can detect timezone anomalies (traveling too fast between timezones)
- Can validate actual location (IP geolocation)
- No timezone preference changes needed by user

### Architecture (v2)

**Backend Service (Google Cloud Functions):**
```javascript
// Cloud Function: GET /api/current-time
exports.getCurrentTime = (req, res) => {
  // Server returns current UTC time
  // Client compares with device time
  // If difference > 1 hour, flag error
  
  res.json({
    serverTimeUTC: new Date().toISOString(),
    userTimezone: getUserTimezoneFromIP(req.ip),  // Geo-IP lookup
    suggestedTimezone: geoIPResult.timezone
  });
}

// Cloud Function: POST /api/reset-check
exports.checkDailyReset = (req, res) => {
  // Server verifies if daily reset should happen
  // Based on server time + user's timezone
  // Returns authoritative yes/no
  
  const userTimezone = req.body.timezone;
  const serverTime = new Date();
  
  const isMidnight = isUserMidnightNow(serverTime, userTimezone);
  
  res.json({
    shouldReset: isMidnight,
    nextResetTime: getNextMidnightUTC(userTimezone)
  });
}
```

**Data Flow (v2):**
1. **Client:** "Is it midnight?" (sends current UTC time + timezone)
2. **Server:** "Let me check... yes, it's midnight in your timezone"
3. **Server returns:** Authoritative reset signal
4. **Client:** Updates state with server confirmation

### Benefits (v2)

- ✅ Device clock errors don't matter (server is source of truth)
- ✅ Automatic timezone detection (IP geolocation)
- ✅ Can detect suspicious patterns (multiple timezones in 10 minutes)
- ✅ Scales to multi-user (each user has authenticated session)
- ✅ Can add features like "best play time analysis" server-side

### Implementation Path (v2)

**Step 1: Choose Backend**
- [ ] Google Cloud Functions (recommended - integrates with Drive)
- [ ] Firebase Realtime Database
- [ ] AWS Lambda
- [ ] Other

**Step 2: Design API Endpoints**
- `GET /api/current-time` → Server time + user timezone
- `POST /api/validate-activity` → Validate game result didn't happen at impossible time
- `GET /api/next-reset-time` → When next reset happens for user

**Step 3: Migrate Data**
- Move "last reset" timestamps from localStorage to server
- Move timezone preference to server (authenticated per user)
- Keep UTC format throughout

**Step 4: Client-Side Changes**
- Call server for timezone validation
- Use server time for reset checks instead of device time
- Fall back to Option E if server unreachable (offline mode)

### Offline Behavior (v2)

**When server unreachable:**
- Client falls back to Option E (device timezone + UTC)
- Syncs with server when connection restored
- Server resolves any discrepancies

**Conflict Resolution:**
- Server time is authoritative
- If device time is ahead (user tried to cheat), server corrects it
- If device time is behind, server catches up user

### Timeline for v2 Migration

**Estimated effort:** 2-3 weeks
- Week 1: Backend setup, API design
- Week 2: Client integration, testing
- Week 3: Rollout, monitoring

**Trigger for migration:**
- After v1 stable for 1+ month
- Once multi-user support needed
- If timezone bugs surface in real use

---

## Comparison: v1 vs v2

| Feature | v1 (Option E) | v2 (Option A) |
|---------|---------------|---------------|
| **Timezone handling** | Device + user preference | Server authoritative |
| **Device clock errors** | Vulnerable | Immune |
| **Travel support** | Manual update needed | Auto-detected |
| **Complexity** | Simple | Complex |
| **Backend needed** | No | Yes |
| **Offline support** | Works | Limited |
| **Setup time** | Minimal | 2-3 weeks |
| **Maintenance** | Low | Moderate |

---

## DECISION SUMMARY

**v1 (Current Build):**
- Use Option E (UTC storage + explicit timezone preference)
- Requires user to set timezone once in Settings
- Requires manual update if traveling
- Simple, works for single-device use case
- Good enough for launch

**v2 (Future Upgrade):**
- Migrate to Option A (server-side with Google Cloud Functions)
- Automatic timezone detection
- Server is source of truth for time
- Better for multi-device/multi-user
- Implement after v1 stable

**Both approaches:**
- Store all times as UTC (consistent format)
- Display as user's local timezone
- Easy to debug and maintain

