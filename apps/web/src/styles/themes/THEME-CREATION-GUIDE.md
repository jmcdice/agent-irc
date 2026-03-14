# Theme Creation Guide

This guide documents the App Shell theming system and provides a process for creating new themes.

## Architecture Overview

The theming system uses:
- **CSS Custom Properties (variables)** defined in theme CSS files
- **Tailwind CSS** that maps these variables to utility classes
- **data-theme attribute** on the `<html>` element to select the active theme
- **next-themes** for light/dark mode switching (adds `.dark` class)

### File Structure

```
apps/web/src/
├── styles/
│   ├── globals.css              # Imports Tailwind + theme.css
│   ├── theme.css                # Imports all theme files
│   └── themes/
│       ├── default.css          # Default shadcn theme
│       ├── claude.css           # Claude/Anthropic theme
│       ├── forest-theme.css     # Forest nature theme
│       └── [your-theme].css     # Your new theme
├── components/themes/
│   ├── theme.config.ts          # Theme registry (add new themes here)
│   ├── theme-selector.tsx       # Theme dropdown component
│   └── active-theme.tsx         # Theme context provider
└── tailwind.config.js           # Maps CSS vars to Tailwind classes
```

---

## 1. CSS Variable Inventory

### Category A: Page Backgrounds & Text

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--background` | Main page/app background | `bg-background` |
| `--foreground` | Primary text color | `text-foreground` |

### Category B: Card & Container Surfaces

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--card` | Card/panel backgrounds | `bg-card` |
| `--card-foreground` | Text on cards | `text-card-foreground` |
| `--popover` | Dropdown/popover backgrounds | `bg-popover` |
| `--popover-foreground` | Text in popovers | `text-popover-foreground` |

### Category C: Interactive Elements (Brand Colors)

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--primary` | Primary buttons, links, CTAs | `bg-primary`, `text-primary` |
| `--primary-foreground` | Text on primary buttons | `text-primary-foreground` |
| `--secondary` | Secondary buttons | `bg-secondary` |
| `--secondary-foreground` | Text on secondary buttons | `text-secondary-foreground` |
| `--accent` | Hover states, highlights | `bg-accent` |
| `--accent-foreground` | Text on accented elements | `text-accent-foreground` |

### Category D: Muted/Subdued Elements

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--muted` | Muted backgrounds (badges, tags) | `bg-muted` |
| `--muted-foreground` | Secondary/subdued text | `text-muted-foreground` |

### Category E: Form & Input Elements

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--input` | Input field borders/backgrounds | `bg-input` |
| `--border` | General border color | `border-border` |
| `--ring` | Focus ring color | `ring-ring` |

### Category F: Semantic/Status Colors

| Variable | Purpose | Tailwind Class |
|----------|---------|----------------|
| `--destructive` | Error states, delete buttons | `bg-destructive` |
| `--destructive-foreground` | Text on destructive elements | `text-destructive-foreground` |
| `--success` | Success states (optional) | N/A - use inline |
| `--success-foreground` | Text on success elements | N/A - use inline |
| `--warning` | Warning states (optional) | N/A - use inline |
| `--warning-foreground` | Text on warning elements | N/A - use inline |

### Category G: Sidebar (if using sidebar layout)

| Variable | Purpose |
|----------|---------|
| `--sidebar-background` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Sidebar active item |
| `--sidebar-primary-foreground` | Text on sidebar active |
| `--sidebar-accent` | Sidebar hover background |
| `--sidebar-accent-foreground` | Sidebar hover text |
| `--sidebar-border` | Sidebar borders |
| `--sidebar-ring` | Sidebar focus ring |

### Category H: Charts (optional)

| Variable | Purpose |
|----------|---------|
| `--chart-1` through `--chart-5` | Chart color palette |

### Category I: Layout

| Variable | Purpose |
|----------|---------|
| `--radius` | Border radius base (typically `0.5rem`) |

---

## 2. Light vs Dark Mode Requirements

Each theme file must define **two selectors**:
- `[data-theme='your-theme']` - Light mode
- `[data-theme='your-theme'].dark` - Dark mode

### Key Relationships

| Relationship | Light Mode | Dark Mode |
|--------------|------------|-----------|
| Card vs Background | Card BRIGHTER than background | Card LIGHTER than background |
| Foreground vs Background | Dark text on light bg | Light text on dark bg |
| Muted vs Background | Slightly darker than bg | Slightly lighter than bg |
| Border vs Background | Darker than background | Lighter than background |
| Primary color | Can be dark/saturated | Often lighter/more vivid |

### Contrast Guidelines

- **Light mode backgrounds**: L (lightness) typically 0.95-1.0
- **Light mode foregrounds**: L typically 0.1-0.3
- **Dark mode backgrounds**: L typically 0.1-0.2
- **Dark mode foregrounds**: L typically 0.85-0.98
- **Card elevation**: ~0.03-0.06 lightness difference from background

---

## 3. Color Format Guidelines

### Supported Formats

Both formats work (Tailwind config uses `var()` directly):

1. **OKLCH** (recommended for perceptual uniformity)
   ```css
   --primary: oklch(0.6171 0.1375 39.0427);
   /* oklch(Lightness Chroma Hue) */
   /* L: 0-1, C: 0-0.4+, H: 0-360 */
   ```

2. **Hex** (simpler, widely understood)
   ```css
   --primary: #1a472a;
   ```

### Recommendations

- **Pick one format per theme** for consistency
- **OKLCH advantages**: Better for generating color scales, perceptually uniform
- **Hex advantages**: Easier to work with in design tools, more familiar
- **Use OKLCH** if generating colors programmatically
- **Use Hex** if copying from design tools like Figma

---

## 4. Theme Template

Create a new file: `apps/web/src/styles/themes/[theme-name].css`

```css
/* [Theme Name] theme - [Brief description] */

