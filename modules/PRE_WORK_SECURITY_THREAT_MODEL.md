# Security & Threat Model
**Status:** Locked ✅ | Date: 2026-06-11

---

## System Context

- **Type:** Personal family use, self-hosted (Home Assistant)
- **Not public-facing:** No external users, no public URL
- **Users:** Krish (child), siblings, parents (Priya)
- **Data:** Learning progress, answer history, settings
- **Hosting:** Local Home Assistant instance (Windows laptop → mini PC)

---

## Threat Model

### Threats We Care About

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Krish accesses parent dashboard | HIGH | Medium | PIN protection + separate URL |
| Krish modifies his own data | MEDIUM | Low | No direct data editing UI |
| Data loss (device failure) | MEDIUM | HIGH | Local export + Google Drive (Phase 9) |
| Data corruption (IndexedDB) | LOW | HIGH | Data validation on load + repair |
| Sibling modifies Krish's data | LOW | Medium | Profile separation, sequential enforcement |
| XSS in user-created questions | MEDIUM | Medium | Sanitize all user inputs |
| Question content inappropriate | LOW | HIGH | Parent approval workflow |

### Threats We Don't Care About

| Threat | Why Not |
|--------|---------|
| External attackers | Not public-facing, local network only |
| DDoS | Local, no server |
| SQL injection | No SQL database |
| Authentication bypass | PIN is "good enough" for family use |
| Data theft | Local only, family data only |
| GDPR/COPPA compliance | Personal family use, not commercial |

---

## Security Controls

### Parent Dashboard Access
```
Control: PIN-protected URL (/family-hub/parent)
Implementation:
  - PIN set during Phase 8 first-time setup
  - Session persists 24 hours (then requires PIN again)
  - Wrong PIN: 3 attempts, then 5-minute lockout
  - PIN stored as hashed value (SHA-256) in IndexedDB
  - NOT stored in plaintext
```

### Input Sanitization (User-Created Questions)
```
When Krish creates a question:
  - Strip HTML tags from all text inputs
  - Limit character length (question ≤500 chars, answers ≤200 chars)
  - Validate structure (must have 4 answers, 1 correct marked)
  - Sanitize before storage and display
  
Implementation:
function sanitizeInput(text) {
  return text
    .replace(/<[^>]*>/g, '')     // Remove HTML tags
    .replace(/[<>"'&]/g, '')      // Remove dangerous characters
    .trim()
    .substring(0, 500);           // Enforce max length
}
```

### Data Integrity (IndexedDB)
```
On every app load:
  1. Validate IndexedDB schema version
  2. Check required tables exist
  3. Validate sample of records (correct structure)
  4. If corruption detected: attempt repair or notify parent
  5. Never silently fail — always show state to user
```

### Content Safety (Questions)
```
All questions go through:
  - Claude AI validation (automated)
  - Priya approval (manual spot-check)
  - User-created questions: parent approval required before going live
  - No auto-publish (parent must explicitly approve)
```

---

## Data Privacy Controls

### Data Access by User

| Data | Krish | Parents | Siblings |
|------|-------|---------|---------|
| Own answer history | ✅ Read | ✅ Full | ❌ None |
| Own performance stats | ✅ Read | ✅ Full | ❌ None |
| Own badges/streaks | ✅ Read | ✅ Full | ❌ None |
| Family team goals | ✅ Read | ✅ Full | ✅ Read |
| Sibling stats | ❌ None | ✅ Full | ❌ None |
| Parent dashboard | ❌ None | ✅ Full | ❌ None |
| Question bank | ✅ Read | ✅ Full | ✅ Read |

### Data Deletion Rights
```
Krish can request data deletion:
  - Request appears in parent dashboard
  - Parent must approve before data deleted
  - If approved: answer history deleted, profile reset
  - Questions created by Krish: archived (not deleted)

Parent can delete any child's data:
  - Available in Phase 8 parent dashboard
  - Full data wipe option per child
  - Confirmation required (2-step)
```

### Data Retention
```
Active data:    Always available in IndexedDB
Archived data:  After 1 year (move to archive store)
Deletion:       Never auto-deleted — parent approval required
Backup:         Manual export (Phase 2), Google Drive (Phase 9)
```

---

## XSS Prevention

### What We Sanitize
```
ALL user-generated content:
  - Krish's question text
  - Krish's answer options
  - Krish's fun facts
  - Chat messages (parent-child chat)
  - Goal names and descriptions
  - Profile names (child/parent)

System-generated content (questions sourced by Claude):
  - Validated during sourcing
  - Sanitized on display anyway (defense in depth)
```

### Display Rules
```javascript
// NEVER use innerHTML with user content
element.textContent = userInput;  // ✅ Safe
element.innerHTML = userInput;    // ❌ Never

// For system content (trusted HTML):
element.innerHTML = DOMPurify.sanitize(systemContent);  // ✅ Sanitized
```

---

## Error Handling & Logging

### What We Log
```
Client-side only (no server):
  - IndexedDB errors (console + user notification)
  - Failed question loads (console + retry)
  - Backup failures (console + user notification)
  - Data validation failures (console + parent alert)

What we DON'T log:
  - User answers (only stored, not logged)
  - PIN attempts (count only, not value)
  - Personal information
```

### Error Display Strategy
```
Critical errors (data loss risk):
  → Show prominent alert to parent
  → Suggest export/backup immediately

Non-critical errors (question load fails):
  → Retry silently (3 attempts)
  → Show friendly message if all retries fail
  → Suggest alternative activity (go read a book!)

Silent errors (analytics fail):
  → Log to console only
  → Never interrupt Krish's gameplay
```

---

## Security Testing Checklist

### Before Phase 1 Launch
- [ ] Test PIN protection (wrong PIN, lockout)
- [ ] Test XSS in user inputs (Phase 8, but validate early)
- [ ] Test IndexedDB data isolation (Krish can't see parent data)
- [ ] Test data corruption recovery
- [ ] Test export/import data integrity

### Before Phase 8 Launch
- [ ] Full security audit of parent dashboard
- [ ] Test PIN brute-force protection
- [ ] Verify sibling data isolation
- [ ] Test deletion workflow (Krish requests, parent approves)
- [ ] Verify no sensitive data in console logs

---

## Summary

**Security posture:** Appropriate for personal family use
- Not enterprise-grade, but solid for local deployment
- Main risks: data loss, accidental access, content safety
- Main mitigations: PIN, sanitization, parent approval workflows

**Philosophy:** Trust but verify within the family
- Krish shouldn't see parent controls (PIN)
- Krish can't accidentally break his own data
- Parents have full oversight and override
- System degrades gracefully when things go wrong
