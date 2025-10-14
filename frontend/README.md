# Frontend - React/TypeScript Client Application

> Modern React 18 application with TypeScript, Vite, Tailwind CSS, real-time voice processing, PWA support, and comprehensive accessibility features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   ├── pages/          # Page components
│   ├── styles/         # Global styles
│   └── App.tsx         # Application root
├── public/             # Static assets
└── __tests__/          # Test files
```

## 🔧 Key Features

- **React 18** - Modern UI with concurrent features
- **TypeScript** - Type-safe component development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first responsive design
- **Framer Motion** - Smooth animations
- **Real-time Voice** - WebSocket-based voice processing
- **PWA Support** - Progressive Web App capabilities
- **i18next** - Internationalization support
- **Accessibility** - WCAG 2.1 AA compliant

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Browser tests (Playwright)
npm run test:browser

# Browser tests (headed mode)
npm run test:browser:headed
```

## 🎨 Components

### Core Components
- **VoiceRecorder** - Voice input with real-time processing
- **ChatInterface** - AI conversation interface
- **LegalDisclaimer** - Legal compliance component
- **ServiceDashboard** - Service monitoring interface

### Marketing Components
- **Hero** - Landing page hero section
- **Features** - Feature showcase
- **Pricing** - Pricing tables
- **Testimonials** - Customer testimonials
- **FAQ** - Frequently asked questions

## 🔐 Environment Variables

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🛠️ Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run lighthouse` - Run Lighthouse audit

## 🎨 Styling

### Tailwind CSS
The application uses Tailwind CSS for styling with a custom theme:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...}
    }
  }
}
```

### Theme System
- Light/Dark mode support
- Responsive design
- Accessible color contrast
- Custom animations

## ♿ Accessibility

- **WCAG 2.1 AA Compliant**
- Keyboard navigation support
- Screen reader optimized
- Focus management
- ARIA labels and roles
- Color contrast compliance

## 🌍 Internationalization

Supports multiple languages using i18next:
- English (default)
- Spanish
- French
- German

## 📱 PWA Features

- Offline support
- Install prompt
- Service worker
- App manifest
- Push notifications (planned)

## 📖 Documentation

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend documentation
- [Component API](../docs/marketing-site/COMPONENT_API.md) - Component reference
- [Theme System](../docs/marketing-site/THEME_SYSTEM.md) - Design system
- [Accessibility](../docs/marketing-site/ACCESSIBILITY_FEATURES.md) - A11y features

## 🆘 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Alexi5000/Ellie/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Alexi5000/Ellie/discussions)
- 📧 **Email**: alex@techtideai.io

---

**[⬆️ Back to Top](#frontend---reacttypescript-client-application)** | **[📖 Main README](../README.md)** | **[🔧 Backend](../backend/README.md)**

**Maintained by**: Alex Cinovoj, TechTide AI  
**Version**: 1.0.0  
**License**: MIT
