# Family Hub — Complete Architectural Framework
**Version:** 1.0  
**Date:** July 31, 2026  
**Status:** Framework Complete & Locked  
**Audience:** Developers, maintainers, future contributors

---

## Executive Summary

This document defines the complete architectural framework for Family Hub—a cross-platform home automation and educational system built for long-term maintenance and future commercial scaling.

**36 Architecture Decisions** across 8 categories establish guardrails for:
- ✅ Code quality & consistency
- ✅ Security & compliance (COPPA)
- ✅ Performance & reliability
- ✅ Developer experience
- ✅ Operational excellence
- ✅ Future scalability

**Key Principles:**
1. **Pragmatic Solo Development** — Optimized for 1 developer with 5 hrs/day available
2. **Long-Term Maintainability** — Standards prevent technical debt accumulation over years
3. **Phase-Based Growth** — Phase 1-8 (web) → Phase 9+ (mobile) with clear migration path
4. **Privacy-First Architecture** — COPPA compliance baked into schema, not bolted on
5. **Defensive Excellence** — Multiple safety layers (tests, CI/CD, RLS, error handling)

---

## Part 1: Core Architecture (14 Decisions)

### 1. Team Structure
**Decision:** Solo Developer  
**Details:** Priya only; Claude Code AI as development partner  
**Why:** Smaller team = simpler communication, faster decisions, clearer accountability  
**Implication:** Framework must accommodate solo dev pace (5 hrs/day, not 40+ hrs/week team)

### 2. Stakeholders & Decision Authority
**Decision:** Family as end users; Priya makes all technical decisions  
**Details:** Kids + family use the app; gather input but Priya decides direction  
**Why:** Avoids design-by-committee, keeps scope focused  
**Implication:** Documentation should be clear for non-technical family (what the app does), technical docs for Priya/Claude

### 3. Project Lifespan
**Decision:** Long-term maintenance (5+ years)  
**Details:** Expected to run for years; regular feature additions  
**Why:** Kids grow, family needs evolve, features expand  
**Implication:** Every decision prioritizes long-term maintainability over short-term speed

### 4. Data Sensitivity & Compliance
**Decision:** COPPA-Compliant from day one  
**Details:** Children's PII = high sensitivity; legal requirements enforced  
**Why:** Kids under 13; data is valuable to bad actors  
**Implication:** Architecture prevents COPPA violations by design (not just policy)

### 5. Acceptable Downtime & Data Loss
**Decision:** 1 hour downtime acceptable; data loss unacceptable  
**Details:** Annoying if offline but not critical; losing a week of chores would be bad  
**Why:** Family app, not SaaS; predictable usage; daily backups sufficient  
**Implication:** RTO 4-6 hours, RPO 1 day (not 99.9% uptime)

### 6. Available Development Time
**Decision:** 5 hrs/day × 2-3 months available  
**Details:** 200-300 hours total for Phase 1-8  
**Why:** Aggressive but achievable with AI assistance  
**Implication:** Prioritize features over perfection; framework prevents scope creep

### 7. Technical Expertise Level
**Decision:** Novice across all areas (DevOps, testing, frontend, backend)  
**Details:** Willing and able to learn; not deep expertise in any domain  
**Why:** Self-taught developer using Claude to accelerate learning  
**Implication:** Framework defaults to industry best practices (simpler than custom solutions)

### 8. Architecture Pattern
**Decision:** Monolith with service boundaries  
**Details:** One deployable unit; code organized by service for future extraction  
**Why:** Simpler than microservices; future-proof if scaling needed  
**Implication:** API versioning + RLS + business logic scoping prepares for multi-tenant split

### 9. Hosting Strategy
**Decision:** Supabase Cloud (database) + cloud frontend (Vercel/Netlify)  
**Details:** Database free tier; frontend free tier  
**Why:** Zero infrastructure cost; managed backups; no DevOps burden  
**Implication:** Portable (not locked to Supabase); disaster recovery via Git

### 10. Technology Stack
**Decision:** React 18 (Phase 1-8) + Node.js + TypeScript  
**Details:** Web: React; Mobile (Phase 9): Expo/React Native  
**Why:** Faster Phase 1 MVP; natural web dashboard fit; learn mobile when experienced  
**Implication:** Two codebases eventually, but lessons learned from web apply to mobile

