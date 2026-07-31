# Family Hub — Implementation Checklist
**Phase 0: Foundation Setup**

> Assuming zero development work has been done. Follow this checklist in order to establish the complete architectural foundation before writing any feature code.

**Estimated Time:** 4-6 hours  
**Status:** Not Started  
**Last Updated:** July 31, 2026

---

## PRE-SETUP VERIFICATION (15 min)

Before beginning, verify you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed and configured (`git --version`)
- [ ] GitHub account with Family-Hub repo access
- [ ] Text editor or IDE (VS Code recommended)
- [ ] Supabase account with project created
- [ ] Project at: `C:\Users\priya\Family-Hub\`

---

## PHASE 0: FOUNDATION SETUP (4-6 hours)

### Section A: Repository Structure (30 min)

#### A1: Create Root Directory Structure
```bash
cd C:\Users\priya\Family-Hub
mkdir -p frontend backend docs config
```
- [ ] Root directory created
- [ ] frontend/ folder created
- [ ] backend/ folder created
- [ ] docs/ folder created
- [ ] config/ folder created

#### A2: Initialize Git Repository
```bash
git init
git config user.name "Priya"
git config user.email "thenarsais@gmail.com"
```
- [ ] Git initialized
- [ ] User name configured
- [ ] User email configured

#### A3: Create .gitignore
Create file: `C:\Users\priya\Family-Hub\.gitignore`

```
# Dependencies
node_modules/
/.venv/

# Environment
.env
.env.local
.env.*.local
.expo/

# Build output
dist/
build/
*.tsbuildinfo
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Temporary
tmp/
temp/
```

- [ ] .gitignore created
- [ ] Files configured to ignore

---

### Section B: Backend Setup (90 min)

#### B1: Initialize Backend Project
```bash
cd backend
npm init -y
```
- [ ] package.json created in backend/

#### B2: Install Backend Dependencies
```bash
npm install express typescript dotenv pg cors helmet winston axios
npm install -D @types/express @types/node ts-node nodemon
```
- [ ] Dependencies installed
- [ ] DevDependencies installed

#### B3: Create Backend TypeScript Config
Create file: `C:\Users\priya\Family-Hub\backend\tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noImplicitAny": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] tsconfig.json created
- [ ] Strict mode enabled

#### B4: Create Backend Directory Structure
```bash
mkdir -p src/{routes,services,middleware,database,utils,config}
mkdir -p tests
```
- [ ] Routes directory created
- [ ] Services directory created
- [ ] Middleware directory created
- [ ] Database directory created
- [ ] Utils directory created
- [ ] Config directory created
- [ ] Tests directory created

#### B5: Create Backend Environment Template
Create file: `C:\Users\priya\Family-Hub\backend\.env.example`

```
# Server
NODE_ENV=development
PORT=3000

# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_URL=

# External APIs
SMARTTHINGS_API_KEY=
GOOGLE_CALENDAR_API_KEY=

# Sentry
SENTRY_DSN=

# Logging
LOG_LEVEL=info
```

- [ ] .env.example created
- [ ] Placeholder variables added

#### B6: Configure Backend ESLint & Prettier
Create file: `C:\Users\priya\Family-Hub\backend\.eslintrc.json`

```json
{
  "env": {
    "node": true,
    "es2020": true
  },
  "extends": ["eslint:recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

- [ ] .eslintrc.json created

Create file: `C:\Users\priya\Family-Hub\backend\.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always"
}
```

- [ ] .prettierrc.json created

#### B7: Update Backend package.json Scripts
Edit `C:\Users\priya\Family-Hub\backend\package.json`, add to scripts:

```json
"scripts": {
  "build": "tsc",
  "dev": "ts-node src/index.ts",
  "start": "node dist/index.js",
  "lint": "eslint src/**/*.ts",
  "format": "prettier --write src/**/*.ts",
  "validate": "npm run lint && tsc --noEmit && npm run test",
  "test": "jest",
  "watch": "tsc --watch"
}
```

- [ ] Scripts updated

#### B8: Install & Configure Husky + Lint-Staged
```bash
npm install -D husky lint-staged @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint
npx husky install
```

- [ ] Husky installed
- [ ] Husky hooks directory created

Create file: `C:\Users\priya\Family-Hub\backend\.husky\pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

