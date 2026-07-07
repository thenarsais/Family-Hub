# Complete API Reference
## Family Hub - 24 Production Endpoints

**Base URL:** `http://localhost:3000` (local) | `https://api.familyhub.com` (production)  
**Authentication:** Bearer Token (JWT from Supabase)  
**Content-Type:** `application/json`

---

## 📋 Quick Reference

| Section | Endpoints | Purpose |
|---------|-----------|---------|
| [Authentication](#authentication) | 4 | User signup, login, logout, profile |
| [Users](#users) | 4 | User management (CRUD) |
| [Badges](#badges) | 8 | Badge definitions and user badges |
| [Points](#points) | 8+ | Points tracking and analytics |
| **Total** | **24+** | **Full backend API** |

---

## 🔐 Authentication

### POST /auth/signup
Register a new user account

**Request:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123!",
    "name": "John Parent",
    "role": "parent",
    "account_type": "primary"
  }'
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent"
  }
}
```

---

### POST /auth/login
Authenticate and get session token

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (200):**
```json
{
  "message": "Login successful",
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent"
  }
}
```

---

### POST /auth/logout
End user session

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer {access_token}" \
  -d '{"access_token": "{access_token}"}'
```

**Response (200):**
```json
{"message": "Logout successful"}
```

---

### GET /auth/me
Get current authenticated user profile

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

---

## 👥 Users

### GET /users
List all users (admin endpoint)

**Request:**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "count": 5,
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Parent",
      "email": "john@example.com",
      "role": "parent",
      "created_at": "2026-07-07T10:00:00Z"
    }
  ]
}
```

---

### GET /users/:id
Get user by ID

**Request:**
```bash
curl -X GET http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Parent",
    "role": "parent",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

---

### GET /users/me
Get current user profile with extended info

**Request:**
```bash
curl -X GET "http://localhost:3000/users/me?userId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Parent",
    "role": "parent",
    "account_type": "primary",
    "created_at": "2026-07-07T10:00:00Z",
    "updated_at": "2026-07-07T10:00:00Z"
  }
}
```

---

### PUT /users/:id
Update user profile

**Request:**
```bash
curl -X PUT http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.updated@example.com",
    "name": "John Updated",
    "role": "parent"
  }
}
```

---

### DELETE /users/:id
Delete user (soft delete)

**Request:**
```bash
curl -X DELETE http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{"message": "User deleted successfully"}
```

---

## 🏆 Badges

### GET /badges
List all available badges

**Request:**
```bash
curl -X GET http://localhost:3000/badges \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "count": 25,
  "badges": [
    {
      "id": "badge-001",
      "title": "First Steps",
      "description": "Complete your first quest",
      "icon_emoji": "👣",
      "category": "achievement",
      "tier": "bronze",
      "points_required": 0,
      "created_at": "2026-07-06T22:19:47Z"
    }
  ]
}
```

---

### GET /badges/:id
Get badge details

**Request:**
```bash
curl -X GET http://localhost:3000/badges/badge-001 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "badge": {
    "id": "badge-001",
    "title": "First Steps",
    "description": "Complete your first quest",
    "icon_emoji": "👣",
    "category": "achievement",
    "tier": "bronze",
    "points_required": 0,
    "created_at": "2026-07-06T22:19:47Z"
  }
}
```

---

### GET /badges/category/:category
Get badges by category

**Request:**
```bash
curl -X GET http://localhost:3000/badges/category/achievement \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "category": "achievement",
  "count": 5,
  "badges": [
    {
      "id": "badge-001",
      "title": "First Steps",
      "icon_emoji": "👣",
      "tier": "bronze",
      "points_required": 0
    }
  ]
}
```

---

### GET /badges/users/:userId
Get user's earned badges

**Request:**
```bash
curl -X GET http://localhost:3000/badges/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "count": 3,
  "badges": [
    {
      "id": "earned-001",
      "badge_id": "badge-001",
      "earned_at": "2026-07-07T10:15:00Z"
    }
  ]
}
```

---

### GET /badges/users/:userId/detailed
Get user's badges with full details

**Request:**
```bash
curl -X GET http://localhost:3000/badges/users/550e8400-e29b-41d4-a716-446655440000/detailed \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "count": 3,
  "badges": [
    {
      "earned_badge_id": "earned-001",
      "badge": {
        "id": "badge-001",
        "title": "First Steps",
        "description": "Complete your first quest",
        "icon_emoji": "👣",
        "category": "achievement",
        "tier": "bronze"
      },
      "earned_at": "2026-07-07T10:15:00Z"
    }
  ]
}
```

---

### POST /users/:userId/badges/:badgeId
Award badge to user

**Request:**
```bash
curl -X POST http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/badges/badge-001 \
  -H "Authorization: Bearer {access_token}"
```

