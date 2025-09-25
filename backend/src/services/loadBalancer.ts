/**
 * Load Balancer Service
 * Provides intelligent load balancing for service requests
 */

import { ServiceInfo, serviceDiscovery } from './serviceDiscovery';
import { logger } from './loggerService';

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  RANDOM = 'random',
  HEALTH_BASED = 'health_based'
}

interface ServiceMetrics {
  activeConnections: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: Date;
  weight: number;
}

export class LoadBalancer {
  private static instance: LoadBalancer;
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private roundRobinCounters: Map<string, number> = new Map();
  private strategy: LoadBalancingStrategy = LoadBalancingStrategy.HEALTH_BASED;

  private constructor() {
    // Listen to service discovery events
    serviceDiscovery.on('serviceRegistered', (service: ServiceInfo) => {
      this.initializeServiceMetrics(service);
    });

    serviceDiscovery.on('serviceDeregistered', (event: { serviceName: string; serviceId: string }) => {
      this.removeServiceMetrics(event.serviceId);
    });
  }

  static getInstance(): LoadBalancer {
    if (!LoadBalancer.instance) {
      LoadBalancer.instance = new LoadBalancer();
    }
    return LoadBalancer.instance;
  }

  /**
   * Set load balancing strategy
   */
  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
    logger.info(`Load balancing strategy changed to: ${strategy}`, {
      service: 'load-balancer'
    });
  }

  /**
   * Get the best service instance based on current strategy
   */
  getServiceInstance(serviceName: string, tags?: string[]): ServiceInfo | null {
    const availableServices = serviceDiscovery.discoverServices(serviceName, tags);
    
    if (availableServices.length === 0) {
      logger.warn(`No healthy services found for: ${serviceName}`, {
        service: 'load-balancer',
        metadata: { serviceName, tags }
      });
      return null;
    }

    if (availableServices.length === 1) {
      return availableServices[0];
    }

    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.roundRobinSelection(serviceName, availableServices);
      
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.leastConnectionsSelection(availableServices);
      
      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.weightedRoundRobinSelection(serviceName, availableServices);
      
      case LoadBalancingStrategy.RANDOM:
        return this.randomSelection(availableServices);
      
      case LoadBalancingStrategy.HEALTH_BASED:
        return this.healthBasedSelection(availableServices);
      
      default:
        return this.roundRobinSelection(serviceName, availableServices);
    }
  }

  /**
   * Record request metrics for a service
   */
  recordRequest(serviceId: string, responseTime: number, success: boolean): void {
    const metrics = this.serviceMetrics.get(serviceId);
    if (!metrics) return;

    metrics.totalRequests++;
    metrics.lastRequestTime = new Date();
    
    // Update average response time (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    metrics.averageResponseTime = alpha * responseTime + (1 - alpha) * metrics.averageResponseTime;
    
    // Update error rate
    if (!success) {
      metrics.errorRate = alpha * 1 + (1 - alpha) * metrics.errorRate;
    } else {
      metrics.errorRate = (1 - alpha) * metrics.errorRate;
    }

    this.serviceMetrics.set(serviceId, metrics);
  }

  /**
   * Record connection start
   */
  recordConnectionStart(serviceId: string): void {
    const metrics = this.serviceMetrics.get(serviceId);
    if (metrics) {
      metrics.activeConnections++;
      this.serviceMetrics.set(serviceId, metrics);
    }
  }

  /**
   * Record connection end
   */
  recordConnectionEnd(serviceId: string): void {
    const metrics = this.serviceMetrics.get(serviceId);
    if (metrics && metrics.activeConnections > 0) {
      metrics.activeConnections--;
      this.serviceMetrics.set(serviceId, metrics);
    }
  }

  /**
   * Get service metrics
   */
  getServiceMetrics(serviceId: string): ServiceMetrics | null {
    return this.serviceMetrics.get(serviceId) || null;
  }

  /**
   * Get load balancer statistics
   */
  getStats(): {
    strategy: LoadBalancingStrategy;
    totalServices: number;
    totalRequests: number;
    averageResponseTime: number;
    serviceMetrics: Record<string, ServiceMetrics>;
  } {
    const allMetrics = Array.from(this.serviceMetrics.values());
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const averageResponseTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length 
      : 0;

    const serviceMetricsObj: Record<string, ServiceMetrics> = {};
    for (const [serviceId, metrics] of this.serviceMetrics.entries()) {
      serviceMetricsObj[serviceId] = { ...metrics };
    }

    return {
      strategy: this.strategy,
      totalServices: this.serviceMetrics.size,
      totalRequests,
      averageResponseTime,
      serviceMetrics: serviceMetricsObj
    };
  }

  /**
   * Round robin selection
   */
  private roundRobinSelection(serviceName: string, services: ServiceInfo[]): ServiceInfo {
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selectedIndex = counter % services.length;
    this.roundRobinCounters.set(serviceName, counter + 1);
    
    return services[selectedIndex];
  }

  /**
   * Least connections selection
   */
  private leastConnectionsSelection(services: ServiceInfo[]): ServiceInfo {
    let selectedService = services[0];
    let minConnections = this.serviceMetrics.get(selectedService.id)?.activeConnections || 0;

    for (const service of services) {
      const connections = this.serviceMetrics.get(service.id)?.activeConnections || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedService = service;
      }
    }

    return selectedService;
  }

  /**
   * Weighted round robin selection
   */
  private weightedRoundRobinSelection(serviceName: string, services: ServiceInfo[]): ServiceInfo {
    const totalWeight = services.reduce((sum, service) => {
      const metrics = this.serviceMetrics.get(service.id);
      return sum + (metrics?.weight || 1);
    }, 0);

    const counter = this.roundRobinCounters.get(serviceName) || 0;
    let weightedIndex = counter % totalWeight;
    this.roundRobinCounters.set(serviceName, counter + 1);

    for (const service of services) {
      const weight = this.serviceMetrics.get(service.id)?.weight || 1;
      if (weightedIndex < weight) {
        return service;
      }
      weightedIndex -= weight;
    }

    return services[0]; // Fallback
  }

  /**
   * Random selection
   */
  private randomSelection(services: ServiceInfo[]): ServiceInfo {
    const randomIndex = Math.floor(Math.random() * services.length);
    return services[randomIndex];
  }

  /**
   * Health-based selection (considers response time and error rate)
   */
  private healthBasedSelection(services: ServiceInfo[]): ServiceInfo {
    let bestService = services[0];
    let bestScore = this.calculateHealthScore(bestService);

    for (const service of services) {
      const score = this.calculateHealthScore(service);
      if (score > bestScore) {
        bestScore = score;
        bestService = service;
      }
    }

    return bestService;
  }

  /**
   * Calculate health score for a service (higher is better)
   */
  private calculateHealthScore(service: ServiceInfo): number {
    const metrics = this.serviceMetrics.get(service.id);
    if (!metrics) return 0.5; // Default score for new services

    // Factors: low response time, low error rate, low active connections
    const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / 5000)); // Normalize to 5s max
    const errorRateScore = Math.max(0, 1 - metrics.errorRate);
    const connectionScore = Math.max(0, 1 - (metrics.activeConnections / 100)); // Normalize to 100 max connections

    // Weighted average
    return (responseTimeScore * 0.4 + errorRateScore * 0.4 + connectionScore * 0.2);
  }

  /**
   * Initialize metrics for a new service
   */
  private initializeServiceMetrics(service: ServiceInfo): void {
    this.serviceMetrics.set(service.id, {
      activeConnections: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: new Date(),
      weight: service.metadata.weight || 1
    });

    logger.info(`Initialized metrics for service: ${service.name}`, {
      service: 'load-balancer',
      metadata: { serviceId: service.id, serviceName: service.name }
    });
  }

  /**
   * Remove metrics for a deregistered service
   */
  private removeServiceMetrics(serviceId: string): void {
    this.serviceMetrics.delete(serviceId);
    logger.info(`Removed metrics for service: ${serviceId}`, {
      service: 'load-balancer',
      metadata: { serviceId }
    });
  }
}

export const loadBalancer = LoadBalancer.getInstance();