# Environment Variables Guide
## Family Hub Configuration Reference

**Status:** Phase 1A - Complete  
**Environments:** Local Dev, Staging, Production  
**Configuration Files:**
- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

---

## 🔒 Security Notes

### Never Commit Secrets
```bash
# DO NOT commit .env files with real secrets
echo ".env.local" >> .gitignore
echo ".env.staging" >> .gitignore
echo ".env.production" >> .gitignore
```

### Use GitHub Secrets for CI/CD
```bash
# Set production secrets in GitHub
gh secret set DATABASE_URL "postgresql://prod:pass@prod.host/db"
gh secret set SUPABASE_ANON_KEY "key-here"
```

---

## 📋 Environment Variables by Category

### NODE & APP CONFIGURATION

| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_ENV` | development, staging, production | Node.js environment |
| `ENVIRONMENT` | local, staging, production | App environment |
| `LOG_LEVEL` | debug, info, warn, error | Logging verbosity |
| `APP_NAME` | family-hub | Application name |
| `APP_VERSION` | 1.0.0 | Version number |
| `PORT` | 3000 | API port |

### DATABASE CONFIGURATION

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | postgresql://user:pass@host:5432/db | Full connection string |
| `DB_HOST` | localhost | Database hostname |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | family_hub | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | password | Database password |

**Phase 1A:** Uses Docker container database  
**Phase 1B:** Uses managed cloud database

### REDIS CONFIGURATION

| Variable | Example | Purpose |
|----------|---------|---------|
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `REDIS_HOST` | localhost | Redis hostname |
| `REDIS_PORT` | 6379 | Redis port |

**Phase 1A:** Uses Docker container  
**Phase 1B:** Uses managed Redis cluster

### SUPABASE CONFIGURATION

| Variable | Example | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | https://project.supabase.co | Project URL |
| `SUPABASE_ANON_KEY` | ey... | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | ey... | Service role key (server-only) |

**Phase 1A:** Uses placeholders  
**Phase 1B:** Configure actual Supabase project

### JWT & SECURITY

| Variable | Example | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | your-secret-key | JWT signing secret |
| `JWT_EXPIRY` | 7d | Token expiration |
| `ENCRYPTION_KEY` | 32-char-key | Data encryption key |

**CRITICAL:** Change all secrets before production!

---

## 🚀 FEATURE FLAGS (All Phase 1)

All feature flags should be `true` for Phase 1 launch:

```bash
FEATURE_WORDLE=true
FEATURE_TRIVIA=true
FEATURE_WORD_SCRAMBLE=true
FEATURE_HANGMAN=true
FEATURE_DAILY_QUESTS=true
FEATURE_HOMEWORK=true
FEATURE_KUNG_FU=true
FEATURE_HABITS=true
FEATURE_READING=true
FEATURE_MOOD=true
FEATURE_GUJARATI=true
FEATURE_WEEKLY_GOALS=true
FEATURE_MONTHLY_GOALS=true
FEATURE_CATEGORY_MASTERY=true
FEATURE_DAILY_CHALLENGE=true
FEATURE_STREAK_RECOVERY=true
FEATURE_PARENT_PORTAL=true
FEATURE_GOOGLE_DRIVE_SYNC=true
FEATURE_HINT_TOKEN_SYSTEM=true
FEATURE_CHORE_POINTS=true
FEATURE_CHORE_BADGES=true
FEATURE_PRIVACY_MODE=true
```

---

## 📊 Environment-Specific Configurations

### Local Development (.env.local)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/family_hub
REDIS_URL=redis://localhost:6379
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=local-placeholder-key
JWT_SECRET=local-dev-secret-only
```

**Used by:** `docker-compose.yml`  
**Access:** API on http://localhost:3000

---

### Staging (.env.staging)

```bash
NODE_ENV=staging
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/family_hub_staging
REDIS_URL=redis://redis:6379
SUPABASE_URL=https://staging.supabase.co
SUPABASE_ANON_KEY=staging-placeholder-key
JWT_SECRET=staging-jwt-secret-phase-1b
```

**Used by:** `docker-compose.staging.yml`  
**Access:** API on http://localhost:3100 (via staging container)  
**Phase 1B:** Will point to staging server

---

### Production (.env.production)

```bash
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}  # Set via secrets
REDIS_URL=${REDIS_URL}  # Set via secrets
SUPABASE_URL=${SUPABASE_URL}  # Set via secrets
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}  # Set via secrets
JWT_SECRET=${JWT_SECRET}  # Set via secrets
```

**Used by:** Production deployment  
**Access:** API on https://api.familyhub.com  
**Security:** All secrets managed via GitHub Secrets

