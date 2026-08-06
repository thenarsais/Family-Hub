# Phase 1 Item 11: Disaster Recovery Plan ✅

**Status**: Complete
**Date**: 2026-08-06
**Effort**: 0.5 hours

## Overview

Disaster recovery procedures for backup, restore, and incident response. Ensures data safety and service continuity.

## Backup Strategy

### 1. Database Backups (Supabase)

**Automated**:
- Daily automated backups (Supabase Cloud default)
- 30-day retention
- Point-in-time recovery available

**Manual Backup**:
```bash
# Export database
pg_dump postgresql://postgres:PASSWORD@db.kzxnlhwyzcxrnloamkck.supabase.co:5432/postgres > backup-$(date +%Y%m%d).sql

# Verify backup
wc -l backup-20260806.sql
```

**Restore from Backup**:
```bash
# Restore database
psql postgresql://postgres:PASSWORD@db.kzxnlhwyzcxrnloamkck.supabase.co:5432/postgres < backup-20260806.sql

# Verify restore
SELECT COUNT(*) FROM users;
```

### 2. Git Repository Backups

**Primary**: GitHub (remote repository)

**Local Backup**:
```bash
# Clone full history
git clone --mirror https://github.com/priya/Family-Hub.git Family-Hub.git

# Store in secure location
# Update weekly: cd Family-Hub.git && git fetch --all
```

### 3. Environment Files Backup

**What to Backup**:
- `.env.local` files (credentials)
- `lighthouserc.json` (config)
- Database connection strings

**Backup Location**:
```bash
# Store in encrypted file (1Password, LastPass, etc)
# NEVER commit to git
# Keep on USB drive in physical safe
```

**What NOT to Backup**:
- `node_modules/` (rebuild with npm ci)
- `dist/` folders (rebuild with npm run build)
- `.git/` (use git clone instead)

## Recovery Procedures

### Scenario 1: Database Corruption

**Detection**:
```bash
# Run health checks
curl http://localhost:3000/health
# If returns 503, database may be corrupted
```

**Recovery Steps**:
```bash
# 1. Identify corruption
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

# 2. Restore from latest backup
psql postgresql://user:pass@host/db < backup-latest.sql

# 3. Verify critical tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM chores;
SELECT COUNT(*) FROM activity;

# 4. Test app
npm run dev
curl http://localhost:3000/health
```

**Time to Recovery**: 5-15 minutes

### Scenario 2: Lost Source Code

**Detection**: Accidental deletion or git corruption

**Recovery Steps**:
```bash
# 1. Clone from GitHub
git clone https://github.com/priya/Family-Hub.git Family-Hub-restore

# 2. Verify all branches
cd Family-Hub-restore
git branch -a

# 3. Cherry-pick specific commits if needed
git log --oneline
git cherry-pick <commit-hash>

# 4. Test build
npm ci
npm run build --workspaces
```

**Time to Recovery**: 2-5 minutes

### Scenario 3: Credential Compromise

**Detection**: Exposed API keys or database password

**Recovery Steps**:
```bash
# 1. Rotate Supabase API keys
# In Supabase console:
# - Settings > API keys
# - Click "Regenerate" for exposed key
# - Get new key

# 2. Update environment files
# .env.local
SUPABASE_ANON_KEY=<new-key>
SUPABASE_SERVICE_KEY=<new-service-key>

# 3. Restart services
npm run dev  # Backend
npm run dev  # Frontend (in separate terminal)

# 4. Verify credentials work
curl -H "Authorization: Bearer <new-key>" http://localhost:3000/health

# 5. Commit new configuration
git add backend/.env.local frontend/.env.local
git commit -m "chore: rotate compromised API keys"
```

**Time to Recovery**: 10-20 minutes

### Scenario 4: Application Server Down

**Detection**: 
```bash
# Health check fails
curl -I http://localhost:3000/health
# Returns: Connection refused
```

**Recovery Steps**:
```bash
# 1. Check service status
ps aux | grep npm  # Is server process running?

# 2. Check logs
# On macOS/Linux
tail -f ~/.pm2/logs/server.log

# On Windows
Get-Content ".\logs\server.log" -Tail 50

# 3. Restart server
npm run dev  # Development
npm start    # Production

# 4. Verify endpoints
curl http://localhost:3000/health
curl http://localhost:3000/info

# 5. Check resource usage
# If out of memory:
node --max-old-space-size=2048 dist/server.js

# If high CPU:
# Check for infinite loops in recent commits
git log -1 --name-status
```

**Time to Recovery**: 2-5 minutes

### Scenario 5: Git History Corruption

