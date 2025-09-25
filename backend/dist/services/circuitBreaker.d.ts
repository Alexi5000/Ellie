import { EventEmitter } from 'events';
export declare enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    successThreshold: number;
    timeout: number;
    monitoringPeriod: number;
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: Date | null;
    lastSuccessTime: Date | null;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
}
export declare class CircuitBreaker extends EventEmitter {
    private serviceName;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private lastSuccessTime;
    private totalRequests;
    private totalFailures;
    private totalSuccesses;
    private nextAttempt;
    private config;
    constructor(serviceName: string, config?: Partial<CircuitBreakerConfig>);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private executeWithTimeout;
    private onSuccess;
    private onFailure;
    getStats(): CircuitBreakerStats;
    getState(): CircuitState;
    canExecute(): boolean;
    reset(): void;
    updateConfig(newConfig: Partial<CircuitBreakerConfig>): void;
}
export declare class CircuitBreakerManager {
    private static instance;
    private circuitBreakers;
    private constructor();
    static getInstance(): CircuitBreakerManager;
    getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
    execute<T>(serviceName: string, fn: () => Promise<T>, config?: Partial<CircuitBreakerConfig>): Promise<T>;
    getAllStats(): Record<string, CircuitBreakerStats>;
    resetAll(): void;
    removeCircuitBreaker(serviceName: string): void;
}
export declare const circuitBreakerManager: CircuitBreakerManager;
//# sourceMappingURL=circuitBreaker.d.ts.map