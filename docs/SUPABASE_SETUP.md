# Supabase Integration Guide
## Real Authentication Setup for Family Hub

**Status:** Task 1B-005 - Setup Instructions  
**Duration:** 2 days  
**Deliverable:** Real Supabase project configured

---

## 🎯 What This Task Does

Replaces placeholder Supabase keys with real project credentials:
- ❌ Before: `SUPABASE_URL=https://placeholder.supabase.co`
- ✅ After: `SUPABASE_URL=https://your-project.supabase.co`

This enables:
- Real user authentication
- Database connection via Supabase
- Real authentication tokens
- Production-ready setup

---

## 📋 Prerequisites

You'll need:
- [ ] Google account (for signup) OR GitHub account
- [ ] Valid email address
- [ ] Access to email inbox (for verification)
- [ ] ~15 minutes to set up

---

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Sign Up"**
3. Choose sign up method:
   - Google
   - GitHub
   - Email (requires password)
4. Follow email verification if needed
5. Complete account setup

---

### Step 2: Create New Project

1. In Supabase dashboard, click **"New project"**
2. Fill in:
   - **Name:** `family-hub` (or `family-hub-staging`)
   - **Database password:** Create strong password (save it!)
   - **Region:** Choose closest to your location
   - **Pricing plan:** Free tier OK for Phase 1B testing

3. Click **"Create new project"** (takes 2-3 minutes)

---

### Step 3: Get Project Credentials

Once project is created:

1. Go to **Settings → API** in left sidebar
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

**Example:**
```
Project URL: https://abcdefg.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 4: Update Local Environment

1. Edit `backend/.env.local`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Edit `backend/.env.staging`:
   ```bash
   SUPABASE_URL=https://your-staging-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Restart Docker:
   ```bash
   docker-compose restart api
   curl http://localhost:3000/health  # Should return {"status":"ok"}
   ```

---

### Step 5: Set GitHub Secrets (for CI/CD)

1. Go to GitHub repo → **Settings → Secrets and variables → Actions**

2. Click **"New repository secret"** for each:

   **SUPABASE_URL (Production)**
   ```
   Name: SUPABASE_URL
   Value: https://your-prod-project.supabase.co
   ```

   **SUPABASE_ANON_KEY (Production)**
   ```
   Name: SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **SUPABASE_SERVICE_ROLE_KEY (Production)**
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Verify all 3 secrets are set:
   ```
   Settings → Secrets and variables → Actions
   (Should show 3 secrets listed)
   ```

---

## 🔑 Environment File Examples

### `.env.local` (Local Development)
```bash
# Development Supabase Project
SUPABASE_URL=https://dev-project-12345.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1wcm9qZWN0LTEyMzQ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1wcm9qZWN0LTEyMzQ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjoxOTk5OTk5OTk5fQ...
```

### `.env.staging` (Staging)
```bash
# Staging Supabase Project
SUPABASE_URL=https://staging-project-67890.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YWdpbmctcHJvamVjdC02Nzg5MCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjIwMDAwMDAwLCJleHAiOjE5OTk5OTk5OTl9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YWdpbmctcHJvamVjdC02Nzg5MCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0...
```

### `.env.production` (Production Template)
```bash
# Production - Set via GitHub Secrets
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

---

## ✅ Verification

### Test Local Connection

```bash
# 1. Restart API with real credentials
docker-compose restart api

# 2. Check health
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"..."}

# 3. Check Supabase connection (optional)
curl http://localhost:3000/test-db
# Phase 1B Response: {"status":"Database connected!",...}
```

### Test GitHub Secrets

