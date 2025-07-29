export interface UserInteractionEvent {
    eventType: 'voice_input' | 'ai_response' | 'tts_output' | 'error' | 'session_start' | 'session_end';
    sessionId: string;
    userId?: string;
    timestamp: Date;
    duration?: number;
    metadata: {
        [key: string]: any;
    };
}
export interface UsageMetrics {
    totalSessions: number;
    totalInteractions: number;
    averageSessionDuration: number;
    averageResponseTime: number;
    errorRate: number;
    popularFeatures: Array<{
        feature: string;
        count: number;
    }>;
    peakUsageHours: Array<{
        hour: number;
        count: number;
    }>;
    userRetention: {
        daily: number;
        weekly: number;
        monthly: number;
    };
}
export interface PerformanceMetrics {
    apiResponseTimes: {
        openai: {
            average: number;
            p95: number;
            p99: number;
        };
        groq: {
            average: number;
            p95: number;
            p99: number;
        };
        tts: {
            average: number;
            p95: number;
            p99: number;
        };
    };
    cacheHitRates: {
        aiResponses: number;
        ttsAudio: number;
        userSessions: number;
    };
    systemMetrics: {
        memoryUsage: number;
        cpuUsage: number;
        activeConnections: number;
    };
}
export interface BusinessMetrics {
    conversionRate: number;
    consultationRequests: number;
    legalTopicDistribution: Array<{
        topic: string;
        percentage: number;
    }>;
    userSatisfactionScore: number;
    averageConversationLength: number;
}
export declare class AnalyticsService {
    private events;
    private performanceData;
    private readonly MAX_EVENTS;
    private readonly MAX_PERFORMANCE_DATA;
    constructor();
    trackEvent(event: UserInteractionEvent): void;
    trackPerformance(metric: string, value: number, metadata?: any): void;
    getUsageMetrics(timeWindow?: number): UsageMetrics;
    getPerformanceMetrics(timeWindow?: number): Promise<PerformanceMetrics>;
    getBusinessMetrics(timeWindow?: number): BusinessMetrics;
    getDashboardData(timeWindow?: number): Promise<{
        usage: UsageMetrics;
        performance: PerformanceMetrics;
        business: BusinessMetrics;
        realTimeStats: {
            activeUsers: number;
            requestsPerMinute: number;
            errorRate: number;
            averageResponseTime: number;
        };
    }>;
    exportData(format?: 'json' | 'csv', timeWindow?: number): string;
    private cacheEvent;
    private sendToExternalAnalytics;
    private sendToGoogleAnalytics;
    private sendToMixpanel;
    private sendToSegment;
    private sendToAmplitude;
    private calculateUserRetention;
    private calculatePercentiles;
    private cleanupOldData;
    private aggregateMetrics;
    getServiceStats(): {
        eventsCount: number;
        performanceDataCount: number;
        memoryUsage: number;
        oldestEvent?: Date;
        newestEvent?: Date;
    };
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analyticsService.d.ts.map