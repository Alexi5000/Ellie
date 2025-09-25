"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckService = exports.HealthCheckService = void 0;
const events_1 = require("events");
const loggerService_1 = require("./loggerService");
const serviceDiscovery_1 = require("./serviceDiscovery");
const circuitBreaker_1 = require("./circuitBreaker");
class HealthCheckService extends events_1.EventEmitter {
    constructor() {
        super();
        this.healthResults = new Map();
        this.healthCheckInterval = null;
        this.CHECK_INTERVAL = 30000;
        this.TIMEOUT = 5000;
        this.startHealthChecking();
    }
    static getInstance() {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }
    async checkServiceHealth(service) {
        const startTime = Date.now();
        try {
            const result = await circuitBreaker_1.circuitBreakerManager.execute(`health-check-${service.name}`, async () => {
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
            }, {
                failureThreshold: 3,
                recoveryTimeout: 30000,
                timeout: this.TIMEOUT
            });
            const responseTime = Date.now() - startTime;
            const healthResult = {
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
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const healthResult = {
                service: service.name,
                status: 'unhealthy',
                timestamp: new Date(),
                responseTime,
                details: {},
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            this.healthResults.set(service.id, healthResult);
            this.emit('healthCheckFailed', healthResult);
            loggerService_1.logger.error(`Health check failed for service: ${service.name}`, {
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
    getServiceHealth(serviceId) {
        return this.healthResults.get(serviceId) || null;
    }
    getSystemHealth() {
        const services = Array.from(this.healthResults.values());
        const healthy = services.filter(s => s.status === 'healthy').length;
        const unhealthy = services.filter(s => s.status === 'unhealthy').length;
        const degraded = services.filter(s => s.status === 'degraded').length;
        let overall = 'healthy';
        if (unhealthy > 0) {
            overall = services.length > 1 && healthy > 0 ? 'degraded' : 'unhealthy';
        }
        else if (degraded > 0) {
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
    getHealthStats() {
        const services = Array.from(this.healthResults.values());
        const totalChecks = services.length;
        const successfulChecks = services.filter(s => s.status === 'healthy').length;
        const averageResponseTime = services.length > 0
            ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length
            : 0;
        const serviceStats = {};
        const serviceGroups = new Map();
        for (const result of services) {
            if (!serviceGroups.has(result.service)) {
                serviceGroups.set(result.service, []);
            }
            serviceGroups.get(result.service).push(result);
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
    startHealthChecking() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            await this.performAllHealthChecks();
        }, this.CHECK_INTERVAL);
        loggerService_1.logger.info('Health check service started', {
            service: 'health-check',
            metadata: { interval: this.CHECK_INTERVAL }
        });
    }
    async performAllHealthChecks() {
        const allServices = serviceDiscovery_1.serviceDiscovery.getAllServices();
        const healthCheckPromises = [];
        for (const services of Object.values(allServices)) {
            for (const service of services) {
                healthCheckPromises.push(this.checkServiceHealth(service));
            }
        }
        await Promise.allSettled(healthCheckPromises);
    }
    determineHealthStatus(data) {
        if (data.status) {
            return data.status;
        }
        if (data.memory && data.memory.percentage > 90) {
            return 'degraded';
        }
        if (data.cpu && data.cpu.usage > 90) {
            return 'degraded';
        }
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
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        loggerService_1.logger.info('Health check service stopped', {
            service: 'health-check'
        });
    }
    clearResults() {
        this.healthResults.clear();
        loggerService_1.logger.info('Health check results cleared', {
            service: 'health-check'
        });
    }
}
exports.HealthCheckService = HealthCheckService;
exports.healthCheckService = HealthCheckService.getInstance();
//# sourceMappingURL=healthCheckService.js.map