```bash
# View all secrets (masked)
gh secret list

# Should show:
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### Test CI/CD Pipeline

1. Push code to main:
   ```bash
   git push origin main
   ```

2. Go to GitHub → Actions
3. Watch workflow run
4. Should use secrets automatically

---

## 🔐 Security Best Practices

### DO ✅

- ✅ Keep `.env.local` in `.gitignore` (never commit)
- ✅ Store secrets in GitHub Secrets (not in .env)
- ✅ Use service role key server-side only
- ✅ Use anon key client-side only
- ✅ Rotate keys if compromised
- ✅ Use different projects for dev/staging/prod

### DON'T ❌

- ❌ Commit `.env` files with real keys
- ❌ Share keys via email/chat
- ❌ Expose keys in error messages
- ❌ Use same keys for multiple environments
- ❌ Post keys in public GitHub issues

---

## 🚨 Troubleshooting

### "SUPABASE_URL is required"

**Problem:** Environment variable not loaded

**Solution:**
```bash
# 1. Verify .env file exists
ls -la backend/.env.local

# 2. Check content
grep SUPABASE_URL backend/.env.local

# 3. Restart Docker
docker-compose restart api

# 4. Check logs
docker-compose logs api | grep -i supabase
```

### "Cannot connect to Supabase"

**Problem:** Invalid credentials or project deleted

**Solution:**
```bash
# 1. Verify in Supabase dashboard
# - Project active? (should show green status)
# - Keys correct? (copy again from Settings → API)

# 2. Check network
curl https://your-project.supabase.co/rest/v1/

# 3. Restart with new keys
docker-compose down
docker-compose up -d
```

### GitHub Actions Fails with "Secrets not found"

**Problem:** Secrets not set in GitHub

**Solution:**
```bash
# 1. Verify secrets are set
gh secret list

# 2. Add missing secrets
gh secret set SUPABASE_URL "https://..."
gh secret set SUPABASE_ANON_KEY "eyJ..."

# 3. Re-run workflow
gh workflow run ci-cd.yml
```

---

## 📊 What Gets Created in Supabase

### Default Tables

Supabase creates these by default:
- `auth.users` - Authentication users
- `auth.sessions` - Active sessions
- `public.profiles` - User profiles

### Using Our Schema

Our PostgreSQL tables are created via migrations:
```
Migration 001: Core tables (users, badges, etc)
Migration 002: Extended tables (goals, challenges, etc)
Migration 003: Seed data
```

These work seamlessly with Supabase's PostgreSQL backend.

---

## 🔄 Database Sync

**Important:** Supabase uses PostgreSQL, so:

1. Migrations run on Supabase database
2. Seed data loaded into Supabase
3. Repositories query Supabase directly
4. No manual sync needed

---

## 🌍 Multi-Environment Setup

### Recommended Configuration

| Environment | Project | URL | Purpose |
|-------------|---------|-----|---------|
| Local Dev | `family-hub-dev` | localhost | Feature development |
| Staging | `family-hub-staging` | staging server | Pre-release testing |
| Production | `family-hub-prod` | production | Live application |

Each has:
- ✅ Separate Supabase project
- ✅ Separate database
- ✅ Separate credentials
- ✅ Separate data

---

## 📚 Next Steps

### After Supabase Setup Complete

1. **Task 1B-001: Core API Endpoints**
   - Use real Supabase auth
   - Implement user endpoints
   - Test with real database

2. **Task 1B-006: External APIs**
   - Integrate Merriam-Webster
   - Integrate OpenWeather
   - Integrate SendGrid

3. **Phase 1B Complete**
   - Full backend operational
   - Ready for frontend

---

## 🆘 Need Help?

### Supabase Documentation
- **Auth:** https://supabase.com/docs/guides/auth
- **Database:** https://supabase.com/docs/guides/database
- **API:** https://supabase.com/docs/guides/api

### Common Issues
- https://supabase.com/docs/guides/troubleshooting

### Community Support
- Discord: https://discord.supabase.com

---

## ✨ Status Checklist

- [ ] Supabase account created
- [ ] Development project created
- [ ] Credentials copied
- [ ] `.env.local` updated
- [ ] API running with real Supabase
- [ ] GitHub Secrets set (3)
- [ ] Health check passes
- [ ] Ready for 1B-001

---

**Status:** Task 1B-005 - Setup Guide Complete  
**Next:** Implement API endpoints using real Supabase  
**Maintained By:** Backend Team
