# Lighthouse Audit Setup Guide

This guide explains how to set up and run Lighthouse audits for the Ellie marketing site.

## Prerequisites

### 1. Install Lighthouse

```bash
# Global installation (recommended)
npm install -g lighthouse chrome-launcher

# Or use npx (no installation required)
npx lighthouse --help
```

### 2. Install Dependencies for Audit Script

```bash
cd frontend
npm install --save-dev lighthouse chrome-launcher
```

## Running Audits

### Method 1: Using the Automated Script (Recommended)

This method runs both desktop and mobile audits and generates comprehensive reports.

```bash
# 1. Build the production version
cd frontend
npm run build

# 2. Start the preview server (in one terminal)
npm run preview

# 3. Run the audit script (in another terminal)
node lighthouse-audit.js
```

**Output:**
- HTML reports in `frontend/lighthouse-reports/`
- JSON summary with scores and metrics
- Console output with pass/fail indicators

### Method 2: Using Chrome DevTools

This is the easiest method for quick audits during development.

```bash
# 1. Build and start preview
cd frontend
npm run build
npm run preview
```

Then:
1. Open Chrome and navigate to `http://localhost:4173`
2. Open DevTools (F12 or Cmd+Option+I)
3. Click the "Lighthouse" tab
4. Select categories: Performance, Accessibility, Best Practices, SEO
5. Choose device: Desktop or Mobile
6. Click "Analyze page load"

### Method 3: Using CLI

For quick command-line audits:

```bash
# Desktop audit with HTML report
lighthouse http://localhost:4173 --preset=desktop --view

# Mobile audit
lighthouse http://localhost:4173 --view

# Save to file
lighthouse http://localhost:4173 --output=html --output-path=./report.html

# JSON output for CI/CD
lighthouse http://localhost:4173 --output=json --output-path=./report.json
```


## Understanding the Scores

### Performance (Target: 90+)

Measures how fast the page loads and becomes interactive.

**Key Metrics:**
- **First Contentful Paint (FCP)**: When first content appears (< 1.8s)
- **Largest Contentful Paint (LCP)**: When main content loads (< 2.5s)
- **Total Blocking Time (TBT)**: How long page is blocked (< 200ms)
- **Cumulative Layout Shift (CLS)**: Visual stability (< 0.1)
- **Speed Index**: How quickly content is visually displayed (< 3.4s)

### Accessibility (Target: 90+)

Measures how accessible the site is to users with disabilities.

**Key Areas:**
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA attributes
- Semantic HTML

### Best Practices (Target: 90+)

Measures adherence to web development best practices.

**Key Areas:**
- HTTPS usage
- No browser errors
- Secure dependencies
- Modern image formats
- Proper aspect ratios

### SEO (Target: 90+)

Measures search engine optimization.

**Key Areas:**
- Meta tags
- Crawlability
- Mobile-friendly
- Structured data
- Valid HTML

## Interpreting Results

### Score Ranges

- **90-100**: Good (Green) ✅
- **50-89**: Needs Improvement (Orange) ⚠️
- **0-49**: Poor (Red) ❌

### What to Focus On

1. **Red items**: Critical issues that must be fixed
2. **Orange items**: Important improvements
3. **Opportunities**: Suggestions for better performance
4. **Diagnostics**: Additional information about page performance


## Common Issues and Fixes

### Performance Issues

#### Issue: Large JavaScript bundles
**Fix:**
```typescript
// vite.config.ts - Already implemented
rollupOptions: {
  output: {
    manualChunks: {
      'react-vendor': ['react', 'react-dom'],
      'animation': ['framer-motion'],
    },
  },
}
```

#### Issue: Unoptimized images
**Fix:**
- Use WebP format with PNG fallback
- Add width/height attributes
- Implement lazy loading
- Use responsive images with srcset

#### Issue: Render-blocking resources
**Fix:**
- Preload critical resources
- Defer non-critical JavaScript
- Inline critical CSS

### Accessibility Issues

#### Issue: Missing alt text
**Fix:**
```tsx
<img src="logo.png" alt="Ellie Voice Assistant Logo" />
```

#### Issue: Low color contrast
**Fix:**
- Use contrast checker tools
- Ensure 4.5:1 ratio for normal text
- Ensure 3:1 ratio for large text

#### Issue: Missing ARIA labels
**Fix:**
```tsx
<button aria-label="Toggle theme">
  <SunIcon />
</button>
```

### SEO Issues

#### Issue: Missing meta description
**Fix:**
```html
<meta name="description" content="Your description here" />
```

#### Issue: Missing structured data
**Fix:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Ellie"
}
</script>
```


## CI/CD Integration

### GitHub Actions

Create `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:4173
          budgetPath: ./frontend/lighthouse-budget.json
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### Performance Budget Enforcement

The `lighthouse-budget.json` file defines thresholds. If any budget is exceeded, the CI build will fail.

**Current Budgets:**
- Total JavaScript: 300KB
- Total CSS: 50KB
- Total Images: 200KB
- LCP: < 2.5s
- CLS: < 0.1
- TBT: < 200ms

## Best Practices

### Before Running Audits

1. **Clear cache**: Ensure fresh load
2. **Use incognito mode**: Avoid extension interference
3. **Close other tabs**: Reduce resource competition
4. **Disable VPN**: Avoid network throttling
5. **Use production build**: Never audit development builds

### Running Multiple Audits

Run 3-5 audits and average the results for accuracy:

```bash
# Run 5 audits and save results
for i in {1..5}; do
  lighthouse http://localhost:4173 \
    --output=json \
    --output-path=./audit-$i.json
done
```

### Monitoring Over Time

Track scores over time to identify regressions:

```bash
# Save results with timestamp
lighthouse http://localhost:4173 \
  --output=json \
  --output-path=./audit-$(date +%Y%m%d-%H%M%S).json
```

## Troubleshooting

### Issue: "Chrome not found"
**Solution:**
```bash
# Install Chrome/Chromium
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS
brew install --cask google-chrome
```

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process on port 4173
npx kill-port 4173

# Or use different port
vite preview --port 4174
```

### Issue: "Audit failed"
**Solution:**
- Check if preview server is running
- Verify URL is accessible
- Check for JavaScript errors in console
- Ensure production build completed successfully

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Performance Budget Calculator](https://www.performancebudget.io/)

## Next Steps

After running audits:

1. Review the generated reports in `lighthouse-reports/`
2. Document scores in `LIGHTHOUSE_AUDIT_REPORT.md`
3. Create issues for items scoring below 90
4. Implement fixes based on recommendations
5. Re-run audits to verify improvements
6. Set up CI/CD integration for continuous monitoring
