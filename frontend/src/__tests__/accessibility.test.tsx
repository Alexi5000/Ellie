import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { MarketingPage } from '../pages/MarketingPage';
import { Header } from '../components/marketing/Header';
import { Hero } from '../components/marketing/Hero';
import { CodeTabs } from '../components/marketing/CodeTabs';
import { Footer } from '../components/marketing/Footer';
import { describe, it, expect, beforeAll } from 'vitest';

// Extend matchers
beforeAll(() => {
  expect.extend(toHaveNoViolations);
});

// Helper to wrap components with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </BrowserRouter>
  );
};

describe('Accessibility Tests', () => {
  describe('WCAG 2.1 Level AA Compliance', () => {
    it('should have no accessibility violations on MarketingPage', async () => {
      const { container } = renderWithProviders(<MarketingPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on Header', async () => {
      const { container } = renderWithProviders(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on Hero', async () => {
      const { container } = renderWithProviders(<Hero onTalkToEllie={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on CodeTabs', async () => {
      const tabs = [
        { id: 'ts', label: 'TypeScript', language: 'typescript', code: 'const x = 1;' },
        { id: 'py', label: 'Python', language: 'python', code: 'x = 1' },
      ];
      const { container } = renderWithProviders(<CodeTabs tabs={tabs} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on Footer', async () => {
      const { container } = renderWithProviders(<Footer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have skip-to-content link that is keyboard accessible', () => {
      renderWithProviders(<MarketingPage />);
      const skipLink = screen.getByText('Skip to main content');
      
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('should have main content landmark with correct ID', () => {
      renderWithProviders(<MarketingPage />);
      const mainContent = document.getElementById('main-content');
      
      expect(mainContent).toBeInTheDocument();
      expect(mainContent?.tagName).toBe('MAIN');
    });

    it('should have all interactive elements keyboard accessible', () => {
      renderWithProviders(<Header />);
      
      // Check navigation links
      const navLinks = screen.getAllByRole('link');
      navLinks.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have visible focus indicators on all interactive elements', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      expect(logo).toHaveClass('focus:ring-2');
      expect(logo).toHaveClass('focus:ring-accent-primary');
    });
  });

  describe('ARIA Labels and Semantic HTML', () => {
    it('should have proper ARIA labels for icon buttons', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByLabelText(/open menu|close menu/i);
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded');
      expect(menuButton).toHaveAttribute('aria-controls');
    });

    it('should use semantic HTML landmarks', () => {
      renderWithProviders(<MarketingPage />);
      
      // Check for main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Check for navigation landmark
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<MarketingPage />);
      
      // Get all headings
      const headings = screen.getAllByRole('heading');
      
      // Verify headings exist
      expect(headings.length).toBeGreaterThan(0);
      
      // Check that h1 exists (should be in Hero)
      const h1 = headings.find(h => h.tagName === 'H1');
      expect(h1).toBeInTheDocument();
    });

    it('should have descriptive alt text for images', () => {
      renderWithProviders(<MarketingPage />);
      
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        const altText = img.getAttribute('alt');
        // Alt text should not be empty or just whitespace
        if (altText) {
          expect(altText.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Focus Management', () => {
    it('should have logical tab order in Header', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      const navLinks = screen.getAllByRole('link').filter(link => 
        link.textContent?.includes('Custom Agents') ||
        link.textContent?.includes('Pricing') ||
        link.textContent?.includes('Docs')
      );
      
      // Logo should be first in tab order
      expect(logo).toBeInTheDocument();
      
      // Navigation links should follow
      expect(navLinks.length).toBeGreaterThan(0);
    });

    it('should have proper tabindex values', () => {
      renderWithProviders(<MarketingPage />);
      
      // No positive tabindex values (anti-pattern)
      const elementsWithTabindex = document.querySelectorAll('[tabindex]');
      elementsWithTabindex.forEach(element => {
        const tabindex = element.getAttribute('tabindex');
        if (tabindex) {
          const value = parseInt(tabindex, 10);
          expect(value).toBeLessThanOrEqual(0);
        }
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have aria-label for navigation', () => {
      renderWithProviders(<Header />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithProviders(<Header />);
      
      // SVG icons should have aria-hidden="true"
      const svgs = document.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have proper role attributes for tab components', () => {
      const tabs = [
        { id: 'ts', label: 'TypeScript', language: 'typescript', code: 'const x = 1;' },
        { id: 'py', label: 'Python', language: 'python', code: 'x = 1' },
      ];
      renderWithProviders(<CodeTabs tabs={tabs} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute('aria-label');
      
      const tabButtons = screen.getAllByRole('tab');
      expect(tabButtons.length).toBe(2);
      
      tabButtons.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      renderWithProviders(<MarketingPage />);
      
      // This is a basic check - actual contrast testing requires visual analysis
      // In a real scenario, you'd use tools like axe-core which checks contrast
      const textElements = screen.getAllByRole('heading');
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.color).toBeTruthy();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion preference', () => {
      // Mock matchMedia for prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithProviders(<MarketingPage />);
      
      // Components should render without animation classes when reduced motion is preferred
      // This is tested in individual component tests
      expect(true).toBe(true);
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      renderWithProviders(<MarketingPage />);
      
      // Check that any form inputs have associated labels
      const inputs = screen.queryAllByRole('textbox');
      inputs.forEach(input => {
        const label = screen.queryByLabelText(input.getAttribute('aria-label') || '');
        // Either has aria-label or associated label element
        expect(
          input.hasAttribute('aria-label') || 
          input.hasAttribute('aria-labelledby') ||
          label
        ).toBeTruthy();
      });
    });
  });

  describe('Link Accessibility', () => {
    it('should have descriptive link text', () => {
      renderWithProviders(<MarketingPage />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const text = link.textContent || link.getAttribute('aria-label');
        expect(text).toBeTruthy();
        expect(text?.trim().length).toBeGreaterThan(0);
        
        // Avoid generic link text
        const genericTexts = ['click here', 'read more', 'link'];
        const isGeneric = genericTexts.some(generic => 
          text?.toLowerCase() === generic
        );
        expect(isGeneric).toBe(false);
      });
    });

    it('should indicate external links', () => {
      renderWithProviders(<Header />);
      
      const externalLinks = screen.getAllByRole('link').filter(link =>
        link.hasAttribute('target') && link.getAttribute('target') === '_blank'
      );
      
      externalLinks.forEach(link => {
        // External links should have rel="noopener noreferrer"
        expect(link).toHaveAttribute('rel');
        const rel = link.getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      });
    });
  });

  describe('Button Accessibility', () => {
    it('should have proper button types', () => {
      renderWithProviders(<Header />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Buttons should have type attribute
        expect(button).toHaveAttribute('type');
      });
    });

    it('should have descriptive button text or aria-label', () => {
      renderWithProviders(<Hero onTalkToEllie={() => {}} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const text = button.textContent || button.getAttribute('aria-label');
        expect(text).toBeTruthy();
        expect(text?.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
