# Service Discovery Implementation

## Overview

Ellie Voice Receptionist implements a comprehensive service discovery system that provides automatic service registration, health monitoring, load balancing, and fault tolerance. This system ensures high availability and scalability across all application components.

## Architecture Components

### 1. Service Discovery Core
- **ServiceDiscovery**: Central registry for all services
- **ServiceManager**: Manages service lifecycle and dependencies
- **HealthCheckService**: Monitors service health continuously
- **LoadBalancer**: Distributes requests across healthy service instances
- **CircuitBreaker**: Provides fault tolerance and prevents cascading failures
- **APIGateway**: Routes requests to appropriate services

### 2. Key Features

#### Service Registration
```typescript
const serviceInfo = {
  id: 'unique-service-id',
  name: 'service-name',
  version: '1.0.0',
  host: 'localhost',
  port: 3001,
  protocol: 'http',
  healthEndpoint: '/health',
  tags: ['api', 'backend'],
  dependencies: ['redis', 'database'],
  metadata: { environment: 'production' }
};

await serviceDiscovery.registerService(serviceInfo);
```

#### Service Discovery
```typescript
// Find all healthy instances of a service
const services = serviceDiscovery.discoverServices('api-service');

// Find services with specific tags
const backendServices = serviceDiscovery.discoverServices('api-service', ['backend']);

// Get a single instance using load balancing
const instance = loadBalancer.getServiceInstance('api-service');
```

#### Health Monitoring
```typescript
// Get system-wide health status
const systemHealth = healthCheckService.getSystemHealth();

// Get health for specific service
const serviceHealth = healthCheckService.getServiceHealth('service-id');
```

#### Circuit Breaker Protection
```typescript
// Execute with circuit breaker protection
const result = await circuitBreakerManager.execute('external-api', async () => {
  return await externalApiCall();
});
```

## Load Balancing Strategies

### 1. Round Robin
Distributes requests evenly across all healthy instances.

### 2. Least Connections
Routes to the instance with the fewest active connections.

### 3. Weighted Round Robin
Considers service weights for distribution.

### 4. Random
Randomly selects from healthy instances.

### 5. Health-Based (Default)
Considers response time, error rate, and connection count to select the best instance.

```typescript
loadBalancer.setStrategy(LoadBalancingStrategy.HEALTH_BASED);
```

## Service Health Checks

### Health Check Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "memory": {
    "used": 128,
    "total": 512,
    "percentage": 25
  },
  "dependencies": {
    "redis": true,
    "database": true
  }
}
```

### Health Status Levels
- **Healthy**: Service is fully operational
- **Degraded**: Service is operational but with reduced performance
- **Unhealthy**: Service is not operational

## Circuit Breaker Configuration

### Default Settings
```typescript
{
  failureThreshold: 5,      // Failures before opening
  recoveryTimeout: 60000,   // Time before trying half-open (ms)
  successThreshold: 3,      // Successes needed to close
  timeout: 30000,          // Request timeout (ms)
  monitoringPeriod: 300000 // Failure counting window (ms)
}
```

### Circuit States
- **Closed**: Normal operation, requests pass through
- **Open**: Circuit is open, requests fail fast
- **Half-Open**: Testing if service has recovered

## API Gateway Integration

### Route Registration
```typescript
apiGateway.registerRoute({
  path: '/api/users/*',
  method: 'GET',
  serviceName: 'user-service',
  targetPath: '/users',
  timeout: 10000,
  rateLimit: { windowMs: 60000, max: 100 }
});
```

### Request Flow
1. Client sends request to API Gateway
2. Gateway discovers healthy service instances
3. Load balancer selects optimal instance
4. Circuit breaker protects against failures
5. Request is proxied to target service
6. Response is returned to client

## Service Dependencies

### Dependency Management
Services can declare dependencies that must be available before startup:

```typescript
const serviceDefinition = {
  name: 'user-service',
  dependencies: ['database', 'redis', 'auth-service'],
  // ... other config
};
```

### Startup Order
The ServiceManager automatically calculates startup order based on dependencies:
1. Services with no dependencies start first
2. Dependent services wait for their dependencies
3. Circular dependencies are detected and prevented

## Monitoring and Observability

### Service Discovery Dashboard
Access the dashboard at `http://localhost:8080` to view:
- System health overview
- Service registration status
- Load balancer statistics
- Circuit breaker states
- Real-time service metrics

