import React from 'react';

/**
 * Props for the StepCard component
 */
export interface StepCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  isVisible: boolean;
  prefersReducedMotion: boolean;
}

/**
 * StepCard component displays an individual step in the explainer section
 * 
 * Features:
 * - Icon + title + description layout
 * - Staggered entrance animation based on index
 * - Respects prefers-reduced-motion for accessibility
 * 
 * @example
 * ```tsx
 * <StepCard
 *   title="Choose your workflow"
 *   description="Select from pre-built templates..."
 *   icon={<WorkflowIcon />}
 *   index={0}
 *   isVisible={true}
 *   prefersReducedMotion={false}
 * />
 * ```
 */
export const StepCard: React.FC<StepCardProps> = ({
  title,
  description,
  icon,
  index,
  isVisible,
  prefersReducedMotion,
}) => {
  // Calculate staggered animation delay
  const animationDelay = prefersReducedMotion ? '0ms' : `${index * 150}ms`;
  
  // Determine animation class
  const animationClass = prefersReducedMotion
    ? ''
    : isVisible
    ? 'animate-slide-up'
    : 'opacity-0';

  return (
    <div
      className={`
        flex flex-col items-center text-center
        p-6 sm:p-8
        bg-background-secondary
        border border-border-primary
        rounded-xl
        ${animationClass}
      `}
      style={{
        animationDelay: isVisible ? animationDelay : '0ms',
        animationFillMode: 'both',
      }}
    >
      {/* Icon */}
      <div
        className="
          w-16 h-16 sm:w-20 sm:h-20
          flex items-center justify-center
          mb-4 sm:mb-6
          text-accent-primary
        "
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};
