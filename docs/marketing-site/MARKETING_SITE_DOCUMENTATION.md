# Marketing Site Documentation Index

Complete documentation for the Ellie Voice Receptionist marketing website redesign.

## 📚 Documentation Overview

This directory contains comprehensive documentation for the marketing site, covering theme system, components, deployment, accessibility, and more.

## 🗂️ Documentation Files

### Core Documentation

#### [Theme System Documentation](./THEME_SYSTEM.md)
Complete guide to the dark/light theme system.

**Contents:**
- Architecture and setup
- Usage examples
- Customization guide
- Best practices
- Troubleshooting
- API reference

**Key Topics:**
- ThemeProvider setup
- useTheme hook
- CSS variables
- Tailwind integration
- Motion preferences
- localStorage persistence

---

#### [Component API Reference](./COMPONENT_API.md)
Comprehensive API documentation for all marketing components.

**Contents:**
- Theme components (ThemeProvider, ThemeToggle)
- Layout components (Header, Footer)
- Content components (Hero, Features, KPIBand, etc.)
- Interactive components (CodeTabs, Solutions)
- Utility components and hooks

**For Each Component:**
- Import statements
- Props interface
- Usage examples
- Features list
- Accessibility notes

---

#### [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md)
Design patterns and conventions for marketing components.

**Contents:**
- Design principles
- Color system
- Typography
- Spacing
- Component patterns
- Animations
- Responsive design
- Accessibility guidelines

**Key Sections:**
- Semantic color tokens
- Font scales and weights
- Button styles
- Card patterns
- Animation guidelines
- Best practices

---

#### [Marketing Components README](./frontend/src/components/marketing/README.md)
Overview and usage guide for all marketing components.

**Contents:**
- Component architecture
- Available components
- Usage guidelines
- Accessibility features
- Performance optimization
- Testing approach

**Component Categories:**
- Layout (Header, Footer)
- Content (Hero, Features, KPIBand, LogosStrip, Solutions, Explainer, Reliability)
- Interactive (CodeTabs)

---

#### [Accessibility Features](./ACCESSIBILITY_FEATURES.md)
Detailed documentation of accessibility implementation.

**Contents:**
- Keyboard navigation
- Screen reader support
- Focus management
- Color and contrast
- Motion preferences
- ARIA implementation
- Testing procedures
- WCAG 2.1 compliance

**Key Features:**
- Full keyboard navigation
- WCAG 2.1 Level AA compliance
- Screen reader compatibility
- High contrast ratios
- Motion preference respect

---

#### [Deployment Guide](./DEPLOYMENT_GUIDE.md)
Complete guide for deploying the marketing site to production.

**Contents:**
- Prerequisites
- Build process
- Deployment options (Docker, Vercel, Netlify, Nginx)
- Environment configuration
- Performance optimization
- Monitoring setup
- Troubleshooting
- CI/CD pipeline

**Deployment Options:**
- Docker (recommended)
- Static hosting (Vercel, Netlify)
- Traditional web server (Nginx)

---

## 🎯 Quick Start Guides

### For Developers

**Getting Started:**
1. Read [Marketing Components README](./frontend/src/components/marketing/README.md)
2. Review [Component API Reference](./COMPONENT_API.md)
3. Follow [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md)
4. Check [Theme System Documentation](./THEME_SYSTEM.md)

**Building Components:**
1. Use semantic color tokens
2. Follow component structure pattern
3. Implement accessibility features
4. Respect motion preferences
5. Add comprehensive tests
6. Document props and usage

### For Designers

**Design Resources:**
1. [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md) - Design system
2. [Component API](./COMPONENT_API.md) - Component specifications
3. [Accessibility Features](./ACCESSIBILITY_FEATURES.md) - Accessibility requirements

**Key Considerations:**
- Dark-first design approach
- WCAG AA contrast ratios
- Responsive breakpoints
- Motion preferences
- Focus indicators

### For DevOps

**Deployment Resources:**
1. [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
2. [Performance Guide](./frontend/PERFORMANCE.md) - Optimization techniques
3. [SSL Setup Guide](./docs/SSL_SETUP_GUIDE.md) - SSL configuration

**Key Tasks:**
- Build optimization
- CDN configuration
- SSL/TLS setup
- Monitoring setup
- CI/CD pipeline

## 📖 Component Documentation

Each component has its own README with detailed documentation:

- [Header](./frontend/src/components/marketing/Header/README.md)
- [Footer](./frontend/src/components/marketing/Footer/README.md)
- [Hero](./frontend/src/components/marketing/Hero/README.md)
- [CodeTabs](./frontend/src/components/marketing/CodeTabs/README.md)
- [Features](./frontend/src/components/marketing/Features/README.md)
- [KPIBand](./frontend/src/components/marketing/KPIBand/README.md)
- [LogosStrip](./frontend/src/components/marketing/LogosStrip/README.md)
- [Solutions](./frontend/src/components/marketing/Solutions/README.md)
- [Explainer](./frontend/src/components/marketing/Explainer/README.md)
- [Reliability](./frontend/src/components/marketing/Reliability/README.md)

## 🧪 Testing Documentation

### Test Guides

- [Testing README](./frontend/src/__tests__/README.md) - Complete testing guide
- [Testing Summary](./frontend/src/__tests__/TESTING_SUMMARY.md) - Test coverage summary
- [Browser Testing Guide](./frontend/BROWSER_TESTING_GUIDE.md) - Cross-browser testing
- [Lighthouse Guide](./frontend/LIGHTHOUSE_SETUP.md) - Performance auditing

### Test Types

- **Unit Tests**: Component-level tests
- **Integration Tests**: Component interaction tests
- **Accessibility Tests**: WCAG compliance tests
- **Visual Regression Tests**: Theme switching tests
- **Browser Tests**: Cross-browser compatibility
- **Performance Tests**: Lighthouse audits

## 🎨 Design System

### Color System

**Semantic Tokens:**
- Background: primary, secondary, tertiary
- Text: primary, secondary, tertiary
- Accent: primary, secondary
- Border: primary, secondary

**Themes:**
- Light theme (default)
- Dark theme (primary)

### Typography

**Font Family:** Inter
**Scale:** xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl
**Weights:** normal (400), medium (500), semibold (600), bold (700)

### Spacing

**Scale:** xs (8px), sm (12px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px), 4xl (96px)

### Breakpoints

- sm: 640px (mobile landscape)
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)
- 2xl: 1536px (extra large)

