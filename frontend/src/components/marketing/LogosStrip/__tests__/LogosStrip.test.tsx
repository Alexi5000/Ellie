import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogosStrip, Logo } from '../LogosStrip';

// Mock the useTheme hook
vi.mock('../../../../hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '../../../../hooks/useTheme';

const mockLogos: Logo[] = [
  {
    name: 'Company A',
    src: '/logos/company-a-light.png',
    srcDark: '/logos/company-a-dark.png',
    alt: 'Company A - Leading tech company',
    width: 120,
    height: 40,
  },
  {
    name: 'Company B',
    src: '/logos/company-b.png',
    alt: 'Company B - Innovation partner',
    width: 100,
    height: 40,
  },
  {
    name: 'Company C',
    src: '/logos/company-c-light.png',
    srcDark: '/logos/company-c-dark.png',
    alt: 'Company C - Technology leader',
    width: 140,
    height: 40,
  },
];

const mockLightTheme = {
  theme: 'light' as const,
  toggleTheme: vi.fn(),
  systemTheme: 'light' as const,
  setTheme: vi.fn(),
};

const mockDarkTheme = {
  theme: 'dark' as const,
  toggleTheme: vi.fn(),
  systemTheme: 'dark' as const,
  setTheme: vi.fn(),
};

describe('LogosStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all logos', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toBeInTheDocument();
      });
    });

    it('should render with custom className', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(
        <LogosStrip logos={mockLogos} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render empty when no logos provided', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={[]} />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive alt text for all logos', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toHaveAttribute('alt', logo.alt);
      });
    });

    it('should have proper width and height attributes', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toHaveAttribute('width', logo.width.toString());
        expect(img).toHaveAttribute('height', logo.height.toString());
      });
    });

    it('should have lazy loading enabled', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('Dark Mode Logo Switching', () => {
    it('should use light logo in light mode', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      const companyAImg = screen.getByAltText('Company A - Leading tech company');
      expect(companyAImg).toHaveAttribute('src', '/logos/company-a-light.png');
    });

    it('should use dark logo in dark mode when available', () => {
      vi.mocked(useTheme).mockReturnValue(mockDarkTheme);

      render(<LogosStrip logos={mockLogos} />);

      const companyAImg = screen.getByAltText('Company A - Leading tech company');
      expect(companyAImg).toHaveAttribute('src', '/logos/company-a-dark.png');
    });

    it('should fallback to light logo in dark mode when dark version not available', () => {
      vi.mocked(useTheme).mockReturnValue(mockDarkTheme);

      render(<LogosStrip logos={mockLogos} />);

      const companyBImg = screen.getByAltText('Company B - Innovation partner');
      expect(companyBImg).toHaveAttribute('src', '/logos/company-b.png');
    });

    it('should switch logos when theme changes', () => {
      // Start with light theme
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);
      
      const { rerender } = render(<LogosStrip logos={mockLogos} />);

      let companyAImg = screen.getByAltText('Company A - Leading tech company');
      expect(companyAImg).toHaveAttribute('src', '/logos/company-a-light.png');

      // Switch to dark theme
      vi.mocked(useTheme).mockReturnValue(mockDarkTheme);
      rerender(<LogosStrip logos={mockLogos} />);

      companyAImg = screen.getByAltText('Company A - Leading tech company');
      expect(companyAImg).toHaveAttribute('src', '/logos/company-a-dark.png');
    });
  });

  describe('Responsive Layout', () => {
    it('should have flex-wrap class for responsive wrapping', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const flexContainer = container.querySelector('.flex-wrap');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have responsive gap classes', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const flexContainer = container.querySelector('.gap-8');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Consistent Sizing', () => {
    it('should apply max-height constraint to all logos', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toHaveStyle({ maxHeight: '48px' });
      });
    });

    it('should maintain aspect ratio with object-contain', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      render(<LogosStrip logos={mockLogos} />);

      mockLogos.forEach((logo) => {
        const img = screen.getByAltText(logo.alt);
        expect(img).toHaveClass('object-contain');
      });
    });
  });

  describe('Hover Effects', () => {
    it('should have hover scale class', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const logoWrappers = container.querySelectorAll('.hover\\:scale-110');
      expect(logoWrappers.length).toBe(mockLogos.length);
    });

    it('should have hover opacity class', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const logoWrappers = container.querySelectorAll('.hover\\:opacity-80');
      expect(logoWrappers.length).toBe(mockLogos.length);
    });

    it('should have transition class for smooth hover effects', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const logoWrappers = container.querySelectorAll('.transition-all');
      expect(logoWrappers.length).toBe(mockLogos.length);
    });
  });

  describe('Even Spacing', () => {
    it('should center logos horizontally', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const flexContainer = container.querySelector('.justify-center');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should center logos vertically', () => {
      vi.mocked(useTheme).mockReturnValue(mockLightTheme);

      const { container } = render(<LogosStrip logos={mockLogos} />);

      const flexContainer = container.querySelector('.items-center');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});
