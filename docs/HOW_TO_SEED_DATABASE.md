# Database Seeding Guide
## Family Hub Phase 1 Seed Data

**Status:** Phase 1 - Sample data loaded with migrations  
**Seed Files:** `backend/migrations/003_seed_phase1_data.sql`  
**TypeScript Seed Script:** `backend/src/seed.ts` (Node.js runner)

---

## 📊 Current Seed Data (Phase 1)

| Item | Count | Purpose |
|------|-------|---------|
| Feature Flags | 22 | Enable/disable Phase 1 modules |
| System Settings | 7 | Configuration defaults |
| Badges | 25+ | Activity + chore mastery badges |
| Trivia Questions | 16 | Sample questions (full: 1000+) |
| Quest Templates | 10 | Sample quests (full: 130+) |

---

## 🚀 Loading Seed Data

### Automatic (Docker Compose)

Seed data loads automatically when PostgreSQL starts:

```bash
# Option 1: Fresh start (destroy volumes, full reload)
docker-compose down -v
docker-compose up -d

# Option 2: Keep containers, reseed (for changes to seed file)
docker-compose restart postgres
```

**How it works:**
- All `.sql` files in `backend/migrations/` execute on database creation
- Files run in alphabetical order (001, 002, 003...)
- Migrations use `ON CONFLICT DO NOTHING` (idempotent)
- Seed data uses `ON CONFLICT DO UPDATE` (upsertable)

### Manual Seeding (if needed)

```bash
# Via psql
docker-compose exec postgres psql -U postgres -d family_hub < backend/migrations/003_seed_phase1_data.sql

# Via TypeScript seed runner
docker-compose exec api npm run seed
```

---

## 📋 Seed File Structure

### `003_seed_phase1_data.sql`

```sql
-- Feature Flags (22 total)
-- System Settings (7 total)
-- Trivia Questions (16 sample)
-- Badges (25+)
-- Content Items - Quest Templates (10 sample)
```

**Key characteristics:**
- All `ON CONFLICT DO NOTHING` (safe to re-run)
- No data deletion (additive only)
- No foreign key violations
- Includes sample data for testing

---

## ✅ Verification

### Check Seed Data Loaded

```bash
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT COUNT(*) FROM badges;"  # Should show 25+
```

### Full Seed Status

```bash
docker-compose exec postgres psql -U postgres -d family_hub -c "
SELECT 'Badges' as item, COUNT(*) as count FROM badges
UNION ALL
SELECT 'Feature Flags', COUNT(*) FROM feature_flags
UNION ALL
SELECT 'System Settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'Trivia Questions', COUNT(*) FROM trivia_questions
UNION ALL
SELECT 'Content Items', COUNT(*) FROM content_items;"
```

**Expected output:**
```
       item       | count 
------------------+-------
 Badges           |    25
 Feature Flags    |    22
 System Settings  |     7
 Trivia Questions |    16
 Content Items    |    10
```

---

## 🎯 Feature Flags (All Enabled for Phase 1)

```
✅ wordle_game
✅ quickfire_trivia
✅ word_scramble
✅ hangman_game
✅ daily_quests
✅ homework
✅ kung_fu
✅ habits
✅ reading
✅ mood_tracker
✅ gujarati_module
✅ weekly_goals
✅ monthly_goals
✅ category_mastery
✅ daily_challenge
✅ streak_recovery
✅ parent_portal
✅ google_drive_sync
✅ hint_token_system
✅ chore_points
✅ chore_badges
✅ privacy_mode
```

---

## 🏆 Badge Categories (25+ badges)

### Activity Badges (11 total)
- **Bronze:** First Steps, Quiz Master, Morning Routine
- **Silver:** Knowledge Seeker, Habit Hero, Reading Enthusiast
- **Gold:** Trivia Champion, Streak Master, Kung Fu Master
- **Platinum:** Ultimate Champion, Legendary Achiever

### Chore Badges (14+ total)
- **Trash Badges:** Bronze, Silver, Gold, Platinum
- **Laundry Badges:** Bronze, Silver, Gold
- **Dishes Badges:** Bronze, Silver, Gold
- **General Chore:** Helper (bronze), Champion (silver), Manager (gold), Legend (platinum)

---

## 📝 System Settings (7 defaults)

| Setting | Value | Type | Purpose |
|---------|-------|------|---------|
| `app_version` | 1.0.0 | string | Current version |
| `hints_per_day` | 2 | integer | Daily hint tokens |
| `hints_earned_per_activity` | 5 | integer | Activities between hints |
| `hints_cap` | 10 | integer | Max stored hints |
| `points_multiplier` | 1.0 | float | Points scaling |
| `max_active_weekly_goals` | 3 | integer | Concurrent weekly goals |
| `max_active_monthly_goals` | 2 | integer | Concurrent monthly goals |

---

## 🔄 Update Seed Data

### Add New Feature Flag

```sql
INSERT INTO feature_flags (flag_name, is_enabled, description)
VALUES ('my_new_feature', true, 'Description')
ON CONFLICT (flag_name) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;
```

### Add New Badge

```sql
INSERT INTO badges (title, description, icon_emoji, category, tier, points_required)
VALUES ('Badge Title', 'Description', '🏆', 'category', 'bronze', 0);
```

### Reload Seed Data

```bash
# Edit backend/migrations/003_seed_phase1_data.sql
# Then restart database
docker-compose down -v
docker-compose up -d
```

---

## 📈 Phase 1B Expansion

**Full seed data will include:**
- ✅ 1000+ trivia questions (16 categories, 4 difficulty levels)
- ✅ 130+ quest templates (calendar-aware)
- ✅ 400+ activity badges (full set)
- ✅ 50+ Gujarati learning items
- ✅ Word pools (Wordle, Scramble, Hangman)
- ✅ Predefined habits (11 templates)
- ✅ Challenge templates
- ✅ Goal templates

**Timing:** Phase 1B implementation after Phase 1A launch

---

## 🧪 Testing Seed Data

### Verify Data Quality

```bash
# Check no NULL required fields
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT * FROM badges WHERE title IS NULL LIMIT 5;"

# Check badge tier values
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT DISTINCT tier FROM badges;"

# Check difficulty levels in trivia
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT DISTINCT difficulty FROM trivia_questions ORDER BY difficulty;"
```

### Reset Seed (Development Only)

```bash
# WARNING: Deletes ALL data, then reloads seed
docker-compose down -v
docker-compose up -d
```

---

## 🔍 Troubleshooting

### Seed data not loaded

**Check:** Migration ran
```bash
docker-compose exec postgres psql -U postgres -d family_hub -c "\dt"
```

**Check:** Logs for errors
```bash
docker-compose logs postgres | grep ERROR
```

### Duplicates on re-seed

**Expected behavior:** `ON CONFLICT DO UPDATE` handles duplicates  
**Verification:**
```bash
docker-compose exec postgres psql -U postgres -d family_hub -c \
  "SELECT COUNT(*) FROM badges GROUP BY title HAVING COUNT(*) > 1;"
```

---

## 📚 Related Documentation

- [Migrations Guide](./HOW_TO_RUN_MIGRATIONS.md)
- [Local Development Setup](./LOCAL_DEV_SETUP.md)
- [Staging Environment](./STAGING_ENVIRONMENT_SETUP.md)

---

**Status:** Ready for Phase 1 launch  
**Last Updated:** July 6, 2026  
**Maintained By:** DevOps Team
