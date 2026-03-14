# Custom Hooks

<!-- AI_CONTEXT
This document covers the custom React hooks.
Key directory: apps/web/src/hooks/
Hooks: useApiMutation, apiRequest, usePermissions, useDebounce, usePagination, useConfirmation, useMobile
IMPORTANT: useApiMutation only supports POST/PUT/DELETE. For GET requests, use apiRequest() directly.
IMPORTANT: useConfirmation requires ConfirmationProvider in the component tree. It returns { confirm } only, where confirm(options) returns Promise<boolean>.
IMPORTANT: usePagination requires totalItems (not optional). Returns many values including paginateData, nextPage, previousPage, firstPage, lastPage, pageNumbers.
usePermissions returns { user, isLoading, error, hasRole, hasAnyRole, isAdmin, refetch }.
hasRole accepts a single role OR an array of roles.
Related docs: components, state-management, authentication/rbac
-->

React hooks are functions that let components tap into shared logic without duplicating code. App Shell ships several custom hooks covering the most common patterns: calling the API, checking permissions, paginating data, and handling confirmation dialogs.

## API Calls

### `useApiMutation` — for POST, PUT, DELETE

Use this hook when you need to trigger an API call in response to a user action (submitting a form, clicking a button, deleting something).

```tsx
import { useApiMutation } from '@/hooks/use-api';
import type { LoginInput } from '@app-shell/shared';

function LoginForm() {
  const { execute, isLoading, error, data, reset } = useApiMutation<LoginInput, User>(
    '/api/auth/login',
    'POST'
  );

  const handleSubmit = async (formData: LoginInput) => {
    const result = await execute(formData);
    if (result.data) {
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-destructive">{error.message}</p>}
      <Button disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
```

The hook returns:
- `execute(body?)` — triggers the API call, returns `{ data, error }`
- `isLoading` — true while the request is in flight
- `error` — the error object if the request failed, null otherwise
- `data` — the response data if the request succeeded, null otherwise
- `reset()` — clears data, error, and isLoading back to initial state

**Supported methods:** `'POST'` (default), `'PUT'`, `'DELETE'`. This hook is not designed for GET requests.

### `apiRequest` — for GET (and everything else)

For fetching data on page load or in `useEffect`, use `apiRequest` directly. It handles credentials, base URL, error parsing, and network failures the same way as the hook, but without the loading state management.

```tsx
import { apiRequest } from '@/hooks/use-api';
import type { User } from '@app-shell/shared';

// In a component or useEffect:
const result = await apiRequest<User>('/api/me');

if (result.data) {
  console.log('Logged in as:', result.data.name);
}
if (result.error) {
  console.error('Error:', result.error.message);
}
```

### Helper utilities

```tsx
import { isErrorCode, getFieldError } from '@/hooks/use-api';

// Check if an error has a specific code (e.g. 'INVALID_CREDENTIALS')
if (isErrorCode(error, 'INVALID_CREDENTIALS')) { ... }

// Extract a field-level error from the API response
const emailError = getFieldError(error, 'email');
```

---

## `usePermissions` — current user and role checks

Fetches the current user from the API and provides role-checking utilities. Useful anywhere you need to know who's logged in or gate UI based on role.

```tsx
import { usePermissions } from '@/hooks/use-permissions';

function AdminPanel() {
  const { user, isLoading, isAdmin, refetch } = usePermissions();

  if (isLoading) return <Skeleton />;
  if (!isAdmin) return <p>Access denied</p>;

  return <div>Welcome, {user?.name}</div>;
}
```

The hook returns:
- `user` — the current user object, or `null` if not logged in
- `isLoading` — true while fetching user data
- `error` — any error that occurred fetching user data
- `isAdmin` — convenience boolean, true if `user.role === 'admin'`
- `hasRole(role)` — checks if user has the given role; accepts a single role or an array
- `hasAnyRole(roles[])` — true if the user has any role in the list
- `refetch()` — re-fetches user data (useful after a role change)

