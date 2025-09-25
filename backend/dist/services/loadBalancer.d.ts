import { ServiceInfo } from './serviceDiscovery';
export declare enum LoadBalancingStrategy {
    ROUND_ROBIN = "round_robin",
    LEAST_CONNECTIONS = "least_connections",
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin",
    RANDOM = "random",
    HEALTH_BASED = "health_based"
}
interface ServiceMetrics {
    activeConnections: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    lastRequestTime: Date;
    weight: number;
}
export declare class LoadBalancer {
    private static instance;
    private serviceMetrics;
    private roundRobinCounters;
    private strategy;
    private constructor();
    static getInstance(): LoadBalancer;
    setStrategy(strategy: LoadBalancingStrategy): void;
    getServiceInstance(serviceName: string, tags?: string[]): ServiceInfo | null;
    recordRequest(serviceId: string, responseTime: number, success: boolean): void;
    recordConnectionStart(serviceId: string): void;
    recordConnectionEnd(serviceId: string): void;
    getServiceMetrics(serviceId: string): ServiceMetrics | null;
    getStats(): {
        strategy: LoadBalancingStrategy;
        totalServices: number;
        totalRequests: number;
        averageResponseTime: number;
        serviceMetrics: Record<string, ServiceMetrics>;
    };
    private roundRobinSelection;
    private leastConnectionsSelection;
    private weightedRoundRobinSelection;
    private randomSelection;
    private healthBasedSelection;
    private calculateHealthScore;
    private initializeServiceMetrics;
    private removeServiceMetrics;
}
export declare const loadBalancer: LoadBalancer;
export {};
//# sourceMappingURL=loadBalancer.d.ts.map