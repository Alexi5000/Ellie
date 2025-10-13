import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { KPIStat } from '../KPIStat';

// Mock the hooks
vi.mock('../../../../hooks/useCountUp', () => ({
  useCountUp: vi.fn(({ end, enabled }) => (enabled ? end : 0)),
}));

vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('KPIStat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the label correctly', () => {
    render(
      <KPIStat
        label="Calls Processed"
        value={150000000}
        format="abbreviated"
        isVisible={true}
      />
    );

    expect(screen.getByText('Calls Processed')).toBeInTheDocument();
  });

  it('formats abbreviated numbers correctly (millions)', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={150000000}
        format="abbreviated"
        isVisible={true}
      />
    );

    expect(screen.getByText('150M')).toBeInTheDocument();
  });

  it('formats abbreviated numbers correctly (thousands)', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={350000}
        format="abbreviated"
        isVisible={true}
      />
    );

    expect(screen.getByText('350K')).toBeInTheDocument();
  });

  it('adds suffix when provided', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={150000000}
        format="abbreviated"
        suffix="+"
        isVisible={true}
      />
    );

    expect(screen.getByText('150M+')).toBeInTheDocument();
  });

  it('adds prefix when provided', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={1000}
        format="number"
        prefix="$"
        isVisible={true}
      />
    );

    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('formats regular numbers with commas', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={1234567}
        format="number"
        isVisible={true}
      />
    );

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('displays 0 when not visible', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={150000000}
        format="abbreviated"
        isVisible={false}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    const { container } = render(
      <KPIStat
        label="Unique Test Label"
        value={150000000}
        format="abbreviated"
        isVisible={true}
      />
    );

    const valueElement = container.querySelector('[aria-live="polite"]');
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveAttribute('aria-live', 'polite');
    expect(valueElement).toHaveAttribute('aria-atomic', 'true');
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(
      <KPIStat
        label="Styling Test Label"
        value={999999999}
        format="abbreviated"
        isVisible={true}
      />
    );

    const valueElement = screen.getByText('1000M');
    expect(valueElement).toHaveClass('text-4xl', 'font-bold', 'text-text-primary');
  });

  it('removes decimal point for whole millions', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={2000000}
        format="abbreviated"
        isVisible={true}
      />
    );

    expect(screen.getByText('2M')).toBeInTheDocument();
  });

  it('shows decimal for non-whole millions', () => {
    render(
      <KPIStat
        label="Test Stat"
        value={1500000}
        format="abbreviated"
        isVisible={true}
      />
    );

    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });
});
