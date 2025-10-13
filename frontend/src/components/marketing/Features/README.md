# Features Component

A responsive grid component that displays feature cards with icons, names, and descriptions. Supports staggered entrance animations and respects user motion preferences.

## Components

### Features

Main container component that displays a responsive grid of feature cards.

**Props:**
- `features: Feature[]` - Array of feature objects to display
- `columns?: 2 | 3 | 4` - Number of columns on desktop (default: 3)
- `className?: string` - Optional additional CSS classes

**Feature Interface:**
```typescript
interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}
```

### FeatureCard

Individual feature card component with icon, name, and description.

**Props:**
- `name: string` - Feature name (displayed as h3)
- `description: string` - Feature description (2-line recommended)
- `icon: React.ReactNode` - Icon component or SVG
- `index?: number` - Card index for stagger animation
- `isVisible?: boolean` - Whether card is visible (for animations)
- `prefersReducedMotion?: boolean` - Disable animations if true
- `className?: string` - Optional additional CSS classes

## Usage

### Basic Example

```tsx
import { Features } from './components/marketing/Features';
import { GlobeIcon, CodeIcon, TestIcon } from './icons';

const features = [
  {
    id: 'multilingual',
    name: 'Multilingual',
    description: 'Support for 40+ languages with native accent detection and real-time translation.',
    icon: <GlobeIcon className="w-12 h-12" />,
  },
  {
    id: 'api-native',
    name: 'API-native',
    description: 'RESTful API with comprehensive SDKs for all major programming languages.',
    icon: <CodeIcon className="w-12 h-12" />,
  },
  {
    id: 'automated-testing',
    name: 'Automated testing',
    description: 'Built-in testing framework to validate your AI assistant before deployment.',
    icon: <TestIcon className="w-12 h-12" />,
  },
];

function App() {
  return <Features features={features} />;
}
```

### Custom Column Layout

```tsx
// 2-column layout
<Features features={features} columns={2} />

// 4-column layout
<Features features={features} columns={4} />
```

### With Custom Styling

```tsx
<Features 
  features={features} 
  className="bg-background-tertiary"
/>
```

## Features

### Responsive Layout
- **Desktop (lg):** 3 columns (default), 2 or 4 columns (configurable)
- **Tablet (md):** 2 columns
- **Mobile:** 1 column (stacked)

### Animations
- Staggered entrance animations (100ms delay per card)
- Hover effects: lift (-translate-y-1) and shadow
- Icon scale on hover (scale-110)
- Glow effect on card hover
- Respects `prefers-reduced-motion` setting

### Accessibility
- Semantic HTML with `<section>` landmark
- Feature names as `<h3>` headings
- Proper ARIA labels
- Keyboard accessible
- High contrast in both light and dark themes

### Styling
- Consistent card heights
- Responsive spacing and gaps
- Dark mode support via CSS variables
- Border and shadow effects
- Smooth transitions

## Styling Classes

The component uses Tailwind CSS with custom CSS variables:

- `bg-background-secondary` / `bg-background-tertiary` - Card backgrounds
- `text-text-primary` - Feature names
- `text-text-secondary` - Descriptions
- `text-accent-primary` - Icons and hover states
- `border-border-primary` - Card borders

## Animation Details

### Entrance Animation
- Uses `animate-fade-in-up` class
- Fades in from opacity 0 to 1
- Translates from 20px below to original position
- Duration: 600ms with ease-out timing
- Stagger delay: 100ms per card

### Hover Effects
- Card lift: -4px translation
- Shadow increase
- Border color change to accent
- Icon scale: 110%
- Glow effect: 5% opacity overlay

## Accessibility Features

1. **Semantic HTML:** Uses `<section>` with `aria-label="Features"`
2. **Heading Hierarchy:** Feature names are `<h3>` elements
3. **Motion Preferences:** Respects `prefers-reduced-motion`
4. **Color Contrast:** WCAG AA compliant in both themes
5. **Keyboard Navigation:** All interactive elements are accessible

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Android: Last 2 versions

## Performance

- Uses Intersection Observer for viewport detection
- Animations only trigger when visible
- CSS transforms for smooth performance
- Minimal re-renders with React.memo potential

## Testing

Comprehensive test coverage includes:
- Component rendering
- Responsive grid layouts
- Animation behavior
- Accessibility features
- Edge cases (empty arrays, single items)
- Custom props and styling

Run tests:
```bash
npm test -- src/components/marketing/Features
```
