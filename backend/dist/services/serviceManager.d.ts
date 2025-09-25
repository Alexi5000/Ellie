import { EventEmitter } from 'events';
import { RouteConfig } from './apiGateway';
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
export declare class ServiceManager extends EventEmitter {
    private static instance;
    private services;
    private serviceStatuses;
    private startupOrder;
    private shutdownOrder;
    private isShuttingDown;
    private constructor();
    static getInstance(): ServiceManager;
    registerService(definition: ServiceDefinition): void;
    startService(serviceName: string): Promise<void>;
    stopService(serviceName: string): Promise<void>;
    startAllServices(): Promise<void>;
    stopAllServices(): Promise<void>;
    getServiceStatus(serviceName: string): ServiceStatus | null;
    getAllServiceStatuses(): ServiceStatus[];
    getStats(): {
        totalServices: number;
        runningServices: number;
        failedServices: number;
        serviceStatuses: Record<string, ServiceStatus>;
    };
    private checkDependencies;
    private waitForServiceHealth;
    private waitForServiceShutdown;
    private calculateStartupOrder;
    private calculateShutdownOrder;
    private setupEventHandlers;
    private setupGracefulShutdown;
}
export declare const serviceManager: ServiceManager;
//# sourceMappingURL=serviceManager.d.ts.map