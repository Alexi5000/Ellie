# Theme Components

This directory contains theme-related components for the Ellie marketing site redesign.

## Components

### ThemeToggle

A button component that allows users to toggle between light and dark themes.

#### Features

- 🌞 Sun/moon icons for visual feedback
- ⌨️ Full keyboard navigation support
- ♿ WCAG AA compliant accessibility
- 💡 Tooltip for additional context
- 🎨 Respects `prefers-reduced-motion`
- 💾 Persists preference to localStorage
- 🎯 Follows system theme by default

#### Props

```typescript
interface ThemeToggleProps {
  className?: string;  // Additional CSS classes
  showLabel?: boolean; // Show "Light"/"Dark" text label
}
```

#### Usage

```tsx
import { ThemeToggle } from './components/theme';

// Basic usage
<ThemeToggle />

// With label
<ThemeToggle showLabel />

// With custom styling
<ThemeToggle className="shadow-lg" />
```

#### Examples

See `ThemeToggle.example.tsx` for complete usage examples including:
- Basic usage
- With label
- Custom styling
- In header/navigation
- In settings panel
- Responsive layouts

#### Testing

Run tests with:
```bash
npm test -- src/components/theme/__tests__/ThemeToggle.test.tsx
```

All 27 tests passing ✅

#### Accessibility

- **Keyboard Navigation**: Tab, Enter, Space
- **Screen Readers**: Proper ARIA labels
- **Focus Indicators**: 2px visible outline
- **Reduced Motion**: Respects user preferences
- **Color Contrast**: WCAG AA compliant

#### Requirements

This component satisfies the following requirements:
- 1.2: Theme toggle functionality
- 1.3: Smooth transitions
- 1.4: Reduced motion support
- 2.6: Keyboard navigation
- 2.7: Focus indicators
- 2.8: Reduced motion in navigation

## Integration

The ThemeToggle component works with the existing theme system:

1. **ThemeProvider**: Wraps the app in `App.tsx`
2. **useTheme hook**: Provides theme state and controls
3. **useReducedMotion hook**: Detects motion preferences
4. **CSS Variables**: Uses semantic color tokens
5. **Tailwind**: Dark mode with class strategy

## File Structure

```
theme/
├── ThemeToggle.tsx              # Main component
├── ThemeToggle.test.tsx         # Unit tests
├── ThemeToggle.example.tsx      # Usage examples
├── index.ts                     # Exports
├── README.md                    # This file
└── IMPLEMENTATION_SUMMARY.md    # Detailed implementation notes
```

## Next Steps

This component is ready to be integrated into:
- Header component (Task 4)
- Marketing page layout (Task 15)
- Dashboard pages
- Settings panels

## Support

For questions or issues, refer to:
- `IMPLEMENTATION_SUMMARY.md` for detailed implementation notes
- `ThemeToggle.example.tsx` for usage examples
- `ThemeToggle.test.tsx` for test cases
