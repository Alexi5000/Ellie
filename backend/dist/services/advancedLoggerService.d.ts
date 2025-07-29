export interface LogAggregation {
    timeWindow: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    service: string;
    count: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    samples: Array<{
        timestamp: Date;
        message: string;
        metadata?: any;
    }>;
}
export interface LogPattern {
    pattern: RegExp;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action?: string;
}
export interface LogAlert {
    id: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    timeWindow: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    status: 'active' | 'resolved';
    message: string;
}
export interface LogMetrics {
    totalLogs: number;
    logsByLevel: {
        [level: string]: number;
    };
    logsByService: {
        [service: string]: number;
    };
    errorRate: number;
    topErrors: Array<{
        message: string;
        count: number;
        service: string;
    }>;
    recentAlerts: LogAlert[];
    aggregations: LogAggregation[];
}
export declare class AdvancedLoggerService {
    private logBuffer;
    private aggregations;
    private alerts;
    private patterns;
    private readonly MAX_BUFFER_SIZE;
    private readonly AGGREGATION_INTERVALS;
    constructor();
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, service: string, metadata?: any, requestId?: string): void;
    getLogMetrics(timeWindow?: number): LogMetrics;
    searchLogs(filters: {
        level?: string;
        service?: string;
        message?: string;
        timeWindow?: number;
        limit?: number;
    }): Array<{
        timestamp: Date;
        level: string;
        service: string;
        message: string;
        metadata?: any;
        requestId?: string;
    }>;
    getAggregations(timeWindow?: string, service?: string, level?: string): LogAggregation[];
    getActiveAlerts(): LogAlert[];
    resolveAlert(alertId: string): boolean;
    addPattern(pattern: LogPattern): void;
    exportLogs(format?: 'json' | 'csv' | 'txt', filters?: {
        level?: string;
        service?: string;
        timeWindow?: number;
    }): string;
    private initializePatterns;
    private checkPatterns;
    private createOrUpdateAlert;
    private processAggregations;
    private cacheLogEntry;
    private sendToExternalLogAggregation;
    private sendToElasticsearch;
    private sendToLogstash;
    private sendToCloudWatch;
    private sendToStackdriver;
    private sendToSplunk;
    private parseTimeWindow;
    private generateAlertId;
    private cleanup;
    getServiceStats(): {
        logBufferSize: number;
        aggregationsCount: number;
        alertsCount: number;
        activeAlertsCount: number;
        patternsCount: number;
        memoryUsage: number;
    };
}
export declare const advancedLoggerService: AdvancedLoggerService;
//# sourceMappingURL=advancedLoggerService.d.ts.map