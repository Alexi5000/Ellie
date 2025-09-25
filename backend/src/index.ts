/**
 * Ellie Voice Receptionist Backend Server
 * Requirements: 5.4, 5.5
 */

/// <reference path="./types/express.d.ts" />

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from './utils/errorHandler';
import { ERROR_CODES } from './types/errors';
import { WebSocketHandler } from './services/websocketHandler';
import { logger } from './services/loggerService';
import { rateLimitService } from './services/rateLimitService';
import { fallbackService } from './services/fallbackService';
import { cacheService } from './services/cacheService';
import { cdnService } from './services/cdnService';
import { analyticsService } from './services/analyticsService';
import { apmService } from './services/apmService';
import { advancedLoggerService } from './services/advancedLoggerService';

// Import service discovery and management
import { serviceManager, ServiceDefinition } from './services/serviceManager';
import { serviceDiscovery } from './services/serviceDiscovery';
import { healthCheckService } from './services/healthCheckService';
import { apiGateway } from './services/apiGateway';
import { loadBalancer, LoadBalancingStrategy } from './services/loadBalancer';
import { circuitBreakerManager } from './services/circuitBreaker';

import voiceRoutes from './routes/voice';
import legalRoutes from './routes/legal';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Enhanced rate limiting with queue system
app.use(rateLimitService.createApiRateLimiter());

// CDN and static asset optimization middleware
app.use(cdnService.cacheMiddleware());

// APM middleware for request tracking
app.use(apmService.createExpressMiddleware());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  // Log request start
  logger.info(`Incoming request: ${method} ${url}`, {
    requestId,
    method,
    url,
    service: 'api',
    metadata: {
      ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    }
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    logger.logRequest(method, url, statusCode, duration, requestId);
  });
  
  // Log errors
  res.on('error', (error) => {
    logger.error(`Response error: ${method} ${url}`, {
      requestId,
      method,
      url,
      service: 'api',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  });
  
  next();
});

