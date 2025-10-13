import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { KPIBand } from '../KPIBand';

// Mock the hooks
vi.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: vi.fn(() => [{ current: null }, true, null]),
}));

vi.mock('../../../../hooks/useCountUp', () => ({
  useCountUp: vi.fn(({ end }) => end),
}));

vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('KPIBand', () => {
  const mockStats = [
    {
      label: 'Calls Processed',
      value: 150000000,
      format: 'abbreviated' as const,
      suffix: '+',
    },
    {
      label: 'Assistants Launched',
      value: 1500000,
      format: 'abbreviated' as const,
      suffix: '+',
    },
    {
      label: 'Developers',
      value: 350000,
      format: 'abbreviated' as const,
      suffix: '+',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders all statistics', () => {
    render(<KPIBand stats={mockStats} />);

    expect(screen.getByText('Calls Processed')).toBeInTheDocument();
    expect(screen.getByText('Assistants Launched')).toBeInTheDocument();
    expect(screen.getByText('Developers')).toBeInTheDocument();
  });

  it('renders statistics with correct values', () => {
    render(<KPIBand stats={mockStats} />);

    expect(screen.getByText('150M+')).toBeInTheDocument();
    expect(screen.getByText('1.5M+')).toBeInTheDocument();
    expect(screen.getByText('350K+')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(<KPIBand stats={mockStats} />);

    const section = screen.getByRole('region', { name: 'Key Performance Indicators' });
    expect(section).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <KPIBand stats={mockStats} className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('renders with responsive grid layout', () => {
    const { container } = render(<KPIBand stats={mockStats} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
  });

  it('passes animationDuration to KPIStat components', () => {
    render(<KPIBand stats={mockStats} animationDuration={3000} />);

    // Component should render without errors
    expect(screen.getByText('Calls Processed')).toBeInTheDocument();
  });

  it('renders empty stats array without errors', () => {
    render(<KPIBand stats={[]} />);

    const section = screen.getByRole('region', { name: 'Key Performance Indicators' });
    expect(section).toBeInTheDocument();
  });

  it('handles single stat correctly', () => {
    render(
      <KPIBand
        stats={[
          {
            label: 'Single Stat',
            value: 100,
            format: 'number',
          },
        ]}
      />
    );

    expect(screen.getByText('Single Stat')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies proper spacing classes', () => {
    const { container } = render(<KPIBand stats={mockStats} />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('py-12', 'sm:py-16', 'md:py-20');
  });

  it('uses container for proper width constraints', () => {
    const { container } = render(<KPIBand stats={mockStats} />);

    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });
});
