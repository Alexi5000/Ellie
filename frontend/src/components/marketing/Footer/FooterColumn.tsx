import React from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { FooterLink } from './Footer';

export interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  className?: string;
}

/**
 * FooterColumn component for individual footer columns
 * 
 * Features:
 * - Displays a column title and list of links
 * - Supports both internal (React Router) and external links
 * - Accessible focus states
 * - Logical tab order
 * - Dark mode support
 * 
 * @example
 * ```tsx
 * <FooterColumn
 *   title="Product"
 *   links={[
 *     { label: 'Features', href: '/features' },
 *     { label: 'Pricing', href: '/pricing' },
 *   ]}
 * />
 * ```
 */
export const FooterColumn: React.FC<FooterColumnProps> = ({
  title,
  links,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const transitionClass = prefersReducedMotion ? '' : 'transition-colors duration-200';

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  text-sm text-text-secondary hover:text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 rounded-sm
                  inline-block
                  ${transitionClass}
                `}
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.href}
                className={`
                  text-sm text-text-secondary hover:text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 rounded-sm
                  inline-block
                  ${transitionClass}
                `}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
