import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StepCard } from '../StepCard';

describe('StepCard', () => {
  const mockIcon = (
    <svg data-testid="test-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );

  const defaultProps = {
    title: 'Test Step',
    description: 'This is a test description for the step card.',
    icon: mockIcon,
    index: 0,
    isVisible: true,
    prefersReducedMotion: false,
  };

  afterEach(() => {
    cleanup();
  });

  it('renders title correctly', () => {
    render(<StepCard {...defaultProps} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(<StepCard {...defaultProps} />);
    expect(
      screen.getByText('This is a test description for the step card.')
    ).toBeInTheDocument();
  });

  it('renders icon correctly', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const icon = container.querySelector('[data-testid="test-icon"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies animation class when visible and motion is allowed', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('animate-slide-up');
  });

  it('does not apply animation class when prefersReducedMotion is true', () => {
    const { container } = render(
      <StepCard {...defaultProps} prefersReducedMotion={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('animate-slide-up');
  });

  it('applies opacity-0 class when not visible', () => {
    const { container } = render(
      <StepCard {...defaultProps} isVisible={false} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('opacity-0');
  });

  it('applies staggered animation delay based on index', () => {
    const { container } = render(<StepCard {...defaultProps} index={2} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '300ms' });
  });

  it('applies zero delay when prefersReducedMotion is true', () => {
    const { container } = render(
      <StepCard {...defaultProps} index={2} prefersReducedMotion={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ animationDelay: '0ms' });
  });

  it('has proper semantic structure', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    
    const title = container.querySelector('h3');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Test Step');
  });

  it('applies background and border styling', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toHaveClass('bg-background-secondary');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-border-primary');
    expect(card).toHaveClass('rounded-xl');
  });

  it('centers content properly', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toHaveClass('flex', 'flex-col', 'items-center', 'text-center');
  });

  it('applies responsive padding', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toHaveClass('p-6', 'sm:p-8');
  });

  it('icon has aria-hidden attribute', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const iconContainer = container.querySelector('[aria-hidden="true"]');
    
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles long descriptions correctly', () => {
    const longDescription = 'This is a very long description that should wrap properly and maintain readability across different screen sizes.';
    render(<StepCard {...defaultProps} description={longDescription} />);
    
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('applies animation fill mode', () => {
    const { container } = render(<StepCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toHaveStyle({ animationFillMode: 'both' });
  });
});
