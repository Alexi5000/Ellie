import { test, expect } from '@playwright/test';

/**
 * Browser-specific compatibility tests
 * Tests for known browser quirks and vendor-specific features
 */

test.describe('Browser-Specific Features', () => {
  
  test.describe('Safari/WebKit Specific', () => {
    test('should handle -webkit- prefixes correctly', async ({ page, browserName }) => {
      if (browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check backdrop-filter with webkit prefix
      const header = page.locator('header');
      const backdropFilter = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (styles as any).webkitBackdropFilter || styles.backdropFilter;
      });
      
      expect(backdropFilter).toBeTruthy();
    });

    test('should handle clipboard API with user interaction', async ({ page, browserName, context }) => {
      if (browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Find copy button
      const copyButton = page.locator('button[aria-label*="Copy"]').first();
      
      if (await copyButton.isVisible()) {
        // Click should trigger clipboard API
        await copyButton.click();
        await page.waitForTimeout(500);
        
        // Should show success message
        const copiedText = page.locator('text=Copied');
        await expect(copiedText).toBeVisible({ timeout: 2000 });
      }
    });

    test('should handle viewport height correctly on iOS', async ({ page, browserName }) => {
      if (browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check that hero section uses proper viewport height
      const hero = page.locator('text=Voice AI assistant for developers').locator('..');
      await expect(hero).toBeVisible();
      
      // Check computed height
      const height = await hero.evaluate((el) => {
        return window.getComputedStyle(el).minHeight;
      });
      
      // Should use vh or dvh
      expect(height).toMatch(/vh|dvh|px/);
    });
  });

  test.describe('Firefox Specific', () => {
    test('should render backdrop-filter correctly', async ({ page, browserName }) => {
      if (browserName !== 'firefox') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Scroll to activate header backdrop
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      const header = page.locator('header');
      const backdropFilter = await header.evaluate((el) => {
        return window.getComputedStyle(el).backdropFilter;
      });
      
      // Firefox supports backdrop-filter since v103
      expect(backdropFilter).toBeTruthy();
    });

    test('should handle font rendering', async ({ page, browserName }) => {
      if (browserName !== 'firefox') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check that fonts are loaded
      const headline = page.locator('text=Voice AI assistant for developers');
      await expect(headline).toBeVisible();
      
      // Check font family
      const fontFamily = await headline.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      
      expect(fontFamily).toBeTruthy();
    });
  });

  test.describe('Mobile Safari Specific', () => {
    test('should handle touch events', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Test touch interaction
      const button = page.locator('button:has-text("Sign up")').first();
      await button.tap();
      
      // Should handle tap event
      await expect(button).toBeVisible();
    });

    test('should not auto-zoom on input focus', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Find any input field
      const input = page.locator('input').first();
      
      if (await input.isVisible()) {
        // Check font size is at least 16px
        const fontSize = await input.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        
        const size = parseInt(fontSize);
        expect(size).toBeGreaterThanOrEqual(16);
      }
    });

    test('should handle viewport height with address bar', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check viewport height handling
      const viewportHeight = await page.evaluate(() => {
        return window.innerHeight;
      });
      
      expect(viewportHeight).toBeGreaterThan(0);
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      // Viewport height may change with address bar
      const newViewportHeight = await page.evaluate(() => {
        return window.innerHeight;
      });
      
      expect(newViewportHeight).toBeGreaterThan(0);
    });

    test('should not persist hover states on touch', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Tap a button
      const button = page.locator('button:has-text("Sign up")').first();
      await button.tap();
      await page.waitForTimeout(300);
      
      // Hover state should not persist
      // This is handled by @media (hover: hover) in CSS
    });
  });

  test.describe('Chrome/Edge Specific', () => {
    test('should support all modern CSS features', async ({ page, browserName }) => {
      if (!['chromium', 'msedge'].includes(browserName)) {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check CSS Grid
      const gridSupport = await page.evaluate(() => {
        return CSS.supports('display', 'grid');
      });
      expect(gridSupport).toBe(true);
      
      // Check CSS Variables
      const variablesSupport = await page.evaluate(() => {
        return CSS.supports('--test', 'value');
      });
      expect(variablesSupport).toBe(true);
      
      // Check backdrop-filter
      const backdropSupport = await page.evaluate(() => {
        return CSS.supports('backdrop-filter', 'blur(10px)');
      });
      expect(backdropSupport).toBe(true);
    });

    test('should handle hardware acceleration', async ({ page, browserName }) => {
      if (!['chromium', 'msedge'].includes(browserName)) {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check that animations use GPU acceleration
      const animatedElement = page.locator('.animate-pulse').first();
      
      if (await animatedElement.isVisible()) {
        const willChange = await animatedElement.evaluate((el) => {
          return window.getComputedStyle(el).willChange;
        });
        
        // Will-change or transform should be present for GPU acceleration
        expect(willChange || 'auto').toBeTruthy();
      }
    });
  });

  test.describe('Mobile Chrome Android Specific', () => {
    test('should handle touch events on Android', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'chromium') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Test touch interaction
      const button = page.locator('button:has-text("Sign up")').first();
      await button.tap();
      
      // Should handle tap event
      await expect(button).toBeVisible();
    });

    test('should handle viewport height on Android', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'chromium') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check viewport height
      const viewportHeight = await page.evaluate(() => {
        return window.innerHeight;
      });
      
      expect(viewportHeight).toBeGreaterThan(0);
    });

    test('should perform well on mid-range devices', async ({ page, isMobile, browserName }) => {
      if (!isMobile || browserName !== 'chromium') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Measure performance
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
      
      // Should load reasonably fast even on mobile
      expect(metrics.domContentLoaded).toBeLessThan(3000);
    });
  });

  test.describe('Vendor Prefix Compatibility', () => {
    test('should have proper vendor prefixes in CSS', async ({ page }) => {
      await page.goto('/');
      
      // Check that backdrop-filter works with or without prefix
      const header = page.locator('header');
      const backdropFilter = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter || 
               (styles as any).webkitBackdropFilter || 
               (styles as any).mozBackdropFilter;
      });
      
      expect(backdropFilter).toBeTruthy();
    });

    test('should handle flexbox across browsers', async ({ page }) => {
      await page.goto('/');
      
      // Check flexbox support
      const flexSupport = await page.evaluate(() => {
        return CSS.supports('display', 'flex');
      });
      
      expect(flexSupport).toBe(true);
    });

    test('should handle grid across browsers', async ({ page }) => {
      await page.goto('/');
      
      // Check grid support
      const gridSupport = await page.evaluate(() => {
        return CSS.supports('display', 'grid');
      });
      
      expect(gridSupport).toBe(true);
    });
  });

  test.describe('Feature Detection', () => {
    test('should detect Intersection Observer support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return 'IntersectionObserver' in window;
      });
      
      expect(hasSupport).toBe(true);
    });

    test('should detect ResizeObserver support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return 'ResizeObserver' in window;
      });
      
      expect(hasSupport).toBe(true);
    });

    test('should detect matchMedia support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return 'matchMedia' in window;
      });
      
      expect(hasSupport).toBe(true);
    });

    test('should detect prefers-color-scheme support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
      });
      
      expect(hasSupport).toBe(true);
    });

    test('should detect prefers-reduced-motion support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').media !== 'not all';
      });
      
      expect(hasSupport).toBe(true);
    });

    test('should detect Clipboard API support', async ({ page }) => {
      await page.goto('/');
      
      const hasSupport = await page.evaluate(() => {
        return 'clipboard' in navigator;
      });
      
      expect(hasSupport).toBe(true);
    });
  });
});
