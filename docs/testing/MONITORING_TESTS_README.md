# Monitoring Endpoints Testing Guide

This guide explains how to test the monitoring endpoints and metrics collection system for the Ellie Voice Receptionist backend.

## Overview

The monitoring system provides comprehensive observability through multiple endpoints:

- **Health Checks**: System and service health status
- **Metrics**: Prometheus-compatible metrics for monitoring tools
- **Logs**: Structured logging with search and export capabilities
- **Analytics**: Usage, performance, and business metrics
- **APM**: Application performance monitoring
- **Cache Management**: Cache statistics and control
- **CDN Management**: CDN configuration and purging

## Running Tests

### Automated Unit Tests

Run the comprehensive test suite that validates all monitoring endpoints:

```bash
# Navigate to backend directory
cd backend

# Run monitoring tests
npm test -- monitoring.test.ts

# Run with verbose output
npm test -- monitoring.test.ts --verbose
```

**Expected Output:**
```
Test Suites: 1 passed, 1 total
Tests:       54 passed, 54 total
Time:        ~5-6 seconds
```

### Integration Tests (Against Running Server)

Test monitoring endpoints against a live backend instance:

#### Windows (PowerShell)

```powershell
# Test against local development server
.\backend\scripts\test-monitoring-endpoints.ps1

# Test against custom URL
.\backend\scripts\test-monitoring-endpoints.ps1 -BaseUrl "http://localhost:5000"

# Run with verbose output
.\backend\scripts\test-monitoring-endpoints.ps1 -Verbose

# Test against production server
.\backend\scripts\test-monitoring-endpoints.ps1 -BaseUrl "https://your-domain.com"
```

#### Linux/Mac (Bash)

```bash
# Make script executable (first time only)
chmod +x backend/scripts/test-monitoring-endpoints.sh

# Test against local development server
./backend/scripts/test-monitoring-endpoints.sh

# Test against custom URL
./backend/scripts/test-monitoring-endpoints.sh http://localhost:5000

# Run with verbose output
./backend/scripts/test-monitoring-endpoints.sh http://localhost:5000 true

# Test against production server
./backend/scripts/test-monitoring-endpoints.sh https://your-domain.com
```

## Test Coverage

### 1. Core Health and Metrics (5 tests)
- Health check endpoint
- Prometheus metrics endpoint
- Service discovery
- System health status
- Service statistics

### 2. Monitoring API (6 tests)
- Recent logs retrieval
- Log filtering by level
- Error statistics
- Fallback statistics

### 3. Cache Management (3 tests)
- Cache statistics
- Cache clearing
- Cache invalidation by pattern

### 4. CDN Management (3 tests)
- CDN configuration
- CDN statistics
- CDN cache purging

### 5. Analytics (6 tests)
- Usage metrics
- Performance metrics
- Business metrics
- Dashboard data
- Data export (JSON, CSV)

### 6. APM (3 tests)
- APM metrics
- Active operations
- Transaction details

### 7. Advanced Logging (7 tests)
- Log metrics
- Log search with filters
- Log aggregations
- Active alerts
- Alert resolution
- Log export (JSON, CSV, TXT)

### 8. Integration Tests (3 tests)
- Metrics collection across requests
- Service health tracking over time
- Consistent metrics format

### 9. Error Handling (3 tests)
- Invalid parameter handling
- Missing parameter handling
- Appropriate status codes

**Total: 54 tests**

## Manual Testing

### Using curl

```bash
# Health check
curl http://localhost:5000/health

# Prometheus metrics
curl http://localhost:5000/metrics

# Service discovery
curl http://localhost:5000/services

# Recent logs
curl http://localhost:5000/api/monitoring/logs?count=10

# Error statistics
curl http://localhost:5000/api/monitoring/errors

# Cache statistics
curl http://localhost:5000/api/cache/stats

# Analytics dashboard
curl http://localhost:5000/api/analytics/dashboard

# Export logs as JSON
curl http://localhost:5000/api/logs/export?format=json -o logs.json
```

