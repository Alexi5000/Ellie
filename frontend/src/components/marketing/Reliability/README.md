# Reliability Component

The Reliability component displays proof-point cards showcasing reliability metrics and compliance certifications.

## Features

- **Horizontal Card Layout**: Displays metrics in a responsive grid
- **Informational Styling**: Subtle design that presents metrics as proof points, not guarantees
- **Icons/Badges**: Visual indicators for each metric
- **Responsive Design**: 4 columns on desktop, 2 on tablet, 1 on mobile
- **Animations**: Staggered entrance animations with Intersection Observer
- **Accessibility**: Respects `prefers-reduced-motion` preference

## Usage

### Basic Usage

```tsx
import { Reliability } from './components/marketing/Reliability';
import { reliabilityMetrics } from './components/marketing/Reliability/ReliabilityData';

function App() {
  return <Reliability metrics={reliabilityMetrics} />;
}
```

### Custom Metrics

```tsx
import { Reliability } from './components/marketing/Reliability';

const customMetrics = [
  {
    id: 'uptime',
    label: 'Uptime',
    value: '99.99%',
    icon: <CheckCircleIcon />,
    disclaimer: 'Based on last 12 months',
  },
  {
    id: 'latency',
    label: 'Response Time',
    value: 'Sub-500ms',
    icon: <BoltIcon />,
  },
];

function App() {
  return <Reliability metrics={customMetrics} />;
}
```

## Components

### Reliability

Main container component that displays a grid of metric cards.

**Props:**

- `metrics: ReliabilityMetric[]` - Array of reliability metrics to display
- `className?: string` - Optional additional CSS classes

### MetricCard

Individual metric card component.

**Props:**

- `label: string` - Metric label (e.g., "Uptime")
- `value: string` - Metric value (e.g., "99.99%")
- `icon: React.ReactNode` - Icon/badge to display
- `disclaimer?: string` - Optional disclaimer text
- `index?: number` - Card index for staggered animations
- `isVisible?: boolean` - Whether card is visible (for animations)
- `prefersReducedMotion?: boolean` - Whether to disable animations
- `className?: string` - Optional additional CSS classes

## Data Structure

```typescript
interface ReliabilityMetric {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  disclaimer?: string;
}
```

## Default Metrics

The component includes four default metrics:

1. **99.99% Uptime** - System availability
2. **Sub-500ms Latency** - Response time performance
3. **AI Guardrails** - Built-in safety features
4. **SOC2, HIPAA, PCI Compliant** - Security certifications

## Styling

The component uses Tailwind CSS with semantic color tokens:

- `bg-background-secondary` / `bg-background-tertiary` - Card backgrounds
- `border-border-primary` - Card borders
- `text-text-primary` - Primary text (metric values)
- `text-text-secondary` - Secondary text (labels)
- `text-text-tertiary` - Tertiary text (disclaimers)
- `text-accent-primary` - Icon colors

## Accessibility

- Semantic HTML with `<section>` landmark
- `aria-label` for screen readers
- Respects `prefers-reduced-motion` for animations
- Keyboard accessible (no interactive elements)
- Proper heading hierarchy

## Responsive Behavior

- **Desktop (lg+)**: 4 columns
- **Tablet (sm-lg)**: 2 columns
- **Mobile (<sm)**: 1 column

## Animation

Cards animate in with a fade-up effect when they enter the viewport:

- Uses Intersection Observer for viewport detection
- Staggered timing (100ms delay between cards)
- Disabled when `prefers-reduced-motion` is enabled
- Triggers once (doesn't re-animate on scroll)
