/**
 * Service Manager
 * Manages service lifecycle, registration, and coordination
 */

import { EventEmitter } from 'events';
import { serviceDiscovery, ServiceInfo } from './serviceDiscovery';
import { healthCheckService } from './healthCheckService';
import { apiGateway, RouteConfig } from './apiGateway';
import { logger } from './loggerService';
import { fallbackService } from './fallbackService';

export interface ServiceDefinition {
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  healthEndpoint: string;
  tags: string[];
  dependencies: string[];
  routes?: RouteConfig[];
  metadata?: Record<string, any>;
  startupTimeout?: number;
  shutdownTimeout?: number;
}

export interface ServiceStatus {
  name: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  startedAt?: Date;
  stoppedAt?: Date;
  error?: string;
  health?: 'healthy' | 'unhealthy' | 'degraded';
  dependencies: Record<string, boolean>;
}

export class ServiceManager extends EventEmitter {
  private static instance: ServiceManager;
  private services: Map<string, ServiceDefinition> = new Map();
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private startupOrder: string[] = [];
  private shutdownOrder: string[] = [];
  private isShuttingDown: boolean = false;

  private constructor() {
    super();
    this.setupEventHandlers();
    this.setupGracefulShutdown();
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Register a service definition
   */
  registerService(definition: ServiceDefinition): void {
    this.services.set(definition.name, definition);
    
    // Initialize service status
    this.serviceStatuses.set(definition.name, {
      name: definition.name,
      status: 'stopped',
      dependencies: {}
    });

    // Register routes with API Gateway if provided
    if (definition.routes) {
      for (const route of definition.routes) {
        apiGateway.registerRoute({
          ...route,
          serviceName: definition.name
        });
      }
    }

    logger.info(`Service registered: ${definition.name}`, {
      service: 'service-manager',
      metadata: {
        serviceName: definition.name,
        version: definition.version,
        host: definition.host,
        port: definition.port,
        dependencies: definition.dependencies
      }
    });

    this.emit('serviceRegistered', definition);
  }

  /**
   * Start a specific service
   */
  async startService(serviceName: string): Promise<void> {
    const definition = this.services.get(serviceName);
    if (!definition) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const status = this.serviceStatuses.get(serviceName)!;
    if (status.status === 'running') {
      logger.warn(`Service already running: ${serviceName}`, {
        service: 'service-manager',
        metadata: { serviceName }
      });
      return;
    }

    try {
      // Update status
      status.status = 'starting';
      status.error = undefined;
      this.serviceStatuses.set(serviceName, status);
      this.emit('serviceStarting', serviceName);

      // Check dependencies
      await this.checkDependencies(definition);

      // Register with service discovery
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: `${definition.name}-${Date.now()}`,
        name: definition.name,
        version: definition.version,
        host: definition.host,
        port: definition.port,
        protocol: definition.protocol,
        healthEndpoint: definition.healthEndpoint,
        metadata: definition.metadata || {},
        tags: definition.tags,
        dependencies: definition.dependencies
      };

      await serviceDiscovery.registerService(serviceInfo);

      // Wait for service to be healthy
      await this.waitForServiceHealth(serviceInfo, definition.startupTimeout || 60000);

      // Update status
      status.status = 'running';
      status.startedAt = new Date();
      this.serviceStatuses.set(serviceName, status);

      logger.info(`Service started successfully: ${serviceName}`, {
        service: 'service-manager',
        metadata: { serviceName }
      });

      this.emit('serviceStarted', serviceName);

    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      this.serviceStatuses.set(serviceName, status);

      logger.error(`Failed to start service: ${serviceName}`, {
        service: 'service-manager',
        metadata: { serviceName },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });

      this.emit('serviceFailed', serviceName, error);
      throw error;
    }
  }

  /**
   * Stop a specific service
   */
  async stopService(serviceName: string): Promise<void> {
    const definition = this.services.get(serviceName);
    if (!definition) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const status = this.serviceStatuses.get(serviceName)!;
    if (status.status === 'stopped') {
      return;
    }

    try {
      status.status = 'stopping';
      this.serviceStatuses.set(serviceName, status);
      this.emit('serviceStopping', serviceName);

      // Deregister from service discovery
      const services = serviceDiscovery.discoverServices(serviceName);
      for (const service of services) {
        serviceDiscovery.deregisterService(serviceName, service.id);
      }

      // Wait for graceful shutdown
      await this.waitForServiceShutdown(definition);

      status.status = 'stopped';
      status.stoppedAt = new Date();
      this.serviceStatuses.set(serviceName, status);

      logger.info(`Service stopped: ${serviceName}`, {
        service: 'service-manager',
        metadata: { serviceName }
      });

      this.emit('serviceStopped', serviceName);

    } catch (error) {
      logger.error(`Error stopping service: ${serviceName}`, {
        service: 'service-manager',
        metadata: { serviceName },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });

      throw error;
    }
  }

