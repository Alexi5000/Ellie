export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    poolSize: number;
    connectionTimeout: number;
    idleTimeout: number;
}
export interface ConnectionPoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    averageResponseTime: number;
}
export declare class DatabaseService {
    private config;
    private pool;
    private isConnected;
    private stats;
    constructor();
    initializePool(): Promise<boolean>;
    private startConnectionMonitoring;
    query(sql: string, params?: any[]): Promise<any>;
    getConnection(): Promise<any>;
    transaction(callback: (client: any) => Promise<any>): Promise<any>;
    isAvailable(): boolean;
    getPoolStats(): ConnectionPoolStats;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        error?: string;
    }>;
    close(): Promise<void>;
    private updateAverageResponseTime;
    getConfig(): Omit<DatabaseConfig, 'password'>;
}
export declare const databaseService: DatabaseService;
//# sourceMappingURL=databaseService.d.ts.map