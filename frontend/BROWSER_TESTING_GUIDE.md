# Browser Testing Guide

## Quick Start

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Running Tests

#### Run all browser tests:
```bash
npm run test:browser
```

#### Run tests for specific browsers:
```bash
# Chrome/Chromium only
npm run test:browser:chromium

# Firefox only
npm run test:browser:firefox

# Safari/WebKit only
npm run test:browser:webkit

# Mobile browsers only
npm run test:browser:mobile
```

#### Debug tests:
```bash
# Run with browser visible
npm run test:browser:headed

# Run in debug mode with Playwright Inspector
npm run test:browser:debug
```

#### View test report:
```bash
npm run test:browser:report
```

## Manual Testing Checklist

### Desktop Testing

#### Chrome (Windows/macOS/Linux)
- [ ] Open http://localhost:4173 in Chrome
- [ ] Test theme toggle
- [ ] Test navigation
- [ ] Test code tabs
- [ ] Test animations
- [ ] Test responsive breakpoints
- [ ] Check DevTools console for errors
- [ ] Test keyboard navigation
- [ ] Test with DevTools Performance tab

#### Edge (Windows/macOS)
- [ ] Open http://localhost:4173 in Edge
- [ ] Verify same functionality as Chrome
- [ ] Check for any Edge-specific issues
- [ ] Test with Edge DevTools

#### Firefox (Windows/macOS/Linux)
- [ ] Open http://localhost:4173 in Firefox
- [ ] Test theme toggle
- [ ] Test backdrop-filter rendering
- [ ] Test font rendering
- [ ] Check for console errors
- [ ] Test with Firefox DevTools

#### Safari (macOS only)
- [ ] Open http://localhost:4173 in Safari
- [ ] Test theme toggle
- [ ] Test -webkit- prefixed features
- [ ] Test clipboard API
- [ ] Check for console errors
- [ ] Test with Safari Web Inspector

### Mobile Testing

#### iOS Safari (iPhone/iPad)
- [ ] Open on iPhone (iOS 14+)
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation
- [ ] Test touch interactions
- [ ] Test mobile menu
- [ ] Test viewport height handling
- [ ] Test with address bar visible/hidden
- [ ] Check for auto-zoom on input focus
- [ ] Test on iPad

#### Chrome Android
- [ ] Open on Android device
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation
- [ ] Test touch interactions
- [ ] Test mobile menu
- [ ] Test viewport height handling
- [ ] Test performance on mid-range device

## Testing Scenarios

### 1. Theme System
- [ ] Toggle between light and dark themes
- [ ] Verify theme persists on page reload
- [ ] Test system preference detection
- [ ] Verify smooth transitions
- [ ] Test with prefers-reduced-motion enabled

### 2. Navigation
- [ ] Verify sticky header on scroll
- [ ] Test backdrop blur effect
- [ ] Test mobile hamburger menu
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify focus indicators are visible
- [ ] Test skip-to-content link

### 3. Hero Section
- [ ] Verify split layout on desktop
- [ ] Verify stacked layout on mobile
- [ ] Test animated orb
- [ ] Test CTA buttons
- [ ] Test "Talk to Ellie" button

### 4. Code Tabs
- [ ] Switch between language tabs
- [ ] Test syntax highlighting
- [ ] Test copy-to-clipboard
- [ ] Test keyboard navigation (arrow keys)
- [ ] Test horizontal scroll on mobile

### 5. Interactive Components
- [ ] Test Solutions tabs
- [ ] Test flow diagrams
- [ ] Test feature card hover effects
- [ ] Test footer links
- [ ] Test all buttons and links

### 6. Animations
- [ ] Test KPI count-up animation
- [ ] Test scroll-triggered animations
- [ ] Test Framer Motion animations
- [ ] Test with prefers-reduced-motion

### 7. Responsive Design
- [ ] Test at 1920px (desktop)
- [ ] Test at 1366px (laptop)
- [ ] Test at 768px (tablet)
- [ ] Test at 375px (mobile)
- [ ] Test orientation changes

### 8. Performance
- [ ] Measure page load time
- [ ] Check for layout shifts
- [ ] Verify lazy loading works
- [ ] Test on slow 3G connection
- [ ] Check Core Web Vitals

### 9. Accessibility
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify focus indicators
- [ ] Check color contrast
- [ ] Test with browser zoom (200%)

## Browser-Specific Issues

### Safari/WebKit

