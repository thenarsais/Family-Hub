# Deployment Procedures
## Family Hub CI/CD Operations Guide

**Target Audience:** Developers, DevOps engineers  
**Last Updated:** July 6, 2026  
**Status:** Phase 1A - Foundation (Phase 1B: Full automation)

---

## 🚀 Quick Start

### Deploy to Staging (Automatic)
```bash
# Just push to main — staging deploys automatically
git push origin main
# ✅ Workflow triggers → builds → deploys to staging
```

### Deploy to Production (Manual)
```bash
# Via GitHub CLI
gh workflow run ci-cd.yml \
  --ref main \
  -f environment=production

# Or via GitHub Web UI
GitHub → Actions → CI/CD Pipeline → Run workflow → environment=production
```

---

## 📊 Pipeline Status

### Check Current Status
```bash
# Watch latest workflow run
gh run list --workflow=ci-cd.yml --limit=5

# Get detailed status
gh run view --json status,conclusion
```

### View Build Logs
```bash
# Stream live logs
gh run watch <run-id>

# View specific job logs
gh run view <run-id> --log
```

---

## 🛠️ Deployment Procedures (Phase 1B)

### Staging Deployment (Automatic)

**Trigger:** Push to `main` branch  
**Frequency:** Every commit  
**Duration:** ~5-10 minutes

**Steps:**
```
1. Build Docker image
   ├─ Checkout code
   ├─ Install dependencies
   ├─ Compile TypeScript
   └─ Build Docker image

2. Deploy to staging server
   ├─ SSH to staging
   ├─ Pull latest code
   ├─ Run migrations
   └─ Start services

3. Health checks
   ├─ API health (/health endpoint)
   ├─ Database connectivity
   ├─ Redis connectivity
   └─ All services healthy

4. Notify team
   └─ Send status to Slack/email
```

**Success:** API available at `http://staging.familyhub.com:3100`

---

### Production Deployment (Manual)

**Trigger:** Workflow dispatch (manual)  
**Frequency:** On demand  
**Duration:** ~15-20 minutes

**Pre-Deployment Checklist:**
- [ ] Staging deployment successful
- [ ] All tests passed in staging
- [ ] Code review approved
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

**Deployment Steps:**
```
1. Approval gate (manual review)
   └─ Confirm production deployment

2. Build & verify
   ├─ Checkout code
   ├─ Compile TypeScript
   ├─ Build Docker image
   └─ Run tests

3. Deploy to production
   ├─ SSH to production server
   ├─ Pull latest code
   ├─ Run migrations
   └─ Start services (rolling update)

4. Health checks
   ├─ API health endpoint
   ├─ Database connectivity
   ├─ Redis connectivity
   ├─ ELK stack (logging)
   └─ Prometheus (metrics)

5. Smoke tests
   ├─ User authentication
   ├─ Activity creation
   ├─ Points calculation
   ├─ Chore sync
   └─ Reports generation

6. Post-deployment
   ├─ Monitor metrics
   ├─ Check error rates
   ├─ Verify user traffic
   └─ Notify team
```

**Success:** API available at `https://api.familyhub.com`

---

## ⏮️ Rollback Procedures

### Rollback to Previous Version

```bash
# 1. Identify last stable version
git log --oneline | head -10

# 2. Get commit SHA
STABLE_COMMIT=abc123def456

# 3. Trigger rollback (Phase 1B)
gh workflow run rollback.yml -f version=$STABLE_COMMIT

# 4. Verify rollback
curl https://api.familyhub.com/health

# 5. Notify team
echo "Rolled back to $STABLE_COMMIT"
```

### Manual Rollback

```bash
# SSH to production server
ssh deploy@prod.familyhub.com

# Stop current deployment
cd /opt/familyhub
docker-compose down

# Checkout previous version
git checkout <commit-sha>

# Restart services
docker-compose -f docker-compose.production.yml up -d

# Health check
curl http://localhost/health
```

---

## 🔍 Monitoring Deployments

### Real-time Monitoring
```bash
# Watch workflow in real-time
gh run watch <run-id>

# View logs as they update
gh run view <run-id> --log --follow
```

### Metrics Dashboard
```
Grafana: http://localhost:3001 (admin/admin)
- API latency
- Request rate
- Error rate
- CPU/Memory usage
```

### Log Monitoring
```
Kibana: http://localhost:5610
- Application logs
- Error tracking
- Request tracing
- Performance analysis
```

