import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { NavLink } from './Header';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationLinks: NavLink[];
}

/**
 * MobileMenu component with focus trap
 * 
 * Features:
 * - Slide-in animation from top
 * - Focus trap when open
 * - Keyboard navigation (Escape to close)
 * - Accessible ARIA attributes
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * <MobileMenu
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   navigationLinks={links}
 * />
 * ```
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navigationLinks,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Focus first element when menu opens
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on Escape
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap with Tab
      if (event.key === 'Tab') {
        const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const transitionClass = prefersReducedMotion 
    ? '' 
    : 'animate-slide-down';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden ${
          prefersReducedMotion ? '' : 'animate-fade-in'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className={`
          fixed top-16 left-0 right-0 z-50
          bg-background-primary border-b border-border-primary
          shadow-lg md:hidden
          ${transitionClass}
        `}
      >
        <div className="px-4 py-6 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Navigation Links */}
          {navigationLinks.map((link, index) => (
            link.external ? (
              <a
                key={link.label}
                ref={index === 0 ? firstFocusableRef : undefined}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`
                  block px-4 py-3 rounded-md text-base font-medium
                  text-text-secondary hover:text-text-primary hover:bg-background-secondary
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                  ${prefersReducedMotion ? '' : 'transition-colors duration-200'}
                `}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                ref={index === 0 ? firstFocusableRef : undefined}
                to={link.href}
                onClick={onClose}
                className={`
                  block px-4 py-3 rounded-md text-base font-medium
                  text-text-secondary hover:text-text-primary hover:bg-background-secondary
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                  ${prefersReducedMotion ? '' : 'transition-colors duration-200'}
                `}
              >
                {link.label}
              </Link>
            )
          ))}

          {/* Dashboard Button */}
          <div className="pt-4 border-t border-border-primary">
            <Link
              to="/dashboard"
              onClick={onClose}
              className={`
                block w-full px-4 py-3 rounded-full text-base font-medium text-center
                bg-accent-primary text-white
                hover:bg-accent-primary/90
                focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                ${prefersReducedMotion ? '' : 'transition-colors duration-200'}
              `}
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
