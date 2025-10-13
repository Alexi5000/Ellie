import React from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useReducedMotion } from '../../../hooks';
import { MetricCard } from './MetricCard';

/**
 * Props for individual reliability metrics
 */
export interface ReliabilityMetric {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  disclaimer?: string;
}

/**
 * Props for the Reliability component
 */
export interface ReliabilityProps {
  metrics: ReliabilityMetric[];
  className?: string;
}

/**
 * Reliability component displays proof-point cards for reliability and compliance metrics
 * 
 * Features:
 * - Horizontal card layout with responsive wrapping
 * - Subtle styling (informational cards, not guarantees)
 * - Icons/badges for visual interest
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion for accessibility
 * - Responsive wrapping for mobile devices
 * 
 * @example
 * ```tsx
 * <Reliability
 *   metrics={[
 *     {
 *       id: 'uptime',
 *       label: 'Uptime',
 *       value: '99.99%',
 *       icon: <CheckCircleIcon />,
 *       disclaimer: 'Based on last 12 months'
 *     },
 *     {
 *       id: 'latency',
 *       label: 'Latency',
 *       value: 'Sub-500ms',
 *       icon: <BoltIcon />
 *     }
 *   ]}
 * />
 * ```
 */
export const Reliability: React.FC<ReliabilityProps> = ({
  metrics,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Use Intersection Observer to trigger animations when component enters viewport
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className={`w-full py-12 sm:py-16 md:py-20 ${className}`}
      aria-label="Reliability and Compliance"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics Grid - Horizontal layout with wrapping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              disclaimer={metric.disclaimer}
              index={index}
              isVisible={isVisible}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
