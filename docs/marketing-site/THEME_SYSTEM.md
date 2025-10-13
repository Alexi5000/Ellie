# Theme System Documentation

This document provides comprehensive documentation for the Ellie marketing website theme system, including setup, usage, and customization.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Usage](#usage)
- [Customization](#customization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The theme system provides a robust dark/light mode implementation with:

- **Automatic detection** of system color scheme preferences
- **localStorage persistence** of user preferences
- **Smooth transitions** between themes
- **CSS variables** for consistent theming
- **Tailwind integration** for utility classes
- **Accessibility support** including `prefers-reduced-motion`

## Architecture

### Components

The theme system consists of three main parts:

1. **ThemeContext** - React context for theme state management
2. **ThemeProvider** - Provider component that wraps the app
3. **useTheme** - Hook for accessing theme state and controls

```
┌──────────────────────────────────────────┐
│         ThemeProvider Context            │
├──────────────────────────────────────────┤
│ • Detects prefers-color-scheme           │
│ • Manages localStorage persistence       │
│ • Provides theme state & toggle          │
│ • Applies CSS class to <html>           │
└────────────┬─────────────────────────────┘
             │
    ┌────────▼────────┐
    │  CSS Variables  │
    ├─────────────────┤
    │ Light Theme     │
    │ Dark Theme      │
    └─────────────────┘
```

### Files

```
src/
├── contexts/
│   └── ThemeContext.tsx       # Theme context and provider
├── hooks/
│   ├── useTheme.ts            # Hook to access theme
│   └── useReducedMotion.ts    # Hook for motion preferences
├── components/
│   └── theme/
│       ├── ThemeToggle.tsx    # Toggle button component
│       └── index.ts           # Barrel export
└── styles/
    └── theme.css              # CSS variables and transitions
```

## Setup

### 1. Install Dependencies

No additional dependencies required - uses React's built-in Context API.

### 2. Import Theme Styles

In your main entry file (`main.tsx` or `index.tsx`):

```typescript
import './styles/theme.css';
```

### 3. Wrap App with ThemeProvider

```typescript
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### 4. Configure Tailwind

Update `tailwind.config.js`:

```javascript
export default {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        accent: {
          primary: 'var(--color-accent-primary)',
          secondary: 'var(--color-accent-secondary)',
        },
        border: {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
        },
      },
    },
  },
};
```

## Usage

### Using the Theme Hook

```typescript
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { theme, toggleTheme, systemTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>System preference: {systemTheme}</p>
      
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
      
      <button onClick={() => setTheme('dark')}>
        Set Dark Theme
      </button>
    </div>
  );
}
```

### Theme Hook API

```typescript
interface ThemeContextValue {
  // Current active theme
  theme: 'light' | 'dark';
  
  // Toggle between light and dark
  toggleTheme: () => void;
  
  // System color scheme preference
  systemTheme: 'light' | 'dark';
  
  // Set theme explicitly
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### Using ThemeToggle Component

```typescript
import { ThemeToggle } from './components/theme/ThemeToggle';

function Header() {
  return (
    <header>
      <nav>
        {/* Navigation items */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

### ThemeToggle Props

```typescript
interface ThemeToggleProps {
  // Additional CSS classes
  className?: string;
  
  // Show text label alongside icon
  showLabel?: boolean;
}
```

### Using Theme Colors in Components

#### With Tailwind Classes

```tsx
function Card() {
  return (
    <div className="
      bg-background-primary
      text-text-primary
      border border-border-primary
    ">
      <h2 className="text-text-primary">Title</h2>
      <p className="text-text-secondary">Description</p>
    </div>
  );
}
```

#### With CSS Variables

```css
.custom-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.custom-component:hover {
  background-color: var(--color-bg-secondary);
}
```

#### With Inline Styles

```tsx
function CustomComponent() {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
    }}>
      Content
    </div>
  );
}
```

### Respecting Motion Preferences

```typescript
import { useReducedMotion } from './hooks/useReducedMotion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  const transitionClass = prefersReducedMotion 
    ? '' 
    : 'transition-all duration-300';
  
  return (
    <div className={`transform hover:scale-105 ${transitionClass}`}>
      Content
    </div>
  );
}
```

## Customization

### Customizing Colors

Edit `src/styles/theme.css`:

```css
/* Light theme */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #64748b;
  
  --color-accent-primary: #3b82f6;
  --color-accent-secondary: #8b5cf6;
  
  --color-border-primary: #e2e8f0;
  --color-border-secondary: #cbd5e1;
}

/* Dark theme */
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;
  
  --color-accent-primary: #60a5fa;
  --color-accent-secondary: #a78bfa;
  
  --color-border-primary: #334155;
  --color-border-secondary: #475569;
}
```

### Adding New Color Variables

1. Add to `theme.css`:

```css
:root {
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}

