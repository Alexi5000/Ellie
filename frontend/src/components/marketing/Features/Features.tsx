import React from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useReducedMotion } from '../../../hooks';
import { FeatureCard } from './FeatureCard';

/**
 * Props for individual features
 */
export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Props for the Features component
 */
export interface FeaturesProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Features component displays a responsive grid of feature cards
 * 
 * Features:
 * - Responsive grid layout (3 cols desktop → 2 cols tablet → 1 col mobile)
 * - Consistent card heights
 * - Hover effects (lift and glow)
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion for accessibility
 * - Icon + heading + description for each feature
 * 
 * @example
 * ```tsx
 * <Features
 *   features={[
 *     {
 *       id: 'multilingual',
 *       name: 'Multilingual',
 *       description: 'Support for 40+ languages with native accent detection.',
 *       icon: <GlobeIcon />
 *     },
 *     {
 *       id: 'api-native',
 *       name: 'API-native',
 *       description: 'RESTful API with comprehensive SDKs for all major languages.',
 *       icon: <CodeIcon />
 *     }
 *   ]}
 * />
 * ```
 */
export const Features: React.FC<FeaturesProps> = ({
  features,
  columns = 3,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Use Intersection Observer to trigger animations when component enters viewport
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Determine grid columns based on prop
  const gridColsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <section
      ref={ref}
      className={`w-full py-12 sm:py-16 md:py-20 ${className}`}
      aria-label="Features"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Features Grid */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-6 sm:gap-8 max-w-7xl mx-auto`}>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              name={feature.name}
              description={feature.description}
              icon={feature.icon}
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
