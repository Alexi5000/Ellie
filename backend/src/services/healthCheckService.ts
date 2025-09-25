/**
 * Health Check Service
 * Provides comprehensive health monitoring for all services
 */

import { EventEmitter } from 'events';
import { logger } from './loggerService';
import { serviceDiscovery, ServiceInfo } from './serviceDiscovery';
import { circuitBreakerManager } from './circuitBreaker';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  details: {
    version?: string;
    uptime?: number;
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
    };
    dependencies?: Record<string, boolean>;
    customMetrics?: Record<string, any>;
  };
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: Date;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export class HealthCheckService extends EventEmitter {
  private static instance: HealthCheckService;
  private healthResults: Map<string, HealthCheckResult> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly TIMEOUT = 5000; // 5 seconds

  private constructor() {
    super();
    this.startHealthChecking();
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform health check on a specific service
   */
  async checkServiceHealth(service: ServiceInfo): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await circuitBreakerManager.execute(
        `health-check-${service.name}`,
        async () => {
          const url = `${service.protocol}://${service.host}:${service.port}${service.healthEndpoint}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'HealthCheckService/1.0'
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          return data;
        },
        {
          failureThreshold: 3,
          recoveryTimeout: 30000,
          timeout: this.TIMEOUT
        }
      );

      const responseTime = Date.now() - startTime;
      const healthResult: HealthCheckResult = {
        service: service.name,
        status: this.determineHealthStatus(result),
        timestamp: new Date(),
        responseTime,
        details: {
          version: result.version,
          uptime: result.uptime,
          memory: result.memory,
          cpu: result.cpu,
          dependencies: result.dependencies,
          customMetrics: result.customMetrics
        }
      };

      this.healthResults.set(service.id, healthResult);
      this.emit('healthCheckCompleted', healthResult);

      return healthResult;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthResult: HealthCheckResult = {
        service: service.name,
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthResults.set(service.id, healthResult);
      this.emit('healthCheckFailed', healthResult);

      logger.error(`Health check failed for service: ${service.name}`, {
        service: 'health-check',
        metadata: { serviceId: service.id, serviceName: service.name },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });

      return healthResult;
    }
  }

  /**
   * Get current health status for a service
   */
  getServiceHealth(serviceId: string): HealthCheckResult | null {
    return this.healthResults.get(serviceId) || null;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.healthResults.values());
    const healthy = services.filter(s => s.status === 'healthy').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    const degraded = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthy > 0) {
      overall = services.length > 1 && healthy > 0 ? 'degraded' : 'unhealthy';
    } else if (degraded > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date(),
      summary: {
        total: services.length,
        healthy,
        unhealthy,
        degraded
      }
    };
  }

  /**
   * Get health check statistics
   */
  getHealthStats(): {
    totalChecks: number;
    averageResponseTime: number;
    successRate: number;
    serviceStats: Record<string, {
      checks: number;
      successes: number;
      failures: number;
      averageResponseTime: number;
    }>;
  } {
    const services = Array.from(this.healthResults.values());
    const totalChecks = services.length;
    const successfulChecks = services.filter(s => s.status === 'healthy').length;
    const averageResponseTime = services.length > 0 
      ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length 
      : 0;

    const serviceStats: Record<string, any> = {};
    
    // Group by service name for statistics
    const serviceGroups = new Map<string, HealthCheckResult[]>();
    for (const result of services) {
      if (!serviceGroups.has(result.service)) {
        serviceGroups.set(result.service, []);
      }
      serviceGroups.get(result.service)!.push(result);
    }

    for (const [serviceName, results] of serviceGroups.entries()) {
      const checks = results.length;
      const successes = results.filter(r => r.status === 'healthy').length;
      const failures = results.filter(r => r.status === 'unhealthy').length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / checks;

      serviceStats[serviceName] = {
        checks,
        successes,
        failures,
        averageResponseTime: avgResponseTime
      };
    }

    return {
      totalChecks,
      averageResponseTime,
      successRate: totalChecks > 0 ? successfulChecks / totalChecks : 0,
      serviceStats
    };
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performAllHealthChecks();
    }, this.CHECK_INTERVAL);

    logger.info('Health check service started', {
      service: 'health-check',
      metadata: { interval: this.CHECK_INTERVAL }
    });
  }

  /**
   * Perform health checks on all registered services
   */
  private async performAllHealthChecks(): Promise<void> {
    const allServices = serviceDiscovery.getAllServices();
    const healthCheckPromises: Promise<HealthCheckResult>[] = [];

    for (const services of Object.values(allServices)) {
      for (const service of services) {
        healthCheckPromises.push(this.checkServiceHealth(service));
      }
    }

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Determine health status from response data
   */
  private determineHealthStatus(data: any): 'healthy' | 'unhealthy' | 'degraded' {
    // If explicit status is provided
    if (data.status) {
      return data.status;
    }

    // Check memory usage
    if (data.memory && data.memory.percentage > 90) {
      return 'degraded';
    }

    // Check CPU usage
    if (data.cpu && data.cpu.usage > 90) {
      return 'degraded';
    }

    // Check dependencies
    if (data.dependencies) {
      const dependencyValues = Object.values(data.dependencies);
      const failedDependencies = dependencyValues.filter(status => !status).length;
      
      if (failedDependencies > 0) {
        return dependencyValues.length > 1 && failedDependencies < dependencyValues.length 
          ? 'degraded' 
          : 'unhealthy';
      }
    }

    return 'healthy';
  }

  /**
   * Stop health checking
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('Health check service stopped', {
      service: 'health-check'
    });
  }

  /**
   * Clear all health results
   */
  clearResults(): void {
    this.healthResults.clear();
    logger.info('Health check results cleared', {
      service: 'health-check'
    });
  }
}

export const healthCheckService = HealthCheckService.getInstance();