import React, { lazy, Suspense } from 'react';
import type { MotionProps } from 'framer-motion';

/**
 * Lazy-loaded Framer Motion components for better performance
 * Only loads the animation library when needed
 */

// Lazy load motion components
const MotionDiv = lazy(() => 
  import('framer-motion').then(mod => ({ 
    default: mod.motion.div 
  }))
);

/**
 * LazyMotionDiv - A lazy-loaded version of motion.div
 * Falls back to a regular div while loading
 */
export const LazyMotionDiv: React.FC<MotionProps & { children?: React.ReactNode }> = (props) => {
  return (
    <Suspense fallback={<div {...props as any}>{props.children}</div>}>
      <MotionDiv {...props} />
    </Suspense>
  );
};
