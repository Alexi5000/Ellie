import React from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { KPIStat, KPIStatProps } from './KPIStat';

/**
 * Props for the KPIBand component
 */
export interface KPIBandProps {
  stats: Omit<KPIStatProps, 'isVisible'>[];
  animationDuration?: number;
  className?: string;
}

/**
 * KPIBand component displays a horizontal band of key performance indicators
 * with count-up animations triggered when the component enters the viewport.
 * 
 * Features:
 * - Intersection Observer to trigger animations on viewport entry
 * - Count-up animations with easing function
 * - Respects prefers-reduced-motion for accessibility
 * - Responsive layout (horizontal on desktop, stacks on mobile)
 * 
 * @example
 * ```tsx
 * <KPIBand
 *   stats={[
 *     { label: 'Calls Processed', value: 150000000, format: 'abbreviated', suffix: '+' },
 *     { label: 'Assistants Launched', value: 1500000, format: 'abbreviated', suffix: '+' },
 *     { label: 'Developers', value: 350000, format: 'abbreviated', suffix: '+' },
 *   ]}
 * />
 * ```
 */
export const KPIBand: React.FC<KPIBandProps> = ({
  stats,
  animationDuration = 2000,
  className = '',
}) => {
  // Use Intersection Observer to trigger animations when component enters viewport
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className={`w-full py-12 sm:py-16 md:py-20 ${className}`}
      aria-label="Key Performance Indicators"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 md:gap-12">
          {stats.map((stat, index) => (
            <KPIStat
              key={`${stat.label}-${index}`}
              {...stat}
              isVisible={isVisible}
              animationDuration={animationDuration}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
