# Theming System

<!-- AI_CONTEXT
This document explains the multi-theme system.
Key files: apps/web/src/styles/theme.css, apps/web/src/styles/themes/*.css
Key config: apps/web/src/components/themes/theme.config.ts
DEFAULT_THEME is 'claude' (not 'default').
THEMES array: Claude (claude), Cosmos (cosmos), Default (default), Forest (forest).
Theme CSS files: claude.css, cosmos.css, default.css, forest-theme.css
Key components: ThemeSelector (theme picker), ThemeModeToggle (light/dark), ThemeProvider, ActiveTheme
CSS variables use HSL values without the hsl() wrapper — Tailwind wraps them.
To add a theme: create CSS file, import in theme.css, add to THEMES array in theme.config.ts.
Related docs: components, nextjs-overview
-->

App Shell ships with four themes, each with a light and dark mode. Switching themes changes the entire visual identity of the app — colors, accents, and surfaces — without touching any component code. The system is built on CSS custom properties, which means any component that uses Tailwind's color utilities automatically adapts.

## Available Themes

| Theme | Value | Description |
|-------|-------|-------------|
| Claude | `claude` | Warm neutrals inspired by Anthropic's Claude — the default |
| Cosmos | `cosmos` | Deep space purples and blues |
| Default | `default` | Clean, neutral professional palette |
| Forest | `forest` | Nature-inspired greens |

The active theme on first load is **Claude**. You can change the default by editing `DEFAULT_THEME` in `apps/web/src/components/themes/theme.config.ts`.

## How It Works

### 1. CSS custom properties

Each theme defines a set of CSS variables that describe its color palette:

```css
/* styles/themes/claude.css */
[data-theme="claude"] {
  --background: 39 24% 94%;
  --foreground: 25 15% 15%;
  --primary: 25 55% 45%;
  --primary-foreground: 39 24% 94%;
  --card: 39 20% 90%;
  /* ... and more */
}

[data-theme="claude"].dark {
  --background: 25 15% 12%;
  --foreground: 39 24% 90%;
  --primary: 25 55% 55%;
  /* ... dark mode overrides */
}
```

The values are HSL color components — `hue saturation% lightness%` — without the `hsl()` wrapper. Tailwind's config wraps them:

```js
// tailwind.config.js
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: 'hsl(var(--primary))',
}
```

This is why you can write `className="bg-background text-foreground"` and have it change when the theme changes — those class names reference the variables, not hardcoded color values.

### 2. Theme and mode on the HTML element

The current theme is stored as a `data-theme` attribute on the `<html>` element. Dark mode adds a `dark` class:

```html
<html data-theme="claude" class="dark">
```

The CSS selectors `[data-theme="claude"]` and `[data-theme="claude"].dark` pick up from there.

### 3. Persistence

Theme and mode preferences are saved to `localStorage`. Next time the user visits, their preferences are restored before the page renders, avoiding a flash of the wrong theme.

## Theme Components

### `ThemeSelector`

A dropdown that lets users pick from the available themes:

```tsx
import { ThemeSelector } from '@/components/themes/theme-selector';

<ThemeSelector />
```

Renders as a button that opens a menu of theme options. The currently active theme is indicated.

### `ThemeModeToggle`

A button that toggles between light and dark mode:

```tsx
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';

<ThemeModeToggle />
```

Both are already placed in the dashboard header, so users can switch without any additional setup.

## CSS Variable Reference

| Variable | Used for |
|----------|---------|
| `--background` | Page and layout backgrounds |
| `--foreground` | Primary text color |
| `--card` | Card and panel backgrounds |
| `--card-foreground` | Text inside cards |
| `--primary` | Primary buttons, active states, links |
| `--primary-foreground` | Text on primary-colored surfaces |
| `--secondary` | Secondary buttons and surfaces |
| `--secondary-foreground` | Text on secondary surfaces |
| `--muted` | Muted backgrounds (sidebar, code blocks) |
| `--muted-foreground` | Subdued text (placeholders, captions) |
| `--accent` | Hover states, highlights |
| `--accent-foreground` | Text on accent surfaces |
| `--destructive` | Error states, delete buttons |
| `--border` | Borders and dividers |
| `--ring` | Focus ring outlines |

### Using theme colors in components

```tsx
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Save
  </button>
  <p className="text-muted-foreground">
    This text is subdued.
  </p>
</div>
```

## Creating a New Theme

### 1. Copy the template

```bash
cp apps/web/src/styles/themes/_template.css apps/web/src/styles/themes/my-theme.css
```

### 2. Define your colors

Edit the new file to set your color values. HSL format, no `hsl()` wrapper:

```css
[data-theme="my-theme"] {
  --background: 0 0% 100%;
  --foreground: 220 15% 15%;
  --primary: 210 90% 50%;
  --primary-foreground: 0 0% 100%;
  /* fill in the rest from the template */
}

[data-theme="my-theme"].dark {
  --background: 220 15% 10%;
  --foreground: 0 0% 95%;
  --primary: 210 90% 60%;
  --primary-foreground: 0 0% 100%;
  /* dark mode overrides */
}
```

### 3. Import the CSS file

Add an import to `apps/web/src/styles/theme.css`:

```css
@import './themes/my-theme.css';
```

### 4. Add to the theme config

Edit `apps/web/src/components/themes/theme.config.ts` to add your theme to the list. This is what makes it appear in the `ThemeSelector` dropdown:

```ts
export const THEMES = [
  { name: 'Claude', value: 'claude' },
  { name: 'Cosmos', value: 'cosmos' },
  { name: 'Default', value: 'default' },
  { name: 'Forest', value: 'forest' },
  { name: 'My Theme', value: 'my-theme' }, // add this
];
```

`name` is the display label in the dropdown; `value` must match the `data-theme` attribute in your CSS.

There's a detailed walkthrough in `apps/web/src/styles/themes/THEME-CREATION-GUIDE.md` if you want to understand each variable and how they relate to each other.
