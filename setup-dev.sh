#!/bin/bash

# ================================================
# Family Hub - Development Environment Setup
# ================================================
# One-command setup for developers
# Usage: ./setup-dev.sh

set -e

echo ""
echo "🚀 Family Hub - Development Setup"
echo "=================================="
echo ""

# ================================================
# COLOR CODES
# ================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ================================================
# CHECK PREREQUISITES
# ================================================
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found. Please install npm${NC}"
  exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# ================================================
# INSTALL DEPENDENCIES
# ================================================
echo "📦 Installing dependencies..."
echo ""

echo "  Installing root dependencies..."
npm ci --silent

echo "  Installing backend dependencies..."
cd backend
npm ci --silent
cd ..

echo "  Installing frontend dependencies..."
cd frontend
npm ci --silent
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ================================================
# SETUP ENVIRONMENT FILES
# ================================================
echo "🔧 Setting up environment files..."

if [ ! -f "backend/.env.local" ]; then
  echo "  Creating backend/.env.local..."
  cat > backend/.env.local << 'ENVFILE'
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
ENVFILE
  echo "  ✓ Created backend/.env.local"
else
  echo "  ✓ backend/.env.local already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
  echo "  Creating frontend/.env.local..."
  cat > frontend/.env.local << 'ENVFILE'
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://kzxnlhwyzcxrnloamkck.supabase.co
VITE_SUPABASE_ANON_KEY=[REDACTED_ANON_KEY]
VITE_SENTRY_DSN=
ENVFILE
  echo "  ✓ Created frontend/.env.local"
else
  echo "  ✓ frontend/.env.local already exists"
fi

echo -e "${GREEN}✓ Environment files ready${NC}"
echo ""

# ================================================
# VERIFY BUILD
# ================================================
echo "🔨 Verifying build..."

echo "  Building backend TypeScript..."
cd backend
npm run build --silent
cd ..

echo "  Type-checking frontend..."
cd frontend
npm run type-check --silent
cd ..

echo -e "${GREEN}✓ Build verification passed${NC}"
echo ""

# ================================================
# RUN VALIDATION
# ================================================
echo "✅ Running validation checks..."

if npm run validate --workspaces --silent 2>/dev/null; then
  echo -e "${GREEN}✓ All validation checks passed${NC}"
else
  echo -e "${YELLOW}⚠️  Some validation warnings (not blocking)${NC}"
fi

echo ""

# ================================================
# FINAL SETUP
# ================================================
echo "🎉 Development environment ready!"
echo ""
echo "Next steps:"
echo ""
echo "  1️⃣  Start the backend server:"
echo "     cd backend && npm run dev"
echo ""
echo "  2️⃣  In another terminal, start the frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  3️⃣  Open your browser:"
echo "     http://localhost:5173"
echo ""
echo "📚 Useful commands:"
echo ""
echo "  npm run validate --workspaces    - Run all checks"
echo "  npm run build --workspaces       - Build both packages"
echo "  backend/npm run migrate          - Run database migrations"
echo "  cd backend && npm run test       - Run backend tests"
echo "  cd frontend && npm run test      - Run frontend tests"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
