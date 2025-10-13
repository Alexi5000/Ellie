# Marketing Site Redesign Spec

## Overview

This spec defines the transformation of the Ellie Voice Receptionist frontend from a functional application interface into a dark, developer-centric marketing website. The redesign maintains the existing React 18 + TypeScript + Vite + Tailwind stack while introducing modern marketing components, dark theme support, and interactive demonstrations.

## Spec Status

✅ **Requirements**: Complete  
✅ **Design**: Complete  
✅ **Tasks**: Complete  
⏳ **Implementation**: Ready to start

## Quick Links

- [Requirements Document](./requirements.md) - 13 requirements with EARS format acceptance criteria
- [Design Document](./design.md) - Architecture, components, interfaces, and technical details
- [Implementation Tasks](./tasks.md) - 24 sequential tasks for implementation

## Key Features

### 1. Dark Theme System
- Light/dark mode toggle with localStorage persistence
- System preference detection (prefers-color-scheme)
- CSS variables for semantic color tokens
- Smooth transitions with reduced-motion support

### 2. Marketing Components
- **Header**: Sticky navigation with translucent backdrop
- **Hero**: Split layout with animated orb
- **CodeTabs**: Syntax-highlighted code snippets (TypeScript, Python, cURL, React)
- **LogosStrip**: Credibility logos with dark mode support
- **KPIBand**: Animated statistics (150M+ calls, 1.5M+ assistants, 350K+ developers)
- **Solutions**: Tabbed interface with flow diagrams (Inbound/Outbound)
- **Explainer**: Three-step cards ("Try in minutes. Deploy in days.")
- **Features**: Grid of 6 features with icons and descriptions
- **Reliability**: Proof-point cards (uptime, latency, compliance)
- **Footer**: Multi-column with semantic HTML

### 3. Accessibility & Performance
- WCAG 2.1 Level AA compliance
- Lighthouse scores 90+ (Performance, Accessibility, Best Practices, SEO)
- Keyboard navigation with visible focus states
- Screen reader support with semantic HTML
- Core Web Vitals optimization (CLS < 0.1, FID < 100ms)

### 4. Developer Experience
- TypeScript interfaces for all components
- Comprehensive test coverage (unit, integration, accessibility)
- Code splitting and lazy loading
- Custom hooks for common patterns
- Clear documentation

## Technology Stack

### Existing (Maintained)
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

### New Dependencies (Minimal)
- framer-motion (animations)
- react-syntax-highlighter (code highlighting)

## Implementation Approach

The implementation is broken into 24 sequential tasks organized into phases:

### Phase 1: Foundation (Tasks 1-3)
Set up theme system, install dependencies, create theme toggle

### Phase 2: Core Components (Tasks 4-14)
Build all marketing components with tests

### Phase 3: Integration (Tasks 15-16)
Compose components into MarketingPage and update routing

### Phase 4: Optimization (Tasks 17-19)
Performance optimizations, accessibility features, custom hooks

### Phase 5: Quality Assurance (Tasks 20-22)
Comprehensive testing, Lighthouse audits, cross-browser testing

### Phase 6: Documentation & Polish (Tasks 23-24)
Documentation and final integration

## Getting Started

To begin implementation:

1. **Review the spec documents**:
   - Read [requirements.md](./requirements.md) to understand what needs to be built
   - Read [design.md](./design.md) to understand how it should be built
   - Read [tasks.md](./tasks.md) to see the implementation plan

2. **Start with Task 1**:
   - Open [tasks.md](./tasks.md)
   - Click "Start task" next to Task 1
   - Follow the task description and requirements

3. **Work sequentially**:
   - Complete tasks in order (each builds on previous ones)
   - Mark tasks complete as you finish them
   - Test thoroughly before moving to next task

## Success Criteria

The implementation will be considered complete when:

- ✅ All 24 tasks are completed
- ✅ All tests pass (unit, integration, accessibility)
- ✅ Lighthouse scores are 90+ for all categories
- ✅ Cross-browser testing is complete
- ✅ Documentation is complete
- ✅ Site is deployed and functional

## Estimated Timeline

- **Phase 1 (Foundation)**: 1-2 days
- **Phase 2 (Core Components)**: 5-7 days
- **Phase 3 (Integration)**: 1-2 days
- **Phase 4 (Optimization)**: 2-3 days
- **Phase 5 (Quality Assurance)**: 2-3 days
- **Phase 6 (Documentation & Polish)**: 1-2 days

**Total Estimated Time**: 12-19 days

## Design Principles

1. **Developer-First**: Design for technical audiences with code examples and clear documentation
2. **Performance**: Optimize for fast load times and smooth interactions
3. **Accessibility**: Ensure everyone can use the site regardless of abilities
4. **Dark Mode**: Provide a comfortable viewing experience for developers
5. **Simplicity**: Keep the design clean and focused on key messages
6. **Responsiveness**: Work seamlessly across all device sizes

## Key Decisions

### Why Framer Motion?
- Industry-standard animation library
- Excellent performance and accessibility features
- Built-in support for reduced-motion preferences
- Comprehensive documentation and community support

### Why React Syntax Highlighter?
- Lightweight and well-maintained
- Supports multiple languages and themes
- Easy integration with React
- Good performance with code splitting

### Why CSS Variables?
- Enable dynamic theming without JavaScript
- Better performance than inline styles
- Easy to maintain and extend
- Native browser support

### Why Class-Based Dark Mode?
- More control than media query only
- Allows user preference override
- Better for testing
- Easier to implement with Tailwind

## Maintenance

After implementation, the marketing site will require:

- **Content Updates**: Update copy, stats, and code examples as needed
- **Component Updates**: Add new features or modify existing ones
- **Performance Monitoring**: Track Lighthouse scores and Core Web Vitals
- **Accessibility Audits**: Regular testing with screen readers and keyboard navigation
- **Browser Testing**: Test on new browser versions as they're released

## Support

For questions or issues during implementation:

1. Review the spec documents (requirements, design, tasks)
2. Check the design document for technical details
3. Refer to component interfaces and data models
4. Review the testing strategy for guidance

## License

This spec is part of the Ellie Voice Receptionist project and follows the same license.

---

**Spec Created**: October 12, 2025  
**Status**: Ready for Implementation  
**Next Step**: Begin Task 1 - Set up theme system and CSS variables
