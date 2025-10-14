# Docker - Containerized Deployment Configuration

> Complete Docker setup with service orchestration, Nginx reverse proxy, SSL/TLS support, monitoring, and automated deployment scripts.

## 🚀 Quick Start

```bash
# Start development environment
npm run docker:up

# Start production environment
npm run docker:prod

# Stop all services
npm run docker:down
```

## 📁 Structure

```
docker/
├── docker-compose.yml           # Development configuration
├── docker-compose.prod.yml      # Production configuration
├── nginx/                       # Nginx configuration
│   ├── nginx.conf              # Main Nginx config
│   └── default.conf            # Site configuration
├── ssl/                         # SSL certificates
│   ├── ssl-setup.sh            # SSL setup script (Linux/macOS)
│   └── ssl-setup.ps1           # SSL setup script (Windows)
├── monitoring/                  # Monitoring configuration
│   └── prometheus.yml          # Prometheus config
└── scripts/                     # Deployment scripts
    ├── verify-docker-config.ps1
    └── docker-deployment-test.ps1
```

## 🐳 Services

### Development Environment
- **Frontend** - React development server (port 3000)
- **Backend** - Node.js API server (port 5000)
- **Nginx** - Reverse proxy (port 80)
- **Redis** - Caching and sessions (port 6379)
- **Service Dashboard** - Monitoring interface (port 8080)

### Production Environment
- **Frontend** - Optimized production build
- **Backend** - Production API server
- **Nginx** - SSL/TLS enabled reverse proxy (ports 80, 443)
- **Redis** - Production caching
- **Prometheus** - Metrics collection (port 9090)

## 🔧 Configuration

### Docker Compose

**Development** (`docker-compose.yml`):
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - NODE_ENV=development
```

**Production** (`docker-compose.prod.yml`):
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
```

### Nginx Configuration

**Reverse Proxy**:
- Routes `/api/*` to backend
- Routes `/socket.io/*` to backend WebSocket
- Serves frontend static files
- SSL/TLS termination
- Gzip compression
- Security headers

## 🔒 SSL/TLS Setup

### Generate Certificates

**Windows**:
```powershell
cd docker
.\ssl-setup.ps1
```

**Linux/macOS**:
```bash
cd docker
bash ssl-setup.sh
```

### Certificate Files
- `ssl/cert.pem` - SSL certificate
- `ssl/key.pem` - Private key
- `ssl/dhparam.pem` - Diffie-Hellman parameters

## 📊 Monitoring

### Prometheus
Access metrics at: http://localhost:9090

**Metrics Collected**:
- HTTP request duration
- Request count by endpoint
- Error rates
- Service health status
- System resources

### Service Dashboard
Access dashboard at: http://localhost:8080

**Features**:
- Real-time service status
- Health check monitoring
- Service discovery visualization
- Performance metrics

## 🛠️ Development

### Start Services
```bash
# Start all services
npm run docker:up

# Start specific service
docker-compose up frontend

# Start in detached mode
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build frontend

# Rebuild without cache
docker-compose build --no-cache
```

## 🚀 Production Deployment

### Prerequisites
1. SSL certificates generated
2. Environment variables configured
3. Production `.env` files created

### Deploy
```bash
# 1. Build production images
docker-compose -f docker-compose.prod.yml build

# 2. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify deployment
npm run docker:verify
```

### Health Checks
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose ps backend

# View service health
curl http://localhost/health
```

## 🧪 Testing

### Verify Configuration
```bash
# Windows
npm run docker:verify

# Test deployment
npm run docker:test
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

## 🔄 Updates & Maintenance

### Update Images
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 📖 Documentation

- [Main README](../README.md) - Project overview
- [Deployment Guide](../docs/deployment/DEPLOYMENT.md) - Production deployment
- [SSL Setup Guide](../docs/deployment/SSL_SETUP_GUIDE.md) - SSL configuration
- [Service Discovery](../docs/service-discovery.md) - Architecture

## 🆘 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Alexi5000/Ellie/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Alexi5000/Ellie/discussions)
- 📧 **Email**: alex@techtideai.io

---

**Maintained by**: Alex Cinovoj, TechTide AI  
**Version**: 1.0.0  
**License**: MIT
