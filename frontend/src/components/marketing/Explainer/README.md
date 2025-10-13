# Explainer Component

The Explainer component displays a three-step process with a headline, designed to quickly communicate how users can get started with the product.

## Features

- **Headline**: Customizable headline text (e.g., "Try in minutes. Deploy in days.")
- **Three-card layout**: Horizontal on desktop, vertical on mobile
- **Staggered animations**: Cards animate in with staggered timing when entering viewport
- **Accessibility**: Respects `prefers-reduced-motion` for users who prefer reduced animations
- **Responsive**: Adapts to different screen sizes with proper spacing and layout
- **Icon support**: Each step can include a custom icon

## Usage

```tsx
import { Explainer } from './components/marketing/Explainer';

// Define your icons (can be SVG, icon components, etc.)
const WorkflowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PlugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function MarketingPage() {
  return (
    <Explainer
      headline="Try in minutes. Deploy in days."
      steps={[
        {
          id: 'choose',
          title: 'Choose your workflow',
          description: 'Select from pre-built templates or create your own custom workflow tailored to your business needs.',
          icon: <WorkflowIcon />
        },
        {
          id: 'plugin',
          title: 'Plug it in',
          description: 'Integrate with your existing systems using our simple API. No complex setup required.',
          icon: <PlugIcon />
        },
        {
          id: 'done',
          title: 'Done',
          description: 'Your AI assistant is ready to handle calls and provide exceptional customer service.',
          icon: <CheckIcon />
        }
      ]}
    />
  );
}
```

## Props

### ExplainerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `headline` | `string` | Yes | - | The main headline text displayed above the steps |
| `steps` | `ExplainerStep[]` | Yes | - | Array of step objects to display |
| `className` | `string` | No | `''` | Additional CSS classes to apply to the section |

### ExplainerStep

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the step |
| `title` | `string` | Yes | The step title |
| `description` | `string` | Yes | Short description (2-3 sentences recommended) |
| `icon` | `React.ReactNode` | Yes | Icon component or element to display |

## Accessibility

- Uses semantic HTML with proper heading hierarchy
- Section has `aria-label="Getting Started"` for screen readers
- Icons are marked with `aria-hidden="true"` as they are decorative
- Respects `prefers-reduced-motion` media query
- Keyboard accessible (no interactive elements, but properly structured for navigation)

## Animation Behavior

- **Default**: Cards animate in with a slide-up effect, staggered by 150ms per card
- **Reduced Motion**: When `prefers-reduced-motion` is enabled, cards appear instantly without animation
- **Trigger**: Animations trigger when the component enters the viewport (using Intersection Observer)
- **Trigger Once**: Animations only play once per page load

## Responsive Behavior

- **Desktop (md+)**: 3-column grid layout
- **Mobile**: Single column, stacked vertically
- **Spacing**: Responsive padding and gaps that adjust based on screen size

## Styling

The component uses Tailwind CSS with theme-aware color tokens:
- `background-secondary`: Card backgrounds
- `border-primary`: Card borders
- `text-primary`: Titles
- `text-secondary`: Descriptions
- `accent-primary`: Icon color

## Requirements Satisfied

This component satisfies the following requirements from the design document:

- **8.1**: Displays headline "Try in minutes. Deploy in days."
- **8.2**: Displays three cards
- **8.3**: Shows "Choose your workflow", "Plug it in", "Done"
- **8.4**: Includes icons for each step
- **8.5**: Includes short descriptive copy (2-3 sentences)
- **8.6**: Horizontal layout on desktop, vertical on mobile
- **8.7**: Staggered entrance animations
- **8.8**: Optional animations (respects prefers-reduced-motion)
- **8.9**: Fallback for prefers-reduced-motion (instant display)
