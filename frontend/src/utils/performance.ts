/**
 * Performance optimization utilities for the marketing site
 * 
 * This module provides utilities and best practices for optimizing
 * performance across the application.
 */

/**
 * Lazy load an image with Intersection Observer
 * @param img - The image element to lazy load
 */
export const lazyLoadImage = (img: HTMLImageElement): void => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          if (target.dataset.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for browsers without Intersection Observer
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  }
};

/**
 * Preload critical resources
 * @param urls - Array of resource URLs to preload
 * @param type - Resource type (font, image, script, style)
 */
export const preloadResources = (
  urls: string[],
  type: 'font' | 'image' | 'script' | 'style' = 'image'
): void => {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

/**
 * Check if the user prefers reduced motion
 * @returns true if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Measure and log performance metrics
 * @param name - Name of the metric
 * @param startMark - Start mark name
 * @param endMark - End mark name
 */
export const measurePerformance = (
  name: string,
  startMark: string,
  endMark: string
): void => {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
};

/**
 * Report Web Vitals to analytics
 * @param metric - Web Vital metric
 */
export const reportWebVitals = (metric: {
  name: string;
  value: number;
  id: string;
}): void => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, metric.value);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your analytics service
    // Example: analytics.track('web-vital', metric);
  }
};

/**
 * CSS contain property values for performance optimization
 * Use these on isolated components to improve rendering performance
 */
export const CSS_CONTAIN = {
  /** Isolate layout, style, and paint */
  FULL: 'layout style paint' as const,
  /** Isolate layout only */
  LAYOUT: 'layout' as const,
  /** Isolate style only */
  STYLE: 'style' as const,
  /** Isolate paint only */
  PAINT: 'paint' as const,
  /** Isolate layout and paint */
  LAYOUT_PAINT: 'layout paint' as const,
} as const;

/**
 * Best practices for will-change CSS property
 * Only use on elements that will definitely animate
 */
export const WILL_CHANGE = {
  /** For transform animations */
  TRANSFORM: 'transform' as const,
  /** For opacity animations */
  OPACITY: 'opacity' as const,
  /** For scroll position */
  SCROLL_POSITION: 'scroll-position' as const,
} as const;

/**
 * Apply will-change temporarily for an animation
 * Automatically removes it after animation completes
 * @param element - DOM element
 * @param property - CSS property that will change
 * @param duration - Animation duration in ms
 */
export const applyWillChange = (
  element: HTMLElement,
  property: string,
  duration: number
): void => {
  element.style.willChange = property;
  
  setTimeout(() => {
    element.style.willChange = 'auto';
  }, duration + 100); // Add small buffer
};