**Issue:** Backdrop filter requires -webkit- prefix
```css
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

**Issue:** Clipboard API requires user interaction
- Ensure copy button is clicked by user
- Implement fallback using document.execCommand

**Issue:** 100vh includes address bar on iOS
```css
min-height: 100vh;
min-height: 100dvh; /* Dynamic viewport height */
```

**Issue:** Font size < 16px causes auto-zoom on iOS
```css
input, textarea, select {
  font-size: 16px;
}
```

### Firefox

**Issue:** Backdrop filter rendering may differ slightly
- Test visually to ensure acceptable appearance
- Consider fallback background color

**Issue:** Scrollbar styling not supported
- Use default scrollbars or JavaScript solution

### Chrome/Edge

**Issue:** None expected (baseline browser)
- Use as reference for other browsers

## Performance Testing

### Lighthouse Audits

Run Lighthouse for each browser:

```bash
# Desktop
lighthouse http://localhost:4173 --preset=desktop --view

# Mobile
lighthouse http://localhost:4173 --view
```

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Core Web Vitals

Monitor these metrics:
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Performance Profiling

1. Open DevTools Performance tab
2. Start recording
3. Interact with the page
4. Stop recording
5. Analyze:
   - Frame rate (should be 60fps)
   - Long tasks (should be minimal)
   - Layout shifts (should be none)

## Accessibility Testing

### Keyboard Navigation

1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test Enter/Space on buttons
4. Test Escape to close modals
5. Test arrow keys in tabs

### Screen Reader Testing

**macOS (VoiceOver):**
```bash
# Enable VoiceOver
Cmd + F5
```

**Windows (NVDA):**
- Download from https://www.nvaccess.org/
- Test with NVDA running

**Test checklist:**
- [ ] Page title announced
- [ ] Headings announced correctly
- [ ] Landmarks announced
- [ ] Button labels clear
- [ ] Link purposes clear
- [ ] Images have alt text
- [ ] Form labels associated

### Color Contrast

Use browser DevTools or online tools:
- Chrome DevTools: Inspect element → Accessibility pane
- Online: https://webaim.org/resources/contrastchecker/

Target: WCAG AA (4.5:1 for normal text, 3:1 for large text)

## Debugging Tips

### Chrome DevTools

```javascript
// Check CSS variable values
getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary')

// Check media query
window.matchMedia('(prefers-color-scheme: dark)').matches

// Check localStorage
localStorage.getItem('ellie-theme')

// Check Intersection Observer
'IntersectionObserver' in window
```

### Firefox DevTools

- Use Responsive Design Mode (Ctrl+Shift+M)
- Use Accessibility Inspector
- Check Console for warnings

### Safari Web Inspector

- Enable Develop menu: Safari → Preferences → Advanced → Show Develop menu
- Use Responsive Design Mode
- Check Console for errors
- Use Timeline for performance

### Mobile Debugging

**iOS Safari:**
1. Enable Web Inspector on iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac
3. Open Safari on Mac → Develop → [Your iPhone] → [Page]

**Chrome Android:**
1. Enable USB debugging on Android
2. Connect to computer
3. Open chrome://inspect in Chrome
4. Click "Inspect" on your device

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Cross-Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:browser
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests fail with "Target closed"
- Increase timeout in playwright.config.ts
- Check if preview server is running

### Tests fail on specific browser
- Install browser: `npx playwright install [browser]`
- Check browser version compatibility

### Clipboard tests fail
- Grant clipboard permissions in test
- Ensure user interaction triggers copy

### Mobile tests fail
- Check viewport configuration
- Verify touch events are used instead of clicks

### Performance tests fail
- Run on production build
- Disable browser extensions
- Check network throttling

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Can I Use](https://caniuse.com/) - Browser compatibility tables
- [MDN Web Docs](https://developer.mozilla.org/) - Web standards documentation
- [WebAIM](https://webaim.org/) - Accessibility resources
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing

## Reporting Issues

When reporting browser-specific issues, include:

1. **Browser and version:** e.g., Safari 17.2 on macOS Sonoma
2. **Device:** e.g., iPhone 14 Pro, MacBook Pro M1
3. **Steps to reproduce:** Clear, numbered steps
4. **Expected behavior:** What should happen
5. **Actual behavior:** What actually happens
6. **Screenshots/videos:** Visual evidence
7. **Console errors:** Any JavaScript errors
8. **Network tab:** Any failed requests

## Sign-off Checklist

Before marking cross-browser testing complete:

- [ ] All automated tests pass on all browsers
- [ ] Manual testing completed on all target browsers
- [ ] Performance metrics meet targets on all browsers
- [ ] Accessibility tests pass on all browsers
- [ ] Known issues documented with workarounds
- [ ] Test results documented in CROSS_BROWSER_TESTING.md
- [ ] Sign-off obtained from QA/stakeholders

---

**Last Updated:** 2025-10-13
