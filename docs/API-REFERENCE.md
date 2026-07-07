# API Reference
## Family Hub Backend - Complete Endpoint Documentation

**Base URL:** `http://localhost:3000`  
**Authentication:** Bearer token (JWT)  
**Content-Type:** `application/json`

---

## 📋 Quick Index

- [Authentication](#authentication) (4 endpoints)
- [Users](#users) (5 endpoints)
- [Badges](#badges) (7 endpoints)
- [Points](#points) (9 endpoints)
- [External APIs](#external-apis) (11 endpoints)
- [Health & Monitoring](#health--monitoring) (7 endpoints)
- [Performance](#performance) (7 endpoints)
- [Batch Operations](#batch-operations) (1 endpoint)

**Total: 60+ endpoints**

---

## 🔐 Authentication

### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2026-07-07T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - Email already exists

---

### POST /auth/login
Authenticate and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing fields

---

### POST /auth/logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

---

## 👥 Users

### GET /users
List all users (paginated).

**Query Parameters:**
```
?limit=20&offset=0&role=user
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "created_at": "2026-07-07T10:00:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "page": 0,
    "limit": 20,
    "total": 1
  }
}
```

---

### GET /users/:id
Get user by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**
- `404 Not Found` - User doesn't exist
- `401 Unauthorized` - Not authenticated

---

### GET /users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

---

### PUT /users/:id
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "name": "John Updated"
  }
}
```

---

### DELETE /users/:id
Delete user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## 🏆 Badges

### GET /badges
List all badge definitions.

**Query Parameters:**
```
?limit=50&offset=0&category=achievement
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "badge-001",
      "name": "First Steps",
      "description": "Complete your first activity",
      "category": "achievement",
      "tier": "bronze",
      "points_value": 10,
      "icon": "🎯",
      "created_at": "2026-07-07T10:00:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "page": 0,
    "limit": 50,
    "total": 400
  }
}
```

---

### GET /badges/:id
Get specific badge definition.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "badge-001",
    "name": "First Steps",
    "description": "Complete your first activity",
    "category": "achievement",
    "tier": "bronze",
    "points_value": 10
  }
}
```

---

### GET /badges/category/:category
Get badges by category.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "badge-001",
      "name": "First Steps",
      "category": "achievement",
      "tier": "bronze"
    }
  ],
  "meta": {
    "count": 25,
    "category": "achievement"
  }
}
```

---

### GET /badges/users/:userId
Get user's earned badges.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "badge_id": "badge-001",
      "earned_at": "2026-07-07T10:00:00Z",
      "badge_name": "First Steps",
      "badge_icon": "🎯"
    }
  ],
  "meta": {
    "total_badges": 5,
    "total_points": 150
  }
}
```

---

### GET /badges/users/:userId/detailed
Get user's earned badges with full details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "badge_id": "badge-001",
      "name": "First Steps",
      "description": "Complete your first activity",
      "category": "achievement",
      "tier": "bronze",
      "points_value": 10,
      "earned_at": "2026-07-07T10:00:00Z",
      "icon": "🎯"
    }
  ]
}
```

---

### POST /badges/users/:userId/award
Award a badge to user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "badge_id": "badge-001",
  "reason": "Completed first activity"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "badge_id": "badge-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "earned_at": "2026-07-07T10:00:00Z"
  }
}
```

---

### DELETE /badges/users/:userId/:badgeId
Revoke a badge from user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## 💰 Points

### GET /points/users/:userId
Get user's total points.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "total_points": 1250
  }
}
```

---

### GET /points/users/:userId/history
Get points transaction history.

**Query Parameters:**
```
?limit=20&offset=0&activity=trivia
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "points-001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "points": 50,
      "activity_type": "trivia",
      "description": "Correct answer",
      "created_at": "2026-07-07T10:00:00Z"
    }
  ],
  "meta": {
    "count": 20,
    "total": 100
  }
}
```

---

### GET /points/users/:userId/breakdown
Get points breakdown by activity type.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "trivia": 250,
    "games": 300,
    "homework": 400,
    "reading": 150,
    "habits": 150
  },
  "total": 1250
}
```

---

### GET /points/users/:userId/range
Get points earned in date range.

**Query Parameters:**
```
?start_date=2026-07-01&end_date=2026-07-07
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "2026-07-01 to 2026-07-07",
    "total_points": 350
  }
}
```

---

### GET /points/users/:userId/today
Get points earned today.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "date": "2026-07-07",
    "total_points": 75,
    "activities": [
      {
        "activity": "trivia",
        "points": 50
      },
      {
        "activity": "reading",
        "points": 25
      }
    ]
  }
}
```

---

### GET /points/users/:userId/week
Get weekly points summary.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "week": "2026-07-01 to 2026-07-07",
    "total_points": 500,
    "by_day": {
      "2026-07-01": 75,
      "2026-07-02": 80,
      "2026-07-03": 70,
      "2026-07-04": 85,
      "2026-07-05": 90,
      "2026-07-06": 0,
      "2026-07-07": 0
    }
  }
}
```