### 11. Accessibility Standards
**Decision:** WCAG 2.1 Level AA with mobile-first design  
**Details:** 44x44 touch targets, VoiceOver/TalkBack support, 4.5:1 contrast, Reduce Motion support  
**Why:** Kids may have disabilities; inclusion matters  
**Implication:** ~5-10% development time cost; built-in, not retrofitted

### 12. Performance Budgets
**Decision:** Strict mobile targets (60 FPS, 50KB payloads, <2s startup)  
**Details:** Aggressive optimization for 5-10 Mbps home networks  
**Why:** Home network is slow; app abandonment if slow  
**Implication:** FlashList for lists, memoization for renders, cursor pagination, webp images

### 13. Browser & Device Support
**Decision:** Platform matrix (iOS 15+, Android 9.0+, 320px-2560px responsive, Safe Areas)  
**Details:** Support last 3-4 years of devices; responsive across small phones to large displays  
**Why:** Family dashboard works on tablets AND phones AND browsers  
**Implication:** Test on multiple screen sizes; Safe Area constraints for notches

### 14. Scalability & Multi-Tenancy
**Decision:** Multi-tenant ready (prepare but don't implement now)  
**Details:** family_id foreign keys, RLS policies, subscription_tier column (unused)  
**Why:** If Family Hub expands to other families, infrastructure is ready  
**Implication:** No retrofitting needed; zero overhead for single family

---

## Part 2: Development & Quality (6 Decisions)

### 15. Testing Coverage
**Decision:** 80%+ coverage (unit + integration tests)  
**Details:** Unit tests (70% of codebase), integration tests (critical paths only)  
**Why:** High confidence in code; catch regressions; long-term maintainability  
**Implication:** ~2 hrs/day on tests (not overkill); prevents bugs before production

### 16. Documentation Standards
**Decision:** Comprehensive (README, Architecture, API, Setup, Decisions, Troubleshooting, Runbooks)  
**Details:** Written as code is built (not after)  
**Why:** External memory for future sessions; onboarding for contributors  
**Implication:** ~1 hr/week on docs; invaluable when returning to code in 6 months

### 17. Git Workflow
**Decision:** Strict commits (feature branches, atomic commits, conventional format)  
**Details:** No direct commits to main; descriptive messages; squash merge  
**Why:** Clean history; easy to revert; self-documenting code  
**Implication:** Slightly slower per commit; massive payoff in long-term clarity

### 18. Code Quality Enforcement
**Decision:** Strict (TypeScript strict mode, ESLint, Prettier, pre-commit hooks)  
**Details:** No `any` types; auto-formatting on save; linting gates  
**Why:** Prevents entire classes of bugs; consistent style  
**Implication:** ~1 hour setup; then automatic

### 19. Dependency Management
**Decision:** Strict vetting (exact versions, >5k stars, 6-month release cycle, 15KB limit)  
**Details:** No ^ or ~ in package.json; monthly audits; security gates  
**Why:** Reproducible builds; prevent supply-chain attacks; bundle size control  
**Implication:** Discipline required; but prevents dependency hell

### 20. Technical Debt Management
**Decision:** Moderate tracking (standardized tags, npm run check:debt, Boy Scout rule)  
**Details:** TODO/FIXME tags, automated inventory, fix 1 per branch, GitHub issues for major work  
**Why:** Prevent debt accumulation; continuous improvement  
**Implication:** ~30 min/week on debt; prevents "rewrite everything" crises

---

## Part 3: Operations & Deployment (8 Decisions)

### 21. CI/CD Pipeline
**Decision:** Staged deployment (feature → PR → CI validation → squash merge → auto-deploy)  
**Details:** No direct commits to main; GitHub Actions validates all PRs; auto-deploy on merge  
**Why:** Quality gates before production; consistent deployment  
**Implication:** Every release tested automatically; zero manual deployment steps

### 22. Pre-Deployment Validation
**Decision:** Comprehensive checks (npm run validate, production builds, smoke testing)  
**Details:** Prettier, ESLint, tsc, expo tsc, all tests; verify production builds; manual smoke tests  
**Why:** Catch hidden errors (minification, tree-shaking) before production  
**Implication:** DEPLOYMENT_CHECKLIST.md before every merge to main

### 23. Database Migrations
**Decision:** Structured versioning (SQL files, Supabase CLI testing, rollback scripts)  
**Details:** All migrations tracked in Git; local testing required; rollback for each  
**Why:** Schema changes must be safe; easy to rollback if issues found  
**Implication:** Every schema change takes 1-2 hours (design + test + deploy)

### 24. Disaster Recovery
**Decision:** Strict implementation (infrastructure as code, portable seed, offline-first queuing)  
**Details:** All schema in Git migrations; seed.sql backup; client queues mutations offline  
**Why:** Complete rebuild possible from Git; don't depend on cloud backup  
**Implication:** DISASTER_RECOVERY.md runbook; quarterly testing

### 25. Backup & Recovery Strategy
**Decision:** Moderate RPO/RTO (daily Supabase backups, offsite copy weekly, 4-6 hr recovery)  
**Details:** Automated daily backups; manual offsite copy; tested quarterly  
**Why:** Lose at most 1 day of data; recover within 4-6 hours  
**Implication:** Weekly backup maintenance; zero cost (Supabase handles)

### 26. Monitoring & Observability
**Decision:** Moderate + Sentry (structured logging, health checks, error tracking)  
**Details:** /health endpoint, Sentry for exceptions (free tier), email/Slack alerts  
**Why:** Know when things break before family complains; proactive alerts  
**Implication:** ~1 hour setup; then automatic

### 27. Incident Response
**Decision:** Moderate playbook (RUNBOOK.md, Maintenance Mode, root-cause analysis)  
**Details:** Documented procedures for common failures; circuit breaker for backend downtime  
**Why:** Fast resolution during outages; prevent same bug twice  
**Implication:** Post-incident regression test required; captures learnings

### 28. Deployment Checklist
**Decision:** Moderate verification (automated CI + manual checks + post-deploy health)  
**Details:** CI runs automatically; manual verification (DB migrations, feature flags, smoke tests)  
**Why:** Safety gates before and after deployment  
**Implication:** 10-15 min pre-deployment ritual

---

## Part 4: Security & Privacy (3 Decisions)

### 29. COPPA Compliance
**Decision:** Architecture-enforced strict compliance  
**Details:**
- Onboarding: parent-only child provisioning (no independent child registration)
- Schema: is_under_13 boolean + birth_year (no exact DOB)
- Location: frontend-only coarse values (no GPS to backend)
- Retention: 30-day auto-purge for logs/media
- RLS: family_id isolation at database layer

**Why:** Legal requirement; prevents PII exposure; architecturally prevents violations  
**Implication:** Schema design forced; can't accidentally leak kids' data

### 30. Credentials & Secrets Management
**Decision:** Moderate+ (env files, rotation, RLS, audit logging)  
**Details:** .env.example templates, no hardcoded secrets, 90-day key rotation, Supabase RLS  
**Why:** Prevent credential leaks (already happened once in git history)  
**Implication:** Discipline on secrets; automated CI/CD secrets manager

### 31. API Versioning
**Decision:** Strict URL versioning (/api/v1/, /api/v2/)  
**Details:** Separate /routes/v1 and /routes/v2; support 2 concurrent versions; additive-only changes  
**Why:** Future-proof for external clients/integrations  
**Implication:** More folders to manage; but clear migration path

---

## Part 5: Features & Analytics (3 Decisions)

### 32. Feature Flags
**Decision:** Moderate configuration (config file OR Supabase JSON)  
**Details:** Feature toggles on/off, dev overrides via .env.development  
**Why:** Safe rollouts; can disable broken features without redeploy  
**Implication:** Slightly more code; but powerful control

### 33. Analytics & Metrics
**Decision:** Privacy-first local event logging (non-PII, non-blocking, database-only)  
**Details:** Structured events (no strings), async dispatch, no dashboards (query database directly)  
**Why:** COPPA-compliant analytics; understand usage without privacy concerns  
**Implication:** Manual queries to understand metrics; no pretty dashboards

---

## Part 6: Architectural Addendums (3 Decisions)

### 34. Web-to-Mobile Component Primitives
**Decision:** React Flexbox primitives only (no browser-only patterns)  
**Details:** Use Flexbox/NativeWind utilities for all layouts; avoid canvas, DOM mutations, HTML hacks  
**Why:** Ensure Phase 9 migration to React Native is smooth (1:1 translation)  
**Implication:** Component discipline during Phase 1-8; pays off in Phase 9

### 35. Sandbox Database Execution
**Decision:** Dual-project Supabase (dev + prod, no Docker dependency)  
**Details:**
- family-hub-dev: testing, migrations, validation scripts
- family-hub-prod: live family data only
- Use Supabase CLI for local testing (no Docker)

**Why:** Isolated testing; simpler for novice DevOps  
**Implication:** Two Supabase projects ($0 on free tier)

### 36. Definition of Done (DoD) Gateway
**Decision:** Four-part gate (no PR merge without all four)  
**Details:**
1. npm run validate passes (prettier, eslint, tsc, tests)
2. 80%+ code coverage verified
3. Tech debt tags swept and logged
4. /docs updated (API, migrations, architecture)

**Why:** Prevents incomplete features; ties all standards together  
**Implication:** Every PR is complete, tested, documented, debt-aware

---

## Implementation Roadmap

### Phase 0: Foundation (Week 1)
- Git + repository structure
- TypeScript + ESLint + Prettier + pre-commit hooks
- .env templates + secrets
- Supabase setup (dev + prod)
- COPPA schema design

### Phase 1: Infrastructure (Week 2-3)
- CI/CD pipeline (GitHub Actions)
- Monitoring (Sentry + health checks)
- Error handling + offline-first queuing
- AsyncStorage local caching
- Database migrations system

### Phase 2-8: Features (Weeks 4-12)
- Build Phase 1 features (chores, learning, points)
- Maintain 80% test coverage
- Write comprehensive documentation
- Track tech debt
- Regular deployments

### Phase 9+: Mobile & Commercial (Future)
- Expo/React Native app (reuse lessons from Phase 1-8)
- Multi-tenant infrastructure
- Billing/subscription system
- App Store release

---

## Decision Hierarchy

When conflicts arise, resolve in this order:

1. **COPPA Compliance** — Non-negotiable (legal)
2. **Data Safety** — Non-negotiable (family's data)
3. **Code Quality** — Enforced (prevent debt)
4. **Performance** — Optimized (home network constraint)
5. **Developer Experience** — Nice-to-have (solo dev context)

---

## Reference: All 36 Decisions at a Glance

| Category | Decisions | Status |
|---|---|---|
| Core Architecture | 1-14 | ✅ Locked |
| Development & Quality | 15-20 | ✅ Locked |
| Operations & Deployment | 21-28 | ✅ Locked |
| Security & Privacy | 29-31 | ✅ Locked |
| Features & Analytics | 32-33 | ✅ Locked |
| Architectural Addendums | 34-36 | ✅ Locked |

---

## How to Use This Framework

**For Implementation:**
1. Read Part 1 (Core Architecture) to understand the big picture
2. Follow Implementation Roadmap for setup order
3. Reference specific decisions as needed during development

**For Code Reviews:**
- Does the code follow these decisions?
- Do decisions need updating based on learnings?
- Are guardrails working or need adjustment?

**For New Developers/Contributors:**
- Start here for context
- Decisions explain WHY things are the way they are
- Reference docs (README, API, migrations) for HOW

**For Future Scaling:**
- Decisions 14, 31, 35 prepare for multi-tenant expansion
- No retrofitting needed if demand grows

---

## Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | July 31, 2026 | Initial framework complete; 36 decisions locked |

---

**Next Steps:**
1. Commit FRAMEWORK.md to git
2. Create IMPLEMENTATION_CHECKLIST.md (setup order)
3. Begin Phase 0: Foundation setup
4. Document decisions as implementation reveals learnings

**Questions?** Refer to DECISION_MATRIX.md for quick lookup or specific decision rationale.
