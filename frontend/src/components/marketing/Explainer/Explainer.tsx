import React from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useReducedMotion } from '../../../hooks';
import { StepCard } from './StepCard';

/**
 * Props for individual explainer steps
 */
export interface ExplainerStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Props for the Explainer component
 */
export interface ExplainerProps {
  headline: string;
  steps: ExplainerStep[];
  className?: string;
}

/**
 * Explainer component displays a three-step process with headline
 * 
 * Features:
 * - Headline with customizable text
 * - Three-card horizontal layout (desktop) / vertical (mobile)
 * - Staggered entrance animations triggered on viewport entry
 * - Respects prefers-reduced-motion for accessibility
 * - Icon + title + description for each step
 * 
 * @example
 * ```tsx
 * <Explainer
 *   headline="Try in minutes. Deploy in days."
 *   steps={[
 *     {
 *       id: 'choose',
 *       title: 'Choose your workflow',
 *       description: 'Select from pre-built templates...',
 *       icon: <WorkflowIcon />
 *     },
 *     {
 *       id: 'plugin',
 *       title: 'Plug it in',
 *       description: 'Integrate with your existing systems...',
 *       icon: <PlugIcon />
 *     },
 *     {
 *       id: 'done',
 *       title: 'Done',
 *       description: 'Your AI assistant is ready to handle calls.',
 *       icon: <CheckIcon />
 *     }
 *   ]}
 * />
 * ```
 */
export const Explainer: React.FC<ExplainerProps> = ({
  headline,
  steps,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Use Intersection Observer to trigger animations when component enters viewport
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className={`w-full py-12 sm:py-16 md:py-20 ${className}`}
      aria-label="Getting Started"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary">
            {headline}
          </h2>
        </div>

        {/* Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              title={step.title}
              description={step.description}
              icon={step.icon}
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
