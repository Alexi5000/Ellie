import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Solutions, Solution } from '../Solutions';

// Mock the useReducedMotion hook
vi.mock('../../../../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Solutions', () => {
  const mockSolutions: Solution[] = [
    {
      id: 'inbound',
      title: 'Inbound Calls',
      description: 'Handle incoming customer calls with AI-powered assistance.',
      nodes: [
        { id: 'receive', label: 'Receive Call', type: 'start' },
        { id: 'process', label: 'Process Request', type: 'action' },
        { id: 'respond', label: 'Respond', type: 'end' },
      ],
      connections: [
        { from: 'receive', to: 'process' },
        { from: 'process', to: 'respond' },
      ],
      caseStudyUrl: '/case-studies/inbound',
      tryNowUrl: '/demo/inbound',
    },
    {
      id: 'outbound',
      title: 'Outbound Calls',
      description: 'Make proactive outbound calls for sales and engagement.',
      nodes: [
        { id: 'initiate', label: 'Initiate Call', type: 'start' },
        { id: 'engage', label: 'Engage Customer', type: 'action' },
        { id: 'complete', label: 'Complete', type: 'end' },
      ],
      connections: [
        { from: 'initiate', to: 'engage' },
        { from: 'engage', to: 'complete' },
      ],
      caseStudyUrl: '/case-studies/outbound',
      tryNowUrl: '/demo/outbound',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Solutions solutions={mockSolutions} />);
    expect(screen.getByRole('region', { name: 'Solutions' })).toBeInTheDocument();
  });

  it('renders section header', () => {
    render(<Solutions solutions={mockSolutions} />);
    
    expect(screen.getByText('Solutions for Every Use Case')).toBeInTheDocument();
    expect(
      screen.getByText(/Whether you're handling inbound customer calls/i)
    ).toBeInTheDocument();
  });

  it('renders all solution tabs', () => {
    render(<Solutions solutions={mockSolutions} />);
    
    expect(screen.getByRole('tab', { name: 'Inbound Calls' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Outbound Calls' })).toBeInTheDocument();
  });

  it('displays default solution on mount', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    expect(inboundTab).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByText('Handle incoming customer calls with AI-powered assistance.')
    ).toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    fireEvent.click(outboundTab);
    
    await waitFor(() => {
      expect(outboundTab).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByText('Make proactive outbound calls for sales and engagement.')
      ).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with arrow keys', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    
    // Press ArrowRight to move to next tab
    fireEvent.keyDown(inboundTab, { key: 'ArrowRight' });
    expect(outboundTab).toHaveAttribute('aria-selected', 'true');
    
    // Press ArrowLeft to move back
    fireEvent.keyDown(outboundTab, { key: 'ArrowLeft' });
    expect(inboundTab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports Home and End keys for navigation', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="outbound" />);
    
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    
    // Press Home to go to first tab
    fireEvent.keyDown(outboundTab, { key: 'Home' });
    expect(inboundTab).toHaveAttribute('aria-selected', 'true');
    
    // Press End to go to last tab
    fireEvent.keyDown(inboundTab, { key: 'End' });
    expect(outboundTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders action buttons with correct links', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const caseStudyLink = screen.getByRole('link', { name: /Case Study/i });
    const tryNowLink = screen.getByRole('link', { name: /Try It Now/i });
    
    expect(caseStudyLink).toHaveAttribute('href', '/case-studies/inbound');
    expect(tryNowLink).toHaveAttribute('href', '/demo/inbound');
  });

  it('updates action buttons when switching tabs', async () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    fireEvent.click(outboundTab);
    
    await waitFor(() => {
      const caseStudyLink = screen.getByRole('link', { name: /Case Study/i });
      const tryNowLink = screen.getByRole('link', { name: /Try It Now/i });
      
      expect(caseStudyLink).toHaveAttribute('href', '/case-studies/outbound');
      expect(tryNowLink).toHaveAttribute('href', '/demo/outbound');
    });
  });

  it('has proper ARIA attributes for tabs', () => {
    render(<Solutions solutions={mockSolutions} />);
    
    const tablist = screen.getByRole('tablist', { name: 'Solution types' });
    expect(tablist).toBeInTheDocument();
    
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    expect(inboundTab).toHaveAttribute('aria-controls', 'panel-inbound');
    expect(inboundTab).toHaveAttribute('id', 'tab-inbound');
  });

  it('hides inactive tab panels', () => {
    const { container } = render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const inboundPanel = container.querySelector('#panel-inbound');
    const outboundPanel = container.querySelector('#panel-outbound');
    
    expect(inboundPanel).toBeInTheDocument();
    expect(inboundPanel).not.toHaveAttribute('hidden');
    
    expect(outboundPanel).toBeInTheDocument();
    expect(outboundPanel).toHaveAttribute('hidden');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Solutions solutions={mockSolutions} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders FlowDiagram for active solution', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    // Check that flow diagram nodes are rendered
    expect(screen.getByText('Receive Call')).toBeInTheDocument();
    expect(screen.getByText('Process Request')).toBeInTheDocument();
    expect(screen.getByText('Respond')).toBeInTheDocument();
  });

  it('wraps around when navigating past last tab with ArrowRight', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="outbound" />);
    
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    
    // Press ArrowRight on last tab should wrap to first
    fireEvent.keyDown(outboundTab, { key: 'ArrowRight' });
    expect(inboundTab).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around when navigating before first tab with ArrowLeft', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    
    // Press ArrowLeft on first tab should wrap to last
    fireEvent.keyDown(inboundTab, { key: 'ArrowLeft' });
    expect(outboundTab).toHaveAttribute('aria-selected', 'true');
  });

  it('sets correct tabIndex for active and inactive tabs', () => {
    render(<Solutions solutions={mockSolutions} defaultSolution="inbound" />);
    
    const inboundTab = screen.getByRole('tab', { name: 'Inbound Calls' });
    const outboundTab = screen.getByRole('tab', { name: 'Outbound Calls' });
    
    expect(inboundTab).toHaveAttribute('tabIndex', '0');
    expect(outboundTab).toHaveAttribute('tabIndex', '-1');
  });
});