- [ ] Pre-commit hook created

Create file: `C:\Users\priya\Family-Hub\backend\.lintstagedrc.json`

```json
{
  "*.ts": ["eslint --fix", "prettier --write"]
}
```

- [ ] Lint-staged config created

---

### Section C: Frontend Setup (90 min)

#### C1: Create Vite React Project
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] Vite initialized with React + TypeScript
- [ ] Dependencies installed

#### C2: Install Frontend Additional Dependencies
```bash
npm install react-router-dom axios zustand tailwindcss @tailwindcss/forms lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] React Router installed
- [ ] Axios installed
- [ ] Zustand installed
- [ ] Tailwind CSS installed
- [ ] Lucide React icons installed

#### C3: Configure Tailwind CSS
Edit `C:\Users\priya\Family-Hub\frontend\tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#ff6b6b',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

- [ ] Tailwind config updated

#### C4: Create Frontend Environment Template
Create file: `C:\Users\priya\Family-Hub\frontend\.env.example`

```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_API_VERSION=v1
```

- [ ] .env.example created

#### C5: Configure Frontend ESLint & Prettier
Create file: `C:\Users\priya\Family-Hub\frontend\.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2020": true
  },
  "extends": ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "jsx": true
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

- [ ] .eslintrc.json created

Create file: `C:\Users\priya\Family-Hub\frontend\.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always",
  "jsxSingleQuote": true
}
```

- [ ] .prettierrc.json created

#### C6: Update Frontend package.json Scripts
Edit `C:\Users\priya\Family-Hub\frontend\package.json`, update scripts:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src/**/*.{ts,tsx}",
  "format": "prettier --write src/**/*.{ts,tsx}",
  "validate": "npm run lint && tsc --noEmit && npm run test",
  "test": "vitest"
}
```

- [ ] Scripts updated

#### C7: Create Frontend Directory Structure
```bash
mkdir -p src/{components,pages,hooks,services,stores,styles,utils}
```

- [ ] Components directory created
- [ ] Pages directory created
- [ ] Hooks directory created
- [ ] Services directory created
- [ ] Stores directory created
- [ ] Styles directory created
- [ ] Utils directory created

#### C8: Install & Configure Husky + Lint-Staged
```bash
npm install -D husky lint-staged @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint eslint-plugin-react eslint-plugin-react-hooks
npx husky install ../
```

- [ ] Husky and lint-staged installed

Create file: `C:\Users\priya\Family-Hub\frontend\.husky\pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

- [ ] Pre-commit hook created

Create file: `C:\Users\priya\Family-Hub\frontend\.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

- [ ] Lint-staged config created

---

### Section D: Root Configuration (30 min)

#### D1: Create Root .env.example
Create file: `C:\Users\priya\Family-Hub\.env.example`

```
# This is a placeholder for environment variables
# See backend/.env.example and frontend/.env.example for specific requirements
```

- [ ] Root .env.example created

#### D2: Create Root ESLint Config (Shared)
Create file: `C:\Users\priya\Family-Hub\.eslintrc.json`

```json
{
  "root": true,
  "extends": ["./.eslintrc.json"],
  "overrides": [
    {
      "files": ["backend/**/*"],
      "extends": ["./backend/.eslintrc.json"]
    },
    {
      "files": ["frontend/**/*"],
      "extends": ["./frontend/.eslintrc.json"]
    }
  ]
}
```

- [ ] Root ESLint config created

#### D3: Create Root Prettier Config
Create file: `C:\Users\priya\Family-Hub\.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always"
}
```

- [ ] Root Prettier config created

#### D4: Create Root .gitignore (Already Done - Verify)
- [ ] .gitignore exists at root

#### D5: Create Root package.json (Workspace - Optional but Recommended)
Create file: `C:\Users\priya\Family-Hub\package.json`

