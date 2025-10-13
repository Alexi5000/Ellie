# Ellie Voice Receptionist - Frontend

React/TypeScript frontend application for the Ellie Voice Receptionist AI Assistant.

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.IO Client
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **PWA**: Service Worker + Web Manifest

### Key Features
- **Voice Interface**: Desktop and mobile-optimized voice recording
- **Real-time Communication**: WebSocket integration
- **Progressive Web App**: Installable, offline-capable
- **Internationalization**: Multi-language support (i18n)
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliant
- **Theme Support**: Light/dark mode with system preference detection
- **Error Boundaries**: Comprehensive error handling

## 📁 Project Structure

```
frontend/
├── public/                  # Static assets
│   ├── icons/              # PWA icons
│   ├── locales/            # Translation files
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # React components
│   │   ├── marketing/     # Marketing site components
│   │   │   ├── Header/    # Navigation header
│   │   │   ├── Hero/      # Hero section with animated orb
│   │   │   └── CodeTabs/  # Code snippet tabs
│   │   ├── theme/         # Theme components
│   │   └── voice/         # Voice interface components
│   ├── contexts/          # React contexts
│   │   └── ThemeContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useTheme.ts
│   │   ├── useReducedMotion.ts
│   │   ├── useClipboard.ts
│   │   └── useSocket.ts
│   ├── pages/             # Page components
│   ├── styles/            # Global styles
│   │   └── theme.css      # CSS variables & themes
│   ├── test/              # Test utilities
│   │   ├── setup.ts       # Test configuration
│   │   └── testHelpers.tsx # Test utilities
│   ├── App.tsx            # Root component
│   └── main.tsx           # Application entry point
├── .env.example           # Environment template
├── .env.test              # Test environment
├── Dockerfile             # Docker configuration
├── index.html             # HTML entry point
├── nginx.conf             # Nginx configuration for Docker
├── package.json           # Dependencies
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your backend URL
```

3. **Run development server**:
```bash
npm run dev
```

The application will start at http://localhost:3000

### Docker Development

```bash
# From project root
npm run docker:up
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following:

```bash
# Backend API
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Service Discovery
REACT_APP_SERVICE_DISCOVERY_URL=http://localhost:5000/services

# Features
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_I18N=true
```

### Tailwind CSS

Customize theme in `tailwind.config.js`:
- Colors
- Fonts
- Spacing
- Breakpoints

### Theme System

CSS variables in `src/styles/theme.css`:
- Light theme (default)
- Dark theme
- Automatic system preference detection

## 📚 Key Components

### Marketing Components

**Header** (`src/components/marketing/Header/`)
- Sticky navigation
- Mobile hamburger menu
- Theme toggle
- Responsive design

**Hero** (`src/components/marketing/Hero/`)
- Animated orb with voice feedback
- Framer Motion animations
- Respects reduced motion preferences

**CodeTabs** (`src/components/marketing/CodeTabs/`)
- Syntax highlighting
- Copy-to-clipboard
- Keyboard navigation
- Multiple language support

### Theme Components

**ThemeToggle** (`src/components/theme/`)
- Light/dark mode toggle
- System preference detection
- Smooth transitions
- Accessible controls

### Voice Components

**VoiceInterface** (`src/components/voice/`)
- Desktop and mobile voice recording
- Real-time audio visualization
- WebSocket communication
- Error handling

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Specific test file
npm test -- Header.test.tsx
```

### Test Structure

- **Unit Tests**: Component and hook testing
- **Integration Tests**: User flow testing
- **Test Helpers**: Reusable utilities in `src/test/testHelpers.tsx`

### Test Environment

Tests use `.env.test` with mock configurations. See `docs/testing/FRONTEND_TEST_ENVIRONMENT.md` for details.

## 🏗️ Development

### Build

```bash
# Production build
npm run build

# Output in dist/
```

### Preview Production Build

```bash
npm run preview
```

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting
- Follow React best practices

## 🎨 Styling

### Tailwind CSS

Utility-first CSS framework with custom configuration:

```tsx
<div className="bg-background-primary text-text-primary p-4 rounded-lg">
  Content
</div>
```

### CSS Variables

Theme-aware CSS variables:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #0f172a;
  --color-accent-primary: #3b82f6;
}

.dark {
  --color-bg-primary: #0f172a;
  --color-text-primary: #f8fafc;
  --color-accent-primary: #60a5fa;
}
```

### Responsive Design

Mobile-first breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🌐 Internationalization

### i18next Integration

Multi-language support with automatic detection:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('welcome.title')}</h1>;
}
```

### Adding Translations

Add translation files in `public/locales/{lang}/translation.json`:

```json
{
  "welcome": {
    "title": "Welcome to Ellie"
  }
}
```

## 📱 Progressive Web App

### Features
- **Installable**: Add to home screen
- **Offline Support**: Service worker caching
- **App-like Experience**: Full-screen mode
- **Push Notifications**: (Future feature)

### Manifest

Configure in `public/manifest.json`:
- App name and description
- Icons (multiple sizes)
- Theme colors
- Display mode

### Service Worker

Automatic caching strategy:
- Cache-first for static assets
- Network-first for API calls
- Offline fallback page

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Indicators**: Visible focus states
- **Color Contrast**: Meets contrast requirements
- **Reduced Motion**: Respects user preferences

### Testing Accessibility

```bash
# Run accessibility tests
npm test -- --grep "accessibility"
```

## 🔒 Security

### Best Practices
- **XSS Protection**: React's built-in escaping
- **HTTPS Only**: Enforce secure connections
- **CSP Headers**: Content Security Policy
- **Input Validation**: Client-side validation
- **Secure Storage**: No sensitive data in localStorage

## 🐳 Docker

### Development
```bash
docker build -t ellie-frontend:dev --target development .
docker run -p 3000:3000 ellie-frontend:dev
```

### Production
```bash
docker build -t ellie-frontend:prod --target production .
docker run -p 80:80 ellie-frontend:prod
```

### Nginx Configuration

Production uses Nginx for:
- Static file serving
- Gzip compression
- Caching headers
- SPA routing support

## 📈 Performance

### Optimization Strategies
- **Code Splitting**: Route-based splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: WebP format, lazy loading
- **Bundle Analysis**: Vite bundle analyzer
- **Tree Shaking**: Automatic dead code elimination

### Lighthouse Scores
Target scores:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- PWA: 100

## 🤝 Contributing

1. Follow React best practices
2. Use TypeScript for type safety
3. Add tests for new features
4. Update documentation
5. Follow accessibility guidelines

## 📄 Documentation

- **Component Documentation**: JSDoc comments in components
- **Test Documentation**: See `docs/testing/FRONTEND_TEST_ENVIRONMENT.md`
- **PWA Documentation**: See `docs/testing/PWA_TESTING_SUMMARY.md`
- **Development Guide**: See `docs/development/`

## 🆘 Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Build errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
```

**Type errors**:
```bash
# Regenerate TypeScript declarations
npm run build
```

**Test failures**:
- Check `.env.test` exists
- Verify mocks are configured
- Run tests in isolation

## 📞 Support

- **Documentation**: Check `docs/` folder
- **Issues**: Create GitHub issue
- **Tests**: See `docs/testing/FRONTEND_TEST_ENVIRONMENT.md`

---

**Version**: 1.0.0  
**License**: MIT  
**Maintained By**: Ellie Voice Receptionist Team