---

## 🚨 Troubleshooting Deployments

### Build Fails

**Error:** `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Update dependencies
cd backend
npm install --legacy-peer-deps
npm ci

# Retry build
git push origin main
```

---

### Staging Deployment Fails

**Error:** `SSH: Permission denied`

**Solution:**
```bash
# Check SSH key
gh secret set DEPLOY_SSH_KEY < ~/.ssh/id_ed25519

# Verify staging server access
ssh -i ~/.ssh/id_ed25519 deploy@staging.familyhub.com

# Check workflow logs
gh run view <run-id> --log
```

---

### Health Checks Fail

**Error:** `curl: (7) Failed to connect`

**Solution:**
```bash
# SSH to server
ssh deploy@staging.familyhub.com

# Check Docker services
docker ps -a

# Check logs
docker logs family-hub-api

# Restart services
docker-compose -f docker-compose.staging.yml restart api

# Re-run health check
curl http://localhost:3100/health
```

---

### Database Migration Fails

**Error:** `psql: relation "users" already exists`

**Solution:**
```bash
# SSH to server
ssh deploy@staging.familyhub.com

# Connect to database
psql -U postgres -d family_hub

# Check migration status
SELECT * FROM pg_stat_statements;

# Rollback if needed
-- Manually drop table
DROP TABLE IF EXISTS users CASCADE;

-- Re-run migrations
-- (automated in next deployment)
```

---

## 📋 Deployment Checklist

### Pre-Production Deployment
- [ ] Code merged to main
- [ ] CI/CD pipeline passed
- [ ] Staging deployment successful
- [ ] Staging health checks passed
- [ ] Team notified
- [ ] Rollback plan confirmed
- [ ] Maintenance window scheduled

### During Deployment
- [ ] Monitor workflow progress
- [ ] Watch error logs
- [ ] Check metrics dashboard
- [ ] Verify no user errors
- [ ] Be ready to rollback

### Post-Deployment
- [ ] Verify production health
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Monitor user activity
- [ ] Notify team of success
- [ ] Document any issues

---

## 📞 Communication

### Deployment Notification Template
```
🚀 DEPLOYMENT NOTIFICATION

Environment: Staging/Production
Commit: abc123def456
Branch: main
Author: @username
Changes: [list key changes]
Status: ✅ Success / ❌ Failed

Timeline:
- Started: 2:00 PM
- Completed: 2:15 PM
- Duration: 15 minutes

Health Checks: ✅ All passed
Rollback Available: Yes

Next Steps: [monitoring/verification]
```

### Slack Integration (Phase 1B)
```
@channel 🚀 Staging deployment started
- Commit: abc123def456
- Author: @username
```

---

## 🔄 Workflow Configuration Files

### `.github/workflows/ci-cd.yml`
Main CI/CD pipeline configuration
- Build stage
- Staging deploy stage
- Production deploy stage
- Rollback stage

### `docker-compose.staging.yml`
Staging environment configuration
- API service
- PostgreSQL
- Redis
- Monitoring stack

### `docker-compose.production.yml`
Production environment configuration (Phase 1B)
- API service (multiple replicas)
- PostgreSQL (replicated)
- Redis (cluster)
- Load balancer
- Monitoring stack

---

## 📈 Deployment Metrics

### Average Deployment Time
- **Staging:** 5-10 minutes
- **Production:** 15-20 minutes

### Success Rate (Target)
- **Build:** 99%+
- **Staging:** 98%+
- **Production:** 100%

### Rollback Time (Target)
- **Automatic:** < 5 minutes
- **Manual:** < 15 minutes

---

## 🔐 Security Checklist

### Deployment Security
- [ ] Secrets not logged
- [ ] SSH keys managed securely
- [ ] Staging/prod environments isolated
- [ ] Health checks verify SSL/TLS
- [ ] Database backups taken
- [ ] Audit logs enabled
- [ ] Access logs monitored

---

## 📚 Related Docs

- [CI/CD Pipeline](./CI_CD_PIPELINE.md)
- [Local Development Setup](./LOCAL_DEV_SETUP.md)
- [Staging Environment](./STAGING_ENVIRONMENT_SETUP.md)
- [Migrations Guide](./HOW_TO_RUN_MIGRATIONS.md)

---

**Status:** Phase 1A - Foundation  
**Next Steps:** Phase 1B - Full automation  
**Maintained By:** DevOps Team
