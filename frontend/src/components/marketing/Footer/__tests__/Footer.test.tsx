import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../Footer';
import type { FooterColumnData, SocialLink } from '../Footer';

// Mock the useReducedMotion hook
vi.mock('../../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Footer', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders with default columns', () => {
    renderWithRouter(<Footer />);
    
    // Check for default column titles
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders custom columns', () => {
    const customColumns: FooterColumnData[] = [
      {
        title: 'Custom Column',
        links: [
          { label: 'Link 1', href: '/link1' },
          { label: 'Link 2', href: '/link2' },
        ],
      },
    ];

    renderWithRouter(<Footer columns={customColumns} />);
    
    expect(screen.getByText('Custom Column')).toBeInTheDocument();
    expect(screen.getByText('Link 1')).toBeInTheDocument();
    expect(screen.getByText('Link 2')).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    const currentYear = new Date().getFullYear();
    renderWithRouter(<Footer />);
    
    expect(screen.getByText(`© ${currentYear} Ellie AI. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders custom copyright text', () => {
    const customCopyright = '© 2024 Custom Company';
    renderWithRouter(<Footer copyrightText={customCopyright} />);
    
    expect(screen.getByText(customCopyright)).toBeInTheDocument();
  });

  it('renders social links', () => {
    renderWithRouter(<Footer />);
    
    // Check for default social links
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('renders custom social links', () => {
    const customSocialLinks: SocialLink[] = [
      {
        name: 'Facebook',
        href: 'https://facebook.com/test',
        icon: <span>FB</span>,
      },
    ];

    renderWithRouter(<Footer socialLinks={customSocialLinks} />);
    
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
  });

  it('has semantic HTML structure', () => {
    renderWithRouter(<Footer />);
    
    // Check for footer landmark
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    
    // Check for navigation landmark
    expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeInTheDocument();
  });

  it('includes skip-to-content link', () => {
    renderWithRouter(<Footer />);
    
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('social links open in new tab', () => {
    renderWithRouter(<Footer />);
    
    const twitterLink = screen.getByLabelText('Twitter');
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(<Footer className="custom-class" />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('custom-class');
  });

  it('has visible focus indicators on social links', () => {
    renderWithRouter(<Footer />);
    
    const twitterLink = screen.getByLabelText('Twitter');
    expect(twitterLink).toHaveClass('focus:outline-none');
    expect(twitterLink).toHaveClass('focus:ring-2');
    expect(twitterLink).toHaveClass('focus:ring-accent-primary');
  });

  it('renders all default product links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('renders all default solutions links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Inbound Calls')).toBeInTheDocument();
    expect(screen.getByText('Outbound Calls')).toBeInTheDocument();
    expect(screen.getByText('Custom Agents')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders all default resources links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Case Studies')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('renders all default company links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Press')).toBeInTheDocument();
  });

  it('renders all default legal links', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });
});
