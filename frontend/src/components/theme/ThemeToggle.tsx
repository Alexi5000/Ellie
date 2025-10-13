import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * ThemeToggle component - A button to toggle between light and dark themes
 * 
 * Features:
 * - Sun/moon icons for visual feedback
 * - Keyboard navigation support
 * - Accessible tooltip
 * - Respects prefers-reduced-motion
 * - ARIA labels for screen readers
 * 
 * @example
 * ```tsx
 * <ThemeToggle />
 * <ThemeToggle showLabel />
 * <ThemeToggle className="custom-class" />
 * ```
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [showTooltip, setShowTooltip] = useState(false);

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const handleClick = () => {
    toggleTheme();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Support Enter and Space keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTheme();
    }
  };

  const transitionClass = prefersReducedMotion 
    ? '' 
    : 'transition-all duration-200';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={label}
        className={`
          flex items-center gap-2 p-2 rounded-lg
          bg-background-secondary hover:bg-background-tertiary
          border border-border-primary
          focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
          ${transitionClass}
          ${className}
        `}
      >
        {/* Sun Icon (Light Mode) */}
        {!isDark && (
          <svg
            className={`w-5 h-5 text-text-primary ${transitionClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}

        {/* Moon Icon (Dark Mode) */}
        {isDark && (
          <svg
            className={`w-5 h-5 text-text-primary ${transitionClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}

        {/* Optional Label */}
        {showLabel && (
          <span className={`text-sm font-medium text-text-primary ${transitionClass}`}>
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            px-3 py-1.5 rounded-md
            bg-background-tertiary border border-border-primary
            text-sm text-text-primary whitespace-nowrap
            pointer-events-none z-50
            ${prefersReducedMotion ? '' : 'animate-fade-in'}
          `}
        >
          {label}
          {/* Tooltip Arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--color-border-primary)',
            }}
          />
        </div>
      )}
    </div>
  );
};
