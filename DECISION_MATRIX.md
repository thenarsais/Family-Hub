# Family Hub — Complete Decision Matrix
**Date:** July 31, 2026 | **Project:** Family Hub | **Status:** Framework Complete

---

## ARCHITECTURE & INFRASTRUCTURE (14 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 1 | Team Structure | Solo Developer | Priya only; Claude Code AI assistant | Setup |
| 2 | Stakeholders | Family (Input Only) | Kids + spouse are end users; Priya makes all decisions | Setup |
| 3 | Project Lifespan | Long-Term (Years) | 5+ years maintenance; regular feature updates | Strategic |
| 4 | Data Sensitivity | COPPA-Compliant | Kids' PII = high sensitivity; legal requirements | Strategic |
| 5 | Downtime Tolerance | 1 Hour Acceptable | Annoying but OK; prefer no data loss | Setup |
| 6 | Available Time | 5 hrs/day × 2-3 months | 200-300 hours available; aggressive but achievable | Planning |
| 7 | Technical Expertise | Novice (Can Learn) | No deep DevOps/testing/frontend expertise; willing to learn | Planning |
| 8 | Architecture Pattern | Monolith + Service Boundaries | One deployable unit; code organized by service for future extraction | Setup |
| 9 | Hosting | Supabase Cloud + Cloud Frontend | Database on Supabase free tier; frontend on Vercel/Netlify free tier | Setup |
| 10 | Tech Stack | React 18 + Node.js + TypeScript | Web: React (Phase 1-8); Mobile: Expo/React Native (Phase 9+) | Setup |
| 11 | Accessibility | WCAG 2.1 Level AA | Mobile-first (44x44 touch targets, VoiceOver/TalkBack support) | Feature Design |
| 12 | Performance Budgets | Strict Mobile Targets | 60 FPS, 50KB payloads, <2s startup, webp images | Development |
| 13 | Browser/Device Support | Platform Matrix Floor | iOS 15+, Android 9.0+, 320px-2560px responsive, Safe Areas | Development |
| 14 | Scalability | Multi-Tenant Ready | family_id foreign keys, RLS policies, subscription_tier column (unused for now) | Setup |

---

## DEVELOPMENT & QUALITY (6 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 15 | Testing Coverage | High (80%+) | Unit tests (70%) + Integration tests (critical paths); ~2 hrs/day on tests | Development |
| 16 | Documentation | Comprehensive | README, Architecture guide, API docs, Setup guide, Decision log, Troubleshooting guide, Runbook | Documentation |
| 17 | Git Workflow | Strict Commits | Feature branches, atomic commits, conventional commits, descriptive messages | Setup |
| 18 | Code Quality | Strict (TypeScript + ESLint + Prettier + Hooks) | TypeScript strict mode, no `any`, ESLint enforcement, Prettier auto-format, pre-commit hooks | Setup |
| 19 | Dependencies | Strict Vetting | Exact versions (no ^ or ~), >5k GitHub stars, 6-month release cycle, TypeScript support, 15KB max per package | Development |
| 20 | Tech Debt | Moderate Tracking | Standardized tags (TODO/FIXME), npm run check:debt, Boy Scout rule (fix 1 per branch), GitHub issues for complex work | Development |

---

## OPERATIONS & DEPLOYMENT (8 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 21 | CI/CD Pipeline | Staged Deployment | Feature branches → PR → CI validates → squash merge to main → auto-deploy | Setup |
| 22 | Pre-Deployment | Comprehensive Validation | npm run validate (prettier, eslint, tsc, expo tsc, tests), production builds, smoke testing checklist | Setup |
| 23 | Database Migrations | Structured Versioning | Versioned SQL files, Supabase CLI local testing, rollback scripts, non-destructive only, sequential deployment | Setup |
| 24 | Disaster Recovery | Strict Implementation | Infrastructure as code (schema in Git), portable seed.sql, offline-first client queuing, DISASTER_RECOVERY.md playbook | Setup |
| 25 | Backup & Recovery | Moderate RPO/RTO | Daily Supabase backups, offsite copy weekly, documented restore procedure, quarterly testing, 4-6 hour RTO, 1 day RPO | Setup |
| 26 | Monitoring | Moderate + Sentry | Structured logging, health check endpoint (/health), Sentry for exceptions (free tier), email/Slack alerts | Setup |
| 27 | Incident Response | Moderate Playbook | RUNBOOK.md for common issues, Maintenance Mode circuit breaker, root-cause analysis, regression prevention tests | Documentation |
| 28 | Deployment Checklist | Moderate Verification | Automated checks (CI) + manual verification + post-deployment health check + rollback procedure | Setup |

---

## SECURITY & PRIVACY (3 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 29 | COPPA Compliance | Architecture-Enforced Strict | Onboarding guard (parent-only child provisioning), schema minimization (is_under_13 + birth_year), geofence restraints (no GPS storage), RLS isolation, 30-day retention | Setup |
| 30 | Credentials Management | Moderate+ (Env Files) | .env.example templates, no hardcoded secrets, GitHub Actions secrets for CI/CD, 90-day key rotation, Supabase RLS | Setup |
| 31 | API Versioning | Strict URL Versioning | /api/v1/, /api/v2/ paths, directory isolation (/routes/v1, /routes/v2), support 2 concurrent versions, additive-only changes, HTTP Deprecation headers | Development |