/* ============================================
   LIGHT MODE
   ============================================ */
[data-theme='theme-name'] {
  /* --- Page Backgrounds & Text --- */
  --background: ;           /* Main page background */
  --foreground: ;           /* Primary text color */

  /* --- Card & Container Surfaces --- */
  --card: ;                 /* Card backgrounds (should contrast with --background) */
  --card-foreground: ;      /* Text on cards */
  --popover: ;              /* Dropdown/modal backgrounds */
  --popover-foreground: ;   /* Text in popovers */

  /* --- Interactive Elements (Brand) --- */
  --primary: ;              /* Primary buttons, links */
  --primary-foreground: ;   /* Text on primary buttons */
  --secondary: ;            /* Secondary buttons */
  --secondary-foreground: ; /* Text on secondary buttons */
  --accent: ;               /* Hover states, highlights */
  --accent-foreground: ;    /* Text on accented elements */

  /* --- Muted/Subdued --- */
  --muted: ;                /* Muted backgrounds */
  --muted-foreground: ;     /* Secondary text */

  /* --- Form Elements --- */
  --input: ;                /* Input borders */
  --border: ;               /* General borders */
  --ring: ;                 /* Focus ring color */

  /* --- Semantic Colors --- */
  --destructive: ;          /* Error/delete actions */
  --destructive-foreground: ;
  /* Optional: */
  /* --success: ; */
  /* --success-foreground: ; */
  /* --warning: ; */
  /* --warning-foreground: ; */

  /* --- Sidebar (if applicable) --- */
  --sidebar-background: ;
  --sidebar-foreground: ;
  --sidebar-primary: ;
  --sidebar-primary-foreground: ;
  --sidebar-accent: ;
  --sidebar-accent-foreground: ;
  --sidebar-border: ;
  --sidebar-ring: ;

  /* --- Charts (optional) --- */
  /* --chart-1: ; */
  /* --chart-2: ; */
  /* --chart-3: ; */
  /* --chart-4: ; */
  /* --chart-5: ; */

  /* --- Layout --- */
  --radius: 0.5rem;
}

/* ============================================
   DARK MODE
   ============================================ */
[data-theme='theme-name'].dark {
  /* --- Page Backgrounds & Text --- */
  --background: ;           /* Dark page background */
  --foreground: ;           /* Light text color */

  /* --- Card & Container Surfaces --- */
  --card: ;                 /* Slightly lighter than background */
  --card-foreground: ;
  --popover: ;
  --popover-foreground: ;

  /* --- Interactive Elements (Brand) --- */
  --primary: ;              /* Often lighter/more vivid in dark mode */
  --primary-foreground: ;
  --secondary: ;
  --secondary-foreground: ;
  --accent: ;
  --accent-foreground: ;

  /* --- Muted/Subdued --- */
  --muted: ;                /* Slightly lighter than background */
  --muted-foreground: ;     /* Dimmed but readable text */

  /* --- Form Elements --- */
  --input: ;
  --border: ;               /* Slightly lighter than background */
  --ring: ;

  /* --- Semantic Colors --- */
  --destructive: ;          /* Often more vivid in dark mode */
  --destructive-foreground: ;

  /* --- Sidebar --- */
  --sidebar-background: ;   /* Often darker than main background */
  --sidebar-foreground: ;
  --sidebar-primary: ;
  --sidebar-primary-foreground: ;
  --sidebar-accent: ;
  --sidebar-accent-foreground: ;
  --sidebar-border: ;
  --sidebar-ring: ;

  /* --- Layout --- */
  --radius: 0.5rem;
}
```

---

## 5. Design Token Questionnaire

Answer these questions to generate a complete theme:

### Brand Identity
1. **Theme name**: (lowercase, no spaces, e.g., `ocean`, `sunset`, `corporate`)
2. **Theme description**: (e.g., "Calm ocean blues with sandy accents")

### Primary Colors
3. **Primary brand color**: (hex or description, e.g., `#0066cc` or "ocean blue")
4. **Secondary brand color**: (for secondary buttons/elements)
5. **Accent color**: (for highlights, hover states)