### Metrics Endpoints
- `/services` - List all registered services
- `/services/health` - System health status
- `/services/stats` - Detailed statistics
- `/health` - Application health check

### Prometheus Integration
Service discovery metrics are exposed in Prometheus format:
```
ellie_service_health{service="user-service"} 1
ellie_service_response_time_ms{service="user-service"} 150
ellie_circuit_breaker_state{service="user-service"} 0
```

## Configuration

### Environment Variables
```bash
# Service Discovery
SERVICE_DISCOVERY_ENABLED=true
LOAD_BALANCING_STRATEGY=health_based
HEALTH_CHECK_INTERVAL=30000
CIRCUIT_BREAKER_THRESHOLD=5

# Service Registration
SERVICE_NAME=ellie-backend
SERVICE_VERSION=1.0.0
SERVICE_HOST=localhost
SERVICE_PORT=5000
SERVICE_TAGS=api,backend,critical
```

### Docker Labels
Services are automatically discovered using Docker labels:
```yaml
labels:
  - "service.name=ellie-backend"
  - "service.version=1.0.0"
  - "service.tags=backend,api,nodejs"
```

## Best Practices

### 1. Health Check Implementation
```typescript
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {
      redis: await checkRedisConnection(),
      database: await checkDatabaseConnection()
    }
  };
  
  const isHealthy = Object.values(health.dependencies).every(Boolean);
  const status = isHealthy ? 'healthy' : 'degraded';
  
  res.status(isHealthy ? 200 : 503).json({ ...health, status });
});
```

### 2. Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  // Deregister from service discovery
  serviceDiscovery.deregisterService('my-service', serviceId);
  
  // Stop accepting new requests
  server.close();
  
  // Wait for existing requests to complete
  await waitForRequestsToComplete();
  
  process.exit(0);
});
```

### 3. Error Handling
```typescript
// Use circuit breaker for external calls
const result = await circuitBreakerManager.execute('external-api', async () => {
  const response = await fetch('https://api.external.com/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
});
```

### 4. Service Tagging
Use meaningful tags for service discovery:
- Environment: `production`, `staging`, `development`
- Type: `api`, `database`, `cache`, `queue`
- Role: `frontend`, `backend`, `worker`
- Criticality: `critical`, `important`, `optional`

## Troubleshooting

### Common Issues

#### 1. Service Not Discovered
- Check service registration
- Verify health check endpoint
- Confirm service tags match discovery criteria

#### 2. Load Balancing Issues
- Review load balancing strategy
- Check service metrics and health scores
- Verify connection tracking

#### 3. Circuit Breaker Problems
- Adjust failure threshold and timeout settings
- Monitor error rates and response times
- Check circuit breaker state transitions

#### 4. Health Check Failures
- Verify health endpoint accessibility
- Check dependency availability
- Review health check timeout settings

### Debugging Commands
```bash
# Check service registration
curl http://localhost:5000/services

# View system health
curl http://localhost:5000/services/health

# Get detailed statistics
curl http://localhost:5000/services/stats

# Monitor circuit breaker states
curl http://localhost:5000/services/stats | jq '.circuitBreaker'
```

## Performance Considerations

### Scalability
- Service discovery supports thousands of service instances
- Health checks are performed asynchronously
- Load balancing decisions are cached for performance
- Circuit breaker state is maintained in memory

### Resource Usage
- Minimal memory footprint per service instance
- Configurable health check intervals
- Automatic cleanup of deregistered services
- Efficient data structures for fast lookups

### Network Optimization
- Health checks use HTTP/1.1 keep-alive
- Batch operations where possible
- Configurable timeouts and retries
- Compression for large responses

## Security

### Access Control
- Service registration requires authentication
- Health endpoints should be protected
- Circuit breaker metrics may contain sensitive data
- Use HTTPS for production deployments

### Network Security
- Services communicate over private networks
- Health checks use secure protocols
- API Gateway provides centralized security
- Rate limiting prevents abuse

## Future Enhancements

### Planned Features
- Service mesh integration
- Advanced routing rules
- Distributed tracing
- Auto-scaling integration
- Multi-region support
- Service versioning and canary deployments

### Integration Opportunities
- Kubernetes service discovery
- Consul/etcd backends
- Istio service mesh
- AWS ECS/EKS integration
- Docker Swarm mode support