---

### GET /points/users/:userId/month
Get monthly points summary.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "month": "July 2026",
    "total_points": 2150
  }
}
```

---

### POST /points/users/:userId
Award points to user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "points": 50,
  "activity_type": "trivia",
  "description": "Correct answer"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "points-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "points": 50,
    "new_total": 1300
  }
}
```

---

### POST /points/users/:userId/subtract
Subtract points from user (penalty).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "points": 10,
  "reason": "Wrong answer penalty"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Points deducted successfully",
  "deducted_points": 10,
  "reason": "Wrong answer penalty"
}
```

---

### GET /points/leaderboard
Get global points leaderboard.

**Query Parameters:**
```
?limit=10&period=week
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_name": "John Doe",
      "total_points": 2150,
      "badges_count": 25
    }
  ],
  "meta": {
    "period": "week",
    "count": 10
  }
}
```

---

## 🌐 External APIs

### GET /dictionary/word/:word
Get word definition from Merriam-Webster.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "word": "serendipity",
    "definitions": [
      {
        "part_of_speech": "noun",
        "text": "The occurrence of events by chance in a happy or beneficial way"
      }
    ],
    "examples": [
      "It was pure serendipity that we met."
    ],
    "phonetic": "ser·en·dip·i·ty",
    "audio_url": "https://..."
  }
}
```

---

### GET /dictionary/word-of-day
Get daily featured word.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "word": "ephemeral",
    "definition": "Lasting for a very short time",
    "example": "The beauty of cherry blossoms is ephemeral."
  }
}
```

---

### GET /dictionary/search
Search words by prefix (autocomplete).

**Query Parameters:**
```
?prefix=ser&limit=5
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    "serendipity",
    "serenity",
    "serene"
  ]
}
```

---

### GET /weather/city/:city
Get current weather by city name.

**Query Parameters:**
```
?units=metric
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "city": "San Francisco",
    "temperature": 22,
    "condition": "Partly Cloudy",
    "emoji": "⛅",
    "humidity": 65,
    "wind_speed": 12
  }
}
```

---

### GET /weather/coords
Get weather by coordinates.

**Query Parameters:**
```
?lat=37.7749&lon=-122.4194&units=metric
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "temperature": 22,
    "condition": "Partly Cloudy"
  }
}
```

---

### GET /weather/forecast/:city
Get 5-day weather forecast.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "city": "San Francisco",
    "forecast": [
      {
        "date": "2026-07-08",
        "high": 25,
        "low": 18,
        "condition": "Sunny",
        "emoji": "☀️"
      }
    ]
  }
}
```

---

### POST /weather/activity-suitability
Check if weather is suitable for activity.

**Request:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "activity": "outdoor-sports"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "suitable": true,
    "reason": "Good weather for outdoor activities",
    "temperature": 22,
    "condition": "Partly Cloudy"
  }
}
```

---

### POST /email/achievement
Send achievement notification email.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "badge_name": "First Steps",
  "badge_emoji": "🎯"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Achievement email sent"
}
```

---

### POST /email/points
Send points earned notification.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "points": 50,
  "activity": "trivia"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Points notification sent"
}
```

---

### POST /email/daily-summary
Send daily activity summary.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daily summary sent"
}
```

---

### POST /email/parent-notification
Send parent update notification.

**Request:**
```json
{
  "parent_email": "parent@example.com",
  "child_name": "John",
  "summary": "Great progress this week!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Parent notification sent"
}
```

---

## 🏥 Health & Monitoring

### GET /health
Liveness probe (simple health check).

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-07-07T10:00:00Z"
}
```

---

### GET /ready
Readiness probe (all systems functional?).

**Response:** `200 OK` or `503 Service Unavailable`
```json
{
  "status": "ready",
  "checks": [
    {
      "name": "database",
      "status": "ok"
    },
    {
      "name": "cache",
      "status": "ok"
    }
  ]
}
```

---

### GET /info
Get application information.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "application": "Family Hub Backend",
    "version": "1.0.0",
    "environment": "production",
    "uptime_seconds": 86400,
    "endpoints": {
      "total": 60,
      "by_category": {
        "auth": 4,
        "users": 5,
        "badges": 7,
        "points": 9,
        "external": 11,
        "monitoring": 7,
        "performance": 7,
        "batch": 1
      }
    }
  }
}
```

---

### GET /metrics
Prometheus format metrics.

**Response:** `200 OK`
```
# HELP process_uptime_seconds Application uptime in seconds
process_uptime_seconds 86400
# HELP nodejs_version Node.js version
nodejs_version "18.0.0"
# HELP http_requests_total Total HTTP requests
http_requests_total 10250
```

