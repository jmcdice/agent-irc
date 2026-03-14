# API Reference

<!-- AI_CONTEXT
This document provides a complete API endpoint reference.
Key file: apps/api/src/index.ts
Swagger: http://localhost:4001/api-docs
IMPORTANT: healthz response has { status, timestamp, version } — NOT just { status: 'ok' }
IMPORTANT: readyz success: { status: 'ready', timestamp } — NOT { status: 'ok', checks: { database: 'ok' } }
IMPORTANT: readyz failure: 503, { status: 'not ready', error: 'Database connection failed' }
IMPORTANT: /api/version response: { version, buildDate, environment } — includes buildDate
Related docs: backend/api-routes, backend/error-handling
-->

## Overview

Complete reference for all API endpoints. For interactive documentation, visit `/api-docs` when the API is running locally.

## Base URL

```
Development: http://localhost:4001
Production:  https://api.yourdomain.com
```

## Authentication

All protected routes require a session cookie. Include credentials in every request:

```typescript
fetch('/api/me', { credentials: 'include' })
```

Session cookies are set automatically by the login endpoint and cleared by logout.

---

## Health Endpoints

### GET /healthz

Basic liveness check. Returns `200` as long as the process is running.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "version": "0.1.0"
}
```

### GET /readyz

Readiness check — verifies the database is reachable before reporting ready.

**Response:** `200 OK`
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Response:** `503 Service Unavailable` (when database is unreachable)
```json
{
  "status": "not ready",
  "error": "Database connection failed"
}
```

### GET /api/version

Version information.

**Response:** `200 OK`
```json
{
  "version": "0.1.0",
  "buildDate": "2024-01-15T12:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account. Sets a session cookie on success.

**Body:**
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "securePassword123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "SE"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — missing fields, invalid email, password under 8 characters
- `409 ALREADY_EXISTS` — email already registered

### POST /api/auth/login

Authenticate with email and password. Sets a session cookie on success.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "SE"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — missing email or password
- `401 INVALID_CREDENTIALS` — wrong email or password, or account has no password (OAuth user)

### POST /api/auth/logout

End the current session and clear the session cookie.

**Auth:** Required

**Response:** `200 OK`
```json
{ "success": true }
```

### POST /api/auth/forgot-password

Send a password reset email. Always returns `200` regardless of whether the email exists — this prevents user enumeration.

**Body:**
```json
{ "email": "user@example.com" }
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

### GET /api/auth/verify-reset-token

Check whether a password reset token is valid and not expired.

**Query:** `?token=abc123...`

**Response:** `200 OK`
```json
{ "valid": true }
```

**Errors:**
- `400 BAD_REQUEST` — token missing, invalid, or expired

### POST /api/auth/reset-password

Reset the account password using a valid reset token.

**Body:**
```json
{
  "token": "abc123...",
  "password": "newPassword456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

## User Profile Endpoints

### GET /api/me

Get the current user's profile.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "SE",
  "avatarUrl": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/me

Update the current user's profile.

**Auth:** Required

**Body:**
```json
{
  "name": "Jane Smith",
  "avatarUrl": "https://..."
}
```

**Response:** `200 OK` — updated user object

### PUT /api/me/password

Change the current user's password.

**Auth:** Required

**Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

**Response:** `200 OK`
```json
{ "success": true, "message": "Password updated successfully" }
```

**Errors:**
- `400 VALIDATION_ERROR` — new password too short
- `401 UNAUTHORIZED` — current password is wrong

---

## Session Endpoints

### GET /api/me/sessions

List all active sessions for the current user.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "id": "session-id",
      "isCurrent": true,
      "expiresAt": "2024-02-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### DELETE /api/me/sessions/:sessionId

Revoke a specific session by ID.

**Auth:** Required

**Response:** `200 OK`
```json
{ "success": true, "message": "Session revoked successfully" }
```

### DELETE /api/me/sessions

Revoke all sessions except the current one.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Revoked 3 other session(s)",
  "revokedCount": 3
}
```

---

## Error Response Format

Every error uses the same shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "statusCode": 400,
  "details": {
    "field": "Field-specific error message"
  }
}
```

`details` is only present on `VALIDATION_ERROR` responses.

### Error Codes

| Code | Status | When it occurs |
|------|--------|----------------|
| `BAD_REQUEST` | 400 | Invalid request that isn't field validation |
| `VALIDATION_ERROR` | 400 | Missing or invalid fields — includes `details` |
| `UNAUTHORIZED` | 401 | Not logged in |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `FORBIDDEN` | 403 | Logged in but not permitted |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `ALREADY_EXISTS` | 409 | Duplicate (e.g. email already registered) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Next Steps

- **[Component Reference](/dashboard/docs/reference/component-reference)** — UI components
- **[Hook Reference](/dashboard/docs/reference/hook-reference)** — Custom hooks
- **[API Routes](/dashboard/docs/backend/api-routes)** — How routes are structured