### Using PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health" | ConvertTo-Json

# Prometheus metrics
Invoke-RestMethod -Uri "http://localhost:5000/metrics"

# Service discovery
Invoke-RestMethod -Uri "http://localhost:5000/services" | ConvertTo-Json

# Recent logs
Invoke-RestMethod -Uri "http://localhost:5000/api/monitoring/logs?count=10" | ConvertTo-Json

# Clear cache
Invoke-RestMethod -Uri "http://localhost:5000/api/cache/clear" -Method POST | ConvertTo-Json

# Export analytics
Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/export?format=json" -OutFile "analytics.json"
```

### Using Browser

Navigate to these URLs in your browser:

- Health: http://localhost:5000/health
- Services: http://localhost:5000/services
- Service Health: http://localhost:5000/services/health
- Service Stats: http://localhost:5000/services/stats
- Analytics Dashboard: http://localhost:5000/api/analytics/dashboard

## Prometheus Integration

### Configure Prometheus

Add this to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'ellie-backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Verify Prometheus Scraping

```bash
# Check if Prometheus can reach the metrics endpoint
curl http://localhost:5000/metrics

# Verify metrics format
curl http://localhost:5000/metrics | grep "ellie_"
```

### Key Metrics to Monitor

- `ellie_uptime_seconds` - System uptime
- `ellie_memory_usage_bytes` - Memory consumption
- `ellie_websocket_connections` - Active connections
- `ellie_service_health` - Service health (1=healthy, 0=unhealthy)
- `ellie_service_response_time_ms` - Response times
- `ellie_errors_total` - Error counts by type
- `ellie_rate_limit_*` - Rate limiting metrics

## Grafana Dashboard

### Sample Queries

```promql
# System uptime
ellie_uptime_seconds

# Memory usage percentage
(ellie_memory_usage_bytes{type="heap_used"} / ellie_memory_usage_bytes{type="heap_total"}) * 100

# Active WebSocket connections
ellie_websocket_connections

# Service health status
ellie_service_health

# Error rate (errors per minute)
rate(ellie_errors_total[1m])

# Average response time
avg(ellie_service_response_time_ms)
```

## Troubleshooting

### Tests Failing

1. **Server not running**: Ensure the backend is running on the expected port
   ```bash
   cd backend
   npm run dev
   ```

2. **Port conflicts**: Check if another service is using port 5000
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

3. **Environment variables**: Ensure `.env` file is configured
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your API keys
   ```

### Metrics Endpoint Returns 500

This can happen if services aren't fully initialized. Check:

1. WebSocket handler initialization
2. Fallback service availability
3. Rate limit service configuration

### Redis-Related Tests Failing

If Redis is not running, cache-related tests will show degraded functionality:

```bash
# Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# Or use docker-compose
docker-compose up -d redis
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Monitoring Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test -- monitoring.test.ts
```

## Performance Benchmarks

Expected response times (local development):

- `/health`: < 50ms
- `/metrics`: < 100ms
- `/services`: < 50ms
- `/api/monitoring/logs`: < 100ms
- `/api/analytics/dashboard`: < 200ms

## Security Considerations

1. **Production Deployment**: Restrict access to monitoring endpoints
2. **API Keys**: Never expose API keys in metrics or logs
3. **Rate Limiting**: Monitoring endpoints are subject to rate limiting
4. **CORS**: Configure CORS appropriately for your domain

## Related Documentation

- [Monitoring Test Report](./MONITORING_TEST_REPORT.md) - Detailed test results
- [Deployment Guide](../docs/DEPLOYMENT.md) - Production deployment
- [Service Discovery](../docs/service-discovery.md) - Service architecture
- [SSL Setup Guide](../docs/SSL_SETUP_GUIDE.md) - HTTPS configuration

## Support

For issues or questions:

1. Check the test output for specific error messages
2. Review the [Monitoring Test Report](./MONITORING_TEST_REPORT.md)
3. Verify environment configuration
4. Check service logs for detailed error information
