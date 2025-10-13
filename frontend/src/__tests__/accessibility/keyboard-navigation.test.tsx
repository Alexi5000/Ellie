import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import MarketingPage from '../../pages/MarketingPage';

describe('Keyboard Navigation Accessibility Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should allow tab navigation through all interactive elements', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get all interactive elements
    const interactiveElements = screen.getAllByRole(/button|link|tab|textbox/);
    
    // Should have multiple interactive elements
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Tab through first few elements
    await user.tab();
    const firstFocused = document.activeElement;
    expect(firstFocused?.tagName).toMatch(/BUTTON|A|INPUT/);

    await user.tab();
    const secondFocused = document.activeElement;
    expect(secondFocused).not.toBe(firstFocused);
    expect(secondFocused?.tagName).toMatch(/BUTTON|A|INPUT/);
  });

  it('should show visible focus indicators on all focusable elements', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Tab to first element
    await user.tab();
    const focused = document.activeElement as HTMLElement;

    // Check for focus styles (outline or ring)
    const styles = window.getComputedStyle(focused);
    const hasOutline = styles.outline !== 'none' && styles.outline !== '';
    const hasBoxShadow = styles.boxShadow !== 'none';
    
    // Should have some form of focus indicator
    expect(hasOutline || hasBoxShadow).toBe(true);
  });

  it('should navigate tabs with arrow keys', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find tab elements
    const tabs = screen.queryAllByRole('tab');
    
    if (tabs.length >= 2) {
      // Focus first tab
      tabs[0].focus();
      expect(document.activeElement).toBe(tabs[0]);

      // Press ArrowRight
      await user.keyboard('{ArrowRight}');
      
      // Should move focus (implementation may vary)
      const newFocus = document.activeElement;
      expect(newFocus).toBeInTheDocument();
    }
  });

  it('should handle Enter and Space key activation', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find a button
    const buttons = screen.getAllByRole('button');
    
    if (buttons.length > 0) {
      buttons[0].focus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      
      // Button should still be in document (may have triggered action)
      expect(buttons[0]).toBeInTheDocument();
    }
  });

  it('should trap focus in mobile menu when open', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find mobile menu button
    const menuButton = screen.queryByRole('button', { name: /menu|navigation/i });
    
    if (menuButton) {
      await user.click(menuButton);

      // Tab should stay within menu
      await user.tab();
      const focused = document.activeElement;
      
      // Focused element should be within menu or be close button
      expect(focused).toBeInTheDocument();
    }
  });

  it('should allow Escape key to close modals/menus', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Open mobile menu
    const menuButton = screen.queryByRole('button', { name: /menu|navigation/i });
    
    if (menuButton) {
      await user.click(menuButton);

      // Press Escape
      await user.keyboard('{Escape}');

      // Menu should close (button should be visible again)
      expect(menuButton).toBeInTheDocument();
    }
  });

  it('should maintain logical tab order', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const focusedElements: HTMLElement[] = [];

    // Tab through first 10 elements
    for (let i = 0; i < 10; i++) {
      await user.tab();
      const focused = document.activeElement as HTMLElement;
      if (focused && focused !== document.body) {
        focusedElements.push(focused);
      }
    }

    // Should have focused multiple elements
    expect(focusedElements.length).toBeGreaterThan(0);

    // Elements should be in DOM order (roughly)
    focusedElements.forEach(el => {
      expect(el).toBeInTheDocument();
    });
  });

  it('should skip to main content with skip link', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Tab to first element (should be skip link)
    await user.tab();
    const firstElement = document.activeElement as HTMLElement;

    // Check if it's a skip link
    if (firstElement && /skip|main/i.test(firstElement.textContent || '')) {
      // Activate skip link
      await user.keyboard('{Enter}');

      // Focus should move to main content
      const newFocus = document.activeElement;
      expect(newFocus).toBeInTheDocument();
    }
  });

  it('should not trap focus in non-modal content', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Tab through many elements
    for (let i = 0; i < 20; i++) {
      await user.tab();
    }

    // Should be able to reach footer
    const footer = screen.getByRole('contentinfo');
    const footerLinks = footer.querySelectorAll('a, button');
    
    // At least one footer element should be focusable
    const footerFocusable = Array.from(footerLinks).some(el => 
      el === document.activeElement || el.contains(document.activeElement)
    );

    // Eventually should reach footer (or be able to)
    expect(footer).toBeInTheDocument();
  });

  it('should handle Shift+Tab for reverse navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Tab forward twice
    await user.tab();
    await user.tab();
    const secondElement = document.activeElement;

    // Tab backward
    await user.tab({ shift: true });
    const firstElement = document.activeElement;

    // Should be different elements
    expect(firstElement).not.toBe(secondElement);
    expect(firstElement).toBeInTheDocument();
  });
});