  /**
   * Start all registered services in dependency order
   */
  async startAllServices(): Promise<void> {
    const startOrder = this.calculateStartupOrder();
    
    logger.info('Starting all services', {
      service: 'service-manager',
      metadata: { startOrder }
    });

    for (const serviceName of startOrder) {
      try {
        await this.startService(serviceName);
      } catch (error) {
        logger.error(`Failed to start service in batch: ${serviceName}`, {
          service: 'service-manager',
          metadata: { serviceName },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        
        // Continue with other services unless it's a critical dependency
        const definition = this.services.get(serviceName);
        if (definition?.tags.includes('critical')) {
          throw error;
        }
      }
    }

    this.emit('allServicesStarted');
  }

  /**
   * Stop all services in reverse dependency order
   */
  async stopAllServices(): Promise<void> {
    this.isShuttingDown = true;
    const stopOrder = this.calculateShutdownOrder();
    
    logger.info('Stopping all services', {
      service: 'service-manager',
      metadata: { stopOrder }
    });

    for (const serviceName of stopOrder) {
      try {
        await this.stopService(serviceName);
      } catch (error) {
        logger.error(`Error stopping service in batch: ${serviceName}`, {
          service: 'service-manager',
          metadata: { serviceName },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    this.emit('allServicesStopped');
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get service manager statistics
   */
  getStats(): {
    totalServices: number;
    runningServices: number;
    failedServices: number;
    serviceStatuses: Record<string, ServiceStatus>;
  } {
    const statuses = Array.from(this.serviceStatuses.values());
    const running = statuses.filter(s => s.status === 'running').length;
    const failed = statuses.filter(s => s.status === 'failed').length;

    const serviceStatusesObj: Record<string, ServiceStatus> = {};
    for (const [name, status] of this.serviceStatuses.entries()) {
      serviceStatusesObj[name] = { ...status };
    }

    return {
      totalServices: this.services.size,
      runningServices: running,
      failedServices: failed,
      serviceStatuses: serviceStatusesObj
    };
  }

  /**
   * Check if all dependencies are available
   */
  private async checkDependencies(definition: ServiceDefinition): Promise<void> {
    const status = this.serviceStatuses.get(definition.name)!;
    
    for (const dependency of definition.dependencies) {
      const dependentServices = serviceDiscovery.discoverServices(dependency);
      const isAvailable = dependentServices.length > 0;
      
      status.dependencies[dependency] = isAvailable;
      
      if (!isAvailable) {
        throw new Error(`Dependency not available: ${dependency}`);
      }
    }

    this.serviceStatuses.set(definition.name, status);
  }

  /**
   * Wait for service to become healthy
   */
  private async waitForServiceHealth(serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'>, timeout: number): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const url = `${serviceInfo.protocol}://${serviceInfo.host}:${serviceInfo.port}${serviceInfo.healthEndpoint}`;
        const response = await fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          return; // Service is healthy
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Service health check timeout: ${serviceInfo.name}`);
  }

  /**
   * Wait for service shutdown
   */
  private async waitForServiceShutdown(definition: ServiceDefinition): Promise<void> {
    const timeout = definition.shutdownTimeout || 30000;
    
    // In a real implementation, this would send shutdown signals to the service
    // For now, we'll just wait a bit to simulate graceful shutdown
    await new Promise(resolve => setTimeout(resolve, Math.min(timeout, 5000)));
  }

  /**
   * Calculate startup order based on dependencies
   */
  private calculateStartupOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving: ${serviceName}`);
      }

      visiting.add(serviceName);
      
      const definition = this.services.get(serviceName);
      if (definition) {
        for (const dependency of definition.dependencies) {
          if (this.services.has(dependency)) {
            visit(dependency);
          }
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return order;
  }

  /**
   * Calculate shutdown order (reverse of startup order)
   */
  private calculateShutdownOrder(): string[] {
    return this.calculateStartupOrder().reverse();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen to health check events
    healthCheckService.on('healthCheckFailed', (result) => {
      const status = this.serviceStatuses.get(result.service);
      if (status) {
        status.health = 'unhealthy';
        this.serviceStatuses.set(result.service, status);
      }
    });

    healthCheckService.on('healthCheckCompleted', (result) => {
      const status = this.serviceStatuses.get(result.service);
      if (status) {
        status.health = result.status;
        this.serviceStatuses.set(result.service, status);
      }
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      
      logger.info(`Received ${signal}, starting graceful shutdown`, {
        service: 'service-manager'
      });

      try {
        await this.stopAllServices();
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          service: 'service-manager',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }
}

export const serviceManager = ServiceManager.getInstance();