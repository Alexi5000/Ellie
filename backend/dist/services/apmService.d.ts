export interface APMTransaction {
    id: string;
    name: string;
    type: 'request' | 'background' | 'websocket';
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'running' | 'completed' | 'failed';
    metadata: {
        [key: string]: any;
    };
    spans: APMSpan[];
}
export interface APMSpan {
    id: string;
    transactionId: string;
    name: string;
    type: 'db' | 'http' | 'cache' | 'ai' | 'custom';
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'running' | 'completed' | 'failed';
    metadata: {
        [key: string]: any;
    };
}
export interface APMMetrics {
    transactions: {
        total: number;
        successful: number;
        failed: number;
        averageDuration: number;
        p95Duration: number;
        p99Duration: number;
    };
    spans: {
        byType: {
            [type: string]: {
                count: number;
                averageDuration: number;
            };
        };
        slowest: APMSpan[];
    };
    errors: {
        total: number;
        byType: {
            [type: string]: number;
        };
        recent: Array<{
            timestamp: Date;
            error: string;
            transaction: string;
        }>;
    };
    throughput: {
        requestsPerSecond: number;
        requestsPerMinute: number;
    };
}
export declare class APMService {
    private activeTransactions;
    private completedTransactions;
    private activeSpans;
    private errors;
    private readonly MAX_COMPLETED_TRANSACTIONS;
    private readonly MAX_ERRORS;
    private externalApmEnabled;
    private externalApmProvider;
    private externalApmClient;
    constructor();
    private initializeExternalApm;
    private initializeElasticApm;
    private initializeNewRelic;
    private initializeDatadog;
    private initializeDynatrace;
    startTransaction(name: string, type?: 'request' | 'background' | 'websocket', metadata?: any): string;
    endTransaction(transactionId: string, status?: 'completed' | 'failed'): void;
    private startExternalTransaction;
    private endExternalTransaction;
    startSpan(transactionId: string, name: string, type: 'db' | 'http' | 'cache' | 'ai' | 'custom', metadata?: any): string;
    endSpan(spanId: string, status?: 'completed' | 'failed'): void;
    recordError(error: Error | string, transactionId?: string, metadata?: any): void;
    private recordExternalError;
    getMetrics(timeWindow?: number): APMMetrics;
    getActiveOperations(): {
        transactions: APMTransaction[];
        spans: APMSpan[];
    };
    getTransaction(transactionId: string): APMTransaction | null;
    createExpressMiddleware(): (req: any, res: any, next: any) => void;
    wrapAsync<T extends (...args: any[]) => Promise<any>>(name: string, fn: T, type?: 'db' | 'http' | 'cache' | 'ai' | 'custom'): T;
    private generateId;
    private getCurrentTransactionId;
    private categorizeError;
    private cleanup;
    getServiceStats(): {
        activeTransactions: number;
        completedTransactions: number;
        activeSpans: number;
        totalErrors: number;
        memoryUsage: number;
    };
}
export declare const apmService: APMService;
//# sourceMappingURL=apmService.d.ts.map