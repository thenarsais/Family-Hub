# CI/CD Pipeline Documentation
## Family Hub Automated Build & Deployment

**Status:** Phase 1A - Foundation set up  
**Platform:** GitHub Actions  
**Workflow File:** `.github/workflows/ci-cd.yml`  

---

## 📋 Overview

**Three-stage pipeline:**
1. **Build** - TypeScript compilation, Docker image build
2. **Staging Deploy** - Automatic on push to main
3. **Production Deploy** - Manual trigger only

**All stages include health checks and notifications.**

---

## 🔄 Pipeline Triggers

### Automatic Triggers
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

| Trigger | Action |
|---------|--------|
| Push to `main` | Build + Test → Auto-deploy to staging |
| Push to `develop` | Build + Test (no deploy) |
| Pull Request | Build + Test (validation only) |

### Manual Triggers
```yaml
workflow_dispatch:
  environment: [staging, production]
```

**Deploy to production:**
```bash
gh workflow run ci-cd.yml -f environment=production
```

---

## 🏗️ Build Stage

### What It Does
1. Checks out code
2. Sets up Node.js 18
3. Installs dependencies (`npm ci`)
4. Compiles TypeScript (`npm run build`)
5. Builds Docker image
6. Pushes to container registry (GitHub Container Registry)

### Docker Image Details
- **Base:** Node.js 18 Alpine (multi-stage)
- **Registry:** ghcr.io (GitHub Container Registry)
- **Tagging:**
  - Branch name: `ghcr.io/user/repo/api:main`
  - Commit SHA: `ghcr.io/user/repo/api:sha-abc123`
  - Latest: `ghcr.io/user/repo/api:latest`
  - SemVer: `ghcr.io/user/repo/api:v1.0.0`

### Build Cache
- Uses GitHub Actions cache
- Caches Node.js modules and Docker layers
- Speeds up subsequent builds by 80%+

**Status:** ✅ Working in Phase 1A

---

## 🚀 Staging Deployment

### Triggers
- Automatic on **push to main branch**
- Manual via `workflow_dispatch`

### What It Does
1. Deploys latest Docker image to staging server
2. Runs database migrations
3. Performs health checks
4. Notifies team of deployment status

### Deployment Steps
```bash
# SSH to staging server
ssh deploy@staging.familyhub.com

# Pull latest code
cd /opt/familyhub
git pull origin main

# Deploy with docker-compose
docker-compose -f docker-compose.staging.yml up -d

# Wait for services
sleep 10

# Health check
curl http://localhost:3100/health
```

### Health Checks
- API responds to `/health` endpoint
- Database is accessible
- Redis is accessible
- All services healthy

**Status:** ✅ Phase 1A placeholder (full implementation Phase 1B)

---

## 🔐 Production Deployment

### Triggers
- **Manual only** via `workflow_dispatch` with `environment=production`
- Requires explicit approval

### Deployment Process
```bash
# 1. Manual trigger (requires approval)
gh workflow run ci-cd.yml -f environment=production

# 2. Checkout latest code
# 3. Run migrations
# 4. Deploy to production
# 5. Run health checks
# 6. Run smoke tests
# 7. Notify team
```

### Protection Levels
- ✅ Manual approval required
- ✅ Branch protection (main only)
- ✅ Status checks required
- ✅ Environment secrets isolation

### Rollback Procedure
If production has issues:

```bash
# 1. Identify last stable deployment
git log --oneline | head -5

# 2. Trigger rollback
gh workflow run rollback.yml -f version=<commit-sha>

# 3. Verify deployment
curl https://api.familyhub.com/health
```

**Status:** ✅ Phase 1A placeholder (full implementation Phase 1B)

---

## 🧪 Testing in Pipeline

### TypeScript Compilation
```bash
npm run build  # Checks for TypeScript errors
```

### Unit Tests (Phase 1B)
```bash
npm run test   # Run Jest/Vitest tests
```

### Integration Tests (Phase 1B)
```bash
npm run test:integration  # Database + API tests
```

### Smoke Tests (Phase 1B)
```bash
npm run test:smoke -- --environment=production
```

**Current status:** Only TypeScript compilation ✅

---

## 📊 Pipeline Status Checks

### Required Checks (must pass)
- ✅ Build succeeds
- ✅ TypeScript compiles
- ✅ Docker image builds
- ✅ Health checks pass (staging)

