# Session Management

<!-- AI_CONTEXT
This document covers session management features.
Key files: apps/api/src/index.ts (session routes), apps/api/src/entities/Session.ts
Endpoints: /api/me/sessions, /api/me/sessions/:id
Related docs: overview, rbac
-->

## Overview

App Shell provides full session management capabilities, allowing users to:

- View all active sessions
- See which session is current
- Revoke individual sessions
- Logout from all devices

## Session API Endpoints

### List Sessions

```http
GET /api/me/sessions
```

Response:

```json
{
  "sessions": [
    {
      "id": "session-id-1",
      "isCurrent": true,
      "expiresAt": "2024-02-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "session-id-2",
      "isCurrent": false,
      "expiresAt": "2024-02-10T14:20:00.000Z",
      "createdAt": "2024-01-10T14:20:00.000Z"
    }
  ]
}
```

### Revoke Single Session

```http
DELETE /api/me/sessions/:sessionId
```

- Cannot revoke the current session (use logout instead)
- Only affects sessions belonging to the authenticated user

Response:

```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

### Revoke All Other Sessions

```http
DELETE /api/me/sessions
```

Logs out all devices except the current one ("Logout everywhere else").

Response:

```json
{
  "success": true,
  "message": "Revoked 3 other session(s)",
  "revokedCount": 3
}
```

### Logout (Current Session)

```http
POST /api/auth/logout
```

Destroys the current session and clears the cookie.

## Frontend Implementation

### Session List Component

```tsx
import { useApiMutation } from '@/hooks/use-api';

interface Session {
  id: string;
  isCurrent: boolean;
  expiresAt: string;
  createdAt: string | null;
}

function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { execute: fetchSessions } = useApiMutation<void, { sessions: Session[] }>(
    '/api/me/sessions',
    'GET'
  );
  const { execute: revokeSession } = useApiMutation<void, void>(
    '/api/me/sessions',
    'DELETE'
  );

  useEffect(() => {
    fetchSessions().then(res => {
      if (res.data) setSessions(res.data.sessions);
    });
  }, []);

  const handleRevoke = async (sessionId: string) => {
    await apiRequest(`/api/me/sessions/${sessionId}`, { method: 'DELETE' });
    fetchSessions();
  };

  return (
    <ul>
      {sessions.map(session => (
        <li key={session.id}>
          {session.isCurrent ? '(Current)' : ''}
          Expires: {new Date(session.expiresAt).toLocaleDateString()}
          {!session.isCurrent && (
            <Button onClick={() => handleRevoke(session.id)}>Revoke</Button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

## Session Configuration

### Cookie Settings

```typescript
session({
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,                    // No JS access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',                  // CSRF protection
  }
});
```

### Session Store

```typescript
const PgSession = connectPgSimple(session);

store: new PgSession({
  conString: DATABASE_URL,
  tableName: 'sessions',
  createTableIfMissing: true,
}),
```

## Session Data Structure

The session object in PostgreSQL:

```json
{
  "cookie": {
    "originalMaxAge": 2592000000,
    "expires": "2024-02-15T10:30:00.000Z",
    "httpOnly": true,
    "secure": false,
    "sameSite": "lax"
  },
  "userId": "user-uuid-here"
}
```

## Security Considerations

### Cookie Security

| Flag | Purpose | Value |
|------|---------|-------|
| `httpOnly` | Prevent XSS access | `true` |
| `secure` | HTTPS only | `true` in production |
| `sameSite` | CSRF protection | `lax` |

### Session Expiry

- Sessions expire after 30 days by default
- Expired sessions are cleaned up by PostgreSQL
- Users can manually revoke sessions anytime

### Session Regeneration

After login, the session ID should be regenerated to prevent session fixation:

```typescript
req.session.regenerate((err) => {
  req.session.userId = user.id;
});
```

## Debugging Sessions

### View Sessions in Database

```bash
./dev.sh db
# Then:
SELECT sid, sess->>'userId' as user_id, expire FROM sessions;
```

### Clear All Sessions

```sql
DELETE FROM sessions WHERE sess->>'userId' = 'target-user-id';
```

## Next Steps

- **[Password Flows](/dashboard/docs/authentication/password-flows)** - Reset, change
- **[RBAC](/dashboard/docs/authentication/rbac)** - Role-based access