---

## ⚡ Performance

### GET /performance/health
System health overview.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "active_connections": 5,
      "pool_size": 20
    },
    "cache": {
      "status": "healthy",
      "hit_rate": 0.85,
      "memory_usage_mb": 45
    },
    "compression": {
      "enabled": true,
      "ratio": 0.72
    }
  }
}
```

---

### GET /performance/queries
Query performance statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_queries": 5000,
    "slow_queries": 25,
    "slow_query_percentage": 0.5,
    "avg_execution_time_ms": 45,
    "p95_time_ms": 150,
    "p99_time_ms": 300
  }
}
```

---

### GET /performance/queries/slow
List slow queries.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "query": "SELECT * FROM user_badges WHERE...",
      "execution_time_ms": 250,
      "rows_affected": 1500,
      "recommendation": "Add index on user_id"
    }
  ]
}
```

---

### GET /performance/queries/n-plus-one
Detect N+1 query patterns.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "patterns_detected": 2,
    "patterns": [
      {
        "query_pattern": "SELECT * FROM users WHERE...",
        "count": 150,
        "total_time_ms": 7500,
        "recommendation": "Use JOIN instead"
      }
    ]
  }
}
```

---

### GET /performance/requests
Request performance metrics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_requests": 10250,
    "avg_response_time_ms": 85,
    "p95_time_ms": 250,
    "p99_time_ms": 500,
    "error_rate": 0.01,
    "success_rate": 0.99
  }
}
```

---

### GET /performance/compression
Response compression statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_responses": 5000,
    "compressed_responses": 4250,
    "compression_ratio": 0.72,
    "total_bytes_saved": 2500000,
    "by_algorithm": {
      "gzip": {
        "count": 4000,
        "ratio": 0.70
      },
      "brotli": {
        "count": 250,
        "ratio": 0.75
      }
    }
  }
}
```

---

### GET /performance/summary
Complete performance report.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "system_health": "optimal",
    "query_performance": "excellent",
    "request_performance": "excellent",
    "compression_effectiveness": "excellent",
    "cache_effectiveness": "excellent",
    "recommendations": []
  }
}
```

---

## 📦 Batch Operations

### POST /batch
Execute multiple operations in single request.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "operations": [
    {
      "id": "op-1",
      "method": "GET",
      "path": "/badges/users/550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "id": "op-2",
      "method": "POST",
      "path": "/points/users/550e8400-e29b-41d4-a716-446655440000",
      "body": {
        "points": 50,
        "activity_type": "trivia"
      }
    }
  ]
}
```

**Response:** `207 Multi-Status`
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "op-1",
        "status": 200,
        "data": {
          "total_badges": 5
        }
      },
      {
        "id": "op-2",
        "status": 201,
        "data": {
          "points": 50,
          "new_total": 1300
        }
      }
    ]
  }
}
```

---

## 🔑 Authentication Details

### Bearer Token
All authenticated endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

**Token obtained from:**
- `POST /auth/signup` - New user
- `POST /auth/login` - Existing user

**Token includes:**
- User ID
- Email
- Role
- Issued at
- Expires in 7 days

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input",
  "message": "Email is required",
  "details": {
    "field": "email",
    "reason": "required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "User not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests, try again later",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 📱 Common Frontend Patterns

### Authentication Flow
```
1. User signs up/logs in → POST /auth/signup or /auth/login
2. Get token from response
3. Store token in localStorage or sessionStorage
4. Include token in all subsequent requests
5. On logout → POST /auth/logout + clear token
```

### Getting User Data
```
1. GET /auth/me (get current user)
2. GET /users/:id (get specific user)
3. GET /points/users/:userId (get points)
4. GET /badges/users/:userId (get badges)
```

### Awarding Points
```
1. Activity completed by user
2. POST /points/users/:userId (award points)
3. GET /points/users/:userId (refresh total)
4. Optional: POST /email/points (notify user)
```

### Checking Readiness
```
// Before showing app
1. GET /health (is API running?)
2. GET /ready (are all services ready?)
3. GET /auth/me (is user authenticated?)
```

---

## 🚀 Performance Tips

1. **Cache responses** - Use ETags (GET requests return Cache-Control headers)
2. **Batch operations** - Use POST /batch for multiple requests
3. **Pagination** - Always use limit/offset for list endpoints
4. **Compression** - Send Accept-Encoding header for gzip/brotli
5. **Error handling** - Check response.success before using data

---

## 📚 Rate Limits

**Standard:** 100 requests per 15 minutes per IP  
**Auth endpoints:** 5 requests per 1 minute (signup/login)  
**Public endpoints:** 10 requests per 1 minute

Check headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625000000
```

---

**Last Updated:** 2026-07-07  
**Status:** ✅ Production Ready

Start building! 🚀
