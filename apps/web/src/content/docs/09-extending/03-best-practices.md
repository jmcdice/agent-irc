# Best Practices

<!-- AI_CONTEXT
This document covers recommended patterns and practices for extending App Shell.
Topics: Code organization, performance, security, type safety, testing, git workflow
IMPORTANT: DOMPurify is NOT installed. React's built-in JSX escaping handles most cases. For raw HTML rendering, install a sanitization library explicitly.
ApiError.forbidden() exists in apps/api/src/utils/errors.ts.
Shared package: @app-shell/shared
No useApi hook — use apiRequest() for reads, useApiMutation() for writes.
Related docs: adding-features, customization, architecture/overview
-->

## Code Organization

### File Structure

The web app follows a clear directory convention. Place new files in the right layer:

```
apps/web/src/
├── components/
│   ├── ui/         # Base UI components (shadcn — modify sparingly)
│   ├── layout/     # App shell: sidebar, header, dashboard layout
│   └── [feature]/  # Feature-specific components
├── hooks/          # Custom React hooks
├── lib/            # Pure utility functions
├── app/            # Next.js App Router pages and layouts
└── styles/         # Global CSS and themes
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `User`, `ApiError` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |

### Component Structure

Keep components predictable with a consistent internal order:

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@app-shell/shared';

// 2. Types
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

// 3. Component
export function UserCard({ user, onEdit }: UserCardProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);

  // 3b. Event handlers
  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.(user);
  };

  // 3c. Render
  return (
    <div className="p-4 border rounded-lg">
      <h3>{user.name}</h3>
      <Button onClick={handleEdit}>Edit</Button>
    </div>
  );
}
```

## Performance

### Server Components First

Next.js App Router defaults to Server Components. Keep it that way unless you need interactivity:

```typescript
// Server Component (default) — renders on the server, no JS sent to browser
async function ProductList() {
  const products = await fetchProducts();
  return <ProductGrid products={products} />;
}

// Client Component — only use when you need useState, useEffect, event handlers
'use client';
function ProductFilter() {
  const [filter, setFilter] = useState('');
  // ...
}
```

A good pattern: fetch data in a Server Component, pass it as props to a Client Component that handles interactions.

### Optimize Images

Use Next.js `Image` instead of raw `<img>` tags:

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority    // Preload above-the-fold images
  placeholder="blur"
/>
```

`next/image` automatically applies lazy loading, size optimization, and format conversion.

### Lazy Load Heavy Components

```typescript
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only — skip server rendering
});
```

### Memoization

Use `useMemo` and `useCallback` only when you have a measured performance problem — not preemptively:

```typescript
// Memoize expensive calculations
const sortedItems = useMemo(
  () => [...items].sort((a, b) => b.date - a.date),
  [items]
);

// Stabilize callback references for child components that use React.memo
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

## Security

### Always Validate Input on the Backend

The frontend can validate for user experience, but the backend must validate for security. Client-side validation can be bypassed:

```typescript
// Backend — never trust the request body
app.post('/api/resource', requireAuth, asyncHandler(async (req, res) => {
  const { name } = req.body;

  const errors: Record<string, string> = {};
  if (!name || typeof name !== 'string') errors.name = 'Name is required';
  if (name && name.length > 255) errors.name = 'Name is too long';
  if (Object.keys(errors).length) {
    throw ApiError.validationError('Validation failed', errors);
  }

  // Use validated values
}));
```

### Protect Sensitive Fields

Strip sensitive data before sending responses — never return `passwordHash` or session secrets:

```typescript
// Option 1: Destructure and exclude
const { passwordHash, ...safeUser } = user;
res.json(safeUser);

// Option 2: Explicit allow-list
const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

res.json(sanitizeUser(user));
```

### Check Authorization, Not Just Authentication

`requireAuth` verifies a user is logged in. It doesn't check whether they own the resource:

