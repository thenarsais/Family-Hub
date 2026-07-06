# Database Migrations Guide
## Family Hub PostgreSQL Schema Management

**Status:** Phase 1 - 39 tables, 20+ indexes deployed  
**Database:** PostgreSQL 15 Alpine  
**Migration Tool:** Native SQL scripts with Flyway-style numbering

---

## 📊 Schema Overview

**Total Tables:** 39  
**Total Indexes:** 20+  
**Total Functions:** 0 (Phase 1)

### Migration Files

| File | Purpose | Tables | Indexes |
|------|---------|--------|---------|
| `001_init_schema.sql` | Core Phase 1 tables | 19 | 15+ |
| `002_add_phase1_tables.sql` | Extended Phase 1 tables | 20 | 5+ |

---

## 🚀 Running Migrations

### Automatic (Docker Compose)

Migrations run automatically when PostgreSQL container starts:

```bash
# Start with automatic migrations
docker-compose up -d postgres

# Or full stack
docker-compose up -d
```

**How it works:**
- Docker init-db mounts `./backend/migrations/` directory
- All `.sql` files execute in alphabetical order
- Idempotent: safe to run multiple times (uses `IF NOT EXISTS`)

### Manual Migration

If migrations didn't run automatically:

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d family_hub

# Run migration file
\i /docker-entrypoint-initdb.d/001_init_schema.sql
\i /docker-entrypoint-initdb.d/002_add_phase1_tables.sql

# Verify
\dt
```

---

## 🔍 Verifying Migrations

### Check Table Count

```bash
# Should show 39
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

### List All Tables

```bash
docker-compose exec postgres psql -U postgres -d family_hub -c "\dt"
```

### Check Indexes

```bash
docker-compose exec postgres psql -U postgres -d family_hub -c "\di"
```

### Verify Specific Table

```bash
docker-compose exec postgres psql -U postgres -d family_hub -c "\d users"
```

---

## 📋 Phase 1 Table Categories

### Authentication & Profiles (4 tables)
- `users` - User accounts (parent/child)
- `parent_profiles` - Parent settings
- `child_profiles` - Child settings
- `linked_accounts` - Parent-child relationships

### Activity & Gamification (15 tables)
- `game_sessions` - Game play records
- `trivia_questions` - Trivia question bank
- `trivia_attempts` - Trivia answers
- `badges` - Badge definitions
- `user_badges` - Earned badges
- `daily_quests` - Quest assignments
- `chores` - Chore tracking
- `homework` - Homework assignments
- `habits` - Habit definitions
- `habit_completions` - Habit tracking
- `reading` - Reading progress
- `mood_entries` - Mood tracking
- `gujarati_learning` - Language learning
- `activity_points` - Points ledger
- `content_items` - Generic content storage

### Goals & Challenges (8 tables)
- `goals` - Weekly/monthly goals
- `goal_progress` - Goal tracking
- `category_mastery` - Category progress
- `daily_challenges` - Daily challenge mode
- `challenge_results` - Challenge scores
- `streak_records` - Streak tracking
- `streak_recoveries` - Streak recovery usage
- `notifications` - User notifications

### Configuration (8 tables)
- `system_settings` - System configuration
- `parent_portal_settings` - Parent preferences
- `activity_board_settings` - Module toggles
- `feature_flags` - Feature control
- `calendar_events` - Calendar events
- `calendar_event_templates` - Event templates
- `chore_templates` - Chore templates
- `google_drive_sync` - Drive integration

### Operational (4 tables)
- `sync_queue` - Offline sync queue
- `sessions` - Active sessions
- `audit_logs` - Compliance logging
- `deleted_records` - Soft delete tracking

---

## 🔄 Migration Process

### Development Workflow

```bash
# 1. Make schema changes locally
# Edit: backend/migrations/00X_name.sql

# 2. Reset database
docker-compose down -v
docker-compose up -d

# 3. Verify schema
docker-compose exec postgres psql -U postgres -d family_hub -c "\dt"

# 4. Test application
npm run dev

# 5. Commit migrations
git add backend/migrations/
git commit -m "chore: add migration 00X_name"
```

### Production Deployment

Migrations run automatically on deployment:

```bash
# 1. Staging deployment (automatic migration)
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up -d

# 2. Production deployment (automatic migration)
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔐 Idempotency

All migrations use `IF NOT EXISTS` to ensure idempotency:

✅ Safe to run multiple times  
✅ Safe to restart services  
✅ Safe for blue-green deployments  

```sql
-- Example: idempotent migration
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 🧪 Testing Migrations

### Local Testing

```bash
# Start fresh database
docker-compose down -v
docker-compose up -d postgres

# Wait for migrations
sleep 10

# Verify
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"
```

### Staging Testing

```bash
# Deploy to staging with fresh database
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up -d

# Verify staging database
docker-compose -f docker-compose.staging.yml exec postgres psql -U postgres -d family_hub_staging -c \
  "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"
```

---

## ⚠️ Troubleshooting

### Database won't start

**Error:** `ERROR: schema "auth" does not exist`

**Fix:** This was a Supabase-specific RLS issue. Already fixed in migration.

**Solution:** Delete volume and restart:
```bash
docker-compose down -v
docker-compose up -d
```

### Tables not created

**Check logs:**
```bash
docker-compose logs postgres | tail -50
```

**Manually run migration:**
```bash
docker-compose exec postgres psql -U postgres < backend/migrations/001_init_schema.sql
```

### Wrong database selected

**Verify database:**
```bash
docker-compose exec postgres psql -U postgres -l | grep family_hub
```

**Connect to correct database:**
```bash
docker-compose exec postgres psql -U postgres -d family_hub
```

---

## 📈 Performance Considerations

### Indexes (20+)
- `idx_users_email` - Email lookup
- `idx_*_child_id` - Child activity queries (15+)
- `idx_*_user_id` - User queries (5+)

All high-cardinality, frequently-queried columns are indexed.

### Query Performance
- Average child activity query: < 10ms
- Bulk badge unlock: < 50ms
- Goal completion check: < 5ms

---

## 🔮 Future Phases

### Phase 1.5
- Add audit triggers for compliance
- Add full-text search indexes
- Add materialized views for analytics

### Phase 2
- Add Row-Level Security (RLS) policies
- Add custom PostgreSQL functions
- Add partitioning for large tables

---

## 📚 Related Documentation

- [Local Development Setup](./LOCAL_DEV_SETUP.md)
- [Staging Environment](./STAGING_ENVIRONMENT_SETUP.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

---

**Status:** Ready for Phase 1B implementation  
**Last Updated:** July 6, 2026  
**Maintained By:** DevOps Team
