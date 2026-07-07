# CI/CD Pipeline Setup Guide
## GitHub Actions Automation for Family Hub Backend

**Status:** Production Ready ✅  
**Last Updated:** 2026-07-07

---

## 📋 Overview

The CI/CD pipeline automates:
- ✅ Code quality checks (linting, formatting)
- ✅ TypeScript compilation
- ✅ Unit and integration tests
- ✅ API endpoint health checks
- ✅ Docker image building
- ✅ Security scanning
- ✅ Performance baseline tracking
- ✅ Staging deployment
- ✅ Production deployment
- ✅ Automatic rollback on failure

---

## 🚀 Quick Start

### 1. Enable GitHub Actions

```bash
# Workflows are in .github/workflows/
# GitHub Actions are enabled by default
# Verify: Settings → Actions → General → Allow all actions
```

### 2. Add Secrets to GitHub

Go to: **Settings → Secrets and variables → Actions**

Add these secrets:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL = postgresql://user:pass@host:5432/db
REDIS_URL = redis://user:pass@host:6379

# Optional: Slack notifications
SLACK_WEBHOOK_STAGING = https://hooks.slack.com/services/...
SLACK_WEBHOOK_PRODUCTION = https://hooks.slack.com/services/...
SLACK_WEBHOOK_ALERTS = https://hooks.slack.com/services/...
```

### 3. Test the Pipeline

```bash
# Make a test commit to trigger workflows
git commit --allow-empty -m "Test CI/CD pipeline"
git push origin main
```

---

## 📊 Pipeline Workflows

### **CI Workflow** (ci.yml)
**Triggers:** Every push and pull request

**Jobs:**
1. **Lint** - Code quality checks
   - Run ESLint/Prettier
   - Check formatting

2. **Build** - TypeScript compilation
   - Compile TypeScript
   - Check for type errors
   - Upload build artifacts

3. **Test** - Unit & integration tests
   - Run test suite
   - Test with real database/Redis
   - Upload coverage

4. **API Tests** - Endpoint health checks
   - Start API server
   - Test health endpoints
   - Verify API is responding

5. **Docker** - Build & push image (main/develop only)
   - Build Docker image
   - Push to GitHub Container Registry
   - Tag with version/branch

6. **Security** - Vulnerability scanning
   - Scan dependencies
   - Check npm vulnerabilities
   - Upload security results

7. **Performance** - Build metrics
   - Track build time
   - Monitor dist size
   - Compare against baseline

8. **Summary** - Overall status
   - Report results
   - Comment on PR

**Duration:** ~10-15 minutes

---

### **Deploy Workflow** (deploy.yml)
**Triggers:** After successful CI on main branch

**Stages:**
1. **Pre-Deploy** - Verification
   - CI pipeline must succeed
   - Extract version

2. **Staging** - Test deployment
   - Deploy to staging environment
   - Run smoke tests
   - Notify Slack

3. **Production** - Live deployment
   - Deploy to production
   - Run health checks
   - Monitor for 1 minute
   - Notify team

4. **Rollback** (if failure)
   - Revert to previous version
   - Alert team

**Duration:** ~5-10 minutes per environment

---

## 📝 Adding Tests

### Unit Tests

```typescript
// File: backend/src/__tests__/service.test.ts

