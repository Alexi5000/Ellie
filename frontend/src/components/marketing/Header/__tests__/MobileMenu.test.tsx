import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileMenu } from '../MobileMenu';
import type { NavLink } from '../Header';

// Mock useReducedMotion hook
vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const mockNavigationLinks: NavLink[] = [
  { label: 'Custom Agents', href: '/custom-agents' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs', external: true },
  { label: 'Resources', href: '/resources' },
  { label: 'Careers', href: '/careers' },
  { label: 'Enterprise', href: '/enterprise' },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MobileMenu', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={false}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render all navigation links', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(screen.getByText('Custom Agents')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Careers')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should render dashboard button', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(screen.getByText('Open Dashboard')).toBeInTheDocument();
    });

    it('should render backdrop', () => {
      const { container } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Mobile navigation menu');
      expect(dialog).toHaveAttribute('id', 'mobile-menu');
    });

    it('should have visible focus indicators on links', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const link = screen.getByText('Custom Agents').closest('a');
      expect(link).toHaveClass('focus:ring-2');
      expect(link).toHaveClass('focus:ring-accent-primary');
    });

    it('should render external links with proper attributes', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const docsLink = screen.getByText('Docs').closest('a');
      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Focus Management', () => {
    it('should focus first element when opened', async () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      await waitFor(() => {
        const firstLink = screen.getByText('Custom Agents').closest('a');
        expect(document.activeElement).toBe(firstLink);
      });
    });

    it('should trap focus within menu', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll('a[href], button:not([disabled])');
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should handle Tab key for focus trap', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      
      // Simulate Tab key
      fireEvent.keyDown(dialog, { key: 'Tab' });
      
      // Focus should remain within the menu
      const focusableElements = dialog.querySelectorAll('a[href], button:not([disabled])');
      const focusedElement = document.activeElement;
      const isFocusWithinMenu = Array.from(focusableElements).includes(focusedElement as Element);
      
      expect(isFocusWithinMenu).toBe(true);
    });

    it('should handle Shift+Tab key for reverse focus trap', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      
      // Simulate Shift+Tab key
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
      
      // Focus should remain within the menu
      const focusableElements = dialog.querySelectorAll('a[href], button:not([disabled])');
      const focusedElement = document.activeElement;
      const isFocusWithinMenu = Array.from(focusableElements).includes(focusedElement as Element);
      
      expect(isFocusWithinMenu).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close menu on Escape key', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on other keys', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Click Interactions', () => {
    it('should close menu when backdrop is clicked', () => {
      const { container } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const backdrop = container.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close menu when a link is clicked', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const link = screen.getByText('Custom Agents');
      fireEvent.click(link);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close menu when dashboard button is clicked', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dashboardButton = screen.getByText('Open Dashboard');
      fireEvent.click(dashboardButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body Scroll Lock', () => {
    it('should prevent body scroll when menu is open', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when menu is closed', () => {
      const { rerender } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <BrowserRouter>
          <MobileMenu
            isOpen={false}
            onClose={mockOnClose}
            navigationLinks={mockNavigationLinks}
          />
        </BrowserRouter>
      );
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Animations', () => {
    it('should have animation classes', () => {
      const { container } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('animate-slide-down');
      
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toHaveClass('animate-fade-in');
    });

    it('should respect prefers-reduced-motion', () => {
      vi.mock('../../../../hooks/useReducedMotion', () => ({
        useReducedMotion: () => true,
      }));

      const { container } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveClass('animate-slide-down');
      
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).not.toHaveClass('animate-fade-in');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be hidden on desktop (md breakpoint)', () => {
      const { container } = renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('md:hidden');
      
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toHaveClass('md:hidden');
    });

    it('should have max height for scrolling', () => {
      renderWithRouter(
        <MobileMenu
          isOpen={true}
          onClose={mockOnClose}
          navigationLinks={mockNavigationLinks}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      const content = dialog.querySelector('.max-h-\\[calc\\(100vh-4rem\\)\\]');
      expect(content).toBeInTheDocument();
    });
  });
});
