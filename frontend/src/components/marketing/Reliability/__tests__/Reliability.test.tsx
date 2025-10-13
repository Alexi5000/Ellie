import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reliability } from '../Reliability';
import type { ReliabilityMetric } from '../Reliability';

// Mock hooks
vi.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => [vi.fn(), true],
}));

vi.mock('../../../../hooks', () => ({
  useReducedMotion: () => false,
}));

const TestIcon = () => <svg data-testid="test-icon" />;

const mockMetrics: ReliabilityMetric[] = [
  {
    id: 'uptime',
    label: 'Uptime',
    value: '99.99%',
    icon: <TestIcon />,
  },
  {
    id: 'latency',
    label: 'Response Time',
    value: 'Sub-500ms',
    icon: <TestIcon />,
  },
  {
    id: 'guardrails',
    label: 'AI Guardrails',
    value: 'Built-in',
    icon: <TestIcon />,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    value: 'SOC2, HIPAA, PCI',
    icon: <TestIcon />,
  },
];

describe('Reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all metrics', () => {
    render(<Reliability metrics={mockMetrics} />);

    expect(screen.getByText('99.99%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('Sub-500ms')).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('Built-in')).toBeInTheDocument();
    expect(screen.getByText('AI Guardrails')).toBeInTheDocument();
    expect(screen.getByText('SOC2, HIPAA, PCI')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('renders correct number of metric cards', () => {
    render(<Reliability metrics={mockMetrics} />);

    const icons = screen.getAllByTestId('test-icon');
    expect(icons).toHaveLength(4);
  });

  it('renders with semantic HTML', () => {
    const { container } = render(<Reliability metrics={mockMetrics} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-label', 'Reliability and Compliance');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Reliability metrics={mockMetrics} className="custom-class" />
    );

    const section = container.querySelector('section');
    expect(section?.className).toContain('custom-class');
  });

  it('renders empty state when no metrics provided', () => {
    const { container } = render(<Reliability metrics={[]} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    
    const icons = screen.queryAllByTestId('test-icon');
    expect(icons).toHaveLength(0);
  });

  it('renders metrics with disclaimers', () => {
    const metricsWithDisclaimer: ReliabilityMetric[] = [
      {
        id: 'uptime',
        label: 'Uptime',
        value: '99.99%',
        icon: <TestIcon />,
        disclaimer: 'Based on last 12 months',
      },
    ];

    render(<Reliability metrics={metricsWithDisclaimer} />);

    expect(screen.getByText('Based on last 12 months')).toBeInTheDocument();
  });

  it('uses responsive grid layout classes', () => {
    const { container } = render(<Reliability metrics={mockMetrics} />);

    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-4');
  });

  it('passes correct index to each MetricCard', () => {
    const { container } = render(<Reliability metrics={mockMetrics} />);

    const cards = container.querySelectorAll('.animate-fade-in-up');
    
    // Check that animation delays are staggered
    expect((cards[0] as HTMLElement).style.animationDelay).toBe('0ms');
    expect((cards[1] as HTMLElement).style.animationDelay).toBe('100ms');
    expect((cards[2] as HTMLElement).style.animationDelay).toBe('200ms');
    expect((cards[3] as HTMLElement).style.animationDelay).toBe('300ms');
  });

  it('renders with proper spacing classes', () => {
    const { container } = render(<Reliability metrics={mockMetrics} />);

    const section = container.querySelector('section');
    expect(section?.className).toContain('py-12');
    expect(section?.className).toContain('sm:py-16');
    expect(section?.className).toContain('md:py-20');
  });

  it('renders container with proper padding', () => {
    const { container } = render(<Reliability metrics={mockMetrics} />);

    const containerDiv = container.querySelector('.container');
    expect(containerDiv?.className).toContain('px-4');
    expect(containerDiv?.className).toContain('sm:px-6');
    expect(containerDiv?.className).toContain('lg:px-8');
  });
});
