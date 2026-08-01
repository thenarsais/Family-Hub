# Family Hub — Setup & Development Guide

## Initial Setup

### 1. Install Dependencies
```bash
npm install --workspaces
```

### 2. Create Environment Files
```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
```

**Required variables** (app will crash without these):
- Backend: NODE_ENV, PORT, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, DATABASE_URL
- Frontend: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

### 3. Install Pre-commit Hooks
```bash
npx husky install
```

---

## Code Style: Absolute Imports (TypeScript Path Aliases)

Always use the `@/` path alias prefix for internal workspace module imports.

This prevents relative import spaghetti (`../../../../services/api`) and makes refactoring easier.

**Good:**
```typescript
import { api } from '@/services/api';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
```

**Bad:**
```typescript
import { api } from '../../../../services/api';
import Button from '../../../components/Button';
```

**This standard is enforced from the first file created.**

---

## Running the App

### Development Mode
```bash
npm run dev --workspaces
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Testing
```bash
npm run test --workspaces
npm run test:watch --workspaces
npm run test:coverage --workspaces
```

### Validation & Linting
```bash
npm run validate --workspaces
npm run lint --workspaces
npm run format --workspaces
```

### Tech Debt Inventory
```bash
npm run check:debt --workspaces
```

Shows all TODO/FIXME comments in the codebase.

---

## Phase 1: Enable Sentry Monitoring

1. Create free account at https://sentry.io
2. Create backend + frontend projects
3. Copy DSNs to `.env`:
   ```
   SENTRY_DSN=<backend-dsn>
   VITE_SENTRY_DSN=<frontend-dsn>
   ```
4. Change sampling rate from 0% to 100% in:
   - `backend/src/config/sentry.ts`
   - `frontend/src/config/sentry.ts`
5. Redeploy

---

## Phase 1: Enable Database Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Configure your project:
   ```bash
   cd backend
   supabase login
   supabase link --project-ref <your-project-id>
   ```

3. Test migrations locally:
   ```bash
   npm run migrate
   ```

4. Deploy to production:
   ```bash
   npm run migrate:prod
   ```

---

## Git Workflow

### Commit Guidelines
- Use conventional commits: feat:, fix:, docs:, test:, refactor:, etc.
- Write atomic commits (one logical change per commit)
- Pre-commit hooks run automatically on `git commit`
- Pre-push hooks run automatically on `git push` (validates entire test suite)

### Example Workflow
```bash
# Create feature branch
git checkout -b feat/new-feature

# Make changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "feat: Add new feature with tests and docs"

# Push to remote (pre-push validation runs automatically)
git push origin feat/new-feature

# Open PR against main
# CI/CD validates: lint, type-check, tests, coverage (80%+)
# After PR merged, auto-deploy to production
```

---

## Debugging

### Pre-commit Hook Issues
```bash
npx husky install
```

### Pre-push Hook Blocked Push
Fix the failing linter/test errors, then retry:
```bash
git push
```

Emergency override (production emergencies only):
```bash
git push --no-verify
```

### Environment Validation Errors
If you see "Missing required environment variables":
1. Copy template: `cp .env.example .env`
2. Fill in actual values
3. Restart the dev server

### Backend Won't Start
Check that `SUPABASE_SERVICE_KEY` is set in `.env`

### Frontend Won't Load
Check that `VITE_API_URL` points to running backend (default: http://localhost:3000)

---

## Performance & Quality

- **Test Coverage:** Enforced at 80%+ (pre-push hook checks this)
- **Bundle Size:** No single dependency should exceed 15KB
- **TypeScript:** Strict mode enforced (no `any` types allowed)
- **API Performance:** /health endpoint should respond in <100ms

---

**Last Updated:** August 1, 2026  
**Phase:** Phase 0 Complete, Phase 1 Ready