---

## FEATURES & ANALYTICS (3 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 32 | Feature Flags | Moderate Configuration | config/featureFlags.ts OR cached Supabase JSON, full-stack conditional isolation, .env.development overrides | Development |
| 33 | Analytics | Privacy-First Local | Non-PII events in Supabase, non-blocking async dispatch (useAnalytics), database-only (no dashboards), COPPA-compliant | Development |

---

## ARCHITECTURAL COMPILATION ADDENDUMS (3 decisions)

| # | Decision Area | Option Chosen | Key Details | Priority |
|---|---|---|---|---|
| 34 | Web-to-Mobile Components | React Flexbox Primitives | Use Flexbox/NativeWind utilities only (avoid browser-only canvas/DOM mutations), ensure 1:1 translation to React Native for Phase 9 migration | Development |
| 35 | Sandbox Database Protocol | Dual-Project Supabase | family-hub-dev (testing/migrations), family-hub-prod (production), no Docker dependency, cloud-isolated execution | Setup |
| 36 | Definition of Done (DoD) | Four-Part Gateway | npm run validate passes + 80%+ coverage + tech debt swept + /docs updated; PR cannot merge without all four gates passing | Development |

---

## KEY DIFFERENCES RESOLVED (4 critical decisions)

| # | Decision Area | Manifest Option | Framework Option | **CHOSEN** | Rationale |
|---|---|---|---|---|---|
| A | Versioning | Changesets (auto) | Manual SemVer | **Manual SemVer** | Solo dev, monthly releases, no workflow overhead |
| B | Frontend Phase 1 | Expo/React Native | React (Web) | **React (Web)** | Faster MVP, dashboard fits web, Expo in Phase 9 |
| C | Offline Strategy | Simple Caching | Offline-First Queuing | **Offline-First Queuing** | Better UX, consistent with disaster recovery guardrails |
| D | Offline Storage | AsyncStorage | MMKV | **AsyncStorage** | Simpler Phase 1, good for <1MB data, migrate if needed |

---

## IMPLEMENTATION PRIORITY LAYERS

### Layer 1: Foundation (Must Do First)
- Repository structure + Git setup
- TypeScript + ESLint + Prettier + pre-commit hooks
- .env templates + secrets management
- Supabase database + RLS policies
- COPPA architecture guardrails

### Layer 2: Infrastructure (Before Features)
- CI/CD pipeline (GitHub Actions)
- Monitoring (Sentry + health check)
- Error handling + offline-first queuing
- AsyncStorage local caching
- Database migrations system

### Layer 3: Development (During Features)
- 80% test coverage
- Comprehensive documentation
- Tech debt tracking
- Feature flags
- Accessibility (WCAG 2.1 AA)

### Layer 4: Operations (Before Release)
- Deployment checklist
- Incident response runbook
- Disaster recovery playbook
- Analytics events schema
- Pre-deployment validation

---

## QUICK REFERENCE BY CATEGORY

**Technology Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (Supabase Cloud)
- Mobile (Phase 9): Expo + React Native + TypeScript + NativeWind
- Offline: AsyncStorage (local caching + mutation queuing)
- Monitoring: Sentry (exceptions) + structured logging
- Deployment: GitHub Actions CI/CD

**Code Quality Standards:**
- TypeScript strict mode (no `any`)
- 80%+ test coverage
- ESLint + Prettier (enforced pre-commit)
- Conventional commits (feat:, fix:, etc.)
- Squash merge to main (atomic commits)

**Security & Data:**
- COPPA-compliant architecture
- RLS isolation by family_id
- 90-day credential rotation
- Non-PII event logging
- Offline-first data protection

**Deployment & Reliability:**
- Staged deployment (feature → PR → CI → merge → deploy)
- 4-6 hour disaster recovery (from Git)
- Daily automated backups
- Maintenance Mode circuit breaker
- Post-incident regression tests

---

## DEPENDENCIES (Major Packages to Install)

**Frontend:**
- react, react-dom, react-router-dom
- typescript, @types/react
- tailwindcss, tailwindcss/forms
- axios (API client)
- zustand (state management)
- lucide-react (icons)
- vite (build tool)
- vitest, @testing-library/react (testing)
- eslint, prettier, @typescript-eslint/*
- husky, lint-staged (git hooks)
- sentry/react (error tracking)

**Backend:**
- express, typescript
- pg (PostgreSQL client)
- axios (HTTP requests)
- dotenv (environment variables)
- cors, helmet (security)
- winston (logging)
- sentry/node (error tracking)
- jest, supertest (testing)
- eslint, prettier, @typescript-eslint/*
- husky, lint-staged (git hooks)

---

## DOCUMENT STATUS

- ✅ All 33 decisions finalized
- ✅ 4 key differences resolved
- ✅ Aligned with 22-Point Manifest
- ✅ Ready for comprehensive FRAMEWORK.md
- ⏳ Next: Implementation checklist + detailed documentation

**Last Updated:** July 31, 2026
**Session:** Framework Definition Complete
