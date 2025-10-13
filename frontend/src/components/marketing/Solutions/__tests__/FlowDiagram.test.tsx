import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowDiagram, FlowNode, FlowConnection } from '../FlowDiagram';

describe('FlowDiagram', () => {
  const mockNodes: FlowNode[] = [
    { id: 'start', label: 'Receive Call', type: 'start' },
    { id: 'tool', label: 'Use Tool', type: 'action' },
    { id: 'condition', label: 'Check Result', type: 'condition' },
    { id: 'end', label: 'Complete', type: 'end' },
  ];

  const mockConnections: FlowConnection[] = [
    { from: 'start', to: 'tool' },
    { from: 'tool', to: 'condition', label: 'Process' },
    { from: 'condition', to: 'end' },
  ];

  it('renders without crashing', () => {
    const { container } = render(<FlowDiagram nodes={mockNodes} connections={mockConnections} />);
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).toBeInTheDocument();
  });

  it('renders all nodes with correct labels', () => {
    const { container } = render(<FlowDiagram nodes={mockNodes} connections={mockConnections} />);
    
    expect(container.textContent).toContain('Receive Call');
    expect(container.textContent).toContain('Use Tool');
    expect(container.textContent).toContain('Check Result');
    expect(container.textContent).toContain('Complete');
  });

  it('renders connection labels when provided', () => {
    const { container } = render(<FlowDiagram nodes={mockNodes} connections={mockConnections} />);
    
    expect(container.textContent).toContain('Process');
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(<FlowDiagram nodes={mockNodes} connections={mockConnections} />);
    
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Flow diagram showing process steps');
  });

  it('applies custom className', () => {
    const { container } = render(
      <FlowDiagram
        nodes={mockNodes}
        connections={mockConnections}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with empty nodes array', () => {
    const { container } = render(<FlowDiagram nodes={[]} connections={[]} />);
    
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).toBeInTheDocument();
  });

  it('handles missing connection nodes gracefully', () => {
    const invalidConnections: FlowConnection[] = [
      { from: 'nonexistent', to: 'also-nonexistent' },
    ];
    
    const { container } = render(<FlowDiagram nodes={mockNodes} connections={invalidConnections} />);
    
    // Should still render nodes - check within this specific container
    expect(container.textContent).toContain('Receive Call');
  });

  it('renders different node shapes based on type', () => {
    const { container } = render(
      <FlowDiagram nodes={mockNodes} connections={mockConnections} />
    );
    
    // Check that SVG elements are rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check for rectangles (start, action, end nodes)
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
    
    // Check for path (diamond shape for condition)
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('renders with minimal props', () => {
    const minimalNodes: FlowNode[] = [
      { id: '1', label: 'Node 1', type: 'action' },
    ];
    
    const { container } = render(<FlowDiagram nodes={minimalNodes} connections={[]} />);
    
    expect(container.textContent).toContain('Node 1');
  });
});
