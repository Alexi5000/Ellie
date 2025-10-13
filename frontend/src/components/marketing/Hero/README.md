# Hero Component

The Hero component is the main above-the-fold section of the marketing page, featuring a split layout with content on the left and an animated orb on the right.

## Features

- **Split Layout**: Two-column layout on desktop (content left, animation right)
- **Responsive Design**: Stacks vertically on mobile devices
- **Multiple CTAs**: Primary, secondary, and prominent call-to-action buttons
- **Animated Orb**: Interactive visual element using Framer Motion
- **Accessibility**: Proper focus states and keyboard navigation

## Usage

```tsx
import { Hero } from './components/marketing/Hero';

function MarketingPage() {
  const handleTalkToEllie = () => {
    // Implement voice interaction demo
    console.log('Starting voice interaction...');
  };

  return <Hero onTalkToEllie={handleTalkToEllie} />;
}
```

## Props

### HeroProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onTalkToEllie` | `() => void` | No | `undefined` | Callback function when "Talk to Ellie" button is clicked |

## Structure

The Hero component includes:

1. **Headline**: "Voice AI assistant for developers"
2. **Value Proposition**: Supporting text explaining the product
3. **Primary CTA**: "Sign up" button (navigates to `/signup`)
4. **Secondary CTA**: "Read the docs" button (navigates to `/docs`)
5. **Prominent CTA**: "Talk to Ellie" button (triggers voice demo)
6. **Animated Orb**: Visual element on the right side

## Layout

### Desktop (lg breakpoint and above)
- Two-column grid layout
- Content on the left (60% width)
- Animated orb on the right (40% width)

### Mobile (below lg breakpoint)
- Single column, stacked vertically
- Content appears first
- Animated orb appears below

## Styling

The component uses Tailwind CSS with semantic color tokens:

- **Background**: Uses page background color
- **Text**: Primary and secondary text colors
- **Buttons**: Accent colors with hover states
- **Spacing**: Responsive padding and gaps

## Accessibility

- **Semantic HTML**: Uses `<section>` with ID for anchor navigation
- **Focus States**: Visible focus indicators on all interactive elements
- **Keyboard Navigation**: All buttons are keyboard accessible
- **Focus Ring**: 2px ring with offset for clear visibility

## Related Components

- **AnimatedOrb**: The animated visual element displayed on the right side
- **MarketingPage**: Parent component that includes the Hero

## Testing

Tests are located in `__tests__/Hero.test.tsx` and cover:

- Rendering of headline and text
- Presence of all CTA buttons
- AnimatedOrb integration
- Click handler functionality
- Section structure and ID
- Responsive layout classes
- Accessibility attributes

Run tests with:

```bash
npm test -- Hero.test.tsx --run
```

## Customization

To customize the Hero component:

1. **Change headline**: Modify the `<h1>` text
2. **Update value proposition**: Edit the `<p>` text
3. **Adjust button text**: Change button labels
4. **Modify button actions**: Update `onClick` handlers or `href` attributes
5. **Change layout**: Adjust grid column classes
6. **Update spacing**: Modify padding and gap classes

## Example

```tsx
import { Hero } from './components/marketing/Hero';

function App() {
  const handleVoiceDemo = () => {
    // Start voice interaction
    startVoiceCall();
  };

  return (
    <div>
      <Hero onTalkToEllie={handleVoiceDemo} />
    </div>
  );
}
```
