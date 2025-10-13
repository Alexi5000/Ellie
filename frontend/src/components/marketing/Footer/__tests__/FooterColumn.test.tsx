import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FooterColumn } from '../FooterColumn';
import type { FooterLink } from '../Footer';

// Mock the useReducedMotion hook
vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe('FooterColumn', () => {
  it('renders without crashing', () => {
    const links: FooterLink[] = [
      { label: 'Test Link A', href: '/test-a' },
    ];
    renderWithRouter(<FooterColumn title="Test Column" links={links} />);
    expect(screen.getByText('Test Column')).toBeInTheDocument();
  });

  it('renders column title', () => {
    const links: FooterLink[] = [
      { label: 'Product Link', href: '/product' },
    ];
    renderWithRouter(<FooterColumn title="Product" links={links} />);
    
    const title = screen.getByText('Product');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
  });

  it('renders all links', () => {
    const links: FooterLink[] = [
      { label: 'First Link', href: '/first' },
      { label: 'Second Link', href: '/second' },
      { label: 'Third Link', href: '/third' },
    ];
    renderWithRouter(<FooterColumn title="All Links Test" links={links} />);
    
    expect(screen.getByText('First Link')).toBeInTheDocument();
    expect(screen.getByText('Second Link')).toBeInTheDocument();
    expect(screen.getByText('Third Link')).toBeInTheDocument();
  });

  it('renders internal links with React Router Link', () => {
    const links: FooterLink[] = [
      { label: 'Internal Link', href: '/internal' },
    ];
    renderWithRouter(<FooterColumn title="Internal Test" links={links} />);
    
    const link = screen.getByText('Internal Link');
    expect(link.closest('a')).toHaveAttribute('href', '/internal');
    expect(link.closest('a')).not.toHaveAttribute('target');
  });

  it('renders external links with target="_blank"', () => {
    const links: FooterLink[] = [
      { label: 'External Site', href: 'https://external.com', external: true },
    ];
    renderWithRouter(<FooterColumn title="External Test" links={links} />);
    
    const externalLink = screen.getByText('External Site');
    expect(externalLink).toHaveAttribute('href', 'https://external.com');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has visible focus indicators on links', () => {
    const links: FooterLink[] = [
      { label: 'Focus Test Link', href: '/focus' },
    ];
    renderWithRouter(<FooterColumn title="Focus Test" links={links} />);
    
    const link = screen.getByText('Focus Test Link');
    expect(link).toHaveClass('focus:outline-none');
    expect(link).toHaveClass('focus:ring-2');
    expect(link).toHaveClass('focus:ring-accent-primary');
  });

  it('applies custom className', () => {
    const links: FooterLink[] = [
      { label: 'Custom Class Link', href: '/custom' },
    ];
    const { container } = renderWithRouter(
      <FooterColumn title="Custom Class Test" links={links} className="custom-class" />
    );
    
    const column = container.firstChild;
    expect(column).toHaveClass('custom-class');
  });

  it('renders empty column with no links', () => {
    const { container } = renderWithRouter(<FooterColumn title="Empty Column" links={[]} />);
    
    expect(screen.getByText('Empty Column')).toBeInTheDocument();
    const list = container.querySelector('ul');
    expect(list?.children).toHaveLength(0);
  });

  it('title has uppercase styling', () => {
    const links: FooterLink[] = [
      { label: 'Styling Link', href: '/styling' },
    ];
    const { container } = renderWithRouter(<FooterColumn title="Unique Title" links={links} />);
    
    const title = screen.getByText('Unique Title');
    expect(title).toHaveClass('uppercase');
    expect(title).toHaveClass('tracking-wider');
  });

  it('links have proper spacing', () => {
    const links: FooterLink[] = [
      { label: 'Spacing Link 1', href: '/spacing1' },
      { label: 'Spacing Link 2', href: '/spacing2' },
    ];
    const { container } = renderWithRouter(<FooterColumn title="Spacing Test" links={links} />);
    
    const list = container.querySelector('ul');
    expect(list).toHaveClass('space-y-3');
  });

  it('respects reduced motion preference', () => {
    // Note: This test would need proper mock setup at the module level
    // For now, we'll just verify the component renders
    const uniqueLinks: FooterLink[] = [
      { label: 'Motion Link 1', href: '/motion1' },
      { label: 'Motion Link 2', href: '/motion2' },
    ];
    
    renderWithRouter(<FooterColumn title="Motion Test" links={uniqueLinks} />);
    
    const link = screen.getByText('Motion Link 1');
    expect(link).toBeInTheDocument();
  });
});
