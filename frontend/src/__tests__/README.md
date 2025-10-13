# Marketing Site Test Suite

This directory contains comprehensive tests for the marketing site redesign, organized by test type.

## Test Structure

### Integration Tests (`integration/`)
Tests that verify multiple components working together:
- **theme-switching.test.tsx**: Theme persistence, system preferences, and theme transitions
- **navigation-flow.test.tsx**: Header navigation, mobile menu, focus management, and routing
- **interactive-elements.test.tsx**: Code copying, tab switching, animations, and user interactions

### Accessibility Tests (`accessibility/`)
Tests that ensure WCAG 2.1 Level AA compliance:
- **keyboard-navigation.test.tsx**: Tab navigation, arrow keys, focus indicators, and focus trapping
- **screen-reader.test.tsx**: Semantic HTML, ARIA labels, heading hierarchy, and announcements
- **color-contrast.test.tsx**: Text contrast ratios, button contrast, and theme-specific contrast

### Visual Regression Tests (`visual/`)
Tests that verify visual consistency across themes:
- **theme-visual-regression.test.tsx**: Layout stability, CSS variables, and component rendering

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test suite
```bash
npm test -- integration/theme-switching.test.tsx
npm test -- accessibility/
npm test -- visual/
```

### Run tests in watch mode
```bash
npm test:watch
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage for all marketing components
- **Integration Tests**: Cover all major user flows
- **Accessibility Tests**: 100% WCAG 2.1 Level AA compliance
- **Visual Regression**: Verify theme consistency

## Test Requirements

All tests follow these principles:
1. **Isolation**: Each test is independent and can run in any order
2. **Clarity**: Test names clearly describe what is being tested
3. **Completeness**: Tests cover happy paths, edge cases, and error states
4. **Accessibility**: All tests consider accessibility requirements
5. **Performance**: Tests run quickly and efficiently

## Accessibility Standards

Tests verify compliance with:
- WCAG 2.1 Level AA
- Keyboard navigation (Tab, Arrow keys, Enter, Space, Escape)
- Screen reader compatibility (ARIA labels, semantic HTML)
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Focus indicators (2px minimum, visible in all themes)

## Integration Test Scenarios

1. **Theme Switching**
   - Toggle between light and dark modes
   - Persist theme preference
   - Respect system preferences
   - Smooth transitions

2. **Navigation Flow**
   - Header navigation links
   - Mobile menu toggle
   - Footer links
   - CTA buttons
   - Scroll behavior

3. **Interactive Elements**
   - Code snippet copying
   - Tab switching (CodeTabs, Solutions)
   - KPI animations
   - Button interactions
   - Form inputs

## Accessibility Test Scenarios

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Arrow key navigation in tabs
   - Enter/Space activation
   - Escape to close modals
   - Focus trap in mobile menu
   - Skip to main content

2. **Screen Reader**
   - Semantic landmarks (header, nav, main, footer)
   - ARIA labels for icon buttons
   - Heading hierarchy (H1, H2, H3)
   - Alt text for images
   - Tab panel structure
   - Descriptive link text

3. **Color Contrast**
   - Body text contrast (4.5:1 minimum)
   - Button contrast
   - Link contrast
   - Focus indicator contrast (3:1 minimum)
   - Hover state contrast
   - Disabled state contrast

## Visual Regression Test Scenarios

1. **Theme Consistency**
   - Light mode rendering
   - Dark mode rendering
   - Layout stability during transitions
   - CSS variable application
   - Component visibility
   - Image rendering

## Continuous Integration

Tests are run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

## Troubleshooting

### Tests failing due to timing issues
- Increase `waitFor` timeout
- Use `findBy` queries instead of `getBy`
- Add explicit waits for animations

### Tests failing due to DOM cleanup
- Ensure `beforeEach` clears state
- Use `cleanup()` from @testing-library/react
- Check for memory leaks

### Tests failing in CI but passing locally
- Check for environment-specific issues
- Verify Node version compatibility
- Review CI logs for specific errors

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Add tests to appropriate directory (integration, accessibility, visual)
3. Update this README with new test scenarios
4. Ensure tests pass locally before committing
5. Maintain or improve code coverage
