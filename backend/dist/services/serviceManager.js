"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceManager = exports.ServiceManager = void 0;
const events_1 = require("events");
const serviceDiscovery_1 = require("./serviceDiscovery");
const healthCheckService_1 = require("./healthCheckService");
const apiGateway_1 = require("./apiGateway");
const loggerService_1 = require("./loggerService");
class ServiceManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.serviceStatuses = new Map();
        this.startupOrder = [];
        this.shutdownOrder = [];
        this.isShuttingDown = false;
        this.setupEventHandlers();
        this.setupGracefulShutdown();
    }
    static getInstance() {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }
    registerService(definition) {
        this.services.set(definition.name, definition);
        this.serviceStatuses.set(definition.name, {
            name: definition.name,
            status: 'stopped',
            dependencies: {}
        });
        if (definition.routes) {
            for (const route of definition.routes) {
                apiGateway_1.apiGateway.registerRoute({
                    ...route,
                    serviceName: definition.name
                });
            }
        }
        loggerService_1.logger.info(`Service registered: ${definition.name}`, {
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
    async startService(serviceName) {
        const definition = this.services.get(serviceName);
        if (!definition) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        const status = this.serviceStatuses.get(serviceName);
        if (status.status === 'running') {
            loggerService_1.logger.warn(`Service already running: ${serviceName}`, {
                service: 'service-manager',
                metadata: { serviceName }
            });
            return;
        }
        try {
            status.status = 'starting';
            status.error = undefined;
            this.serviceStatuses.set(serviceName, status);
            this.emit('serviceStarting', serviceName);
            await this.checkDependencies(definition);
            const serviceInfo = {
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
            await serviceDiscovery_1.serviceDiscovery.registerService(serviceInfo);
            await this.waitForServiceHealth(serviceInfo, definition.startupTimeout || 60000);
            status.status = 'running';
            status.startedAt = new Date();
            this.serviceStatuses.set(serviceName, status);
            loggerService_1.logger.info(`Service started successfully: ${serviceName}`, {
                service: 'service-manager',
                metadata: { serviceName }
            });
            this.emit('serviceStarted', serviceName);
        }
        catch (error) {
            status.status = 'failed';
            status.error = error instanceof Error ? error.message : 'Unknown error';
            this.serviceStatuses.set(serviceName, status);
            loggerService_1.logger.error(`Failed to start service: ${serviceName}`, {
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
    async stopService(serviceName) {
        const definition = this.services.get(serviceName);
        if (!definition) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        const status = this.serviceStatuses.get(serviceName);
        if (status.status === 'stopped') {
            return;
        }
        try {
            status.status = 'stopping';
            this.serviceStatuses.set(serviceName, status);
            this.emit('serviceStopping', serviceName);
            const services = serviceDiscovery_1.serviceDiscovery.discoverServices(serviceName);
            for (const service of services) {
                serviceDiscovery_1.serviceDiscovery.deregisterService(serviceName, service.id);
            }
            await this.waitForServiceShutdown(definition);
            status.status = 'stopped';
            status.stoppedAt = new Date();
            this.serviceStatuses.set(serviceName, status);
            loggerService_1.logger.info(`Service stopped: ${serviceName}`, {
                service: 'service-manager',
                metadata: { serviceName }
            });
            this.emit('serviceStopped', serviceName);
        }
        catch (error) {
            loggerService_1.logger.error(`Error stopping service: ${serviceName}`, {
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
    async startAllServices() {
        const startOrder = this.calculateStartupOrder();
        loggerService_1.logger.info('Starting all services', {
            service: 'service-manager',
            metadata: { startOrder }
        });
        for (const serviceName of startOrder) {
            try {
                await this.startService(serviceName);
            }
            catch (error) {
                loggerService_1.logger.error(`Failed to start service in batch: ${serviceName}`, {
                    service: 'service-manager',
                    metadata: { serviceName },
                    error: {
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
                const definition = this.services.get(serviceName);
                if (definition?.tags.includes('critical')) {
                    throw error;
                }
            }
        }
        this.emit('allServicesStarted');
    }
    async stopAllServices() {
        this.isShuttingDown = true;
        const stopOrder = this.calculateShutdownOrder();
        loggerService_1.logger.info('Stopping all services', {
            service: 'service-manager',
            metadata: { stopOrder }
        });
        for (const serviceName of stopOrder) {
            try {
                await this.stopService(serviceName);
            }
            catch (error) {
                loggerService_1.logger.error(`Error stopping service in batch: ${serviceName}`, {
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
    getServiceStatus(serviceName) {
        return this.serviceStatuses.get(serviceName) || null;
    }
    getAllServiceStatuses() {
        return Array.from(this.serviceStatuses.values());
    }
    getStats() {
        const statuses = Array.from(this.serviceStatuses.values());
        const running = statuses.filter(s => s.status === 'running').length;
        const failed = statuses.filter(s => s.status === 'failed').length;
        const serviceStatusesObj = {};
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
    async checkDependencies(definition) {
        const status = this.serviceStatuses.get(definition.name);
        for (const dependency of definition.dependencies) {
            const dependentServices = serviceDiscovery_1.serviceDiscovery.discoverServices(dependency);
            const isAvailable = dependentServices.length > 0;
            status.dependencies[dependency] = isAvailable;
            if (!isAvailable) {
                throw new Error(`Dependency not available: ${dependency}`);
            }
        }
        this.serviceStatuses.set(definition.name, status);
    }
    async waitForServiceHealth(serviceInfo, timeout) {
        const startTime = Date.now();
        const checkInterval = 2000;
        while (Date.now() - startTime < timeout) {
            try {
                const url = `${serviceInfo.protocol}://${serviceInfo.host}:${serviceInfo.port}${serviceInfo.healthEndpoint}`;
                const response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    return;
                }
            }
            catch (error) {
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        throw new Error(`Service health check timeout: ${serviceInfo.name}`);
    }
    async waitForServiceShutdown(definition) {
        const timeout = definition.shutdownTimeout || 30000;
        await new Promise(resolve => setTimeout(resolve, Math.min(timeout, 5000)));
    }
    calculateStartupOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        const visit = (serviceName) => {
            if (visited.has(serviceName))
                return;
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
    calculateShutdownOrder() {
        return this.calculateStartupOrder().reverse();
    }
    setupEventHandlers() {
        healthCheckService_1.healthCheckService.on('healthCheckFailed', (result) => {
            const status = this.serviceStatuses.get(result.service);
            if (status) {
                status.health = 'unhealthy';
                this.serviceStatuses.set(result.service, status);
            }
        });
        healthCheckService_1.healthCheckService.on('healthCheckCompleted', (result) => {
            const status = this.serviceStatuses.get(result.service);
            if (status) {
                status.health = result.status;
                this.serviceStatuses.set(result.service, status);
            }
        });
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown)
                return;
            loggerService_1.logger.info(`Received ${signal}, starting graceful shutdown`, {
                service: 'service-manager'
            });
            try {
                await this.stopAllServices();
                process.exit(0);
            }
            catch (error) {
                loggerService_1.logger.error('Error during graceful shutdown', {
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
        process.on('SIGUSR2', () => shutdown('SIGUSR2'));
    }
}
exports.ServiceManager = ServiceManager;
exports.serviceManager = ServiceManager.getInstance();
//# sourceMappingURL=serviceManager.js.map