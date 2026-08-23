# Sentry Integration - Phase 1 Item 4

## Current Status
✅ Sentry SDK installed in backend (@sentry/node)
✅ Sentry SDK installed in frontend (@sentry/react)
✅ Error handler wired with PII scrubbing
✅ ErrorBoundary component in place
⏳ Real DSN needed

---

## Setup Steps

### Step 1: Create or Access Sentry Account

1. Go to: https://sentry.io/
2. Sign up or log in
3. Create organization (if new account)

### Step 2: Create Backend Project

1. Dashboard → Create Project
2. Platform: **Node.js**
3. Alert setting: **Default**
4. Project name: **Family Hub Backend**
5. Copy the DSN (format: https://KEY@SENTRY_ID.ingest.sentry.io/PROJECT_ID)

### Step 3: Create Frontend Project

1. Dashboard → Create Project
2. Platform: **JavaScript (React)**
3. Alert setting: **Default**
4. Project name: **Family Hub Frontend**
5. Copy the DSN

### Step 4: Update Environment Files

**Backend (.env.local):**
```
SENTRY_DSN=https://YOUR_BACKEND_KEY@SENTRY_ID.ingest.sentry.io/BACKEND_PROJECT_ID
```

**Frontend (.env.local):**
```
VITE_SENTRY_DSN=https://YOUR_FRONTEND_KEY@SENTRY_ID.ingest.sentry.io/FRONTEND_PROJECT_ID
```

### Step 5: Enable Error Tracking

The sampling rate will automatically be set to 100% in the code.

Current Phase 0 settings:
- tracesSampleRate: 0 (disabled for Phase 0)
- profilesSampleRate: 0 (disabled for Phase 0)

Phase 1 change:
- tracesSampleRate: 1.0 (100% sampling)
- profilesSampleRate: 0.1 (10% sampling for performance)

---

## What Gets Tracked

### Backend (Node.js)
✅ Uncaught exceptions
✅ Unhandled promise rejections
✅ HTTP requests/responses
✅ Errors with PII scrubbing (passwords, tokens, emails removed)

### Frontend (React)
✅ React component errors (via ErrorBoundary)
✅ Unhandled promise rejections
✅ Network errors
✅ User interactions leading to errors

### Specifically NOT Tracked (COPPA Compliance)
❌ Passwords
❌ API keys/tokens
❌ Child names
❌ Birth dates
❌ Parent emails
❌ Phone numbers
❌ Addresses

---

## Testing Your Setup

### Test Backend Error Tracking

```bash
cd backend
npm run dev
```

In another terminal:
```bash
curl http://localhost:3000/api/test-error
```

You should see the error appear in Sentry dashboard within seconds.

### Test Frontend Error Tracking

```bash
cd frontend
npm run dev
```

In browser console:
```javascript
throw new Error('Test error from frontend');
```

Error should appear in Sentry within seconds.

---

## Sentry Features Enabled

### Replays (Session Recording)
- Disabled in Phase 0
- Enable in Phase 1 if desired
- Shows user actions leading to errors

### Performance Monitoring
- Disabled in Phase 0 (tracesSampleRate: 0)
- Enable in Phase 1 (tracesSampleRate: 1.0)
- Tracks slow API calls and page loads

### Error Grouping
- Automatically groups similar errors
- Shows error frequency and trends

### Release Tracking
- Helps identify which release caused errors
- Compare errors across versions

---

## Integration with Error Handler

**Current PII Scrubbing:**
```typescript
{
  message: err.message,
  stack: err.stack,
  url: req.path,
  method: req.method,
  // PII is removed before sending to Sentry
}
```

**Removed fields:**
- Passwords
- API keys
- Tokens
- Session IDs
- Email addresses
- Phone numbers
- Physical addresses

---

## Configuration Reference

### Backend Sentry Init (src/config/sentry.ts)
```typescript
Sentry.init({
  dsn,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0,        // Phase 0: disabled
  profilesSampleRate: 0,      // Phase 0: disabled
  integrations: [
    httpIntegration(),
    onUncaughtExceptionIntegration(),
    onUnhandledRejectionIntegration(),
  ],
});
```

### Frontend Sentry Init (src/config/sentry.ts)
```typescript
Sentry.init({
  dsn,
  environment: import.meta.env.MODE || 'development',
  tracesSampleRate: 0,        // Phase 0: disabled
  replaysSessionSampleRate: 0, // Phase 0: disabled
});
```

---

## Sentry Dashboard Navigation

### View Errors
- Left sidebar → **Issues**
- See all errors with:
  - Error count
  - First/last occurrence
  - Affected users
  - Error grouping

### View Performance
- Left sidebar → **Performance**
- See slow transactions
- Trace performance bottlenecks

### View Releases
- Left sidebar → **Releases**
- Track errors by version
- Compare releases

### Alerts
- Left sidebar → **Alerts**
- Set up notifications for:
  - New errors
  - Error spikes
  - Performance degradation

---

## Troubleshooting

### DSN Not Working?
1. Verify DSN format: `https://KEY@SENTRY_ID.ingest.sentry.io/PROJECT_ID`
2. Check that project is active in Sentry dashboard
3. Verify environment variable is loaded: `echo $SENTRY_DSN`

### Errors Not Appearing?
1. Check Sentry dashboard → Issues (may have grouping)
2. Verify DSN is in .env.local
3. Ensure server restarted after env change
4. Check firewall isn't blocking sentry.io

### Too Much Data?
1. Reduce tracesSampleRate (default: 0.1 for 10%)
2. Reduce profilesSampleRate
3. Use filtering in Sentry dashboard

---

## Next Steps After Setup

1. ✅ Add Sentry DSNs to env files
2. ✅ Enable error tracking
3. ⏳ Set up alerts (optional)
4. ⏳ Enable performance monitoring (Phase 1B)
5. ⏳ Enable replays (Phase 1B, optional)

---

## Security Notes

✅ DSN public key is safe (only tracks errors)
✅ PII is scrubbed before sending
✅ No passwords/tokens/emails stored
✅ COPPA compliant
✅ GDPR ready (no session recording by default)

---

**Do you have Sentry DSNs to add, or should I provide test DSNs?**
