# API Endpoints Documentation
## Core API for Family Hub - Task 1B-001

**Status:** Task 1B-001 - In Progress  
**Base URL:** `http://localhost:3000`  
**Authentication:** Bearer token (JWT from Supabase)

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication)
2. [User Management Endpoints](#users)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Testing](#testing)

---

## Authentication

### POST /auth/signup
Register a new user account

**Request:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePassword123!",
    "name": "John Parent",
    "role": "parent",
    "account_type": "primary"
  }'
```

**Request Body:**
```json
{
  "email": "parent@example.com",      // Required: valid email
  "password": "SecurePassword123!",   // Required: min 8 chars
  "name": "John Parent",              // Required: user full name
  "role": "parent" | "child",         // Required: parent or child
  "account_type": "primary"           // Optional: primary or secondary
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-user-id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Signup failed",
  "message": "User already exists"
}
```

---

### POST /auth/login
Authenticate user and get session token

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePassword123!"
  }'
```

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  },
  "user": {
    "id": "uuid-user-id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Login failed",
  "message": "Invalid email or password"
}
```

---

### POST /auth/logout
End user session

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### GET /auth/me
Get current authenticated user

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid or expired token"
}
```

---

## Users

### GET /users
Get all users (admin endpoint)

**Request:**
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "count": 5,
  "users": [
    {
      "id": "uuid-1",
      "name": "John Parent",
      "email": "john@example.com",
      "role": "parent",
      "created_at": "2026-07-07T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Sarah Child",
      "email": "sarah@example.com",
      "role": "child",
      "created_at": "2026-07-07T10:05:00Z"
    }
  ]
}
```

---

### GET /users/:id
Get user by ID

**Request:**
```bash
curl -X GET http://localhost:3000/users/uuid-user-id \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "parent@example.com",
    "name": "John Parent",
    "role": "parent",
    "created_at": "2026-07-07T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "User not found"
}
```

---

### GET /users/me
Get current user profile

**Request:**
```bash
curl -X GET "http://localhost:3000/users/me?userId=uuid-user-id" \
  -H "Authorization: Bearer {access_token}"
```

**Query Parameters:**
- `userId` - User ID (required)

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "parent@example.com",
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
curl -X PUT http://localhost:3000/users/uuid-user-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

**Request Body:**
```json
{
  "name": "John Updated",           // Optional
  "email": "john.updated@example.com" // Optional
}
```

**Success Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid-user-id",
    "email": "john.updated@example.com",
    "name": "John Updated",
    "role": "parent"
  }
}
```

---

### GET /users/:parentId/children
Get all children of a parent

**Request:**
```bash
curl -X GET http://localhost:3000/users/uuid-parent-id/children \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "parent_id": "uuid-parent-id",
  "children": [
    {
      "id": "uuid-child-1",
      "name": "Sarah Child",
      "email": "sarah@example.com",
      "role": "child",
      "created_at": "2026-07-07T10:05:00Z"
    }
  ]
}
```

---

### GET /users/role/parents
Get all parent users

**Request:**
```bash
curl -X GET http://localhost:3000/users/role/parents \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "count": 2,
  "parents": [
    {
      "id": "uuid-parent-1",
      "name": "John Parent",
      "email": "john@example.com",
      "account_type": "primary",
      "created_at": "2026-07-07T10:00:00Z"
    }
  ]
}
```

---

### DELETE /users/:id
Delete user (soft delete)

**Request:**
```bash
curl -X DELETE http://localhost:3000/users/uuid-user-id \
  -H "Authorization: Bearer {access_token}"
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## Response Format

### Standard Success Response
```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Standard Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Error Handling

### Authentication Errors
```json
{
  "error": "Missing or invalid authorization header"
}
```

### Validation Errors
```json
{
  "error": "Missing required fields",
  "required": ["email", "password", "name", "role"]
}
```

### Duplicate User
```json
{
  "error": "Signup failed",
  "message": "User already exists"
}
```

---

## Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Create User (Signup)
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "role": "parent"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

Save the `access_token` from response.

### 4. Get Current User
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer {access_token}"
```

### 5. Update User
```bash
curl -X PUT http://localhost:3000/users/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "name": "Updated Name"
  }'
```

### 6. Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer {access_token}" \
  -d '{"access_token": "{access_token}"}'
```

---

## Using with JavaScript

### Signup
```javascript
const response = await fetch('http://localhost:3000/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!',
    name: 'John Doe',
    role: 'parent'
  })
});

const data = await response.json();
console.log(data);
```

### Login
```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!'
  })
});

const { session, user } = await response.json();
localStorage.setItem('token', session.access_token);
```

### Get User
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { user } = await response.json();
console.log(user);
```

---

## Next Endpoints (Planned)

### Badges
- `GET /badges` - Get all badges
- `GET /badges/:id` - Get badge details
- `POST /users/:id/badges` - Award badge to user
- `GET /users/:id/badges` - Get user's badges

### Points
- `GET /users/:id/points` - Get user total points
- `POST /users/:id/points` - Add points to user
- `GET /users/:id/points/history` - Get points history

### Activities
- `GET /activities` - Get activities
- `POST /activities` - Log activity

---

**Status:** Task 1B-001 Endpoints Documentation  
**Maintained By:** Backend Team
