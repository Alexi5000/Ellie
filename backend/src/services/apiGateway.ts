/**
 * API Gateway Service
 * Provides centralized routing, load balancing, and service discovery
 */

import { Request, Response, NextFunction } from 'express';
import { ServiceInfo, serviceDiscovery } from './serviceDiscovery';
import { loadBalancer, LoadBalancingStrategy } from './loadBalancer';
import { circuitBreakerManager } from './circuitBreaker';
import { logger } from './loggerService';
import { rateLimitService } from './rateLimitService';

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceName: string;
  targetPath?: string;
  tags?: string[];
  timeout?: number;
  retries?: number;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  authentication?: boolean;
  authorization?: string[];
  transform?: {
    request?: (req: any) => any;
    response?: (res: any) => any;
  };
}

export interface ProxyRequest {
  originalUrl: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

export class APIGateway {
  private static instance: APIGateway;
  private routes: Map<string, RouteConfig> = new Map();
  private requestCounter: number = 0;

  private constructor() {
    // Set load balancing strategy
    loadBalancer.setStrategy(LoadBalancingStrategy.HEALTH_BASED);
  }

  static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  /**
   * Register a route with the API Gateway
   */
  registerRoute(config: RouteConfig): void {
    const routeKey = `${config.method}:${config.path}`;
    this.routes.set(routeKey, config);

    logger.info(`Route registered: ${routeKey} -> ${config.serviceName}`, {
      service: 'api-gateway',
      metadata: { routeKey, serviceName: config.serviceName, targetPath: config.targetPath }
    });
  }

  /**
   * Create Express middleware for API Gateway
   */
  createMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const routeKey = `${req.method}:${req.route?.path || req.path}`;
      const routeConfig = this.routes.get(routeKey);

      if (!routeConfig) {
        return next(); // Let other middleware handle it
      }

      const requestId = this.generateRequestId();
      const startTime = Date.now();

      try {
        // Apply rate limiting if configured
        if (routeConfig.rateLimit) {
          const rateLimiter = rateLimitService.createLimiter({
            windowMs: routeConfig.rateLimit.windowMs,
            maxRequests: routeConfig.rateLimit.max
          });
          
          await new Promise<void>((resolve, reject) => {
            rateLimiter(req, res, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Find healthy service instance
        const serviceInstance = loadBalancer.getServiceInstance(
          routeConfig.serviceName,
          routeConfig.tags
        );

        if (!serviceInstance) {
          return this.sendErrorResponse(res, 503, 'Service Unavailable', requestId);
        }

        // Proxy the request
        const response = await this.proxyRequest(
          serviceInstance,
          routeConfig,
          req,
          requestId
        );

        // Record metrics
        const responseTime = Date.now() - startTime;
        loadBalancer.recordRequest(serviceInstance.id, responseTime, response.statusCode < 400);

        // Send response
        this.sendProxyResponse(res, response);

        logger.info(`Request proxied successfully`, {
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

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        logger.error(`Request proxy failed`, {
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

  /**
   * Proxy request to target service
   */
  private async proxyRequest(
    serviceInstance: ServiceInfo,
    routeConfig: RouteConfig,
    req: Request,
    requestId: string
  ): Promise<ProxyResponse> {
    const startTime = Date.now();

    return circuitBreakerManager.execute(
      `proxy-${routeConfig.serviceName}`,
      async () => {
        const targetUrl = this.buildTargetUrl(serviceInstance, routeConfig, req);
        const proxyReq: ProxyRequest = {
          originalUrl: req.originalUrl,
          method: req.method,
          headers: this.prepareHeaders(req.headers, requestId),
          body: req.body,
          query: req.query as Record<string, string>,
          params: req.params
        };

        // Apply request transformation if configured
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
          } catch {
            parsedBody = responseBody;
          }

          const proxyResponse: ProxyResponse = {
            statusCode: response.status,
            headers: this.extractHeaders(response.headers),
            body: parsedBody,
            responseTime: Date.now() - startTime
          };

          // Apply response transformation if configured
          if (routeConfig.transform?.response) {
            Object.assign(proxyResponse, routeConfig.transform.response(proxyResponse));
          }

          return proxyResponse;

        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        timeout: routeConfig.timeout || 30000
      }
    );
  }

  /**
   * Build target URL for the service
   */
  private buildTargetUrl(serviceInstance: ServiceInfo, routeConfig: RouteConfig, req: Request): string {
    const baseUrl = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}`;
    const targetPath = routeConfig.targetPath || req.path;
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    
    return `${baseUrl}${targetPath}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Prepare headers for proxy request
   */
  private prepareHeaders(originalHeaders: any, requestId: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Copy relevant headers
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

    // Add gateway headers
    headers['x-request-id'] = requestId;
    headers['x-forwarded-by'] = 'ellie-api-gateway';
    headers['x-gateway-version'] = '1.0.0';

    return headers;
  }

  /**
   * Extract headers from fetch response
   */
  private extractHeaders(responseHeaders: Headers): Record<string, string> {
    const headers: Record<string, string> = {};
    
    responseHeaders.forEach((value, key) => {
      // Skip hop-by-hop headers
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

  /**
   * Send proxy response to client
   */
  private sendProxyResponse(res: Response, proxyResponse: ProxyResponse): void {
    // Set headers
    for (const [key, value] of Object.entries(proxyResponse.headers)) {
      res.setHeader(key, value);
    }

    // Set status and send body
    res.status(proxyResponse.statusCode);
    
    if (typeof proxyResponse.body === 'string') {
      res.send(proxyResponse.body);
    } else {
      res.json(proxyResponse.body);
    }
  }

  /**
   * Send error response
   */
  private sendErrorResponse(res: Response, statusCode: number, message: string, requestId: string): void {
    res.status(statusCode).json({
      error: {
        code: statusCode,
        message,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Get gateway statistics
   */
  getStats(): {
    totalRoutes: number;
    registeredServices: number;
    loadBalancerStats: any;
    circuitBreakerStats: any;
  } {
    const serviceNames = new Set<string>();
    for (const route of this.routes.values()) {
      serviceNames.add(route.serviceName);
    }

    return {
      totalRoutes: this.routes.size,
      registeredServices: serviceNames.size,
      loadBalancerStats: loadBalancer.getStats(),
      circuitBreakerStats: circuitBreakerManager.getAllStats()
    };
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  /**
   * Remove a route
   */
  removeRoute(method: string, path: string): void {
    const routeKey = `${method}:${path}`;
    this.routes.delete(routeKey);

    logger.info(`Route removed: ${routeKey}`, {
      service: 'api-gateway',
      metadata: { routeKey }
    });
  }

  /**
   * Clear all routes
   */
  clearRoutes(): void {
    this.routes.clear();
    logger.info('All routes cleared', {
      service: 'api-gateway'
    });
  }
}

export const apiGateway = APIGateway.getInstance();