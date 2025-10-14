# Backend - Node.js/Express API Server

> RESTful API with TypeScript, dual AI integration (OpenAI + Groq), service discovery, load balancing, and WebSocket support for real-time voice processing.

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
backend/
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   └── index.ts         # Application entry point
└── test/                # Test utilities and setup
```

## 🔧 Key Features

- **TypeScript** - Type-safe development
- **Express.js** - RESTful API framework
- **Dual AI Integration** - OpenAI GPT-4 + Groq
- **Service Discovery** - Automatic service registration
- **Load Balancing** - Intelligent request distribution
- **Circuit Breaker** - Fault tolerance
- **WebSocket** - Real-time communication
- **Redis** - Caching and session management
- **Legal Compliance** - Built-in disclaimer system

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📚 API Documentation

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `GET /api/voice/tts/:text` - Text-to-speech conversion

### Service Discovery
- `GET /services` - List all registered services
- `GET /services/health` - System-wide health status
- `GET /services/stats` - Service discovery statistics

### Health & Monitoring
- `GET /health` - Service health check
- `GET /api/analytics/stats` - System statistics
- `GET /metrics` - Prometheus metrics

### Legal & Compliance
- `GET /api/legal/disclaimer` - Get legal disclaimer
- `POST /api/legal/accept` - Accept disclaimer

## 🔐 Environment Variables

```env
NODE_ENV=development
PORT=5000
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://redis:6379
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
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 📖 Documentation

- [Main README](../README.md) - Project overview
- [Frontend README](../frontend/README.md) - Frontend documentation
- [API Documentation](../docs/) - Complete API docs
- [Architecture](../docs/service-discovery.md) - System architecture

## 🆘 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Alexi5000/Ellie/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Alexi5000/Ellie/discussions)
- 📧 **Email**: alex@techtideai.io

---

**[⬆️ Back to Top](#backend---nodejsexpress-api-server)** | **[📖 Main README](../README.md)** | **[⚛️ Frontend](../frontend/README.md)**

**Maintained by**: Alex Cinovoj, TechTide AI  
**Version**: 1.0.0  
**License**: MIT
