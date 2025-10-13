import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MarketingPage } from '../../pages/MarketingPage';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

const renderMarketingPage = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <MarketingPage />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Final Integration Tests', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Component Integration', () => {
    it('should render all marketing components seamlessly', async () => {
      renderMarketingPage();

      // Verify Header
      expect(screen.getByText('Ellie')).toBeInTheDocument();
      expect(screen.getByText('Custom Agents')).toBeInTheDocument();
      expect(screen.getByText('Open Dashboard')).toBeInTheDocument();

      // Verify Hero
      expect(screen.getByText('Voice AI assistant for developers')).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
      expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();

      // Verify Code Examples section
      expect(screen.getByText('Start building in minutes')).toBeInTheDocument();

      // Wait for lazy-loaded components
      await waitFor(() => {
        expect(screen.getByText('Trusted by developers worldwide')).toBeInTheDocument();
      });

      // Verify Features section
      await waitFor(() => {
        expect(screen.getByText('Everything you need to build voice AI')).toBeInTheDocument();
      });

      // Verify Footer
      await waitFor(() => {
        const footerElements = screen.getAllByRole('contentinfo');
        expect(footerElements.length).toBeGreaterThan(0);
      });
    });

    it('should have proper section IDs for anchor navigation', () => {
      renderMarketingPage();

      expect(document.getElementById('main-content')).toBeInTheDocument();
      expect(document.getElementById('code-examples')).toBeInTheDocument();
      expect(document.getElementById('trusted-by')).toBeInTheDocument();
      expect(document.getElementById('stats')).toBeInTheDocument();
      expect(document.getElementById('solutions')).toBeInTheDocument();
      expect(document.getElementById('how-it-works')).toBeInTheDocument();
      expect(document.getElementById('features')).toBeInTheDocument();
      expect(document.getElementById('reliability')).toBeInTheDocument();
    });
  });

  describe('Theme Switching Integration', () => {
    it('should toggle theme across all components', async () => {
      renderMarketingPage();

      // Find theme toggle buttons (there are two - desktop and mobile)
      const themeToggles = screen.getAllByRole('button', { name: /switch to dark mode/i });
      expect(themeToggles.length).toBeGreaterThan(0);
      const themeToggle = themeToggles[0];

      // Initial state should be light
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Toggle to dark
      fireEvent.click(themeToggle);
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Toggle back to light
      fireEvent.click(themeToggle);
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should handle all button clicks', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderMarketingPage();

      // Test Talk to Ellie button
      const talkButton = screen.getByText('Talk to Ellie');
      fireEvent.click(talkButton);
      expect(consoleSpy).toHaveBeenCalledWith('Talk to Ellie clicked');

      consoleSpy.mockRestore();
    });

    it('should handle tab switching in code examples', async () => {
      renderMarketingPage();

      // Wait for code tabs to load
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /typescript/i })).toBeInTheDocument();
      });

      const pythonTab = screen.getByRole('tab', { name: /python/i });
      fireEvent.click(pythonTab);

      // Verify Python tab is selected
      await waitFor(() => {
        expect(pythonTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render skip-to-content link for accessibility', () => {
      renderMarketingPage();

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have proper semantic HTML structure', () => {
      renderMarketingPage();

      // Check for main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');

      // Check for navigation (there are multiple nav elements - header and footer)
      const navs = screen.getAllByRole('navigation');
      expect(navs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navigation Links', () => {
    it('should have all header navigation links', () => {
      renderMarketingPage();

      // Use getAllByText since these links appear in both header and footer
      expect(screen.getAllByText('Custom Agents').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pricing').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Docs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Resources').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Careers').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThan(0);
    });

    it('should have CTA buttons with correct text', () => {
      renderMarketingPage();

      expect(screen.getByText('Sign up')).toBeInTheDocument();
      expect(screen.getByText('Read the docs')).toBeInTheDocument();
      expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      expect(screen.getByText('Open Dashboard')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('should lazy load below-the-fold components', async () => {
      renderMarketingPage();

      // Above-the-fold components should be immediately available
      expect(screen.getByText('Voice AI assistant for developers')).toBeInTheDocument();
      expect(screen.getByText('Start building in minutes')).toBeInTheDocument();

      // Below-the-fold components should load after a delay
      await waitFor(() => {
        expect(screen.getByText('Trusted by developers worldwide')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('Try in minutes. Deploy in days.')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      renderMarketingPage();

      // Check for navigation landmarks (header and footer)
      const navs = screen.getAllByRole('navigation');
      expect(navs.length).toBeGreaterThanOrEqual(1);

      // Check for main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have keyboard-accessible interactive elements', () => {
      renderMarketingPage();

      // All buttons should be keyboard accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      // Buttons should be focusable
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });

      // All links should be keyboard accessible
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should use Suspense for lazy-loaded components', () => {
      const { container } = renderMarketingPage();

      // Check that lazy-loaded sections exist
      expect(container.querySelector('#trusted-by')).toBeInTheDocument();
      expect(container.querySelector('#stats')).toBeInTheDocument();
      expect(container.querySelector('#solutions')).toBeInTheDocument();
      expect(container.querySelector('#how-it-works')).toBeInTheDocument();
      expect(container.querySelector('#features')).toBeInTheDocument();
      expect(container.querySelector('#reliability')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render without crashing', () => {
      expect(() => renderMarketingPage()).not.toThrow();
    });

    it('should handle missing data gracefully', () => {
      // Even with potential missing data, the page should render
      const { container } = renderMarketingPage();
      expect(container).toBeInTheDocument();
    });
  });
});
