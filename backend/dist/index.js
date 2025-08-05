"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const errorHandler_1 = require("./utils/errorHandler");
const errors_1 = require("./types/errors");
const websocketHandler_1 = require("./services/websocketHandler");
const loggerService_1 = require("./services/loggerService");
const rateLimitService_1 = require("./services/rateLimitService");
const fallbackService_1 = require("./services/fallbackService");
const cacheService_1 = require("./services/cacheService");
const cdnService_1 = require("./services/cdnService");
const analyticsService_1 = require("./services/analyticsService");
const apmService_1 = require("./services/apmService");
const advancedLoggerService_1 = require("./services/advancedLoggerService");
const voice_1 = __importDefault(require("./routes/voice"));
const legal_1 = __importDefault(require("./routes/legal"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(rateLimitService_1.rateLimitService.createApiRateLimiter());
app.use(cdnService_1.cdnService.cacheMiddleware());
app.use(apmService_1.apmService.createExpressMiddleware());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    const requestId = (0, uuid_1.v4)();
    req.requestId = requestId;
    const startTime = Date.now();
    const { method, url, ip } = req;
    loggerService_1.logger.info(`Incoming request: ${method} ${url}`, {
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
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        loggerService_1.logger.logRequest(method, url, statusCode, duration, requestId);
    });
    res.on('error', (error) => {
        loggerService_1.logger.error(`Response error: ${method} ${url}`, {
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
const websocketHandler = new websocketHandler_1.WebSocketHandler(io);
app.get('/health', async (req, res) => {
    const connectionStats = websocketHandler.getConnectionStats();
    const serviceHealth = fallbackService_1.fallbackService.getServiceHealth();
    const rateLimitStats = rateLimitService_1.rateLimitService.getStats();
    const errorStats = loggerService_1.logger.getErrorStats();
    const cacheStats = await cacheService_1.cacheService.getCacheStats();
    const analyticsStats = analyticsService_1.analyticsService.getServiceStats();
    const apmStats = apmService_1.apmService.getServiceStats();
    const advancedLoggerStats = advancedLoggerService_1.advancedLoggerService.getServiceStats();
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: 'N/A',
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
            groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
            redis: cacheService_1.cacheService.isAvailable() ? 'connected' : 'disconnected',
            websocket: 'active'
        },
        connections: connectionStats,
        serviceHealth,
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
    loggerService_1.logger.debug('Health check requested', {
        requestId: req.requestId,
        service: 'health-check'
    });
    res.status(200).json(healthCheck);
});
app.get('/metrics', (req, res) => {
    const connectionStats = websocketHandler.getConnectionStats();
    const serviceHealth = fallbackService_1.fallbackService.getServiceHealth();
    const rateLimitStats = rateLimitService_1.rateLimitService.getStats();
    const errorStats = loggerService_1.logger.getErrorStats();
    const memoryUsage = process.memoryUsage();
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
    Object.entries(serviceHealth).forEach(([service, status]) => {
        metrics.push(`ellie_service_health{service="${service}"} ${status.isAvailable ? 1 : 0}`);
        metrics.push(`ellie_service_response_time_ms{service="${service}"} ${status.averageResponseTime || 0}`);
        metrics.push(`ellie_service_failures_total{service="${service}"} ${status.consecutiveFailures}`);
    });
    metrics.push('');
    metrics.push(`# HELP ellie_rate_limit_requests Rate limit requests`);
    metrics.push(`# TYPE ellie_rate_limit_requests counter`);
    metrics.push(`ellie_rate_limit_total_keys ${rateLimitStats.totalKeys}`);
    metrics.push(`ellie_rate_limit_queued_requests ${rateLimitStats.totalQueuedRequests}`);
    metrics.push(`ellie_rate_limit_average_queue_length ${rateLimitStats.averageQueueLength}`);
    metrics.push('');
    metrics.push(`# HELP ellie_errors_total Total errors by type`);
    metrics.push(`# TYPE ellie_errors_total counter`);
    Object.entries(errorStats).forEach(([type, count]) => {
        metrics.push(`ellie_errors_total{type="${type}"} ${count}`);
    });
    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n'));
});
app.get('/api/monitoring/logs', (req, res) => {
    const count = parseInt(req.query.count) || 100;
    const level = req.query.level;
    const logs = loggerService_1.logger.getRecentLogs(count, level);
    loggerService_1.logger.info('Logs requested', {
        requestId: req.requestId,
        service: 'monitoring',
        metadata: { count, level }
    });
    res.json({ logs, total: logs.length });
});
app.get('/api/monitoring/errors', (req, res) => {
    const timeWindow = parseInt(req.query.window) || 3600000;
    const errorStats = loggerService_1.logger.getErrorStats(timeWindow);
    loggerService_1.logger.info('Error stats requested', {
        requestId: req.requestId,
        service: 'monitoring',
        metadata: { timeWindow }
    });
    res.json(errorStats);
});
app.get('/api/monitoring/fallbacks', (req, res) => {
    const fallbackStats = fallbackService_1.fallbackService.getFallbackStats();
    loggerService_1.logger.info('Fallback stats requested', {
        requestId: req.requestId,
        service: 'monitoring'
    });
    res.json(fallbackStats);
});
app.get('/api/cache/stats', async (req, res) => {
    const cacheStats = await cacheService_1.cacheService.getCacheStats();
    loggerService_1.logger.info('Cache stats requested', {
        requestId: req.requestId,
        service: 'cache-management'
    });
    res.json(cacheStats);
});
app.post('/api/cache/clear', async (req, res) => {
    const success = await cacheService_1.cacheService.clearCache();
    loggerService_1.logger.info('Cache clear requested', {
        requestId: req.requestId,
        service: 'cache-management',
        metadata: { success }
    });
    res.json({ success, message: success ? 'Cache cleared successfully' : 'Failed to clear cache' });
});
app.delete('/api/cache/invalidate/:pattern', async (req, res) => {
    const pattern = req.params.pattern;
    const count = await cacheService_1.cacheService.invalidateByPattern(pattern);
    loggerService_1.logger.info('Cache invalidation requested', {
        requestId: req.requestId,
        service: 'cache-management',
        metadata: {
            pattern,
            count
        }
    });
    res.json({ count, message: `Invalidated ${count} cache entries` });
});
app.get('/api/cdn/config', (req, res) => {
    const cdnConfig = cdnService_1.cdnService.getFrontendConfig();
    loggerService_1.logger.info('CDN config requested', {
        requestId: req.requestId,
        service: 'cdn-management'
    });
    res.json(cdnConfig);
});
app.get('/api/cdn/stats', (req, res) => {
    const cdnStats = cdnService_1.cdnService.getStats();
    loggerService_1.logger.info('CDN stats requested', {
        requestId: req.requestId,
        service: 'cdn-management'
    });
    res.json(cdnStats);
});
app.post('/api/cdn/purge', async (req, res) => {
    const { paths } = req.body;
    const success = await cdnService_1.cdnService.purgeCDNCache(paths);
    loggerService_1.logger.info('CDN purge requested', {
        requestId: req.requestId,
        service: 'cdn-management',
        metadata: {
            paths,
            success
        }
    });
    res.json({ success, message: success ? 'CDN cache purged successfully' : 'Failed to purge CDN cache' });
});
app.get('/api/analytics/usage', (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000;
    const usageMetrics = analyticsService_1.analyticsService.getUsageMetrics(timeWindow);
    loggerService_1.logger.info('Usage analytics requested', {
        requestId: req.requestId,
        service: 'analytics',
        metadata: { timeWindow }
    });
    res.json(usageMetrics);
});
app.get('/api/analytics/performance', async (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000;
    const performanceMetrics = await analyticsService_1.analyticsService.getPerformanceMetrics(timeWindow);
    loggerService_1.logger.info('Performance analytics requested', {
        requestId: req.requestId,
        service: 'analytics',
        metadata: { timeWindow }
    });
    res.json(performanceMetrics);
});
app.get('/api/analytics/business', (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 86400000;
    const businessMetrics = analyticsService_1.analyticsService.getBusinessMetrics(timeWindow);
    loggerService_1.logger.info('Business analytics requested', {
        requestId: req.requestId,
        service: 'analytics',
        metadata: { timeWindow }
    });
    res.json(businessMetrics);
});
app.get('/api/analytics/dashboard', (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000;
    const dashboardData = analyticsService_1.analyticsService.getDashboardData(timeWindow);
    loggerService_1.logger.info('Analytics dashboard requested', {
        requestId: req.requestId,
        service: 'analytics',
        metadata: { timeWindow }
    });
    res.json(dashboardData);
});
app.get('/api/analytics/export', (req, res) => {
    const format = req.query.format || 'json';
    const timeWindow = parseInt(req.query.timeWindow) || 86400000;
    const exportData = analyticsService_1.analyticsService.exportData(format, timeWindow);
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
});
app.get('/api/apm/metrics', (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000;
    const apmMetrics = apmService_1.apmService.getMetrics(timeWindow);
    loggerService_1.logger.info('APM metrics requested', {
        requestId: req.requestId,
        service: 'apm',
        metadata: { timeWindow }
    });
    res.json(apmMetrics);
});
app.get('/api/apm/active', (req, res) => {
    const activeOperations = apmService_1.apmService.getActiveOperations();
    loggerService_1.logger.info('APM active operations requested', {
        requestId: req.requestId,
        service: 'apm'
    });
    res.json(activeOperations);
});
app.get('/api/apm/transaction/:id', (req, res) => {
    const transactionId = req.params.id;
    const transaction = apmService_1.apmService.getTransaction(transactionId);
    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    loggerService_1.logger.info('APM transaction details requested', {
        requestId: req.requestId,
        service: 'apm',
        metadata: { transactionId }
    });
    return res.json(transaction);
});
app.get('/api/logs/metrics', (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000;
    const logMetrics = advancedLoggerService_1.advancedLoggerService.getLogMetrics(timeWindow);
    loggerService_1.logger.info('Log metrics requested', {
        requestId: req.requestId,
        service: 'advanced-logger',
        metadata: { timeWindow }
    });
    res.json(logMetrics);
});
app.get('/api/logs/search', (req, res) => {
    const filters = {
        level: req.query.level,
        service: req.query.service,
        message: req.query.message,
        timeWindow: parseInt(req.query.timeWindow) || 3600000,
        limit: parseInt(req.query.limit) || 100
    };
    const logs = advancedLoggerService_1.advancedLoggerService.searchLogs(filters);
    loggerService_1.logger.info('Log search requested', {
        requestId: req.requestId,
        service: 'advanced-logger',
        metadata: filters
    });
    res.json(logs);
});
app.get('/api/logs/aggregations', (req, res) => {
    const timeWindow = req.query.timeWindow || '1h';
    const service = req.query.service;
    const level = req.query.level;
    const aggregations = advancedLoggerService_1.advancedLoggerService.getAggregations(timeWindow, service, level);
    loggerService_1.logger.info('Log aggregations requested', {
        requestId: req.requestId,
        service: 'advanced-logger',
        metadata: { timeWindow, service, level }
    });
    res.json(aggregations);
});
app.get('/api/logs/alerts', (req, res) => {
    const alerts = advancedLoggerService_1.advancedLoggerService.getActiveAlerts();
    loggerService_1.logger.info('Log alerts requested', {
        requestId: req.requestId,
        service: 'advanced-logger'
    });
    res.json(alerts);
});
app.post('/api/logs/alerts/:id/resolve', (req, res) => {
    const alertId = req.params.id;
    const success = advancedLoggerService_1.advancedLoggerService.resolveAlert(alertId);
    loggerService_1.logger.info('Log alert resolution requested', {
        requestId: req.requestId,
        service: 'advanced-logger',
        metadata: { alertId, success }
    });
    res.json({ success, message: success ? 'Alert resolved' : 'Alert not found' });
});
app.get('/api/logs/export', (req, res) => {
    const format = req.query.format || 'json';
    const filters = {
        level: req.query.level,
        service: req.query.service,
        timeWindow: parseInt(req.query.timeWindow) || 3600000
    };
    const exportData = advancedLoggerService_1.advancedLoggerService.exportLogs(format, filters);
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
app.use('/api/voice', voice_1.default);
app.use('/api/legal', legal_1.default);
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
app.use((error, req, res, next) => {
    loggerService_1.logger.error(`Unhandled error: ${error.message}`, {
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
    if (error.type === 'entity.too.large') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.AUDIO_TOO_LARGE, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.AUDIO_TOO_LARGE), undefined, req.requestId);
        return res.status(413).json(errorResponse);
    }
    if (error.type === 'entity.parse.failed') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INVALID_INPUT, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.INVALID_INPUT), undefined, req.requestId);
        return res.status(400).json(errorResponse);
    }
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED), error.details, req.requestId);
        return res.status(429).json(errorResponse);
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.CONNECTION_TIMEOUT, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.CONNECTION_TIMEOUT), undefined, req.requestId);
        return res.status(408).json(errorResponse);
    }
    const fallbackResponse = fallbackService_1.fallbackService.getContextualFallback('error', req.requestId, error.message);
    const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INTERNAL_SERVER_ERROR, fallbackResponse.text, {
        isFallback: fallbackResponse.isFallback,
        fallbackReason: fallbackResponse.fallbackReason,
        originalError: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, req.requestId);
    return res.status(500).json(errorResponse);
});
app.use('*', (req, res) => {
    const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INVALID_INPUT, `Endpoint ${req.method} ${req.originalUrl} not found`, undefined, req.requestId);
    res.status(404).json(errorResponse);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await cacheService_1.cacheService.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await cacheService_1.cacheService.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`[${new Date().toISOString()}] Ellie Voice Receptionist Backend running on port ${PORT}`);
        console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[${new Date().toISOString()}] Health check available at: http://localhost:${PORT}/health`);
    });
}
//# sourceMappingURL=index.js.map