# Testing Strategy
**Status:** Locked ✅ | Date: 2026-06-11

---

## Testing Philosophy

- **Test what matters:** Core learning features first, gamification second
- **Real-world testing:** Krish tests Phase 1-3 before Phase 4 begins
- **Automated where practical:** Unit tests for logic, manual for UX
- **Don't over-engineer:** No complex CI/CD for a single-file app
- **Document failures:** Keep a bug log per phase

---

## Testing Levels

### Level 1: Unit Tests (Logic)
**What:** Individual functions tested in isolation
**When:** Written alongside code
**Tools:** Browser console + simple test runner

**Functions to unit test:**
```javascript
// Question selection
selectNextQuestion(pool, exclusionList, userId)  → returns question

// Streak calculation
calculateStreak(answerHistory, userId)           → returns streakCount

// Points calculation
calculatePoints(answer, difficulty, streakCount) → returns points

// Exponential decay
calculateWeight(daysSince)                       → returns weight (0-1)

// Badge threshold
calculateBadgeThreshold(categorySize, type)      → returns threshold

// PIN hashing
hashPin(pin)                                     → returns hashedPin

// Data sanitization
sanitizeInput(text)                              → returns cleanText

// Weekly rotation exclusion
isExcluded(questionId, answerHistory, userId)    → returns boolean
```

### Level 2: Integration Tests (Features)
**What:** Multiple functions working together
**When:** After each phase is built
**Tools:** Manual browser testing + console verification

**Integration scenarios per phase:**

**Phase 1:**
- [ ] Question loads from IndexedDB correctly
- [ ] Pre-load buffer populates (3-5 questions ready)
- [ ] localStorage fallback activates when IndexedDB unavailable
- [ ] UUID generated correctly (unique, consistent format)
- [ ] Question exclusion list works (no repeats within 7 days)

**Phase 2:**
- [ ] Answer saves to IndexedDB correctly
- [ ] Accuracy % calculates correctly (per category, per difficulty)
- [ ] Incorrect answer pool weights calculated correctly
- [ ] Streak increments and resets correctly (all 3 types)
- [ ] Grace-save costs 10% of daily points (minimum 1)
- [ ] Local export creates valid JSON file

**Phase 3:**
- [ ] Questions display correctly (large text, 4 options)
- [ ] Difficulty indicator shows correct color/label
- [ ] Progressive disclosure works (icon → tagline → tooltip)
- [ ] Accessibility features work (TTS, dyslexia font, high contrast)
- [ ] Onboarding tutorial appears at correct moments
- [ ] Network failure shows alternative activity message

**Phase 4:**
- [ ] Points awarded correctly (base + difficulty + streak bonus)
- [ ] All 3 streak types track correctly
- [ ] Badges unlock at correct thresholds
- [ ] Difficulty unlocks at 80% accuracy (Pro/Legend)
- [ ] Goals track progress correctly
- [ ] Family team goal progress visible on Sunday card

**Phase 5:**
- [ ] All 4 mini-games function correctly
- [ ] Wordle generates new puzzle each day
- [ ] Mini-game unlocks at correct milestones (unlock table)
- [ ] Power-ups earned from correct milestones
- [ ] Seasonal content loads for correct dates
- [ ] Notifications consolidate to single digest

**Phase 6:**
- [ ] Incorrect answers re-appear with correct frequency
- [ ] Time-decay weights correct (exponential formula)
- [ ] "You found this tricky" message appears after 3 wrong answers
- [ ] Parent alert sent when question answered wrong 3+ times
- [ ] Parent-child chat stores and displays correctly

**Phase 7:**
- [ ] Parallel sourcing batches process correctly
- [ ] Link validation detects broken links
- [ ] Difficulty calibration suggests changes at 80% consensus
- [ ] Question retirement archives correctly

**Phase 8:**
- [ ] Parent dashboard accessible at /family-hub/parent
- [ ] PIN protection works (lockout after 3 wrong attempts)
- [ ] Feature flags hide/show features correctly (progress preserved)
- [ ] Per-child settings apply correctly
- [ ] Data export creates valid CSV, PDF, JSON
- [ ] Multi-child profiles isolated correctly

### Level 3: User Acceptance Testing (UAT)
**What:** Real users test real scenarios
**When:** After Phase 1-3 complete, before Phase 4 begins
**Who:** Krish (primary), Priya (parent dashboard)

**Krish UAT Scenarios (Phase 1-3):**
```
Session 1 (Day 1):
  1. Open Activity Board, navigate to Trivia tab
  2. See profile setup wizard (5 steps)
  3. Complete setup (name, avatar, theme, goal, preferences)
  4. Answer first 5 questions
  5. See first streak notification

Session 2 (Day 2):
  6. Return next day, see streak counter
  7. Answer 5 more questions
  8. Check that Day 1 questions don't repeat
  9. See points accumulation
  10. Experience difficulty indicator (color, tagline, tooltip)

Session 3 (Day 3):
  11. Use hint button
  12. Get question wrong, see organic reinforcement (next session)
  13. Try accessibility features (if applicable)
  14. Test network failure message (disconnect, try to load)

Session 4 (Day 5+):
  15. Earn first badge
  16. See badge celebration
  17. Check badge progress indicators
  18. Review personal stats dashboard
```

