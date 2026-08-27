# Google Calendar Integration Setup Guide

## ✅ What's Been Done

The backend is now ready for Google Calendar integration! Here's what was implemented:

### Backend Services
- **Google OAuth Service** (`backend/src/services/google-oauth.ts`)
  - Handles OAuth2 flow with Google
  - Manages access token storage and refresh
  - Fetches events from Google Calendar API
  - Declines an invite in Google Calendar when the user dismisses it on the dashboard
  - Revokes tokens when disconnecting

> **OAuth scope:** `https://www.googleapis.com/auth/calendar.events` (read + write
> to events). It was `calendar.readonly` before two-way dismiss sync; the auth URL
> now also sends `prompt=consent` so already-connected users re-grant on their next
> reconnect. A token that still only has `calendar.readonly` keeps working for
> reads — a dismiss just falls back to a local hide and the calendar shows a
> "Reconnect" prompt.

### Backend Routes
- **POST /auth/google** - Start OAuth authorization
- **GET /auth/google/callback** - Handle OAuth callback
- **GET /calendar/google/events** - Fetch user's Google Calendar events
- **POST /calendar/google/disconnect** - Disconnect Google Calendar

### Database
- **New Table**: `user_integrations`
  - Stores OAuth tokens per provider
  - Tracks active integrations
  - Automatic token expiration tracking
  - Row-level security enabled

### Dependencies
- Added `googleapis` package for Google API client

---

## 🔑 Step 1: Get Your Client Secret from Google Cloud

You have the **Client ID**, but need the **Client Secret**:

### In Google Cloud Console:

1. Go to https://console.cloud.google.com/auth/clients?project=helpful-kit-496320-n6
2. Click on "Family Hub Calendar" credential
3. Click "Show" next to "Client Secret"
4. Copy the secret value
5. Keep it safe - don't commit to git!

**Your Client ID:**
```
531710622003-uukrv9l69iamug40ipk450kpr11jakmk.apps.googleusercontent.com
```

---

## 🔐 Step 2: Add Client Secret to .env

Update `backend/.env.local`:

```env
GOOGLE_CLIENT_ID=531710622003-uukrv9l69iamug40ipk450kpr11jakmk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<paste-your-secret-here>
BACKEND_URL=http://localhost:3000
```

⚠️ **Never commit .env.local to git** - it contains secrets!

---

## 📦 Step 3: Install Dependencies & Run Migration

```bash
# Install new package
cd backend
npm install

# Run database migration to create user_integrations table
npm run migrate
```

This creates the `user_integrations` table where OAuth tokens are stored.

---

## 🧪 Step 4: Test the Integration

### Start the backend:
```bash
cd backend
npm run dev
```

### Test OAuth flow:

**1. Get Auth URL:**
```bash
curl -X GET http://localhost:3000/api/calendar/auth/google \
  -H "x-user-id: test-user-id"
```

Response:
```json
{
  "status": "success",
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

**2. User visits the authUrl and authorizes**
- Google redirects to: `http://localhost:3000/auth/google/callback?code=...&state=...`
- Backend exchanges code for token and stores in database

**3. Fetch Google Calendar events:**
```bash
curl -X GET http://localhost:3000/api/calendar/google/events \
  -H "x-user-id: test-user-id"
```

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": "event-id-123",
      "summary": "Family Dinner",
      "start": { "dateTime": "2026-08-15T18:00:00-06:00" },
      "end": { "dateTime": "2026-08-15T19:30:00-06:00" },
      "location": "Home"
    }
  ],
  "source": "google_calendar"
}
```

---

## 🔄 API Endpoints

### Start OAuth Flow
```
GET /api/calendar/auth/google
Headers: x-user-id: <user-id>

Response: { authUrl: "https://accounts.google.com/..." }
```

### OAuth Callback (automatic)
```
GET /auth/google/callback?code=AUTH_CODE&state=USER_ID
Handled by backend, redirects to frontend
```

### Get Google Calendar Events
```
GET /api/calendar/google/events
Headers: x-user-id: <user-id>
Query params (optional):
  - timeMin: ISO 8601 start time
  - timeMax: ISO 8601 end time
  - maxResults: number (default 10)

Response: { status: "success", data: [...events], source: "google_calendar" }
```

### Disconnect Google Calendar
```
POST /api/calendar/google/disconnect
Headers: x-user-id: <user-id>

Response: { status: "success", message: "Google Calendar disconnected" }
```

---

## 🛡️ Security Notes

1. **Tokens are stored encrypted** in Supabase
2. **Row-level security** prevents users from accessing other users' tokens
3. **Automatic token refresh** - when token expires, a refresh token is used
4. **No token expiration risk** - expired tokens are automatically refreshed before use

---

## 📱 Frontend Integration (Next Step)

Once backend is working:

1. **Update Calendar Hook** - modify `frontend/src/hooks/useCalendar.ts` to:
   - Detect if user has connected Google Calendar
   - Fetch from `/api/calendar/google/events` if connected
   - Fall back to local events otherwise

2. **Add Connect Button** - in calendar widget:
   - Show "Connect to Google Calendar" button
   - On click, redirect to OAuth URL from `/auth/google` endpoint
   - Handle redirect back from Google

3. **Merge Events** - combine local + Google Calendar events

---

## 🐛 Troubleshooting

### "Invalid authorization code"
- Ensure Client Secret is correct
- Check authorization code hasn't expired (valid for ~10 minutes)

### "Token revoked"
- User revoked access in Google Account Settings
- Need to re-authorize via OAuth flow

### "user_integrations table doesn't exist"
- Run: `npm run migrate`
- Check Supabase dashboard for table

### "Access token refresh failed"
- Check that refresh_token is stored in database
- Verify GOOGLE_CLIENT_SECRET is set correctly

---

## 📋 Checklist

- [ ] Copy Client Secret from Google Cloud Console
- [ ] Paste GOOGLE_CLIENT_SECRET in backend/.env.local
- [ ] Run `npm install` in backend directory
- [ ] Run `npm run migrate` to create user_integrations table
- [ ] Start backend: `npm run dev`
- [ ] Test OAuth endpoints with curl
- [ ] Update frontend calendar hook to use Google events
- [ ] Add "Connect to Google Calendar" button to UI
- [ ] Test full flow end-to-end

---

## 📚 References

- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm package](https://github.com/googleapis/google-api-nodejs-client)

---

## Next Phase

After verifying the backend works:
1. Update frontend calendar hook to use real Google Calendar
2. Add OAuth connection UI
3. Display merged calendar (local + Google events)
4. Test with real user calendar
