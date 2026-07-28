# Secrets & Security Management
## Family Hub - Critical Security Guide

**Status:** Post-Incident Recovery ✅  
**Last Updated:** 2026-07-08  
**Incident:** Supabase service_role key exposed in git history (RESOLVED)

---

## 🚨 **INCIDENT SUMMARY**

### **What Happened**
- Supabase service_role JWT key was accidentally committed to git
- Key was exposed in git history from July 7, 2026
- GitGuardian detected and alerted
- Key was immediately rotated and invalidated
- Old key is no longer valid

### **Resolution**
✅ Old key rotated and disabled  
✅ New key created: `service_role_v2`  
✅ Backend code updated  
✅ GitHub Secrets updated  
✅ .gitignore properly configured  

---

## 🔒 **SECRETS MANAGEMENT RULES**

### **NEVER COMMIT THESE FILES**

```
❌ .env.local
❌ .env
❌ .env.development.local
❌ .env.*.local
❌ .env.production
❌ credentials.json
❌ private-keys/
❌ Any file with API keys, tokens, passwords
```

**All are in `.gitignore` ✅**

---

## 📝 **WHAT GOES WHERE**

### **Local Development Only (.env.local)**
```bash
# ✅ Safe to have secrets here (NEVER COMMIT)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=dev-secret
```

**Rules:**
- ✅ Use for local development only
- ✅ Add to .gitignore
- ✅ NEVER commit to git
- ✅ Each developer has their own copy
- ✅ Don't share via email/Slack

### **GitHub Secrets (Encrypted)**
```
✅ SUPABASE_SERVICE_ROLE_KEY
✅ DATABASE_URL
✅ REDIS_URL
✅ All deployment secrets
```

**Rules:**
- ✅ Go to: Settings → Secrets and variables → Actions
- ✅ Automatically encrypted by GitHub
- ✅ Only accessible by GitHub Actions
- ✅ Cannot be viewed after creation
- ✅ Use for CI/CD and deployments

### **Public/Shareable (.env.example)**
```bash
# ✅ Safe to commit - NO REAL VALUES
SUPABASE_URL=https://your-project.supabase.co
DATABASE_HOST=localhost
DATABASE_PORT=5432
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
```

**Rules:**
- ✅ Commit to git
- ✅ Only placeholder values
- ✅ No real secrets
- ✅ Helps new developers
- ✅ Shows structure

---

## 🔑 **CURRENT ACTIVE SECRETS**

### **Supabase Keys**

| Key | Type | Status | Created | Notes |
|-----|------|--------|---------|-------|
| `service_role_v2` | Secret API Key | ✅ ACTIVE | 2026-07-08 | Current production key |
| Old JWT (exposed) | Legacy JWT | ❌ REVOKED | 2026-07-07 | DO NOT USE - DISABLED |

### **Database**

| Key | Type | Status | Notes |
|-----|------|--------|-------|
| `family_hub` | PostgreSQL | ✅ ACTIVE | Primary database |
| `family_hub_test` | PostgreSQL | ✅ ACTIVE | Test database |

### **Redis**

| Key | Type | Status | Notes |
|-----|------|--------|-------|
| `localhost:6379` | Redis Cache | ✅ ACTIVE | Local development |

---

## 🛡️ **PREVENTION CHECKLIST**

### **Before Every Commit**

- [ ] Run `git status` - verify no .env files listed
- [ ] Check `.gitignore` - ensure secrets files excluded
- [ ] Review staged changes - look for API keys in diffs
- [ ] Don't commit anything with `secret`, `key`, `token`, `password`

### **Git Pre-commit Hook (Recommended)**

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing secrets

echo "🔍 Checking for exposed secrets..."

# Files that should never be committed
FORBIDDEN_FILES=".env.local .env .env.development .env.production credentials.json"

for file in $FORBIDDEN_FILES; do
  if git diff --cached --name-only | grep -q "^$file$"; then
    echo "❌ ERROR: Cannot commit $file"
    echo "Add to .gitignore and use local copies only"
    exit 1
  fi
done

# Check for secret patterns
if git diff --cached | grep -E "SUPABASE_SERVICE_ROLE_KEY|API_KEY|SECRET|PASSWORD" | grep -v "^+++ " | grep "^+"; then
  echo "❌ WARNING: Possible secrets in staged changes"
  echo "Review before committing!"
  exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

### **GitHub Secret Scanner (Enabled)**

- ✅ GitGuardian monitoring active
- ✅ GitHub Advanced Security active
- ✅ Automatic alerts on exposure

---

## 🔄 **ROTATING SECRETS**

### **When to Rotate**

- ❌ After exposure (do immediately!)
- ❌ After employee leaves
- ❌ Every 90 days (production)
- ❌ Before major deployments
- ❌ If you're unsure

### **How to Rotate - Supabase Keys**

