# Family Hub - Unified State Schema (JSON Structure)

**Date:** 2026-06-29  
**Status:** Locked & Ready for Implementation  
**Organization:** Hybrid (Core data at root, system-specific data nested)

---

## Root State Structure

```json
{
  "_metadata": {
    "version": 1,
    "appVersion": "1.0.0",
    "lastModified": "2026-06-29T14:30:00Z",
    "lastSynced": "2026-06-29T14:30:00Z",
    "deviceId": "device-uuid-here",
    "userId": "user-uuid-here"
  },

  "_sync": {
    "isOnline": true,
    "isSyncing": false,
    "lastSyncTime": "2026-06-29T14:30:00Z",
    "syncErrors": [],
    "offlineQueueSize": 0,
    "nextRetryIn": null,
    
    "queue": [
      {
        "id": "queue-item-uuid",
        "action": "create|update|delete",
        "resourceType": "activity|goal|chore",
        "resourceId": "resource-uuid",
        "payload": {},
        "createdAt": "2026-06-29T14:00:00Z",
        "syncedAt": null,
        "retryCount": 0
      }
    ]
  },

  "_system": {
    "theme": "seasonal|dark|light",
    "seasonalTheme": "spring|summer|fall|winter",
    "language": "en|gu",
    "timezone": "America/New_York",
    "deviceType": "monitor|mobile|tablet",
    "osType": "web|ios|android|linux"
  },

  // CORE DATA (Shared across all systems)
  "users": {
    "current": {
      "id": "user-uuid",
      "email": "parent@example.com",
      "name": "Parent Name",
      "role": "parent|child",
      "accountType": "primary|coparent|guardian",
      "createdAt": "2026-01-01T00:00:00Z",
      "lastLogin": "2026-06-29T14:30:00Z"
    },
    "linkedAccounts": [
      {
        "id": "child-uuid",
        "name": "Krish",
        "role": "child",
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ]
  },

  "profile": {
    "parentProfile": {
      "id": "user-uuid",
      "email": "parent@example.com",
      "name": "Parent Name",
      "avatar": "emoji|url",
      "timezone": "America/New_York",
      "notifications": {
        "soundEnabled": true,
        "pushEnabled": true,
        "emailDigest": "weekly|daily|off"
      }
    },
    "childProfile": {
      "id": "child-uuid",
      "name": "Krish",
      "displayName": "KrishStar",
      "avatar": "🧠",
      "dateOfBirth": "2015-03-15",
      "currentStreak": 7,
      "pointsTotal": 2450,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  },

  "calendar": {
    "events": [
      {
        "id": "event-uuid",
        "title": "School",
        "description": "School day",
        "startDate": "2026-06-29",
        "startTime": "08:00",
        "endTime": "15:00",
        "allDay": false,
        "timezone": "America/New_York",
        "type": "school|meal|appointment|personal|chore",
        "color": "#3498db",
        "recurrence": "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
        "linkedUsers": ["parent-uuid", "child-uuid"],
        "syncedTo": {
          "google": "google-event-id",
          "outlook": null,
          "apple": null
        },
        "lastSyncedAt": "2026-06-29T14:30:00Z",
        "createdAt": "2026-06-29T14:30:00Z",
        "updatedAt": "2026-06-29T14:30:00Z"
      }
    ],
    "personalItems": [
      {
        "id": "item-uuid",
        "date": "2026-06-29",
        "title": "Reminder",
        "type": "reminder|task|note|homework|sports|social|practice|event|appointment|custom",
        "emoji": "🔔",
        "time": "14:30",
        "allDay": false,
        "visibility": "private|shared",
        "haSyncEnabled": false,
        "haSynced": false,
        "linkedModuleId": null,
        "linkedModuleType": null,
        "connectedPeople": ["krish"],
        "completed": false,
        "completedAt": null,
        "notes": null,
        "createdAt": "2026-06-29T14:30:00Z"
      }
    ]
  },

  "chores": {
    "tasks": [
      {
        "id": "chore-uuid",
        "title": "Wash dishes",
        "priority": "low|medium|high",
        "pointsValue": 10,
        "isRecurring": false,
        "dueDate": "2026-06-29",
        "status": "pending|in_progress|completed|missed",
        "completedAt": null,
        "assignedTo": ["krish"],
        "createdAt": "2026-06-29T14:30:00Z"
      }
    ]
  },

  "meals": {
    "weekPlan": [
      {
        "date": "2026-06-29",
        "mealType": "breakfast|lunch|dinner|snack",
        "title": "Oatmeal",
        "recipeId": "recipe-uuid",
        "ingredients": [],
        "prepTime": 15,
        "cookTime": 5,
        "completed": false
      }
    ]
  },

  "shopping": {
    "items": [
      {
        "id": "item-uuid",
        "name": "Milk",
        "quantity": 2,
        "unit": "gallons",
        "category": "dairy",
        "addedBy": "parent-uuid|child-uuid",
        "addedAt": "2026-06-29T14:30:00Z",
        "completed": false,
        "completedAt": null,
        "notes": "Almond milk"
      }
    ]
  },

  // ACTIVITY BOARD DATA
  "activityBoard": {
    "games": {
      "sessions": [
        {
          "id": "session-uuid",
          "gameType": "wordle|quickfire|scramble|hangman",
          "difficulty": "easy|medium|hard",
          "startedAt": "2026-06-29T14:00:00Z",
          "completedAt": "2026-06-29T14:05:00Z",
          "status": "in_progress|completed|abandoned",
          "score": 150,
          "hintsUsed": 1,
          "livesRemaining": 2,
          "metadata": {}
        }
      ],
      "stats": {
        "totalPlayed": 45,
        "totalWins": 32,
        "favoriteGame": "wordle",
        "bestScore": 200
      }
    },

    "trivia": {
      "sessions": [
        {
          "id": "session-uuid",
          "category": "Geography",
          "difficulty": "level1|level2|level3|level4",
          "questionsAttempted": 10,
          "questionsCorrect": 8,
          "accuracy": 0.80,
          "startedAt": "2026-06-29T14:00:00Z",
          "completedAt": "2026-06-29T14:10:00Z",
          "hintsUsed": 2,
          "pointsEarned": 120
        }
      ],
      "categoryMastery": {
        "Geography": {
          "questionsAnswered": 50,
          "correctAnswers": 40,
          "accuracy": 0.80,
          "currentLevel": 3,
          "longestStreak": 8,
          "currentStreak": 5,
          "pointsEarned": 450
        }
      },
      "stats": {
        "totalAnswered": 500,
        "totalCorrect": 400,
        "overallAccuracy": 0.80,
        "longestStreak": 12,
        "currentStreak": 7
      }
    },

    "quests": {
      "daily": [
        {
          "id": "quest-uuid",
          "title": "Play 2 games",
          "type": "games|trivia|homework|habits|reading|gujarati|mood|kungfu|general",
          "status": "pending|completed",
          "completedAt": null,
          "pointsBonus": 50,
          "swapsUsedToday": 0
        }
      ],
      "history": [],
      "stats": {
        "completionRate": 0.95,
        "currentStreak": 7,
        "longestStreak": 30
      }
    },

    "habits": [
      {
        "id": "habit-uuid",
        "name": "Exercise",
        "emoji": "💪",
        "frequency": "daily|weekly",
        "targetCount": 1,
        "pointsPerCompletion": 5,
        "difficulty": "easy|medium|hard",
        "currentStreak": 5,
        "longestStreak": 20,
        "totalCompletions": 45,
        "logs": [
          {
            "date": "2026-06-29",
            "completionCount": 1,
            "notes": "30 min run",
            "createdAt": "2026-06-29T18:00:00Z"
          }
        ]
      }
    ],

    "reading": {
      "sessions": [
        {
          "id": "session-uuid",
          "title": "Harry Potter",
          "type": "book|article|comic|passage|other",
          "minutesRead": 45,
          "timerUsed": true,
          "rating": 5,
          "reactionEmoji": "😄",
          "genre": "Fantasy",
          "completed": false,
          "completedAt": null,
          "createdAt": "2026-06-29T19:00:00Z"
        }
      ],
      "stats": {
        "booksCompleted": 7,
        "totalMinutesRead": 2340,
        "weeklyGoal": 60,
        "weeklyProgress": 45,
        "currentStreak": 5
      }
    },

    "gujarati": {
      "currentPhase": 2,
      "phases": [
        {
          "id": 1,
          "name": "Foundations",
          "completed": true,
          "completedDate": "2026-05-01"
        }
      ],
      "lessons": [
        {
          "id": "lesson-uuid",
          "phase": 2,
          "name": "Core Vocabulary",
          "completed": true,
          "completedDate": "2026-06-28",
          "timeSpent": 18,
          "perfectPractice": true
        }
      ],
      "vocabulary": [
        {
          "word": "namaste",
          "gujaratiScript": "નમસ્તે",
          "meaning": "Hello",
          "phase": 1,
          "learnedDate": "2026-05-15",
          "known": true
        }
      ],
      "stats": {
        "totalWordsLearned": 87,
        "totalStudyMinutes": 420,
        "currentStreak": 5
      }
    },

    "mood": {
      "entries": [
        {
          "id": "entry-uuid",
          "date": "2026-06-29",
          "timestamp": "2026-06-29T18:00:00Z",
          "emoji": "😊",
          "energyLevel": 7,
          "notes": "Had a great day",
          "isSensitive": false
        }
      ],
      "stats": {
        "todayMood": "😊",
        "currentStreak": 5,
        "longestStreak": 12,
        "averageMood": 4.2
      }
    },

    "kungfu": {
      "sessions": [
        {
          "id": "session-uuid",
          "type": "class|practice",
          "durationMinutes": 60,
          "rating": 4,
          "techniques": ["punch", "kick"],
          "loggedAt": "2026-06-29T18:00:00Z"
        }
      ],
      "beltProgression": [
        {
          "belt": "white",
          "achievedDate": "2026-01-15"
        }
      ],
      "stats": {
        "totalSessions": 24,
        "currentStreak": 3
      }
    },

    "homework": {
      "assignments": [
        {
          "id": "assignment-uuid",
          "subject": "Math",
          "title": "Chapter 5 Exercises",
          "priority": "low|medium|high",
          "parentEstimate": 45,
          "krishEstimate": 40,
          "dueDate": "2026-06-30",
          "status": "pending|in_progress|completed|late|missed",
          "completedAt": null,
          "pointsAwarded": null,
          "createdAt": "2026-06-29T14:30:00Z"
        }
      ]
    },

    "goals": {
      "active": [
        {
          "id": "goal-uuid",
          "title": "Play 10 games this week",
          "type": "weekly|monthly|custom",
          "difficulty": "easy|medium|hard|expert",
          "targetMetric": "games_played",
          "targetValue": 10,
          "currentValue": 6,
          "completionBonus": 50,
          "startDate": "2026-06-23",
          "endDate": "2026-06-30",
          "status": "active|completed|expired|abandoned",
          "createdAt": "2026-06-23T10:00:00Z"
        }
      ],
      "history": [],
      "stats": {
        "totalCompleted": 12,
        "completionRate": 0.92
      }
    },

    "badges": {
      "unlocked": [
        {
          "id": "badge-uuid",
          "key": "first_quest",
          "name": "First Quest",
          "tier": "bronze",
          "unlockedAt": "2026-06-20T14:30:00Z",
          "pointsValue": 0
        }
      ],
      "stats": {
        "totalUnlocked": 5,
        "totalAvailable": 400
      }
    },

    "streaks": {
      "active": {
        "dailyActivity": {
          "count": 7,
          "lastCompletedDate": "2026-06-29",
          "recoveryAvailable": true,
          "recoveryUsedThisMonth": 0
        },
        "dailyQuest": {
          "count": 7,
          "lastCompletedDate": "2026-06-29"
        },
        "dailyChallenge": {
          "count": 3,
          "lastCompletedDate": "2026-06-28"
        },
        "habits": {
          "Exercise": {
            "count": 5,
            "lastCompletedDate": "2026-06-29"
          }
        }
      },
      "recoveryHistory": [
        {
          "streakType": "dailyActivity",
          "recoveredAt": "2026-06-15T14:30:00Z",
          "wasFree": true,
          "costPoints": 0
        }
      ]
    },

    "points": {
      "total": 2450,
      "today": 150,
      "week": 850,
      "month": 2450,
      "dailyGoal": 50,
      "dailyBonusMultiplier": 1.1,
      "dailyBonusStreak": 5,
      "ledger": [
        {
          "id": "transaction-uuid",
          "timestamp": "2026-06-29T14:30:00Z",
          "activity": "Wordle game",
          "activityType": "game",
          "points": 150,
          "multiplierApplied": 1.1,
          "finalPoints": 165,
          "moduleReference": {
            "module": "games",
            "itemId": "session-uuid"
          }
        }
      ],
      "cap": null,
      "floor": 0,
      "negativeEnabled": false
    },

    "dailyChallenge": {
      "today": {
        "date": "2026-06-29",
        "mode": "pro",
        "gameOrder": ["wordle", "quickfire", "scramble", "hangman"],
        "difficulties": ["easy", "medium", "medium", "hard"],
        "status": "in_progress|completed|abandoned",
        "livesRemaining": 2,
        "gameResults": [
          {
            "gameType": "wordle",
            "score": 150,
            "won": true
          }
        ],
        "finalScore": 150,
        "pointsAwarded": 150
      },
      "stats": {
        "totalCompleted": 15,
        "cleanSweeps": 2,
        "currentStreak": 2,
        "longestStreak": 5,
        "leaderboards": {
          "rookie": [],
          "pro": [],
          "legend": [],
          "master": []
        }
      }
    },

    "calendar": {
      "activityHistory": [],
      "personalItems": [],
      "customItemTypes": []
    },

    "notifications": {
      "unreadCount": 2,
      "items": [
        {
          "id": "notif-uuid",
          "timestamp": "2026-06-29T14:30:00Z",
          "type": "badge_unlocked|streak_milestone|goal_completed",
          "title": "Badge Unlocked!",
          "body": "You unlocked 'Gaming Master'",
          "priority": "high|medium|low",
          "read": false,
          "dismissed": false,
          "data": {
            "badge_id": "badge-uuid"
          }
        }
      ],
      "preferences": {
        "soundEnabled": true,
        "soundEvents": {
          "correctAnswer": true,
          "badge": true
        },
        "quietHours": {
          "bedtime": {
            "enabled": true,
            "start": "21:00",
            "end": "07:00"
          }
        }
      }
    },

    "onboarding": {
      "completed": true,
      "completedDate": "2026-06-18",
      "profile": {
        "name": "Krish",
        "displayName": "KrishStar",
        "avatar": "🧠",
        "createdDate": "2026-06-18"
      },
      "tutorialsSeen": ["welcome", "trivia", "quests"],
      "firstChoiceMade": "habits"
    },

    "settings": {
      "theme": "adventure",
      "difficultyTheme": "adventure",
      "soundOn": true,
      "notificationVolume": 0.8
    }
  },

  // HA DASHBOARD DATA
  "haDashboard": {
    "weather": {
      "current": {
        "location": "Avon Lake, OH",
        "temperature": 72,
        "condition": "Partly Cloudy",
        "feelsLike": 70,
        "humidity": 65,
        "windSpeed": 8,
        "windDirection": "NW"
      },
      "forecast": [],
      "alerts": []
    },

    "devices": [
      {
        "id": "device-uuid",
        "name": "Bedroom Light",
        "type": "light|thermostat|lock|speaker|plug|tv|camera",
        "state": "on|off",
        "brightness": 80,
        "colorTemp": 3000,
        "status": "online|offline",
        "batteryLevel": null,
        "room": "Bedroom",
        "lastUpdated": "2026-06-29T14:30:00Z"
      }
    ]
  },

  // PARENT PORTAL DATA
  "parentPortal": {
    "dashboard": {
      "todayStats": {
        "pointsEarned": 150,
        "dailyGoalProgress": 0.75,
        "streaksActive": 5,
        "questsCompleted": 2,
        "questsTotal": 3
      },
      "alerts": [
        {
          "id": "alert-uuid",
          "type": "busy_day|achievement|flagged_activity",
          "severity": "high|medium|low",
          "message": "Busy day detected",
          "timestamp": "2026-06-29T14:30:00Z",
          "actionRequired": false
        }
      ],
      "customCards": []
    },

    "analytics": {
      "engagement": {
        "score": 78,
        "trend": "increasing|stable|decreasing",
        "frequency": 0.95,
        "diversity": 0.85,
        "consistency": 0.75,
        "lastCalculated": "2026-06-29T14:30:00Z"
      },
      "recommendations": [
        {
          "id": "rec-uuid",
          "type": "engagement|goal|difficulty|module",
          "title": "Engagement Boost",
          "message": "Try setting a new goal in Games",
          "confidence": 0.82,
          "dismissed": false
        }
      ]
    },

    "automations": [
      {
        "id": "automation-uuid",
        "name": "Gujarati Reward",
        "trigger": "activity_complete",
        "triggerConfig": {
          "activity": "gujarati_lesson"
        },
        "action": "device_control",
        "device": "bedroom_light",
        "actionType": "on",
        "actionValue": {
          "brightness": 80,
          "durationSeconds": 600
        },
        "isActive": true,
        "lastTriggeredAt": "2026-06-28T15:30:00Z"
      }
    ],

    "settings": {
      "notifications": {
        "badgeUnlock": true,
        "streakMilestone": true,
        "goalComplete": true
      },
      "features": {
        "gamesEnabled": true,
        "triviaEnabled": true,
        "habitsEnabled": true
      },
      "dataVisibility": {
        "timeTracking": true,
        "leaderboards": true,
        "achievements": true
      }
    }
  }
}
```

