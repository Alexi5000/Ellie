# Quick Start: Cross-Browser Testing

## 🚀 Quick Setup (First Time Only)

```bash
cd frontend

# Install Playwright browsers
npx playwright install

# This will download Chrome, Firefox, and WebKit browsers
# Takes about 5-10 minutes depending on your connection
```

## ▶️ Run Tests

### Option 1: Run All Browser Tests

```bash
# Build the app
npm run build

# Run all tests (Chrome, Firefox, Safari, Mobile)
npm run test:browser
```

### Option 2: Run Specific Browser Tests

```bash
# Chrome/Edge only
npm run test:browser:chromium

# Firefox only
npm run test:browser:firefox

# Safari only
npm run test:browser:webkit

# Mobile browsers only
npm run test:browser:mobile
```

### Option 3: Debug Tests

```bash
# Run with browser visible (see what's happening)
npm run test:browser:headed

# Run in debug mode with Playwright Inspector
npm run test:browser:debug
```

## 📊 View Results

```bash
# Open HTML report in browser
npm run test:browser:report
```

## 📋 What Gets Tested

✅ **Page Load & Rendering**
- Marketing page loads successfully
- All sections render correctly
- No console errors

✅ **Theme System**
- Light/dark mode toggle
- Theme persistence
- Smooth transitions

✅ **Navigation**
- Sticky header
- Mobile menu
- Keyboard navigation

✅ **Interactive Elements**
- Code tabs
- Copy to clipboard
- All buttons and links

✅ **Responsive Design**
- Desktop (1920px)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px)

✅ **Animations**
- Scroll-triggered animations
- Reduced motion support

✅ **Performance**
- Fast page load
- Lazy loading
- No layout shifts

✅ **Accessibility**
- Keyboard navigation
- Focus indicators
- Screen reader support
- ARIA labels

✅ **Browser-Specific**
- Safari -webkit- prefixes
- Mobile viewport handling
- Touch interactions
- Clipboard API

## 🎯 Expected Results

All tests should **PASS** ✅

If any tests fail:
1. Check the error message in the console
2. Look at the screenshot in `playwright-report/`
3. Run the specific test in debug mode
4. Fix the issue and re-run

## 📱 Manual Testing

For comprehensive testing, also perform manual tests:

### Desktop Browsers
1. Open http://localhost:4173 in:
   - Chrome
   - Edge
   - Firefox
   - Safari (macOS only)

2. Test:
   - Theme toggle
   - Navigation
   - All interactive elements
   - Responsive breakpoints

### Mobile Browsers
1. Open on mobile device or use DevTools device emulation
2. Test:
   - Touch interactions
   - Mobile menu
   - Viewport height
   - Orientation changes

## 🐛 Troubleshooting

### "Target closed" error
```bash
# Increase timeout in playwright.config.ts
# Or check if preview server is running
```

### Tests fail on specific browser
```bash
# Reinstall that browser
npx playwright install chromium  # or firefox, webkit
```

### Clipboard tests fail
```bash
# This is expected in some environments
# Manual testing will verify clipboard works
```

## 📚 Documentation

- **Full Testing Guide:** `BROWSER_TESTING_GUIDE.md`
- **Test Results:** `CROSS_BROWSER_TEST_RESULTS.md`
- **Compatibility Report:** `CROSS_BROWSER_TESTING.md`

## ✅ Checklist

Before marking task complete:

- [ ] Automated tests run successfully
- [ ] Manual testing completed on all browsers
- [ ] Performance metrics meet targets
- [ ] Accessibility verified
- [ ] Issues documented
- [ ] Results recorded in `CROSS_BROWSER_TEST_RESULTS.md`

## 🎉 Success Criteria

✅ All automated tests pass  
✅ Manual testing complete  
✅ No critical issues found  
✅ Performance targets met  
✅ Accessibility compliant  
✅ Documentation updated  

---

**Need Help?** Check `BROWSER_TESTING_GUIDE.md` for detailed instructions.
