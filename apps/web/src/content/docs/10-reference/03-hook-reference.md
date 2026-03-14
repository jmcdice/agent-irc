# Hook Reference

<!-- AI_CONTEXT
This document provides a reference for custom hooks.
Key directory: apps/web/src/hooks/
Hooks: use-api.ts (useApiMutation, apiRequest), use-permissions.ts (usePermissions), use-debounce.ts (useDebounce), use-pagination.ts (usePagination), use-confirmation.tsx (useConfirmation, ConfirmationProvider), use-mobile.tsx (useMobile)
IMPORTANT: No useApi hook — use apiRequest() for reads, useApiMutation() for writes.
usePagination: setPage() not goToPage(). previousPage() not prevPage(). hasPreviousPage not hasPrevPage.
usePagination returns: currentPage, pageSize, totalPages, totalItems, startIndex, endIndex, hasNextPage, hasPreviousPage, setPage, setPageSize, nextPage, previousPage, firstPage, lastPage, paginateData, pageNumbers.
paginateData(data) slices the array for current page — use instead of data.slice(startIndex, endIndex).
useConfirmation: exports ConfirmationProvider (wraps app AND renders dialog internally), useConfirmation (returns { confirm }).
ConfirmationDialog is NOT separately exported from use-confirmation.tsx — ConfirmationProvider renders it internally.
usePermissions returns: user, isLoading, error, hasRole, hasAnyRole, isAdmin, refetch.
Related docs: frontend/hooks, component-reference
-->

## Overview

App Shell provides several custom hooks for common patterns. All hooks live in `apps/web/src/hooks/`.

## Available Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useApiMutation` | `use-api.ts` | API mutations (POST/PUT/DELETE) with loading/error state |
| `apiRequest` | `use-api.ts` | Low-level fetch wrapper for reads |
| `usePermissions` | `use-permissions.ts` | Current user and role-based access control |
| `useDebounce` | `use-debounce.ts` | Debounce rapidly changing values |
| `usePagination` | `use-pagination.ts` | Pagination state management |
| `useConfirmation` | `use-confirmation.tsx` | Promise-based confirmation dialogs |
| `useMobile` | `use-mobile.tsx` | Mobile viewport detection |

---

## useApiMutation

Make API mutations with loading and error state tracking.

### Import

```typescript
import { useApiMutation, apiRequest, getFieldError, isErrorCode } from '@/hooks/use-api';
```

### Usage

```typescript
function LoginForm() {
  const { execute, isLoading, error, data, reset } = useApiMutation<LoginInput, LoginResponse>(
    '/api/auth/login',
    'POST'
  );

  const handleSubmit = async (formData: LoginInput) => {
    const result = await execute(formData);

    if (result.data) {
      router.push('/dashboard');
    }
    // result.error is set automatically — display it from hook's error state
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        aria-invalid={!!getFieldError(error, 'email')}
      />
      {getFieldError(error, 'email') && (
        <p className="text-destructive text-sm">{getFieldError(error, 'email')}</p>
      )}
      <Button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### API

```typescript
function useApiMutation<TRequest, TResponse>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE'
): {
  execute: (body?: TRequest) => Promise<ApiResult<TResponse>>;
  isLoading: boolean;
  error: ApiError | null;
  data: TResponse | null;
  reset: () => void;
}

// ApiResult shape
interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}
```

### Helper Functions

```typescript
// Check for a specific error code
isErrorCode(error, 'INVALID_CREDENTIALS') // boolean

// Get validation error for a specific field
getFieldError(error, 'email') // string | undefined
```

---

## apiRequest

Low-level fetch function for read operations. Returns `{ data, error }` without managing React state.

```typescript
import { apiRequest } from '@/hooks/use-api';

// In useEffect
useEffect(() => {
  apiRequest<User[]>('/api/users').then((result) => {
    if (result.data) setUsers(result.data);
    if (result.error) setError(result.error);
  });
}, []);

