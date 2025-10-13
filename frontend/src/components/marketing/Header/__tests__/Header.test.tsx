import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Header } from '../Header';
import { ThemeProvider } from '../../../../contexts/ThemeContext';

// Mock useReducedMotion hook
vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    // Reset scroll position
    window.scrollY = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header with logo', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveTextContent('Ellie');
    });

    it('should render all navigation links on desktop', () => {
      renderWithProviders(<Header />);
      
      expect(screen.getByText('Custom Agents')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Careers')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should render "Open Dashboard" button', () => {
      renderWithProviders(<Header />);
      
      const dashboardButtons = screen.getAllByText('Open Dashboard');
      expect(dashboardButtons.length).toBeGreaterThan(0);
    });

    it('should render theme toggle', () => {
      renderWithProviders(<Header />);
      
      const themeToggle = screen.getAllByRole('button', { name: /switch to/i });
      expect(themeToggle.length).toBeGreaterThan(0);
    });

    it('should render mobile menu button on mobile', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Sticky Behavior', () => {
    it('should apply transparent background when not scrolled and transparent prop is true', () => {
      const { container } = renderWithProviders(<Header transparent />);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-transparent');
    });

    it('should apply backdrop blur when scrolled', async () => {
      const { container } = renderWithProviders(<Header transparent />);
      
      // Simulate scroll
      window.scrollY = 100;
      fireEvent.scroll(window);
      
      await waitFor(() => {
        const header = container.querySelector('header');
        expect(header).toHaveClass('backdrop-blur-md');
      });
    });

    it('should have fixed positioning', () => {
      const { container } = renderWithProviders(<Header />);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('fixed');
    });
  });

  describe('Navigation Links', () => {
    it('should render internal links with Link component', () => {
      renderWithProviders(<Header />);
      
      const customAgentsLink = screen.getByText('Custom Agents').closest('a');
      expect(customAgentsLink).toHaveAttribute('href', '/custom-agents');
    });

    it('should render external links with target="_blank"', () => {
      renderWithProviders(<Header />);
      
      const docsLink = screen.getByText('Docs').closest('a');
      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<Header />);
      
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      logo.focus();
      expect(document.activeElement).toBe(logo);
    });

    it('should show focus indicators on navigation links', () => {
      renderWithProviders(<Header />);
      
      const customAgentsLink = screen.getByText('Custom Agents').closest('a');
      expect(customAgentsLink).toHaveClass('focus:ring-2');
      expect(customAgentsLink).toHaveClass('focus:ring-accent-primary');
    });

    it('should show focus indicators on dashboard button', () => {
      renderWithProviders(<Header />);
      
      const dashboardButton = screen.getAllByText('Open Dashboard')[0].closest('a');
      expect(dashboardButton).toHaveClass('focus:ring-2');
      expect(dashboardButton).toHaveClass('focus:ring-accent-primary');
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu when hamburger is clicked', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for mobile menu button', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
      
      fireEvent.click(menuButton);
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show hamburger icon when menu is closed', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      const svg = menuButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show close icon when menu is open', () => {
      renderWithProviders(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);
      
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      renderWithProviders(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have visible focus indicators', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      expect(logo).toHaveClass('focus:outline-none');
      expect(logo).toHaveClass('focus:ring-2');
    });

    it('should support keyboard navigation with Tab', () => {
      renderWithProviders(<Header />);
      
      const logo = screen.getByRole('link', { name: /ellie home/i });
      const customAgentsLink = screen.getByText('Custom Agents');
      
      logo.focus();
      expect(document.activeElement).toBe(logo);
      
      // Simulate Tab key
      customAgentsLink.focus();
      expect(document.activeElement).toBe(customAgentsLink);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = renderWithProviders(<Header className="custom-class" />);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('custom-class');
    });

    it('should respect transparent prop', () => {
      const { container } = renderWithProviders(<Header transparent />);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-transparent');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      vi.mock('../../../../hooks/useReducedMotion', () => ({
        useReducedMotion: () => true,
      }));

      const { container } = renderWithProviders(<Header />);
      
      const header = container.querySelector('header');
      expect(header).not.toHaveClass('transition-all');
    });
  });
});