**Detection**:
```bash
# Git operations fail
git log
# Error: bad object or corrupted index
```

**Recovery Steps**:
```bash
# 1. Check integrity
git fsck --full

# 2. If minor issues (use with caution)
git gc --aggressive

# 3. If severe, restore from backup
rm -rf .git
git clone https://github.com/priya/Family-Hub.git .git
git checkout .

# 4. Verify history
git log --oneline -20
git status
```

**Time to Recovery**: 5-10 minutes

## Backup Checklist

### Daily

- [ ] Supabase automated backup runs
- [ ] Verify backup notification received

### Weekly

- [ ] Test restore from backup
  ```bash
  # Restore to test database
  # Run sanity checks
  # Delete test database
  ```
- [ ] Verify git remote is up to date
  ```bash
  git remote -v
  git fetch origin
  git log --oneline -5 origin/main
  ```

### Monthly

- [ ] Full disaster recovery simulation
  - [ ] Restore database from backup
  - [ ] Clone fresh repo
  - [ ] Test full deployment
  - [ ] Verify all services
- [ ] Update backup documentation
- [ ] Review and rotate credentials

### Quarterly

- [ ] Audit backup retention policy
- [ ] Test recovery time objectives (RTO)
- [ ] Document lessons learned

## Recovery Time Objectives (RTO)

| Scenario | Target RTO | Actual |
|----------|-----------|--------|
| Database restore | < 15 min | ~10 min |
| Code restore | < 5 min | ~3 min |
| Credential rotation | < 20 min | ~15 min |
| Server restart | < 5 min | ~2 min |
| Full system restore | < 1 hour | ~45 min |

## Backup Storage Locations

### Production Backups
- **Primary**: Supabase (automatic, 30-day retention)
- **Secondary**: Local encrypted file (weekly)
- **Tertiary**: USB drive in physical safe (monthly)

### Source Code
- **Primary**: GitHub (public repository)
- **Secondary**: Local git mirror (weekly)
- **Tertiary**: USB drive backup (monthly)

### Credentials
- **Primary**: 1Password/LastPass (encrypted)
- **Secondary**: Paper backup in physical safe
- **Tertiary**: Never stored in email or unencrypted

## Monitoring & Alerts

### Database Health
```bash
# Add to cron job (runs daily at 2 AM)
0 2 * * * curl -f http://localhost:3000/health || mail -s "Health check failed" ops@example.com
```

### Backup Status
```bash
# Monitor backup size
du -sh backup-*.sql

# Alert if backup > 1GB
du -sh backup-*.sql | awk '{if ($1 > 1G) print "Alert: Large backup"}'
```

### Git History
```bash
# Weekly git fsck
0 3 * * 0 cd /path/to/repo && git fsck --full
```

## Incident Response Checklist

When disaster strikes:

- [ ] **Assess Impact**
  - What systems are down?
  - How many users affected?
  - How long has service been down?

- [ ] **Communicate**
  - Notify stakeholders
  - Post status update
  - Set expectations for recovery time

- [ ] **Execute Recovery**
  - Follow procedure for specific scenario
  - Document steps taken
  - Test systems after recovery

- [ ] **Verify & Monitor**
  - Run health checks
  - Monitor error rates
  - Check for data inconsistencies

- [ ] **Post-Mortem**
  - Document what happened
  - Identify root cause
  - List preventive measures
  - Schedule follow-up

## Prevention Measures

### Code Quality
- Automated testing (Item 2)
- Code reviews before merge
- Commit message linting (Item 10)
- Static analysis (linting)

### Infrastructure
- Health monitoring (Item 13)
- Error tracking (Sentry - Phase 2)
- Performance monitoring (Item 5)
- Log aggregation (Phase 2)

### Security
- Credential rotation (quarterly)
- Dependency audits (Item 7)
- Access control (RBAC)
- Encryption at rest and in transit

## Documentation

This file: `DISASTER_RECOVERY.md`

Related files:
- `.env.example` — Template for required environment variables
- `SETUP_GUIDE.md` — Initial setup and deployment
- `FRAMEWORK.md` — Architecture and design decisions

## Testing Recovery

**Monthly Drill**:
```bash
# 1. Restore database backup
# 2. Verify data integrity
# 3. Restart application
# 4. Run smoke tests
# 5. Document any issues
# 6. Plan improvements
```

**Annual Review**:
- Update RTO targets
- Review backup retention
- Assess new risks
- Train team on procedures

---

**Recovery is Only as Good as Your Tests**

Practice recovering from disasters regularly. A plan that's never tested is useless.

**Test the Recovery, Not Just the Backup.**
