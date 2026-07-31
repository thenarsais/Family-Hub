# Anti-Cheat & Data Validation Strategy

**Status:** Multi-phase approach for v1 and v2+

---

## PHASE 1 (v1): Client-Side Validation + Activity Logging

### Client-Side Sanity Checks

**Check 1: Impossible Speed**
```javascript
if (questionsAnswered > 30 && timeTaken < 60) {
  flagSuspicious("Impossible speed", {
    questionsAnswered,
    timeTaken,
    minTime: questionsAnswered * 2  // Minimum 2 sec per question
  });
  reject("That was too fast - try again");
}
```

**Check 2: Excessive Perfect Games**
```javascript
const perfectGamesToday = getTodaysPerfectGames();
if (perfectGamesToday > 10) {
  flagSuspicious("Too many perfect games", {
    count: perfectGamesToday,
    pattern: "token farming?"
  });
  warn("Wow, you're on fire! Taking a break?");
  // Allow it but log it
}
```

**Check 3: Device Clock Tampering**
```javascript
const lastPlayTime = state.lastSessionTime;
const now = new Date();
const timeDiff = now - new Date(lastPlayTime);

if (timeDiff < -3600) {  // Time went backward >1 hour
  flagSuspicious("Device clock set backward", {
    deviation: timeDiff,
    lastTime: lastPlayTime,
    currentTime: now
  });
  reject("Your device clock seems off - check settings");
}
```

**Check 4: Impossible Points**
```javascript
const maxPossiblePoints = calculateMaxPossible(gameType, difficulty);
if (earnedPoints > maxPossiblePoints * 1.5) {  // 50% buffer for calculation errors
  flagSuspicious("Points exceed maximum", {
    earned: earnedPoints,
    maximum: maxPossiblePoints,
    multiplier: earnedPoints / maxPossiblePoints
  });
  reject("Points calculation error - not saved");
}
```

**Check 5: Rapid Successive Wins**
```javascript
const lastFiveGames = getLastFiveGameResults();
const allPerfect = lastFiveGames.every(g => g.isPerfect);
const allInLast10Minutes = lastFiveGames.every(g => 
  (now - g.timestamp) < 600000  // 10 minutes
);

if (allPerfect && allInLast10Minutes) {
  flagSuspicious("Rapid perfect games", {
    count: 5,
    timespan: 10,
    tokens: 5  // Would earn
  });
  // Log but allow (could be legitimate skill)
}
```

**Check 6: Offline Play Detected**
```javascript
// If app was offline when result recorded
if (result.wasOffline && result.score > previousAverageScore * 2) {
  flagSuspicious("Offline play with unusual score", {
    offline: true,
    scoreJump: result.score - previousAverage,
    pattern: "possible offline manipulation?"
  });
  // Mark result as "needs verification"
}
```

### Activity Logging System

**What Gets Logged:**
```javascript
state.activityLog = [
  {
    timestamp: "2026-06-16T15:15:00Z",
    event: "game_completed",
    gameType: "quick_fire",
    difficulty: "medium",
    score: 150,
    correct: 8,
    total: 10,
    timeSpent: 120,  // seconds
    tokens: 1,
    flags: [],  // If sanity checks triggered
    offline: false
  },
  {
    timestamp: "2026-06-16T15:16:00Z",
    event: "game_completed",
    gameType: "word_scramble",
    difficulty: "hard",
    score: 95,
    wordsCorrect: 5,
    timeTaken: 300,
    flags: ["speed_anomaly"],  // Flagged by sanity check
    offline: false
  },
  // ... more events
]
```

**Activity Types Logged:**
- Game completions (with all details)
- Quest completions
- Streak changes
- Achievement unlocks
- Points earned
- Settings changes
- Timezone changes
- Token usage
- Device clock anomalies

### Parent Portal - Activity Review

**Parent View:**
```
Activity Log for Krish

[Today] [This Week] [Filter: All / Flagged Only]

June 16, 2026:
┌─────────────────────────────────┐
│ 3:15 PM: Quick-Fire             │
│ Score: 150 | 8/10 correct       │
│ Time: 2 min                     │
│ ⚠️ Flag: Speed anomaly          │
│                                 │
│ [Review] [Reset] [Adjust]       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 3:16 PM: Word Scramble          │
│ Score: 95 | 5 words solved      │
│ No flags                        │
│                                 │
│ [Approve] [More info]           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [Summary] Today: 5 flagged events
│ Patterns detected: Speed spikes at 3:15-3:20 PM
│ Recommendation: Normal activity (likely real skill)
│ [Investigate further] [Clear]   │
└─────────────────────────────────┘
```

