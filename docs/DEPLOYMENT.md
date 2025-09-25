# Deployment Guide

This guide covers deploying Ellie Voice Receptionist using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher
- Node.js 18+ (for local development)
- OpenSSL (for SSL certificate generation)

## Quick Deployment

### Development Environment

```bash
# Start development environment
npm run docker:up

# Or directly with Docker Compose
cd docker
docker-compose up --build
```

**Services Available:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Nginx Proxy: http://localhost:80
- Redis: localhost:6380

### Production Environment

```bash
# Start production environment
npm run docker:prod

# Or directly with Docker Compose
cd docker
docker-compose -f docker-compose.prod.yml up --build
```

**Services Available:**
- Application: http://localhost:80 (https://localhost:443 with SSL)
- Monitoring: http://localhost:9090

## Configuration

### Environment Variables

Create the following environment files:

**backend/.env** (Development):
```env
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://redis:6379
```

**backend/.env.production** (Production):
```env
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://redis:6379
```

### SSL Configuration

Generate SSL certificates for production:

```bash
# Using PowerShell (Windows)
npm run ssl:setup-windows

# Using Bash (Linux/macOS/WSL)
npm run ssl:setup
```

## Verification

### Configuration Verification

```bash
# Verify Docker configuration
npm run docker:verify
```

### Deployment Testing

```bash
# Test both development and production deployments
npm run docker:test

# Test with SSL certificate generation
cd docker
powershell -ExecutionPolicy Bypass -File docker-deployment-test.ps1 -TestSSL
```

## Monitoring

The production environment includes Prometheus monitoring:

- **Prometheus UI**: http://localhost:9090
- **Metrics Endpoints**:
  - Backend health: http://backend:5000/health
  - Frontend health: http://frontend:3000/health
  - Nginx status: http://nginx:80/nginx-status

## Scaling

### Horizontal Scaling

Scale individual services:

```bash
cd docker
docker-compose up --scale backend=3 --scale frontend=2
```

### Resource Limits

Modify docker-compose files to add resource constraints:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Backup and Recovery

### Redis Data Backup

```bash
# Create backup
docker exec ellie-redis-1 redis-cli BGSAVE

# Copy backup file
docker cp ellie-redis-1:/data/dump.rdb ./backup/
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm -v ellie_redis_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 80, 443, 3000, 5000, 6380, 9090 are available
2. **Memory Issues**: Increase Docker Desktop memory allocation
3. **SSL Certificate Issues**: Ensure OpenSSL is installed and accessible

### Logs

```bash
# View all service logs
cd docker
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks

```bash
# Check service health
curl http://localhost:5000/health
curl http://localhost:3000/health
```

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates generated
- [ ] Firewall rules configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Resource limits set
- [ ] Health checks verified