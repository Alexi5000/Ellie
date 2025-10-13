# Implementation Plan

- [x] 1. Set up theme system and CSS variables

  - Create ThemeProvider context with localStorage persistence and system preference detection
  - Define CSS variables for light and dark themes in theme.css
  - Update tailwind.config.js to use CSS variables and enable dark mode class strategy
  - Create useTheme hook for accessing theme state
  - Create useReducedMotion hook for respecting motion preferences
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Install required dependencies

  - Install framer-motion for animations
  - Install react-syntax-highlighter and types for code highlighting
  - Verify all dependencies are compatible with existing setup
  - Update package.json with new dependencies
  - _Requirements: 13.5_

- [x] 3. Create ThemeToggle component

  - Build ThemeToggle button component with sun/moon icons
  - Implement keyboard navigation and focus states
  - Add tooltip for accessibility
  - Respect prefers-reduced-motion for transitions
  - Create unit tests for ThemeToggle
  - _Requirements: 1.2, 1.3, 1.4, 2.6, 2.7, 2.8_

- [x] 4. Build Header component with sticky navigation

  - Create Header component with sticky positioning and backdrop blur
  - Implement navigation links array (Custom Agents, Pricing, Docs, Resources, Careers, Enterprise)
  - Add "Open Dashboard" pill button on the right
  - Implement keyboard navigation with visible focus states
  - Create MobileMenu component with hamburger toggle
  - Add focus trap for mobile menu
  - Create unit tests for Header and MobileMenu
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 5. Create Hero component with split layout

  - Build Hero component with two-column layout (content left, animation right)
  - Add headline "Voice AI assistant for developers"
  - Add supporting sentence with value proposition
  - Create primary CTA button "Sign up"
  - Create secondary button "Read the docs"
  - Create large prominent button "Talk to Ellie"
  - Implement responsive stacking for mobile
  - Create unit tests for Hero
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.10, 3.11_

- [x] 6. Build AnimatedOrb component with Framer Motion

  - Create AnimatedOrb component using Framer Motion
  - Implement mic-reactive visual feedback with spring animations
  - Add fallback for prefers-reduced-motion (static or minimal animation)
  - Optimize performance with will-change and contain CSS properties
  - Create unit tests for AnimatedOrb
  - _Requirements: 3.7, 3.8, 3.9_

- [x] 7. Create CodeTabs component with syntax highlighting

  - Build CodeTabs component with tab interface
  - Create tabs for TypeScript, Python, cURL, and React
  - Integrate react-syntax-highlighter for code display
  - Add copy-to-clipboard functionality with confirmation
  - Implement keyboard navigation with arrow keys
  - Add visible focus indicators for tabs
  - Create responsive horizontal scroll for mobile
  - Populate with "start a call" code snippets using placeholders
  - Create unit tests for CodeTabs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 8. Build LogosStrip component

  - Create LogosStrip component with horizontal layout
  - Add company/technology logos with descriptive alt text
  - Implement automatic dark mode logo switching
  - Add responsive wrapping for narrow viewports
  - Implement even spacing and consistent sizing
  - Add optional hover effects (scale or opacity)
  - Create unit tests for LogosStrip
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Create KPIBand component with count-up animations

  - Build KPIBand component with three statistics
  - Create KPIStat component for individual stats
  - Implement useCountUp hook with easing function
  - Add Intersection Observer to trigger animations on viewport entry
  - Display large numerals (150M+, 1.5M+, 350K+) with labels
  - Add fallback for prefers-reduced-motion (instant display)
  - Implement responsive stacking for mobile
  - Create unit tests for KPIBand and useCountUp hook
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

-