// Initialize service discovery and management
async function initializeServices() {
  try {
    // Register this backend service
    const backendServiceDef: ServiceDefinition = {
      name: 'ellie-backend',
      version: '1.0.0',
      host: HOST,
      port: Number(PORT),
      protocol: 'http',
      healthEndpoint: '/health',
      tags: ['api', 'backend', 'critical'],
      dependencies: [], // No dependencies for the main backend
      routes: [
        {
          path: '/api/voice/*',
          method: 'POST',
          serviceName: 'ellie-backend',
          targetPath: '/api/voice',
          timeout: 30000,
          rateLimit: { windowMs: 60000, max: 100 }
        },
        {
          path: '/api/analytics/*',
          method: 'GET',
          serviceName: 'ellie-backend',
          targetPath: '/api/analytics',
          timeout: 10000
        }
      ],
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.FRONTEND_URL || "http://localhost:3000",
        weight: 1
      },
      startupTimeout: 30000,
      shutdownTimeout: 10000
    };

    // Register external services that we depend on
    const externalServices: ServiceDefinition[] = [
      {
        name: 'openai-api',
        version: '1.0.0',
        host: 'api.openai.com',
        port: 443,
        protocol: 'https',
        healthEndpoint: '/v1/models',
        tags: ['ai', 'external', 'openai'],
        dependencies: [],
        metadata: { provider: 'openai', type: 'ai-service' }
      },
      {
        name: 'groq-api',
        version: '1.0.0',
        host: 'api.groq.com',
        port: 443,
        protocol: 'https',
        healthEndpoint: '/openai/v1/models',
        tags: ['ai', 'external', 'groq'],
        dependencies: [],
        metadata: { provider: 'groq', type: 'ai-service' }
      }
    ];

    // Register all services
    serviceManager.registerService(backendServiceDef);
    for (const serviceDef of externalServices) {
      serviceManager.registerService(serviceDef);
    }

    // Set load balancing strategy
    loadBalancer.setStrategy(LoadBalancingStrategy.HEALTH_BASED);

    logger.info('Service discovery and management initialized', {
      service: 'main',
      metadata: {
        registeredServices: externalServices.length + 1,
        loadBalancingStrategy: LoadBalancingStrategy.HEALTH_BASED
      }
    });

  } catch (error) {
    logger.error('Failed to initialize services', {
      service: 'main',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    throw error;
  }
}

// Initialize WebSocket handler
const websocketHandler = new WebSocketHandler(io);

// API Gateway middleware (for routing to external services)
app.use('/gateway', apiGateway.createMiddleware());

// Service discovery and health endpoints
app.get('/services', (req, res) => {
  const services = serviceDiscovery.getAllServices();
  const stats = serviceDiscovery.getStats();
  
  res.json({
    services,
    stats,
    timestamp: new Date().toISOString()
  });
});

app.get('/services/health', (req, res) => {
  const systemHealth = healthCheckService.getSystemHealth();
  res.status(systemHealth.overall === 'healthy' ? 200 : 503).json(systemHealth);
});

app.get('/services/stats', (req, res) => {
  const serviceManagerStats = serviceManager.getStats();
  const loadBalancerStats = loadBalancer.getStats();
  const healthStats = healthCheckService.getHealthStats();
  const gatewayStats = apiGateway.getStats();
  const circuitBreakerStats = circuitBreakerManager.getAllStats();

  res.json({
    serviceManager: serviceManagerStats,
    loadBalancer: loadBalancerStats,
    healthCheck: healthStats,
    apiGateway: gatewayStats,
    circuitBreaker: circuitBreakerStats,
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const connectionStats = websocketHandler.getConnectionStats();
  const serviceHealth = fallbackService.getServiceHealth();
  const rateLimitStats = rateLimitService.getStats();
  const errorStats = logger.getErrorStats();
  const cacheStats = await cacheService.getCacheStats();
  const analyticsStats = analyticsService.getServiceStats();
  const apmStats = apmService.getServiceStats();
  const advancedLoggerStats = advancedLoggerService.getServiceStats();
  
  // Get service discovery health
  const systemHealth = healthCheckService.getSystemHealth();
  const serviceDiscoveryStats = serviceDiscovery.getStats();
  
  const healthCheck = {
    status: systemHealth.overall === 'healthy' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'N/A', // Will be implemented later if needed
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
      redis: cacheService.isAvailable() ? 'connected' : 'disconnected',
      websocket: 'active',
      serviceDiscovery: serviceDiscoveryStats.totalServices > 0 ? 'active' : 'inactive'
    },
    connections: connectionStats,
    serviceHealth,
    systemHealth: systemHealth.summary,
    serviceDiscovery: serviceDiscoveryStats,
    rateLimiting: rateLimitStats,
    errors: errorStats,
    cache: cacheStats,
    analytics: analyticsStats,
    apm: apmStats,
    advancedLogger: advancedLoggerStats,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };
  
  logger.debug('Health check requested', {
    requestId: req.requestId,
    service: 'health-check'
  });
  
  const statusCode = systemHealth.overall === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Metrics endpoint for Prometheus monitoring
app.get('/metrics', (req, res) => {
  const connectionStats = websocketHandler.getConnectionStats();
  const serviceHealth = fallbackService.getServiceHealth();
  const rateLimitStats = rateLimitService.getStats();
  const errorStats = logger.getErrorStats();
  const memoryUsage = process.memoryUsage();
  
  // Generate Prometheus-style metrics
  const metrics = [
    `# HELP ellie_uptime_seconds Total uptime in seconds`,
    `# TYPE ellie_uptime_seconds counter`,
    `ellie_uptime_seconds ${process.uptime()}`,
    ``,
    `# HELP ellie_memory_usage_bytes Memory usage in bytes`,
    `# TYPE ellie_memory_usage_bytes gauge`,
    `ellie_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
    `ellie_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
    `ellie_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
    ``,
    `# HELP ellie_websocket_connections Current WebSocket connections`,
    `# TYPE ellie_websocket_connections gauge`,
    `ellie_websocket_connections ${connectionStats.activeConnections}`,
    ``,
    `# HELP ellie_total_connections_count Total connections since startup`,
    `# TYPE ellie_total_connections_count counter`,
    `ellie_total_connections_count ${connectionStats.totalConnections}`,
    ``,
    `# HELP ellie_service_health Service health status (1=healthy, 0=unhealthy)`,
    `# TYPE ellie_service_health gauge`
  ];
  
  // Add service health metrics
  Object.entries(serviceHealth).forEach(([service, status]) => {
    metrics.push(`ellie_service_health{service="${service}"} ${status.isAvailable ? 1 : 0}`);
    metrics.push(`ellie_service_response_time_ms{service="${service}"} ${status.averageResponseTime || 0}`);
    metrics.push(`ellie_service_failures_total{service="${service}"} ${status.consecutiveFailures}`);
  });
  
  metrics.push('');
  
  // Add rate limiting metrics
  metrics.push(`# HELP ellie_rate_limit_requests Rate limit requests`);
  metrics.push(`# TYPE ellie_rate_limit_requests counter`);
  metrics.push(`ellie_rate_limit_total_keys ${rateLimitStats.totalKeys}`);
  metrics.push(`ellie_rate_limit_queued_requests ${rateLimitStats.totalQueuedRequests}`);
  metrics.push(`ellie_rate_limit_average_queue_length ${rateLimitStats.averageQueueLength}`);
  
  metrics.push('');
  
  // Add error metrics
  metrics.push(`# HELP ellie_errors_total Total errors by type`);
  metrics.push(`# TYPE ellie_errors_total counter`);
  Object.entries(errorStats).forEach(([type, count]) => {
    metrics.push(`ellie_errors_total{type="${type}"} ${count}`);
  });
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics.join('\n'));
});

// Monitoring endpoints
app.get('/api/monitoring/logs', (req, res) => {
  const count = parseInt(req.query.count as string) || 100;
  const level = req.query.level as string;
  
  const logs = logger.getRecentLogs(count, level as any);
  
  logger.info('Logs requested', {
    requestId: req.requestId,
    service: 'monitoring',
    metadata: { count, level }
  });
  
  res.json({ logs, total: logs.length });
});

app.get('/api/monitoring/errors', (req, res) => {
  const timeWindow = parseInt(req.query.window as string) || 3600000; // 1 hour default
  const errorStats = logger.getErrorStats(timeWindow);
  
  logger.info('Error stats requested', {
    requestId: req.requestId,
    service: 'monitoring',
    metadata: { timeWindow }
  });
  
  res.json(errorStats);
});

app.get('/api/monitoring/fallbacks', (req, res) => {
  const fallbackStats = fallbackService.getFallbackStats();
  
  logger.info('Fallback stats requested', {
    requestId: req.requestId,
    service: 'monitoring'
  });
  
  res.json(fallbackStats);
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  const cacheStats = await cacheService.getCacheStats();
  
  logger.info('Cache stats requested', {
    requestId: req.requestId,
    service: 'cache-management'
  });
  
  res.json(cacheStats);
});

app.post('/api/cache/clear', async (req, res) => {
  const success = await cacheService.clearCache();
  
  logger.info('Cache clear requested', {
    requestId: req.requestId,
    service: 'cache-management',
    metadata: { success }
  });
  
  res.json({ success, message: success ? 'Cache cleared successfully' : 'Failed to clear cache' });
});

app.delete('/api/cache/invalidate/:pattern', async (req, res) => {
  const pattern = req.params.pattern;
  const count = await cacheService.invalidateByPattern(pattern);
  
  logger.info('Cache invalidation requested', {
    requestId: req.requestId,
    service: 'cache-management',
    metadata: {
      pattern,
      count
    }
  });
  
  res.json({ count, message: `Invalidated ${count} cache entries` });
});

// CDN management endpoints
app.get('/api/cdn/config', (req, res) => {
  const cdnConfig = cdnService.getFrontendConfig();
  
  logger.info('CDN config requested', {
    requestId: req.requestId,
    service: 'cdn-management'
  });
  
  res.json(cdnConfig);
});

app.get('/api/cdn/stats', (req, res) => {
  const cdnStats = cdnService.getStats();
  
  logger.info('CDN stats requested', {
    requestId: req.requestId,
    service: 'cdn-management'
  });
  
  res.json(cdnStats);
});

app.post('/api/cdn/purge', async (req, res) => {
  const { paths } = req.body;
  const success = await cdnService.purgeCDNCache(paths);
  
  logger.info('CDN purge requested', {
    requestId: req.requestId,
    service: 'cdn-management',
    metadata: {
      paths,
      success
    }
  });
  
  res.json({ success, message: success ? 'CDN cache purged successfully' : 'Failed to purge CDN cache' });
});

// Analytics endpoints
app.get('/api/analytics/usage', (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
  const usageMetrics = analyticsService.getUsageMetrics(timeWindow);
  
  logger.info('Usage analytics requested', {
    requestId: req.requestId,
    service: 'analytics',
    metadata: { timeWindow }
  });
  
  res.json(usageMetrics);
});

app.get('/api/analytics/performance', async (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
  const performanceMetrics = await analyticsService.getPerformanceMetrics(timeWindow);
  
  logger.info('Performance analytics requested', {
    requestId: req.requestId,
    service: 'analytics',
    metadata: { timeWindow }
  });
  
  res.json(performanceMetrics);
});

app.get('/api/analytics/business', (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 86400000;
  const businessMetrics = analyticsService.getBusinessMetrics(timeWindow);
  
  logger.info('Business analytics requested', {
    requestId: req.requestId,
    service: 'analytics',
    metadata: { timeWindow }
  });
  
  res.json(businessMetrics);
});

app.get('/api/analytics/dashboard', (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
  const dashboardData = analyticsService.getDashboardData(timeWindow);
  
  logger.info('Analytics dashboard requested', {
    requestId: req.requestId,
    service: 'analytics',
    metadata: { timeWindow }
  });
  
  res.json(dashboardData);
});

app.get('/api/analytics/export', (req, res) => {
  const format = req.query.format as 'json' | 'csv' || 'json';
  const timeWindow = parseInt(req.query.timeWindow as string) || 86400000;
  const exportData = analyticsService.exportData(format, timeWindow);
  
  const contentType = format === 'csv' ? 'text/csv' : 'application/json';
  const filename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
});

// APM endpoints
app.get('/api/apm/metrics', (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
  const apmMetrics = apmService.getMetrics(timeWindow);
  
  logger.info('APM metrics requested', {
    requestId: req.requestId,
    service: 'apm',
    metadata: { timeWindow }
  });
  
  res.json(apmMetrics);
});

app.get('/api/apm/active', (req, res) => {
  const activeOperations = apmService.getActiveOperations();
  
  logger.info('APM active operations requested', {
    requestId: req.requestId,
    service: 'apm'
  });
  
  res.json(activeOperations);
});

app.get('/api/apm/transaction/:id', (req, res) => {
  const transactionId = req.params.id;
  const transaction = apmService.getTransaction(transactionId);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  logger.info('APM transaction details requested', {
    requestId: req.requestId,
    service: 'apm',
    metadata: { transactionId }
  });
  
  return res.json(transaction);
});

// Advanced logging endpoints
app.get('/api/logs/metrics', (req, res) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000;
  const logMetrics = advancedLoggerService.getLogMetrics(timeWindow);
  
  logger.info('Log metrics requested', {
    requestId: req.requestId,
    service: 'advanced-logger',
    metadata: { timeWindow }
  });
  
  res.json(logMetrics);
});

app.get('/api/logs/search', (req, res) => {
  const filters = {
    level: req.query.level as string,
    service: req.query.service as string,
    message: req.query.message as string,
    timeWindow: parseInt(req.query.timeWindow as string) || 3600000,
    limit: parseInt(req.query.limit as string) || 100
  };
  
  const logs = advancedLoggerService.searchLogs(filters);
  
  logger.info('Log search requested', {
    requestId: req.requestId,
    service: 'advanced-logger',
    metadata: filters
  });
  
  res.json(logs);
});

app.get('/api/logs/aggregations', (req, res) => {
  const timeWindow = req.query.timeWindow as string || '1h';
  const service = req.query.service as string;
  const level = req.query.level as string;
  
  const aggregations = advancedLoggerService.getAggregations(timeWindow, service, level);
  
  logger.info('Log aggregations requested', {
    requestId: req.requestId,
    service: 'advanced-logger',
    metadata: { timeWindow, service, level }
  });
  
  res.json(aggregations);
});

app.get('/api/logs/alerts', (req, res) => {
  const alerts = advancedLoggerService.getActiveAlerts();
  
  logger.info('Log alerts requested', {
    requestId: req.requestId,
    service: 'advanced-logger'
  });
  
  res.json(alerts);
});

app.post('/api/logs/alerts/:id/resolve', (req, res) => {
  const alertId = req.params.id;
  const success = advancedLoggerService.resolveAlert(alertId);
  
  logger.info('Log alert resolution requested', {
    requestId: req.requestId,
    service: 'advanced-logger',
    metadata: { alertId, success }
  });
  
  res.json({ success, message: success ? 'Alert resolved' : 'Alert not found' });
});

app.get('/api/logs/export', (req, res) => {
  const format = req.query.format as 'json' | 'csv' | 'txt' || 'json';
  const filters = {
    level: req.query.level as string,
    service: req.query.service as string,
    timeWindow: parseInt(req.query.timeWindow as string) || 3600000
  };
  
  const exportData = advancedLoggerService.exportLogs(format, filters);
  
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    txt: 'text/plain'
  };
  
  const filename = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
  
  res.setHeader('Content-Type', contentTypes[format]);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
});

// Voice processing routes
app.use('/api/voice', voiceRoutes);

// Legal compliance routes
app.use('/api/legal', legalRoutes);

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Ellie Voice Receptionist API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      voice: '/api/voice/*',
      legal: '/api/legal/*',
      websocket: '/socket.io'
    }
  });
});

