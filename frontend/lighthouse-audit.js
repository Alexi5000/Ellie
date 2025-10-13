/**
 * Lighthouse Audit Script
 * Runs comprehensive Lighthouse audits for the marketing site
 * 
 * Usage:
 * 1. Build the production version: npm run build
 * 2. Start preview server: npm run preview
 * 3. Run this script: node lighthouse-audit.js
 * 
 * Requirements:
 * - npm install -g lighthouse
 * - npm install -g chrome-launcher
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const AUDIT_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
  },
};

async function launchChromeAndRunLighthouse(url, config, opts = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  opts.port = chrome.port;
  
  const results = await lighthouse(url, opts, config);
  
  await chrome.kill();
  
  return results;
}

async function runAudits() {
  const url = 'http://localhost:4173'; // Vite preview server default port
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportsDir = path.join(__dirname, 'lighthouse-reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  console.log('🚀 Starting Lighthouse audits...\n');
  
  // Run desktop audit
  console.log('📊 Running desktop audit...');
  const desktopResults = await launchChromeAndRunLighthouse(url, AUDIT_CONFIG);
  const desktopReport = desktopResults.lhr;
  
  // Run mobile audit
  console.log('📱 Running mobile audit...');
  const mobileResults = await launchChromeAndRunLighthouse(url, MOBILE_CONFIG);
  const mobileReport = mobileResults.lhr;
  
  // Save HTML reports
  fs.writeFileSync(
    path.join(reportsDir, `desktop-${timestamp}.html`),
    desktopResults.report
  );
  fs.writeFileSync(
    path.join(reportsDir, `mobile-${timestamp}.html`),
    mobileResults.report
  );

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    url,
    desktop: {
      performance: Math.round(desktopReport.categories.performance.score * 100),
      accessibility: Math.round(desktopReport.categories.accessibility.score * 100),
      bestPractices: Math.round(desktopReport.categories['best-practices'].score * 100),
      seo: Math.round(desktopReport.categories.seo.score * 100),
      metrics: {
        fcp: desktopReport.audits['first-contentful-paint'].displayValue,
        lcp: desktopReport.audits['largest-contentful-paint'].displayValue,
        cls: desktopReport.audits['cumulative-layout-shift'].displayValue,
        tbt: desktopReport.audits['total-blocking-time'].displayValue,
        tti: desktopReport.audits['interactive'].displayValue,
      },
    },
    mobile: {
      performance: Math.round(mobileReport.categories.performance.score * 100),
      accessibility: Math.round(mobileReport.categories.accessibility.score * 100),
      bestPractices: Math.round(mobileReport.categories['best-practices'].score * 100),
      seo: Math.round(mobileReport.categories.seo.score * 100),
      metrics: {
        fcp: mobileReport.audits['first-contentful-paint'].displayValue,
        lcp: mobileReport.audits['largest-contentful-paint'].displayValue,
        cls: mobileReport.audits['cumulative-layout-shift'].displayValue,
        tbt: mobileReport.audits['total-blocking-time'].displayValue,
        tti: mobileReport.audits['interactive'].displayValue,
      },
    },
  };
  
  // Save JSON summary
  fs.writeFileSync(
    path.join(reportsDir, `summary-${timestamp}.json`),
    JSON.stringify(summary, null, 2)
  );

  // Print results to console
  console.log('\n✅ Audit complete!\n');
  console.log('=== DESKTOP RESULTS ===');
  console.log(`Performance:    ${summary.desktop.performance}/100 ${summary.desktop.performance >= 90 ? '✅' : '❌'}`);
  console.log(`Accessibility:  ${summary.desktop.accessibility}/100 ${summary.desktop.accessibility >= 90 ? '✅' : '❌'}`);
  console.log(`Best Practices: ${summary.desktop.bestPractices}/100 ${summary.desktop.bestPractices >= 90 ? '✅' : '❌'}`);
  console.log(`SEO:            ${summary.desktop.seo}/100 ${summary.desktop.seo >= 90 ? '✅' : '❌'}`);
  console.log('\nCore Web Vitals (Desktop):');
  console.log(`  FCP: ${summary.desktop.metrics.fcp}`);
  console.log(`  LCP: ${summary.desktop.metrics.lcp}`);
  console.log(`  CLS: ${summary.desktop.metrics.cls}`);
  console.log(`  TBT: ${summary.desktop.metrics.tbt}`);
  
  console.log('\n=== MOBILE RESULTS ===');
  console.log(`Performance:    ${summary.mobile.performance}/100 ${summary.mobile.performance >= 90 ? '✅' : '❌'}`);
  console.log(`Accessibility:  ${summary.mobile.accessibility}/100 ${summary.mobile.accessibility >= 90 ? '✅' : '❌'}`);
  console.log(`Best Practices: ${summary.mobile.bestPractices}/100 ${summary.mobile.bestPractices >= 90 ? '✅' : '❌'}`);
  console.log(`SEO:            ${summary.mobile.seo}/100 ${summary.mobile.seo >= 90 ? '✅' : '❌'}`);
  console.log('\nCore Web Vitals (Mobile):');
  console.log(`  FCP: ${summary.mobile.metrics.fcp}`);
  console.log(`  LCP: ${summary.mobile.metrics.lcp}`);
  console.log(`  CLS: ${summary.mobile.metrics.cls}`);
  console.log(`  TBT: ${summary.mobile.metrics.tbt}`);
  
  console.log(`\n📄 Reports saved to: ${reportsDir}`);
  
  return summary;
}

// Run audits
runAudits().catch(console.error);
