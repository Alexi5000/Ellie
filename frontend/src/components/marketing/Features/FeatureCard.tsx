import React from 'react';

/**
 * Props for the FeatureCard component
 */
export interface FeatureCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  index?: number;
  isVisible?: boolean;
  prefersReducedMotion?: boolean;
  className?: string;
}

/**
 * FeatureCard component displays an individual feature with icon, name, and description
 * 
 * Features:
 * - Consistent icon display
 * - Feature name as heading
 * - Two-line description
 * - Optional hover effects (lift or glow)
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * <FeatureCard
 *   name="Multilingual"
 *   description="Support for 40+ languages with native accent detection and real-time translation."
 *   icon={<GlobeIcon />}
 * />
 * ```
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  name,
  description,
  icon,
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
        group relative
        bg-background-secondary dark:bg-background-tertiary
        border border-border-primary
        rounded-lg p-6
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        hover:border-accent-primary
        ${isVisible && !prefersReducedMotion ? 'animate-fade-in-up' : ''}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        opacity: isVisible || prefersReducedMotion ? 1 : 0,
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-accent-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

      {/* Icon */}
      <div className="mb-4 text-accent-primary transition-transform duration-300 group-hover:scale-110">
        <div className="w-12 h-12 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Feature Name */}
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {name}
      </h3>

      {/* Description */}
      <p className="text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};