**Step 1: Create New Key**
```
1. Go to: app.supabase.com/project/[id]/settings/api
2. Click: Create new API key
3. Name: service_role_v3 (increment version)
4. Copy the new key
```

**Step 2: Update All Places**
```
- .env.local (local development)
- GitHub Secrets (CI/CD)
- Deployed servers
- Edge Functions
```

**Step 3: Test New Key**
```bash
cd backend
npm run dev
# Verify no auth errors
```

**Step 4: Delete Old Key**
```
1. Back to Supabase settings
2. Find old key
3. Click Delete
4. Confirm (irreversible)
```

---

## 🚨 **IF A SECRET IS EXPOSED**

### **Immediate (5 minutes)**

1. **Rotate the secret immediately**
   - Go to service provider (Supabase, AWS, etc.)
   - Regenerate/rotate the exposed key
   - Copy new key

2. **Update code**
   - Update `.env.local`
   - Update GitHub Secrets
   - Update all deployed instances

3. **Alert the team**
   - Notify team lead
   - Document what was exposed
   - Note when it happened

### **Within 1 hour**

1. **Search codebase**
   ```bash
   git log -S "exposed_key_value" --all
   git grep "exposed_key_value"
   ```

2. **Check CI/CD logs**
   - Review recent builds
   - Check if secret was logged
   - Check deployment logs

3. **Monitor access**
   - Check service provider logs
   - Look for unauthorized access
   - Monitor database queries

### **Within 24 hours**

1. **Clean git history** (if needed)
   - Use `git filter-branch` or `git filter-repo`
   - Force push to remote (if necessary)
   - Notify team

2. **Update documentation**
   - Log incident details
   - Update prevention procedures
   - Share learnings with team

---

## 📋 **SUPABASE KEY TYPES**

### **Anon Key (Public)**
```
Can be shared publicly
Used for client-side authentication
Limited permissions
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9...
```

### **Service Role Key (Secret)**
```
NEVER share publicly
Used only on backend/servers
Full database permissions
Example: sb_secret_xxxxxxxxxxxxx OR JWT with role: service_role
```

### **API Keys (New)**
```
Publishable: Can be exposed (starts with sb_publishable_)
Secret: NEVER expose (starts with sb_secret_)
More secure than JWT-based keys
Recommended for new projects
```

---

## ✅ **SECURITY CHECKLIST**

### **Development Setup**

- [ ] `.gitignore` includes `.env.local`
- [ ] `.env.local` file created with dummy values
- [ ] No secrets in git history
- [ ] Pre-commit hooks installed (optional but recommended)

### **GitHub Configuration**

- [ ] Secrets added to GitHub Secrets
- [ ] Branch protection enabled
- [ ] Require status checks before merge
- [ ] Secret scanning enabled

### **Deployment Configuration**

- [ ] Production secrets in GitHub Secrets only
- [ ] Environment-specific secrets configured
- [ ] Secrets rotation schedule established
- [ ] Access logs monitored

### **Team Practices**

- [ ] All developers briefed on secret handling
- [ ] No secrets in Slack/email/chat
- [ ] Incident response plan in place
- [ ] Regular security reviews scheduled

---

## 📞 **INCIDENT RESPONSE CONTACTS**

**Security Issues:**
- Email: thenarsais@gmail.com
- GitHub: https://github.com/thenarsais/Family-Hub/security
- Supabase Support: https://supabase.com/support

---

## 📚 **RESOURCES**

- [OWASP: Secret Management](https://owasp.org/www-community/Secrets_Management)
- [GitHub: Managing Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase: Security Best Practices](https://supabase.com/docs/guides/self-hosting/security)
- [GitGuardian: Incident Response](https://www.gitguardian.com/blog)

---

## 🔄 **HISTORICAL LOG**

| Date | Event | Status |
|------|-------|--------|
| 2026-07-07 23:39 | Supabase service_role key exposed in git | 🚨 INCIDENT |
| 2026-07-08 08:00 | GitGuardian alert received | ⚠️ DETECTED |
| 2026-07-08 10:00 | Key rotated to service_role_v2 | ✅ RESOLVED |
| 2026-07-08 11:00 | GitHub Secrets updated | ✅ RESOLVED |
| 2026-07-08 12:00 | Old key disabled in Supabase | ✅ SECURED |
| 2026-07-08 13:00 | Security documentation created | ✅ COMPLETE |

---

## 🎯 **NEXT STEPS**

1. ✅ Verify backend works with new key
2. ✅ Test all API endpoints
3. ✅ Confirm GitHub Actions can access secrets
4. ✅ Document for future reference
5. ✅ Schedule security review (monthly)

---

**Status: INCIDENT RESOLVED - PREVENTIVE MEASURES IN PLACE** ✅

All systems are now secure. This incident has been documented and procedures updated to prevent recurrence.
