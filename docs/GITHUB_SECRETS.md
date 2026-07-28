# GitHub Secrets Configuration
## CI/CD Environment Variables Setup

**Purpose:** Store sensitive credentials securely for automated deployments  
**Access:** GitHub → Settings → Secrets and variables → Actions  

---

## 🔐 Required Secrets

### 1. Supabase Credentials

#### SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://your-project-name.supabase.co
Visibility: All workflows
```

**Where to find:**
1. Supabase Dashboard
2. Settings → API
3. Copy "Project URL"

---

#### SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Visibility: All workflows
```

**Where to find:**
1. Supabase Dashboard
2. Settings → API
3. Copy "anon public" key
4. Key starts with `eyJh...`

---

#### SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Visibility: All workflows
```

**Where to find:**
1. Supabase Dashboard
2. Settings → API
3. Copy "service_role secret" key
4. Key is longer than anon key

---

### 2. Deployment Credentials (Phase 1B)

When setting up production deployment:

#### DEPLOY_SSH_KEY
```
Name: DEPLOY_SSH_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
        [full private key content]
        -----END OPENSSH PRIVATE KEY-----
Visibility: All workflows
```

#### STAGING_HOST
```
Name: STAGING_HOST
Value: staging.familyhub.com
Visibility: All workflows
```

#### PRODUCTION_HOST
```
Name: PRODUCTION_HOST
Value: api.familyhub.com
Visibility: All workflows
```

---

## ⚙️ How to Add Secrets

### Via GitHub Web UI

1. Go to repository
2. Click **Settings** tab
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Enter:
   - **Name:** (e.g., `SUPABASE_URL`)
   - **Secret:** (paste value)
6. Click **"Add secret"**

### Via GitHub CLI

```bash
# Set single secret
gh secret set SUPABASE_URL --body "https://your-project.supabase.co"

# Set from file
gh secret set SUPABASE_SERVICE_ROLE_KEY < ~/supabase-key.txt

# List all secrets (masked)
gh secret list

# Delete secret
gh secret delete SUPABASE_URL
```

---

## 🔍 How Secrets Work in CI/CD

### In GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml

env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          # Secrets automatically available as env vars
          echo "Using Supabase at: $SUPABASE_URL"
          # Actual value is masked in logs
```

### Security Features

- ✅ **Masked in logs** - `${{ secrets.KEY }}` never printed to logs
- ✅ **Per-workflow access** - Can restrict to specific workflows
- ✅ **Encrypted** - Stored encrypted in GitHub
- ✅ **Audit logged** - Access is logged
- ✅ **Rotation** - Can be updated/deleted anytime

---

## 📋 Setup Checklist

### Step 1: Get Credentials

- [ ] Create Supabase project
- [ ] Copy `SUPABASE_URL`
- [ ] Copy `SUPABASE_ANON_KEY`
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Add to GitHub

- [ ] Add `SUPABASE_URL` secret
- [ ] Add `SUPABASE_ANON_KEY` secret
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret

### Step 3: Verify

```bash
# List secrets
gh secret list

# Expected output:
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### Step 4: Test in CI/CD

1. Push code to main
2. Go to GitHub → Actions
3. Watch workflow run
4. Verify deployment uses real credentials

---

## ⚠️ Security Best Practices

### DO ✅

- ✅ Store production keys ONLY in GitHub Secrets
- ✅ Rotate keys regularly (monthly)
- ✅ Use service role key server-side only
- ✅ Use anon key in client code only
- ✅ Use different projects for dev/staging/prod
- ✅ Audit secret access logs
- ✅ Delete secrets when projects are deleted

### DON'T ❌

- ❌ Commit `.env` files with real keys
- ❌ Paste secrets in GitHub issues
- ❌ Share secrets via email/Slack
- ❌ Hardcode secrets in code
- ❌ Use same keys for all environments
- ❌ Log secrets in CI/CD output
- ❌ Store secrets in database

---

## 🚨 If Secret is Compromised

### Immediate Action

1. **Delete** the secret in GitHub
2. **Revoke** the key in Supabase
3. **Generate** new key in Supabase
4. **Add** new secret to GitHub
5. **Re-run** workflow with new secret

### Command Steps

```bash
# 1. Delete compromised secret
gh secret delete SUPABASE_SERVICE_ROLE_KEY

# 2. (Manual) Revoke key in Supabase dashboard
#    Settings → API → Revoke button

# 3. (Manual) Generate new key in Supabase

# 4. Add new secret
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "new-key-here"

# 5. Trigger workflow
gh workflow run ci-cd.yml
```

---

## 📊 Secret Rotation Schedule

### Recommended Cadence

| Secret | Rotation | Reason |
|--------|----------|--------|
| SUPABASE_ANON_KEY | Every 3 months | Lower risk (public) |
| SUPABASE_SERVICE_ROLE_KEY | Every month | Higher risk (server) |
| DEPLOY_SSH_KEY | Every 6 months | Or when team changes |

### Rotation Process

1. Generate new key in service (Supabase, SSH, etc)
2. Add new secret to GitHub (with `-new` suffix)
3. Test workflow with new secret
4. Update workflow to use new secret
5. Delete old secret
6. Revoke old key in service

---

## 🔗 Integration Points

### Used By CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml

# Build stage
build:
  env:
    # Not needed (just compile)
    
# Staging deploy
deploy-staging:
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

# Production deploy
deploy-production:
  environment: production
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 📝 Environment File Templates

### `.env.production` (Uses Secrets)

```bash
# Production environment
NODE_ENV=production
ENVIRONMENT=production

# Loaded from GitHub Secrets
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Other production config
LOG_LEVEL=info
DATABASE_URL=${DATABASE_URL}  # From Secrets
REDIS_URL=${REDIS_URL}  # From Secrets
```

---

## 🆘 Troubleshooting

### Secrets Not Available in Workflow

**Problem:** Workflow fails with "secret not found"

**Solution:**
```bash
# Verify secret exists
gh secret list | grep SUPABASE_URL

# Check GitHub Actions permissions
# Settings → Actions → Workflows permissions
# Should be "Read and write permissions"
```

### Secret Value Changed But Workflow Still Fails

**Problem:** Updated secret but workflow still uses old value

**Solution:**
```bash
# GitHub caches secrets
# Solution 1: Re-run workflow
gh workflow run ci-cd.yml

# Solution 2: Wait 5 minutes for cache invalidation

# Solution 3: Push new commit to trigger workflow
git commit --allow-empty -m "Trigger workflow"
git push origin main
```

### Can't See Secret Value After Adding

**Problem:** "I need to verify the secret was added correctly"

**Solution:** This is by design - secrets are write-only.
- Verify by running workflow
- Check logs for masked output
- If workflow fails, secret value may be wrong

---

## 📚 Related Docs

- [CI/CD Pipeline](./CI_CD_PIPELINE.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
- [Deployment Procedures](./DEPLOYMENT_PROCEDURES.md)

---

**Status:** Task 1B-005 - Secrets Configuration Complete  
**Next:** Use secrets in CI/CD for real deployments  
**Maintained By:** DevOps Team
