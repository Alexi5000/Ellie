import { EventEmitter } from 'events';
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
export declare class ServiceDiscovery extends EventEmitter {
    private static instance;
    private registry;
    private healthCheckInterval;
    private readonly HEALTH_CHECK_INTERVAL;
    private readonly HEALTH_TIMEOUT;
    private readonly MAX_RETRIES;
    private constructor();
    static getInstance(): ServiceDiscovery;
    registerService(serviceInfo: Omit<ServiceInfo, 'registeredAt' | 'lastHealthCheck' | 'status'>): Promise<void>;
    deregisterService(serviceName: string, serviceId: string): void;
    discoverServices(serviceName: string, tags?: string[]): ServiceInfo[];
    getServiceInstance(serviceName: string, tags?: string[]): ServiceInfo | null;
    getAllServices(): ServiceRegistry;
    getServiceHealth(serviceName: string): {
        healthy: number;
        unhealthy: number;
        total: number;
    };
    checkDependencies(serviceName: string): {
        [dependency: string]: boolean;
    };
    private startHealthChecking;
    private performHealthChecks;
    private checkServiceHealth;
    stop(): void;
    getStats(): {
        totalServices: number;
        healthyServices: number;
        unhealthyServices: number;
        servicesByType: Record<string, number>;
    };
}
export declare const serviceDiscovery: ServiceDiscovery;
//# sourceMappingURL=serviceDiscovery.d.ts.map