## Summary

<!-- What does this PR do, and why? -->

## Definition of Done

Per `FRAMEWORK.md` Decision #36 — all four required before merge:

- [ ] **`npm run validate` passes** (prettier, eslint, tsc, tests) — CI's Lint, Build, and Run Tests jobs are green
- [ ] **80%+ coverage held** on any changed backend/frontend code — `npm run test:coverage` in the affected workspace(s) doesn't drop below the enforced threshold
- [ ] **Tech debt swept** — `npm run check:debt` reviewed; any new `TODO`/`FIXME` left behind is intentional and has a tracking issue linked below (not just dropped in code)
- [ ] **Docs updated** — API surface, migrations, or architecture docs touched if this PR changes any of them (`docs/API.md`, `docs/archive/` migrations notes, `FRAMEWORK.md`/`DECISION_MATRIX.md` if a decision changed)

## Test plan

<!-- How was this verified? Manual steps, new tests added, etc. -->

## Related issues / debt

<!-- Link tracking issues for any deferred work or new TODOs -->
