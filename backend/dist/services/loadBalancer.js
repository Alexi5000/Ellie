"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBalancer = exports.LoadBalancer = exports.LoadBalancingStrategy = void 0;
const serviceDiscovery_1 = require("./serviceDiscovery");
const loggerService_1 = require("./loggerService");
var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["WEIGHTED_ROUND_ROBIN"] = "weighted_round_robin";
    LoadBalancingStrategy["RANDOM"] = "random";
    LoadBalancingStrategy["HEALTH_BASED"] = "health_based";
})(LoadBalancingStrategy || (exports.LoadBalancingStrategy = LoadBalancingStrategy = {}));
class LoadBalancer {
    constructor() {
        this.serviceMetrics = new Map();
        this.roundRobinCounters = new Map();
        this.strategy = LoadBalancingStrategy.HEALTH_BASED;
        serviceDiscovery_1.serviceDiscovery.on('serviceRegistered', (service) => {
            this.initializeServiceMetrics(service);
        });
        serviceDiscovery_1.serviceDiscovery.on('serviceDeregistered', (event) => {
            this.removeServiceMetrics(event.serviceId);
        });
    }
    static getInstance() {
        if (!LoadBalancer.instance) {
            LoadBalancer.instance = new LoadBalancer();
        }
        return LoadBalancer.instance;
    }
    setStrategy(strategy) {
        this.strategy = strategy;
        loggerService_1.logger.info(`Load balancing strategy changed to: ${strategy}`, {
            service: 'load-balancer'
        });
    }
    getServiceInstance(serviceName, tags) {
        const availableServices = serviceDiscovery_1.serviceDiscovery.discoverServices(serviceName, tags);
        if (availableServices.length === 0) {
            loggerService_1.logger.warn(`No healthy services found for: ${serviceName}`, {
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
    recordRequest(serviceId, responseTime, success) {
        const metrics = this.serviceMetrics.get(serviceId);
        if (!metrics)
            return;
        metrics.totalRequests++;
        metrics.lastRequestTime = new Date();
        const alpha = 0.1;
        metrics.averageResponseTime = alpha * responseTime + (1 - alpha) * metrics.averageResponseTime;
        if (!success) {
            metrics.errorRate = alpha * 1 + (1 - alpha) * metrics.errorRate;
        }
        else {
            metrics.errorRate = (1 - alpha) * metrics.errorRate;
        }
        this.serviceMetrics.set(serviceId, metrics);
    }
    recordConnectionStart(serviceId) {
        const metrics = this.serviceMetrics.get(serviceId);
        if (metrics) {
            metrics.activeConnections++;
            this.serviceMetrics.set(serviceId, metrics);
        }
    }
    recordConnectionEnd(serviceId) {
        const metrics = this.serviceMetrics.get(serviceId);
        if (metrics && metrics.activeConnections > 0) {
            metrics.activeConnections--;
            this.serviceMetrics.set(serviceId, metrics);
        }
    }
    getServiceMetrics(serviceId) {
        return this.serviceMetrics.get(serviceId) || null;
    }
    getStats() {
        const allMetrics = Array.from(this.serviceMetrics.values());
        const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
        const averageResponseTime = allMetrics.length > 0
            ? allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length
            : 0;
        const serviceMetricsObj = {};
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
    roundRobinSelection(serviceName, services) {
        const counter = this.roundRobinCounters.get(serviceName) || 0;
        const selectedIndex = counter % services.length;
        this.roundRobinCounters.set(serviceName, counter + 1);
        return services[selectedIndex];
    }
    leastConnectionsSelection(services) {
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
    weightedRoundRobinSelection(serviceName, services) {
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
        return services[0];
    }
    randomSelection(services) {
        const randomIndex = Math.floor(Math.random() * services.length);
        return services[randomIndex];
    }
    healthBasedSelection(services) {
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
    calculateHealthScore(service) {
        const metrics = this.serviceMetrics.get(service.id);
        if (!metrics)
            return 0.5;
        const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / 5000));
        const errorRateScore = Math.max(0, 1 - metrics.errorRate);
        const connectionScore = Math.max(0, 1 - (metrics.activeConnections / 100));
        return (responseTimeScore * 0.4 + errorRateScore * 0.4 + connectionScore * 0.2);
    }
    initializeServiceMetrics(service) {
        this.serviceMetrics.set(service.id, {
            activeConnections: 0,
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            lastRequestTime: new Date(),
            weight: service.metadata.weight || 1
        });
        loggerService_1.logger.info(`Initialized metrics for service: ${service.name}`, {
            service: 'load-balancer',
            metadata: { serviceId: service.id, serviceName: service.name }
        });
    }
    removeServiceMetrics(serviceId) {
        this.serviceMetrics.delete(serviceId);
        loggerService_1.logger.info(`Removed metrics for service: ${serviceId}`, {
            service: 'load-balancer',
            metadata: { serviceId }
        });
    }
}
exports.LoadBalancer = LoadBalancer;
exports.loadBalancer = LoadBalancer.getInstance();
//# sourceMappingURL=loadBalancer.js.map