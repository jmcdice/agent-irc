# Component Reference

<!-- AI_CONTEXT
This document provides a reference for UI components.
Key directory: apps/web/src/components/ui/
Based on: shadcn/ui
IMPORTANT: useConfirmDialog does NOT exist. ConfirmDialog takes props directly (open, onOpenChange, title, description, confirmLabel, cancelLabel, variant, onConfirm, onCancel).
For the promise-based confirm() pattern, use useConfirmation from @/hooks/use-confirmation with ConfirmationProvider.
All listed component files confirmed to exist in apps/web/src/components/ui/.
Related docs: frontend/components, hook-reference
-->

## Overview

App Shell includes 30+ UI components based on **shadcn/ui**. All components live in `apps/web/src/components/ui/`. Import them with the `@/` alias:

```typescript
import { Button } from '@/components/ui/button';
```

## Component List

### Form Components

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | Buttons with variants and sizes |
| Input | `input.tsx` | Text input field |
| Textarea | `textarea.tsx` | Multi-line text input |
| Checkbox | `checkbox.tsx` | Checkbox with label |
| Radio Group | `radio-group.tsx` | Radio button group |
| Select | `select.tsx` | Dropdown select |
| Switch | `switch.tsx` | Toggle switch |
| Slider | `slider.tsx` | Range slider |
| Label | `label.tsx` | Form labels |

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| Card | `card.tsx` | Content container |
| Separator | `separator.tsx` | Visual divider |
| Tabs | `tabs.tsx` | Tabbed interface |
| Sidebar | `sidebar.tsx` | Navigation sidebar |
| Sheet | `sheet.tsx` | Slide-out panel |
| Collapsible | `collapsible.tsx` | Expandable sections |

### Feedback Components

| Component | File | Description |
|-----------|------|-------------|
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialogs (low-level) |
| Dialog | `dialog.tsx` | Modal dialogs |
| Confirm Dialog | `confirm-dialog.tsx` | Pre-built confirm/cancel dialog |
| Sonner | `sonner.tsx` | Toast notifications |
| Progress | `progress.tsx` | Progress bar |
| Progress Circle | `progress-circle.tsx` | Circular progress indicator |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Spinner | `spinner.tsx` | Loading spinner |
| Empty State | `empty-state.tsx` | No-data placeholder |
| Tooltip | `tooltip.tsx` | Hover tooltips |

### Data Display

| Component | File | Description |
|-----------|------|-------------|
| Table | `table.tsx` | Basic data table |
| Data Table | `data-table.tsx` | Table with sorting, filtering, pagination |
| Badge | `badge.tsx` | Status badges |
| Avatar | `avatar.tsx` | User avatars |
| Pagination | `pagination.tsx` | Page navigation |

### Navigation

| Component | File | Description |
|-----------|------|-------------|
| Dropdown Menu | `dropdown-menu.tsx` | Dropdown menus |
| Command | `command.tsx` | Command palette |

---

## Button

Customizable button with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button';

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Delete</Button>

<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>

<Button disabled>Disabled</Button>
<Button asChild><a href="/link">As Link</a></Button>
```

## Card

Content container with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Dialog

Modal dialog for focused interactions.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Supporting description</DialogDescription>
    </DialogHeader>
    <div>Content here</div>
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Confirm Dialog

Pre-built dialog for confirm/cancel prompts. Takes props directly:

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete item?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
```

For a promise-based `confirm()` pattern that works across the whole app without managing `open` state, see `useConfirmation` in the [Hook Reference](/dashboard/docs/reference/hook-reference).

## Data Table

Advanced table with built-in sorting, column filtering, and pagination.

```tsx
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
];

<DataTable
  columns={columns}
  data={users}
  searchColumn="name"
  searchPlaceholder="Search users..."
/>
```

## Toast Notifications

App Shell uses [Sonner](https://sonner.emilkowal.ski/) for toast notifications. Import `toast` directly from the `sonner` package:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Changes saved!');

// Error
toast.error('Something went wrong');

// With description
toast.success('User created', {
  description: 'The user has been added to the system.',
});

// With action button
toast.error('Failed to save', {
  action: {
    label: 'Retry',
    onClick: () => retry(),
  },
});
```

The `<Toaster />` component from `sonner.tsx` must be mounted once in your layout.

## Empty State

Placeholder for empty data views.

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentIcon } from '@heroicons/react/24/outline';

<EmptyState
  icon={<DocumentIcon className="h-12 w-12" />}
  title="No documents"
  description="Get started by creating a new document."
>
  <Button>Create Document</Button>
</EmptyState>
```

## Next Steps

- **[Hook Reference](/dashboard/docs/reference/hook-reference)** — Custom hooks
- **[Theme Guide](/dashboard/docs/reference/theme-guide)** — Theming and CSS variables
