import React from 'react';
import { useCountUp } from '../../../hooks/useCountUp';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

/**
 * Props for the KPIStat component
 */
export interface KPIStatProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: 'number' | 'abbreviated';
  isVisible: boolean;
  animationDuration?: number;
}

/**
 * Format a number for display
 */
const formatNumber = (
  value: number,
  format: 'number' | 'abbreviated',
  prefix?: string,
  suffix?: string
): string => {
  let formattedValue: string;

  if (format === 'abbreviated') {
    // Handle millions
    if (value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    // Handle thousands
    else if (value >= 1000) {
      formattedValue = (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    // Handle regular numbers
    else {
      formattedValue = value.toFixed(0);
    }
  } else {
    // Format with commas
    formattedValue = value.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  }

  return `${prefix || ''}${formattedValue}${suffix || ''}`;
};

/**
 * KPIStat component displays an individual statistic with count-up animation
 * 
 * @example
 * ```tsx
 * <KPIStat
 *   label="Calls Processed"
 *   value={150000000}
 *   format="abbreviated"
 *   suffix="+"
 *   isVisible={true}
 * />
 * ```
 */
export const KPIStat: React.FC<KPIStatProps> = ({
  label,
  value,
  suffix,
  prefix,
  format = 'abbreviated',
  isVisible,
  animationDuration = 2000,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Use count-up animation if motion is allowed and component is visible
  const shouldAnimate = isVisible && !prefersReducedMotion;
  const animatedValue = useCountUp({
    end: value,
    duration: animationDuration,
    enabled: shouldAnimate,
  });

  // Use final value if reduced motion is preferred or not visible yet
  const displayValue = shouldAnimate ? animatedValue : (isVisible ? value : 0);
  const formattedValue = formatNumber(displayValue, format, prefix, suffix);

  return (
    <div 
      className="flex flex-col items-center text-center"
      style={{ contain: 'layout style paint' }}
    >
      <div
        className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {formattedValue}
      </div>
      <div className="text-sm sm:text-base md:text-lg text-text-secondary font-medium">
        {label}
      </div>
    </div>
  );
};
