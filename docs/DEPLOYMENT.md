# Ellie Voice Receptionist - Production Deployment Guide

This guide covers the production deployment of the Ellie Voice Receptionist application using Docker containers with Nginx reverse proxy and SSL support.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured to point to your server
- SSL certificates (Let's Encrypt recommended)
- VPS or dedicated server with sufficient resources

## Quick Start

1. **Clone and prepare the application:**
   ```bash
   git clone <repository-url>
   cd ellie-voice-receptionist
   ```

2. **Configure environment variables:**
   ```bash
   cp backend/.env.example backend/.env.production
   # Edit backend/.env.production with your production values
   ```

3. **Set up SSL certificates:**
   ```bash
   # For self-signed certificates (development only)
   ./docker/ssl-setup.sh your-domain.com --self-signed
   
   # For production, place your certificates in:
   # ssl/certs/ellie.crt
   # ssl/private/ellie.key
   ```

4. **Update domain configuration:**
   ```bash
   # Edit docker-compose.prod.yml and replace "your-domain.com" with your actual domain
   sed -i 's/your-domain.com/yourdomain.com/g' docker-compose.prod.yml
   ```

5. **Deploy the application:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Detailed Configuration

### SSL Certificate Setup

#### Option 1: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to the project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/certs/ellie.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private/ellie.key
sudo chown $USER:$USER ssl/certs/ellie.crt ssl/private/ellie.key
```

#### Option 2: Self-Signed (Development Only)

```bash
# Linux/macOS
./docker/ssl-setup.sh yourdomain.com --self-signed

# Windows
powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain yourdomain.com -SelfSigned
```

### Environment Configuration

#### Backend Environment Variables

Edit `backend/.env.production`:

```env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key
GROQ_API_KEY=gsk_your-groq-key

# Domain Configuration
CORS_ORIGIN=https://yourdomain.com

# Security
SESSION_SECRET=your-secure-random-string
JWT_SECRET=another-secure-random-string

# Performance Tuning
RATE_LIMIT_MAX_REQUESTS=100
MAX_AUDIO_FILE_SIZE=10485760
```

#### Frontend Environment Variables

Update `docker-compose.prod.yml`:

```yaml
environment:
  - REACT_APP_API_URL=https://yourdomain.com
  - REACT_APP_SOCKET_URL=https://yourdomain.com
```

### Nginx Configuration

The production Nginx configuration includes:

- SSL/TLS termination with modern security settings
- Rate limiting for API endpoints
- Security headers (HSTS, CSP, etc.)
- Gzip compression
- WebSocket support for Socket.io
- Health check endpoints

Key features:
- **Rate Limiting**: 10 req/s for API, 5 req/s for voice processing
- **SSL Security**: TLS 1.2/1.3 with secure cipher suites
- **Security Headers**: XSS protection, content type sniffing prevention
- **Performance**: Gzip compression, connection keep-alive

### Health Checks and Monitoring

#### Health Check Endpoints

- **Frontend**: `https://yourdomain.com/health`
- **Backend**: `https://yourdomain.com/api/health`
- **Nginx Status**: `https://yourdomain.com/nginx-status` (restricted access)
- **Metrics**: `https://yourdomain.com/metrics` (Prometheus format)

#### Monitoring with Prometheus

The production setup includes Prometheus monitoring:

```bash
# Access Prometheus dashboard
http://yourdomain.com:9090
```

Available metrics:
- Request rates and response times
- WebSocket connection counts
- Service health status
- Error rates and types

## Deployment Commands

### Initial Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Updates and Maintenance

```bash
# Update application
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Backup and Recovery

```bash
# Backup configuration
tar -czf ellie-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.prod.yml \
  docker/ \
  ssl/ \
  backend/.env.production

# Stop services for maintenance
docker-compose -f docker-compose.prod.yml down

# Start services after maintenance
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

### SSL/TLS Configuration

- Use TLS 1.2 or higher
- Implement HSTS headers
- Regular certificate renewal (Let's Encrypt auto-renewal recommended)

### API Security

- Rate limiting enabled by default
- CORS properly configured
- Input validation on all endpoints
- No sensitive data in logs

### Container Security

- Non-root user in containers
- Minimal base images
- Regular security updates
- Environment variable protection

## Performance Optimization

### Resource Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Network: 100Mbps

**Recommended for Production:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 1Gbps

### Scaling Considerations

- Backend can be horizontally scaled
- Use load balancer for multiple backend instances
- Consider CDN for static assets
- Database clustering for high availability (future enhancement)

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/certs/ellie.crt -text -noout
   
   # Verify certificate chain
   openssl verify -CAfile ssl/certs/ca-bundle.crt ssl/certs/ellie.crt
   ```

2. **Service Health Check Failures**
   ```bash
   # Check service logs
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Test health endpoints
   curl -k https://yourdomain.com/health
   ```

3. **Rate Limiting Issues**
   ```bash
   # Check Nginx logs
   docker-compose -f docker-compose.prod.yml logs nginx
   
   # Adjust rate limits in docker/nginx-production.conf
   ```

### Log Analysis

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# System resource usage
docker stats
```

## Testing Production Deployment

Run the production deployment tests:

```bash
# Install test dependencies
npm install --dev

# Run production configuration tests
npm run test:production

# Run Docker integration tests
npm run test:docker
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Certificate Renewal** (monthly)
2. **Security Updates** (weekly)
3. **Log Rotation** (daily)
4. **Backup Verification** (weekly)
5. **Performance Monitoring** (continuous)

### Monitoring Alerts

Set up alerts for:
- Service downtime
- High error rates
- Certificate expiration
- Resource exhaustion
- Security incidents

For additional support, refer to the main README.md or create an issue in the project repository.