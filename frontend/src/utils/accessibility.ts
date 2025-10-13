/**
 * Accessibility utility functions
 * 
 * This module provides helper functions for implementing
 * WCAG 2.1 Level AA compliant accessibility features.
 */

/**
 * Focus trap implementation for modals and dialogs
 * 
 * @param container - The container element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export const createFocusTrap = (container: HTMLElement): (() => void) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Add event listener
  document.addEventListener('keydown', handleKeyDown);

  // Focus first element
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Announce message to screen readers using ARIA live region
 * 
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const liveRegionId = `aria-live-region-${priority}`;
  let liveRegion = document.getElementById(liveRegionId);

  // Create live region if it doesn't exist
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = liveRegionId;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Clear previous message
  liveRegion.textContent = '';

  // Announce new message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
};

/**
 * Check if an element is visible and focusable
 * 
 * @param element - The element to check
 * @returns True if the element is visible and focusable
 */
export const isElementFocusable = (element: HTMLElement): boolean => {
  // Check if element is hidden
  if (element.offsetParent === null) return false;

  // Check if element has display: none or visibility: hidden
  const styles = window.getComputedStyle(element);
  if (styles.display === 'none' || styles.visibility === 'hidden') return false;

  // Check if element is disabled
  if (element.hasAttribute('disabled')) return false;

  // Check if element has negative tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex && parseInt(tabindex, 10) < 0) return false;

  return true;
};

/**
 * Get the next focusable element in the DOM
 * 
 * @param currentElement - The current focused element
 * @param reverse - Whether to go backwards (Shift+Tab)
 * @returns The next focusable element or null
 */
export const getNextFocusableElement = (
  currentElement: HTMLElement,
  reverse: boolean = false
): HTMLElement | null => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelectors)
  ).filter(isElementFocusable);

  const currentIndex = focusableElements.indexOf(currentElement);
  if (currentIndex === -1) return null;

  const nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0) {
    return focusableElements[focusableElements.length - 1];
  } else if (nextIndex >= focusableElements.length) {
    return focusableElements[0];
  }

  return focusableElements[nextIndex];
};

/**
 * Restore focus to a previously focused element
 * Useful for modals and dialogs
 * 
 * @param element - The element to restore focus to
 */
export const restoreFocus = (element: HTMLElement | null): void => {
  if (element && isElementFocusable(element)) {
    element.focus();
  }
};

/**
 * Generate a unique ID for accessibility attributes
 * 
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
let idCounter = 0;
export const generateA11yId = (prefix: string = 'a11y'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

/**
 * Check if user prefers reduced motion
 * 
 * @returns True if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers high contrast
 * 
 * @returns True if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Calculate color contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 * 
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color contrast meets WCAG AA standards
 * 
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets WCAG AA standards
 */
export const meetsWCAGAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
};

/**
 * Check if color contrast meets WCAG AAA standards
 * 
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets WCAG AAA standards
 */
export const meetsWCAGAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 4.5 : 7;
  return ratio >= requiredRatio;
};

/**
 * Keyboard event handler for roving tabindex pattern
 * Useful for toolbars, menus, and tab lists
 * 
 * @param event - Keyboard event
 * @param elements - Array of elements in the group
 * @param currentIndex - Index of currently focused element
 * @param onChange - Callback when focus changes
 * @param orientation - Orientation of the group ('horizontal' or 'vertical')
 */
export const handleRovingTabindex = (
  event: React.KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  onChange: (newIndex: number) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): void => {
  let nextIndex = currentIndex;

  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  switch (event.key) {
    case prevKey:
      event.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      break;
    case nextKey:
      event.preventDefault();
      nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      event.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      nextIndex = elements.length - 1;
      break;
    default:
      return;
  }

  onChange(nextIndex);
  elements[nextIndex]?.focus();
};

/**
 * Prevent body scroll when modal/dialog is open
 * 
 * @param prevent - Whether to prevent scroll
 */
export const preventBodyScroll = (prevent: boolean): void => {
  if (prevent) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

/**
 * Get accessible name for an element
 * Checks aria-label, aria-labelledby, and text content
 * 
 * @param element - The element to get the name for
 * @returns The accessible name or empty string
 */
export const getAccessibleName = (element: HTMLElement): string => {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check text content
  return element.textContent || '';
};
