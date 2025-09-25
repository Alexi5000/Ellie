/**
 * Service Discovery Integration Tests
 * Tests the complete service discovery, load balancing, and health checking system
 */

// Unmock services for integration testing
jest.unmock('../services/serviceDiscovery');
jest.unmock('../services/loadBalancer');
jest.unmock('../services/healthCheckService');
jest.unmock('../services/circuitBreaker');
jest.unmock('../services/apiGateway');
jest.unmock('../services/serviceManager');
jest.unmock('../services/loggerService');

import { ServiceDiscovery, ServiceInfo } from '../services/serviceDiscovery';
import { LoadBalancer, LoadBalancingStrategy } from '../services/loadBalancer';
import { HealthCheckService } from '../services/healthCheckService';
import { CircuitBreakerManager } from '../services/circuitBreaker';
import { APIGateway } from '../services/apiGateway';
import { ServiceManager } from '../services/serviceManager';

describe('Service Discovery Integration', () => {
  let serviceDiscovery: ServiceDiscovery;
  let loadBalancer: LoadBalancer;
  let healthCheckService: HealthCheckService;
  let circuitBreakerManager: CircuitBreakerManager;
  let apiGateway: APIGateway;
  let serviceManager: ServiceManager;

  beforeEach(() => {
    serviceDiscovery = ServiceDiscovery.getInstance();
    loadBalancer = LoadBalancer.getInstance();
    healthCheckService = HealthCheckService.getInstance();
    circuitBreakerManager = CircuitBreakerManager.getInstance();
    apiGateway = APIGateway.getInstance();
    serviceManager = ServiceManager.getInstance();

    // Clear any existing services
    const allServices = serviceDiscovery.getAllServices();
    for (const [serviceName, services] of Object.entries(allServices)) {
      for (const service of services) {
        serviceDiscovery.deregisterService(serviceName, service.id);
      }
    }
  });

  afterEach(() => {
    // Cleanup
    healthCheckService.stop();
    serviceDiscovery.stop();
  });

  describe('Service Registration and Discovery', () => {
    it('should register and discover services', async () => {
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'test-service-1',
        name: 'test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: { environment: 'test' },
        tags: ['api', 'test'],
        dependencies: []
      };

      await serviceDiscovery.registerService(serviceInfo);

      const discoveredServices = serviceDiscovery.discoverServices('test-service');
      expect(discoveredServices).toHaveLength(1);
      expect(discoveredServices[0].name).toBe('test-service');
      expect(discoveredServices[0].id).toBe('test-service-1');
    });

    it('should discover services by tags', async () => {
      const service1: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'service-1',
        name: 'api-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: {},
        tags: ['api', 'backend'],
        dependencies: []
      };

      const service2: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'service-2',
        name: 'api-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3002,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: {},
        tags: ['api', 'frontend'],
        dependencies: []
      };

      await serviceDiscovery.registerService(service1);
      await serviceDiscovery.registerService(service2);

      const backendServices = serviceDiscovery.discoverServices('api-service', ['backend']);
      const frontendServices = serviceDiscovery.discoverServices('api-service', ['frontend']);

      expect(backendServices).toHaveLength(1);
      expect(backendServices[0].id).toBe('service-1');
      expect(frontendServices).toHaveLength(1);
      expect(frontendServices[0].id).toBe('service-2');
    });

    it('should handle service deregistration', async () => {
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'test-service-1',
        name: 'test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: {},
        tags: ['test'],
        dependencies: []
      };

      await serviceDiscovery.registerService(serviceInfo);
      expect(serviceDiscovery.discoverServices('test-service')).toHaveLength(1);

      serviceDiscovery.deregisterService('test-service', 'test-service-1');
      expect(serviceDiscovery.discoverServices('test-service')).toHaveLength(0);
    });
  });

  describe('Load Balancing', () => {
    beforeEach(async () => {
      // Register multiple instances of the same service
      for (let i = 1; i <= 3; i++) {
        const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
          id: `service-${i}`,
          name: 'load-balanced-service',
          version: '1.0.0',
          host: 'localhost',
          port: 3000 + i,
          protocol: 'http',
          healthEndpoint: '/health',
          metadata: { weight: i },
          tags: ['api'],
          dependencies: []
        };
        await serviceDiscovery.registerService(serviceInfo);
      }
    });

    it('should distribute requests using round robin', () => {
      loadBalancer.setStrategy(LoadBalancingStrategy.ROUND_ROBIN);

      const selectedServices = new Set<string>();
      for (let i = 0; i < 6; i++) {
        const service = loadBalancer.getServiceInstance('load-balanced-service');
        if (service) {
          selectedServices.add(service.id);
        }
      }

      // Should have selected all 3 services
      expect(selectedServices.size).toBe(3);
    });

    it('should select services based on health', () => {
      loadBalancer.setStrategy(LoadBalancingStrategy.HEALTH_BASED);

      // Record some metrics to influence health-based selection
      loadBalancer.recordRequest('service-1', 100, true);
      loadBalancer.recordRequest('service-2', 500, true);
      loadBalancer.recordRequest('service-3', 1000, false);

      const service = loadBalancer.getServiceInstance('load-balanced-service');
      expect(service).toBeTruthy();
      // Service-1 should be preferred due to better metrics
      expect(service?.id).toBe('service-1');
    });

    it('should track connection metrics', () => {
      const serviceId = 'service-1';
      
      loadBalancer.recordConnectionStart(serviceId);
      loadBalancer.recordConnectionStart(serviceId);
      
      const metrics = loadBalancer.getServiceMetrics(serviceId);
      expect(metrics?.activeConnections).toBe(2);
      
      loadBalancer.recordConnectionEnd(serviceId);
      const updatedMetrics = loadBalancer.getServiceMetrics(serviceId);
      expect(updatedMetrics?.activeConnections).toBe(1);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit breaker after failures', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('test-service', {
        failureThreshold: 2,
        recoveryTimeout: 1000
      });

      // Simulate failures
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Service failure');
        });
      } catch (error) {
        // Expected failure
      }

      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Service failure');
        });
      } catch (error) {
        // Expected failure
      }

      // Circuit should be open now
      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should transition to half-open after timeout', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('test-service', {
        failureThreshold: 1,
        recoveryTimeout: 100
      });

      // Trigger circuit breaker
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Service failure');
        });
      } catch (error) {
        // Expected failure
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow execution again (half-open state)
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Service Manager Integration', () => {
    it('should register and start services', async () => {
      const serviceDef = {
        name: 'test-managed-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http' as const,
        healthEndpoint: '/health',
        tags: ['test'],
        dependencies: [],
        metadata: { environment: 'test' }
      };

      serviceManager.registerService(serviceDef);
      
      const status = serviceManager.getServiceStatus('test-managed-service');
      expect(status).toBeTruthy();
      expect(status?.name).toBe('test-managed-service');
      expect(status?.status).toBe('stopped');
    });

    it('should track service dependencies', async () => {
      const dependencyService = {
        name: 'dependency-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http' as const,
        healthEndpoint: '/health',
        tags: ['dependency'],
        dependencies: [],
        metadata: {}
      };

      const mainService = {
        name: 'main-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3002,
        protocol: 'http' as const,
        healthEndpoint: '/health',
        tags: ['main'],
        dependencies: ['dependency-service'],
        metadata: {}
      };

      serviceManager.registerService(dependencyService);
      serviceManager.registerService(mainService);

      const stats = serviceManager.getStats();
      expect(stats.totalServices).toBe(2);
    });
  });

  describe('API Gateway Integration', () => {
    beforeEach(async () => {
      // Register a test service
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'gateway-test-service',
        name: 'gateway-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: {},
        tags: ['api'],
        dependencies: []
      };
      await serviceDiscovery.registerService(serviceInfo);
    });

    it('should register routes with the gateway', () => {
      const routeConfig = {
        path: '/api/test',
        method: 'GET' as const,
        serviceName: 'gateway-service',
        targetPath: '/test',
        timeout: 5000
      };

      apiGateway.registerRoute(routeConfig);

      const routes = apiGateway.getRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe('/api/test');
      expect(routes[0].serviceName).toBe('gateway-service');
    });

    it('should provide gateway statistics', () => {
      const routeConfig = {
        path: '/api/stats',
        method: 'GET' as const,
        serviceName: 'gateway-service',
        targetPath: '/stats'
      };

      apiGateway.registerRoute(routeConfig);

      const stats = apiGateway.getStats();
      expect(stats.totalRoutes).toBe(1);
      expect(stats.registeredServices).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Service Discovery Flow', () => {
    it('should handle complete service lifecycle', async () => {
      // 1. Register service
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'e2e-service',
        name: 'e2e-test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: { environment: 'test' },
        tags: ['e2e', 'test'],
        dependencies: []
      };

      await serviceDiscovery.registerService(serviceInfo);

      // 2. Verify service is discoverable
      const services = serviceDiscovery.discoverServices('e2e-test-service');
      expect(services).toHaveLength(1);

      // 3. Load balancer should find the service
      const selectedService = loadBalancer.getServiceInstance('e2e-test-service');
      expect(selectedService).toBeTruthy();
      expect(selectedService?.id).toBe('e2e-service');

      // 4. Record some metrics
      loadBalancer.recordRequest('e2e-service', 200, true);
      const metrics = loadBalancer.getServiceMetrics('e2e-service');
      expect(metrics?.totalRequests).toBe(1);

      // 5. Circuit breaker should be available
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('e2e-test-service');
      expect(circuitBreaker.getState()).toBe('closed');

      // 6. Deregister service
      serviceDiscovery.deregisterService('e2e-test-service', 'e2e-service');
      const servicesAfterDeregister = serviceDiscovery.discoverServices('e2e-test-service');
      expect(servicesAfterDeregister).toHaveLength(0);
    });

    it('should handle service failures gracefully', async () => {
      const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
        id: 'failing-service',
        name: 'failing-test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 9999, // Non-existent port
        protocol: 'http',
        healthEndpoint: '/health',
        metadata: {},
        tags: ['test'],
        dependencies: []
      };

      await serviceDiscovery.registerService(serviceInfo);

      // Health check should fail
      const healthResult = await healthCheckService.checkServiceHealth(serviceInfo as ServiceInfo);
      expect(healthResult.status).toBe('unhealthy');
      expect(healthResult.error).toBeTruthy();

      // Circuit breaker should handle failures
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('failing-test-service');
      
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Service unavailable');
        });
      } catch (error) {
        expect(error).toBeTruthy();
      }

      const stats = circuitBreaker.getStats();
      expect(stats.totalFailures).toBe(1);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple service registrations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Register 50 services concurrently
      for (let i = 0; i < 50; i++) {
        const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
          id: `perf-service-${i}`,
          name: 'performance-test-service',
          version: '1.0.0',
          host: 'localhost',
          port: 3000 + i,
          protocol: 'http',
          healthEndpoint: '/health',
          metadata: { index: i },
          tags: ['performance', 'test'],
          dependencies: []
        };
        promises.push(serviceDiscovery.registerService(serviceInfo));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // All services should be discoverable
      const services = serviceDiscovery.discoverServices('performance-test-service');
      expect(services).toHaveLength(50);
    });

    it('should handle high-frequency load balancing requests', () => {
      // Register multiple services
      const servicePromises = [];
      for (let i = 0; i < 10; i++) {
        const serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'> = {
          id: `lb-service-${i}`,
          name: 'load-balancing-test',
          version: '1.0.0',
          host: 'localhost',
          port: 3000 + i,
          protocol: 'http',
          healthEndpoint: '/health',
          metadata: {},
          tags: ['loadbalance'],
          dependencies: []
        };
        servicePromises.push(serviceDiscovery.registerService(serviceInfo));
      }

      return Promise.all(servicePromises).then(() => {
        const startTime = Date.now();
        const selectedServices = new Set<string>();

        // Perform 1000 load balancing operations
        for (let i = 0; i < 1000; i++) {
          const service = loadBalancer.getServiceInstance('load-balancing-test');
          if (service) {
            selectedServices.add(service.id);
          }
        }

        const endTime = Date.now();

        // Should complete quickly
        expect(endTime - startTime).toBeLessThan(100);
        
        // Should have distributed across multiple services
        expect(selectedServices.size).toBeGreaterThan(1);
      });
    });
  });
});