# API Testing Guide
## Complete Testing Walkthrough for 24 Endpoints

**Duration:** ~10 minutes for full test suite  
**Requirements:** curl or Postman  
**Base URL:** `http://localhost:3000`

---

## 🚀 Quick Start

### Step 1: Verify Server is Running
```bash
curl -X GET http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"...","environment":"local"}`

---

## 🧪 Full Test Suite

### Phase 1: Authentication (4 endpoints)

#### 1.1 Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "role": "parent"
  }'
```

Expected: `201 Created` with user object

**Save the user ID from response as `$USER_ID`**

---

#### 1.2 Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

Expected: `200 OK` with `access_token`

**Save the token as `$TOKEN`** (use in all subsequent requests)

---

#### 1.3 Get Current User
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with user profile

---

#### 1.4 Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"access_token": "$TOKEN"}'
```

Expected: `200 OK` with logout message

---

### Phase 2: Users (4 endpoints)

#### 2.1 Get All Users
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with users array

---

#### 2.2 Get Specific User
```bash
curl -X GET http://localhost:3000/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with single user

---

#### 2.3 Get Current User Profile
```bash
curl -X GET "http://localhost:3000/users/me?userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with extended user info

---

#### 2.4 Update User
```bash
curl -X PUT http://localhost:3000/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Name",
    "email": "newemail@example.com"
  }'
```

Expected: `200 OK` with updated user

---

### Phase 3: Badges (8 endpoints)

#### 3.1 Get All Badges
```bash
curl -X GET http://localhost:3000/badges \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with badges array (25 badges)

**Save a badge ID as `$BADGE_ID`**

---

#### 3.2 Get Single Badge
```bash
curl -X GET http://localhost:3000/badges/$BADGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with badge details

---

#### 3.3 Get Badges by Category
```bash
curl -X GET http://localhost:3000/badges/category/achievement \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with filtered badges

---

#### 3.4 Get User Badges
```bash
curl -X GET http://localhost:3000/badges/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` (empty array initially)

---

#### 3.5 Award Badge to User
```bash
curl -X POST http://localhost:3000/users/$USER_ID/badges/$BADGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `201 Created` with earned badge

---

#### 3.6 Get User Badges with Details
```bash
curl -X GET http://localhost:3000/badges/users/$USER_ID/detailed \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with detailed badge info

---

#### 3.7 Get Badges by Date Range
```bash
curl -X GET "http://localhost:3000/badges/users/$USER_ID/range?start=2026-07-01T00:00:00Z&end=2026-07-08T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with badges in range

---

#### 3.8 Revoke Badge
```bash
curl -X DELETE http://localhost:3000/users/$USER_ID/badges/$BADGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with revoke message

---

### Phase 4: Points (8+ endpoints)

#### 4.1 Get User Total Points
```bash
curl -X GET http://localhost:3000/points/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with total points (0 initially)

---

#### 4.2 Add Points
```bash
curl -X POST http://localhost:3000/points/users/$USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "points": 100,
    "activity_type": "trivia",
    "reason": "Answered trivia correctly"
  }'
```

Expected: `201 Created` with points entry

---

#### 4.3 Get Points History
```bash
curl -X GET "http://localhost:3000/points/users/$USER_ID/history?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with history array

---

#### 4.4 Get Points Breakdown
```bash
curl -X GET http://localhost:3000/points/users/$USER_ID/breakdown \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with breakdown by activity type

---

#### 4.5 Get Points Today
```bash
curl -X GET http://localhost:3000/points/users/$USER_ID/today \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with today's points

---

#### 4.6 Get Points This Week
```bash
curl -X GET http://localhost:3000/points/users/$USER_ID/week \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with week total

---

#### 4.7 Get Points This Month
```bash
curl -X GET http://localhost:3000/points/users/$USER_ID/month \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with month total

---

