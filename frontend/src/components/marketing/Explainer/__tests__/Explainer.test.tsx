import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Explainer } from '../Explainer';

// Mock the hooks
vi.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: vi.fn(() => [{ current: null }, true, null]),
}));

vi.mock('../../../../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Explainer', () => {
  const mockIcon = (
    <svg data-testid="test-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );

  const mockSteps = [
    {
      id: 'choose',
      title: 'Choose your workflow',
      description: 'Select from pre-built templates or create your own custom workflow.',
      icon: mockIcon,
    },
    {
      id: 'plugin',
      title: 'Plug it in',
      description: 'Integrate with your existing systems using our simple API.',
      icon: mockIcon,
    },
    {
      id: 'done',
      title: 'Done',
      description: 'Your AI assistant is ready to handle calls.',
      icon: mockIcon,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders headline correctly', () => {
    render(
      <Explainer headline="Try in minutes. Deploy in days." steps={mockSteps} />
    );
    
    expect(screen.getByText('Try in minutes. Deploy in days.')).toBeInTheDocument();
  });

  it('renders all step cards', () => {
    render(
      <Explainer headline="Try in minutes. Deploy in days." steps={mockSteps} />
    );
    
    expect(screen.getByText('Choose your workflow')).toBeInTheDocument();
    expect(screen.getByText('Plug it in')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(
      <Explainer headline="Try in minutes. Deploy in days." steps={mockSteps} />
    );
    
    expect(
      screen.getByText('Select from pre-built templates or create your own custom workflow.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Integrate with your existing systems using our simple API.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your AI assistant is ready to handle calls.')
    ).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(
      <Explainer headline="Try in minutes. Deploy in days." steps={mockSteps} />
    );
    
    const section = screen.getByRole('region', { name: 'Getting Started' });
    expect(section).toBeInTheDocument();
  });

  it('headline is rendered as h2', () => {
    render(
      <Explainer headline="Try in minutes. Deploy in days." steps={mockSteps} />
    );
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Try in minutes. Deploy in days.');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <Explainer
        headline="Test Headline"
        steps={mockSteps}
        className="custom-class"
      />
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('renders with responsive grid layout', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('applies proper spacing classes', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('py-12', 'sm:py-16', 'md:py-20');
  });

  it('uses container for proper width constraints', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('renders empty steps array without errors', () => {
    render(<Explainer headline="Test Headline" steps={[]} />);
    
    const section = screen.getByRole('region', { name: 'Getting Started' });
    expect(section).toBeInTheDocument();
  });

  it('handles single step correctly', () => {
    render(
      <Explainer
        headline="Test Headline"
        steps={[mockSteps[0]]}
      />
    );
    
    expect(screen.getByText('Choose your workflow')).toBeInTheDocument();
  });

  it('renders all icons', () => {
    render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const icons = screen.getAllByTestId('test-icon');
    expect(icons).toHaveLength(3);
  });

  it('applies max-width constraint to grid', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('max-w-6xl', 'mx-auto');
  });

  it('applies responsive gap between cards', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-6', 'sm:gap-8');
  });

  it('headline has responsive text sizing', () => {
    render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('text-3xl', 'sm:text-4xl', 'md:text-5xl');
  });

  it('headline is centered', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const headlineContainer = container.querySelector('.text-center');
    expect(headlineContainer).toBeInTheDocument();
  });

  it('applies proper margin to headline section', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    const headlineContainer = container.querySelector('.text-center');
    expect(headlineContainer).toHaveClass('mb-12', 'sm:mb-16');
  });

  it('passes correct index to each StepCard', () => {
    const { container } = render(
      <Explainer headline="Test Headline" steps={mockSteps} />
    );
    
    // All cards should be rendered
    const cards = container.querySelectorAll('.flex.flex-col.items-center');
    expect(cards).toHaveLength(3);
  });
});
