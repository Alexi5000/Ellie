import React from 'react';

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'action' | 'condition' | 'end';
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagramProps {
  nodes: FlowNode[];
  connections: FlowConnection[];
  className?: string;
}

/**
 * FlowDiagram component renders a simple SVG-based node-flow diagram
 * 
 * Features:
 * - SVG-based rendering for scalability
 * - Simple node types (start, action, condition, end)
 * - Connections with optional labels
 * - Responsive scaling for mobile
 * - Accessible with proper ARIA labels
 * 
 * @example
 * ```tsx
 * <FlowDiagram
 *   nodes={[
 *     { id: 'start', label: 'Receive Call', type: 'start' },
 *     { id: 'tool', label: 'Use Tool', type: 'action' },
 *     { id: 'condition', label: 'Check Result', type: 'condition' }
 *   ]}
 *   connections={[
 *     { from: 'start', to: 'tool' },
 *     { from: 'tool', to: 'condition' }
 *   ]}
 * />
 * ```
 */
export const FlowDiagram: React.FC<FlowDiagramProps> = ({
  nodes,
  connections,
  className = '',
}) => {
  // Calculate positions for nodes in a horizontal flow
  const nodeSpacing = 200;
  const nodeWidth = 140;
  const nodeHeight = 60;
  const startX = 50;
  const startY = 80;

  const getNodeShape = (type: FlowNode['type']) => {
    switch (type) {
      case 'start':
      case 'end':
        return 'rounded'; // Rounded rectangle
      case 'condition':
        return 'diamond'; // Diamond shape
      case 'action':
      default:
        return 'rectangle'; // Regular rectangle
    }
  };

  const renderNode = (node: FlowNode, index: number) => {
    const x = startX + index * nodeSpacing;
    const y = startY;
    const shape = getNodeShape(node.type);

    if (shape === 'diamond') {
      // Diamond shape for conditions
      const centerX = x + nodeWidth / 2;
      const centerY = y + nodeHeight / 2;
      const halfWidth = nodeWidth / 2;
      const halfHeight = nodeHeight / 2;

      return (
        <g key={node.id}>
          <path
            d={`M ${centerX},${centerY - halfHeight} 
                L ${centerX + halfWidth},${centerY} 
                L ${centerX},${centerY + halfHeight} 
                L ${centerX - halfWidth},${centerY} Z`}
            className="fill-background-secondary stroke-accent-primary stroke-2"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-medium fill-text-primary"
          >
            {node.label}
          </text>
        </g>
      );
    }

    // Rectangle or rounded rectangle
    const rx = shape === 'rounded' ? 12 : 4;

    return (
      <g key={node.id}>
        <rect
          x={x}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          rx={rx}
          className="fill-background-secondary stroke-accent-primary stroke-2"
        />
        <text
          x={x + nodeWidth / 2}
          y={y + nodeHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-medium fill-text-primary"
        >
          {node.label}
        </text>
      </g>
    );
  };

  const renderConnection = (connection: FlowConnection) => {
    const fromIndex = nodes.findIndex(n => n.id === connection.from);
    const toIndex = nodes.findIndex(n => n.id === connection.to);

    if (fromIndex === -1 || toIndex === -1) return null;

    const fromNode = nodes[fromIndex];
    const toNode = nodes[toIndex];
    const fromShape = getNodeShape(fromNode.type);
    const toShape = getNodeShape(toNode.type);

    // Calculate start and end points
    const fromX = startX + fromIndex * nodeSpacing + nodeWidth;
    const fromY = startY + nodeHeight / 2;
    const toX = startX + toIndex * nodeSpacing;
    const toY = startY + nodeHeight / 2;

    // Adjust for diamond shapes
    const adjustedFromX = fromShape === 'diamond' ? fromX - nodeWidth / 2 + nodeWidth / 2 : fromX;
    const adjustedToX = toShape === 'diamond' ? toX + nodeWidth / 2 : toX;

    const midX = (adjustedFromX + adjustedToX) / 2;

    return (
      <g key={`${connection.from}-${connection.to}`}>
        {/* Arrow line */}
        <path
          d={`M ${adjustedFromX},${fromY} L ${adjustedToX},${toY}`}
          className="stroke-accent-primary stroke-2 fill-none"
          markerEnd="url(#arrowhead)"
        />
        {/* Connection label */}
        {connection.label && (
          <text
            x={midX}
            y={fromY - 10}
            textAnchor="middle"
            className="text-xs fill-text-secondary"
          >
            {connection.label}
          </text>
        )}
      </g>
    );
  };

  // Calculate SVG dimensions
  const svgWidth = startX * 2 + (nodes.length - 1) * nodeSpacing + nodeWidth;
  const svgHeight = startY * 2 + nodeHeight;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[600px] md:min-w-0"
        role="img"
        aria-label="Flow diagram showing process steps"
      >
        {/* Define arrowhead marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            className="fill-accent-primary"
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
        </defs>

        {/* Render connections first (so they appear behind nodes) */}
        {connections.map(renderConnection)}

        {/* Render nodes */}
        {nodes.map(renderNode)}
      </svg>
    </div>
  );
};
