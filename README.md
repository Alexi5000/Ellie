<div align="center">

<img src="assets/icon.png" alt="Ellie Logo" width="120" />

# Ellie

### The AI Voice Receptionist for Law Firms

**Ellie answers calls, qualifies leads, schedules consultations, and handles client intake — so your attorneys can focus on practicing law.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Voice%20AI-412991?logo=openai)](https://openai.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)](https://docker.com)

[Features](#features) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [Deployment](#-deployment) · [Docs](#-documentation)

---

<img src="assets/cover.png" alt="Ellie - AI Voice Receptionist" width="100%" />

</div>

---

## The Problem

Law firms lose thousands of dollars every month from missed calls, slow response times, and inefficient client intake. Hiring a full-time receptionist costs $35K–$50K/year, and after-hours calls go straight to voicemail. Potential clients don't leave voicemails — they call the next firm.

## The Solution

Ellie is an **AI-powered voice receptionist** built specifically for legal firms. She answers every call 24/7, qualifies leads with intelligent conversation, schedules consultations, handles client intake forms, and routes urgent matters to the right attorney. Full voice AI with natural conversation, multi-language support, and a beautiful dashboard for your team.

> *A potential client calls at 9 PM about a car accident. Ellie answers, gathers case details, qualifies the lead, schedules a morning consultation, and sends the attorney a briefing — all before the client hangs up.*

---

## Features

- **Voice AI Receptionist** — Natural conversation powered by OpenAI and Groq
- **24/7 Availability** — Never miss a call, even after hours
- **Lead Qualification** — Intelligent screening based on practice area and case type
- **Client Intake** — Automated intake forms completed during the call
- **Appointment Scheduling** — Book consultations directly into your calendar
- **Call Transcripts** — Full conversation logs with AI-generated summaries
- **Multi-Language** — i18n support for diverse client bases
- **Team Dashboard** — Real-time call monitoring, analytics, and client management
- **Service Discovery** — Microservice architecture with health monitoring
- **Docker Deployment** — Production-ready with Nginx, SSL, and Docker Compose
- **CI/CD Pipeline** — Automated testing and deployment via GitHub Actions

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** - For containerized development
- **Node.js 18+** - For local development
- **OpenAI API key** - For AI functionality
- **Groq API key** - For alternative AI provider

### Development Environment
```bash
# 1. Clone and setup environment
git clone https://github.com/Alexi5000/Ellie.git
cd Ellie
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 2. Start development environment
npm run docker:up
```

**Access Points:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Nginx Proxy**: http://localhost:80
- **Service Dashboard**: http://localhost:8080
- **Service Discovery**: http://localhost:5000/services

### Production Deployment
```bash
# 1. Configure production
cp backend/.env.example backend/.env.production
# Edit with production settings

# 2. Generate SSL certificates
npm run ssl:setup-windows  # Windows
npm run ssl:setup          # Linux/macOS

# 3. Deploy production
npm run docker:prod
```

## 📁 Project Structure

```
/
├── backend/              # Node.js/Express API server (TypeScript)
│   ├── src/             # Source code
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── middleware/  # Express middleware
│   └── test/            # Backend tests
├── frontend/            # React/TypeScript client application
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── contexts/   # React contexts
│   │   └── pages/      # Page components
│   └── __tests__/      # Frontend tests
├── docker/             # Docker configs, SSL, monitoring
│   ├── nginx/          # Nginx configuration
│   ├── ssl/            # SSL certificates
│   └── monitoring/     # Monitoring setup
├── docs/               # Comprehensive documentation
│   ├── ci-cd/         # CI/CD documentation
│   ├── deployment/    # Deployment guides
│   ├── testing/       # Testing documentation
│   ├── development/   # Development guides
│   └── marketing-site/ # Marketing site docs
├── scripts/            # Build and deployment scripts
├── tests/              # Integration tests
├── .github/            # GitHub Actions workflows
│   └── workflows/      # CI/CD pipeline definitions
├── .kiro/              # Kiro IDE configuration
│   ├── specs/         # Project specifications
│   └── steering/      # AI steering rules
└── .vscode/            # VS Code workspace settings
```

## 🏗️ Architecture

### Backend Stack
- **Node.js/Express** - RESTful API with WebSocket support
- **TypeScript** - Type-safe development
- **Service Discovery** - Automatic service registration and health monitoring
- **Load Balancing** - Intelligent request distribution with multiple strategies
- **Circuit Breaker** - Fault tolerance and cascading failure prevention
- **Dual AI Integration** - OpenAI GPT-4 + Groq with intelligent routing
- **Redis** - Caching and session management
- **Legal Compliance** - Built-in disclaimer and fallback systems

### Frontend Stack
- **React 18** - Modern UI with concurrent features
- **TypeScript** - Type-safe component development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first responsive design
- **Framer Motion** - Smooth animations
- **Real-time Voice** - WebSocket-based voice processing
- **PWA Support** - Progressive Web App capabilities
- **i18next** - Internationalization support

### Infrastructure
- **Docker** - Containerized deployment with service discovery
- **Nginx** - Reverse proxy and load balancer
- **Service Dashboard** - Real-time service monitoring interface
- **Prometheus** - Monitoring and metrics
- **SSL/TLS** - Automated certificate management

### CI/CD Pipeline
- **GitHub Actions** - Automated workflows
- **ESLint & Prettier** - Code quality and formatting
- **TypeScript** - Type checking
- **Jest & Vitest** - Unit and integration testing
- **Playwright** - End-to-end browser testing
- **Docker** - Containerized builds
- **CodeQL** - Security scanning
- **Automated Deployment** - Staging and production

## 🔧 Development

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend  
cd frontend
npm install
npm run dev
```

### Code Quality
```bash
# Lint code
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues

# Format code
cd backend && npm run format
cd frontend && npm run format

# Type check
npm run type-check
```

### Docker Commands
```bash
npm run docker:up         # Start development
npm run docker:down       # Stop services
npm run docker:prod       # Production deployment
npm run docker:verify     # Verify configuration
npm run docker:test       # Test deployment
```

## 🧪 Testing

### Running Tests
```bash
# All tests
npm run test:all

# Backend tests
npm run test:backend
cd backend && npm run test:watch

# Frontend tests
npm run test:frontend
cd frontend && npm run test:watch

# Integration tests
npm run test:integration

# Browser tests (Playwright)
cd frontend && npm run test:browser
cd frontend && npm run test:browser:headed
```

### Test Coverage
```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage
```

## 🚀 CI/CD Pipeline

### Automated Workflows

Every push triggers:
- ✅ **Code linting** (ESLint)
- ✅ **Code formatting** (Prettier)
- ✅ **Type checking** (TypeScript)
- ✅ **Unit tests** (Jest/Vitest)
- ✅ **Integration tests**
- ✅ **Security scanning** (CodeQL)
- ✅ **Docker builds**
- ✅ **Performance audits** (Lighthouse)

### Workflows
1. **CI Pipeline** - Lint, test, build, security scan
2. **Code Quality** - Prettier, ESLint, CodeQL, dependency review
3. **Docker** - Build images, security scanning, integration tests
4. **Performance** - Lighthouse audits, bundle analysis, load testing
5. **Deployment** - Staging/production deployment with rollback
6. **Release** - Automated releases with changelog
7. **PR Checks** - PR validation, auto-assignment, labeling

### View Pipeline Status
```bash
# View recent runs
gh run list --limit 10

# Watch a specific run
gh run watch <run-id>

# View workflow details
gh run view <run-id>
```

**GitHub Actions**: https://github.com/Alexi5000/Ellie/actions

## 🌟 Key Features

- **🎤 Voice Processing** - Real-time speech-to-text and text-to-speech
- **🤖 AI Integration** - Dual provider support (OpenAI + Groq) with intelligent routing
- **🔍 Service Discovery** - Automatic service registration and health monitoring
- **⚖️ Load Balancing** - Multiple strategies including health-based routing
- **🛡️ Circuit Breaker** - Fault tolerance and cascading failure prevention
- **⚖️ Legal Compliance** - Built-in legal disclaimer management
- **🔒 Security** - SSL/TLS support with automated certificate generation
- **📊 Monitoring** - Comprehensive logging, metrics, and service dashboard
- **🐳 Containerized** - Full Docker support with service orchestration
- **🔄 Real-time** - WebSocket-based communication
- **📱 Responsive** - Mobile-friendly Progressive Web App
- **🌍 Internationalization** - Multi-language support
- **♿ Accessibility** - WCAG 2.1 AA compliant
- **🚀 CI/CD** - Automated testing and deployment

## 📚 Documentation

### Core Documentation
- **[📖 Documentation Hub](docs/README.md)** - Complete documentation index
- **[🔧 Backend Guide](backend/README.md)** - Backend API documentation
- **[⚛️ Frontend Guide](frontend/README.md)** - Frontend application documentation
- **[🎨 Marketing Site](docs/marketing-site/README.md)** - Marketing site documentation

### Guides & References
- **[🚀 CI/CD Pipeline](docs/ci-cd/CI_CD_PIPELINE.md)** - Pipeline documentation
- **[🔧 CI/CD Setup](docs/ci-cd/CI_CD_SETUP.md)** - Setup guide
- **[📊 CI/CD Status](docs/ci-cd/CI_CD_STATUS.md)** - Current status
- **[⚡ Quick Reference](docs/ci-cd/QUICK_REFERENCE.md)** - Quick commands
- **[🚀 Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment
- **[🔒 SSL Setup](docs/deployment/SSL_SETUP_GUIDE.md)** - SSL configuration
- **[🧪 Testing Guide](docs/testing/QUICK_TEST_GUIDE.md)** - Quick test reference
- **[🏗️ Architecture](docs/service-discovery.md)** - System architecture
- **[🤝 Contributing Guide](CONTRIBUTING.md)** - How to contribute

## 🔐 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://redis:6379
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 API Endpoints

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `GET /api/voice/tts/:text` - Text-to-speech conversion
- `WebSocket /socket.io` - Real-time voice processing

### Service Discovery & Management
- `GET /services` - List all registered services
- `GET /services/health` - System-wide health status
- `GET /services/stats` - Service discovery statistics
- `GET /gateway/*` - API Gateway routing

### Health & Monitoring
- `GET /health` - Service health check
- `GET /api/analytics/stats` - System statistics
- `GET /metrics` - Prometheus metrics

### Legal & Compliance
- `GET /api/legal/disclaimer` - Get legal disclaimer
- `POST /api/legal/accept` - Accept disclaimer

## 🛡️ Legal Compliance

- **Disclaimer Management** - Automatic legal disclaimers
- **Content Filtering** - Inappropriate content detection
- **Fallback Responses** - Professional fallback for service failures
- **Audit Logging** - Comprehensive compliance logging

## 📈 Monitoring

### Development
- Application: http://localhost:3000
- Backend API: http://localhost:5000
- Service Dashboard: http://localhost:8080
- Health Check: http://localhost:5000/health
- Service Discovery: http://localhost:5000/services

### Production
- Application: https://your-domain.com
- Service Dashboard: https://your-domain.com:8080
- Prometheus: https://your-domain.com:9090
- Health Check: https://your-domain.com/health
- Service Discovery: https://your-domain.com/services

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process
- CI/CD requirements

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:all`)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Resources

### Getting Help
- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Alexi5000/Ellie/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Alexi5000/Ellie/discussions)
- 🚀 **CI/CD Status**: [GitHub Actions](https://github.com/Alexi5000/Ellie/actions)

### Related Documentation
- [Backend README](backend/README.md) - Backend-specific documentation
- [Frontend README](frontend/README.md) - Frontend-specific documentation
- [Docker Setup](docker/) - Container orchestration
- [Testing Guide](docs/testing/QUICK_TEST_GUIDE.md) - Testing documentation
- [CI/CD Pipeline](docs/ci-cd/CI_CD_PIPELINE.md) - Pipeline documentation

---

**Maintained by**: Alex Cinovoj, TechTide AI  
**Version**: 1.0.0  
**Last Updated**: October 2025