- [x] 10. Build Solutions component with tabbed interface

  - Create Solutions component with Inbound/Outbound tabs
  - Build FlowDiagram component with SVG-based node rendering
  - Implement tab switching with smooth transitions
  - Add short paragraph descriptions for each solution
  - Create simple node-flow diagram (Receive → Use tool → Condition)
  - Add "Case study" and "Try it now" buttons
  - Implement responsive diagram scaling for mobile
  - Add fallback for prefers-reduced-motion (instant transitions)
  - Create unit tests for Solutions and FlowDiagram
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [x] 11. Create Explainer component with step cards

  - Build Explainer component with headline "Try in minutes. Deploy in days."
  - Create StepCard component for individual steps
  - Add three cards: "Choose your workflow", "Plug it in", "Done"
  - Include icons and short descriptive copy (2-3 sentences) for each step
  - Implement horizontal layout on desktop, vertical on mobile
  - Add optional staggered entrance animations
  - Add fallback for prefers-reduced-motion (instant display)
  - Create unit tests for Explainer and StepCard
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [x] 12. Build Features component with grid layout

  - Create Features component with responsive grid
  - Build FeatureCard component for individual features
  - Add six features: Multilingual, API-native, Automated testing, Bring your own models, Tool calling, A/B experiments
  - Include consistent icons and two-line descriptions for each feature
  - Implement 3-column desktop, 2-column tablet, 1-column mobile layout
  - Add optional hover effects (lift or glow)
  - Ensure consistent card heights
  - Create unit tests for Features and FeatureCard
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [x] 13. Create Reliability component with proof-point cards


  - Build Reliability component with horizontal card layout
  - Create MetricCard component for individual metrics
  - Add four metrics: "99.99% uptime", "Sub-500ms latency", "AI guardrails", "SOC2, HIPAA, PCI compliant"
  - Include icons/badges for each metric
  - Style as informational cards, not guarantees
  - Implement responsive wrapping for mobile
  - Create unit tests for Reliability and MetricCard
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [-] 14. Build Footer component with multi-column layout




  - Create Footer component with semantic HTML (<footer>, <nav>)
  - Build FooterColumn component for individual columns
  - Add five columns: Product, Solutions, Resources, Company, Legal
  - Include skip-to-content link for screen readers
  - Implement logical tab order (left to right, top to bottom)
  - Add visible focus indicators for all links
  - Implement responsive stacking or accordion for mobile
  - Add copyright notice and social media links
  - Apply appropriate dark mode styling
  - Create unit tests for Footer and FooterColumn
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [ ] 15. Create MarketingPage layout component

  - Build MarketingPage component that composes all marketing components
  - Integrate Header, Hero, CodeTabs, LogosStrip, KPIBand, Solutions, Explainer, Features, Reliability, Footer
  - Ensure proper spacing and section breaks
  - Add section IDs for anchor navigation
  - Implement lazy loading for below-the-fold components
  - Create integration tests for MarketingPage
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 16. Update App.tsx and routing

  - Update App.tsx to wrap with ThemeProvider
  - Update landing page route to use MarketingPage
  - Ensure existing routes (dashboard, health) still work
  - Verify routing structure is maintained
  - Create integration tests for routing
  - _Requirements: 13.1, 13.3, 13.4_

- [ ] 17. Implement performance optimizations

  - Add code splitting for marketing components using React.lazy
  - Implement lazy loading for Framer Motion
  - Add font preloading in index.html
  - Optimize images with width/height attributes
  - Add CSS contain properties for isolated components
  - Use will-change sparingly for animated elements
  - Create performance tests to verify optimizations
  - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 18. Implement accessibility features

  - Ensure all interactive elements are keyboard accessible
  - Add ARIA labels for icon buttons
  - Implement focus trap for mobile menu
  - Add skip-to-content link
  - Verify semantic HTML structure
  - Test with screen reader
  - Ensure visible focus indicators (2px outline)
  - Verify logical tab order throughout
  - Create accessibility tests
  - _Requirements: 12.8, 12.9, 12.10, 11.4, 11.5, 11.6_

- [ ] 19. Create custom hooks

  - Create useIntersectionObserver hook for scroll-triggered animations
  - Create useClipboard hook for copy-to-clipboard functionality
  - Create useMediaQuery hook for responsive behavior
  - Create useKeyboardNavigation hook for tab/arrow key handling
  - Add unit tests for all custom hooks
  - _Requirements: 6.6, 4.7, 4.8_

- [ ] 20. Add comprehensive testing

  - Write unit tests for all new components (aim for 80%+ coverage)
  - Write integration tests for theme switching
  - Write integration tests for navigation flow
  - Write integration tests for interactive elements
  - Create accessibility tests (keyboard navigation, screen reader, color contrast)
  - Add visual regression tests for theme switching
  - _Requirements: 12.1, 12.2, 12.8, 12.9, 12.10_

- [ ] 21. Run Lighthouse audits and optimize

  - Run Lighthouse audit for performance (target 90+)
  - Run Lighthouse audit for accessibility (target 90+)
  - Run Lighthouse audit for best practices (target 90+)
  - Run Lighthouse audit for SEO (target 90+)
  - Verify Core Web Vitals (CLS < 0.1, FID < 100ms, LCP < 2.5s)
  - Optimize based on audit results
  - Document final scores
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 22. Cross-browser testing

  - Test on Chrome/Edge (last 2 versions)
  - Test on Firefox (last 2 versions)
  - Test on Safari (last 2 versions)
  - Test on Mobile Safari (iOS 14+)
  - Test on Chrome Android (last 2 versions)
  - Document any browser-specific issues and fixes
  - _Requirements: 13.7_

- [ ] 23. Create documentation

  - Document theme system usage
  - Document component API and props
  - Create style guide for marketing components
  - Document accessibility features
  - Create deployment guide for marketing site
  - Add README for marketing components directory
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ] 24. Final integration and polish
  - Verify all components work together seamlessly
  - Test theme switching across all components
  - Verify responsive behavior on all breakpoints
  - Test all interactive elements (buttons, tabs, animations)
  - Verify all links and navigation work correctly
  - Polish animations and transitions
  - Fix any remaining bugs or issues
  - _Requirements: 1.1-13.8_