### Optional Checks (Phase 1B)
- Unit tests pass
- Integration tests pass
- Code coverage above threshold
- Security scan passes

---

## 🔑 Secrets & Environment Variables

### GitHub Secrets Required
```
DEPLOY_SSH_KEY          # SSH key for staging/prod servers
STAGING_HOST            # Staging server IP/hostname
PRODUCTION_HOST         # Production server IP/hostname
SLACK_WEBHOOK_URL       # Slack notifications
```

### Set Secrets
```bash
# Via GitHub CLI
gh secret set DEPLOY_SSH_KEY < ~/.ssh/id_ed25519

# Via GitHub Web UI
Settings → Secrets and variables → Actions → New repository secret
```

### Secret Usage in Workflow
```yaml
- name: Deploy to staging
  env:
    DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
  run: ssh-add $DEPLOY_KEY && ...
```

**Phase 1A:** Placeholder  
**Phase 1B:** Configure actual secrets

---

## 📈 Monitoring Pipeline

### View Workflow Runs
```bash
# List all runs
gh run list --workflow=ci-cd.yml

# Watch a run
gh run watch <run-id>

# View logs
gh run view <run-id> --log

# View specific job
gh run view <run-id> --log --json=logs
```

### Workflow Status
- ✅ Queued
- 🔄 In Progress
- ✅ Completed (success)
- ❌ Failed
- ⏸️ Cancelled

### GitHub Actions Dashboard
```
https://github.com/<owner>/<repo>/actions
```

---

## 🔧 Configuration

### GitHub Actions Settings
```
Settings → Actions → General

Permissions:
✅ Read and write permissions
✅ Allow GitHub Actions to create and approve pull requests

Artifact & log retention:
✅ 30 days (default)
```

### Branch Protection Rules
```
Settings → Branches → main

Require status checks to pass:
✅ Actions workflow required
✅ Dismiss stale pull request approvals
```

---

## 📋 Deployment Checklist

### Before Merging to Main
- [ ] Code review approved
- [ ] All tests pass
- [ ] No console errors
- [ ] Database migrations work
- [ ] Seed data verified

### Before Production Deployment
- [ ] Staging deployment successful
- [ ] Staging tests passed
- [ ] Staging health checks passed
- [ ] Rollback plan confirmed
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

---

## 🚨 Troubleshooting

### Build fails: "tsc: command not found"
**Cause:** TypeScript dev dependency missing  
**Fix:** Ensure `npm ci` runs (not `npm install`)

### Docker build fails: "base image not found"
**Cause:** Invalid Node.js Alpine version  
**Fix:** Check `backend/Dockerfile` base image

### Deployment fails: "SSH key permission denied"
**Cause:** SSH key not added to agent  
**Fix:** Verify `DEPLOY_SSH_KEY` secret is set

### Health check timeout
**Cause:** API not responding in time  
**Fix:** Increase timeout or add `start_period` in Docker health check

---

## 📚 Related Documentation

- [Local Development Setup](./LOCAL_DEV_SETUP.md)
- [Staging Environment](./STAGING_ENVIRONMENT_SETUP.md)
- [Migrations Guide](./HOW_TO_RUN_MIGRATIONS.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

---

## 🔮 Phase 1B Enhancements

### Staging Deployment
- [ ] Configure staging server access
- [ ] Set up SSH keys
- [ ] Create deployment user
- [ ] Test auto-deployment
- [ ] Set up staging notifications

### Production Deployment
- [ ] Configure production server access
- [ ] Set up DNS/load balancer
- [ ] Create production database
- [ ] Set up monitoring alerts
- [ ] Create rollback runbook

### Testing
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add smoke tests
- [ ] Add performance tests

### Notifications
- [ ] Slack notifications
- [ ] Email notifications
- [ ] Deployment dashboard
- [ ] Incident alerts

---

## 📞 Support

**Issues?**
- Check workflow logs: GitHub → Actions → latest run
- View detailed output: `gh run view <id> --log`
- Contact DevOps team

**To modify the pipeline:**
1. Edit `.github/workflows/ci-cd.yml`
2. Commit to a feature branch
3. Test the workflow
4. Merge to main when verified

---

**Status:** Phase 1A - Foundation complete  
**Last Updated:** July 6, 2026  
**Maintained By:** DevOps Team
