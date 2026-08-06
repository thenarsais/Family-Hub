# Phase 1 Testing Guide

**Complete validation checklist for all Phase 1 items**

Estimated time: **30-45 minutes** for full validation

---

## Setup (5 minutes)

```bash
cd C:\Users\priya\Family-Hub

# Fresh install to test setup script
./setup-dev.ps1    # Windows
# or
./setup-dev.sh     # macOS/Linux
```

Expected output:
```
✓ Node.js v18.x.x
✓ npm 8.x.x
✓ Dependencies installed
✓ Environment files ready
✓ Build verification complete
✓ Development environment ready!
```

---

## Item 1: Monorepo Setup ✅

### Test 1.1: Workspace Configuration
```bash
npm ls --depth=0
```
Expected: Lists `backend` and `frontend` workspaces

### Test 1.2: Run All Workspaces
```bash
npm run build --workspaces
```
Expected: Both backend and frontend build successfully without errors

### Test 1.3: Validate Across Workspaces
```bash
npm run validate --workspaces
```
Expected: All checks pass in both workspaces

---

## Item 2: 80%+ Test Coverage ✅

### Test 2.1: Backend Tests
```bash
cd backend
npm run test
```
Expected:
- Test suites pass
- Coverage output shown
- > 80% coverage

### Test 2.2: Frontend Tests (Mock)
```bash
cd ../frontend
npm run test
```
Expected:
- Test message: "Frontend tests configured for Phase 2"
- Exit code: 0

### Test 2.3: Test Coverage Report
```bash
cd ../backend
npm run test:coverage
```
Expected:
- Coverage report generated
- Shows % by category (Statements, Branches, Functions, Lines)
- All > 80%

### Test 2.4: Watch Mode (Optional)
```bash
npm run test:watch
# Press 'q' to quit
```
Expected: Tests rerun on file changes

---

## Item 3: Supabase Integration ✅

### Test 3.1: Environment Variables
```bash
cat backend/.env.local | grep SUPABASE
```
Expected: Shows SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

### Test 3.2: Database Connection
```bash
cd backend
npm run dev &
sleep 5
curl http://localhost:3000/health
```
Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-06T...",
  "version": "1.0.0"
}
```

### Test 3.3: Kill Dev Server
```bash
# Find and kill the npm process
ps aux | grep "npm run dev"
kill -9 <PID>
# or Ctrl+C in terminal
```

---

## Item 5: Lighthouse CI ✅

### Test 5.1: Build Frontend
```bash
cd frontend
npm run build
```
Expected:
- No errors
- dist/ folder created
- index.html + assets

### Test 5.2: View Lighthouse Config
```bash
cat lighthouserc.json | head -20
```
Expected: Shows performance thresholds (80+, 90+, 85+, 80+)

### Test 5.3: Local Audit (Optional)
```bash
# This requires the dev server running
cd frontend
npm run dev &
sleep 10

npm run lighthouse:collect
# Check .lighthouseci/ folder for results

kill %1  # Kill background process
```

Expected:
- Audits completed for 3 URLs
- .lighthouseci/ folder with JSON results

---

## Item 6: Accessibility Testing ✅

### Test 6.1: Accessibility Tests
```bash
cd frontend
npm run test:a11y
```
Expected:
- Accessibility tests run
- jest-axe validation passes
- No WCAG 2.1 violations in test components

### Test 6.2: Check Accessibility Guidelines
```bash
ls -lh ACCESSIBILITY_GUIDELINES.md
```
Expected: 300+ KB file with comprehensive guidelines

### Test 6.3: Manual a11y Check (Optional)
```bash
cd frontend
npm run dev &

# Open http://localhost:5173 in browser
# Check:
# - Can tab through all interactive elements
# - Focus indicators visible
# - Color contrast OK
# - Form labels associated

kill %1
```

---

## Item 7: npm Audit CI ✅

### Test 7.1: Backend Audit
```bash
cd backend
npm audit --audit-level=high
```
Expected: No vulnerabilities found (or only low/moderate)

### Test 7.2: Frontend Audit
```bash
cd frontend
npm audit --audit-level=high
```
Expected: No vulnerabilities found (or only low/moderate)

### Test 7.3: Audit JSON Report (Optional)
```bash
npm audit --json | jq .metadata.vulnerabilities
```
Expected: Shows vulnerability counts

---

## Item 8: Dev Setup Script ✅

### Test 8.1: Fresh Setup
```bash
# This was done at the beginning
# Verify it worked by checking:
ls -la backend/.env.local
ls -la frontend/.env.local
```
Expected: Both .env.local files exist and contain config

### Test 8.2: Setup Guide Exists
```bash
cat SETUP_GUIDE.md | head -30
```
Expected: Comprehensive setup documentation

---

## Item 9: Production Build Verification ✅

### Test 9.1: Backend Production Build
```bash
cd backend
npm run build:prod
```
Expected:
```
📦 Production Build Verification
==================================================

