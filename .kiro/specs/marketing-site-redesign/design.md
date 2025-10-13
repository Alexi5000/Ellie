# Design Document

## Overview

This document outlines the technical design for transforming the Ellie Voice Receptionist frontend into a dark, developer-centric marketing website. The design maintains the existing React 18 + TypeScript + Vite + Tailwind stack while introducing modern marketing components, dark theme support, and interactive demonstrations.

The architecture follows a component-based approach with clear separation of concerns, leveraging React hooks for state management, Framer Motion for animations, and Tailwind CSS with CSS variables for theming.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                    (Router & Providers)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Landing │    │Dashboard│    │  Health │
    │  Page   │    │  Page   │    │  Check  │
    └────┬────┘    └─────────┘    └─────────┘
         │
    ┌────▼──────────────────────────────────┐
    │      Marketing Page Components        │
    ├───────────────────────────────────────┤
    │ • Header (sticky navigation)          │
    │ • Hero (split layout + animation)     │
    │ • CodeTabs (syntax highlighting)      │
    │ • LogosStrip (credibility)            │
    │ • KPIBand (animated stats)            │
    │ • Solutions (tabbed content)          │
    │ • Explainer (step cards)              │
    │ • Features (grid layout)              │
    │ • Reliability (proof points)          │
    │ • Footer (multi-column)               │
    └───────────────────────────────────────┘
```

### Theme System Architecture

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
    │ Light Theme:    │
    │ --bg-primary    │
    │ --text-primary  │
    │ --accent        │
    │                 │
    │ Dark Theme:     │
    │ --bg-primary    │
    │ --text-primary  │
    │ --accent        │
    └─────────────────┘
```

## Components and Interfaces

### 1. Theme System

#### ThemeProvider Component

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

// Context provides theme state and controls
// Persists to localStorage as 'ellie-theme'
// Listens to prefers-color-scheme changes
```

#### ThemeToggle Component

```typescript
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

// Renders sun/moon icon button
// Accessible with keyboard navigation
// Shows tooltip on hover
// Respects prefers-reduced-motion
```

### 2. Header Component

#### Header Interface

```typescript
interface HeaderProps {
  transparent?: boolean;
  className?: string;
}

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

// Sticky positioning with backdrop blur
// Responsive hamburger menu on mobile
// Keyboard navigation support
// Focus trap when mobile menu open
```

### 3. Hero Component

#### Hero Interface

```typescript
interface HeroProps {
  onTalkToEllie?: () => void;
}

// Split layout: content left, animation right
// Responsive stacking on mobile
// CTA buttons with clear hierarchy
// Animated orb using Framer Motion
```

#### AnimatedOrb Component

```typescript
interface AnimatedOrbProps {
  isActive?: boolean;
  reducedMotion?: boolean;
}

// Framer Motion spring animations
// Mic-reactive visual feedback
// Fallback to static/minimal animation
// Canvas or SVG-based rendering
```

### 4. CodeTabs Component

#### CodeTabs Interface

```typescript
interface CodeTab {
  id: string;
  label: string;
  language: string;
  code: string;
}

interface CodeTabsProps {
  tabs: CodeTab[];
  defaultTab?: string;
}

// Syntax highlighting with Prism or Shiki
// Copy-to-clipboard functionality
// Keyboard navigation (arrow keys)
// Accessible tab panel pattern
```

### 5. LogosStrip Component

#### LogosStrip Interface

```typescript
interface Logo {
  name: string;
  src: string;
  srcDark?: string; // Optional dark mode version
  alt: string;
  width: number;
  height: number;
}

interface LogosStripProps {
  logos: Logo[];
  className?: string;
}

// Responsive wrapping
// Automatic dark mode logo switching
// Lazy loading for performance
// Hover effects (optional)
```

### 6. KPIBand Component

#### KPIBand Interface

```typescript
interface KPIStat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: 'number' | 'abbreviated'; // e.g., 150M vs 150,000,000
}

interface KPIBandProps {
  stats: KPIStat[];
  animationDuration?: number;
}

// Intersection Observer for trigger
// Count-up animation with easing
// Respects prefers-reduced-motion
// Responsive grid layout
```

### 7. Solutions Component

#### Solutions Interface

```typescript
interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'action' | 'condition' | 'end';
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

interface Solution {
  id: 'inbound' | 'outbound';
  title: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  caseStudyUrl: string;
  tryNowUrl: string;
}

interface SolutionsProps {
  solutions: Solution[];
  defaultSolution?: 'inbound' | 'outbound';
}

// Tabbed interface with smooth transitions
// SVG-based flow diagram
// Responsive diagram scaling
// Accessible tab pattern
```

### 8. Explainer Component

#### Explainer Interface

```typescript
interface ExplainerStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ExplainerProps {
  headline: string;
  steps: ExplainerStep[];
}