**Parent Actions:**
- **Review:** See full game details
- **Reset:** Delete result (don't count points/streaks)
- **Adjust:** Manually change score if needed
- **Approve:** Mark as legitimate, clear flag
- **Investigate:** Deep dive into activity patterns

### Flagged Events Analysis

**System Analyzes Patterns:**
```
Pattern Detection Examples:

1. Speed Spike (3:15-3:20 PM)
   - 5 games completed
   - 4 flagged as "too fast"
   - Assessment: Possible skill surge OR suspicious
   - Recommendation: Human review

2. Token Farming
   - 10 perfect games in 1 hour
   - Earned 10 tokens (max pool: 5)
   - Assessment: Suspicious
   - Recommendation: Review + reset if needed

3. Offline Anomaly
   - Offline play with 5x normal score
   - Previous offline average: 100 pts
   - This offline: 500 pts
   - Assessment: Very suspicious
   - Recommendation: Reset to average or delete

4. Device Clock Manipulation
   - Time jumped backward 24 hours
   - Followed by daily reset trigger
   - Daily bonus reset early
   - Assessment: Likely tampering
   - Recommendation: Reset streaks, investigate
```

### Data Integrity Checks (On Sync to Google Drive)

**Before backing up to Google Drive:**
```javascript
function validateBeforeDriveSync(state) {
  const issues = [];
  
  // Check 1: Points math
  const expectedPoints = recalculateAllPoints(state);
  if (Math.abs(state.points.total - expectedPoints) > 10) {
    issues.push("Points mismatch");
  }
  
  // Check 2: Streak continuity
  const expectedStreaks = recalculateStreaks(state);
  if (state.streaks !== expectedStreaks) {
    issues.push("Streak mismatch");
  }
  
  // Check 3: Achievement validity
  const validAchievements = getValidAchievements(state);
  if (state.achievements.length > validAchievements.length) {
    issues.push("Invalid achievements detected");
  }
  
  if (issues.length > 0) {
    flagForParentReview({
      severity: "high",
      issues,
      state,
      timestamp: now
    });
    return false;  // Don't sync until reviewed
  }
  
  return true;  // Safe to sync
}
```

### v1 Summary

**Approach:** Light-weight client validation + comprehensive logging
- ✅ Catches obvious bugs (honest mistakes)
- ✅ Logs all activity for parent review
- ✅ Parent can manually verify/adjust
- ✅ Simple implementation, no backend needed
- ⚠️ Determined hacker could bypass (but why hack their own kid's app?)
- ⚠️ Puts review burden on parent

---

## PHASE 2 (v2+): Server-Side Validation

### When to Migrate to v2

**Triggers:**
- Multi-user support (shared leaderboards with friends/siblings)
- Web version (harder to control code)
- Shared competition (cheating affects others)
- Parent requests more security
- Privacy concerns (data validation on device vs. server)

### Architecture (v2)

**Google Cloud Function: Validate Game Result**

```javascript
exports.validateGameResult = async (req, res) => {
  const { gameType, difficulty, score, timeSpent, answers } = req.body;
  const userId = req.auth.uid;
  
  try {
    // Step 1: Verify user exists and is active
    const user = await getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Step 2: Check for impossible conditions
    const impossibleCheck = checkPhysicallyPossible(gameType, {
      questionsAnswered: answers.length,
      timeSpent,
      difficulty
    });
    
    if (!impossibleCheck.valid) {
      logSuspiciousActivity(userId, impossibleCheck);
      return res.status(400).json({ 
        error: impossibleCheck.reason,
        flagged: true 
      });
    }
    
    // Step 3: Verify score calculation
    const expectedScore = calculateScore(gameType, answers, difficulty, timeSpent);
    const scoreDifference = Math.abs(expectedScore - score);
    
    if (scoreDifference > 5) {  // Allow 5 point rounding difference
      logSuspiciousActivity(userId, {
        reason: "Score mismatch",
        expected: expectedScore,
        received: score
      });
      return res.status(400).json({ 
        error: "Score calculation mismatch",
        expected: expectedScore 
      });
    }
    
    // Step 4: Check for repeated cheating patterns
    const recentFlags = await getRecentFlags(userId);
    if (recentFlags.count > 5) {
      return res.status(403).json({ 
        error: "Multiple validation failures - please contact support",
        contacted_parent: true
      });
    }
    
    // Step 5: All checks passed - approve and store
    await storeValidatedResult(userId, {
      gameType,
      difficulty,
      score,
      timeSpent,
      timestamp: now,
      validated: true,
      serverTime: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      approved: true,
      score,
      pointsAwarded: expectedScore,
      message: "Result verified and recorded"
    });
    
  } catch (error) {
    logError(userId, error);
    return res.status(500).json({ error: "Validation error" });
  }
};
```

**Validation Rules (v2):**
```javascript
const validationRules = {
  quickFire: {
    maxQuestionsPerMinute: 10,      // Can't do 50 questions in 5 min
    minTimePerQuestion: 5,           // At least 5 seconds per question
    maxScore: 10000,                 // Absolute maximum possible
    accuracyRange: [0, 1]            // 0-100%
  },
  
  wordScramble: {
    maxWordsPerMinute: 6,
    minTimePerWord: 10,
    maxScore: 5000,
    wordLength: [4, 12]              // Valid word lengths
  },
  
  wordle: {
    maxGamesPerHour: 20,
    minTimePerGame: 30,              // Min 30 sec per game
    maxScore: 500,
    attemptsRange: [1, 6]
  },
  
  hangman: {
    maxGamesPerHour: 15,
    minTimePerGame: 20,
    maxScore: 300,
    livesRange: [1, 6]
  },
  
  trivia: {
    maxQuestionsPerHour: 50,
    minTimePerQuestion: 8,
    maxScore: 500,
    accuracyRange: [0, 1]
  }
};
```

**Data Flow (v2):**
```
Client                          Server (Google Cloud Functions)
│
├─ Play game locally
├─ Calculate score
├─ Record in localStorage
│
└─ Submit to server: ────────→ Function: validateGameResult()
                                ├─ Check physically possible?
                                ├─ Recalculate score
                                ├─ Verify calculation matches
                                ├─ Check pattern history
                                └─ Log result or reject
                      ←──────── Return: { approved, score, message }
│
├─ If approved: ✅ Save to state, sync to Drive
├─ If rejected: ❌ Show error, don't award points
│
└─ Parent notified if repeated failures
```

### Advantages (v2)

- ✅ User can't bypass validation (code is on server)
- ✅ Server is source of truth
- ✅ Can detect patterns across multiple plays
- ✅ Can detect anomalies (impossible speeds, repeated failures)
- ✅ Scales to multi-user (prevents cheating on shared leaderboards)
- ✅ Can auto-ban repeated cheaters

### Disadvantages (v2)

- ❌ More complex implementation
- ❌ Every game result needs server call (latency)
- ❌ Offline play becomes harder
- ❌ Server costs (though minimal for small user base)
- ❌ Requires authentication system

### Fallback Logic (v2)

**If server unreachable:**
```javascript
// Offline scenario
if (serverUnreachable) {
  // Local: Use Option B validation
  if (clientSideCheckPass) {
    saveToLocalStorage();
    markForSync();  // "Pending server verification"
    showMessage("Game saved - will verify when online");
  } else {
    reject("Local validation failed");
  }
}

// When connection restored
if (nowOnline && hasPendingResults) {
  submitAllPendingToServer();
  // Server validates all at once
}
```

---

## Implementation Timeline

**v1 (Current):** 
- 2-3 hours implementation
- Client-side checks + activity logging
- Parent manual review

**v2 Migration (Later):**
- 1-2 weeks implementation
- Server-side validation
- Happens after v1 stable and multi-user needed

---

## Success Metrics

**v1:**
- ✅ No obvious bypass paths
- ✅ Activity log catches >95% of suspicious patterns
- ✅ Parent can verify and adjust as needed
- ✅ False positive rate <10% (don't flag legitimate skill)

**v2:**
- ✅ Server validates 100% of game results
- ✅ Impossible results rejected automatically
- ✅ Cheater detection works across multiple plays
- ✅ Offline-to-online sync handles conflicts

