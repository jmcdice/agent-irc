# State Management

<!-- AI_CONTEXT
This document covers state management patterns in the frontend.
No external state library (Redux, Zustand) — uses React built-ins.
For GET requests, use apiRequest() from use-api.ts, not useApiMutation (which only supports POST/PUT/DELETE).
Existing contexts: ThemeProvider (theme + dark mode), SidebarProvider (sidebar open/close), ConfirmationProvider (confirmation dialogs).
Related docs: hooks, nextjs-overview, authentication/overview
-->

App Shell doesn't use an external state management library like Redux or Zustand. React 19's built-in tools — `useState`, `useEffect`, `useContext`, `useMemo`, and `useReducer` — handle everything the codebase needs without adding another dependency to learn.

This is a deliberate choice. External state libraries are useful when you have complex global state shared across many components, time-travel debugging needs, or middleware requirements. A starter template doesn't have those needs yet, and introducing a library you might not need adds learning overhead. If your project grows to need one, adding it later is straightforward.

## How State Is Categorized

| Type | Tool | Example |
|------|------|---------|
| Local UI state | `useState` | Form input values, toggle open/closed |
| Derived state | `useMemo` | Filtered or sorted lists computed from other state |
| Side effects | `useEffect` | Fetching data when a component mounts |
| Shared state | React Context | Current theme, sidebar open/close |
| Server data | `apiRequest` + `useState` | User profile loaded from the API |
| Mutations | `useApiMutation` | Submitting a form, deleting a record |

## Local State

For state that lives in a single component:

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

## Form State

App Shell uses **react-hook-form** with **Zod** for form validation. react-hook-form manages the form field values and error state; Zod provides the validation rules via the shared schemas package.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@app-shell/shared';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    // data is validated — types match, constraints passed
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <Input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      <Button type="submit">Sign in</Button>
    </form>
  );
}
```

## Fetching Server Data

For loading data when a component mounts, use `apiRequest` from `use-api.ts` inside a `useEffect`. `apiRequest` handles credentials, error parsing, and network failures.

```tsx
import { useState, useEffect } from 'react';
import { apiRequest } from '@/hooks/use-api';
import type { User } from '@app-shell/shared';

function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<User>('/api/me').then((result) => {
      if (result.data) setUser(result.data);
      if (result.error) setError(result.error.message);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <Skeleton />;
  if (error) return <p>{error}</p>;
  return <ProfileCard user={user!} />;
}
```

> `apiRequest` works for GET requests. For POST, PUT, and DELETE, use the `useApiMutation` hook — it adds loading/error state management on top of `apiRequest`.

## Existing Contexts

App Shell ships three context providers that are already mounted in the app layout:

| Provider | What it provides |
|----------|-----------------|
| `ThemeProvider` | Current theme name and dark/light mode |
| `SidebarProvider` | Whether the sidebar is open or collapsed |
| `ConfirmationProvider` | The `confirm()` function from `useConfirmation` |

You don't need to add these providers yourself — they're already in place. Just use the corresponding hooks (`useTheme`, `useSidebar`, `useConfirmation`) from any component inside the dashboard.

## Creating New Context

If you have state that multiple components in different parts of the tree need, Context is the right tool. Here's the standard pattern:

```tsx
// src/contexts/my-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface MyContextValue {
  value: string;
  setValue: (v: string) => void;
}

const MyContext = createContext<MyContextValue | null>(null);

export function MyProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('');
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be used within MyProvider');
  return ctx;
}
```

Then wrap the relevant part of your component tree with `<MyProvider>` and call `useMyContext()` wherever you need it.

## Derived State

Rather than storing computed values in state (which creates sync problems), derive them from existing state with `useMemo`:

```tsx
// ✅ Derive from state
const [items, setItems] = useState<Item[]>([]);
const activeItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);

// ❌ Avoid — keeping two pieces of state in sync is error-prone
const [items, setItems] = useState<Item[]>([]);
const [activeItems, setActiveItems] = useState<Item[]>([]);
```

## When to Add a State Library

The built-in tools are sufficient for most use cases. Consider adding a library like [Zustand](https://zustand-demo.pmnd.rs/) or [Jotai](https://jotai.org/) if you find yourself needing:

- Global state that's updated frequently from many different components
- State that needs to persist across full page navigations
- Complex state machines with many transitions

Both Zustand and Jotai are lightweight and integrate cleanly with the App Router — they're better choices than Redux for a project like this.