// Three-card horizontal layout
// Staggered entrance animations
// Responsive stacking on mobile
// Icon + text composition
```

### 9. Features Component

#### Features Interface

```typescript
interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturesProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
}

// Responsive grid (3 cols → 2 cols → 1 col)
// Consistent card heights
// Hover effects (lift/glow)
// Icon + heading + description layout
```

### 10. Reliability Component

#### Reliability Interface

```typescript
interface ReliabilityMetric {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  disclaimer?: string;
}

interface ReliabilityProps {
  metrics: ReliabilityMetric[];
}

// Horizontal card layout
// Subtle styling (not guarantee-like)
// Icons/badges for visual interest
// Responsive wrapping
```

### 11. Footer Component

#### Footer Interface

```typescript
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  columns: FooterColumn[];
  socialLinks?: SocialLink[];
  copyrightText?: string;
}

// Multi-column layout
// Semantic HTML (<footer>, <nav>)
// Skip-to-content link
// Logical tab order
// Responsive stacking/accordion
```

## Data Models

### Theme Configuration

```typescript
// tailwind.config.js extension
const themeConfig = {
  darkMode: 'class', // Use class strategy
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
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

### CSS Variables

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

### Code Snippets Data

```typescript
const codeSnippets: Record<string, string> = {
  typescript: `import { EllieClient } from '@ellie/sdk';

const client = new EllieClient({
  apiKey: process.env.ELLIE_API_KEY,
});

const call = await client.calls.create({
  assistantId: 'asst_abc123',
  to: '+1234567890',
});

console.log('Call started:', call.id);`,

  python: `from ellie import EllieClient

client = EllieClient(
    api_key=os.environ.get("ELLIE_API_KEY")
)

call = client.calls.create(
    assistant_id="asst_abc123",
    to="+1234567890"
)

print(f"Call started: {call.id}")`,

  curl: `curl https://api.ellie.ai/v1/calls \\
  -H "Authorization: Bearer $ELLIE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assistant_id": "asst_abc123",
    "to": "+1234567890"
  }'`,

  react: `import { useEllie } from '@ellie/react';

function CallButton() {
  const { startCall, isConnected } = useEllie({
    apiKey: process.env.REACT_APP_ELLIE_API_KEY,
  });

  return (
    <button onClick={() => startCall('asst_abc123')}>
      {isConnected ? 'Connected' : 'Start Call'}
    </button>
  );
}`,
};
```

## Error Handling

### Theme System Errors

1. **localStorage unavailable**: Fall back to system preference only
2. **Invalid stored theme**: Reset to system preference
3. **CSS variable not supported**: Provide fallback colors

### Animation Errors

1. **Framer Motion load failure**: Show static version
2. **Intersection Observer unavailable**: Trigger animations immediately
3. **Performance issues**: Reduce animation complexity

### Code Snippet Errors

1. **Clipboard API unavailable**: Show "Copy" text instead of icon
2. **Syntax highlighter load failure**: Show plain text with monospace font
3. **Invalid code format**: Display error message

## Testing Strategy

### Unit Tests

1. **ThemeProvider**
   - Theme toggle functionality
   - localStorage persistence
   - System preference detection
   - CSS class application

2. **Individual Components**
   - Render with different props
   - Keyboard navigation
   - Accessibility attributes
   - Responsive behavior

3. **Hooks**
   - useTheme hook
   - useIntersectionObserver hook
   - useCountUp hook
   - useClipboard hook

### Integration Tests

1. **Theme Switching**
   - Toggle affects all components
   - Persistence across page reloads
   - Respects prefers-color-scheme

2. **Navigation Flow**
   - Header links work correctly
   - Mobile menu opens/closes
   - Focus management

3. **Interactive Elements**
   - Code copy functionality
   - Tab switching
   - Animation triggers

### Accessibility Tests

1. **Keyboard Navigation**
   - All interactive elements reachable
   - Logical tab order
   - Focus indicators visible

2. **Screen Reader**
   - Semantic HTML structure
   - ARIA labels present
   - Announcements appropriate

3. **Color Contrast**
   - WCAG AA compliance in both themes
   - Focus indicators meet contrast requirements

### Performance Tests

1. **Lighthouse Scores**
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+

2. **Core Web Vitals**
   - CLS < 0.1
   - FID < 100ms
   - LCP < 2.5s

3. **Bundle Size**
   - Main bundle < 200KB gzipped
   - Code splitting for routes
   - Lazy loading for animations

## Component File Structure

```
src/
├── components/
│   ├── marketing/
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.test.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── index.ts
│   │   ├── Hero/
│   │   │   ├── Hero.tsx
│   │   │   ├── Hero.test.tsx
│   │   │   ├── AnimatedOrb.tsx
│   │   │   └── index.ts
│   │   ├── CodeTabs/
│   │   │   ├── CodeTabs.tsx
│   │   │   ├── CodeTabs.test.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── index.ts
│   │   ├── LogosStrip/
│   │   │   ├── LogosStrip.tsx
│   │   │   ├── LogosStrip.test.tsx
│   │   │   └── index.ts
│   │   ├── KPIBand/
│   │   │   ├── KPIBand.tsx
│   │   │   ├── KPIBand.test.tsx
│   │   │   ├── KPIStat.tsx
│   │   │   └── index.ts
│   │   ├── Solutions/
│   │   │   ├── Solutions.tsx
│   │   │   ├── Solutions.test.tsx
│   │   │   ├── FlowDiagram.tsx
│   │   │   └── index.ts
│   │   ├── Explainer/
│   │   │   ├── Explainer.tsx
│   │   │   ├── Explainer.test.tsx
│   │   │   ├── StepCard.tsx
│   │   │   └── index.ts
│   │   ├── Features/
│   │   │   ├── Features.tsx
│   │   │   ├── Features.test.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   └── index.ts
│   │   ├── Reliability/
│   │   │   ├── Reliability.tsx
│   │   │   ├── Reliability.test.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── index.ts
│   │   └── Footer/
│   │       ├── Footer.tsx
│   │       ├── Footer.test.tsx
│   │       ├── FooterColumn.tsx
│   │       └── index.ts
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── index.ts
│   └── ... (existing components)
├── hooks/
│   ├── useTheme.ts
│   ├── useIntersectionObserver.ts
│   ├── useCountUp.ts
│   ├── useClipboard.ts
│   ├── useReducedMotion.ts
│   └── ... (existing hooks)
├── pages/
│   ├── MarketingPage.tsx
│   └── ... (existing pages)
└── styles/
    ├── theme.css (CSS variables)
    └── ... (existing styles)