---

## 🔑 Setting Environment Variables

### Local Development

```bash
# Copy example to local file
cp backend/.env.staging backend/.env.local

# Edit with your values
nano backend/.env.local

# Docker automatically loads it
docker-compose up -d
```

### GitHub Actions Secrets

```bash
# Add secrets via GitHub CLI
gh secret set DATABASE_URL "postgresql://prod:pass@host/db"
gh secret set SUPABASE_ANON_KEY "key-here"
gh secret set JWT_SECRET "secret-here"

# Or via GitHub Web UI
Settings → Secrets and variables → Actions → New repository secret
```

### Staging Deployment (Phase 1B)

```bash
# SSH to staging server
ssh deploy@staging.familyhub.com

# Create .env.staging
sudo nano /opt/familyhub/.env.staging

# Restart services
docker-compose -f docker-compose.staging.yml restart api
```

---

## ✅ Verification

### Check Environment Loaded

```bash
# Via Docker logs
docker-compose logs api | grep "Server running"

# Via API health check
curl http://localhost:3000/health

# Check specific variable
docker-compose exec api node -e "console.log(process.env.PORT)"
```

### Verify Supabase Configuration

```bash
# Check if Supabase initialized
curl http://localhost:3000/health

# Response should be: {"status":"ok","timestamp":"..."}
```

### Verify Database Connection

```bash
curl http://localhost:3000/test-db

# Phase 1A Response: {"error":"Supabase not initialized"...}
# Phase 1B Response: {"status":"Database connected!",...}
```

---

## 🔄 Updating Environment Variables

### Local Development

1. Edit `.env.local`
2. Restart Docker container: `docker-compose restart api`
3. Verify: `curl http://localhost:3000/health`

### Staging (Phase 1B)

1. SSH to staging server
2. Edit `.env.staging`
3. Restart services
4. Run health checks

### Production (Phase 1B)

1. Update GitHub Secrets
2. Trigger deployment: `gh workflow run ci-cd.yml`
3. Pipeline loads secrets automatically
4. Health checks verify deployment

---

## 📈 Required Variables by Phase

### Phase 1A (Current)

Required:
- DATABASE_URL
- REDIS_URL
- SUPABASE_URL (placeholder OK)
- SUPABASE_ANON_KEY (placeholder OK)
- JWT_SECRET

Optional:
- All feature flags (defaults to enabled)
- External API keys (not used in Phase 1A)

### Phase 1B (Next)

Additional:
- SUPABASE_URL (real value)
- SUPABASE_ANON_KEY (real value)
- MERRIAM_WEBSTER_API_KEY (for Wordle)
- OPENWEATHER_API_KEY (for location features)
- GOOGLE_MAPS_API_KEY
- SENDGRID_API_KEY (for email)
- FIREBASE_* (for authentication)

### Phase 2

Advanced:
- APM_API_KEY (for monitoring)
- DATADOG_API_KEY (for analytics)
- STRIPE_API_KEY (for payments)

---

## 🧪 Testing Configuration

### Local Test

```bash
# Set test database
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/family_hub_test"

# Run tests
npm run test

# Reset test database
npm run test:reset
```

---

## 🚨 Troubleshooting

### Error: "SUPABASE_URL is required"

**Solution:** Add to .env.local:
```bash
SUPABASE_URL=http://localhost:54321
```

### Error: "Cannot connect to database"

**Solution:** Verify DATABASE_URL:
```bash
# Check if postgres is running
docker ps | grep postgres

# Check connection string format
# Should be: postgresql://user:pass@host:port/db
```

### Error: "Port 3000 already in use"

**Solution:** Change PORT variable:
```bash
# In .env.local
PORT=3001

# Restart
docker-compose restart api
```

### Secrets not loading in GitHub Actions

**Solution:** Verify secrets are set:
```bash
# List all secrets
gh secret list

# Delete and re-add if needed
gh secret delete DATABASE_URL
gh secret set DATABASE_URL "value"
```

---

## 📚 Related Documentation

- [Local Development Setup](./LOCAL_DEV_SETUP.md)
- [CI/CD Pipeline](./CI_CD_PIPELINE.md)
- [Deployment Procedures](./DEPLOYMENT_PROCEDURES.md)

---

## 🔮 Future Enhancements

- [ ] Environment variable validation schema
- [ ] Automatic secret rotation
- [ ] Environment variable audit logging
- [ ] Staging/production config sync
- [ ] Configuration versioning

---

**Status:** Phase 1A - Foundation complete  
**Last Updated:** July 6, 2026  
**Maintained By:** DevOps Team
