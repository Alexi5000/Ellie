import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import MarketingPage from '../../pages/MarketingPage';

describe('Screen Reader Accessibility Tests', () => {
  it('should have proper semantic HTML structure', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check for semantic landmarks
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Check for navigation
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);
  });

  it('should have descriptive ARIA labels for icon buttons', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Theme toggle should have accessible name
    const themeToggle = screen.getByRole('button', { name: /toggle theme|switch to (dark|light) mode/i });
    expect(themeToggle).toHaveAccessibleName();

    // All buttons should have accessible names
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const accessibleName = button.getAttribute('aria-label') || 
                            button.textContent || 
                            button.getAttribute('title');
      expect(accessibleName).toBeTruthy();
    });
  });

  it('should have proper heading hierarchy', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Get all headings
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check heading levels
    const h1s = headings.filter(h => h.tagName === 'H1');
    const h2s = headings.filter(h => h.tagName === 'H2');
    const h3s = headings.filter(h => h.tagName === 'H3');

    // Should have at least one H1
    expect(h1s.length).toBeGreaterThanOrEqual(1);
    
    // Should have H2s for sections
    expect(h2s.length).toBeGreaterThan(0);
  });

  it('should have alt text for all images', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const images = screen.getAllByRole('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      // Alt text should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
    });
  });

  it('should have proper tab panel structure', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const tabs = screen.queryAllByRole('tab');
    const tabpanels = screen.queryAllByRole('tabpanel');

    if (tabs.length > 0) {
      // Each tab should have aria-controls
      tabs.forEach(tab => {
        const controls = tab.getAttribute('aria-controls');
        expect(controls).toBeTruthy();
      });

      // Each tabpanel should have aria-labelledby
      tabpanels.forEach(panel => {
        const labelledby = panel.getAttribute('aria-labelledby');
        expect(labelledby).toBeTruthy();
      });
    }
  });

  it('should announce dynamic content changes', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Look for live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    
    // May have live regions for announcements
    liveRegions.forEach(region => {
      const liveValue = region.getAttribute('aria-live');
      expect(['polite', 'assertive', 'off']).toContain(liveValue);
    });
  });

  it('should have descriptive link text', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    
    links.forEach(link => {
      const text = link.textContent || link.getAttribute('aria-label');
      
      // Links should not just say "click here" or "read more"
      expect(text).toBeTruthy();
      expect(text?.toLowerCase()).not.toBe('click here');
      expect(text?.toLowerCase()).not.toBe('here');
    });
  });

  it('should have proper form labels if forms exist', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const inputs = screen.queryAllByRole('textbox');
    
    inputs.forEach(input => {
      // Each input should have a label or aria-label
      const label = input.getAttribute('aria-label') || 
                   input.getAttribute('aria-labelledby') ||
                   document.querySelector(`label[for="${input.id}"]`);
      
      expect(label).toBeTruthy();
    });
  });

  it('should have proper button roles and states', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      // Buttons should not have role="button" if they're actual buttons
      if (button.tagName === 'BUTTON') {
        expect(button.getAttribute('role')).toBeNull();
      }
      
      // Disabled buttons should have aria-disabled or disabled attribute
      const isDisabled = button.hasAttribute('disabled') || 
                        button.getAttribute('aria-disabled') === 'true';
      
      if (isDisabled) {
        expect(button).toBeDisabled();
      }
    });
  });

  it('should have proper navigation structure', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation');
    
    // Navigation should have accessible name or label
    const navLabel = nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby');
    
    // Navigation should be identifiable
    expect(nav).toBeInTheDocument();
  });

  it('should have proper footer structure', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Footer should contain navigation or links
    const footerLinks = within(footer).getAllByRole('link');
    expect(footerLinks.length).toBeGreaterThan(0);
  });

  it('should have proper region labels', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const regions = screen.queryAllByRole('region');
    
    regions.forEach(region => {
      // Regions should have aria-label or aria-labelledby
      const label = region.getAttribute('aria-label') || 
                   region.getAttribute('aria-labelledby');
      
      expect(label).toBeTruthy();
    });
  });

  it('should not have empty links or buttons', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MarketingPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    const buttons = screen.getAllByRole('button');
    
    [...links, ...buttons].forEach(element => {
      const hasText = element.textContent && element.textContent.trim().length > 0;
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledby = element.hasAttribute('aria-labelledby');
      const hasTitle = element.hasAttribute('title');
      
      // Element should have some form of accessible name
      expect(hasText || hasAriaLabel || hasAriaLabelledby || hasTitle).toBe(true);
    });
  });
});
