"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiGateway = exports.APIGateway = void 0;
const loadBalancer_1 = require("./loadBalancer");
const circuitBreaker_1 = require("./circuitBreaker");
const loggerService_1 = require("./loggerService");
const rateLimitService_1 = require("./rateLimitService");
class APIGateway {
    constructor() {
        this.routes = new Map();
        this.requestCounter = 0;
        loadBalancer_1.loadBalancer.setStrategy(loadBalancer_1.LoadBalancingStrategy.HEALTH_BASED);
    }
    static getInstance() {
        if (!APIGateway.instance) {
            APIGateway.instance = new APIGateway();
        }
        return APIGateway.instance;
    }
    registerRoute(config) {
        const routeKey = `${config.method}:${config.path}`;
        this.routes.set(routeKey, config);
        loggerService_1.logger.info(`Route registered: ${routeKey} -> ${config.serviceName}`, {
            service: 'api-gateway',
            metadata: { routeKey, serviceName: config.serviceName, targetPath: config.targetPath }
        });
    }
    createMiddleware() {
        return async (req, res, next) => {
            const routeKey = `${req.method}:${req.route?.path || req.path}`;
            const routeConfig = this.routes.get(routeKey);
            if (!routeConfig) {
                return next();
            }
            const requestId = this.generateRequestId();
            const startTime = Date.now();
            try {
                if (routeConfig.rateLimit) {
                    const rateLimiter = rateLimitService_1.rateLimitService.createApiRateLimiter(routeConfig.rateLimit.windowMs, routeConfig.rateLimit.max);
                    await new Promise((resolve, reject) => {
                        rateLimiter(req, res, (err) => {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    });
                }
                const serviceInstance = loadBalancer_1.loadBalancer.getServiceInstance(routeConfig.serviceName, routeConfig.tags);
                if (!serviceInstance) {
                    return this.sendErrorResponse(res, 503, 'Service Unavailable', requestId);
                }
                const response = await this.proxyRequest(serviceInstance, routeConfig, req, requestId);
                const responseTime = Date.now() - startTime;
                loadBalancer_1.loadBalancer.recordRequest(serviceInstance.id, responseTime, response.statusCode < 400);
                this.sendProxyResponse(res, response);
                loggerService_1.logger.info(`Request proxied successfully`, {
                    service: 'api-gateway',
                    requestId,
                    metadata: {
                        method: req.method,
                        path: req.path,
                        serviceName: routeConfig.serviceName,
                        serviceId: serviceInstance.id,
                        statusCode: response.statusCode,
                        responseTime
                    }
                });
            }
            catch (error) {
                const responseTime = Date.now() - startTime;
                loggerService_1.logger.error(`Request proxy failed`, {
                    service: 'api-gateway',
                    requestId,
                    metadata: {
                        method: req.method,
                        path: req.path,
                        serviceName: routeConfig.serviceName,
                        responseTime
                    },
                    error: {
                        message: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined
                    }
                });
                if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
                    return this.sendErrorResponse(res, 503, 'Service temporarily unavailable', requestId);
                }
                return this.sendErrorResponse(res, 500, 'Internal Server Error', requestId);
            }
        };
    }
    async proxyRequest(serviceInstance, routeConfig, req, requestId) {
        const startTime = Date.now();
        return circuitBreaker_1.circuitBreakerManager.execute(`proxy-${routeConfig.serviceName}`, async () => {
            const targetUrl = this.buildTargetUrl(serviceInstance, routeConfig, req);
            const proxyReq = {
                originalUrl: req.originalUrl,
                method: req.method,
                headers: this.prepareHeaders(req.headers, requestId),
                body: req.body,
                query: req.query,
                params: req.params
            };
            if (routeConfig.transform?.request) {
                Object.assign(proxyReq, routeConfig.transform.request(proxyReq));
            }
            const controller = new AbortController();
            const timeout = routeConfig.timeout || 30000;
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(targetUrl, {
                    method: proxyReq.method,
                    headers: proxyReq.headers,
                    body: proxyReq.body ? JSON.stringify(proxyReq.body) : undefined,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const responseBody = await response.text();
                let parsedBody;
                try {
                    parsedBody = JSON.parse(responseBody);
                }
                catch {
                    parsedBody = responseBody;
                }
                const proxyResponse = {
                    statusCode: response.status,
                    headers: this.extractHeaders(response.headers),
                    body: parsedBody,
                    responseTime: Date.now() - startTime
                };
                if (routeConfig.transform?.response) {
                    Object.assign(proxyResponse, routeConfig.transform.response(proxyResponse));
                }
                return proxyResponse;
            }
            finally {
                clearTimeout(timeoutId);
            }
        }, {
            failureThreshold: 5,
            recoveryTimeout: 60000,
            timeout: routeConfig.timeout || 30000
        });
    }
    buildTargetUrl(serviceInstance, routeConfig, req) {
        const baseUrl = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}`;
        const targetPath = routeConfig.targetPath || req.path;
        const queryString = new URLSearchParams(req.query).toString();
        return `${baseUrl}${targetPath}${queryString ? `?${queryString}` : ''}`;
    }
    prepareHeaders(originalHeaders, requestId) {
        const headers = {};
        const allowedHeaders = [
            'content-type',
            'authorization',
            'accept',
            'user-agent',
            'accept-language',
            'accept-encoding'
        ];
        for (const [key, value] of Object.entries(originalHeaders)) {
            if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
                headers[key] = value;
            }
        }
        headers['x-request-id'] = requestId;
        headers['x-forwarded-by'] = 'ellie-api-gateway';
        headers['x-gateway-version'] = '1.0.0';
        return headers;
    }
    extractHeaders(responseHeaders) {
        const headers = {};
        responseHeaders.forEach((value, key) => {
            const hopByHopHeaders = [
                'connection',
                'keep-alive',
                'proxy-authenticate',
                'proxy-authorization',
                'te',
                'trailers',
                'transfer-encoding',
                'upgrade'
            ];
            if (!hopByHopHeaders.includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });
        return headers;
    }
    sendProxyResponse(res, proxyResponse) {
        for (const [key, value] of Object.entries(proxyResponse.headers)) {
            res.setHeader(key, value);
        }
        res.status(proxyResponse.statusCode);
        if (typeof proxyResponse.body === 'string') {
            res.send(proxyResponse.body);
        }
        else {
            res.json(proxyResponse.body);
        }
    }
    sendErrorResponse(res, statusCode, message, requestId) {
        res.status(statusCode).json({
            error: {
                code: statusCode,
                message,
                timestamp: new Date().toISOString(),
                requestId
            }
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${++this.requestCounter}`;
    }
    getStats() {
        const serviceNames = new Set();
        for (const route of this.routes.values()) {
            serviceNames.add(route.serviceName);
        }
        return {
            totalRoutes: this.routes.size,
            registeredServices: serviceNames.size,
            loadBalancerStats: loadBalancer_1.loadBalancer.getStats(),
            circuitBreakerStats: circuitBreaker_1.circuitBreakerManager.getAllStats()
        };
    }
    getRoutes() {
        return Array.from(this.routes.values());
    }
    removeRoute(method, path) {
        const routeKey = `${method}:${path}`;
        this.routes.delete(routeKey);
        loggerService_1.logger.info(`Route removed: ${routeKey}`, {
            service: 'api-gateway',
            metadata: { routeKey }
        });
    }
    clearRoutes() {
        this.routes.clear();
        loggerService_1.logger.info('All routes cleared', {
            service: 'api-gateway'
        });
    }
}
exports.APIGateway = APIGateway;
exports.apiGateway = APIGateway.getInstance();
//# sourceMappingURL=apiGateway.js.map