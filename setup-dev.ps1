# ================================================
# Family Hub - Development Environment Setup
# ================================================
# One-command setup for developers (Windows)
# Usage: .\setup-dev.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Family Hub - Development Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# ================================================
# CHECK PREREQUISITES
# ================================================
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
  exit 1
}

$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
  exit 1
}

Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm $npmVersion" -ForegroundColor Green
Write-Host ""

# ================================================
# INSTALL DEPENDENCIES
# ================================================
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Installing root dependencies..." -ForegroundColor Gray
npm ci --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
  exit 1
}

Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
Push-Location backend
npm ci --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
  Pop-Location
  exit 1
}
Pop-Location

Write-Host "  Installing frontend dependencies..." -ForegroundColor Gray
Push-Location frontend
npm ci --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
  Pop-Location
  exit 1
}
Pop-Location

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# ================================================
# SETUP ENVIRONMENT FILES
# ================================================
Write-Host "🔧 Setting up environment files..." -ForegroundColor Yellow

$backendEnvPath = "backend\.env.local"
if (-not (Test-Path $backendEnvPath)) {
  Write-Host "  Creating backend/.env.local..." -ForegroundColor Gray

  $backendEnv = @"
# Development Environment - Family Hub Backend
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Supabase Configuration
# Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_KEY=your-service-key-from-supabase

# PostgreSQL Connection (for migrations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional Features
SENTRY_DSN=
SMARTTHINGS_API_KEY=
GOOGLE_CALENDAR_API_KEY=
"@

  Set-Content -Path $backendEnvPath -Value $backendEnv -Encoding UTF8
  Write-Host "  ✓ Created backend/.env.local" -ForegroundColor Green
} else {
  Write-Host "  ✓ backend/.env.local already exists" -ForegroundColor Green
}

$frontendEnvPath = "frontend\.env.local"
if (-not (Test-Path $frontendEnvPath)) {
  Write-Host "  Creating frontend/.env.local..." -ForegroundColor Gray

  $frontendEnv = @"
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://kzxnlhwyzcxrnloamkck.supabase.co
VITE_SUPABASE_ANON_KEY=[REDACTED_ANON_KEY]
VITE_SENTRY_DSN=
"@

  Set-Content -Path $frontendEnvPath -Value $frontendEnv -Encoding UTF8
  Write-Host "  ✓ Created frontend/.env.local" -ForegroundColor Green
} else {
  Write-Host "  ✓ frontend/.env.local already exists" -ForegroundColor Green
}

Write-Host "✓ Environment files ready" -ForegroundColor Green
Write-Host ""

# ================================================
# VERIFY BUILD
# ================================================
Write-Host "🔨 Verifying build..." -ForegroundColor Yellow

Write-Host "  Building backend TypeScript..." -ForegroundColor Gray
Push-Location backend
npm run build --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  Backend build had warnings (continuing)" -ForegroundColor Yellow
}
Pop-Location

Write-Host "  Type-checking frontend..." -ForegroundColor Gray
Push-Location frontend
npm run type-check --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  Frontend type-check had warnings (continuing)" -ForegroundColor Yellow
}
Pop-Location

Write-Host "✓ Build verification complete" -ForegroundColor Green
Write-Host ""

# ================================================
# FINAL SETUP
# ================================================
Write-Host "🎉 Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1️⃣  Start the backend server:" -ForegroundColor Gray
Write-Host "     cd backend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  2️⃣  In another terminal, start the frontend:" -ForegroundColor Gray
Write-Host "     cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  3️⃣  Open your browser:" -ForegroundColor Gray
Write-Host "     http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  npm run validate --workspaces    - Run all checks" -ForegroundColor Gray
Write-Host "  npm run build --workspaces       - Build both packages" -ForegroundColor Gray
Write-Host "  cd backend && npm run migrate    - Run database migrations" -ForegroundColor Gray
Write-Host "  cd backend && npm run test       - Run backend tests" -ForegroundColor Gray
Write-Host "  cd frontend && npm run test      - Run frontend tests" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