```typescript
app.delete('/api/posts/:id', requireAuth, asyncHandler(async (req, res) => {
  const post = await postRepo.findOne({ where: { id: req.params.id } });

  if (!post) throw ApiError.notFound('Post');

  // Check ownership — an authenticated user can't delete someone else's post
  if (post.authorId !== req.session.userId) {
    throw ApiError.forbidden();
  }

  await postRepo.delete(post.id);
  res.json({ success: true });
}));
```

### Rendering User Content

React's JSX escapes text content automatically — `{userContent}` in JSX is safe against XSS. The danger is `dangerouslySetInnerHTML`, which bypasses escaping. Avoid it unless you've explicitly sanitized the content:

```typescript
// Safe — React escapes this
<p>{userContent}</p>

// Unsafe — only use if you've sanitized first
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

If you need to render user-provided HTML (e.g. rich text from a WYSIWYG editor), install a sanitization library like `dompurify` or `isomorphic-dompurify` explicitly.

## Error Handling

### Use Next.js Error Boundaries

Create an `error.tsx` file in any App Router segment to catch errors in that route:

```typescript
// apps/web/src/app/dashboard/error.tsx
'use client';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="p-4 rounded border border-destructive/20 bg-destructive/10">
      <h2 className="font-semibold text-destructive">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      <button onClick={reset} className="mt-4 text-sm underline">
        Try again
      </button>
    </div>
  );
}
```

### Handle API Errors Consistently

Every API response goes through `apiRequest`, which normalizes errors into `{ error, message, statusCode }`:

```typescript
const { data, error, isLoading } = useProducts();

if (isLoading) return <Skeleton />;
if (error) return <div className="text-destructive">{error.message}</div>;
if (!data) return <div className="text-muted-foreground">No products found</div>;

return <ProductList products={data} />;
```

## Type Safety

### Use Shared Types

Define types once in `packages/shared/src/` and import in both apps:

```typescript
import type { User, ApiError } from '@app-shell/shared';

function handleUser(user: User) { ... }
```

### Avoid `any`

`any` disables TypeScript's checks entirely — it's worse than no types at all. Use `unknown` when the type is genuinely unknown, and narrow it before using it:

```typescript
// ❌ any bypasses all checks
const data: any = await fetchData();
data.doesNotExist.willNotError; // TypeScript won't catch this

// ✅ Type the response explicitly
const result = await apiRequest<User[]>('/api/users');
if (result.data) {
  result.data.forEach((user) => console.log(user.name));
}

// ✅ Use unknown and narrow
function handleUnknown(value: unknown) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase()); // safe
  }
}
```

## Testing

### Write Testable Code

Functions that are easy to test have explicit inputs and outputs:

```typescript
// ❌ Hard to test — depends on global state
function getUserData() {
  return globalCache.get('user');
}

// ✅ Easy to test — pure function, predictable output
function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
```

### Cover the Unhappy Paths

The obvious test is "does it work when everything is fine." The valuable tests are the edge cases:

```typescript
describe('formatUserName', () => {
  it('returns full name', () => {
    expect(formatUserName('Alice', 'Smith')).toBe('Alice Smith');
  });

  it('handles empty last name', () => {
    expect(formatUserName('Alice', '')).toBe('Alice');
  });

  it('handles both empty', () => {
    expect(formatUserName('', '')).toBe('');
  });
});
```

For API endpoints, test missing fields, invalid formats, unauthorized access, and resource-not-found — not just the happy path.

## Git Workflow

### Commit Messages

```
feat: add product listing page
fix: resolve session expiry issue
docs: update deployment guide
refactor: extract product validation to helper
test: add product endpoint integration tests
```

Short imperative phrases. The first word signals intent: `feat` (new feature), `fix` (bug), `docs`, `refactor`, `test`, `chore`.

### Branch Naming

```
feature/product-listing
bugfix/login-redirect-loop
hotfix/session-cookie-security
```

## Next Steps

- **[Adding Features](/dashboard/docs/extending/adding-features)** — Step-by-step guide to adding a new entity, endpoints, and page
- **[Architecture Overview](/dashboard/docs/architecture/overview)** — How the pieces fit together
