import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Features } from '../Features';

// Mock the hooks
vi.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: vi.fn(() => [{ current: null }, true, null]),
}));

vi.mock('../../../../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Features', () => {
  const mockIcon = (
    <svg data-testid="test-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );

  const mockFeatures = [
    {
      id: 'multilingual',
      name: 'Multilingual',
      description: 'Support for 40+ languages with native accent detection and real-time translation.',
      icon: mockIcon,
    },
    {
      id: 'api-native',
      name: 'API-native',
      description: 'RESTful API with comprehensive SDKs for all major programming languages.',
      icon: mockIcon,
    },
    {
      id: 'automated-testing',
      name: 'Automated testing',
      description: 'Built-in testing framework to validate your AI assistant before deployment.',
      icon: mockIcon,
    },
    {
      id: 'bring-your-own-models',
      name: 'Bring your own models',
      description: 'Use your own fine-tuned models or choose from our pre-trained options.',
      icon: mockIcon,
    },
    {
      id: 'tool-calling',
      name: 'Tool calling',
      description: 'Seamlessly integrate with external APIs and tools during conversations.',
      icon: mockIcon,
    },
    {
      id: 'ab-experiments',
      name: 'A/B experiments',
      description: 'Run experiments to optimize your assistant performance and user experience.',
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

  it('renders all feature cards', () => {
    render(<Features features={mockFeatures} />);
    
    expect(screen.getByText('Multilingual')).toBeInTheDocument();
    expect(screen.getByText('API-native')).toBeInTheDocument();
    expect(screen.getByText('Automated testing')).toBeInTheDocument();
    expect(screen.getByText('Bring your own models')).toBeInTheDocument();
    expect(screen.getByText('Tool calling')).toBeInTheDocument();
    expect(screen.getByText('A/B experiments')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<Features features={mockFeatures} />);
    
    expect(
      screen.getByText('Support for 40+ languages with native accent detection and real-time translation.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('RESTful API with comprehensive SDKs for all major programming languages.')
    ).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(<Features features={mockFeatures} />);
    
    const section = screen.getByRole('region', { name: 'Features' });
    expect(section).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <Features features={mockFeatures} className="custom-class" />
    );
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('renders with default 3-column responsive grid layout', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('renders with 2-column layout when specified', () => {
    const { container } = render(<Features features={mockFeatures} columns={2} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  it('renders with 4-column layout when specified', () => {
    const { container } = render(<Features features={mockFeatures} columns={4} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('applies proper spacing classes', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('py-12', 'sm:py-16', 'md:py-20');
  });

  it('uses container for proper width constraints', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('renders empty features array without errors', () => {
    render(<Features features={[]} />);
    
    const section = screen.getByRole('region', { name: 'Features' });
    expect(section).toBeInTheDocument();
  });

  it('handles single feature correctly', () => {
    render(<Features features={[mockFeatures[0]]} />);
    
    expect(screen.getByText('Multilingual')).toBeInTheDocument();
  });

  it('renders all icons', () => {
    render(<Features features={mockFeatures} />);
    
    const icons = screen.getAllByTestId('test-icon');
    expect(icons).toHaveLength(6);
  });

  it('applies max-width constraint to grid', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('max-w-7xl', 'mx-auto');
  });

  it('applies responsive gap between cards', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-6', 'sm:gap-8');
  });

  it('passes correct index to each FeatureCard', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    // All cards should be rendered
    const cards = container.querySelectorAll('.group.relative');
    expect(cards).toHaveLength(6);
  });

  it('passes isVisible prop to FeatureCards', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    // Check that cards have opacity set (indicating isVisible was passed)
    const cards = container.querySelectorAll('.group.relative');
    cards.forEach((card) => {
      const htmlCard = card as HTMLElement;
      expect(htmlCard.style.opacity).toBe('1');
    });
  });

  it('passes prefersReducedMotion to FeatureCards', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    // Cards should be rendered (hook is mocked to return false)
    const cards = container.querySelectorAll('.group.relative');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders feature names as headings', () => {
    render(<Features features={mockFeatures} />);
    
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(6);
  });

  it('maintains consistent structure for all cards', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const cards = container.querySelectorAll('.group.relative');
    
    cards.forEach((card) => {
      // Each card should have icon, heading, and description
      expect(card.querySelector('svg')).toBeInTheDocument();
      expect(card.querySelector('h3')).toBeInTheDocument();
      expect(card.querySelector('p')).toBeInTheDocument();
    });
  });

  it('applies proper grid structure', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('section has full width', () => {
    const { container } = render(<Features features={mockFeatures} />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('w-full');
  });

  it('handles features with different description lengths', () => {
    const featuresWithVaryingDescriptions = [
      {
        id: 'short',
        name: 'Short',
        description: 'Short description.',
        icon: mockIcon,
      },
      {
        id: 'long',
        name: 'Long',
        description: 'This is a much longer description that spans multiple lines and contains more detailed information about the feature.',
        icon: mockIcon,
      },
    ];

    render(<Features features={featuresWithVaryingDescriptions} />);
    
    expect(screen.getByText('Short description.')).toBeInTheDocument();
    expect(
      screen.getByText(/This is a much longer description/)
    ).toBeInTheDocument();
  });
});