.dark {
  --color-success: #34d399;
  --color-error: #f87171;
  --color-warning: #fbbf24;
}
```

2. Add to `tailwind.config.js`:

```javascript
colors: {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
}
```

3. Use in components:

```tsx
<div className="text-success">Success message</div>
<div className="bg-error">Error state</div>
```

### Customizing Transition Duration

Edit `theme.css`:

```css
:root {
  --transition-duration: 0.3s; /* Change to your preference */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration: 0s;
  }
}
```

### Customizing Storage Key

Edit `ThemeContext.tsx`:

```typescript
const THEME_STORAGE_KEY = 'my-app-theme'; // Change this
```

## Best Practices

### 1. Always Use Semantic Tokens

```tsx
// ✅ Good - Uses semantic tokens
<div className="bg-background-primary text-text-primary">

// ❌ Avoid - Hard-coded colors
<div className="bg-white text-black dark:bg-slate-900 dark:text-white">
```

### 2. Respect Motion Preferences

```tsx
// ✅ Good - Respects preferences
const prefersReducedMotion = useReducedMotion();
const duration = prefersReducedMotion ? 0 : 300;

// ❌ Avoid - Ignores preferences
const duration = 300;
```

### 3. Test Both Themes

Always test your components in both light and dark themes:

```bash
# Toggle theme in browser DevTools
document.documentElement.classList.toggle('dark');
```

### 4. Provide Sufficient Contrast

Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### 5. Use ThemeProvider at Root

Only wrap your app once at the root level:

```tsx
// ✅ Good
<ThemeProvider>
  <App />
</ThemeProvider>

// ❌ Avoid - Multiple providers
<ThemeProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</ThemeProvider>
```

### 6. Handle SSR Gracefully

For server-side rendering, provide a default:

```typescript
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  // ... rest of implementation
};
```

## Troubleshooting

### Theme Not Persisting

**Problem**: Theme resets on page reload.

**Solution**: Check localStorage is available:

```typescript
// In browser console
localStorage.getItem('ellie-theme');
```

If null, check browser privacy settings or incognito mode.

### Transitions Not Working

**Problem**: Theme changes instantly without transitions.

**Solution**: Check if `prefers-reduced-motion` is enabled:

```typescript
// In browser console
window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

If true, this is expected behavior for accessibility.

### Colors Not Updating

**Problem**: Some elements don't change color with theme.

**Solution**: Ensure you're using CSS variables:

```css
/* ✅ Good */
color: var(--color-text-primary);

/* ❌ Won't update */
color: #0f172a;
```

### Flash of Wrong Theme

**Problem**: Brief flash of light theme before dark theme loads.

**Solution**: Add inline script in `index.html` before React loads:

```html
<script>
  (function() {
    const theme = localStorage.getItem('ellie-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = theme || systemTheme;
    
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### useTheme Hook Error

**Problem**: "useTheme must be used within a ThemeProvider" error.

**Solution**: Ensure component is wrapped in ThemeProvider:

```tsx
// ✅ Good
<ThemeProvider>
  <ComponentUsingTheme />
</ThemeProvider>

// ❌ Error
<ComponentUsingTheme />
```

### System Theme Not Detected

**Problem**: System theme preference not detected.

**Solution**: Check browser support:

```typescript
// In browser console
window.matchMedia('(prefers-color-scheme: dark)');
```

If undefined, browser doesn't support this feature.

## Advanced Usage

### Custom Theme Toggle

Create your own toggle component:

```typescript
import { useTheme } from './hooks/useTheme';

function CustomToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Programmatic Theme Control

```typescript
import { useTheme } from './hooks/useTheme';

function ThemeController() {
  const { setTheme } = useTheme();
  
  // Set theme based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 18;
    setTheme(isDaytime ? 'light' : 'dark');
  }, [setTheme]);
  
  return null;
}
```

### Theme-Aware Components

```typescript
import { useTheme } from './hooks/useTheme';

function Logo() {
  const { theme } = useTheme();
  
  return (
    <img
      src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
      alt="Logo"
    />
  );
}
```

## API Reference

### ThemeContext

```typescript
export interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### ThemeProvider

```typescript
interface ThemeProviderProps {
  children: ReactNode;
}
```

### useTheme

```typescript
function useTheme(): ThemeContextValue
```

Throws error if used outside ThemeProvider.

### useReducedMotion

```typescript
function useReducedMotion(): boolean
```

Returns true if user prefers reduced motion.

## Related Documentation

- [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md)
- [Component Documentation](./frontend/src/components/marketing/README.md)
- [Accessibility Guide](./frontend/ACCESSIBILITY.md)
