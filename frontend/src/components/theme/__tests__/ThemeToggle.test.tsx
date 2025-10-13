import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ThemeToggle', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    // Default: light theme, no reduced motion
    window.matchMedia = createMatchMediaMock(false);
    localStorage.clear();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  const renderWithTheme = (props = {}) => {
    return render(
      <ThemeProvider>
        <ThemeToggle {...props} />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    it('should render the toggle button', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should display sun icon in light mode', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      // Sun icon has specific path data
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should display moon icon in dark mode', () => {
      localStorage.setItem('ellie-theme', 'dark');
      renderWithTheme();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      // Moon icon has different path data
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      renderWithTheme({ className: 'custom-class' });
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should show label when showLabel is true', () => {
      renderWithTheme({ showLabel: true });
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should show "Dark" label in dark mode when showLabel is true', () => {
      localStorage.setItem('ellie-theme', 'dark');
      renderWithTheme({ showLabel: true });
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  describe('Theme Toggling', () => {
    it('should toggle theme on click', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      // Initially light mode
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      
      // Click to switch to dark
      await userEvent.click(button);
      
      // Should now be dark mode
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      });
      
      // Click again to switch back to light
      await userEvent.click(button);
      
      // Should be light mode again
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      });
    });

    it('should persist theme to localStorage', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(localStorage.getItem('ellie-theme')).toBe('dark');
      });
    });

    it('should apply dark class to document root', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      await userEvent.tab();
      
      expect(button).toHaveFocus();
    });

    it('should toggle theme on Enter key', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      });
    });

    it('should toggle theme on Space key', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      });
    });

    it('should not toggle on other keys', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      button.focus();
      const initialLabel = button.getAttribute('aria-label');
      
      fireEvent.keyDown(button, { key: 'a' });
      
      expect(button).toHaveAttribute('aria-label', initialLabel);
    });

    it('should display visible focus indicator', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      await userEvent.tab();
      
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-accent-primary');
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip on hover', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('Switch to dark mode');
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(button);
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should show tooltip on focus', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('should hide tooltip on blur', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
      
      fireEvent.blur(button);
      
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should update tooltip text when theme changes', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to dark mode');
      });
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to light mode');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should update ARIA label when theme changes', async () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      });
    });

    it('should have aria-hidden on icons', () => {
      renderWithTheme();
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have button type', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Reduced Motion', () => {
    it('should not apply transition classes when prefers-reduced-motion is enabled', () => {
      // Mock prefers-reduced-motion: reduce
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      renderWithTheme();
      const button = screen.getByRole('button');
      
      // Should not have transition classes
      expect(button.className).not.toContain('transition');
    });

    it('should apply transition classes when prefers-reduced-motion is not enabled', () => {
      renderWithTheme();
      const button = screen.getByRole('button');
      
      // Should have transition classes
      expect(button).toHaveClass('transition-all');
    });

    it('should not animate tooltip when prefers-reduced-motion is enabled', () => {
      // Mock prefers-reduced-motion: reduce
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      renderWithTheme();
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      
      waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.className).not.toContain('animate-fade-in');
      });
    });
  });

  describe('System Theme Detection', () => {
    it('should use system dark theme when no stored preference', () => {
      // Mock prefers-color-scheme: dark
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      renderWithTheme();
      const button = screen.getByRole('button');
      
      // Should be in dark mode
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });
});
