# Requirements Document

## Introduction

This specification defines the requirements for transforming the Ellie Voice Receptionist frontend from a functional application interface into a dark, developer-centric marketing website. The redesign will maintain the existing React 18 + TypeScript + Vite + Tailwind stack while introducing a modern, professional marketing experience that appeals to developers and technical decision-makers.

The marketing site will showcase Ellie's capabilities through interactive demonstrations, code examples, and clear value propositions, while maintaining excellent accessibility, performance, and user experience standards.

## Requirements

### Requirement 1: Dark Theme System

**User Story:** As a developer visiting the site, I want a dark theme that's easy on my eyes and matches modern developer tools, so that I can comfortably browse the site for extended periods.

#### Acceptance Criteria

1. WHEN the site loads THEN the system SHALL detect the user's color scheme preference using `prefers-color-scheme`
2. WHEN a user toggles the theme THEN the system SHALL persist the preference to localStorage
3. WHEN the theme changes THEN all components SHALL transition smoothly using CSS transitions
4. IF the user has `prefers-reduced-motion` enabled THEN the system SHALL disable theme transition animations
5. WHEN using dark mode THEN all text SHALL maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
6. WHEN using light mode THEN all text SHALL maintain WCAG AA contrast ratios
7. WHEN the theme is applied THEN the system SHALL use Tailwind's dark variant strategy with CSS variables
8. WHEN colors are defined THEN the system SHALL use semantic color tokens (e.g., `--color-bg-primary`, `--color-text-primary`)

### Requirement 2: Sticky Navigation Header

**User Story:** As a visitor navigating the site, I want a persistent header that stays accessible as I scroll, so that I can quickly access different sections without scrolling back to the top.

#### Acceptance Criteria

1. WHEN the page loads THEN the header SHALL be visible at the top with translucent background
2. WHEN the user scrolls down THEN the header SHALL remain fixed at the top with backdrop blur effect
3. WHEN the header is displayed THEN it SHALL show the logo text "Ellie" on the left
4. WHEN the header is displayed THEN it SHALL show navigation links: Custom Agents, Pricing, Docs, Resources, Careers, Enterprise
5. WHEN the header is displayed THEN it SHALL show a right-aligned pill button "Open Dashboard"
6. WHEN a user navigates with keyboard THEN all interactive elements SHALL be reachable via Tab key
7. WHEN an element receives focus THEN it SHALL display a visible focus indicator with 2px outline
8. WHEN a user presses Enter or Space on a focused link THEN it SHALL navigate to the target
9. IF `prefers-reduced-motion` is enabled THEN hover and focus transitions SHALL be instant
10. WHEN the viewport is mobile THEN the header SHALL collapse into a hamburger menu

### Requirement 3: Split Hero Section

**User Story:** As a potential customer, I want to immediately understand what Ellie does and see it in action, so that I can quickly determine if it meets my needs.

#### Acceptance Criteria

1. WHEN the hero section loads THEN it SHALL display a two-column layout on desktop
2. WHEN the left column renders THEN it SHALL show the headline "Voice AI assistant for developers"
3. WHEN the left column renders THEN it SHALL show a supporting sentence explaining the value proposition
4. WHEN the left column renders THEN it SHALL show a primary CTA button "Sign up"
5. WHEN the left column renders THEN it SHALL show a secondary button "Read the docs"
6. WHEN the left column renders THEN it SHALL show a large prominent button "Talk to Ellie"
7. WHEN the right column renders THEN it SHALL display an animated mic-reactive equalizer/orb
8. WHEN the orb animation plays THEN it SHALL use Framer Motion for smooth animations
9. IF `prefers-reduced-motion` is enabled THEN the orb SHALL display a static or minimal animation
10. WHEN the viewport is mobile THEN the hero SHALL stack vertically with left column on top
11. WHEN the "Talk to Ellie" button is clicked THEN it SHALL trigger the voice interaction demo

### Requirement 4: Code Snippet Tabs

**User Story:** As a developer evaluating Ellie, I want to see code examples in my preferred language, so that I can understand how to integrate it quickly.

#### Acceptance Criteria

