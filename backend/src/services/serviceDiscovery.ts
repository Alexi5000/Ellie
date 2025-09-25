/**
 * Service Discovery and Health Management System
 * Provides service registration, discovery, and health monitoring
 */

import { EventEmitter } from 'events';
import { logger } from './loggerService';

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  healthEndpoint: string;
  metadata: Record<string, any>;
  tags: string[];
  registeredAt: Date;
  lastHealthCheck: Date;
  status: 'healthy' | 'unhealthy' | 'unknown';
  dependencies: string[];
}

export interface ServiceRegistry {
  [serviceName: string]: ServiceInfo[];
}

export class ServiceDiscovery extends EventEmitter {
  private static instance: ServiceDiscovery;
  private registry: ServiceRegistry = {};
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly HEALTH_TIMEOUT = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;

  private constructor() {
    super();
    this.startHealthChecking();
  }

  static getInstance(): ServiceDiscovery {
    if (!ServiceDiscovery.instance) {
      ServiceDiscovery.instance = new ServiceDiscovery();
    }
    return ServiceDiscovery.instance;
  }

  /**
   * Register a service with the discovery system
   */
  async registerService(serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'>): Promise<void> {
    const service: ServiceInfo = {
      ...serviceInfo,
      registeredAt: new Date(),
      lastHealthCheck: new Date(),
      status: 'unknown'
    };

    if (!this.registry[service.name]) {
      this.registry[service.name] = [];
    }

    // Remove existing service with same ID
    this.registry[service.name] = this.registry[service.name].filter(s => s.id !== service.id);
    
    // Add new service
    this.registry[service.name].push(service);

    logger.info(`Service registered: ${service.name}`, {
      service: 'service-discovery',
      metadata: {
        serviceId: service.id,
        serviceName: service.name,
        host: service.host,
        port: service.port
      }
    });

    // Perform initial health check
    await this.checkServiceHealth(service);
    
    this.emit('serviceRegistered', service);
  }

  /**
   * Deregister a service
   */
  deregisterService(serviceName: string, serviceId: string): void {
    if (this.registry[serviceName]) {
      const initialLength = this.registry[serviceName].length;
      this.registry[serviceName] = this.registry[serviceName].filter(s => s.id !== serviceId);
      
      if (this.registry[serviceName].length < initialLength) {
        logger.info(`Service deregistered: ${serviceName}`, {
          service: 'service-discovery',
          metadata: { serviceId, serviceName }
        });
        
        this.emit('serviceDeregistered', { serviceName, serviceId });
      }
    }
  }

  /**
   * Discover services by name
   */
  discoverServices(serviceName: string, tags?: string[]): ServiceInfo[] {
    const services = this.registry[serviceName] || [];
    
    if (!tags || tags.length === 0) {
      return services.filter(s => s.status === 'healthy');
    }

    return services.filter(service => 
      service.status === 'healthy' && 
      tags.every(tag => service.tags.includes(tag))
    );
  }

  /**
   * Get a healthy service instance using round-robin load balancing
   */
  getServiceInstance(serviceName: string, tags?: string[]): ServiceInfo | null {
    const services = this.discoverServices(serviceName, tags);
    
    if (services.length === 0) {
      return null;
    }

    // Simple round-robin selection
    const index = Math.floor(Math.random() * services.length);
    return services[index];
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceRegistry {
    return { ...this.registry };
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): { healthy: number; unhealthy: number; total: number } {
    const services = this.registry[serviceName] || [];
    const healthy = services.filter(s => s.status === 'healthy').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    
    return {
      healthy,
      unhealthy,
      total: services.length
    };
  }

  /**
   * Check dependencies for a service
   */
  checkDependencies(serviceName: string): { [dependency: string]: boolean } {
    const services = this.registry[serviceName] || [];
    if (services.length === 0) return {};

    const service = services[0]; // Check first instance
    const dependencyStatus: { [dependency: string]: boolean } = {};

    for (const dependency of service.dependencies) {
      const dependentServices = this.discoverServices(dependency);
      dependencyStatus[dependency] = dependentServices.length > 0;
    }

    return dependencyStatus;
  }

  /**
   * Start health checking for all registered services
   */
  private startHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    logger.info('Service discovery health checking started', {
      service: 'service-discovery',
      metadata: { interval: this.HEALTH_CHECK_INTERVAL }
    });
  }

  /**
   * Perform health checks on all registered services
   */
  private async performHealthChecks(): Promise<void> {
    const allServices = Object.values(this.registry).flat();
    const healthCheckPromises = allServices.map(service => this.checkServiceHealth(service));
    
    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: ServiceInfo): Promise<void> {
    try {
      const url = `${service.protocol}://${service.host}:${service.port}${service.healthEndpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ServiceDiscovery/1.0'
        }
      });

      clearTimeout(timeoutId);

      const wasHealthy = service.status === 'healthy';
      service.status = response.ok ? 'healthy' : 'unhealthy';
      service.lastHealthCheck = new Date();

      if (!wasHealthy && service.status === 'healthy') {
        logger.info(`Service recovered: ${service.name}`, {
          service: 'service-discovery',
          metadata: { serviceId: service.id, serviceName: service.name }
        });
        this.emit('serviceRecovered', service);
      } else if (wasHealthy && service.status === 'unhealthy') {
        logger.warn(`Service became unhealthy: ${service.name}`, {
          service: 'service-discovery',
          metadata: { serviceId: service.id, serviceName: service.name }
        });
        this.emit('serviceUnhealthy', service);
      }

    } catch (error) {
      const wasHealthy = service.status === 'healthy';
      service.status = 'unhealthy';
      service.lastHealthCheck = new Date();

      if (wasHealthy) {
        logger.error(`Service health check failed: ${service.name}`, {
          service: 'service-discovery',
          metadata: { serviceId: service.id, serviceName: service.name },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        this.emit('serviceUnhealthy', service);
      }
    }
  }

  /**
   * Stop health checking
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('Service discovery stopped', {
      service: 'service-discovery'
    });
  }

  /**
   * Get service discovery statistics
   */
  getStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    servicesByType: Record<string, number>;
  } {
    const allServices = Object.values(this.registry).flat();
    const healthyServices = allServices.filter(s => s.status === 'healthy').length;
    const unhealthyServices = allServices.filter(s => s.status === 'unhealthy').length;
    
    const servicesByType: Record<string, number> = {};
    for (const [serviceName, services] of Object.entries(this.registry)) {
      servicesByType[serviceName] = services.length;
    }

    return {
      totalServices: allServices.length,
      healthyServices,
      unhealthyServices,
      servicesByType
    };
  }
}

export const serviceDiscovery = ServiceDiscovery.getInstance();