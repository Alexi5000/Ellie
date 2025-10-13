import { useState, useEffect } from 'react';

/**
 * Hook to track media query matches for responsive behavior
 * 
 * Listens to media query changes and returns the current match state.
 * Useful for implementing responsive behavior in JavaScript.
 * 
 * @param {string} query - The media query string to match (e.g., '(min-width: 768px)')
 * @returns {boolean} Whether the media query currently matches
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * 
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  // Initialize with undefined to detect SSR
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (not SSR)
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define the event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Fallback for older browsers using deprecated addListener
      // @ts-ignore - addListener is deprecated but needed for older browsers
      mediaQuery.addListener(handleChange);
      
      return () => {
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [query]);

  return matches;
};
