# Git Hooks

Three hooks run automatically via Husky. All can be bypassed with `--no-verify` in a genuine
emergency, but that skips the exact checks that exist to catch real, recurring problems in this
repo's history — see the "why" under each one before reaching for it.

## `pre-commit`

Runs `node scripts/check-secrets.js` — scans staged files for credential-shaped strings (API
keys, service role keys, connection strings). **Why it exists**: this repo leaked real Supabase
credentials into git history three times before this scanner was added (see project memory
`credential-leak-prevention.md`). It's the single most important hook here.

## `commit-msg`

Runs `commitlint` against the commit message. Enforces Conventional Commits format:
`<type>(<scope>): <subject>`, header ≤72 characters, lowercase type, no trailing period on the
subject. Valid types: `feat, fix, docs, style, refactor, perf, test, chore, ci, revert`.

**Why it exists**: consistent history, and it's what makes the automated CHANGELOG generation
(see root `package.json`) possible at all — free-form messages can't be parsed into a changelog.

## `pre-push`

Two stages, both must pass:
1. `npm run validate --workspaces` — lint, format check, typecheck, tests (with coverage) across
   both workspaces.
2. Production build verification (`npm run build:prod` in both `backend/` and `frontend/`) —
   catches minification/tree-shaking bugs that don't show up in dev mode.

**Why it exists**: this is the last checkpoint before code reaches GitHub Actions CI. Failing
here is faster to fix than waiting for a CI run to fail on the same thing.

**Emergency override**: `git push --no-verify` — documented in the hook's own failure output.
Use it only when you understand exactly what check you're skipping and why it's safe to skip
this one time; it is not a way to route around a check that's actually catching something real.
