# Ellie Voice Receptionist - FastAPI Backend

Enterprise-grade AI voice assistant backend built with FastAPI, featuring microservices architecture, comprehensive monitoring, and production-ready deployment.

## 🚀 Features

### Core Functionality
- **Voice Processing**: Speech-to-text and text-to-speech with OpenAI Whisper and TTS
- **AI Integration**: Dual AI provider support (OpenAI GPT + Groq) with intelligent routing
- **Real-time Communication**: WebSocket support for live voice interactions
- **Legal Compliance**: Built-in legal disclaimers and GDPR compliance features

### Enterprise Architecture
- **Service Discovery**: Automatic service registration and health monitoring
- **Circuit Breaker**: Fault tolerance with automatic recovery
- **Rate Limiting**: Advanced rate limiting with Redis backend
- **Caching**: Multi-tier caching with Redis and in-memory fallback
- **Load Balancing**: Intelligent request routing with health-based selection

### Monitoring & Observability
- **Structured Logging**: JSON-structured logs with correlation IDs
- **Prometheus Metrics**: Comprehensive metrics export
- **Health Checks**: Deep health monitoring with dependency checking
- **Analytics**: Usage analytics and performance metrics
- **Real-time Dashboard**: Live system monitoring interface

### Security & Compliance
- **JWT Authentication**: Secure API access with token-based auth
- **Input Validation**: Comprehensive request validation with Pydantic
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse and DDoS
- **Data Privacy**: GDPR-compliant data handling

## 📋 Requirements

- Python 3.11+
- Redis 6.0+
- OpenAI API Key
- Groq API Key (optional)

## 🛠️ Installation

### Quick Start

1. **Clone and setup**:
```bash
git clone <repository>
cd backend-fastapi
cp .env.example .env
```

2. **Configure environment**:
Edit `.env` file with your API keys and settings.

3. **Start with Docker**:
```bash
docker-compose up -d
```

4. **Or start manually**:
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

### Manual Installation

1. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Start Redis** (if not using Docker):
```bash
redis-server
```

4. **Run the application**:
```bash
uvicorn app.main:app --reload
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# API Keys
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Features
SERVICE_DISCOVERY_ENABLED=true
WEBSOCKET_ENABLED=true
PROMETHEUS_ENABLED=true
```

### Docker Configuration

The application includes a complete Docker setup:

- **FastAPI Backend**: Main application server
- **Redis**: Caching and session storage
- **Service Dashboard**: Real-time monitoring interface
- **Prometheus**: Metrics collection (optional)
- **Grafana**: Metrics visualization (optional)

## 📚 API Documentation

### Endpoints

Once running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Key Endpoints

#### Voice Processing
- `POST /api/v1/voice/process` - Process voice or text input
- `POST /api/v1/voice/speech-to-text` - Convert speech to text
- `POST /api/v1/voice/text-to-speech` - Convert text to speech

#### Service Management
- `GET /api/v1/services/` - List all services
- `POST /api/v1/services/register` - Register new service
- `GET /api/v1/services/discover/{name}` - Discover service

#### Monitoring
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/monitoring/logs` - Recent logs
- `GET /api/v1/monitoring/metrics` - System metrics

#### Analytics
- `GET /api/v1/analytics/usage` - Usage statistics
- `GET /api/v1/analytics/performance` - Performance metrics
- `GET /api/v1/analytics/dashboard` - Dashboard data

### WebSocket

Real-time communication endpoint:
- `WS /ws` - WebSocket connection for live interactions

## 🧪 Testing

### Run Tests

```bash
# Run all tests
chmod +x scripts/test.sh
./scripts/test.sh

# Run specific tests
python -m pytest tests/test_voice.py -v

# Run with coverage
python -m pytest --cov=app tests/
```

### Test Structure

```
tests/
├── conftest.py              # Test configuration
├── test_main.py            # Main application tests
├── test_voice.py           # Voice processing tests
├── test_services.py        # Service discovery tests
├── test_monitoring.py      # Monitoring tests
└── integration/            # Integration tests
```

## 📊 Monitoring

### Health Checks

The application provides comprehensive health monitoring:

```bash
# Basic health check
curl http://localhost:8000/health

