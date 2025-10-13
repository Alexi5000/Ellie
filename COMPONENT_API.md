# Component API Reference

Complete API reference for all marketing components in the Ellie marketing website.

## Table of Contents

- [Theme Components](#theme-components)
- [Layout Components](#layout-components)
- [Content Components](#content-components)
- [Interactive Components](#interactive-components)
- [Utility Components](#utility-components)

## Theme Components

### ThemeProvider

Context provider for theme management.

**Import:**
```typescript
import { ThemeProvider } from './contexts/ThemeContext';
```

**Props:**
```typescript
interface ThemeProviderProps {
  children: ReactNode;
}
```

**Usage:**
```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Features:**
- Detects system color scheme preference
- Persists theme to localStorage
- Provides theme state and controls
- Listens for system theme changes

---

### ThemeToggle

Button component to toggle between light and dark themes.

**Import:**
```typescript
import { ThemeToggle } from './components/theme/ThemeToggle';
```

**Props:**
```typescript
interface ThemeToggleProps {
  className?: string;      // Additional CSS classes
  showLabel?: boolean;     // Show text label (default: false)
}
```

**Usage:**
```tsx
<ThemeToggle />
<ThemeToggle showLabel />
<ThemeToggle className="ml-4" />
```

**Features:**
- Sun/moon icons for visual feedback
- Keyboard navigation support
- Accessible tooltip
- Respects prefers-reduced-motion
- ARIA labels for screen readers

**Accessibility:**
- `aria-label` for button
- `aria-hidden` for decorative icons
- Keyboard accessible (Tab, Enter, Space)
- Visible focus indicator

---

## Layout Components

### Header

Sticky navigation header with responsive mobile menu.

**Import:**
```typescript
import { Header } from './components/marketing/Header';
```

**Props:**
```typescript
interface HeaderProps {
  transparent?: boolean;   // Use transparent background (default: false)
  className?: string;      // Additional CSS classes
}

interface NavLink {
  label: string;          // Link text
  href: string;           // Link URL
  external?: boolean;     // Open in new tab (default: false)
}
```

**Usage:**
```tsx
<Header />
<Header transparent />
<Header className="custom-class" />
```

**Features:**
- Sticky positioning with backdrop blur
- Responsive hamburger menu on mobile
- Theme toggle integration
- Keyboard navigation support
- Focus trap in mobile menu
- Accessible focus states

**Navigation Links:**
- Custom Agents
- Pricing
- Docs (external)
- Resources
- Careers
- Enterprise

**Accessibility:**
- `<nav>` landmark with `aria-label`
- Keyboard accessible
- Focus indicators
- `aria-expanded` for mobile menu
- `aria-controls` for menu button

---

### Footer

Multi-column footer with navigation links and social media.

**Import:**
```typescript
import { Footer } from './components/marketing/Footer';
```

**Props:**
```typescript
interface FooterProps {
  columns: FooterColumn[];        // Array of footer columns
  socialLinks?: SocialLink[];     // Social media links
  copyrightText?: string;         // Copyright text
  className?: string;             // Additional CSS classes
}

interface FooterColumn {
  title: string;                  // Column heading
  links: FooterLink[];            // Array of links
}

interface FooterLink {
  label: string;                  // Link text
  href: string;                   // Link URL
  external?: boolean;             // Open in new tab
}

interface SocialLink {
  platform: string;               // Platform name
  url: string;                    // Profile URL
  icon: React.ReactNode;          // Icon component
}
```

**Usage:**
```tsx
<Footer
  columns={[
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' }
      ]
    }
  ]}
  socialLinks={[
    { platform: 'Twitter', url: 'https://twitter.com/ellie', icon: <TwitterIcon /> }
  ]}
  copyrightText="© 2024 Ellie"
/>
```

**Features:**
- Multi-column layout
- Semantic HTML (`<footer>`, `<nav>`)
- Skip-to-content link
- Logical tab order
- Responsive stacking on mobile
- Social media integration

**Accessibility:**
- `<footer>` landmark
- Skip-to-content link
- Keyboard navigation
- Focus indicators
- Logical tab order

---

## Content Components

### Hero

Split-layout hero section with animated orb.

**Import:**
```typescript
import { Hero } from './components/marketing/Hero';
```

**Props:**
```typescript
interface HeroProps {
  onTalkToEllie?: () => void;    // Callback for "Talk to Ellie" button
  className?: string;             // Additional CSS classes
}
```

**Usage:**
```tsx
<Hero onTalkToEllie={() => console.log('Talk to Ellie clicked')} />
```

**Features:**
- Two-column responsive layout
- Animated orb with Framer Motion
- Multiple CTA buttons
- Reduced motion support
- Responsive stacking on mobile

**Content:**
- Headline: "Voice AI assistant for developers"
- Supporting text
- Primary CTA: "Sign up"
- Secondary CTA: "Read the docs"
- Prominent CTA: "Talk to Ellie"
- Animated orb visualization

**Accessibility:**
- Semantic HTML
- Keyboard accessible buttons
- Focus indicators
- Respects prefers-reduced-motion

---

### Features

Responsive grid of feature cards.

**Import:**
```typescript
import { Features } from './components/marketing/Features';
```

**Props:**
```typescript
interface FeaturesProps {
  features: Feature[];           // Array of features
  columns?: 2 | 3 | 4;          // Desktop columns (default: 3)
  className?: string;            // Additional CSS classes
}

interface Feature {
  id: string;                    // Unique identifier
  name: string;                  // Feature name
  description: string;           // Feature description
  icon: React.ReactNode;         // Icon component
}
```

**Usage:**
```tsx
<Features
  features={[
    {
      id: 'multilingual',
      name: 'Multilingual',
      description: 'Support for 40+ languages with native accent detection.',
      icon: <GlobeIcon />
    },
    {
      id: 'api-native',
      name: 'API-native',
      description: 'RESTful API with comprehensive SDKs.',
      icon: <CodeIcon />
    }
  ]}
  columns={3}
/>
```

**Features:**
- Responsive grid layout (3 cols → 2 cols → 1 col)
- Consistent card heights
- Hover effects (lift and glow)
- Staggered entrance animations
- Intersection Observer trigger
- Respects prefers-reduced-motion

**Accessibility:**
- `<section>` landmark with `aria-label`
- Semantic HTML
- Keyboard accessible
- Focus indicators

---

### KPIBand

Animated statistics band with count-up effect.

**Import:**
```typescript
import { KPIBand } from './components/marketing/KPIBand';
```

**Props:**
```typescript
interface KPIBandProps {
  stats: KPIStat[];                    // Array of statistics
  animationDuration?: number;          // Duration in ms (default: 2000)
  className?: string;                  // Additional CSS classes
}

interface KPIStat {
  label: string;                       // Stat label
  value: number;                       // Numeric value
  suffix?: string;                     // Suffix (e.g., '+', 'M')
  prefix?: string;                     // Prefix (e.g., '$')
  format?: 'number' | 'abbreviated';   // Number format
}
```

**Usage:**
```tsx
<KPIBand
  stats={[
    {
      label: 'Calls',
      value: 150000000,
      suffix: '+',
      format: 'abbreviated'  // Displays as "150M+"
    },
    {
      label: 'Assistants',
      value: 1500000,
      suffix: '+',
      format: 'abbreviated'  // Displays as "1.5M+"
    },
    {
      label: 'Developers',
      value: 350000,
      suffix: '+',
      format: 'abbreviated'  // Displays as "350K+"
    }
  ]}
  animationDuration={2500}
/>
```

**Features:**
- Count-up animations with easing
- Intersection Observer trigger
- Reduced motion support (instant display)
- Responsive layout
- Number formatting (abbreviated, full)

**Accessibility:**
- Semantic HTML
- Respects prefers-reduced-motion
- Screen reader friendly

---

### LogosStrip

Horizontal strip of company/technology logos.

**Import:**
```typescript
import { LogosStrip } from './components/marketing/LogosStrip';
```

**Props:**
```typescript
interface LogosStripProps {
  logos: Logo[];              // Array of logos
  className?: string;         // Additional CSS classes
}

interface Logo {
  name: string;               // Company/tech name
  src: string;                // Logo image URL
  srcDark?: string;           // Dark mode logo URL (optional)
  alt: string;                // Alt text
  width: number;              // Image width
  height: number;             // Image height
}
```

**Usage:**
```tsx
<LogosStrip
  logos={[
    {
      name: 'Company A',
      src: '/logos/company-a.svg',
      srcDark: '/logos/company-a-dark.svg',
      alt: 'Company A logo',
      width: 120,
      height: 40
    }
  ]}
/>
```

**Features:**
- Automatic dark mode logo switching
- Responsive wrapping
- Lazy loading
- Hover effects
- Even spacing
- Consistent sizing

**Accessibility:**
- Descriptive alt text
- Semantic HTML
- Keyboard accessible

---

### Solutions

Tabbed solutions section with flow diagrams.

**Import:**
```typescript
import { Solutions } from './components/marketing/Solutions';
```

**Props:**
```typescript
interface SolutionsProps {
  solutions: Solution[];                    // Array of solutions
  defaultSolution?: 'inbound' | 'outbound'; // Initial tab
  className?: string;                       // Additional CSS classes
}

interface Solution {
  id: 'inbound' | 'outbound';              // Solution ID
  title: string;                            // Solution title
  description: string;                      // Description
  nodes: FlowNode[];                        // Flow diagram nodes
  connections: FlowConnection[];            // Node connections
  caseStudyUrl: string;                     // Case study link
  tryNowUrl: string;                        // Try now link
}

interface FlowNode {
  id: string;                               // Node ID
  label: string;                            // Node label
  type: 'start' | 'action' | 'condition' | 'end';
}

interface FlowConnection {
  from: string;                             // Source node ID
  to: string;                               // Target node ID
  label?: string;                           // Connection label
}
```

**Usage:**
```tsx
<Solutions
  solutions={[
    {
      id: 'inbound',
      title: 'Inbound Calls',
      description: 'Handle incoming customer calls...',
      nodes: [
        { id: 'start', label: 'Receive Call', type: 'start' },
        { id: 'action', label: 'Use Tool', type: 'action' },
        { id: 'end', label: 'Complete', type: 'end' }
      ],
      connections: [
        { from: 'start', to: 'action' },
        { from: 'action', to: 'end' }
      ],
      caseStudyUrl: '/case-studies/inbound',
      tryNowUrl: '/try/inbound'
    }
  ]}
  defaultSolution="inbound"
/>
```

**Features:**
- Tabbed interface
- SVG flow diagrams
- Smooth transitions
- Responsive diagram scaling
- Keyboard navigation (arrow keys)
- Reduced motion support

**Accessibility:**
- ARIA tab pattern
- Keyboard navigation
- Focus indicators
- Screen reader announcements

---

### Explainer

Three-step explainer cards.

**Import:**
```typescript
import { Explainer } from './components/marketing/Explainer';
```

**Props:**
```typescript
interface ExplainerProps {
  headline: string;              // Section headline
  steps: ExplainerStep[];        // Array of steps
  className?: string;            // Additional CSS classes
}

interface ExplainerStep {
  id: string;                    // Step ID
  title: string;                 // Step title
  description: string;           // Step description (2-3 sentences)
  icon: React.ReactNode;         // Icon component
}
```

**Usage:**
```tsx
<Explainer
  headline="Try in minutes. Deploy in days."
  steps={[
    {
      id: 'choose',
      title: 'Choose your workflow',
      description: 'Select from pre-built templates or create custom workflows.',
      icon: <ChooseIcon />
    },
    {
      id: 'plugin',
      title: 'Plug it in',
      description: 'Integrate with your existing systems using our API.',
      icon: <PluginIcon />
    },
    {
      id: 'done',
      title: 'Done',
      description: 'Your voice AI assistant is ready to handle calls.',
      icon: <DoneIcon />
    }
  ]}
/>
```

**Features:**
- Horizontal card layout on desktop
- Vertical stacking on mobile
- Staggered entrance animations
- Icon integration
- Reduced motion support

**Accessibility:**
- Semantic HTML
- Keyboard accessible
- Respects prefers-reduced-motion

---

### Reliability

Reliability and compliance proof points.

**Import:**
```typescript
import { Reliability } from './components/marketing/Reliability';
```

**Props:**
```typescript
interface ReliabilityProps {
  metrics: ReliabilityMetric[];  // Array of metrics
  className?: string;             // Additional CSS classes
}

interface ReliabilityMetric {
  id: string;                     // Metric ID
  label: string;                  // Metric label
  value: string;                  // Metric value
  icon: React.ReactNode;          // Icon/badge component
  disclaimer?: string;            // Optional disclaimer
}
```

**Usage:**
```tsx
<Reliability
  metrics={[
    {
      id: 'uptime',
      label: 'Uptime',
      value: '99.99%',
      icon: <UptimeIcon />,
      disclaimer: 'Based on last 12 months'
    },
    {
      id: 'latency',
      label: 'Latency',
      value: 'Sub-500ms',
      icon: <SpeedIcon />
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: 'SOC2, HIPAA, PCI',
      icon: <ShieldIcon />
    }
  ]}
/>
```

**Features:**
- Horizontal card layout
- Icon/badge integration
- Responsive wrapping
- Subtle styling (not guarantee-like)

**Accessibility:**
- Semantic HTML
- Descriptive labels
- Keyboard accessible

---

## Interactive Components

### CodeTabs

Tabbed code snippets with syntax highlighting.

**Import:**
```typescript
import { CodeTabs } from './components/marketing/CodeTabs';
```

**Props:**
```typescript
interface CodeTabsProps {
  tabs: CodeTab[];               // Array of code tabs
  defaultTab?: string;           // Initially active tab ID
  className?: string;            // Additional CSS classes
}

interface CodeTab {
  id: string;                    // Tab ID
  label: string;                 // Tab label
  language: string;              // Language for syntax highlighting
  code: string;                  // Code content
}
```

**Usage:**
```tsx
<CodeTabs
  tabs={[
    {
      id: 'ts',
      label: 'TypeScript',
      language: 'typescript',
      code: `import { EllieClient } from '@ellie/sdk';

const client = new EllieClient({
  apiKey: process.env.ELLIE_API_KEY,
});

const call = await client.calls.create({
  assistantId: 'asst_abc123',
  to: '+1234567890',
});`
    },
    {
      id: 'py',
      label: 'Python',
      language: 'python',
      code: `from ellie import EllieClient

client = EllieClient(
    api_key=os.environ.get("ELLIE_API_KEY")
)

call = client.calls.create(
    assistant_id="asst_abc123",
    to="+1234567890"
)`
    }
  ]}
  defaultTab="ts"
/>
```

**Features:**
- Syntax highlighting with react-syntax-highlighter
- Copy-to-clipboard with confirmation
- Keyboard navigation (arrow keys, Home, End)
- Visible focus indicators
- Responsive horizontal scroll
- Accessible tab panel pattern

**Keyboard Navigation:**
- `Tab`: Focus tab list
- `Arrow Left/Right`: Navigate tabs
- `Home`: First tab
- `End`: Last tab
- `Enter/Space`: Activate tab

**Accessibility:**
- ARIA tab pattern
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected`, `aria-controls`
- Keyboard navigation
- Focus management

---

## Utility Components

### AnimatedOrb

Animated orb visualization for Hero section.

**Import:**
```typescript
import { AnimatedOrb } from './components/marketing/Hero/AnimatedOrb';
```

**Props:**
```typescript
interface AnimatedOrbProps {
  isActive?: boolean;            // Animation active state
  reducedMotion?: boolean;       // Disable animations
  className?: string;            // Additional CSS classes
}
```

**Usage:**
```tsx
<AnimatedOrb isActive />
<AnimatedOrb reducedMotion />
```

**Features:**
- Framer Motion spring animations
- Mic-reactive visual feedback
- Fallback to static/minimal animation
- GPU-accelerated transforms
- Performance optimized

---

### MobileMenu

Mobile navigation menu for Header.

**Import:**
```typescript
import { MobileMenu } from './components/marketing/Header/MobileMenu';
```

**Props:**
```typescript
interface MobileMenuProps {
  isOpen: boolean;               // Menu open state
  onClose: () => void;           // Close callback
  navigationLinks: NavLink[];    // Navigation links
}
```

**Usage:**
```tsx
<MobileMenu
  isOpen={isMenuOpen}
  onClose={() => setIsMenuOpen(false)}
  navigationLinks={links}
/>
```

**Features:**
- Slide-in animation
- Focus trap
- Backdrop overlay
- Keyboard navigation
- Escape key to close

**Accessibility:**
- Focus trap when open
- `aria-hidden` when closed
- Keyboard accessible
- Focus restoration on close

---

## Hooks

### useTheme

Access theme state and controls.

**Import:**
```typescript
import { useTheme } from './hooks/useTheme';
```

**Returns:**
```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';       // Current theme
  toggleTheme: () => void;       // Toggle function
  systemTheme: 'light' | 'dark'; // System preference
  setTheme: (theme: Theme) => void; // Set theme explicitly
}
```

**Usage:**
```tsx
const { theme, toggleTheme, systemTheme, setTheme } = useTheme();
```

**Throws:** Error if used outside ThemeProvider

---

### useReducedMotion

Check if user prefers reduced motion.

**Import:**
```typescript
import { useReducedMotion } from './hooks/useReducedMotion';
```

**Returns:** `boolean`

**Usage:**
```tsx
const prefersReducedMotion = useReducedMotion();

const duration = prefersReducedMotion ? 0 : 300;
```

---

### useIntersectionObserver

Detect when element enters viewport.

**Import:**
```typescript
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
```

**Parameters:**
```typescript
interface UseIntersectionObserverOptions {
  threshold?: number | number[];  // Visibility threshold (default: 0)
  root?: Element | null;          // Root element (default: viewport)
  rootMargin?: string;            // Root margin (default: '0px')
  triggerOnce?: boolean;          // Trigger only once (default: false)
}
```

**Returns:** `[React.RefObject<T>, boolean]`

**Usage:**
```tsx
const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
  threshold: 0.1,
  triggerOnce: true,
});

<div ref={ref}>
  {isVisible && <AnimatedContent />}
</div>
```

---

### useClipboard

Copy text to clipboard.

**Import:**
```typescript
import { useClipboard } from './hooks/useClipboard';
```

**Returns:**
```typescript
interface UseClipboardReturn {
  copied: boolean;                      // Copy success state
  copyToClipboard: (text: string) => Promise<void>;
  reset: () => void;                    // Reset copied state
}
```

**Usage:**
```tsx
const { copied, copyToClipboard } = useClipboard();

<button onClick={() => copyToClipboard('Hello')}>
  {copied ? 'Copied!' : 'Copy'}
</button>
```

---

### useCountUp

Animate number count-up.

**Import:**
```typescript
import { useCountUp } from './hooks/useCountUp';
```

**Parameters:**
```typescript
interface UseCountUpOptions {
  end: number;                    // Target value
  duration?: number;              // Duration in ms (default: 2000)
  start?: number;                 // Start value (default: 0)
  decimals?: number;              // Decimal places (default: 0)
  easing?: (t: number) => number; // Easing function
}
```

**Returns:** `number`

**Usage:**
```tsx
const count = useCountUp({
  end: 1000,
  duration: 2000,
  decimals: 0,
});

<div>{count}</div>
```

---

### useKeyboardNavigation

Handle keyboard navigation.

**Import:**
```typescript
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
```

**Parameters:**
```typescript
interface UseKeyboardNavigationOptions {
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
}
```

**Returns:** `(event: React.KeyboardEvent) => void`

**Usage:**
```tsx
const handleKeyDown = useKeyboardNavigation({
  onArrowLeft: () => previousItem(),
  onArrowRight: () => nextItem(),
  onEnter: () => selectItem(),
});

<div onKeyDown={handleKeyDown} tabIndex={0}>
  Content
</div>
```

---

### useMediaQuery

Responsive media query hook.

**Import:**
```typescript
import { useMediaQuery } from './hooks/useMediaQuery';
```

**Parameters:** `string` (media query)

**Returns:** `boolean`

**Usage:**
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');

{isMobile && <MobileView />}
{isDesktop && <DesktopView />}
```

---

## Related Documentation

- [Marketing Components README](./frontend/src/components/marketing/README.md)
- [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md)
- [Theme System](./THEME_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
