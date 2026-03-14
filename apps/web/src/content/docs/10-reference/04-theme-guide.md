# Theme Guide

<!-- AI_CONTEXT
This document provides a complete theming reference.
Key files: apps/web/src/styles/themes/, apps/web/src/styles/theme.css, apps/web/src/components/themes/theme.config.ts, apps/web/src/components/themes/active-theme.tsx
IMPORTANT: CSS variables use HEX values (e.g. #2563eb), NOT HSL format.
IMPORTANT: Dark mode selector is [data-theme='NAME'].dark — NOT .dark [data-theme='NAME'].
IMPORTANT: New theme imports go in theme.css, NOT globals.css.
IMPORTANT: theme-list.ts does NOT exist. Registration file is theme.config.ts with THEMES array of { name, value } objects.
IMPORTANT: next-themes is NOT used. Theme system is custom: ActiveThemeProvider (active-theme.tsx), useThemeConfig() hook.
IMPORTANT: ThemeProvider does NOT exist. Correct component: ActiveThemeProvider with initialTheme prop.
Existing themes: claude, cosmos, default, forest. DEFAULT_THEME = 'claude'.
Light/dark: each theme has [data-theme='NAME'] and [data-theme='NAME'].dark CSS blocks.
Related docs: frontend/theming, extending/customization
-->

## How the Theme System Works

App Shell uses plain CSS custom properties for theming. There are no runtime JavaScript dependencies for the theme switch — swapping themes means changing a `data-theme` attribute on the `<html>` element, which activates a different set of CSS variables.

The components use Tailwind utility classes like `bg-primary` and `text-foreground`. Tailwind maps those classes to the CSS variables, so changing the variables changes every component's colors automatically.

```
┌─────────────────────────────────────────────┐
│           ActiveThemeProvider               │
│  Sets data-theme on <html>, stores in      │
│  cookie for persistence across page loads  │
├─────────────────────────────────────────────┤
│                  CSS Layer                  │
│  [data-theme="claude"] { --primary: ... }   │
│  [data-theme="claude"].dark { --primary: .. }│
├─────────────────────────────────────────────┤
│            Tailwind Utilities               │
│  bg-primary → uses var(--primary)          │
│  text-foreground → uses var(--foreground)  │
├─────────────────────────────────────────────┤
│                Components                   │
│  <Button> uses bg-primary                   │
└─────────────────────────────────────────────┘
```

## File Structure

```
apps/web/src/styles/
├── theme.css              # Imports all theme CSS files
├── globals.css            # Global styles (not theme files)
└── themes/
    ├── _template.css      # Copy this to create a new theme
    ├── THEME-CREATION-GUIDE.md
    ├── claude.css         # Default theme
    ├── cosmos.css
    ├── default.css
    └── forest-theme.css

apps/web/src/components/themes/
├── theme.config.ts        # THEMES array and DEFAULT_THEME
├── active-theme.tsx       # ActiveThemeProvider + useThemeConfig hook
├── theme-selector.tsx     # Theme picker UI
└── theme-mode-toggle.tsx  # Light/dark mode toggle
```

## CSS Variable Reference

All variables use hex color values.

### Page & Text

| Variable | Usage |
|----------|-------|
| `--background` | Main page background |
| `--foreground` | Primary text color |

### Surfaces

| Variable | Usage |
|----------|-------|
| `--card` | Card backgrounds |
| `--card-foreground` | Text on cards |
| `--popover` | Dropdown and modal backgrounds |
| `--popover-foreground` | Text in popovers |

### Interactive Elements

| Variable | Usage |
|----------|-------|
| `--primary` | Primary buttons, links, brand color |
| `--primary-foreground` | Text on primary elements |
| `--secondary` | Secondary buttons and backgrounds |
| `--secondary-foreground` | Text on secondary elements |
| `--accent` | Hover states, highlights |
| `--accent-foreground` | Text on accented elements |

### Subdued

| Variable | Usage |
|----------|-------|
| `--muted` | Muted backgrounds (badges, subtle areas) |
| `--muted-foreground` | Secondary and subdued text |

### Form Elements

| Variable | Usage |
|----------|-------|
| `--input` | Input field border color |
| `--border` | General border color |
| `--ring` | Focus ring color (usually matches `--primary`) |

### Semantic

| Variable | Usage |
|----------|-------|
| `--destructive` | Error, delete, danger states |
| `--destructive-foreground` | Text on destructive elements |

### Sidebar

| Variable | Usage |
|----------|-------|
| `--sidebar-background` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Sidebar active item |
| `--sidebar-primary-foreground` | Text on active sidebar item |
| `--sidebar-accent` | Sidebar hover state |
| `--sidebar-accent-foreground` | Text on sidebar hover |
| `--sidebar-border` | Sidebar border |
| `--sidebar-ring` | Sidebar focus ring |

### Layout

| Variable | Usage |
|----------|-------|
| `--radius` | Border radius for components |

## Creating a New Theme

### 1. Copy the template

```bash
cp apps/web/src/styles/themes/_template.css apps/web/src/styles/themes/my-theme.css
```

### 2. Edit the CSS file

Fill in your color values. Variables use **hex values** — not HSL:

```css
/* apps/web/src/styles/themes/my-theme.css */

/* Light mode */
[data-theme='my-theme'] {
  --background: #f8fafc;
  --foreground: #0f172a;

  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;

  --primary: #7c3aed;           /* Your brand color */
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #1e293b;
  --accent: #ede9fe;
  --accent-foreground: #5b21b6;

  --muted: #f1f5f9;
  --muted-foreground: #64748b;

  --input: #cbd5e1;
  --border: #e2e8f0;
  --ring: #7c3aed;

  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  --sidebar-background: #f8fafc;
  --sidebar-foreground: #374151;
  --sidebar-primary: #7c3aed;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f1f5f9;
  --sidebar-accent-foreground: #1e293b;
  --sidebar-border: #e2e8f0;
  --sidebar-ring: #7c3aed;

  --radius: 0.5rem;
}

/* Dark mode */
[data-theme='my-theme'].dark {
  --background: #0f0f0f;
  --foreground: #fafafa;

  --card: #1a1a1a;
  --card-foreground: #fafafa;
  --popover: #171717;
  --popover-foreground: #fafafa;

  --primary: #8b5cf6;
  --primary-foreground: #ffffff;
  --secondary: #27272a;
  --secondary-foreground: #fafafa;
  --accent: #3b1f6e;
  --accent-foreground: #c4b5fd;

  --muted: #262626;
  --muted-foreground: #a1a1aa;

  --input: #3f3f46;
  --border: #27272a;
  --ring: #8b5cf6;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --sidebar-background: #0a0a0a;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #8b5cf6;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #27272a;
  --sidebar-ring: #8b5cf6;

  --radius: 0.5rem;
}
```

The dark mode selector is `[data-theme='my-theme'].dark` — the `.dark` class is added to the `<html>` element alongside `data-theme`.

### 3. Import the theme

Add the import to `apps/web/src/styles/theme.css`:

```css
/* theme.css */
@import './themes/default.css';
@import './themes/claude.css';
@import './themes/forest-theme.css';
@import './themes/cosmos.css';
@import './themes/my-theme.css'; /* Add this */
```

### 4. Register the theme

Add it to `THEMES` in `apps/web/src/components/themes/theme.config.ts`:

```typescript
export const THEMES = [
  { name: 'Claude', value: 'claude' },
  { name: 'Cosmos', value: 'cosmos' },
  { name: 'Default', value: 'default' },
  { name: 'Forest', value: 'forest' },
  { name: 'My Theme', value: 'my-theme' }, // Add this
];
```

The theme will now appear in the theme selector UI.

## Changing the Default Theme

Edit `DEFAULT_THEME` in `theme.config.ts`:

```typescript
export const DEFAULT_THEME = 'my-theme'; // was 'claude'
```

## Using the Theme in Components

### Reading the active theme

```typescript
import { useThemeConfig } from '@/components/themes/active-theme';

function ThemeAwareComponent() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div>
      <p>Current theme: {activeTheme}</p>
      <button onClick={() => setActiveTheme('cosmos')}>
        Switch to Cosmos
      </button>
    </div>
  );
}
```

`useThemeConfig` must be used inside `ActiveThemeProvider`.

### Setting an initial theme programmatically

Pass `initialTheme` to `ActiveThemeProvider` to override the cookie/default:

```typescript
import { ActiveThemeProvider } from '@/components/themes/active-theme';

<ActiveThemeProvider initialTheme="my-theme">
  {children}
</ActiveThemeProvider>
```

## Best Practices

**Test both light and dark modes.** A color that looks good in light mode can become unreadable in dark mode. Check every variable in both states.

**Maintain contrast ratios.** Text on background should meet at least WCAG AA contrast. Foreground text on `--background` and `--card-foreground` on `--card` are the most important pairs.

**Use semantic variable names in components.** Use `bg-primary` not `bg-purple-600`. Semantic names let your theme work across different color choices without component changes.

**Keep sidebar variables consistent.** The sidebar has its own variable set because it's often a different shade than the main background. Fill in all `--sidebar-*` variables even if they match the main theme.

## Next Steps

- **[Customization](/dashboard/docs/extending/customization)** — Branding and theme creation walkthrough
- **[Frontend Theming](/dashboard/docs/frontend/theming)** — How themes integrate with the component system
