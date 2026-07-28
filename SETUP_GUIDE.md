# Family Hub - Development Environment Setup
## Fresh Install After Windows Reset

**Current Status:** Post-Windows reset, dependencies need to be installed  
**Estimated Time:** 30-45 minutes  
**Difficulty:** Medium

---

## ✅ What's Needed

### Required (Must Install)
- [ ] Node.js 18+ (includes npm)
- [ ] Git (already installed ✓)
- [ ] .env.local configuration file

### Recommended (For Full Stack)
- [ ] Docker Desktop (for Supabase local dev & Redis)
- [ ] VS Code with extensions
- [ ] PostgreSQL client tools (psql)

### Optional (For Deployment)
- [ ] GitHub CLI (gh)
- [ ] AWS CLI (if using cloud deployment)

---

## 📋 STEP 1: Install Node.js

### Windows Installation

**Option A: Using Installer (Easiest)**
1. Go to https://nodejs.org/
2. Download **LTS version** (18.x or 20.x)
3. Run the installer
4. Accept all defaults
5. **Restart PowerShell/Terminal**

**Option B: Using Chocolatey** (if installed)
```powershell
choco install nodejs
```

**Verify Installation:**
```powershell
node --version
npm --version
# Should output: v18.x.x or higher
```

---

## 📋 STEP 2: Set Up Environment Configuration

### Create .env.local

```powershell
cd C:\Users\priya\Family-Hub
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials (get from https://supabase.com):

```env
# Minimal required for local dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/family_hub
JWT_SECRET=change-me-in-production-$(openssl rand -base64 32)
```

**Note:** `.env.local` is in `.gitignore` and won't be committed.

---

## 📋 STEP 3: Install Backend Dependencies

```powershell
cd C:\Users\priya\Family-Hub\backend

# Install npm dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected output:** Should list all dependencies without errors

---

## 📋 STEP 4: Verify TypeScript Compilation

```powershell
# Build TypeScript
npm run build

# Should complete without errors and create ./dist/ directory
ls dist/
```

**Expected:** `dist/` folder with compiled JavaScript files

---

## 📋 STEP 5: Set Up Database (Choose One)

### Option A: Supabase Cloud (Easier for Testing)

1. Create account at https://supabase.com
2. Create new project
3. Get credentials from Settings → API
4. Update `.env.local` with values
5. Create tables (manual or via SQL in dashboard):

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create points table
CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  points INTEGER,
  activity_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Option B: Docker + PostgreSQL (Full Local Setup)

```powershell
# Install Docker Desktop from https://docker.com/products/docker-desktop

# Create docker-compose.yml in project root:
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: family_hub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:

# Start services
docker-compose up -d

# Verify
docker ps
```

---

## 📋 STEP 6: Run Migrations (Optional - if database tables needed)

```powershell
cd C:\Users\priya\Family-Hub\backend

# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

---

## ✅ STEP 7: Start Development Server

```powershell
cd C:\Users\priya\Family-Hub\backend

# Start dev server
npm run dev

# Expected output:
# 🚀 ====================================
#    Family Hub API - PRODUCTION READY
#    ====================================
# ✅ Server running on http://localhost:3000
```

---

## ✅ STEP 8: Verify It Works

### Test Health Endpoint

```powershell
# In another terminal/PowerShell window
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-27T...","environment":"local"}
```

### Test Database Connection

```powershell
curl http://localhost:3000/test-db

# Expected response:
# {"status":"Database connected!","data":[...]}
```

### Run Tests

```powershell
cd C:\Users\priya\Family-Hub\backend

# Run all tests
npm run test

# Run specific tests
npm run test:unit
npm run test:integration

# Check coverage
npm run test:coverage
```

---

## 🎯 Common Issues & Solutions

### Issue: "node: command not found"
**Solution:** Restart PowerShell/Terminal after installing Node.js

### Issue: "npm ERR! ERESOLVE unable to resolve dependency tree"
**Solution:** 
```powershell
npm install --legacy-peer-deps
```

### Issue: "Port 3000 already in use"
**Solution:** Change in `.env.local`:
```env
API_PORT=3001
```

### Issue: "SUPABASE_URL is required"
**Solution:** Verify `.env.local` has:
```env
SUPABASE_URL=https://your-project.supabase.co
```

### Issue: "Cannot connect to database"
**Solution:** 
1. Verify DATABASE_URL in `.env.local`
2. Verify database is running (Docker or Supabase)
3. Check PostgreSQL connection string format

### Issue: "TypeScript compilation errors"
**Solution:**
```powershell
# Delete node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run build
```

---

## 📦 Optional: Install VS Code Extensions

For better development experience:

```powershell
# Install extensions via CLI
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-mssql.mssql
code --install-extension ms-vscode-remote.remote-containers
```

Or manually in VS Code:
- Prettier - Code formatter
- ESLint
- REST Client
- Thunder Client (API testing)
- Docker
- PostgreSQL

---

## 🚀 Next Steps After Setup

1. **Verify all endpoints work** → Test auth, users, badges, points
2. **Run full test suite** → `npm run test`
3. **Check database schema** → Connect with psql or Supabase UI
4. **Try git workflow** → Create feature branch and make a test commit

---

## 📚 Useful Commands

```powershell
# Backend development
cd backend
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm test                 # Run tests
npm run test:coverage    # Coverage report
npm run migrate          # Run migrations
npm run seed             # Seed sample data

# Git workflow
git status               # Check changes
git add .                # Stage files
git commit -m "msg"      # Create commit
git push origin main     # Push to GitHub

# Docker (if using)
docker-compose up -d     # Start containers
docker-compose down      # Stop containers
docker ps                # List running containers
docker logs -f api       # View logs
```

---

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] npm works
- [ ] Backend dependencies installed (`node_modules/` exists)
- [ ] TypeScript compiles (`npm run build` succeeds)
- [ ] `.env.local` created with valid Supabase credentials
- [ ] Database accessible (Supabase or Docker)
- [ ] Dev server starts (`npm run dev` without errors)
- [ ] Health endpoint responds (`curl localhost:3000/health`)
- [ ] Tests pass (`npm test` all green)
- [ ] Git is configured

---

**Status:** Setup guide ready  
**Next:** Follow steps 1-8 above, then verify all checks  
**Estimated time to completion:** 30-45 minutes
