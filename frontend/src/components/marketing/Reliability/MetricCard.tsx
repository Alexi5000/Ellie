import React from 'react';

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  disclaimer?: string;
  index?: number;
  isVisible?: boolean;
  prefersReducedMotion?: boolean;
  className?: string;
}

/**
 * MetricCard component displays an individual reliability metric or compliance badge
 * 
 * Features:
 * - Icon/badge display
 * - Metric value and label
 * - Subtle styling (informational, not guarantee-like)
 * - Optional disclaimer text
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   label="Uptime"
 *   value="99.99%"
 *   icon={<CheckCircleIcon />}
 *   disclaimer="Based on last 12 months"
 * />
 * ```
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  disclaimer,
  index = 0,
  isVisible = true,
  prefersReducedMotion = false,
  className = '',
}) => {
  // Calculate stagger delay for entrance animation
  const delay = prefersReducedMotion ? 0 : index * 100;

  return (
    <div
      className={`
        relative
        bg-background-secondary dark:bg-background-tertiary
        border border-border-primary
        rounded-lg p-6
        transition-all duration-300
        ${isVisible && !prefersReducedMotion ? 'animate-fade-in-up' : ''}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        opacity: isVisible || prefersReducedMotion ? 1 : 0,
      }}
    >
      {/* Icon/Badge */}
      <div className="mb-3 text-accent-primary flex items-center justify-center">
        <div className="w-10 h-10 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Metric Value */}
      <div className="text-2xl font-bold text-text-primary text-center mb-1">
        {value}
      </div>

      {/* Label */}
      <div className="text-sm text-text-secondary text-center">
        {label}
      </div>

      {/* Optional Disclaimer */}
      {disclaimer && (
        <div className="text-xs text-text-tertiary text-center mt-2 italic">
          {disclaimer}
        </div>
      )}
    </div>
  );
};
