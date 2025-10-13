import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FeatureCard } from '../FeatureCard';

describe('FeatureCard', () => {
  const mockIcon = (
    <svg data-testid="test-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    cleanup();
  });

  it('renders feature name correctly', () => {
    render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    expect(screen.getByText('Multilingual')).toBeInTheDocument();
  });

  it('renders feature description correctly', () => {
    render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages with native accent detection."
        icon={mockIcon}
      />
    );
    
    expect(
      screen.getByText('Support for 40+ languages with native accent detection.')
    ).toBeInTheDocument();
  });

  it('renders icon correctly', () => {
    render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('feature name is rendered as h3', () => {
    render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Multilingual');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        className="custom-class"
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('has proper card styling', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-background-secondary', 'border', 'rounded-lg', 'p-6');
  });

  it('has hover effect classes', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1', 'hover:border-accent-primary');
  });

  it('has transition classes', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('transition-all', 'duration-300');
  });

  it('applies stagger delay based on index', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        index={2}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.style.animationDelay).toBe('200ms');
  });

  it('applies zero delay when prefersReducedMotion is true', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        index={2}
        prefersReducedMotion={true}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.style.animationDelay).toBe('0ms');
  });

  it('sets opacity to 1 when isVisible is true', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        isVisible={true}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('1');
  });

  it('sets opacity to 0 when isVisible is false and motion is not reduced', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        isVisible={false}
        prefersReducedMotion={false}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('0');
  });

  it('sets opacity to 1 when prefersReducedMotion is true regardless of isVisible', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
        isVisible={false}
        prefersReducedMotion={true}
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('1');
  });

  it('has glow effect element', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const glowEffect = container.querySelector('.absolute.inset-0.rounded-lg.bg-accent-primary');
    expect(glowEffect).toBeInTheDocument();
  });

  it('icon container has proper sizing', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const iconContainer = container.querySelector('.w-12.h-12');
    expect(iconContainer).toBeInTheDocument();
  });

  it('icon has hover scale effect', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const iconWrapper = container.querySelector('.group-hover\\:scale-110');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('description has proper text styling', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const description = screen.getByText('Support for 40+ languages');
    expect(description).toHaveClass('text-text-secondary', 'leading-relaxed');
  });

  it('feature name has proper styling', () => {
    render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-text-primary', 'mb-2');
  });

  it('icon wrapper has proper margin', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const iconWrapper = container.querySelector('.mb-4.text-accent-primary');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('has relative positioning for glow effect', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('relative');
  });

  it('has group class for hover effects', () => {
    const { container } = render(
      <FeatureCard
        name="Multilingual"
        description="Support for 40+ languages"
        icon={mockIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('group');
  });
});
