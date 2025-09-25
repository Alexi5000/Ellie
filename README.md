# Ellie Voice Receptionist

A sophisticated voice-enabled AI legal assistant built with modern web technologies and containerized deployment.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+ (for local development)
- OpenAI API key
- Groq API key

### Development Environment
```bash
# 1. Clone and setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 2. Start development environment
npm run docker:up
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Nginx Proxy: http://localhost:80

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
├── backend/           # Node.js/Express API server
├── frontend/          # React/TypeScript client
├── docker/           # Docker configurations & scripts
├── scripts/          # Build and deployment scripts
├── tests/            # Integration tests
├── docs/             # Documentation
└── .kiro/            # Kiro IDE configuration
```

## 🏗️ Architecture

### Backend Stack
- **Node.js/Express** - RESTful API with WebSocket support
- **Dual AI Integration** - OpenAI GPT-4 + Groq with intelligent routing
- **Redis** - Caching and session management
- **Legal Compliance** - Built-in disclaimer and fallback systems

### Frontend Stack
- **React/TypeScript** - Modern UI with type safety
- **Real-time Voice** - WebSocket-based voice processing
- **Tailwind CSS** - Responsive design system
- **PWA Support** - Progressive Web App capabilities

### Infrastructure
- **Docker** - Containerized deployment
- **Nginx** - Reverse proxy and load balancer
- **Prometheus** - Monitoring and metrics
- **SSL/TLS** - Automated certificate management

## 🔧 Development

### Local Development
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend  
cd frontend && npm install && npm run dev
```

### Testing
```bash
npm run test:all        # All tests
npm run test:backend    # Backend only
npm run test:frontend   # Frontend only
npm run test:integration # Integration tests
```

### Docker Commands
```bash
npm run docker:up       # Start development
npm run docker:down     # Stop services
npm run docker:prod     # Production deployment
npm run docker:verify   # Verify configuration
npm run docker:test     # Test deployment
```

## 🌟 Key Features

- **🎤 Voice Processing** - Real-time speech-to-text and text-to-speech
- **🤖 AI Integration** - Dual provider support with intelligent routing
- **⚖️ Legal Compliance** - Built-in legal disclaimer management
- **🔒 Security** - SSL/TLS support with automated certificate generation
- **📊 Monitoring** - Comprehensive logging and Prometheus metrics
- **🐳 Containerized** - Full Docker support for all environments
- **🔄 Real-time** - WebSocket-based communication
- **📱 Responsive** - Mobile-friendly Progressive Web App

## 📚 Documentation

- [📖 Full Documentation](docs/README.md)
- [🚀 Deployment Guide](docs/deployment.md)
- [🔧 Development Setup](docs/development.md)
- [🧪 Testing Guide](docs/testing.md)
- [🏗️ Architecture](docs/architecture.md)

## 🔐 Environment Configuration

**Backend (.env)**:
```env
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://redis:6379
```

**Frontend**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🚀 API Endpoints

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `GET /api/voice/tts/:text` - Text-to-speech conversion
- `WebSocket /socket.io` - Real-time voice processing

### Health & Monitoring
- `GET /health` - Service health check
- `GET /api/analytics/stats` - System statistics

## 🛡️ Legal Compliance

- **Disclaimer Management** - Automatic legal disclaimers
- **Content Filtering** - Inappropriate content detection
- **Fallback Responses** - Professional fallback for service failures
- **Audit Logging** - Comprehensive compliance logging

## 📈 Monitoring

**Production Monitoring:**
- Application: http://your-domain.com
- Prometheus: http://your-domain.com:9090
- Health Check: http://your-domain.com/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

1. Check [documentation](docs/)
2. Review [troubleshooting guide](docs/troubleshooting.md)
3. Open a GitHub issue
4. Contact the development team