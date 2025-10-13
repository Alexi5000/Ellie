import { useEffect, useCallback, useRef } from 'react';

export interface UseKeyboardNavigationOptions {
  /**
   * Enable arrow key navigation (left/right or up/down)
   */
  enableArrowKeys?: boolean;
  
  /**
   * Enable tab key navigation
   */
  enableTabKey?: boolean;
  
  /**
   * Enable escape key to trigger callback
   */
  enableEscapeKey?: boolean;
  
  /**
   * Enable enter/space keys to trigger callback
   */
  enableActivationKeys?: boolean;
  
  /**
   * Orientation for arrow key navigation
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Whether to loop back to start/end when reaching boundaries
   */
  loop?: boolean;
  
  /**
   * Callback when navigating to next item
   */
  onNext?: () => void;
  
  /**
   * Callback when navigating to previous item
   */
  onPrevious?: () => void;
  
  /**
   * Callback when escape key is pressed
   */
  onEscape?: () => void;
  
  /**
   * Callback when activation key (Enter/Space) is pressed
   */
  onActivate?: () => void;
  
  /**
   * Callback when tab key is pressed
   */
  onTab?: (shiftKey: boolean) => void;
}

export interface UseKeyboardNavigationReturn {
  /**
   * Ref to attach to the container element
   */
  containerRef: React.RefObject<HTMLElement>;
  
  /**
   * Current focused index
   */
  currentIndex: number;
  
  /**
   * Set the current focused index
   */
  setCurrentIndex: (index: number) => void;
  
  /**
   * Navigate to next item
   */
  navigateNext: () => void;
  
  /**
   * Navigate to previous item
   */
  navigatePrevious: () => void;
}

/**
 * Hook for handling keyboard navigation (tab, arrow keys, enter, escape)
 * 
 * Provides a comprehensive solution for keyboard navigation patterns
 * commonly used in tabs, menus, and other interactive components.
 * 
 * @param {UseKeyboardNavigationOptions} options - Configuration options
 * @returns {UseKeyboardNavigationReturn} Navigation state and controls
 * 
 * @example
 * ```tsx
 * // Horizontal tab navigation
 * const { containerRef, currentIndex, setCurrentIndex } = useKeyboardNavigation({
 *   enableArrowKeys: true,
 *   orientation: 'horizontal',
 *   loop: true,
 *   onActivate: () => selectTab(currentIndex),
 * });
 * 
 * return (
 *   <div ref={containerRef} role="tablist">
 *     {tabs.map((tab, index) => (
 *       <button
 *         key={tab.id}
 *         role="tab"
 *         tabIndex={currentIndex === index ? 0 : -1}
 *         onClick={() => setCurrentIndex(index)}
 *       >
 *         {tab.label}
 *       </button>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn => {
  const {
    enableArrowKeys = true,
    enableTabKey = false,
    enableEscapeKey = false,
    enableActivationKeys = false,
    orientation = 'horizontal',
    loop = false,
    onNext,
    onPrevious,
    onEscape,
    onActivate,
    onTab,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const currentIndexRef = useRef<number>(0);

  const setCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
  }, []);

  const navigateNext = useCallback(() => {
    if (onNext) {
      onNext();
    }
  }, [onNext]);

  const navigatePrevious = useCallback(() => {
    if (onPrevious) {
      onPrevious();
    }
  }, [onPrevious]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, shiftKey } = event;

      // Handle arrow keys
      if (enableArrowKeys) {
        const isNext =
          (orientation === 'horizontal' && key === 'ArrowRight') ||
          (orientation === 'vertical' && key === 'ArrowDown');
        
        const isPrevious =
          (orientation === 'horizontal' && key === 'ArrowLeft') ||
          (orientation === 'vertical' && key === 'ArrowUp');

        if (isNext) {
          event.preventDefault();
          navigateNext();
          return;
        }

        if (isPrevious) {
          event.preventDefault();
          navigatePrevious();
          return;
        }
      }

      // Handle tab key
      if (enableTabKey && key === 'Tab') {
        if (onTab) {
          event.preventDefault();
          onTab(shiftKey);
        }
        return;
      }

      // Handle escape key
      if (enableEscapeKey && key === 'Escape') {
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // Handle activation keys (Enter/Space)
      if (enableActivationKeys && (key === 'Enter' || key === ' ')) {
        event.preventDefault();
        if (onActivate) {
          onActivate();
        }
        return;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enableArrowKeys,
    enableTabKey,
    enableEscapeKey,
    enableActivationKeys,
    orientation,
    loop,
    navigateNext,
    navigatePrevious,
    onEscape,
    onActivate,
    onTab,
  ]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    setCurrentIndex,
    navigateNext,
    navigatePrevious,
  };
};