📊 Build Statistics:
   Production Code:   542.81 KB
   ✅ BUILD VERIFICATION PASSED
```

### Test 9.2: Frontend Production Build
```bash
cd frontend
npm run build:prod
```
Expected:
```
🎨 Frontend Production Build Verification
==================================================

📊 Build Statistics:
   Total Size:        280.49 KB
   ✅ BUILD VERIFICATION PASSED
```

### Test 9.3: Check Bundle Sizes
```bash
du -sh backend/dist
du -sh frontend/dist
```
Expected:
- Backend: ~500 KB
- Frontend: ~280 KB

---

## Item 10: Commit Message Linting ✅

### Test 10.1: Valid Commit
```bash
# Create a test branch
git checkout -b test/commit-linting

# Try valid commit
echo "# test" >> README.md
git add README.md
git commit -m "docs: test commit linting"
```
Expected:
```
✅ Commit message format is valid
[test/commit-linting ...] docs: test commit linting
```

### Test 10.2: Invalid Commit
```bash
# Modify file
echo "# test 2" >> README.md
git add README.md

# Try invalid commit
git commit -m "added test"
```
Expected:
```
❌ COMMIT REJECTED: Invalid message format
  Type must be lowercase
  Use imperative mood
```

### Test 10.3: Cleanup
```bash
git reset HEAD
git checkout -- .
git checkout main
git branch -D test/commit-linting
```

---

## Item 11: Disaster Recovery ✅

### Test 11.1: Check Recovery Guide
```bash
cat DISASTER_RECOVERY.md | head -50
```
Expected: Comprehensive backup and recovery procedures

### Test 11.2: Verify Backup Locations
```bash
# Check if git mirror exists (if you made one)
ls -la Family-Hub.git/  # from manual backup steps
```

### Test 11.3: Test Database Backup Command
```bash
# Don't actually run (requires credentials), but verify it's documented
grep "pg_dump" DISASTER_RECOVERY.md
```
Expected: Shows backup command documentation

---

## Item 12: COPPA Compliance ✅

### Test 12.1: Check Compliance Checklist
```bash
cat COPPA_COMPLIANCE_TEST.md | grep -A 3 "Age Gating"
```
Expected: Shows age gating requirements

### Test 12.2: Verify Privacy Policy Link
```bash
grep -r "privacy" frontend/src/ --include="*.tsx" | head -3
# Or check public files
ls -la PRIVACY_POLICY.md  # if exists
```

### Test 12.3: Check Compliance Status
```bash
grep "Status" COPPA_COMPLIANCE_TEST.md | head -5
```
Expected: Shows compliance verification status

---

## Item 13: Health Endpoint ✅

### Test 13.1: Start Backend
```bash
cd backend
npm run dev &
sleep 5
```

### Test 13.2: Test /health Endpoint
```bash
curl http://localhost:3000/health
```
Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-06T...",
  "version": "1.0.0"
}
```

### Test 13.3: Test /ready Endpoint
```bash
curl http://localhost:3000/ready
```
Expected:
```json
{
  "ready": true,
  "checks": {
    "database": "connected",
    "redis": "connected",
    "migrations": "complete"
  }
}
```

### Test 13.4: Test /info Endpoint
```bash
curl http://localhost:3000/info | jq '.uptime_seconds, .memory'
```
Expected: Shows uptime in seconds and memory usage

### Test 13.5: Check Response Time
```bash
time curl http://localhost:3000/health > /dev/null
```
Expected: Response time < 100ms

### Test 13.6: Load Test (Optional)
```bash
# Simple load test with 100 requests
for i in {1..100}; do
  curl -s http://localhost:3000/health > /dev/null &
done
wait
echo "100 requests completed"
```
Expected: All requests succeed, server remains responsive

### Test 13.7: Stop Backend
```bash
# Kill the background process
kill %1
# or Ctrl+C
```

---

## Item 14: E2E CI/CD Validation ✅

### Test 14.1: Check CI/CD Workflow
```bash
cat .github/workflows/ci.yml | grep "name:" | head -10
```
Expected: Shows 14 jobs (lint, build, test, api-tests, security, lighthouse, etc.)

### Test 14.2: Verify Pre-Push Hook
```bash
cat .husky/pre-push | head -20
```
Expected: Shows validation commands

### Test 14.3: Check Latest Run on GitHub
```bash
# Visit GitHub Actions
# https://github.com/thenarsais/Family-Hub/actions
# Check latest workflow run status
```
Expected: All jobs passing ✅

