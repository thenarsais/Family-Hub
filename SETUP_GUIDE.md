# Development Setup Guide - Family Hub

Quick start guide for getting the Family Hub project running locally.

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **npm 8+** (included with Node.js)
- **Git** ([download](https://git-scm.com/))

## Quick Start (Recommended)

### Windows
```powershell
.\setup-dev.ps1
```

### macOS / Linux
```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

This will:
- ✅ Install all dependencies
- ✅ Create `.env.local` files with Supabase credentials
- ✅ Verify TypeScript compilation
- ✅ Run validation checks

Takes ~3-5 minutes first time, ~30 seconds on subsequent runs.

---

## Manual Setup (If Needed)

### 1. Install Dependencies

```bash
npm ci
cd backend && npm ci
cd ../frontend && npm ci
cd ..
```

### 2. Create Environment Files

**Backend** (`backend/.env.local`):
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: Get actual credentials from:
- Supabase Dashboard → Settings → API
- `.env.example` files in backend/frontend directories
- Team vault or secure storage

### 3. Verify Build

```bash
cd backend && npm run build
cd ../frontend && npm run type-check
```

---

## Starting Development Servers

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

### Exposing your local backend (ngrok tunnel)

Google's OAuth consent flow needs a real, publicly-reachable HTTPS redirect URI --
`http://localhost:3000` doesn't work as a registered callback. To test the Google
Calendar OAuth flow (or any webhook that needs to reach your machine) against your
local backend:

```bash
npm run tunnel
```

This runs `ngrok http 3000`, forwarding a public `https://*.ngrok-free.app` URL to
your local backend. First time only: [sign up free at ngrok.com](https://ngrok.com)
and run `npx ngrok config add-authtoken <your-token>` -- ngrok requires an authtoken
even on the free tier. Once the tunnel is up, temporarily point
`GOOGLE_CLIENT_ID`'s authorized redirect URI (in the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials)) at the
ngrok URL's `/api/calendar/auth/google/callback` path -- see
[GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) for the full OAuth setup.

---

## Verify Everything Works

### 1. Check Build

```bash
npm run validate --workspaces
```

All tests, lints, and type checks should pass.

### 2. Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Info endpoint
curl http://localhost:3000/info
```

### 3. Open in Browser

Navigate to: http://localhost:5173

---

## Common Issues

### "Module not found" errors
```bash
# Clean reinstall
rm -rf node_modules
npm ci
npm run build --workspaces
```

### Port already in use
```bash
# Change backend port
cd backend
PORT=3001 npm run dev

# Update frontend .env.local
VITE_API_URL=http://localhost:3001
```

### Build failures
```bash
# Clear build cache
cd backend && rm -rf dist
cd ../frontend && rm -rf dist

# Rebuild
npm run build --workspaces
```

### Environment variables not loading
```bash
# Verify files exist
ls backend/.env.local
ls frontend/.env.local

# Verify contents
cat backend/.env.local
```

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run validate --workspaces` | Run all checks (lint, build, test) |
| `npm run build --workspaces` | Compile TypeScript both projects |
| `npm run test --workspaces` | Run all tests |
| `cd backend && npm run migrate` | Run database migrations |
| `cd backend && npm run seed` | Seed database with test data |
| `cd backend && npm run test:coverage` | Generate coverage report |
| `git log --oneline` | View recent commits |

---

## Database Setup (Optional)

If you need to run migrations locally:

```bash
cd backend
npm run migrate
npm run seed  # Add test data
```

---

## Next Steps

1. ✅ Development environment ready
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) for code style
3. Check [FRAMEWORK.md](FRAMEWORK.md) for architectural decisions
4. Start with an issue from the backlog

---

## Getting Help

- **Code structure?** See [FRAMEWORK.md](FRAMEWORK.md)
- **Compliance questions?** See [SUPABASE_INTEGRATION_COMPLETE.md](SUPABASE_INTEGRATION_COMPLETE.md)
- **Architecture?** See [DECISION_MATRIX.md](DECISION_MATRIX.md)
- **Tests?** Run `npm test` and check output

---

**Happy coding! 🚀**