```tsx
const { hasRole, hasAnyRole } = usePermissions();

// Single role check
if (hasRole('admin')) { ... }

// Either of these roles
if (hasAnyRole(['admin', 'editor'])) { ... }

// hasRole also accepts an array
if (hasRole(['admin', 'editor'])) { ... }
```

---

## `useConfirmation` — imperative confirmation dialogs

This hook provides a `confirm()` function you can call anywhere to show a confirmation dialog and await the user's response. It's built on a Context provider, so `ConfirmationProvider` must be in the component tree above any component that uses the hook.

The provider is already mounted in the dashboard layout, so within the dashboard you can use `useConfirmation` without adding the provider yourself.

```tsx
import { useConfirmation } from '@/hooks/use-confirmation';

function DeleteButton({ itemId }: { itemId: string }) {
  const { confirm } = useConfirmation();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this item?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });

    if (confirmed) {
      await deleteItem(itemId);
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
}
```

`confirm(options)` returns a `Promise<boolean>` — `true` if the user confirmed, `false` if they cancelled or closed the dialog. You `await` it inline, which means you write the confirmation logic as a straight line of code rather than managing open/close state yourself.

Options:
- `title` — required, the dialog heading
- `description` — optional, explanatory text below the heading
- `confirmLabel` — label for the confirm button (defaults to "Confirm")
- `cancelLabel` — label for the cancel button (defaults to "Cancel")
- `variant` — `'default'` or `'destructive'` (styles the confirm button red)

---

## `useDebounce` — delay a rapidly changing value

Debouncing means waiting until a value stops changing before acting on it. The classic use case is search: you don't want to fire an API request on every keystroke, just after the user pauses.

```tsx
import { useDebounce } from '@/hooks/use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

The `300` is the delay in milliseconds. The debounced value only updates after the input has been stable for 300ms.

---

## `usePagination` — pagination state

Manages all the math and state for paginated data. Works for both client-side pagination (slicing a local array) and server-side pagination (passing offset/limit to an API).

```tsx
import { usePagination } from '@/hooks/use-pagination';

function UserList({ users }: { users: User[] }) {
  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    paginateData,
    pageNumbers,
    setPage,
    setPageSize,
  } = usePagination<User>({
    totalItems: users.length,
    initialPageSize: 10,
  });

  const pageUsers = paginateData(users); // slices the array for the current page

  return (
    <>
      {pageUsers.map(user => <UserRow key={user.id} user={user} />)}
      <div>
        <button onClick={firstPage} disabled={!hasPreviousPage}>First</button>
        <button onClick={previousPage} disabled={!hasPreviousPage}>Prev</button>
        {pageNumbers.map(n => (
          <button key={n} onClick={() => setPage(n)}
            style={{ fontWeight: n === currentPage ? 'bold' : 'normal' }}>
            {n}
          </button>
        ))}
        <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
        <button onClick={lastPage} disabled={!hasNextPage}>Last</button>
      </div>
    </>
  );
}
```

`totalItems` is required. `initialPage` and `initialPageSize` are optional (defaults: page 1, 10 per page).

Key return values:
- `paginateData(array)` — slices a local array to the current page (client-side pagination)
- `pageNumbers` — array of up to 5 page numbers centered around the current page (for rendering page buttons)
- `nextPage` / `previousPage` / `firstPage` / `lastPage` — navigation shortcuts
- `hasNextPage` / `hasPreviousPage` — whether navigation in that direction is possible
- `startIndex` / `endIndex` — the zero-based index range for the current page

---

## `useMobile` — viewport detection

Returns `true` if the viewport is narrow enough to be considered mobile (below 768px). Useful for rendering different layouts or skipping features that don't make sense on small screens.

```tsx
import { useMobile } from '@/hooks/use-mobile';

function Navigation() {
  const isMobile = useMobile();
  return isMobile ? <MobileNav /> : <Sidebar />;
}
```
