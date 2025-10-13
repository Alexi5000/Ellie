import React from 'react';
import { FooterColumn } from './FooterColumn';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumnData {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterProps {
  columns?: FooterColumnData[];
  socialLinks?: SocialLink[];
  copyrightText?: string;
  className?: string;
}

const defaultColumns: FooterColumnData[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API', href: '/api', external: true },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Inbound Calls', href: '/solutions/inbound' },
      { label: 'Outbound Calls', href: '/solutions/outbound' },
      { label: 'Custom Agents', href: '/custom-agents' },
      { label: 'Enterprise', href: '/enterprise' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs', external: true },
      { label: 'Guides', href: '/guides' },
      { label: 'Blog', href: '/blog' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Community', href: '/community', external: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' },
    ],
  },
];

const defaultSocialLinks: SocialLink[] = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/ellie',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://github.com/ellie',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/ellie',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
      </svg>
    ),
  },
];

/**
 * Footer component with multi-column layout
 * 
 * Features:
 * - Semantic HTML with <footer> and <nav> landmarks
 * - Multi-column layout with responsive stacking
 * - Skip-to-content link for screen readers
 * - Logical tab order (left to right, top to bottom)
 * - Visible focus indicators
 * - Social media links
 * - Copyright notice
 * - Dark mode support
 * 
 * @example
 * ```tsx
 * <Footer />
 * <Footer copyrightText="© 2024 Ellie AI" />
 * ```
 */
export const Footer: React.FC<FooterProps> = ({
  columns = defaultColumns,
  socialLinks = defaultSocialLinks,
  copyrightText = `© ${new Date().getFullYear()} Ellie AI. All rights reserved.`,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const transitionClass = prefersReducedMotion ? '' : 'transition-colors duration-200';

  return (
    <footer
      className={`
        bg-background-secondary border-t border-border-primary
        ${className}
      `}
      role="contentinfo"
    >
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"
      >
        Skip to content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Columns */}
        <nav
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8"
          aria-label="Footer navigation"
        >
          {columns.map((column, index) => (
            <FooterColumn
              key={column.title}
              title={column.title}
              links={column.links}
              className={index >= 2 ? 'col-span-2 md:col-span-1' : ''}
            />
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-border-primary my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Copyright */}
          <p className="text-sm text-text-tertiary">
            {copyrightText}
          </p>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  text-text-tertiary hover:text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 rounded-md
                  ${transitionClass}
                `}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
