# Customization

<!-- AI_CONTEXT
This document covers customization options for branding, theming, and styling.
Key files: apps/web/src/styles/themes/, apps/web/src/components/themes/theme.config.ts, apps/web/src/components/themes/active-theme.tsx, apps/web/tailwind.config.js
Theme system: CSS files in styles/themes/, registered in theme.config.ts as THEMES array with { name, value } shape.
IMPORTANT: theme-list.ts does NOT exist. Correct file is theme.config.ts.
IMPORTANT: ThemeProvider does NOT exist. Correct component is ActiveThemeProvider with initialTheme prop.
Theme selector is ActiveThemeProvider in active-theme.tsx, uses data-theme attribute on html element.
CSS variables use HEX values (e.g. #2563eb), not HSL. Light + dark sections: [data-theme='NAME'] and [data-theme='NAME'].dark.
Tailwind config file is tailwind.config.js (not .ts).
Existing themes: claude, cosmos, default, forest. DEFAULT_THEME = 'claude'.
Sidebar branding: apps/web/src/components/layout/app-sidebar.tsx — SidebarHeader section.
Related docs: frontend/theming, best-practices, reference/theme-guide
-->

## Branding

### App Name and Logo

The logo and app name live in the `SidebarHeader` section of `apps/web/src/components/layout/app-sidebar.tsx`:

```typescript
<SidebarHeader className="border-b">
  <div className="flex items-center gap-2 px-2 py-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
      {/* Replace with your logo component or image */}
      A
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-sm">Your App Name</span>
      <span className="text-xs text-muted-foreground">Starter Template</span>
    </div>
  </div>
</SidebarHeader>
```

### Favicon and Metadata

```typescript
// apps/web/src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};
```

Replace the `favicon.ico` and any icon files in `apps/web/public/`.

## Theming

App Shell has a CSS variable–based theme system. Themes are plain CSS files that define variables for colors, borders, and spacing. Switching themes swaps which CSS file's variables are active.

### How the Theme System Works

1. Theme CSS files live in `apps/web/src/styles/themes/` — one file per theme
2. Each theme defines CSS variables for light mode and dark mode
3. The `ActiveThemeProvider` component sets a `data-theme` attribute on the `<html>` element
4. CSS selectors like `[data-theme='claude']` activate the right variables
5. Themes are registered in `apps/web/src/components/themes/theme.config.ts`

### Existing Themes

| Theme name | Description |
|------------|-------------|
| `claude` | Default — warm, professional |
| `cosmos` | Dark, space-inspired |
| `default` | Clean blue theme |
| `forest` | Green, natural |

### Creating a New Theme

Copy the template from `apps/web/src/styles/themes/_template.css`:

```css
/* apps/web/src/styles/themes/your-brand.css */

/* Light mode */
[data-theme='your-brand'] {
  --background: #f5f5f5;
  --foreground: #1a1a1a;

  --card: #ffffff;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;

  --primary: #2563eb;           /* Your brand color */
  --primary-foreground: #ffffff;
  --secondary: #e5e7eb;
  --secondary-foreground: #1f2937;
  --accent: #dbeafe;
  --accent-foreground: #1e40af;

  --muted: #f3f4f6;
  --muted-foreground: #6b7280;

  --input: #d1d5db;
  --border: #e5e7eb;
  --ring: #2563eb;

  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  --sidebar-background: #fafafa;
  --sidebar-foreground: #374151;
  --sidebar-primary: #2563eb;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f3f4f6;
  --sidebar-accent-foreground: #1f2937;
  --sidebar-border: #e5e7eb;
  --sidebar-ring: #2563eb;

  --radius: 0.5rem;
}

/* Dark mode */
[data-theme='your-brand'].dark {
  --background: #0f0f0f;
  --foreground: #fafafa;

  --primary: #3b82f6;
  --primary-foreground: #ffffff;

  /* ... fill in remaining dark mode variables */
}
```

See `apps/web/src/styles/themes/THEME-CREATION-GUIDE.md` for full variable documentation.

### Import the Theme

Add an import in `apps/web/src/styles/theme.css`:

```css
@import './themes/your-brand.css';
```

### Register the Theme

Add it to the `THEMES` array in `apps/web/src/components/themes/theme.config.ts`:

```typescript
export const THEMES = [
  { name: 'Claude', value: 'claude' },
  { name: 'Cosmos', value: 'cosmos' },
  { name: 'Default', value: 'default' },
  { name: 'Forest', value: 'forest' },
  { name: 'Your Brand', value: 'your-brand' }, // Add this
];
```

Users can then select the theme through the theme selector UI. The selection is stored in a cookie and applied on the next page load.

### Changing the Default Theme

Edit `DEFAULT_THEME` in `theme.config.ts`:

```typescript
export const DEFAULT_THEME = 'your-brand'; // was 'claude'
```

This affects users who haven't explicitly selected a theme yet. To set it programmatically for a specific page or layout, pass `initialTheme` to `ActiveThemeProvider`:

```typescript
// apps/web/src/app/layout.tsx
import { ActiveThemeProvider } from '@/components/themes/active-theme';

<ActiveThemeProvider initialTheme="your-brand">
  {children}
</ActiveThemeProvider>
```

## Typography

### Custom Fonts

```typescript
// apps/web/src/app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      {children}
    </html>
  );
}
```

### Tailwind Font Config

```javascript
// apps/web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
};
```

## Component Customization

### Extending Button Variants

The Button component uses `class-variance-authority`. Add a new variant to its `variants` config in `apps/web/src/components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md ...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground ...',
        // Add your variant
        brand: 'bg-brand-500 text-white hover:bg-brand-600',
      },
    },
  }
);
```

### Building Wrapper Components

For app-specific UI patterns, create wrapper components on top of the base UI components:

```typescript
// apps/web/src/components/app/app-card.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AppCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AppCard({ title, children, actions }: AppCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

This keeps your feature code clean without modifying the base UI components.

## Global CSS

Add global styles to `apps/web/src/styles/globals.css`:

```css
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
  border-radius: 4px;
}

/* Custom text selection */
::selection {
  background: hsl(var(--primary) / 0.2);
}
```

## Next Steps

- **[Theme Guide](/dashboard/docs/reference/theme-guide)** — Complete theming reference with all variables documented
- **[Best Practices](/dashboard/docs/extending/best-practices)** — Code patterns to follow when adding features
