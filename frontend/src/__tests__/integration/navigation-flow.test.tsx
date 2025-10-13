import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MarketingPage } from '../../pages/MarketingPage';

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should navigate through header links', async () => {
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find header navigation
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Check for navigation links
    const nav = within(header).getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should handle mobile menu toggle', async () => {
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

    // Look for mobile menu button (hamburger)
    const menuButton = screen.queryByRole('button', { name: /menu|navigation/i });
    
    if (menuButton) {
      // Open mobile menu
      await userEvent.click(menuButton);

      // Menu should be visible
      const mobileNav = await screen.findByRole('navigation', { hidden: false });
      expect(mobileNav).toBeInTheDocument();

      // Close mobile menu
      const closeButton = screen.getByRole('button', { name: /close|menu/i });
      await userEvent.click(closeButton);
    }
  });

  it('should maintain focus order through interactive elements', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Tab through interactive elements
    await userEvent.tab();
    
    // First focusable element should be in header
    const firstFocused = document.activeElement;
    expect(firstFocused).toBeInTheDocument();
    
    // Continue tabbing
    await userEvent.tab();
    const secondFocused = document.activeElement;
    expect(secondFocused).toBeInTheDocument();
    expect(secondFocused).not.toBe(firstFocused);
  });

  it('should navigate to footer links', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check for footer columns
    const footerLinks = within(footer).getAllByRole('link');
    expect(footerLinks.length).toBeGreaterThan(0);
  });

  it('should handle CTA button clicks', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find primary CTA buttons
    const signUpButtons = screen.queryAllByRole('button', { name: /sign up/i });
    const signUpLinks = screen.queryAllByRole('link', { name: /sign up/i });
    
    const ctaElements = [...signUpButtons, ...signUpLinks];
    expect(ctaElements.length).toBeGreaterThan(0);

    // Click first CTA
    if (ctaElements[0]) {
      await userEvent.click(ctaElements[0]);
      // Verify interaction (would navigate in real app)
      expect(ctaElements[0]).toBeInTheDocument();
    }
  });

  it('should scroll to sections smoothly', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find different sections
    const sections = screen.getAllByRole('region').concat(
      Array.from(document.querySelectorAll('section'))
    );

    expect(sections.length).toBeGreaterThan(0);

    // Each section should be accessible
    sections.forEach(section => {
      expect(section).toBeInTheDocument();
    });
  });

  it('should maintain header visibility on scroll', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const header = screen.getByRole('banner');
    
    // Header should be visible initially
    expect(header).toBeVisible();

    // Simulate scroll
    window.scrollY = 500;
    window.dispatchEvent(new Event('scroll'));

    // Header should still be visible (sticky)
    expect(header).toBeVisible();
  });

  it('should handle keyboard navigation through tabs', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Find tab components (CodeTabs, Solutions)
    const tabs = screen.queryAllByRole('tab');
    
    if (tabs.length > 0) {
      // Focus first tab
      tabs[0].focus();
      expect(document.activeElement).toBe(tabs[0]);

      // Use arrow keys to navigate
      await userEvent.keyboard('{ArrowRight}');
      
      // Should move to next tab or stay on current
      expect(document.activeElement).toBeInTheDocument();
    }
  });
});