// Or with async/await
const result = await apiRequest<User>('/api/me');
if (result.data) {
  console.log(result.data.name);
}
```

`apiRequest` includes `credentials: 'include'` automatically and normalizes network errors into the same `{ error }` shape.

---

## usePermissions

Access the current user and check role-based permissions.

### Import

```typescript
import { usePermissions } from '@/hooks/use-permissions';
import { UserRole } from '@app-shell/shared';
```

### Usage

```typescript
function AdminPanel() {
  const { user, isLoading, isAdmin, hasRole, hasAnyRole, refetch } = usePermissions();

  if (isLoading) return <Skeleton />;
  if (!user) return <LoginPrompt />;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      {isAdmin && <AdminControls />}

      {hasRole(UserRole.ADMIN) && <DeleteButton />}

      {hasAnyRole([UserRole.ADMIN, UserRole.SE]) && <ManageUsers />}
    </div>
  );
}
```

### API

```typescript
function usePermissions(): {
  user: User | null;           // null when not logged in
  isLoading: boolean;
  error: Error | null;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;            // convenience: user.role === UserRole.ADMIN
  refetch: () => Promise<void>;
}
```

Fetches from `GET /api/me` on mount. A `401` response is treated as "not logged in" (sets `user` to `null`) rather than an error.

---

## useDebounce

Debounce a rapidly changing value — useful for search inputs to avoid firing a request on every keystroke.

### Import

```typescript
import { useDebounce } from '@/hooks/use-debounce';
```

### Usage

```typescript
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // 300ms delay

  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### API

```typescript
function useDebounce<T>(value: T, delay: number): T
```

Returns the last value after `delay` milliseconds have passed without a new value being set.

---

## usePagination

Manage pagination state for a list of items.

### Import

```typescript
import { usePagination } from '@/hooks/use-pagination';
```

### Usage

```typescript
function UserList({ users }: { users: User[] }) {
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    paginateData,
    pageNumbers,
  } = usePagination({
    totalItems: users.length,
    initialPage: 1,
    initialPageSize: 10,
  });

  // paginateData slices the array for the current page
  const visibleUsers = paginateData(users);

  return (
    <>
      <UserTable users={visibleUsers} />
      <div className="flex gap-2">
        <button onClick={firstPage} disabled={!hasPreviousPage}>«</button>
        <button onClick={previousPage} disabled={!hasPreviousPage}>‹</button>
        {pageNumbers.map((n) => (
          <button key={n} onClick={() => setPage(n)} aria-current={n === currentPage}>
            {n}
          </button>
        ))}
        <button onClick={nextPage} disabled={!hasNextPage}>›</button>
        <button onClick={lastPage} disabled={!hasNextPage}>»</button>
      </div>
    </>
  );
}
```

### API

```typescript
function usePagination<T>(options: {
  totalItems: number;
  initialPage?: number;       // default: 1
  initialPageSize?: number;   // default: 10
}): {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;         // inclusive start index into the data array
  endIndex: number;           // inclusive end index into the data array
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;    // clamps to valid range
  setPageSize: (size: number) => void; // resets to page 1
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  paginateData: (data: T[]) => T[];   // slices array for current page
  pageNumbers: number[];              // visible page numbers (up to 5)
}
```

> [!NOTE] `endIndex` is the **inclusive** last index. Use `paginateData(data)` rather than `data.slice(startIndex, endIndex)` to get the correct page slice.

---

## useConfirmation

Promise-based confirmation dialogs that work across the whole app without managing `open` state in each component.

### Setup

Wrap your app (or the layout that needs confirmation dialogs) with `ConfirmationProvider`. The provider renders the dialog itself — you don't need to add a `ConfirmationDialog` component separately:

```typescript
// apps/web/src/app/dashboard/layout.tsx
import { ConfirmationProvider } from '@/hooks/use-confirmation';

export default function DashboardLayout({ children }) {
  return (
    <ConfirmationProvider>
      {children}
    </ConfirmationProvider>
  );
}
```

### Usage

```typescript
import { useConfirmation } from '@/hooks/use-confirmation';

function DeleteButton({ item }: { item: Item }) {
  const { confirm } = useConfirmation();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item',
      description: `Are you sure you want to delete "${item.name}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      await deleteItem(item.id);
    }
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### API

```typescript
// Exports
export function ConfirmationProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useConfirmation(): { confirm: (options: ConfirmOptions) => Promise<boolean> }

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;       // default: 'Confirm'
  cancelLabel?: string;        // default: 'Cancel'
  variant?: 'default' | 'destructive';
}
```

`confirm()` returns a `Promise<boolean>` — `true` if the user clicked confirm, `false` if they cancelled or dismissed.

---

## useMobile

Detect whether the viewport is in mobile size.

```typescript
import { useMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### API

```typescript
function useMobile(): boolean
```

Returns `true` when the viewport width is below the mobile breakpoint.

---

## Next Steps

- **[Component Reference](/dashboard/docs/reference/component-reference)** — UI components
- **[Frontend Hooks](/dashboard/docs/frontend/hooks)** — Detailed hook documentation
