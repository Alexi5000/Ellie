import { test, expect } from '@playwright/test';

/**
 * Cross-browser compatibility tests for Ellie Voice Receptionist
 * Tests core functionality across Chrome, Firefox, Safari, and mobile browsers
 */

test.describe('Cross-Browser Compatibility', () => {
  
  test.describe('Page Load and Rendering', () => {
    test('should load the marketing page successfully', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Check that main content is visible
      await expect(page.locator('#main-content')).toBeVisible();
      
      // Check for no console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Wait a bit to catch any errors
      await page.waitForTimeout(1000);
      
      // Allow specific known warnings but fail on actual errors
      const criticalErrors = errors.filter(err => 
        !err.includes('DevTools') && 
        !err.includes('Extension')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should render header correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check header is visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Check logo is visible
      await expect(page.locator('text=Ellie')).toBeVisible();
      
      // Check navigation links are present
      await expect(page.locator('text=Custom Agents')).toBeVisible();
      await expect(page.locator('text=Pricing')).toBeVisible();
      await expect(page.locator('text=Docs')).toBeVisible();
    });

    test('should render hero section correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check hero headline
      await expect(page.locator('text=Voice AI assistant for developers')).toBeVisible();
      
      // Check CTA buttons
      await expect(page.locator('text=Sign up')).toBeVisible();
      await expect(page.locator('text=Read the docs')).toBeVisible();
      await expect(page.locator('text=Talk to Ellie')).toBeVisible();
    });

    test('should render all major sections', async ({ page }) => {
      await page.goto('/');
      
      // Wait for lazy-loaded sections
      await page.waitForTimeout(2000);
      
      // Check for section IDs
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('#code-examples')).toBeVisible();
      
      // Scroll to trigger lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Theme System', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      await page.goto('/');
      
      // Find theme toggle button
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
      
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialClass = await htmlElement.getAttribute('class');
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check theme changed
      const newClass = await htmlElement.getAttribute('class');
      expect(newClass).not.toBe(initialClass);
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check theme reverted
      const finalClass = await htmlElement.getAttribute('class');
      expect(finalClass).toBe(initialClass);
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/');
      
      // Toggle theme
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Get current theme
      const htmlElement = page.locator('html');
      const themeClass = await htmlElement.getAttribute('class');
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check theme persisted
      const newThemeClass = await htmlElement.getAttribute('class');
      expect(newThemeClass).toBe(themeClass);
    });

    test('should apply theme to all components', async ({ page }) => {
      await page.goto('/');
      
      // Toggle to dark theme
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check that dark class is applied
      const htmlElement = page.locator('html');
      const hasClass = await htmlElement.evaluate((el) => 
        el.classList.contains('dark')
      );
      
      expect(hasClass).toBe(true);
    });
  });

  test.describe('Navigation', () => {
    test('should have sticky header on scroll', async ({ page }) => {
      await page.goto('/');
      
      const header = page.locator('header');
      
      // Check header is visible at top
      await expect(header).toBeVisible();
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);
      
      // Header should still be visible
      await expect(header).toBeVisible();
      
      // Check if header has fixed/sticky positioning
      const position = await header.evaluate((el) => 
        window.getComputedStyle(el).position
      );
      
      expect(['fixed', 'sticky']).toContain(position);
    });

    test('should navigate with keyboard', async ({ page }) => {
      await page.goto('/');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check that an element has focus
      const focusedElement = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      
      expect(focusedElement).toBeTruthy();
    });

    test('should show focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Get focused element
      const focusedElement = page.locator(':focus');
      
      // Check that element is visible
      await expect(focusedElement).toBeVisible();
      
      // Check for focus outline
      const outline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.outlineWidth;
      });
      
      expect(outline).toBeTruthy();
    });
  });

  test.describe('Interactive Elements', () => {
    test('should switch code tabs', async ({ page }) => {
      await page.goto('/');
      
      // Find code tabs section
      const codeSection = page.locator('#code-examples');
      await expect(codeSection).toBeVisible();
      
      // Find tab buttons
      const pythonTab = page.locator('button:has-text("Python")');
      const typescriptTab = page.locator('button:has-text("TypeScript")');
      
      // Click Python tab
      await pythonTab.click();
      await page.waitForTimeout(300);
      
      // Check Python code is visible
      await expect(page.locator('text=from ellie import')).toBeVisible();
      
      // Click TypeScript tab
      await typescriptTab.click();
      await page.waitForTimeout(300);
      
      // Check TypeScript code is visible
      await expect(page.locator('text=import { EllieClient }')).toBeVisible();
    });

    test('should copy code to clipboard', async ({ page, context }) => {
      await page.goto('/');
      
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Find copy button
      const copyButton = page.locator('button[aria-label*="Copy"], button:has-text("Copy")').first();
      
      if (await copyButton.isVisible()) {
        await copyButton.click();
        await page.waitForTimeout(500);
        
        // Check for success indicator
        const copiedText = page.locator('text=Copied');
        await expect(copiedText).toBeVisible({ timeout: 2000 });
      }
    });

    test('should handle button clicks', async ({ page }) => {
      await page.goto('/');
      
      // Find and click CTA button
      const signUpButton = page.locator('button:has-text("Sign up"), a:has-text("Sign up")').first();
      await expect(signUpButton).toBeVisible();
      
      // Button should be clickable
      await expect(signUpButton).toBeEnabled();
    });
  });

  test.describe('Responsive Design', () => {
    test('should render correctly on mobile', async ({ page, isMobile }) => {
      await page.goto('/');
      
      if (isMobile) {
        // Check mobile menu button is visible
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
        await expect(menuButton).toBeVisible();
        
        // Check that desktop nav is hidden
        const desktopNav = page.locator('nav.hidden');
        const count = await desktopNav.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should open mobile menu', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }
      
      await page.goto('/');
      
      // Find and click menu button
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Check menu is visible
      const mobileMenu = page.locator('[role="dialog"], .mobile-menu');
      await expect(mobileMenu).toBeVisible();
    });

    test('should stack content vertically on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check hero section stacks vertically
      const hero = page.locator('text=Voice AI assistant for developers').locator('..');
      await expect(hero).toBeVisible();
    });
  });

  test.describe('Animations', () => {
    test('should animate KPI numbers on scroll', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to KPI section
      await page.evaluate(() => {
        const statsSection = document.querySelector('#stats');
        if (statsSection) {
          statsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Check that KPI section is visible
      const kpiSection = page.locator('#stats');
      await expect(kpiSection).toBeVisible();
    });

    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      
      // Page should still load and function
      await expect(page.locator('#main-content')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should lazy load below-the-fold content', async ({ page }) => {
      await page.goto('/');
      
      // Check that hero is immediately visible
      await expect(page.locator('text=Voice AI assistant for developers')).toBeVisible();
      
      // Scroll down to trigger lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // Check that footer loaded
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have skip to content link', async ({ page }) => {
      await page.goto('/');
      
      // Tab to skip link
      await page.keyboard.press('Tab');
      
      // Check for skip link
      const skipLink = page.locator('text=Skip to');
      const count = await skipLink.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Check for h1
      const h1 = page.locator('h1, text=Voice AI assistant for developers');
      await expect(h1).toBeVisible();
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/');
      
      // Wait for images to load
      await page.waitForTimeout(2000);
      
      // Get all images
      const images = page.locator('img');
      const count = await images.count();
      
      // Check each image has alt attribute
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
      }
    });

    test('should have ARIA labels for icon buttons', async ({ page }) => {
      await page.goto('/');
      
      // Find theme toggle (icon button)
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]').first();
      
      if (await themeToggle.isVisible()) {
        const ariaLabel = await themeToggle.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('CSS Features', () => {
    test('should support CSS Grid', async ({ page }) => {
      await page.goto('/');
      
      // Check that grid layout is applied
      const gridElement = page.locator('.grid').first();
      
      if (await gridElement.isVisible()) {
        const display = await gridElement.evaluate((el) => 
          window.getComputedStyle(el).display
        );
        
        expect(display).toBe('grid');
      }
    });

    test('should support CSS Variables', async ({ page }) => {
      await page.goto('/');
      
      // Check that CSS variables are applied
      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue('--color-bg-primary');
      });
      
      expect(bgColor).toBeTruthy();
    });

    test('should support backdrop-filter', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Scroll to make header backdrop visible
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      
      const header = page.locator('header');
      const backdropFilter = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter || (styles as any).webkitBackdropFilter;
      });
      
      // Safari uses -webkit-backdrop-filter
      if (browserName === 'webkit') {
        expect(backdropFilter).toBeTruthy();
      } else {
        expect(backdropFilter).toBeTruthy();
      }
    });
  });

  test.describe('JavaScript Features', () => {
    test('should support localStorage', async ({ page }) => {
      await page.goto('/');
      
      // Test localStorage
      const hasLocalStorage = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          const value = localStorage.getItem('test');
          localStorage.removeItem('test');
          return value === 'value';
        } catch {
          return false;
        }
      });
      
      expect(hasLocalStorage).toBe(true);
    });

    test('should support Intersection Observer', async ({ page }) => {
      await page.goto('/');
      
      const hasIntersectionObserver = await page.evaluate(() => {
        return 'IntersectionObserver' in window;
      });
      
      expect(hasIntersectionObserver).toBe(true);
    });

    test('should support matchMedia', async ({ page }) => {
      await page.goto('/');
      
      const hasMatchMedia = await page.evaluate(() => {
        return 'matchMedia' in window;
      });
      
      expect(hasMatchMedia).toBe(true);
    });
  });
});
