import { useEffect, useState } from 'react';

/**
 * Easing function for smooth count-up animation
 * Uses easeOutExpo for a fast start and slow end
 */
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Options for the count-up animation hook
 */
interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  enabled?: boolean;
  easingFn?: (t: number) => number;
}

/**
 * Hook to animate a number from start to end value with easing
 * 
 * @param options - Configuration options for the count-up animation
 * @returns The current animated value
 * 
 * @example
 * ```tsx
 * const [ref, isVisible] = useIntersectionObserver({ triggerOnce: true });
 * const count = useCountUp({ end: 150000000, duration: 2000, enabled: isVisible });
 * 
 * return (
 *   <div ref={ref}>
 *     {(count / 1000000).toFixed(0)}M+
 *   </div>
 * );
 * ```
 */
export const useCountUp = (options: UseCountUpOptions): number => {
  const {
    start = 0,
    end,
    duration = 2000,
    enabled = true,
    easingFn = easeOutExpo,
  } = options;

  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!enabled) {
      setCount(start);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      
      const currentCount = start + (end - start) * easedProgress;
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [start, end, duration, enabled, easingFn]);

  return count;
};
