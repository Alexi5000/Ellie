# Pages

This directory contains page-level components for the Ellie Voice Receptionist application.

## MarketingPage

The `MarketingPage` component is the main landing page for the marketing site. It composes all marketing components into a cohesive, performant page layout.

### Features

- **Lazy Loading**: Below-the-fold components are lazy-loaded for optimal performance
- **Semantic HTML**: Uses proper semantic structure with skip-to-content link for accessibility
- **Section IDs**: All sections have IDs for anchor navigation
- **Responsive Design**: Fully responsive layout with proper spacing and breakpoints
- **Alternating Backgrounds**: Visual separation between sections using alternating background colors

### Structure

The MarketingPage includes the following sections in order:

1. **Header** - Sticky navigation (always visible)
2. **Hero** - Main headline, CTAs, and animated orb (above the fold)
3. **Code Examples** - Tabbed code snippets (above the fold)
4. **Logos Strip** - Trusted by section (lazy loaded)
5. **KPI Band** - Statistics with count-up animations (lazy loaded)
6. **Solutions** - Tabbed interface for Inbound/Outbound solutions (lazy loaded)
7. **Explainer** - Three-step process cards (lazy loaded)
8. **Features** - Grid of feature cards (lazy loaded)
9. **Reliability** - Compliance and reliability metrics (lazy loaded)
10. **Footer** - Multi-column footer with links (lazy loaded)

### Usage

```tsx
import { MarketingPage } from './pages';

function App() {
  return <MarketingPage />;
}
```

### Data Sources

The MarketingPage uses data from:

- `src/data/marketingData.tsx` - Logos, KPI stats, solutions, and explainer steps
- `src/components/marketing/Features/FeaturesData.tsx` - Feature cards data
- `src/components/marketing/Reliability/ReliabilityData.tsx` - Reliability metrics
- `src/components/marketing/CodeTabs/codeSnippets.ts` - Code examples

### Customization

To customize the content:

1. **Update data files** - Modify the data files listed above to change content
2. **Adjust spacing** - Modify the `py-*` classes in section elements
3. **Change section order** - Reorder the section components in the JSX
4. **Add/remove sections** - Add or remove section components as needed

### Performance

The page implements several performance optimizations:

- **Code splitting**: Lazy loading for below-the-fold components
- **Suspense boundaries**: Loading states for lazy-loaded components
- **Intersection Observer**: Animations triggered only when sections enter viewport
- **Reduced motion**: Respects `prefers-reduced-motion` user preference

### Accessibility

The page follows accessibility best practices:

- Skip-to-content link for keyboard users
- Semantic HTML structure with proper landmarks
- Section IDs for anchor navigation
- Proper heading hierarchy
- ARIA labels where appropriate
- Keyboard navigation support

### Testing

Integration tests are located in `__tests__/MarketingPage.test.tsx` and cover:

- Component rendering
- Section IDs for navigation
- Spacing and layout
- Background color alternation
- Semantic HTML structure
- Accessibility features

Run tests with:

```bash
npm test -- MarketingPage.test.tsx --run
```
