# Documentation Archive

This folder contains outdated documentation from previous development sessions and explorations. These files are preserved for historical reference but are **superseded by the current framework documents** at the repository root.

## Why This Exists

During development of Family Hub, many exploratory and planning documents were created. Rather than delete them (losing historical context), they've been archived here.

## Current Documents (Use These Instead)

See the root directory for the **current, active framework**:
- `FRAMEWORK.md` — Complete architectural framework (36 decisions)
- `DECISION_MATRIX.md` — Quick-reference decision table
- `README.md` — Project overview
- `SETUP_GUIDE.md` — Setup instructions
- `MANUAL-TESTING-CHECKLIST.md` — Testing procedures

## What's Archived Here

**Phase Planning (Superseded by FRAMEWORK.md):**
- PHASE-1-*.md (multiple variants)
- PHASE1A_*.md (variants)
- PHASE-2-IMPLEMENTATION.md
- PHASE_8C_SPRINTS.md

**Architecture & Design (Superseded by FRAMEWORK.md):**
- ARCHITECTURE.md
- TECHNICAL_ARCHITECTURE_PHASE1.md
- UNIFIED_STATE_SCHEMA.md
- BUILD-DECISIONS-FINAL.md

**Analysis & Reviews (Superseded by DECISION_MATRIX.md):**
- GAP-ANALYSIS-FAMILY-HUB.md
- COMPREHENSIVE_*.md (multiple reviews)
- CONSOLIDATION-STATUS.md
- REBUILD-REVIEW-ANALYSIS.md

**Feature Explorations (Future Work):**
- HOME-MAINTENANCE-MODULE.md
- EXTENSIBILITY_*.md
- ORIGINAL_FEATURES_VS_EXTENSIBILITY.md
- PARENT-PORTAL-COMPREHENSIVE-DESIGN.md
- GAMES-REVIEW-GAPS-SUGGESTIONS.md
- ACTIVITY-BOARD-*.md
- TRIVIA-*.md

**Miscellaneous:**
- Various test reports, optimization guides, and implementation notes

## How to Use This Archive

- **Need historical context?** Search this folder for old decisions
- **Looking for a past analysis?** Files are preserved with original names
- **Want to see what was explored?** Browse feature exploration docs
- **Building Phase 2+?** Reference HOME-MAINTENANCE-MODULE.md and extensibility docs

## When to Archive More

Future documents should be archived when:
1. Superseded by newer decisions (like old ARCHITECTURE.md → current FRAMEWORK.md)
2. Feature explorations complete or deferred to future phases
3. Session summaries older than 1 month (keep in docs/archive)

---

## 2026-08-23 Addition: Home Assistant Era + Phase 1/2 Completion Snapshots

A second wave, archived during the SDLC-alignment review (see the project's own decision log,
`sdlc-alignment-decisions.md`, for full context):

**Home Assistant / mini-PC era** — `docs/roadmap.md` (renamed `roadmap.md` here) and its direct
companions describe an entirely different product generation (Home Assistant + dedicated mini PC
+ Nest/VoIP + moon-phase cards) that predates and has no relation to the current React +
Express + Supabase rebuild:
- `roadmap.md`, `features-home-assistant-era.md` (was `docs/features.md`), `hardware-setup.md`,
  `software-setup.md`, `session-log.md`, `known-issues.md`, `getting-started.md`

**Phase 1/2 completion snapshots** — point-in-time "✅ Complete" reports from the SDLC process
that ran before the 2026-08-22/23 rebuild. Their "Complete" status should not be trusted as
current — the rebuild found real bugs (disconnected points ledger, RLS/GRANT gaps, demo-auth
backdoor, migration drift) in code these reports had marked done:
- `PHASE_1_COMPLETION.md`, `PHASE_1_TESTING_GUIDE.md`, `PHASE1_EXECUTION_PLAN.md`,
  `PHASE_2_BACKEND_COMPLETE.md`, `PHASE_2_COMPLETE_SUMMARY.md`, `PHASE_2_DATABASE_SUMMARY.md`,
  `PHASE_2_FRONTEND_INTEGRATION.md`, `PHASE_2_IMPLEMENTATION_PLAN.md`,
  `SUPABASE_INTEGRATION_COMPLETE.md`, `SUPABASE_STATUS.md`, `TESTING_STATUS.md`,
  `SESSION_SUMMARY_2026-07-31.md`, `ACCESSIBILITY_GUIDELINES.md`, `COPPA_COMPLIANCE_TEST.md`,
  `DISASTER_RECOVERY.md`, `E2E_CICD_VALIDATION.md`, `HEALTH_ENDPOINT_TEST.md`, `LIGHTHOUSE_CI.md`,
  `PRODUCTION_BUILD_VERIFICATION.md`, `SENTRY_SETUP_GUIDE.md`, `SUPABASE_SETUP_GUIDE.md`,
  `DASHBOARD_REVIEW.md`, `DASHBOARD_UPDATE_COMPLETE.md`

**Kept at root, not archived** despite dated "Phase 1 Item N" headers, because their content is
still accurate day-to-day reference: `FRAMEWORK.md`, `DECISION_MATRIX.md`,
`REQUIREMENTS-VALIDATION-FRAMEWORK.md`, `PHASE0_AUDIT.md`, `COMMIT_GUIDELINES.md`,
`SETUP_GUIDE.md`, `GOOGLE_CALENDAR_SETUP.md`.

---

**Last Updated:** July 31, 2026 (original) / 2026-08-23 (this addition)
**Archive Version:** 1.1
