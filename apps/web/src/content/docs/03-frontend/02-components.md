# Components

<!-- AI_CONTEXT
This document covers the UI component library.
Key directory: apps/web/src/components/
UI components: apps/web/src/components/ui/ (shadcn/ui based on Radix UI)
Layout components: app-sidebar, dashboard-shell, header, top-nav, user-menu
Notable non-UI components: require-role.tsx, breadcrumbs.tsx, command-menu.tsx, caustics-background.tsx
Theme components: apps/web/src/components/themes/
Docs components: apps/web/src/components/docs/
Components showcase page exists at /dashboard/components
Related docs: theming, nextjs-overview, authentication/rbac
-->

App Shell ships with a full component library so you're not starting from scratch. Components are split into a few categories: the base UI components you'll use everywhere, layout components that structure the dashboard, and a handful of purpose-built components for auth, navigation, and the docs system.

## UI Components (`components/ui/`)

These are the building blocks — buttons, inputs, cards, dialogs, and so on. They're based on **shadcn/ui**, which is built on top of **Radix UI**. Radix UI provides the behavior (keyboard navigation, focus management, accessibility semantics) and shadcn/ui provides the styling. Because you own the source code of every component, you can modify them freely.

The easiest way to see all of them in action is to visit `/dashboard/components` while the app is running — it's a live showcase of every component in every variant.

### Form components

| Component | File | What it does |
|-----------|------|-------------|
| Button | `button.tsx` | Primary action trigger, multiple variants |
| Input | `input.tsx` | Single-line text input |
| Textarea | `textarea.tsx` | Multi-line text input |
| Select | `select.tsx` | Dropdown selector |
| Checkbox | `checkbox.tsx` | Boolean toggle |
| Radio Group | `radio-group.tsx` | Single selection from a list |
| Switch | `switch.tsx` | On/off toggle |
| Slider | `slider.tsx` | Range input |
| Label | `label.tsx` | Accessible form label |

### Display components

| Component | File | What it does |
|-----------|------|-------------|
| Card | `card.tsx` | Content container with header/body/footer slots |
| Badge | `badge.tsx` | Small status label |
| Avatar | `avatar.tsx` | User image with initials fallback |
| Progress | `progress.tsx` | Linear progress bar |
| Progress Circle | `progress-circle.tsx` | Circular progress indicator |
| Skeleton | `skeleton.tsx` | Placeholder shape shown while content loads |
| Spinner | `spinner.tsx` | Loading spinner |
| Empty State | `empty-state.tsx` | Structured layout for "no data" screens |
| Separator | `separator.tsx` | Horizontal or vertical divider |
| Tabs | `tabs.tsx` | Tabbed content switcher |
| Collapsible | `collapsible.tsx` | Expandable/collapsible content section |

### Overlay components

| Component | File | What it does |
|-----------|------|-------------|
| Dialog | `dialog.tsx` | Modal dialog |
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialog with required action |
| Confirm Dialog | `confirm-dialog.tsx` | Pre-styled destructive confirmation (see below) |
| Sheet | `sheet.tsx` | Slide-in panel from any edge |
| Dropdown Menu | `dropdown-menu.tsx` | Context menu attached to a trigger |
| Tooltip | `tooltip.tsx` | Hover tooltip |
| Command | `command.tsx` | Searchable command list primitive |
| Sonner | `sonner.tsx` | Toast notification wrapper |

### Data components

| Component | File | What it does |
|-----------|------|-------------|
| Table | `table.tsx` | Basic HTML table with styling |
| Data Table | `data-table.tsx` | Full-featured table with sorting and selection |
| Pagination | `pagination.tsx` | Page navigation controls |
| Chart | `chart.tsx` | Data visualization wrapper (Recharts) |
| Sidebar | `sidebar.tsx` | Sidebar primitive with collapse support |

## Using Components

All UI components are imported from `@/components/ui/`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MyForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Item name" />
        <Button>Save</Button>
      </CardContent>
    </Card>
  );
}
```

### Button variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>
```

## ConfirmDialog

`confirm-dialog.tsx` is a pre-styled dialog for destructive confirmations. It's what powers the `useConfirmation` hook and the "Are you sure?" prompts throughout the app.

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

In practice, you'll usually use `useConfirmation` rather than wiring up `ConfirmDialog` directly — see the [Hooks](/dashboard/docs/frontend/hooks) page.

## Layout Components (`components/layout/`)

These components assemble the dashboard chrome:

| Component | What it does |
|-----------|-------------|
| `app-sidebar.tsx` | The main navigation sidebar with collapsible sections |
| `dashboard-shell.tsx` | The outer layout container (sidebar + main area) |
| `header.tsx` | The sticky top bar with breadcrumbs and user menu |
| `top-nav.tsx` | Top navigation bar for mobile |
| `user-menu.tsx` | Dropdown menu with profile, settings, and logout |

You generally don't use these directly — they're composed inside `app/dashboard/layout.tsx`.

## RequireRole (`require-role.tsx`)

A component that conditionally renders children based on the current user's role. Useful for hiding UI elements that only admins should see.

```tsx
import { RequireRole } from '@/components/require-role';

<RequireRole role="admin">
  <AdminControls />
</RequireRole>
```

If the current user doesn't have the required role, the children are not rendered at all. This is a UI-level guard — the API enforces the same restrictions server-side.

## Breadcrumbs (`breadcrumbs.tsx`)

Auto-generated breadcrumb navigation based on the current URL path:

```tsx
import { Breadcrumbs } from '@/components/breadcrumbs';

// Renders: Dashboard > Profile
<Breadcrumbs />
```

Used in the dashboard header automatically. You can also use it directly on any page.

## Command Menu (`command-menu.tsx`)

A keyboard-accessible search and navigation palette, triggered by `Cmd+K` (or `Ctrl+K` on Windows). It's mounted in the dashboard layout and lets users quickly jump to any page.

## Adding New shadcn/ui Components

If you need a component that isn't already installed:

```bash
cd apps/web
npx shadcn@latest add calendar
npx shadcn@latest add accordion
npx shadcn@latest add date-picker
```

This downloads the component source directly into `src/components/ui/`. You own the code — modify it however you need.