1. WHEN the code section loads THEN it SHALL display tabs for TypeScript, Python, cURL, and React
2. WHEN a tab is clicked THEN it SHALL display the corresponding code snippet
3. WHEN a code snippet is displayed THEN it SHALL show syntax highlighting appropriate for the language
4. WHEN a code snippet is displayed THEN it SHALL include a "start a call" example
5. WHEN a code snippet references configuration THEN it SHALL use placeholder values (e.g., `ASSISTANT_ID`, `process.env.ELLIE_API_KEY`)
6. WHEN a code snippet is displayed THEN it SHALL include a copy button
7. WHEN the copy button is clicked THEN it SHALL copy the code to clipboard and show confirmation
8. WHEN tabs are navigated with keyboard THEN arrow keys SHALL move between tabs
9. WHEN a tab receives focus THEN it SHALL display a visible focus indicator
10. WHEN the viewport is mobile THEN tabs SHALL remain horizontal with scroll if needed

### Requirement 5: Credibility Logos Strip

**User Story:** As a decision-maker, I want to see which companies trust Ellie, so that I can feel confident in choosing this solution.

#### Acceptance Criteria

1. WHEN the logos section loads THEN it SHALL display company/technology logos in a horizontal strip
2. WHEN logos are displayed THEN each SHALL have descriptive alt text
3. WHEN in dark mode THEN logos SHALL maintain high contrast (use inverted or white versions)
4. WHEN the viewport is narrow THEN logos SHALL wrap to multiple rows
5. WHEN logos are displayed THEN they SHALL be evenly spaced with consistent sizing
6. WHEN a logo is hovered THEN it MAY show a subtle scale or opacity effect

### Requirement 6: KPI Statistics Band

**User Story:** As a visitor, I want to see Ellie's scale and adoption metrics, so that I can understand its market validation.

#### Acceptance Criteria

1. WHEN the KPI section loads THEN it SHALL display three statistics: Calls, Assistants Launched, Developers
2. WHEN statistics are displayed THEN they SHALL show large numerals (e.g., "150M+", "1.5M+", "350K+")
3. WHEN the KPI section enters the viewport THEN numbers SHALL animate from 0 to target value
4. WHEN the count-up animation plays THEN it SHALL use an easing function for smooth acceleration
5. IF `prefers-reduced-motion` is enabled THEN numbers SHALL appear instantly without animation
6. WHEN the animation triggers THEN it SHALL use Intersection Observer to detect visibility
7. WHEN statistics are displayed THEN each SHALL have a descriptive label below the number
8. WHEN the viewport is mobile THEN statistics SHALL stack vertically or wrap

### Requirement 7: Solutions Section with Tabs

**User Story:** As a user exploring use cases, I want to see how Ellie handles different scenarios, so that I can identify which solution fits my needs.

#### Acceptance Criteria

1. WHEN the solutions section loads THEN it SHALL display two tabs: "Inbound" and "Outbound"
2. WHEN a tab is selected THEN it SHALL display a short paragraph describing the solution
3. WHEN a tab is selected THEN it SHALL display a simple node-flow diagram (Receive → Use tool → Condition)
4. WHEN a flow diagram is displayed THEN nodes SHALL be connected with arrows or lines
5. WHEN a tab is selected THEN it SHALL display a "Case study" button
6. WHEN a tab is selected THEN it SHALL display a "Try it now" button
7. WHEN tabs are switched THEN content SHALL transition smoothly with fade or slide animation
8. IF `prefers-reduced-motion` is enabled THEN tab transitions SHALL be instant
9. WHEN buttons are clicked THEN they SHALL navigate to appropriate pages or trigger modals
10. WHEN the viewport is mobile THEN the flow diagram SHALL scale or simplify appropriately

### Requirement 8: Three-Step Explainer

**User Story:** As a developer, I want to understand how quickly I can get started with Ellie, so that I can assess the implementation effort.

#### Acceptance Criteria

1. WHEN the explainer section loads THEN it SHALL display the headline "Try in minutes. Deploy in days."
2. WHEN the explainer section loads THEN it SHALL display three cards
3. WHEN cards are displayed THEN they SHALL show: "Choose your workflow", "Plug it in", "Done"
4. WHEN each card is displayed THEN it SHALL include an icon representing the step
5. WHEN each card is displayed THEN it SHALL include short descriptive copy (2-3 sentences max)
6. WHEN cards are displayed THEN they SHALL be evenly spaced in a horizontal row on desktop
7. WHEN the viewport is mobile THEN cards SHALL stack vertically
8. WHEN cards enter the viewport THEN they MAY animate in with staggered timing
9. IF `prefers-reduced-motion` is enabled THEN cards SHALL appear instantly

### Requirement 9: Features Grid

**User Story:** As a technical evaluator, I want to see all key features at a glance, so that I can quickly assess if Ellie meets my requirements.

#### Acceptance Criteria

