# Footer Component

Multi-column footer component with semantic HTML, accessibility features, and dark mode support.

## Features

- **Semantic HTML**: Uses `<footer>` and `<nav>` landmarks for accessibility
- **Multi-column Layout**: Responsive grid layout (5 columns on desktop, stacks on mobile)
- **Skip-to-content Link**: Screen reader accessible navigation aid
- **Logical Tab Order**: Left to right, top to bottom navigation
- **Visible Focus Indicators**: 2px outline on all interactive elements
- **Social Media Links**: Configurable social media icons
- **Dark Mode Support**: Automatic theme adaptation
- **Reduced Motion Support**: Respects user motion preferences

## Usage

### Basic Usage

```tsx
import { Footer } from '@/components/marketing/Footer';

function App() {
  return (
    <div>
      {/* Your content */}
      <Footer />
    </div>
  );
}
```

### Custom Columns

```tsx
import { Footer } from '@/components/marketing/Footer';
import type { FooterColumnData } from '@/components/marketing/Footer';

const customColumns: FooterColumnData[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API', href: 'https://api.example.com', external: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
    ],
  },
];

function App() {
  return <Footer columns={customColumns} />;
}
```

### Custom Social Links

```tsx
import { Footer } from '@/components/marketing/Footer';
import type { SocialLink } from '@/components/marketing/Footer';

const customSocialLinks: SocialLink[] = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/yourcompany',
    icon: <TwitterIcon />,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/yourcompany',
    icon: <GitHubIcon />,
  },
];

function App() {
  return <Footer socialLinks={customSocialLinks} />;
}
```

### Custom Copyright

```tsx
import { Footer } from '@/components/marketing/Footer';

function App() {
  return <Footer copyrightText="© 2024 Your Company. All rights reserved." />;
}
```

## Props

### Footer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `FooterColumnData[]` | Default columns | Array of footer column configurations |
| `socialLinks` | `SocialLink[]` | Default social links | Array of social media link configurations |
| `copyrightText` | `string` | Current year copyright | Copyright notice text |
| `className` | `string` | `''` | Additional CSS classes |

### FooterColumnData Type

```typescript
interface FooterColumnData {
  title: string;
  links: FooterLink[];
}
```

### FooterLink Type

```typescript
interface FooterLink {
  label: string;
  href: string;
  external?: boolean; // Opens in new tab if true
}
```

### SocialLink Type

```typescript
interface SocialLink {
  name: string; // Used for aria-label
  href: string;
  icon: React.ReactNode;
}
```

## Default Columns

The Footer component includes five default columns:

1. **Product**: Features, Pricing, API, Integrations, Changelog
2. **Solutions**: Inbound Calls, Outbound Calls, Custom Agents, Enterprise
3. **Resources**: Documentation, Guides, Blog, Case Studies, Community
4. **Company**: About, Careers, Contact, Press
5. **Legal**: Privacy Policy, Terms of Service, Cookie Policy, Security

## Default Social Links

- Twitter
- GitHub
- LinkedIn

## Accessibility

### Keyboard Navigation

- All links are keyboard accessible via Tab key
- Logical tab order (left to right, top to bottom)
- Visible focus indicators (2px outline)
- Skip-to-content link for screen readers

### Screen Readers

- Semantic HTML with `<footer>` landmark
- Navigation landmark with descriptive label
- Proper heading hierarchy
- Descriptive aria-labels for icon-only links

### WCAG Compliance

- WCAG 2.1 Level AA compliant
- Sufficient color contrast in both light and dark modes
- Focus indicators meet contrast requirements
- Respects prefers-reduced-motion

## Responsive Behavior

- **Desktop (lg+)**: 5 columns
- **Tablet (md)**: 3 columns
- **Mobile**: 2 columns, with some columns spanning full width

## Dark Mode

The Footer automatically adapts to the current theme using CSS variables:

- `--color-bg-secondary`: Footer background
- `--color-text-primary`: Column titles
- `--color-text-secondary`: Link text
- `--color-text-tertiary`: Copyright text
- `--color-border-primary`: Borders and dividers

## Testing

Run the test suite:

```bash
npm test Footer
```

The component includes comprehensive unit tests for:
- Rendering with default and custom props
- Semantic HTML structure
- Accessibility features
- Link behavior (internal vs external)
- Focus indicators
- Responsive layout
- Dark mode support

## Related Components

- `FooterColumn`: Individual footer column component
- `Header`: Companion header component
- `ThemeToggle`: Theme switching component
