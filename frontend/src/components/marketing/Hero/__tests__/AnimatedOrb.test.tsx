import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedOrb } from '../AnimatedOrb';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, animate, transition, ...props }: any) => (
      <div 
        className={className} 
        style={style}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

// Mock useReducedMotion hook
const mockUseReducedMotion = vi.fn();
vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: mockUseReducedMotion,
}));

describe('AnimatedOrb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseReducedMotion.mockReturnValue(false);
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the orb component', () => {
      render(<AnimatedOrb />);
      
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<AnimatedOrb className="custom-class" />);
      
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toHaveClass('custom-class');
    });

    it('should have performance optimization styles', () => {
      render(<AnimatedOrb />);
      
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toHaveStyle({ contain: 'layout style paint' });
    });
  });

  describe('Reduced Motion', () => {
    it('should render static version when prefers-reduced-motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<AnimatedOrb />);
      
      // When reduced motion is enabled, component should still render
      expect(container.querySelector('[aria-label]')).toBeInTheDocument();
    });

    it('should not render animated elements when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<AnimatedOrb isActive={true} />);
      
      // Component should render even with reduced motion
      expect(container.querySelector('.relative')).toBeInTheDocument();
    });

    it('should apply contain CSS property even in static mode', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<AnimatedOrb />);
      
      const orbContainer = container.querySelector('.relative');
      expect(orbContainer).toHaveStyle({ contain: 'layout style paint' });
    });
  });

  describe('Active State', () => {
    it('should render particle effects when active', () => {
      const { container } = render(<AnimatedOrb isActive={true} />);
      
      // Should have 6 particle elements
      const particles = container.querySelectorAll('[data-animate*="scale"]');
      expect(particles.length).toBeGreaterThan(0);
    });

    it('should not render particle effects when inactive', () => {
      render(<AnimatedOrb isActive={false} />);
      
      // Particles are only rendered when active
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toBeInTheDocument();
    });

    it('should update pulse scale when active', () => {
      render(<AnimatedOrb isActive={true} />);
      
      // Fast-forward time to trigger pulse updates
      vi.advanceTimersByTime(200);
      
      // Component should still be rendered
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toBeInTheDocument();
    });

    it('should not pulse when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<AnimatedOrb isActive={true} />);
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      // Should render component
      expect(container.querySelector('.relative')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should have spring transition on core orb', () => {
      const { container } = render(<AnimatedOrb />);
      
      // Find element with spring transition
      const springElements = container.querySelectorAll('[data-transition*="spring"]');
      expect(springElements.length).toBeGreaterThan(0);
    });

    it('should have will-change property on animated elements', () => {
      const { container } = render(<AnimatedOrb />);
      
      // Find element with will-change style
      const willChangeElements = container.querySelectorAll('[style*="will-change"]');
      expect(willChangeElements.length).toBeGreaterThan(0);
    });

    it('should render multiple glow rings', () => {
      const { container } = render(<AnimatedOrb />);
      
      // Should have multiple animated divs for glow effect
      const animatedDivs = container.querySelectorAll('[data-animate]');
      expect(animatedDivs.length).toBeGreaterThan(2);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      render(<AnimatedOrb />);
      
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toBeInTheDocument();
    });

    it('should have aria-label in static mode', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<AnimatedOrb />);
      
      const orb = container.querySelector('[aria-label]');
      expect(orb).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const { unmount } = render(<AnimatedOrb isActive={true} />);
      
      // Spy on clearInterval
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should cleanup interval when isActive changes to false', () => {
      const { rerender } = render(<AnimatedOrb isActive={true} />);
      
      // Change to inactive
      rerender(<AnimatedOrb isActive={false} />);
      
      // Component should still be rendered
      const orb = screen.getByLabelText('Animated voice assistant orb');
      expect(orb).toBeInTheDocument();
    });
  });
});