## ♿ Accessibility

### Standards

- **WCAG 2.1 Level AA** compliance
- **Lighthouse Accessibility**: 90+ score
- **Keyboard Navigation**: 100% coverage
- **Screen Reader**: Full compatibility

### Key Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Color contrast (4.5:1 minimum)
- Motion preference respect
- Skip navigation links

### Testing Tools

- axe DevTools
- WAVE Browser Extension
- Lighthouse
- NVDA/JAWS/VoiceOver
- Contrast Checker

## 🚀 Performance

### Targets

- **Lighthouse Performance**: 90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimizations

- Code splitting
- Lazy loading
- Image optimization
- Font preloading
- CDN usage
- Gzip/Brotli compression
- HTTP/2
- Caching strategies

## 🔧 Development Workflow

### Setup

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format

# Run all checks
npm run check
```

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm test -- integration/

# Accessibility tests
npm test -- accessibility/

# Browser tests
npm run test:browser

# Lighthouse audit
npm run lighthouse
```

## 📦 Build & Deployment

### Build Process

1. Install dependencies
2. Run tests
3. Build for production
4. Run Lighthouse audit
5. Deploy

### Deployment Options

- **Docker**: Containerized deployment (recommended)
- **Vercel**: Serverless deployment
- **Netlify**: Static hosting
- **Nginx**: Traditional web server

### Environment Variables

```bash
# API Configuration
VITE_API_URL=https://api.ellie.example.com
VITE_API_KEY=your_api_key

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Feature Flags
VITE_ENABLE_ANALYTICS=true
```

## 🐛 Troubleshooting

### Common Issues

**Theme not persisting:**
- Check localStorage availability
- Verify browser privacy settings

**Animations not working:**
- Check prefers-reduced-motion setting
- Verify Framer Motion is loaded

**Build fails:**
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Verify environment variables

**Performance issues:**
- Run Lighthouse audit
- Check bundle size
- Verify code splitting
- Enable compression

## 📞 Support

### Getting Help

- **Documentation**: Start here
- **Component READMEs**: Component-specific docs
- **GitHub Issues**: Bug reports
- **GitHub Discussions**: Questions and ideas

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process

## 🔗 Related Documentation

### Project Documentation

- [Main README](./README.md) - Project overview
- [Backend README](./backend/README.md) - Backend documentation
- [Frontend README](./frontend/README.md) - Frontend documentation
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines

### Existing Guides

- [Deployment Guide](./docs/DEPLOYMENT.md) - General deployment
- [SSL Setup Guide](./docs/SSL_SETUP_GUIDE.md) - SSL configuration
- [Testing Guide](./docs/testing/QUICK_TEST_GUIDE.md) - Testing overview

### Frontend Specific

- [Accessibility Guide](./frontend/ACCESSIBILITY.md) - Accessibility implementation
- [Performance Guide](./frontend/PERFORMANCE.md) - Performance optimization
- [Lighthouse Guide](./frontend/LIGHTHOUSE_SETUP.md) - Lighthouse auditing
- [Browser Testing](./frontend/BROWSER_TESTING_GUIDE.md) - Cross-browser testing

## 📊 Documentation Status

### Completed ✅

- [x] Theme System Documentation
- [x] Component API Reference
- [x] Style Guide
- [x] Marketing Components README
- [x] Accessibility Features Documentation
- [x] Deployment Guide
- [x] Component-specific READMEs
- [x] Testing Documentation
- [x] Performance Documentation
- [x] Browser Testing Documentation

### Maintained 🔄

All documentation is actively maintained and updated with:
- New features
- Bug fixes
- Best practices
- User feedback
- Performance improvements

## 🎓 Learning Resources

### For New Developers

1. Start with [Marketing Components README](./frontend/src/components/marketing/README.md)
2. Review [Style Guide](./frontend/src/components/marketing/STYLE_GUIDE.md)
3. Study [Component API Reference](./COMPONENT_API.md)
4. Read [Accessibility Features](./ACCESSIBILITY_FEATURES.md)
5. Practice with component examples

### For Experienced Developers

1. Review [Theme System Documentation](./THEME_SYSTEM.md)
2. Check [Deployment Guide](./DEPLOYMENT_GUIDE.md)
3. Study [Performance Guide](./frontend/PERFORMANCE.md)
4. Explore component source code
5. Contribute improvements

## 📝 Documentation Standards

### Writing Guidelines

- Clear and concise
- Code examples for all features
- Accessibility considerations
- Performance implications
- Common pitfalls
- Troubleshooting tips

### Code Examples

- Complete and runnable
- TypeScript types included
- Comments for clarity
- Best practices demonstrated
- Accessibility features shown

### Maintenance

- Update with code changes
- Review quarterly
- Incorporate user feedback
- Keep examples current
- Test all code samples

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintained by**: Alex Cinovoj, TechTide AI
