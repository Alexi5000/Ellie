import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders without crashing', () => {
    render(<LandingPage />);
    expect(screen.getAllByText('Ellie Voice Receptionist')[0]).toBeInTheDocument();
  });

  it('displays the hero section with main heading', () => {
    render(<LandingPage />);
    // Check for individual parts since they're in separate elements
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h1' && content.includes('Meet');
    })).toBeInTheDocument();
    expect(screen.getAllByText('Ellie')[0]).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('Your AI Legal Assistant');
    })).toBeInTheDocument();
  });

  it('displays the value proposition text', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Experience the future of legal assistance/)).toBeInTheDocument();
  });

  it('displays call-to-action buttons', () => {
    render(<LandingPage />);
    expect(screen.getByText(/🎤 Try Voice Demo/)).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('displays the features section', () => {
    render(<LandingPage />);
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && content.includes('Why Choose');
    })).toBeInTheDocument();
    expect(screen.getByText(/Powered by cutting-edge AI technology/)).toBeInTheDocument();
  });

  it('displays all six feature cards', () => {
    render(<LandingPage />);
    
    // Check all feature titles
    expect(screen.getByText('Voice-First Interface')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Mobile-First Design')).toBeInTheDocument();
    expect(screen.getByText('Secure & Compliant')).toBeInTheDocument();
    expect(screen.getByText('Instant Responses')).toBeInTheDocument();
    expect(screen.getByText('Professional Network')).toBeInTheDocument();
  });

  it('displays feature descriptions highlighting AI legal assistance capabilities', () => {
    render(<LandingPage />);
    
    expect(screen.getByText(/Simply speak to Ellie naturally/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced AI understands complex legal context/)).toBeInTheDocument();
    expect(screen.getByText(/Access Ellie from any device, anywhere/)).toBeInTheDocument();
    expect(screen.getByText(/Your conversations are encrypted and private/)).toBeInTheDocument();
    expect(screen.getByText(/Get immediate answers to your legal questions/)).toBeInTheDocument();
    expect(screen.getByText(/Ellie seamlessly connects you with qualified legal professionals/)).toBeInTheDocument();
  });

  it('displays the demo section', () => {
    render(<LandingPage />);
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && content.includes('Ready to Experience');
    })).toBeInTheDocument();
    expect(screen.getByText(/🎤 Start Voice Demo/)).toBeInTheDocument();
  });

  it('displays navigation menu in header', () => {
    render(<LandingPage />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check navigation links exist (using getAllByText since they appear in footer too)
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Demo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
  });

  it('displays footer with company information', () => {
    render(<LandingPage />);
    expect(screen.getByText(/AI-powered legal assistance through natural voice interaction/)).toBeInTheDocument();
    expect(screen.getByText(/© 2024 Ellie Voice Receptionist/)).toBeInTheDocument();
  });

  it('displays footer navigation links', () => {
    render(<LandingPage />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('has professional branding elements', () => {
    render(<LandingPage />);
    
    // Check for logo elements (E letters in circles)
    const logoElements = screen.getAllByText('E');
    expect(logoElements.length).toBeGreaterThan(0);
    
    // Check for professional color scheme and branding (use getAllByText for multiple instances)
    expect(screen.getAllByText('Ellie Voice Receptionist').length).toBeGreaterThan(0);
  });

  it('uses responsive design classes', () => {
    render(<LandingPage />);
    
    // Check that responsive classes are present in the DOM
    // This is a basic check - in a real scenario you'd test actual responsive behavior
    expect(document.querySelector('.md\\:text-7xl')).toBeInTheDocument();
    expect(document.querySelector('.sm\\:flex-row')).toBeInTheDocument();
    expect(document.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
  });

  it('displays all required sections for a complete landing page', () => {
    render(<LandingPage />);
    
    // Header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Main content sections
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h1' && content.includes('Meet');
    })).toBeInTheDocument(); // Hero
    expect(screen.getAllByText('Ellie')[0]).toBeInTheDocument(); // Hero
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && content.includes('Why Choose');
    })).toBeInTheDocument(); // Features
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && content.includes('Ready to Experience');
    })).toBeInTheDocument(); // Demo
    
    // Footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});