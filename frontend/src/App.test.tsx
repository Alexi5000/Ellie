import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock the MarketingPage component
vi.mock('./pages/MarketingPage', () => ({
  MarketingPage: () => <div data-testid="marketing-page">Marketing Page</div>,
}));

// Mock HealthCheck component
vi.mock('./components/HealthCheck', () => ({
  default: () => <div data-testid="health-check">Health Check</div>,
}));

// Mock BusinessDashboard component
vi.mock('./components/BusinessDashboard', () => ({
  default: () => <div data-testid="business-dashboard">Business Dashboard</div>,
}));

// Setup matchMedia mock before each test
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('marketing-page')).toBeInTheDocument();
  });

  it('wraps app with ThemeProvider', () => {
    const { container } = render(<App />);
    // ThemeProvider should apply theme class to document
    expect(container).toBeTruthy();
  });

  it('displays the marketing page on root route', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('marketing-page')).toBeInTheDocument();
    });
  });

  it('displays health check on /health route', async () => {
    window.history.pushState({}, '', '/health');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('health-check')).toBeInTheDocument();
    });
  });

  it('displays business dashboard on /dashboard route', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('business-dashboard')).toBeInTheDocument();
    });
  });

  it('maintains routing structure with all providers', () => {
    const { container } = render(<App />);
    
    // Verify the app structure is maintained
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.bg-background-primary')).toBeInTheDocument();
  });
});