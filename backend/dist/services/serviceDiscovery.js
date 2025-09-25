"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceDiscovery = exports.ServiceDiscovery = void 0;
const events_1 = require("events");
const loggerService_1 = require("./loggerService");
class ServiceDiscovery extends events_1.EventEmitter {
    constructor() {
        super();
        this.registry = {};
        this.healthCheckInterval = null;
        this.HEALTH_CHECK_INTERVAL = 30000;
        this.HEALTH_TIMEOUT = 5000;
        this.MAX_RETRIES = 3;
        this.startHealthChecking();
    }
    static getInstance() {
        if (!ServiceDiscovery.instance) {
            ServiceDiscovery.instance = new ServiceDiscovery();
        }
        return ServiceDiscovery.instance;
    }
    async registerService(serviceInfo) {
        const service = {
            ...serviceInfo,
            registeredAt: new Date(),
            lastHealthCheck: new Date(),
            status: 'unknown'
        };
        if (!this.registry[service.name]) {
            this.registry[service.name] = [];
        }
        this.registry[service.name] = this.registry[service.name].filter(s => s.id !== service.id);
        this.registry[service.name].push(service);
        loggerService_1.logger.info(`Service registered: ${service.name}`, {
            service: 'service-discovery',
            metadata: {
                serviceId: service.id,
                serviceName: service.name,
                host: service.host,
                port: service.port
            }
        });
        await this.checkServiceHealth(service);
        this.emit('serviceRegistered', service);
    }
    deregisterService(serviceName, serviceId) {
        if (this.registry[serviceName]) {
            const initialLength = this.registry[serviceName].length;
            this.registry[serviceName] = this.registry[serviceName].filter(s => s.id !== serviceId);
            if (this.registry[serviceName].length < initialLength) {
                loggerService_1.logger.info(`Service deregistered: ${serviceName}`, {
                    service: 'service-discovery',
                    metadata: { serviceId, serviceName }
                });
                this.emit('serviceDeregistered', { serviceName, serviceId });
            }
        }
    }
    discoverServices(serviceName, tags) {
        const services = this.registry[serviceName] || [];
        if (!tags || tags.length === 0) {
            return services.filter(s => s.status === 'healthy');
        }
        return services.filter(service => service.status === 'healthy' &&
            tags.every(tag => service.tags.includes(tag)));
    }
    getServiceInstance(serviceName, tags) {
        const services = this.discoverServices(serviceName, tags);
        if (services.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * services.length);
        return services[index];
    }
    getAllServices() {
        return { ...this.registry };
    }
    getServiceHealth(serviceName) {
        const services = this.registry[serviceName] || [];
        const healthy = services.filter(s => s.status === 'healthy').length;
        const unhealthy = services.filter(s => s.status === 'unhealthy').length;
        return {
            healthy,
            unhealthy,
            total: services.length
        };
    }
    checkDependencies(serviceName) {
        const services = this.registry[serviceName] || [];
        if (services.length === 0)
            return {};
        const service = services[0];
        const dependencyStatus = {};
        for (const dependency of service.dependencies) {
            const dependentServices = this.discoverServices(dependency);
            dependencyStatus[dependency] = dependentServices.length > 0;
        }
        return dependencyStatus;
    }
    startHealthChecking() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, this.HEALTH_CHECK_INTERVAL);
        loggerService_1.logger.info('Service discovery health checking started', {
            service: 'service-discovery',
            metadata: { interval: this.HEALTH_CHECK_INTERVAL }
        });
    }
    async performHealthChecks() {
        const allServices = Object.values(this.registry).flat();
        const healthCheckPromises = allServices.map(service => this.checkServiceHealth(service));
        await Promise.allSettled(healthCheckPromises);
    }
    async checkServiceHealth(service) {
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
                loggerService_1.logger.info(`Service recovered: ${service.name}`, {
                    service: 'service-discovery',
                    metadata: { serviceId: service.id, serviceName: service.name }
                });
                this.emit('serviceRecovered', service);
            }
            else if (wasHealthy && service.status === 'unhealthy') {
                loggerService_1.logger.warn(`Service became unhealthy: ${service.name}`, {
                    service: 'service-discovery',
                    metadata: { serviceId: service.id, serviceName: service.name }
                });
                this.emit('serviceUnhealthy', service);
            }
        }
        catch (error) {
            const wasHealthy = service.status === 'healthy';
            service.status = 'unhealthy';
            service.lastHealthCheck = new Date();
            if (wasHealthy) {
                loggerService_1.logger.error(`Service health check failed: ${service.name}`, {
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
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        loggerService_1.logger.info('Service discovery stopped', {
            service: 'service-discovery'
        });
    }
    getStats() {
        const allServices = Object.values(this.registry).flat();
        const healthyServices = allServices.filter(s => s.status === 'healthy').length;
        const unhealthyServices = allServices.filter(s => s.status === 'unhealthy').length;
        const servicesByType = {};
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
exports.ServiceDiscovery = ServiceDiscovery;
exports.serviceDiscovery = ServiceDiscovery.getInstance();
//# sourceMappingURL=serviceDiscovery.js.map