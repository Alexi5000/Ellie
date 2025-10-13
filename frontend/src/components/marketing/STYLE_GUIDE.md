# Marketing Components Style Guide

This style guide defines the design patterns, conventions, and best practices for the Ellie marketing website components.

## Table of Contents

- [Design Principles](#design-principles)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Animations](#animations)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)

## Design Principles

### 1. Developer-Centric
The design should appeal to developers and technical decision-makers with:
- Clean, minimal aesthetics
- Code-forward examples
- Technical credibility
- Professional polish

### 2. Dark-First
While supporting both themes, the dark theme is the primary experience:
- High contrast for readability
- Subtle gradients and glows
- Reduced eye strain
- Modern developer aesthetic

### 3. Performance-Conscious
Every design decision considers performance:
- Minimal animations
- Optimized assets
- Lazy loading
- GPU-accelerated transforms

### 4. Accessible by Default
Accessibility is not an afterthought:
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Motion preferences

## Color System

### Semantic Color Tokens

Use semantic tokens instead of hard-coded colors:

```css
/* ✅ Good - Semantic tokens */
background-color: var(--color-bg-primary);
color: var(--color-text-primary);
border-color: var(--color-border-primary);

/* ❌ Avoid - Hard-coded colors */
background-color: #0f172a;
color: #f8fafc;
```

### Color Palette

#### Light Theme
```css
--color-bg-primary: #ffffff;      /* Main background */
--color-bg-secondary: #f8fafc;    /* Secondary background */
--color-bg-tertiary: #f1f5f9;     /* Tertiary background */

--color-text-primary: #0f172a;    /* Primary text */
--color-text-secondary: #475569;  /* Secondary text */
--color-text-tertiary: #64748b;   /* Tertiary text */

--color-accent-primary: #3b82f6;  /* Primary accent (blue) */
--color-accent-secondary: #8b5cf6; /* Secondary accent (purple) */

--color-border-primary: #e2e8f0;  /* Primary borders */
--color-border-secondary: #cbd5e1; /* Secondary borders */
```

#### Dark Theme
```css
--color-bg-primary: #0f172a;      /* Main background */
--color-bg-secondary: #1e293b;    /* Secondary background */
--color-bg-tertiary: #334155;     /* Tertiary background */

--color-text-primary: #f8fafc;    /* Primary text */
--color-text-secondary: #cbd5e1;  /* Secondary text */
--color-text-tertiary: #94a3b8;   /* Tertiary text */

--color-accent-primary: #60a5fa;  /* Primary accent (blue) */
--color-accent-secondary: #a78bfa; /* Secondary accent (purple) */

--color-border-primary: #334155;  /* Primary borders */
--color-border-secondary: #475569; /* Secondary borders */
```

### Usage Guidelines

#### Backgrounds
- **Primary**: Main page background, cards
- **Secondary**: Hover states, subtle sections
- **Tertiary**: Code blocks, input fields

#### Text
- **Primary**: Headlines, body text
- **Secondary**: Subheadings, labels
- **Tertiary**: Captions, metadata

#### Accents
- **Primary**: CTAs, links, focus states
- **Secondary**: Secondary actions, highlights

#### Borders
- **Primary**: Card borders, dividers
- **Secondary**: Subtle separators

### Tailwind Integration

Use Tailwind classes with theme variables:

```tsx
// Backgrounds
className="bg-background-primary"
className="bg-background-secondary"
className="bg-background-tertiary"

// Text
className="text-text-primary"
className="text-text-secondary"
className="text-text-tertiary"

// Accents
className="text-accent-primary"
className="bg-accent-primary"

// Borders
className="border-border-primary"
className="border-border-secondary"
```

## Typography

### Font Family

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Type Scale

```typescript
fontSize: {
  xs: '0.75rem',      // 12px - Captions, labels
  sm: '0.875rem',     // 14px - Small text
  base: '1rem',       // 16px - Body text
  lg: '1.125rem',     // 18px - Large body
  xl: '1.25rem',      // 20px - Small headings
  '2xl': '1.5rem',    // 24px - Headings
  '3xl': '1.875rem',  // 30px - Large headings
  '4xl': '2.25rem',   // 36px - Hero headings
  '5xl': '3rem',      // 48px - Display text
  '6xl': '3.75rem',   // 60px - Large display
}
```

### Font Weights

```typescript
fontWeight: {
  normal: 400,   // Body text
  medium: 500,   // Emphasis
  semibold: 600, // Subheadings
  bold: 700,     // Headings
}
```

### Line Heights

```typescript
lineHeight: {
  tight: 1.25,   // Headlines
  normal: 1.5,   // Body text
  relaxed: 1.75, // Large text
}
```

### Usage Examples

```tsx
// Hero headline
<h1 className="text-5xl md:text-6xl font-bold text-text-primary leading-tight">
  Voice AI assistant for developers
</h1>

// Section heading
<h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
  Features
</h2>

// Body text
<p className="text-base md:text-lg text-text-secondary leading-relaxed">
  Build voice AI applications in minutes with our developer-friendly API.
</p>

// Caption
<span className="text-sm text-text-tertiary">
  Last updated: January 2024
</span>
```

## Spacing

### Spacing Scale

```typescript
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

### Component Spacing

#### Section Padding
```tsx
// Mobile: py-12 (48px)
// Tablet: py-16 (64px)
// Desktop: py-20 (80px)
<section className="py-12 sm:py-16 md:py-20">
```

#### Container Padding
```tsx
<div className="px-4 sm:px-6 lg:px-8">
```

#### Card Padding
```tsx
<div className="p-6 md:p-8">
```

#### Element Spacing
```tsx
// Tight spacing (related elements)
<div className="space-y-2">

// Normal spacing (sections)
<div className="space-y-4">

// Loose spacing (major sections)
<div className="space-y-8">
```

## Components

### Buttons

#### Primary Button
```tsx
<button className="
  px-6 py-3 rounded-lg
  bg-accent-primary text-white
  hover:bg-accent-primary/90
  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
  transition-all duration-200
  font-medium text-base
">
  Sign Up
</button>
```

#### Secondary Button
```tsx
<button className="
  px-6 py-3 rounded-lg
  bg-background-secondary text-text-primary
  border border-border-primary
  hover:bg-background-tertiary
  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
  transition-all duration-200
  font-medium text-base
">
  Learn More
</button>
```

#### Pill Button
```tsx
<button className="
  px-4 py-2 rounded-full
  bg-accent-primary text-white
  hover:bg-accent-primary/90
  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
  transition-all duration-200
  font-medium text-sm
">
  Open Dashboard
</button>
```

### Cards

#### Feature Card
```tsx
<div className="
  p-6 rounded-xl
  bg-background-secondary
  border border-border-primary
  hover:border-accent-primary/50
  hover:shadow-glow
  transition-all duration-300
  group
">
  <div className="w-12 h-12 mb-4 text-accent-primary">
    {icon}
  </div>
  <h3 className="text-xl font-semibold text-text-primary mb-2">
    {title}
  </h3>
  <p className="text-text-secondary">
    {description}
  </p>
</div>
```

#### Metric Card
```tsx
<div className="
  p-6 rounded-lg
  bg-background-secondary
  border border-border-primary
  text-center
">
  <div className="text-4xl font-bold text-accent-primary mb-2">
    {value}
  </div>
  <div className="text-sm text-text-secondary">
    {label}
  </div>
</div>
```

### Links

```tsx
// Navigation link
<a className="
  text-text-secondary hover:text-text-primary
  transition-colors duration-200
">
  {label}
</a>

// Inline link
<a className="
  text-accent-primary hover:text-accent-primary/80
  underline underline-offset-2
  transition-colors duration-200
">
  {label}
</a>
```

### Inputs

```tsx
<input className="
  w-full px-4 py-2 rounded-lg
  bg-background-tertiary
  border border-border-primary
  text-text-primary
  placeholder:text-text-tertiary
  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent
  transition-all duration-200
" />
```

## Animations

### Principles

1. **Subtle**: Animations should enhance, not distract
2. **Fast**: Keep durations under 300ms for UI feedback
3. **Purposeful**: Every animation should have a reason
4. **Respectful**: Always respect `prefers-reduced-motion`

### Duration Guidelines

```typescript
duration: {
  fast: '150ms',    // Hover states, focus
  normal: '200ms',  // Transitions, fades
  slow: '300ms',    // Complex animations
  slower: '500ms',  // Page transitions
}
```

### Easing Functions

```typescript
easing: {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Common Animations

#### Fade In
```tsx
<div className="animate-fade-in">
  {content}
</div>
```

#### Slide Up
```tsx
<div className="animate-slide-up">
  {content}
</div>
```

#### Hover Lift
```tsx
<div className="transition-transform duration-200 hover:-translate-y-1">
  {content}
</div>
```

#### Glow Effect
```tsx
<div className="transition-shadow duration-300 hover:shadow-glow">
  {content}
</div>
```

### Reduced Motion

Always provide alternatives:

```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.05 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
>
  {content}
</motion.div>
```

## Responsive Design

### Breakpoints

```typescript
screens: {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Mobile-First Approach

Always design for mobile first, then enhance:

```tsx
// ✅ Good - Mobile first
<div className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
">

// ❌ Avoid - Desktop first
<div className="
  grid grid-cols-3
  lg:grid-cols-2
  md:grid-cols-1
">
```

### Common Patterns

#### Container
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

#### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

#### Responsive Text
```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl">
```

#### Responsive Spacing
```tsx
<section className="py-12 sm:py-16 md:py-20">
```

#### Show/Hide
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

## Accessibility

### Focus States

Always provide visible focus indicators:

```tsx
className="
  focus:outline-none
  focus:ring-2
  focus:ring-accent-primary
  focus:ring-offset-2
"
```

### ARIA Labels

Add labels for icon buttons:

```tsx
<button aria-label="Close menu">
  <CloseIcon aria-hidden="true" />
</button>
```

### Semantic HTML

Use appropriate HTML elements:

```tsx
// ✅ Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// ❌ Avoid
<div className="nav">
  <div className="link">About</div>
</div>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {label}
</button>
```

### Color Contrast

Maintain WCAG AA contrast ratios:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

## Best Practices

### Do's ✅

- Use semantic color tokens
- Respect motion preferences
- Provide keyboard navigation
- Include ARIA labels
- Test with screen readers
- Optimize for performance
- Follow mobile-first approach
- Maintain consistent spacing
- Use semantic HTML

### Don'ts ❌

- Hard-code colors
- Ignore accessibility
- Use excessive animations
- Forget focus states
- Skip responsive testing
- Nest components deeply
- Use inline styles
- Ignore TypeScript types
- Skip documentation

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