```

## Dependencies

### New Dependencies Required

```json
{
  "dependencies": {
    "framer-motion": "^10.16.0", // Animation library
    "react-syntax-highlighter": "^15.5.0", // Code syntax highlighting
    "@types/react-syntax-highlighter": "^15.5.0"
  }
}
```

### Rationale

- **framer-motion**: Industry-standard animation library with excellent performance and accessibility features
- **react-syntax-highlighter**: Lightweight, well-maintained syntax highlighting with theme support

## Performance Optimizations

### Code Splitting

```typescript
// Lazy load marketing page components
const Hero = lazy(() => import('./components/marketing/Hero'));
const CodeTabs = lazy(() => import('./components/marketing/CodeTabs'));
const Solutions = lazy(() => import('./components/marketing/Solutions'));

// Lazy load Framer Motion
const FramerMotion = lazy(() => import('framer-motion'));
```

### Image Optimization

```typescript
// Use next-gen formats with fallbacks
<picture>
  <source srcSet="logo.webp" type="image/webp" />
  <source srcSet="logo.png" type="image/png" />
  <img src="logo.png" alt="Company Logo" width="120" height="40" />
</picture>
```

### Font Loading

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
```

### CSS Optimization

```css
/* Use contain for isolated components */
.feature-card {
  contain: layout style paint;
}

/* Use will-change sparingly */
.animated-orb {
  will-change: transform;
}
```

## Accessibility Features

### Keyboard Navigation

- All interactive elements accessible via Tab
- Arrow keys for tab navigation
- Escape key closes modals/menus
- Enter/Space activates buttons

### Screen Reader Support

- Semantic HTML landmarks
- ARIA labels for icon buttons
- Live regions for dynamic content
- Skip-to-content link

### Focus Management

- Visible focus indicators (2px outline)
- Focus trap in mobile menu
- Focus restoration after modal close
- Logical tab order

### Motion Preferences

```typescript
// Respect prefers-reduced-motion
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
>
```

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Android: Last 2 versions

## Migration Strategy

### Phase 1: Theme System
1. Add ThemeProvider and CSS variables
2. Update existing components to use theme tokens
3. Add ThemeToggle to header

### Phase 2: Marketing Components
1. Create new marketing components
2. Build MarketingPage layout
3. Integrate with existing routing

### Phase 3: Polish & Optimization
1. Add animations with Framer Motion
2. Optimize performance (lazy loading, code splitting)
3. Accessibility audit and fixes

### Phase 4: Testing & Launch
1. Comprehensive testing (unit, integration, e2e)
2. Lighthouse audits
3. Cross-browser testing
4. Production deployment

## Design Tokens

### Spacing Scale

```javascript
spacing: {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem',  // 96px
}
```

### Typography Scale

```javascript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
}
```

### Border Radius

```javascript
borderRadius: {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
}
```

This design provides a comprehensive blueprint for implementing the marketing site redesign while maintaining code quality, performance, and accessibility standards.
