import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarketingPage } from '../MarketingPage';

// Mock all marketing components
vi.mock('../../components/marketing/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

vi.mock('../../components/marketing/Hero', () => ({
  Hero: ({ onTalkToEllie }: { onTalkToEllie?: () => void }) => (
    <section data-testid="hero">
      <button onClick={onTalkToEllie}>Talk to Ellie</button>
    </section>
  ),
}));

vi.mock('../../components/marketing/CodeTabs', () => ({
  CodeTabs: () => <div data-testid="code-tabs">CodeTabs</div>,
}));

vi.mock('../../components/marketing/CodeTabs/codeSnippets', () => ({
  startCallSnippets: [],
}));

vi.mock('../../components/marketing/LogosStrip', () => ({
  LogosStrip: () => <div data-testid="logos-strip">LogosStrip</div>,
}));

vi.mock('../../components/marketing/KPIBand', () => ({
  KPIBand: () => <div data-testid="kpi-band">KPIBand</div>,
}));

vi.mock('../../components/marketing/Solutions', () => ({
  Solutions: () => <div data-testid="solutions">Solutions</div>,
}));

vi.mock('../../components/marketing/Explainer', () => ({
  Explainer: () => <div data-testid="explainer">Explainer</div>,
}));

vi.mock('../../components/marketing/Features', () => ({
  Features: () => <div data-testid="features">Features</div>,
}));

vi.mock('../../components/marketing/Reliability', () => ({
  Reliability: () => <div data-testid="reliability">Reliability</div>,
}));

vi.mock('../../components/marketing/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('MarketingPage', () => {
  it('renders the marketing page with all sections', async () => {
    render(<MarketingPage />);

    // Check that above-the-fold components render immediately
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('code-tabs')).toBeInTheDocument();

    // Wait for lazy-loaded components to appear
    await waitFor(() => {
      expect(screen.getByTestId('logos-strip')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('kpi-band')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('solutions')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('explainer')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('features')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('reliability')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  it('renders skip to content link for accessibility', () => {
    render(<MarketingPage />);

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders main content with proper ID for anchor navigation', () => {
    render(<MarketingPage />);

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  it('renders all section IDs for anchor navigation', async () => {
    render(<MarketingPage />);

    // Check section IDs
    expect(screen.getByRole('main').querySelector('#hero')).toBeInTheDocument();
    expect(screen.getByRole('main').querySelector('#code-examples')).toBeInTheDocument();

    // Wait for lazy-loaded sections
    await waitFor(() => {
      expect(screen.getByRole('main').querySelector('#trusted-by')).toBeInTheDocument();
      expect(screen.getByRole('main').querySelector('#stats')).toBeInTheDocument();
      expect(screen.getByRole('main').querySelector('#solutions')).toBeInTheDocument();
      expect(screen.getByRole('main').querySelector('#how-it-works')).toBeInTheDocument();
      expect(screen.getByRole('main').querySelector('#features')).toBeInTheDocument();
      expect(screen.getByRole('main').querySelector('#reliability')).toBeInTheDocument();
    });
  });

  it('has proper spacing between sections', () => {
    render(<MarketingPage />);

    const sections = screen.getByRole('main').querySelectorAll('section');
    sections.forEach((section) => {
      // Check that sections have padding classes
      expect(section.className).toMatch(/py-\d+/);
    });
  });

  it('alternates background colors for visual separation', async () => {
    render(<MarketingPage />);

    // Hero section should have default background
    const heroSection = screen.getByRole('main').querySelector('#hero');
    expect(heroSection?.className).not.toContain('bg-background-secondary');

    // Code examples should have secondary background
    const codeSection = screen.getByRole('main').querySelector('#code-examples');
    expect(codeSection?.className).toContain('bg-background-secondary');

    // Wait for lazy sections and check alternating backgrounds
    await waitFor(() => {
      const statsSection = screen.getByRole('main').querySelector('#stats');
      expect(statsSection?.className).toContain('bg-background-secondary');

      const solutionsSection = screen.getByRole('main').querySelector('#solutions');
      expect(solutionsSection?.className).not.toContain('bg-background-secondary');
    });
  });

  it('handles Talk to Ellie button click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<MarketingPage />);

    const talkButton = screen.getByText('Talk to Ellie');
    talkButton.click();

    expect(consoleSpy).toHaveBeenCalledWith('Talk to Ellie clicked');
    
    consoleSpy.mockRestore();
  });

  it('renders with responsive container classes', () => {
    render(<MarketingPage />);

    const containers = screen.getByRole('main').querySelectorAll('.max-w-7xl');
    expect(containers.length).toBeGreaterThan(0);

    containers.forEach((container) => {
      expect(container.className).toContain('mx-auto');
    });
  });

  it('uses semantic HTML structure', () => {
    render(<MarketingPage />);

    // Check for semantic elements
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });
});