#### 4.8 Get Points by Date Range
```bash
curl -X GET "http://localhost:3000/points/users/$USER_ID/range?start=2026-07-01T00:00:00Z&end=2026-07-08T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with points in range

---

#### 4.9 Subtract Points
```bash
curl -X POST http://localhost:3000/points/users/$USER_ID/subtract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "points": 10,
    "reason": "Penalty for incomplete homework"
  }'
```

Expected: `201 Created` with deduction info

---

#### 4.10 Get Leaderboard
```bash
curl -X GET "http://localhost:3000/points/leaderboard?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with top 5 users

---

## 🔧 Using Postman (Alternative)

### Import Collection:

1. **Create new request** and set:
   - Method: GET
   - URL: `http://localhost:3000/health`

2. **Add Bearer Token Authorization:**
   - Go to "Authorization" tab
   - Type: "Bearer Token"
   - Token: `[your $TOKEN]`

3. **Create Environment Variable:**
   - Settings → Manage Environments
   - Add: `token = [your $TOKEN]`
   - Add: `userId = [your $USER_ID]`
   - Use: `{{token}}` and `{{userId}}` in requests

### Export Collection:
```
Right-click Collection → Share Collection → Get Public Link
```

---

## ❌ Error Testing

### Test Invalid Token
```bash
curl -X GET http://localhost:3000/badges \
  -H "Authorization: Bearer invalid-token"
```

Expected: `401 Unauthorized`

---

### Test Missing Authorization
```bash
curl -X GET http://localhost:3000/badges
```

Expected: `401 Unauthorized`

---

### Test Invalid Endpoint
```bash
curl -X GET http://localhost:3000/invalid
```

Expected: `404 Not Found`

---

## 📋 Test Checklist

```
AUTHENTICATION
[ ] POST /auth/signup - Create user
[ ] POST /auth/login - Get token
[ ] GET /auth/me - Get profile
[ ] POST /auth/logout - Logout

USERS
[ ] GET /users - List all
[ ] GET /users/:id - Get one
[ ] GET /users/me - Get profile
[ ] PUT /users/:id - Update

BADGES
[ ] GET /badges - List all
[ ] GET /badges/:id - Get one
[ ] GET /badges/category/:cat - Filter
[ ] GET /badges/users/:id - User badges
[ ] POST /users/:id/badges/:bid - Award
[ ] GET /badges/users/:id/detailed - Detailed
[ ] GET /badges/users/:id/range - Date range
[ ] DELETE /users/:id/badges/:bid - Revoke

POINTS
[ ] GET /points/users/:id - Total
[ ] GET /points/users/:id/history - History
[ ] GET /points/users/:id/breakdown - Breakdown
[ ] GET /points/users/:id/range - Date range
[ ] GET /points/users/:id/today - Today
[ ] GET /points/users/:id/week - Week
[ ] GET /points/users/:id/month - Month
[ ] POST /points/users/:id - Add points
[ ] POST /points/users/:id/subtract - Deduct
[ ] GET /points/leaderboard - Top users

ERROR CASES
[ ] Invalid token returns 401
[ ] Missing auth returns 401
[ ] Invalid endpoint returns 404
```

---

## 🎯 Performance Targets

| Operation | Target | With Cache |
|-----------|--------|-----------|
| List all badges | <100ms | <10ms |
| Get user points | <50ms | <5ms |
| Add points | ~100ms | N/A |
| Award badge | ~100ms | N/A |
| Get leaderboard | <100ms | <20ms |

---

## 💡 Tips

1. **Save Variables:** Use shell variables (`$TOKEN`, `$USER_ID`) to avoid copying/pasting
2. **Use Postman:** Easier for repeated testing
3. **Check Response Times:** Ensure performance targets are met
4. **Test Edge Cases:** Empty lists, invalid dates, duplicate operations
5. **Monitor Logs:** Docker logs show query times and errors

---

**Status:** Complete Testing Guide Ready ✅  
**Total Tests:** 24+ endpoints + error cases