---

## Key Design Decisions

### Organization: Hybrid ✅
- **Core Data at Root:** users, profile, calendar, chores, meals, shopping
  - Shared across all systems
  - Single source of truth
  - Easy to access from any system

- **System-Specific Nested:** activityBoard.*, haDashboard.*, parentPortal.*
  - Keeps system concerns isolated
  - Easy to expand each system independently
  - Clear boundaries

### Sync State: Centralized ✅
- Global `_sync` at root level
  - All systems share same sync status
  - Single offline queue
  - One source of truth for online/offline state
  
- Per-system metadata referenced in main data:
  - `lastSyncedAt` on calendar events
  - `syncedTo` on devices
  - Prevents duplicate sync state

### Timestamps: Consistent ✅
- All timestamps in ISO 8601 format with Z (UTC)
- Timezone stored separately in `_system.timezone`
- Conversion to local time happens in UI layer

### Version Control: Built-In ✅
- `_metadata._version` for schema migrations
- Easy to add migration functions when schema evolves
- Backward compatibility path documented

---

## Sync Points (What Syncs Where)

| Data | Direction | Systems | Latency |
|------|-----------|---------|---------|
| Calendar events | Bidirectional | HA Dashboard ↔ Activity Board | 30s |
| Chores completion | Bidirectional | HA Dashboard ↔ Activity Board | 30s |
| Announcements | One-way | HA Dashboard → Activity Board | Real-time (WebSocket) |
| Points (parent adjustment) | One-way | Parent Portal → Activity Board | <1s (WebSocket) |
| Automations status | One-way | Parent Portal → HA Dashboard | Real-time (WebSocket) |
| Automation triggers | One-way | Activity Board → HA Dashboard | Real-time (WebSocket) |

---

## Implementation Notes

1. **Database Storage:** Map this schema to PostgreSQL tables
   - `state.users` → `users` table
   - `state.activityBoard.games.sessions` → `game_sessions` table
   - etc.

2. **Local Storage (Isar):** Mirror entire state for offline capability
   - Automatic sync on reconnect
   - Queue handles offline actions

3. **API Responses:** Transform state into API format
   - Flatten nested structures where needed
   - Include only relevant fields per endpoint

4. **Real-Time Sync:** WebSocket subscriptions on critical data
   - Announcements
   - Parent portal actions
   - Automation triggers

---

**Schema Locked & Ready for Database Implementation** ✅

