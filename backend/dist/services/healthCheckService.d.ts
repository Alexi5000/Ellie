import { EventEmitter } from 'events';
import { ServiceInfo } from './serviceDiscovery';
export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    responseTime: number;
    details: {
        version?: string;
        uptime?: number;
        memory?: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu?: {
            usage: number;
        };
        dependencies?: Record<string, boolean>;
        customMetrics?: Record<string, any>;
    };
    error?: string;
}
export interface SystemHealth {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    services: HealthCheckResult[];
    timestamp: Date;
    summary: {
        total: number;
        healthy: number;
        unhealthy: number;
        degraded: number;
    };
}
export declare class HealthCheckService extends EventEmitter {
    private static instance;
    private healthResults;
    private healthCheckInterval;
    private readonly CHECK_INTERVAL;
    private readonly TIMEOUT;
    private constructor();
    static getInstance(): HealthCheckService;
    checkServiceHealth(service: ServiceInfo): Promise<HealthCheckResult>;
    getServiceHealth(serviceId: string): HealthCheckResult | null;
    getSystemHealth(): SystemHealth;
    getHealthStats(): {
        totalChecks: number;
        averageResponseTime: number;
        successRate: number;
        serviceStats: Record<string, {
            checks: number;
            successes: number;
            failures: number;
            averageResponseTime: number;
        }>;
    };
    private startHealthChecking;
    private performAllHealthChecks;
    private determineHealthStatus;
    stop(): void;
    clearResults(): void;
}
export declare const healthCheckService: HealthCheckService;
//# sourceMappingURL=healthCheckService.d.ts.map