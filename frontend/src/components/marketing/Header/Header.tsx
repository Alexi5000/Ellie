import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface HeaderProps {
  transparent?: boolean;
  className?: string;
}

const navigationLinks: NavLink[] = [
  { label: 'Custom Agents', href: '/custom-agents' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs', external: true },
  { label: 'Resources', href: '/resources' },
  { label: 'Careers', href: '/careers' },
  { label: 'Enterprise', href: '/enterprise' },
];

/**
 * Header component with sticky navigation
 * 
 * Features:
 * - Sticky positioning with backdrop blur
 * - Responsive hamburger menu on mobile
 * - Keyboard navigation support
 * - Theme toggle integration
 * - Accessible focus states
 * 
 * @example
 * ```tsx
 * <Header />
 * <Header transparent />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({ 
  transparent = false, 
  className = '' 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const transitionClass = prefersReducedMotion 
    ? '' 
    : 'transition-all duration-300';

  const headerBgClass = transparent && !isScrolled
    ? 'bg-transparent'
    : 'bg-background-primary/80 backdrop-blur-md border-b border-border-primary';

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        ${headerBgClass}
        ${transitionClass}
        ${className}
      `}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold text-text-primary hover:text-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Ellie home"
            >
              Ellie
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigationLinks.map((link) => (
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium
                    text-text-secondary hover:text-text-primary hover:bg-background-secondary
                    focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                    ${transitionClass}
                  `}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium
                    text-text-secondary hover:text-text-primary hover:bg-background-secondary
                    focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                    ${transitionClass}
                  `}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                bg-accent-primary text-white
                hover:bg-accent-primary/90
                focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                ${transitionClass}
              `}
            >
              Open Dashboard
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleMobileMenuToggle}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className={`
                p-2 rounded-md
                text-text-primary hover:bg-background-secondary
                focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
                ${transitionClass}
              `}
            >
              {/* Hamburger Icon */}
              {!isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                /* Close Icon */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        navigationLinks={navigationLinks}
      />
    </header>
  );
};