**Response (201):**
```json
{
  "message": "Badge awarded successfully",
  "badge": {
    "id": "earned-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "badge_id": "badge-001",
    "earned_at": "2026-07-07T10:15:00Z"
  }
}
```

---

### DELETE /users/:userId/badges/:badgeId
Revoke badge from user

**Request:**
```bash
curl -X DELETE http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000/badges/badge-001 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{"message": "Badge revoked successfully"}
```

---

## 💰 Points

### GET /points/users/:userId
Get user's total points

**Request:**
```bash
curl -X GET http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_points": 1250
}
```

---

### GET /points/users/:userId/history
Get points transaction history

**Request:**
```bash
curl -X GET "http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/history?limit=10" \
  -H "Authorization: Bearer {access_token}"
```

**Query Parameters:**
- `limit` (optional, default: 50) - Number of records to return

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "count": 5,
  "history": [
    {
      "id": "point-001",
      "activity_type": "trivia",
      "points": 50,
      "reason": "Answered trivia question correctly",
      "created_at": "2026-07-07T10:15:00Z"
    }
  ]
}
```

---

### GET /points/users/:userId/breakdown
Get points breakdown by activity type

**Request:**
```bash
curl -X GET http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/breakdown \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "breakdown": {
    "trivia": 500,
    "homework": 350,
    "habits": 400
  }
}
```

---

### GET /points/users/:userId/range
Get points in date range

**Request:**
```bash
curl -X GET "http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/range?start=2026-07-01T00:00:00Z&end=2026-07-07T23:59:59Z" \
  -H "Authorization: Bearer {access_token}"
```

**Query Parameters:**
- `start` (required) - ISO date string
- `end` (required) - ISO date string

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "date_range": {
    "start": "2026-07-01T00:00:00Z",
    "end": "2026-07-07T23:59:59Z"
  },
  "total_points": 1250
}
```

---

### GET /points/users/:userId/today
Get points earned today

**Request:**
```bash
curl -X GET http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/today \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": "today",
  "points": 125
}
```

---

### GET /points/users/:userId/week
Get points earned this week

**Request:**
```bash
curl -X GET http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/week \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": "this_week",
  "points": 750
}
```

---

### GET /points/users/:userId/month
Get points earned this month

**Request:**
```bash
curl -X GET http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/month \
  -H "Authorization: Bearer {access_token}"
```

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": "this_month",
  "points": 1250
}
```

---

### POST /points/users/:userId
Award points to user

**Request:**
```bash
curl -X POST http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "points": 50,
    "activity_type": "trivia",
    "reason": "Answered trivia question correctly"
  }'
```

**Response (201):**
```json
{
  "message": "Points awarded successfully",
  "entry": {
    "id": "point-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "points": 50,
    "activity_type": "trivia",
    "reason": "Answered trivia question correctly",
    "created_at": "2026-07-07T10:15:00Z"
  }
}
```

---

### POST /points/users/:userId/subtract
Deduct points from user (penalty)

**Request:**
```bash
curl -X POST http://localhost:3000/points/users/550e8400-e29b-41d4-a716-446655440000/subtract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "points": 25,
    "reason": "Skipped homework deadline"
  }'
```

**Response (201):**
```json
{
  "message": "Points deducted successfully",
  "deducted_points": 25,
  "reason": "Skipped homework deadline"
}
```

---

### GET /points/leaderboard
Get top users by points

**Request:**
```bash
curl -X GET "http://localhost:3000/points/leaderboard?limit=10" \
  -H "Authorization: Bearer {access_token}"
```

**Query Parameters:**
- `limit` (optional, default: 10, max: 100) - Number of top users to return

**Response (200):**
```json
{
  "limit": 10,
  "count": 5,
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "points": 2500
    },
    {
      "rank": 2,
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "points": 2100
    }
  ]
}
```

---

## ✅ Health Check

### GET /health
Server health check

**Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-07-07T17:32:21.078Z",
  "environment": "local"
}
```

---

## 🔴 Error Responses

All endpoints return standardized error responses:

### Missing Authorization
```json
{
  "error": "Missing authorization header"
}
```

### Invalid Request
```json
{
  "error": "Failed to get total points",
  "message": "invalid input syntax for type uuid"
}
```

### Not Found
```json
{
  "error": "Not found",
  "path": "/invalid/endpoint",
  "method": "GET"
}
```

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error |

---

## 🧪 Quick Test Checklist

- [ ] Health check works
- [ ] Signup creates user
- [ ] Login returns token
- [ ] Get current user works
- [ ] List users works
- [ ] Get badges works
- [ ] Award badge to user works
- [ ] Add points works
- [ ] Get leaderboard works

---

**Last Updated:** 2026-07-07  
**Total Endpoints:** 24  
**Status:** Production Ready ✅
