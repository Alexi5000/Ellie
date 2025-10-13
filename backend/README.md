# Ellie Voice Receptionist - Backend

Node.js/Express backend API for the Ellie Voice Receptionist AI Assistant.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Redis (caching & sessions)
- **Real-time**: Socket.IO
- **AI Services**: OpenAI (GPT-4, Whisper) + Groq

### Key Features
- **Voice Processing**: Speech-to-text and text-to-speech
- **AI Integration**: Dual AI provider with intelligent routing
- **Service Discovery**: Microservices architecture
- **Circuit Breaker**: Fault tolerance
- **Rate Limiting**: Redis-backed rate limiting
- **Caching**: Multi-tier caching strategy
- **Load Balancing**: Health-based routing
- **WebSocket**: Real-time communication
- **Monitoring**: Comprehensive logging and metrics

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/              # API route handlers
│   │   ├── voice.ts        # Voice processing endpoints
│   │   └── legal.ts        # Legal compliance endpoints
│   ├── services/            # Business logic services
│   │   ├── voiceProcessingService.ts    # Voice I/O
│   │   ├── aiResponseService.ts         # AI integration
│   │   ├── serviceDiscovery.ts          # Service registry
│   │   ├── circuitBreaker.ts            # Fault tolerance
│   │   ├── cacheService.ts              # Caching layer
│   │   ├── rateLimitService.ts          # Rate limiting
│   │   ├── loadBalancer.ts              # Load balancing
│   │   ├── websocketHandler.ts          # WebSocket manager
│   │   ├── healthCheckService.ts        # Health monitoring
│   │   ├── legalComplianceService.ts    # Legal features
│   │   ├── sessionManager.ts            # Session management
│   │   ├── analyticsService.ts          # Analytics
│   │   ├── loggerService.ts             # Logging
│   │   └── ...                          # Other services
│   ├── types/               # TypeScript type definitions
│   │   ├── audio.ts        # Audio-related types
│   │   ├── conversation.ts # Conversation types
│   │   ├── errors.ts       # Error types
│   │   ├── websocket.ts    # WebSocket types
│   │   └── express.d.ts    # Express extensions
│   ├── utils/               # Utility functions
│   │   └── errorHandler.ts # Error handling
│   ├── test/                # Test files
│   │   ├── setup.ts        # Test configuration
│   │   ├── testHelpers.ts  # Test utilities
│   │   └── *.test.ts       # Test files
│   └── index.ts             # Application entry point
├── dist/                    # Compiled JavaScript (gitignored)
├── scripts/                 # Utility scripts
├── .env.example             # Environment template
├── .env.test                # Test environment
├── Dockerfile               # Docker configuration
├── healthcheck.js           # Docker health check
├── jest.config.js           # Jest configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Redis 6.0+
- OpenAI API key
- Groq API key (optional)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start Redis** (if not using Docker):
```bash
redis-server
```

4. **Run development server**:
```bash
npm run dev
```

The server will start at http://localhost:5000

### Docker Development

```bash
# From project root
npm run docker:up
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following:

```bash
# Server
NODE_ENV=development
PORT=5000
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# API Keys
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key

# Redis
REDIS_URL=redis://localhost:6379

# Features
SERVICE_DISCOVERY_ENABLED=true
LOAD_BALANCING_STRATEGY=health_based
RATE_LIMIT_ENABLED=true
CACHE_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## 📚 API Endpoints

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `POST /api/voice/upload` - Upload audio file
- `GET /api/voice/tts/:text` - Text-to-speech

### Legal Compliance
- `POST /api/legal/disclaimer/accept` - Accept disclaimer
- `GET /api/legal/disclaimer/status` - Check disclaimer status

### Service Discovery
- `GET /services` - List all services
- `GET /services/health` - System health
- `GET /services/stats` - Service statistics

### Health & Monitoring
- `GET /health` - Health check
- `GET /api/analytics/stats` - System statistics

### WebSocket
- `WS /socket.io` - Real-time communication

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npm test -- voiceRoutes.test.ts

# With coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Test individual services
- **Integration Tests**: Test API endpoints
- **Test Helpers**: Reusable test utilities in `src/test/testHelpers.ts`

### Test Environment

Tests use a separate `.env.test` file with mock API keys. See `docs/testing/BACKEND_TEST_ENVIRONMENT.md` for details.

## 🏗️ Development

### Build

```bash
# Compile TypeScript
npm run build

# Output in dist/
```

### Run Production Build

```bash
npm run build
npm start
```

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting
- Follow existing patterns

## 🔍 Key Services

### Voice Processing Service
Handles speech-to-text and text-to-speech using OpenAI Whisper and TTS.

### AI Response Service
Manages AI provider selection (OpenAI GPT-4 vs Groq) with intelligent routing based on query complexity.

### Service Discovery
Automatic service registration and discovery for microservices architecture.

### Circuit Breaker
Prevents cascading failures by monitoring service health and automatically opening/closing circuits.

### Cache Service
Multi-tier caching with Redis primary and in-memory fallback.

### Rate Limit Service
Redis-backed rate limiting with sliding window algorithm.

### Load Balancer
Intelligent request routing with multiple strategies:
- Round robin
- Least connections
- Health-based (default)

### WebSocket Handler
Manages real-time bidirectional communication for voice interactions.

## 📊 Monitoring

### Logging
- Structured JSON logging
- Correlation IDs for request tracking
- Multiple log levels (debug, info, warn, error)
- Log rotation and archival

### Health Checks
- Deep health monitoring
- Dependency health checks (Redis, AI services)
- Graceful degradation

### Analytics
- Usage statistics
- Performance metrics
- Error tracking
- Service discovery stats

## 🔒 Security

### Features
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Request validation
- **Error Handling**: Secure error responses

### Best Practices
- No sensitive data in logs
- API keys in environment variables
- Secure session management
- HTTPS in production

## 🐳 Docker

### Development
```bash
docker build -t ellie-backend:dev --target development .
docker run -p 5000:5000 ellie-backend:dev
```

### Production
```bash
docker build -t ellie-backend:prod --target production .
docker run -p 5000:5000 ellie-backend:prod
```

### Health Check
The Docker container includes a health check script (`healthcheck.js`) that verifies the server is responding.

## 📈 Performance

### Optimization Strategies
- Connection pooling (Redis)
- Response caching
- Circuit breakers for external services
- Load balancing
- Async/await patterns
- Efficient error handling

### Benchmarks
- Voice processing: ~2-5 seconds end-to-end
- Text processing: ~500ms-1s response time
- API throughput: 500+ requests/second
- WebSocket: 500+ concurrent connections

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Run tests before committing
5. Follow TypeScript best practices

## 📄 Documentation

- **API Documentation**: See endpoint comments in route files
- **Service Documentation**: See JSDoc comments in service files
- **Test Documentation**: See `docs/testing/`
- **Development Guide**: See `docs/development/`

## 🔄 Migration Notes

This is the primary active backend. A FastAPI (Python) migration experiment is archived in `docs/migration/backend-fastapi-reference/` for reference.

## 🆘 Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or use a different port
```

**Redis connection failed**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

**API key errors**:
- Verify `.env` file exists
- Check API keys are valid
- Ensure no extra spaces in `.env`

**Test failures**:
- Check `.env.test` exists
- Verify mock services are configured
- Run tests in isolation

## 📞 Support

- **Documentation**: Check `docs/` folder
- **Issues**: Create GitHub issue
- **Tests**: See `docs/testing/BACKEND_TEST_ENVIRONMENT.md`

---

**Version**: 1.0.0  
**License**: MIT  
**Maintained By**: Ellie Voice Receptionist Team