### Background Temperature
6. **Background tint**:
   - [ ] Neutral (pure gray scale)
   - [ ] Warm (cream, beige, tan undertones)
   - [ ] Cool (blue, slate undertones)
   - [ ] Custom hue: ___________

### Semantic Colors
7. **Destructive/Error color**: (default: red `#e11d48`)
8. **Success color**: (optional, default: green `#22c55e`)
9. **Warning color**: (optional, default: amber `#f59e0b`)

### Contrast Preference
10. **Contrast level**:
    - [ ] Standard (typical shadcn/ui contrast)
    - [ ] High contrast (more accessible)
    - [ ] Soft (lower contrast, gentler)

### Color Format
11. **Preferred format**:
    - [ ] Hex (e.g., `#1a472a`)
    - [ ] OKLCH (e.g., `oklch(0.4 0.1 150)`)

---

## 6. Registration Checklist

After creating your theme CSS file:

### Step 1: Import the theme
Edit `apps/web/src/styles/theme.css`:
```css
@import './themes/default.css';
@import './themes/claude.css';
@import './themes/forest-theme.css';
@import './themes/[your-theme].css';  /* Add this line */
```

### Step 2: Register in config
Edit `apps/web/src/components/themes/theme.config.ts`:
```typescript
export const THEMES = [
  { name: 'Claude', value: 'claude' },
  { name: 'Default', value: 'default' },
  { name: 'Forest', value: 'forest' },
  { name: 'Your Theme', value: 'your-theme' },  // Add this
];
```

### Step 3: Test
1. Run the app: `./dev.sh up`
2. Open the theme selector dropdown
3. Select your new theme
4. Toggle between light and dark modes
5. Check key pages: Dashboard, Settings, Opportunity details

### Validation Checklist
- [ ] Cards are visually distinct from page background
- [ ] Text is readable on all backgrounds
- [ ] Primary buttons are clearly visible
- [ ] Focus rings are visible when tabbing
- [ ] Destructive buttons look appropriately "dangerous"
- [ ] Dark mode maintains readability
- [ ] Sidebar (if visible) has appropriate contrast

---

## Quick Reference: Color Lightness Scale (OKLCH)

| Use Case | Light Mode L | Dark Mode L |
|----------|--------------|-------------|
| Background | 0.95-0.98 | 0.12-0.18 |
| Card | 0.98-1.0 | 0.18-0.25 |
| Muted | 0.92-0.96 | 0.22-0.30 |
| Border | 0.88-0.92 | 0.25-0.35 |
| Muted foreground | 0.45-0.60 | 0.60-0.75 |
| Foreground | 0.10-0.25 | 0.85-0.98 |
| Primary (brand) | 0.40-0.65 | 0.50-0.70 |

---

## Example: Generating a Theme from Answers

**Given answers:**
- Theme name: `ocean`
- Primary: `#0077b6` (deep ocean blue)
- Secondary: `#90e0ef` (light aqua)
- Accent: `#00b4d8` (bright cyan)
- Background: Cool (blue undertone)
- Format: Hex

**Generated light mode palette:**
```css
[data-theme='ocean'] {
  --background: #f0f7fa;      /* Cool off-white */
  --foreground: #1a2c3d;      /* Dark blue-gray */
  --card: #ffffff;
  --card-foreground: #1a2c3d;
  --primary: #0077b6;
  --primary-foreground: #ffffff;
  --secondary: #caf0f8;
  --secondary-foreground: #0077b6;
  --muted: #e0f2f7;
  --muted-foreground: #4a6572;
  --accent: #00b4d8;
  --accent-foreground: #ffffff;
  --border: #b8d4e3;
  --input: #b8d4e3;
  --ring: #0077b6;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --radius: 0.5rem;
  /* ... sidebar variables ... */
}
```