describe('My Service', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

Add to package.json:
```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=__tests__"
  }
}
```

### Integration Tests

```typescript
// File: backend/src/__tests__/integration/database.test.ts

describe('Database Integration', () => {
  it('should connect to database', async () => {
    const result = await db.query('SELECT 1');
    expect(result).toBeDefined();
  });
});
```

Add to package.json:
```json
{
  "scripts": {
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Run Tests Locally

```bash
npm run test:unit
npm run test:integration
npm test
```

---

## 🔒 GitHub Secrets

### Required Secrets

| Secret | Example | Purpose |
|--------|---------|---------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiI...` | API access |
| `DATABASE_URL` | `postgresql://user@host/db` | Testing database |
| `REDIS_URL` | `redis://host:6379` | Cache testing |

### Optional Secrets

```
SLACK_WEBHOOK_STAGING     # Slack notifications for staging
SLACK_WEBHOOK_PRODUCTION  # Slack notifications for production
SLACK_WEBHOOK_ALERTS      # Critical alerts
```

### Environment Variables

Some values can use:

```yaml
# In workflow file
env:
  NODE_ENV: test
  API_URL: http://localhost:3000
```

---

## 🚦 Deployment Strategy

### Branch Protection Rules

1. Go to: **Settings → Branches**
2. Click **Add rule**
3. Pattern: `main`
4. Enable:
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Require code reviews before merging (min 1)
   - ✅ Require conversation resolution

### Workflow Status Requirements

Before merging to main:
- ✅ All CI checks pass
- ✅ Tests pass
- ✅ Code review approved

---

## 📈 Monitoring Pipeline

### View Workflow Runs

1. Go to: **Actions** tab
2. Select workflow: **CI/CD Pipeline** or **Deploy to Production**
3. Click run to see details

### Workflow Status Badge

Add to README.md:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_ORG/Family-Hub/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/Family-Hub/actions)
```

### Check Specific Jobs

```bash
# View workflow logs locally
gh run view <run-id>
gh run view <run-id> --log
gh run view <run-id> --log --job <job-id>
```

---

## 🐳 Docker Registry

### Image Tags

Images are tagged with:
- Branch name: `main`, `develop`
- Git SHA: `abc123def456`
- Semantic version: `v1.0.0` (if tagged)
- `latest` (for main branch)

### Pull Image

```bash
docker pull ghcr.io/YOUR_ORG/family-hub/api:latest
docker pull ghcr.io/YOUR_ORG/family-hub/api:main
docker pull ghcr.io/YOUR_ORG/family-hub/api:sha-abc123def456
```

### Authenticate with Registry

```bash
# GitHub token with packages read permission
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

---

## 🔍 Troubleshooting

### Pipeline Fails at Lint

```bash
# Check formatting locally
npm run lint

# Fix issues
npm run format
```

### Build Fails

```bash
# Check TypeScript compilation
npm run build

# Check for errors
npm run build 2>&1 | head -20
```

### Tests Fail

```bash
# Run locally with same environment
NODE_ENV=test npm test

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis
redis-cli -u $REDIS_URL ping
```

### Docker Build Fails

```bash
# Build locally to test
docker build -t familyhub-api:test .

# Check for Dockerfile issues
docker build -t familyhub-api:test . --progress=plain
```

### Deployment Fails

1. Check workflow logs in GitHub Actions
2. Verify secrets are set correctly
3. Ensure target environment is running
4. Check network connectivity
5. Review rollback logs

---

## 📋 Manual Workflow Trigger

Trigger workflows manually:

```bash
# View available workflows
gh workflow list

# Manually trigger CI workflow
gh workflow run ci.yml --ref main

# Manually trigger deployment
gh workflow run deploy.yml --ref main -f environment=production
```

Or use GitHub UI:
**Actions → Select Workflow → Run workflow**

---

## 📊 Performance Tracking

### Build Time Trends

```bash
# The pipeline logs build statistics
# Watch trends in GitHub Actions artifacts
# Look for regressions in:
# - Build time
# - Dist size
# - Test duration
```

### Health Metrics

```bash
# After deployment, check:
curl https://api.familyhub.com/performance/health
curl https://api.familyhub.com/metrics
```

---

## 🔄 Continuous Improvement

### Weekly Review

- [ ] Check pipeline success rate
- [ ] Review deployment frequency
- [ ] Monitor security scan results
- [ ] Track performance metrics
- [ ] Check error patterns

### Add More Tests

```bash
# Increase test coverage
npm run test -- --coverage

# Set coverage thresholds
# Require >80% coverage before merge
```

### Optimize Build Time

- Cache dependencies better
- Parallelize tests
- Reduce Docker image size
- Split large workflows

---

## 🚀 Next Steps

1. **Enable workflows** - Push first commit
2. **Set up secrets** - Add GitHub secrets
3. **Test locally** - Run tests before pushing
4. **Monitor runs** - Watch Actions tab
5. **Iterate** - Improve over time

---

## 📞 Support

For workflow issues:

1. Check GitHub Actions documentation
2. Review workflow logs in detail
3. Test steps locally
4. Check for secrets/environment variables
5. Consult GitHub Actions troubleshooting

---

**Status:** CI/CD Pipeline Ready for Production ✅

Next: Frontend development with confident deployments! 🎉
