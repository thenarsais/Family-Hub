# Commit Message Guidelines

**Phase 1 Item 10** — Structured commit messages via `commitlint`

## Format

All commits must follow the Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type (Required)

Must be one of:

| Type | Purpose | Example |
|------|---------|---------|
| **feat** | New feature | `feat(auth): add two-factor authentication` |
| **fix** | Bug fix | `fix(dashboard): resolve chart rendering bug` |
| **docs** | Documentation | `docs(readme): update installation steps` |
| **style** | Code style (no logic) | `style(format): fix indentation in utils` |
| **refactor** | Code refactor | `refactor(api): extract database queries` |
| **perf** | Performance | `perf(search): optimize query performance` |
| **test** | Tests | `test(auth): add login flow tests` |
| **chore** | Build/deps | `chore(deps): update axios to v1.6.0` |
| **ci** | CI/CD | `ci: add performance benchmarking to workflow` |
| **revert** | Revert commit | `revert: revert "feat(auth): add 2FA"` |

## Scope (Optional)

Area of code affected. Use lowercase:

- **auth** — Authentication system
- **dashboard** — Dashboard page
- **api** — Backend API
- **db** — Database
- **ui** — User interface
- **chores** — Chore module
- **learning** — Learning module
- **points** — Gamification/points
- **badges** — Badge system
- **compliance** — COPPA compliance
- etc.

## Subject (Required)

- Lowercase
- Imperative mood ("add" not "adds" or "added")
- No period at end
- Max **72 characters**

✅ **Good**:
```
feat(auth): add password reset email validation
fix(api): handle null user references safely
docs: update deployment instructions
```

❌ **Bad**:
```
feat(auth): Adds password reset validation.  (72+ chars, period, capital)
fix(api): fixing null user issue             (not imperative)
docs: Updated deployment instructions.       (period)
```

## Body (Optional)

Explain **why**, not what (code shows what):

```
feat(dashboard): implement real-time activity feed

The activity feed now updates in real-time using WebSocket connections
instead of polling every 5 seconds. This reduces server load by 60% and
provides users with immediate feedback.

Also improves accessibility with aria-live regions for screen readers.
```

- Use imperative mood
- Wrap at 72 characters
- Separate from subject with blank line
- Explain motivation and context

## Footer (Optional)

Reference issues or breaking changes:

```
feat(auth): add session timeout

This adds a 30-minute idle timeout for security.

Closes #245
Related-To: #242
```

**Keywords**:
- `Closes #123` — Closes GitHub issue
- `Fixes #123` — Fixes GitHub issue
- `Related-To #123` — References related issue
- `BREAKING CHANGE:` — Indicates breaking API change

## Examples

### Feature with scope and body
```
feat(chores): add recurring chore scheduling

Allow parents to set up recurring chores that repeat daily, weekly, or
monthly. Automatically creates new chore instances at specified times.

Closes #156
```

### Bug fix
```
fix(dashboard): resolve mobile layout collapse

The dashboard grid was collapsing on screens under 768px due to a
missing media query breakpoint.
```

### Documentation
```
docs(api): add endpoint response schema examples
```

### Dependency update
```
chore(deps): update react to 18.3.0

Update React to latest LTS version for security fixes and performance
improvements. No breaking changes in our codebase.
```

### Multiple lines (body + footer)
```
refactor(db): consolidate query builders

Extract duplicate query logic into shared helpers to reduce code
duplication and improve maintainability.

Also adds query logging for debugging.

Related-To: #189
```

## Validation

Commitlint automatically validates on commit:

```bash
git commit -m "feat(auth): add login flow"
```

**Valid** → Commit succeeds ✅

```bash
git commit -m "added new feature"
```

**Invalid** → Commit rejected ❌
```
❌ COMMIT REJECTED: Invalid message format
  Type must be lowercase
  Use imperative mood
  ...
```

## Fixing Invalid Commits

### Option 1: Re-stage and recommit

```bash
git reset HEAD~1           # Undo last commit
git add .                  # Stage changes again
git commit -m "feat(auth): add two-factor authentication"
```

### Option 2: Amend last commit

```bash
git commit --amend
# Edit message in editor, save and close
```

### Option 3: Override (Emergency only)

```bash
git commit --no-verify -m "WIP: work in progress"
```

⚠️ **Avoid** `--no-verify` in normal workflow — it defeats the purpose.

## Tips

### IDE Integration

**VS Code**: Use CommitLint extension for real-time validation in commit dialog

**JetBrains**: Built-in commitlint support in commit message editor

### Commit Templates

Set a local template:

```bash
git config commit.template .gitmessage
```

Create `.gitmessage`:
```
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert
# Remember: imperative mood, no period, max 72 chars
```

### Searching Commits

Well-formatted commits are searchable:

```bash
# Find all features
git log --oneline --grep="^feat"

# Find fixes for auth
git log --oneline --grep="^fix(auth)"

# Find breaking changes
git log --oneline --grep="BREAKING"
```

## Team Guidelines

- **PR titles** use the same format (enforced by branch rules if desired)
- **Changelog generation** can be automated from commits
- **Git history** becomes searchable and understandable
- **Blame** is more informative with proper messages

## Tools

**Installed**:
- `commitlint` — Validates messages
- `husky` — Runs validation before commit

**Hook location**: `.husky/commit-msg`

**Configuration**: `commitlint.config.js`

## Common Mistakes

| ❌ Wrong | ✅ Correct | Issue |
|---------|-----------|-------|
| `Added login feature` | `feat(auth): add login feature` | Type missing, not imperative |
| `feat: Fix bug` | `fix: resolve login bug` | Wrong type, capitalized |
| `feat(Auth): add feature.` | `feat(auth): add feature` | Capital scope, period |
| `Add auth feature stuff` | `feat(auth): add authentication` | No type, vague |
| `feat(a): x` | `feat(auth): add login flow` | Scope too short, subject too short |

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/) — Official spec
- [commitlint docs](https://commitlint.js.org/) — Tool documentation
- [Our FRAMEWORK.md](./FRAMEWORK.md) — Architecture decisions

## FAQ

**Q: Can I use other types?**
A: No, stick to the list. Custom types break tools that parse commits.

**Q: Is scope required?**
A: Optional, but highly recommended for large codebases.

**Q: What if I made a typo in the last commit?**
A: Use `git commit --amend` to fix it (before pushing).

**Q: Can I bypass the check?**
A: Yes, but don't: `git commit --no-verify`. Use only for WIP branches.

**Q: What about merge commits?**
A: Merges are auto-generated. Just ensure clean, linear history via rebase.

---

**Active**: Phase 1 Item 10 ✅
**Updated**: 2026-08-06

All commits in this repo must follow this format. The `commit-msg` hook enforces it.