```json
{
  "name": "family-hub",
  "version": "1.0.0",
  "description": "Family Hub - Home automation and educational platform",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "validate": "npm run validate --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "npm run format --workspaces"
  }
}
```

- [ ] Root package.json created (workspace config)

---

### Section E: GitHub Actions CI/CD (30 min)

#### E1: Create GitHub Actions Workflow Directory
```bash
mkdir -p .github/workflows
```

- [ ] .github/workflows created

#### E2: Create CI Workflow
Create file: `C:\Users\priya\Family-Hub\.github\workflows\ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Backend validation
        run: cd backend && npm run validate

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Frontend validation
        run: cd frontend && npm run validate

      - name: Type-check both
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build
```

- [ ] CI workflow created

#### E3: Create Release Workflow (Optional)
Create file: `C:\Users\priya\Family-Hub\.github\workflows\release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, 'Release:')
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci --workspaces

      - name: Build
        run: npm run build --workspaces

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: Automated release
          draft: false
          prerelease: false
```

- [ ] Release workflow created (optional)

---

### Section F: Initial Git Commit (15 min)

#### F1: Stage All Foundation Files
```bash
git add -A
git status
```

- [ ] Files staged for commit
- [ ] Status reviewed

#### F2: Create Initial Commit
```bash
git commit -m "chore: Initialize project foundation with architecture and guardrails

- Set up frontend (React 18 + TypeScript + Vite)
- Set up backend (Node.js + Express + TypeScript)
- Configure ESLint and Prettier for both
- Set up Husky pre-commit hooks
- Create GitHub Actions CI/CD workflows
- Establish directory structure and configs

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

- [ ] Initial commit created

#### F3: Push to GitHub
```bash
git remote add origin https://github.com/thenarsais/Family-Hub.git
git branch -M main
git push -u origin main
```

- [ ] Remote added
- [ ] Branch pushed to GitHub
- [ ] Upstream tracking configured

---

## PHASE 0 COMPLETION CHECKLIST

### Verification
- [ ] All dependencies installed (frontend and backend)
- [ ] TypeScript configured with strict mode
- [ ] ESLint and Prettier configured
- [ ] Pre-commit hooks working
- [ ] GitHub Actions workflows created
- [ ] Repository pushed to GitHub
- [ ] All framework documents in place (FRAMEWORK.md, DECISION_MATRIX.md)
- [ ] Environment templates (.env.example) created

### Documentation
- [ ] README.md in root (links to FRAMEWORK.md)
- [ ] SETUP_GUIDE.md explains how to get running
- [ ] FRAMEWORK.md and DECISION_MATRIX.md at root
- [ ] Each directory has appropriate subdirectories

### Ready to Begin Phase 1
- [ ] Run `npm run dev --workspaces` works without errors
- [ ] Backend starts on http://localhost:3000
- [ ] Frontend starts on http://localhost:5173
- [ ] Both can be stopped with Ctrl+C without issues

---

## PHASE 1 NEXT STEPS (After Foundation Complete)

Once Phase 0 is complete, proceed to Phase 1 feature implementation:

1. Set up Supabase database connection
2. Implement authentication (demo credentials)
3. Create database schema and migrations
4. Build chore system
5. Build points tracking
6. Build learning module
7. Build dashboard

See FRAMEWORK.md for complete architecture guidance.

---

## TROUBLESHOOTING

### npm install fails
- [ ] Check Node.js version: `node --version` (need 18+)
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete node_modules and package-lock.json, reinstall

### Git commands fail
- [ ] Verify Git installed: `git --version`
- [ ] Check Git config: `git config --global user.name`

### TypeScript errors
- [ ] Run `npm run build` to see full errors
- [ ] Check tsconfig.json strict mode settings
- [ ] Ensure all dependencies installed

### Pre-commit hooks not working
- [ ] Verify husky installed: `ls .husky/`
- [ ] Check hook file permissions
- [ ] Re-run: `npx husky install`

---

**Phase 0 Status:** ⏳ Ready to Begin  
**Estimated Duration:** 4-6 hours  
**Next Review:** After Phase 0 completion
