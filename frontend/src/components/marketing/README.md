# Marketing Components

This directory contains all marketing-specific components for the Ellie Voice Receptionist marketing website. These components are designed to create a modern, developer-centric marketing experience with dark theme support, accessibility features, and excellent performance.

## Table of Contents

- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Available Components](#available-components)
- [Usage Guidelines](#usage-guidelines)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Testing](#testing)

## Overview

The marketing components follow a consistent design system with:

- **Dark theme support** via CSS variables and Tailwind's dark mode
- **Accessibility-first** approach with WCAG 2.1 Level AA compliance
- **Performance optimized** with lazy loading and code splitting
- **Responsive design** that works across all device sizes
- **Motion preferences** respect for users with `prefers-reduced-motion`

## Component Architecture

All marketing components follow these architectural principles:

### 1. Component Structure

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.test.tsx  # Unit tests
├── SubComponent.tsx        # Sub-components (if needed)
├── README.md              # Component documentation
└── index.ts               # Barrel export
```

### 2. Props Interface

Every component exports a TypeScript interface for its props:

```typescript
export interface ComponentNameProps {
  // Required props first
  data: DataType;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  className?: string;
}
```

### 3. Accessibility Features

All components include:
- Semantic HTML elements
- ARIA labels and roles where appropriate
- Keyboard navigation support
- Focus management
- Screen reader announcements

### 4. Theme Integration

Components use CSS variables for theming:

```tsx
className="bg-background-primary text-text-primary border-border-primary"
```

## Available Components

### Layout Components

#### Header
Sticky navigation header with responsive mobile menu.

```tsx
import { Header } from './components/marketing/Header';

<Header transparent={false} />
```

**Props:**
- `transparent?: boolean` - Use transparent background (default: false)
- `className?: string` - Additional CSS classes

**Features:**
- Sticky positioning with backdrop blur
- Responsive hamburger menu
- Theme toggle integration
- Keyboard navigation

[Full Documentation](./Header/README.md)

---

#### Footer
Multi-column footer with navigation links and social media.

```tsx
import { Footer } from './components/marketing/Footer';

<Footer
  columns={footerColumns}
  socialLinks={socialLinks}
  copyrightText="© 2024 Ellie"
/>
```

**Props:**
- `columns: FooterColumn[]` - Array of footer columns
- `socialLinks?: SocialLink[]` - Social media links
- `copyrightText?: string` - Copyright text

**Features:**
- Multi-column layout
- Semantic HTML
- Responsive stacking
- Skip-to-content link

[Full Documentation](./Footer/README.md)

---

### Content Components

#### Hero
Split-layout hero section with animated orb.

```tsx
import { Hero } from './components/marketing/Hero';

<Hero onTalkToEllie={() => console.log('Talk to Ellie')} />
```

**Props:**
- `onTalkToEllie?: () => void` - Callback for "Talk to Ellie" button

**Features:**
- Two-column responsive layout
- Animated orb with Framer Motion
- Multiple CTA buttons
- Reduced motion support

[Full Documentation](./Hero/README.md)

---

#### CodeTabs
Tabbed code snippets with syntax highlighting.

```tsx
import { CodeTabs } from './components/marketing/CodeTabs';

<CodeTabs
  tabs={[
    { id: 'ts', label: 'TypeScript', language: 'typescript', code: '...' },
    { id: 'py', label: 'Python', language: 'python', code: '...' }
  ]}
  defaultTab="ts"
/>
```

**Props:**
- `tabs: CodeTab[]` - Array of code tabs
- `defaultTab?: string` - Initially active tab ID
- `className?: string` - Additional CSS classes

**Features:**
- Syntax highlighting
- Copy-to-clipboard
- Keyboard navigation (arrow keys)
- Responsive horizontal scroll

[Full Documentation](./CodeTabs/README.md)

---

#### Features
Responsive grid of feature cards.

```tsx
import { Features } from './components/marketing/Features';

<Features
  features={featuresData}
  columns={3}
/>
```

**Props:**
- `features: Feature[]` - Array of features
- `columns?: 2 | 3 | 4` - Number of columns on desktop (default: 3)
- `className?: string` - Additional CSS classes

**Features:**
- Responsive grid layout
- Consistent card heights
- Hover effects
- Staggered animations

[Full Documentation](./Features/README.md)

---

#### KPIBand
Animated statistics band with count-up effect.

```tsx
import { KPIBand } from './components/marketing/KPIBand';

<KPIBand
  stats={[
    { label: 'Calls', value: 150000000, suffix: '+', format: 'abbreviated' },
    { label: 'Assistants', value: 1500000, suffix: '+', format: 'abbreviated' }
  ]}
/>
```

**Props:**
- `stats: KPIStat[]` - Array of statistics
- `animationDuration?: number` - Duration of count-up animation (default: 2000ms)
- `className?: string` - Additional CSS classes

**Features:**
- Count-up animations
- Intersection Observer trigger
- Reduced motion support
- Responsive layout

[Full Documentation](./KPIBand/README.md)

---

#### LogosStrip
Horizontal strip of company/technology logos.

```tsx
import { LogosStrip } from './components/marketing/LogosStrip';

<LogosStrip logos={logosData} />
```

**Props:**
- `logos: Logo[]` - Array of logo objects
- `className?: string` - Additional CSS classes

**Features:**
- Automatic dark mode logo switching
- Responsive wrapping
- Lazy loading
- Hover effects

[Full Documentation](./LogosStrip/README.md)

---

#### Solutions
Tabbed solutions section with flow diagrams.

```tsx
import { Solutions } from './components/marketing/Solutions';

<Solutions
  solutions={solutionsData}
  defaultSolution="inbound"
/>
```

**Props:**
- `solutions: Solution[]` - Array of solutions
- `defaultSolution?: 'inbound' | 'outbound'` - Initially active solution
- `className?: string` - Additional CSS classes

**Features:**
- Tabbed interface
- SVG flow diagrams
- Smooth transitions
- Responsive scaling

[Full Documentation](./Solutions/README.md)

---

#### Explainer
Three-step explainer cards.

```tsx
import { Explainer } from './components/marketing/Explainer';

<Explainer
  headline="Try in minutes. Deploy in days."
  steps={stepsData}
/>
```

**Props:**
- `headline: string` - Section headline
- `steps: ExplainerStep[]` - Array of steps
- `className?: string` - Additional CSS classes

**Features:**
- Horizontal card layout
- Staggered animations
- Responsive stacking
- Icon integration

[Full Documentation](./Explainer/README.md)

---

#### Reliability
Reliability and compliance proof points.

```tsx
import { Reliability } from './components/marketing/Reliability';

<Reliability metrics={metricsData} />
```

**Props:**
- `metrics: ReliabilityMetric[]` - Array of metrics
- `className?: string` - Additional CSS classes

**Features:**
- Horizontal card layout
- Icon/badge integration
- Responsive wrapping
- Subtle styling

[Full Documentation](./Reliability/README.md)

---

## Usage Guidelines

### 1. Importing Components

Always import from the component's index file:

```typescript
// ✅ Good
import { Header } from './components/marketing/Header';

// ❌ Avoid
import { Header } from './components/marketing/Header/Header';
```

### 2. Theme Integration

Use semantic color tokens from the theme system:

```tsx
// ✅ Good - Uses theme variables
className="bg-background-primary text-text-primary"

// ❌ Avoid - Hard-coded colors
className="bg-white text-black dark:bg-slate-900 dark:text-white"
```

### 3. Responsive Design

Use Tailwind's responsive prefixes:

```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### 4. Accessibility

Always include:
- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators

```tsx
<button
  aria-label="Close menu"
  className="focus:outline-none focus:ring-2 focus:ring-accent-primary"
>
  <CloseIcon aria-hidden="true" />
</button>
```

### 5. Motion Preferences

Respect user motion preferences:

```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

## Accessibility

All marketing components meet WCAG 2.1 Level AA standards:

### Keyboard Navigation
- All interactive elements accessible via Tab
- Arrow keys for tab/carousel navigation
- Escape key closes modals/menus
- Enter/Space activates buttons

### Screen Readers
- Semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA labels for icon buttons
- Live regions for dynamic content
- Skip-to-content links

### Focus Management
- Visible focus indicators (2px outline)
- Focus trap in modals/menus
- Logical tab order
- Focus restoration after modal close

### Color Contrast
- WCAG AA compliance in both themes
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Focus indicators meet contrast requirements

### Motion
- Respects `prefers-reduced-motion`
- Provides static alternatives
- Instant transitions when motion disabled

## Performance

### Code Splitting

Marketing components are lazy-loaded:

```typescript
const MarketingPage = lazy(() => import('./pages/MarketingPage'));
```

### Image Optimization

Images include width/height to prevent CLS:

```tsx
<img
  src="logo.png"
  alt="Company Logo"
  width={120}
  height={40}
  loading="lazy"
/>
```

### Animation Performance

Animations use GPU-accelerated properties:

```css
/* ✅ Good - GPU accelerated */
transform: translateX(10px);
opacity: 0.5;

/* ❌ Avoid - Triggers layout */
left: 10px;
width: 100px;
```

### Bundle Size

- Main bundle: < 200KB gzipped
- Framer Motion: Lazy loaded
- Syntax highlighter: Code split

## Testing

### Unit Tests

Each component has comprehensive unit tests:

```bash
npm test -- Header.test.tsx
```

### Integration Tests

Test component interactions:

```bash
npm test -- integration/
```

### Accessibility Tests

Automated accessibility testing:

```bash
npm test -- accessibility/
```

### Visual Regression

Theme switching visual tests:

```bash
npm test -- visual/
```

### Browser Testing

Cross-browser compatibility:

```bash
npm run test:browser
```

## Contributing

When adding new marketing components:

1. Follow the component structure pattern
2. Include TypeScript interfaces
3. Add comprehensive tests
4. Document props and usage
5. Ensure accessibility compliance
6. Respect motion preferences
7. Use theme variables
8. Add to this README

## Related Documentation

- [Theme System Documentation](../theme/README.md)
- [Accessibility Guide](../../../ACCESSIBILITY.md)
- [Performance Guide](../../../PERFORMANCE.md)
- [Testing Guide](../../__tests__/README.md)
- [Style Guide](./STYLE_GUIDE.md)