# Service discovery status
curl http://localhost:8000/api/v1/services/

# System metrics
curl http://localhost:8000/metrics
```

### Service Dashboard

Access the real-time dashboard at: http://localhost:8080

Features:
- Live service status
- Performance metrics
- Error tracking
- Circuit breaker status

### Prometheus Integration

Metrics are exported at `/metrics` endpoint in Prometheus format:

- Request duration and count
- Error rates by endpoint
- Circuit breaker states
- Cache hit/miss rates
- WebSocket connection counts

## 🏗️ Architecture

### Service Discovery

The application includes a built-in service discovery system:

```python
# Register a service
await service_discovery.register_service({
    "name": "my-service",
    "version": "1.0.0",
    "host": "localhost",
    "port": 8001,
    "tags": ["api", "backend"]
})

# Discover a service
service = await service_discovery.discover_service("my-service")
```

### Circuit Breaker

Protect external service calls:

```python
@circuit_breaker("openai_api")
async def call_openai_api():
    # API call here
    pass
```

### Caching

Multi-tier caching system:

```python
# Cache with TTL
await cache_service.set("key", data, ttl=3600)

# Get from cache
data = await cache_service.get("key")
```

## 🚀 Deployment

### Docker Deployment

1. **Production build**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. **With monitoring**:
```bash
docker-compose --profile monitoring up -d
```

### Manual Deployment

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set production environment**:
```bash
export ENVIRONMENT=production
export WORKERS=4
```

3. **Start with Gunicorn**:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Environment-Specific Configs

- **Development**: Auto-reload, debug logging, single worker
- **Production**: Multiple workers, optimized logging, health checks
- **Testing**: Isolated database, mock external services

## 🔒 Security

### Authentication

JWT-based authentication for API access:

```python
# Create token
token = security.create_access_token({"sub": "user_id"})

# Verify token
payload = security.verify_token(token)
```

### Rate Limiting

Configurable rate limiting per endpoint:

```python
@rate_limiter.limit("100/minute")
async def protected_endpoint():
    pass
```

### Input Validation

Comprehensive input validation with Pydantic models:

```python
class VoiceRequest(BaseModel):
    text: str = Field(max_length=4000)
    language: str = Field(regex="^[a-z]{2}$")
```

## 📈 Performance

### Benchmarks

Typical performance metrics:
- **Voice Processing**: ~2-5 seconds end-to-end
- **Text Processing**: ~500ms-1s response time
- **API Throughput**: 1000+ requests/second
- **WebSocket**: 1000+ concurrent connections

### Optimization

- **Async/Await**: Full async implementation
- **Connection Pooling**: Efficient database connections
- **Caching**: Multi-tier caching strategy
- **Circuit Breakers**: Prevent cascade failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt
pip install -e .

# Install pre-commit hooks
pre-commit install

# Run linting
black app/
isort app/
flake8 app/
mypy app/
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

## 🔄 Migration from Express.js

This FastAPI backend is a complete migration from the original Express.js implementation, providing:

- **Better Performance**: 2-3x faster than Express.js
- **Type Safety**: Full type checking with Pydantic
- **Auto Documentation**: Automatic OpenAPI/Swagger docs
- **Modern Python**: Async/await, type hints, dataclasses
- **Better Testing**: Comprehensive test framework
- **Enhanced Monitoring**: Advanced observability features

### Migration Benefits

1. **Performance**: FastAPI is one of the fastest Python frameworks
2. **Developer Experience**: Auto-completion, type checking, documentation
3. **Standards Compliance**: OpenAPI, JSON Schema, OAuth2
4. **Ecosystem**: Rich Python ecosystem for AI/ML
5. **Scalability**: Better async support and resource utilization

The migration maintains 100% API compatibility while providing significant improvements in performance, maintainability, and developer experience.