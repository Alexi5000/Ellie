import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

const TestIcon = () => <svg data-testid="test-icon" />;

describe('MetricCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders metric value and label', () => {
    render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
      />
    );

    expect(screen.getByText('99.99%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
      />
    );

    expect(container.querySelector('[data-testid="test-icon"]')).toBeInTheDocument();
  });

  it('renders disclaimer when provided', () => {
    render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        disclaimer="Based on last 12 months"
      />
    );

    expect(screen.getByText('Based on last 12 months')).toBeInTheDocument();
  });

  it('does not render disclaimer when not provided', () => {
    render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
      />
    );

    expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        className="custom-class"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('applies animation delay based on index', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        index={2}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.style.animationDelay).toBe('200ms');
  });

  it('sets zero delay when prefersReducedMotion is true', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        index={2}
        prefersReducedMotion={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.style.animationDelay).toBe('0ms');
  });

  it('sets opacity to 1 when isVisible is true', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        isVisible={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('1');
  });

  it('sets opacity to 0 when isVisible is false and motion is not reduced', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        isVisible={false}
        prefersReducedMotion={false}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('0');
  });

  it('sets opacity to 1 when prefersReducedMotion is true regardless of isVisible', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        isVisible={false}
        prefersReducedMotion={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('1');
  });

  it('includes animation class when visible and motion not reduced', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        isVisible={true}
        prefersReducedMotion={false}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('animate-fade-in-up');
  });

  it('does not include animation class when prefersReducedMotion is true', () => {
    const { container } = render(
      <MetricCard
        label="Uptime"
        value="99.99%"
        icon={<TestIcon />}
        isVisible={true}
        prefersReducedMotion={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('animate-fade-in-up');
  });
});