// Enhanced global error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error with structured logging
  logger.error(`Unhandled error: ${error.message}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    service: 'error-handler',
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    metadata: {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errorType: error.type
    }
  });
  
  // Handle specific error types
  if (error.type === 'entity.too.large') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.AUDIO_TOO_LARGE,
      ErrorHandler.formatUserMessage(ERROR_CODES.AUDIO_TOO_LARGE),
      undefined,
      req.requestId
    );
    return res.status(413).json(errorResponse);
  }
  
  if (error.type === 'entity.parse.failed') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.INVALID_INPUT,
      ErrorHandler.formatUserMessage(ERROR_CODES.INVALID_INPUT),
      undefined,
      req.requestId
    );
    return res.status(400).json(errorResponse);
  }

  // Handle rate limiting errors
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ErrorHandler.formatUserMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
      error.details,
      req.requestId
    );
    return res.status(429).json(errorResponse);
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.CONNECTION_TIMEOUT,
      ErrorHandler.formatUserMessage(ERROR_CODES.CONNECTION_TIMEOUT),
      undefined,
      req.requestId
    );
    return res.status(408).json(errorResponse);
  }
  
  // Default server error with fallback response
  const fallbackResponse = fallbackService.getContextualFallback('error', req.requestId!, error.message);
  
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    fallbackResponse.text,
    {
      isFallback: fallbackResponse.isFallback,
      fallbackReason: fallbackResponse.fallbackReason,
      originalError: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    req.requestId
  );
  
  return res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INVALID_INPUT,
    `Endpoint ${req.method} ${req.originalUrl} not found`,
    undefined,
    req.requestId
  );
  res.status(404).json(errorResponse);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`, {
    service: 'main'
  });

  try {
    // Stop all managed services
    await serviceManager.stopAllServices();
    
    // Stop health checking
    healthCheckService.stop();
    
    // Stop service discovery
    serviceDiscovery.stop();

    // Disconnect cache
    await cacheService.disconnect();

    server.close(() => {
      logger.info('HTTP server closed', { service: 'main' });
      process.exit(0);
    });

  } catch (error) {
    logger.error('Error during graceful shutdown', {
      service: 'main',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    process.exit(1);
  }

  // Force close after 15 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout', { service: 'main' });
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  async function startServer() {
    try {
      // Initialize service discovery and management
      await initializeServices();

      server.listen(PORT, () => {
        logger.info(`Ellie Voice Receptionist Backend running on port ${PORT}`, {
          service: 'main',
          metadata: {
            port: PORT,
            host: HOST,
            environment: process.env.NODE_ENV || 'development',
            corsOrigin: process.env.FRONTEND_URL || "http://localhost:3000"
          }
        });

        console.log(`[${new Date().toISOString()}] Ellie Voice Receptionist Backend running on port ${PORT}`);
        console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[${new Date().toISOString()}] Health check available at: http://localhost:${PORT}/health`);
        console.log(`[${new Date().toISOString()}] Service discovery available at: http://localhost:${PORT}/services`);

        // Start the service manager (this will register this service)
        serviceManager.startService('ellie-backend').catch(error => {
          logger.error('Failed to start ellie-backend service', {
            service: 'main',
            error: {
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        });
      });

    } catch (error) {
      logger.error('Failed to start server', {
        service: 'main',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      process.exit(1);
    }
  }

  // Start the server
  startServer();
}

export { app, server, io };