1. WHEN the features section loads THEN it SHALL display a grid of feature cards
2. WHEN the grid is displayed THEN it SHALL include: Multilingual, API-native, Automated testing, Bring your own models, Tool calling, A/B experiments
3. WHEN each feature card is displayed THEN it SHALL show a consistent icon
4. WHEN each feature card is displayed THEN it SHALL show a feature name as heading
5. WHEN each feature card is displayed THEN it SHALL show a two-line description
6. WHEN the grid is displayed on desktop THEN it SHALL show 3 columns
7. WHEN the grid is displayed on tablet THEN it SHALL show 2 columns
8. WHEN the grid is displayed on mobile THEN it SHALL show 1 column
9. WHEN a feature card is hovered THEN it MAY show a subtle lift or glow effect
10. WHEN feature cards are displayed THEN they SHALL maintain consistent height

### Requirement 10: Reliability & Compliance Band

**User Story:** As a compliance officer or technical lead, I want to see Ellie's reliability and compliance credentials, so that I can assess risk and regulatory fit.

#### Acceptance Criteria

1. WHEN the reliability section loads THEN it SHALL display proof-point cards
2. WHEN cards are displayed THEN they SHALL show: "99.99% uptime", "Sub-500ms latency", "AI guardrails", "SOC2, HIPAA, PCI compliant"
3. WHEN cards are displayed THEN they SHALL be rendered as informational cards, not guarantees
4. WHEN each card is displayed THEN it SHALL include an icon or badge
5. WHEN each card is displayed THEN it SHALL include the metric or certification name
6. WHEN cards are displayed THEN they SHALL be evenly spaced in a horizontal row on desktop
7. WHEN the viewport is mobile THEN cards SHALL wrap or stack
8. WHEN cards are displayed THEN they SHALL use subtle styling to indicate they are proof points

### Requirement 11: Multi-Column Footer

**User Story:** As a visitor, I want easy access to all site sections and legal information from the footer, so that I can navigate efficiently and find important policies.

#### Acceptance Criteria

1. WHEN the footer loads THEN it SHALL display multiple columns: Product, Solutions, Resources, Company, Legal
2. WHEN each column is displayed THEN it SHALL show a heading and list of links
3. WHEN the footer is rendered THEN it SHALL use semantic HTML with `<footer>` landmark
4. WHEN the footer is rendered THEN it SHALL include a "skip to content" link for screen readers
5. WHEN links are navigated with keyboard THEN tab order SHALL be logical (left to right, top to bottom)
6. WHEN links receive focus THEN they SHALL display visible focus indicators
7. WHEN the viewport is mobile THEN columns SHALL stack vertically or collapse into accordions
8. WHEN the footer is displayed THEN it SHALL include copyright notice and social media links
9. WHEN the footer is displayed in dark mode THEN it SHALL use appropriate dark background color

### Requirement 12: Accessibility & Performance

**User Story:** As a user with accessibility needs or slow connection, I want the site to be accessible and performant, so that I can use it effectively regardless of my circumstances.

#### Acceptance Criteria

1. WHEN the site loads THEN it SHALL achieve a Lighthouse accessibility score of 90+
2. WHEN the site loads THEN it SHALL achieve a Lighthouse performance score of 90+
3. WHEN the site loads THEN Cumulative Layout Shift (CLS) SHALL be < 0.1
4. WHEN the site loads THEN First Input Delay (FID) SHALL be < 100ms
5. WHEN fonts are loaded THEN they SHALL be preloaded to prevent FOUT
6. WHEN animations are used THEN they SHALL be lazy-loaded when possible
7. WHEN images are used THEN they SHALL include width and height attributes to prevent CLS
8. WHEN the site is navigated with keyboard THEN all interactive elements SHALL be reachable
9. WHEN the site is used with screen reader THEN all content SHALL be announced appropriately
10. WHEN the site is tested THEN it SHALL pass WCAG 2.1 Level AA standards

### Requirement 13: Build & Development

**User Story:** As a developer maintaining the site, I want the build process to remain unchanged, so that existing workflows continue to work.

#### Acceptance Criteria

1. WHEN the project is built THEN it SHALL use the existing Vite configuration
2. WHEN the project is developed THEN it SHALL use the existing React 18 setup
3. WHEN styles are applied THEN they SHALL use Tailwind CSS exclusively
4. WHEN the project is built THEN it SHALL maintain the existing routing structure
5. WHEN dependencies are added THEN they SHALL be minimal and well-justified
6. WHEN the project is built THEN it SHALL produce optimized production bundles
7. WHEN the project is tested THEN existing test infrastructure SHALL continue to work
8. WHEN the project is deployed THEN it SHALL work with the existing Docker/nginx setup
