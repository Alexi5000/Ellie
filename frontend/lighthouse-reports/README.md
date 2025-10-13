# Lighthouse Audit Reports

This directory contains Lighthouse audit reports for the Ellie marketing site.

## Directory Structure

```
lighthouse-reports/
├── README.md (this file)
├── desktop-YYYY-MM-DD-HHMMSS.html (Desktop audit HTML report)
├── mobile-YYYY-MM-DD-HHMMSS.html (Mobile audit HTML report)
└── summary-YYYY-MM-DD-HHMMSS.json (JSON summary with scores)
```

## How Reports Are Generated

Reports are automatically generated when you run:

```bash
node lighthouse-audit.js
```

Each audit run creates three files:
1. Desktop HTML report (viewable in browser)
2. Mobile HTML report (viewable in browser)
3. JSON summary (for programmatic access)

## Viewing Reports

### HTML Reports

Simply open the HTML files in your browser:

```bash
# Windows
start lighthouse-reports/desktop-*.html

# macOS
open lighthouse-reports/desktop-*.html

# Linux
xdg-open lighthouse-reports/desktop-*.html
```

### JSON Summary

The JSON summary contains:
- Scores for all four categories (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals metrics (FCP, LCP, CLS, TBT, TTI)
- Timestamp and URL

Example:
```json
{
  "timestamp": "2024-12-10T12:00:00.000Z",
  "url": "http://localhost:4173",
  "desktop": {
    "performance": 95,
    "accessibility": 98,
    "bestPractices": 92,
    "seo": 100,
    "metrics": {
      "fcp": "0.8 s",
      "lcp": "1.2 s",
      "cls": "0.05",
      "tbt": "150 ms",
      "tti": "2.1 s"
    }
  }
}
```

## Report History

Keep reports to track performance over time:

```bash
# List all reports
ls -lt lighthouse-reports/

# Compare scores over time
cat lighthouse-reports/summary-*.json | jq '.desktop.performance'
```

## Cleanup

To remove old reports:

```bash
# Remove reports older than 30 days
find lighthouse-reports/ -name "*.html" -mtime +30 -delete
find lighthouse-reports/ -name "*.json" -mtime +30 -delete
```

## CI/CD Integration

In CI/CD pipelines, reports are uploaded as artifacts:

```yaml
- name: Upload Lighthouse Reports
  uses: actions/upload-artifact@v3
  with:
    name: lighthouse-reports
    path: frontend/lighthouse-reports/
```

## Notes

- Reports are gitignored by default
- Keep at least one report for reference
- Compare reports before and after optimizations
- Focus on trends, not individual scores