### Test 14.4: Make a Test Commit (Optional)
```bash
git checkout -b test/e2e-validation

# Make a small change
echo "# E2E Test" >> README.md
git add README.md

# Try to push (will run pre-push validation)
git commit -m "test: e2e validation"
git push -u origin test/e2e-validation
```
Expected:
- Commit succeeds ✅
- Push runs pre-push validation ✅
- GitHub Actions pipeline triggers ✅
- All jobs pass ✅

### Test 14.5: Cleanup
```bash
git checkout main
git branch -D test/e2e-validation
git push origin --delete test/e2e-validation
```

---

## Summary Tests

### Quick Validation (5 minutes)
```bash
# Just the essentials
npm run validate --workspaces
npm run build:prod --workspaces
curl http://localhost:3000/health
```

### Full Validation (30-45 minutes)
Follow all tests above in order

### Automated Validation (GitHub Actions)
```bash
# Push any commit to main/develop
# Check: https://github.com/thenarsais/Family-Hub/actions
# All 14 jobs should pass
```

---

## Success Criteria

### All Phase 1 Items Tested ✅

- [ ] Item 1: Monorepo builds without errors
- [ ] Item 2: Test coverage > 80%
- [ ] Item 3: Supabase connection works
- [ ] Item 5: Lighthouse config exists
- [ ] Item 6: Accessibility tests pass
- [ ] Item 7: npm audit shows no high/critical vulnerabilities
- [ ] Item 8: Setup script works
- [ ] Item 9: Production builds verify bundle sizes
- [ ] Item 10: Commit linting enforces format
- [ ] Item 11: Disaster recovery procedures documented
- [ ] Item 12: COPPA compliance checklist complete
- [ ] Item 13: Health endpoints respond correctly
- [ ] Item 14: CI/CD pipeline has 14 jobs

### Expected Results

| Item | Test | Expected |
|------|------|----------|
| 1 | `npm run build --workspaces` | ✅ No errors |
| 2 | `npm run test --workspaces` | ✅ > 80% coverage |
| 3 | `curl /health` | ✅ 200 + healthy status |
| 5 | `cat lighthouserc.json` | ✅ Thresholds defined |
| 6 | `npm run test:a11y` | ✅ Tests pass |
| 7 | `npm audit --audit-level=high` | ✅ No high/critical |
| 8 | `./setup-dev.ps1` | ✅ Succeeds in 3-5 min |
| 9 | `npm run build:prod` | ✅ Passes verification |
| 10 | `git commit` | ✅ Validates message format |
| 11 | `cat DISASTER_RECOVERY.md` | ✅ Procedures documented |
| 12 | `cat COPPA_COMPLIANCE_TEST.md` | ✅ Checklist complete |
| 13 | `curl /ready` | ✅ 200 + ready: true |
| 14 | GitHub Actions | ✅ 14 jobs pass |

---

## Troubleshooting

### Tests Fail?

```bash
# Clean reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm ci
npm run build --workspaces

# Clear cache
rm -rf .next dist backend/dist frontend/dist

# Retry tests
npm run test --workspaces
```

### Health Endpoint Not Responding?

```bash
# Make sure backend is running
ps aux | grep "npm run dev"

# If not found, start it
cd backend && npm run dev &

# Check server is listening
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Build Errors?

```bash
# Check Node/npm versions
node --version  # Should be 18+
npm --version   # Should be 8+

# Update if needed
npm install -g npm@latest

# Rebuild
npm run build --workspaces --verbose
```

### Git Hooks Not Running?

```bash
# Reinstall husky
npx husky install

# Verify hooks exist
ls -la .husky/
```

---

## Additional Checks

### Code Quality
```bash
npm run lint --workspaces      # ESLint
npm run type-check --workspaces # TypeScript
npm run test --workspaces       # Tests
```

### Performance
```bash
npm run build:prod --workspaces
du -sh backend/dist frontend/dist
```

### Security
```bash
npm audit --workspaces
npm run validate --workspaces  # Includes audit
```

### Documentation
```bash
# Check all required docs exist
ls -lh SETUP_GUIDE.md
ls -lh FRAMEWORK.md
ls -lh ACCESSIBILITY_GUIDELINES.md
ls -lh DISASTER_RECOVERY.md
ls -lh COPPA_COMPLIANCE_TEST.md
ls -lh HEALTH_ENDPOINT_TEST.md
ls -lh E2E_CICD_VALIDATION.md
ls -lh README.md
```

---

## When You're Done

If all tests pass:

```bash
echo "🎉 Phase 1 Validation Complete!"
echo "✅ All 13 items verified"
echo "🚀 Ready for Phase 2"
```

If any tests fail:

```bash
# Document the failure
git log --oneline -5
# Note which test failed
# Check TROUBLESHOOTING section above
# Re-run the test
```

---

**Estimated total time**: 30-45 minutes for full validation

**Success rate**: 100% expected (all Phase 1 items working)

Good luck! 🚀