**Priya UAT Scenarios (Phase 8):**
```
Session 1 (Parent Setup):
  1. Navigate to /family-hub/parent
  2. Set PIN (initial setup)
  3. Complete parent wizard (profile, settings, preferences)
  4. Set daily time limits for Krish
  5. Configure notification preferences

Session 2 (Monitoring):
  6. View Krish's learning dashboard (summary → drill-down → full)
  7. Check family stats view
  8. Review flagged questions (if any)
  9. View learning trends chart
  10. Export data (CSV + JSON)

Session 3 (Controls):
  11. Enable/disable features (mini-games on/off)
  12. Verify feature preserved when re-enabled
  13. Block a question (content filter)
  14. Block a topic/subtopic
  15. Approve a Krish-created question
```

---

## Performance Benchmarks

| Metric | Target | Test Method |
|--------|--------|-------------|
| Initial page load | <3 seconds | Chrome DevTools |
| Question display | <2 seconds | Manual timing |
| Text shows before image | Immediate | Visual check |
| IndexedDB write | <100ms | Performance API |
| IndexedDB read | <100ms | Performance API |
| Pre-load buffer fill | <500ms | Console timing |
| Animation smoothness | 60fps | Chrome DevTools |
| Memory usage | <50MB | Chrome Task Manager |

---

## Bug Severity Classification

| Severity | Definition | Examples | Response |
|----------|-----------|---------|---------|
| P1 Critical | Data loss, security breach, system crash | IndexedDB corruption, PIN bypass, XSS | Fix immediately, don't launch |
| P2 High | Core feature broken | Questions don't load, points don't save, streaks break | Fix before phase launch |
| P3 Medium | Feature degraded | Wrong difficulty label, notification missing | Fix before next phase |
| P4 Low | Minor UI issue | Button misaligned, animation off | Fix in buffer weeks 28-30 |
| P5 Enhancement | Nice-to-have | Minor UX improvement | Phase 8 or later |

---

## Bug Log Template

```markdown
## Bug Report
**Date:** YYYY-MM-DD
**Phase:** Phase X
**Severity:** P1/P2/P3/P4/P5
**Browser:** Chrome/Safari/Firefox
**Description:** What went wrong
**Steps to Reproduce:**
  1. Step 1
  2. Step 2
**Expected:** What should happen
**Actual:** What actually happened
**Fix:** How it was resolved
**Status:** Open/Fixed/Won't Fix
```

---

## Regression Testing

**After each phase launches:**
- Re-run all previous phase integration tests
- Ensure new code doesn't break existing features
- Focus on: question loading, points, streaks, data persistence

**Quick regression checklist (5 minutes, after any change):**
- [ ] Questions still load
- [ ] Points still calculate
- [ ] Streaks still track
- [ ] Data persists after page refresh
- [ ] Parent PIN still works (Phase 8+)

---

## Testing Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| Chrome DevTools | Performance, console errors, network | All |
| Chrome DevTools > Application > IndexedDB | Inspect stored data | 1+ |
| Chrome DevTools > Performance | Load time, animations | 3+ |
| Chrome DevTools > Accessibility | Contrast, ARIA, keyboard | 3+ |
| Manual console testing | Unit test logic functions | 1+ |
| Real device testing | iPad/touchscreen UX | 3 UAT |

---

## When to Stop and Fix vs. Move On

**Always stop and fix (P1/P2):**
- Data loss or corruption
- Security issues (XSS, PIN bypass)
- Core learning loop broken (no questions, no saves)

**Fix before next phase (P3):**
- Feature giving wrong results
- UI misleading or confusing
- Accessibility feature broken

**Move on, fix later (P4/P5):**
- Minor visual issues
- Enhancement requests
- Non-critical feature tweaks

---

## Krish Feedback Protocol

**During UAT sessions:**
1. Let Krish play naturally (don't guide)
2. Watch for confusion/hesitation (note it)
3. After session, ask:
   - "What was fun?"
   - "What was confusing?"
   - "What would you change?"
4. Document feedback in bug log (P4/P5 severity)
5. Prioritize feedback that affects core engagement

**Key things to watch for:**
- Does Krish understand the difficulty indicator?
- Does Krish use hints?
- Does Krish notice streaks/points?
- Does Krish respond to encouragement messages?
- Does Krish get frustrated at any point?

---

## Summary

**Testing priority order:**
1. Data integrity (never lose data)
2. Core learning loop (questions, answers, tracking)
3. Gamification accuracy (points, streaks, badges)
4. UX/accessibility (usability, accessibility)
5. Edge cases (grace-save, zero points, etc.)

**Launch gate criteria:**
- Zero P1 issues
- Zero P2 issues
- Krish UAT sessions complete (3+ sessions)
- Priya UAT sessions complete (3+ sessions)
- Cross-browser basic test done (Chrome required, Safari if available)
