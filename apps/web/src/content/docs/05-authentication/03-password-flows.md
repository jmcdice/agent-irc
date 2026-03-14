# Password Flows

<!-- AI_CONTEXT
This document covers password-related features.
Key files: apps/api/src/index.ts (password routes), apps/api/src/entities/PasswordResetToken.ts
Flows: Registration, login, change password, forgot/reset password
Related docs: overview, sessions
-->

## Overview

App Shell includes complete password management:

- **Registration** - Create account with password
- **Login** - Authenticate with email/password
- **Change Password** - Update password (when logged in)
- **Forgot/Reset Password** - Email-based password reset

## Password Hashing

All passwords are hashed with bcrypt:

```typescript
import bcrypt from 'bcrypt';

// Hash password (10 salt rounds)
const passwordHash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, user.passwordHash);
```

## Registration Flow

### API Endpoint

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

### Validation

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, unique |
| `name` | Required, max 100 chars |
| `password` | Required, min 8 chars, max 128 chars |

### Response

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

The user is automatically logged in after registration.

## Change Password Flow

For logged-in users who know their current password.

### API Endpoint

```http
PUT /api/me/password
Content-Type: application/json
Cookie: connect.sid=...

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### Validation

- Must be authenticated
- Current password must be correct
- New password: min 8 chars, max 128 chars

## Forgot Password Flow

For users who can't remember their password.

### Step 1: Request Reset

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response (always success to prevent email enumeration):

```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

### Step 2: Validate Token

Before showing the reset form, validate the token:

```http
GET /api/auth/verify-reset-token?token=abc123...
```

```json
{
  "valid": true
}
```

### Step 3: Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "password": "newPassword456"
}
```

## Password Reset Token

The `PasswordResetToken` entity:

```typescript
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  usedAt?: Date;

  isValid(): boolean {
    return !this.usedAt && this.expiresAt > new Date();
  }
}
```

### Token Security

- Generated with `crypto.randomBytes(32)`
- Expires after 1 hour
- Can only be used once
- Previous tokens invalidated on new request

## Email Integration

Currently uses console logging in development:

```typescript
// utils/email.ts
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  webUrl: string
): Promise<boolean> {
  const resetUrl = `${webUrl}/reset-password?token=${token}`;

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return true;
  }

  // TODO: Implement real email service
  // SendGrid, AWS SES, Postmark, etc.
  return false;
}
```

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | Email/password login |
| Register | `/register` | Create new account |
| Forgot Password | `/forgot-password` | Request reset email |
| Reset Password | `/reset-password?token=...` | Set new password |
| Settings | `/dashboard/settings` | Change password |

## Shared Validation Schemas

Both frontend and backend use the same schemas:

```typescript
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@app-shell/shared';
```

## Next Steps

- **[RBAC](/dashboard/docs/authentication/rbac)** - Role-based access control
- **[Sessions](/dashboard/docs/authentication/sessions)** - Session management

