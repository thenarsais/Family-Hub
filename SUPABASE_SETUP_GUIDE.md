# Supabase Setup Guide - Phase 1 Item 3

## Current Status
✅ Environment files created
❌ Credentials need verification
⏳ Migrations ready to run

## Step 1: Verify Supabase Dev Project

Your existing project: `kzxnlhwyzcxrnloamkck`

### Get the correct credentials:

1. Go to: https://app.supabase.com/
2. Select project: **kzxnlhwyzcxrnloamkck**
3. Navigate to: **Settings → API**
4. Copy the following values:

```
Project URL: 
  → Copy this to SUPABASE_URL

Anon key (public):
  → Copy this to SUPABASE_ANON_KEY
  
Service role key (secret):
  → Copy this to SUPABASE_SERVICE_KEY
```

## Step 2: Get Database Connection String

1. Go to: **Settings → Database**
2. Look for "Connection pooling"
3. Copy "Session mode" connection string
4. Update DATABASE_URL with this format:
   ```
   postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
   ```

## Step 3: Update Environment Files

### Backend (.env.local)
```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY_HERE
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Step 4: Test Connection

```bash
# Test environment loading
cd backend
npm run build

# If successful, ready for migrations
```

## Step 5: Run Migrations

```bash
cd backend
npm run migrate
```

## Step 6: Seed Development Data (Optional)

```bash
cd backend
npm run seed
```

## Production Setup (Later)

For production, repeat steps 1-6 with a separate Supabase project:
- Create new project in Supabase
- Follow same credential collection
- Create new .env.production file
- Deploy with production credentials

---

## Troubleshooting

### "Invalid API key" error
- ✅ Check that keys are copied completely (no truncation)
- ✅ Verify anon key is used for SUPABASE_ANON_KEY (not service key)
- ✅ Verify service key is used for SUPABASE_SERVICE_KEY (not anon key)

### "ENOTFOUND" error
- ✅ Check internet connection
- ✅ Verify Supabase project URL is correct
- ✅ Check that your network allows outbound HTTPS

### Migrations fail
- ✅ Verify DATABASE_URL is correct
- ✅ Check password doesn't contain special chars (or URL-encode them)
- ✅ Ensure Supabase project is in a running state

---

## Credentials Checklist

Before proceeding, verify you have:

- [ ] SUPABASE_URL (https://xxxxx.supabase.co)
- [ ] SUPABASE_ANON_KEY (starts with eyJhbGc...)
- [ ] SUPABASE_SERVICE_KEY (starts with eyJhbGc...)
- [ ] DATABASE_URL (postgresql://...)

