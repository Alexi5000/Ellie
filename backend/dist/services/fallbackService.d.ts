export interface FallbackResponse {
    text: string;
    audioUrl?: string;
    confidence: number;
    processingTime: number;
    isFallback: true;
    fallbackReason: string;
}
export interface ServiceStatus {
    isAvailable: boolean;
    lastChecked: Date;
    consecutiveFailures: number;
    averageResponseTime: number;
    errorRate: number;
}
export declare class FallbackService {
    private static instance;
    private serviceStatus;
    private fallbackResponses;
    private circuitBreakerThreshold;
    private circuitBreakerTimeout;
    private logger;
    private constructor();
    static getInstance(): FallbackService;
    static resetInstance(): void;
    private initializeFallbackResponses;
    initializeServiceStatus(): void;
    recordServiceCall(service: string, success: boolean, responseTime: number, error?: Error): void;
    private resetCircuitBreaker;
    isServiceAvailable(service: string): boolean;
    getFallbackForTranscription(error: Error, requestId: string): FallbackResponse;
    getFallbackForAI(userInput: string, error: Error, requestId: string): FallbackResponse;
    getFallbackForTTS(text: string, error: Error, requestId: string): FallbackResponse;
    getContextualFallback(context: 'greeting' | 'inquiry' | 'complex' | 'offtopic' | 'error', requestId: string, additionalInfo?: string): FallbackResponse;
    private getRandomResponse;
    getServiceHealth(): Record<string, ServiceStatus>;
    getFallbackStats(): {
        totalFallbacks: number;
        fallbacksByService: Record<string, number>;
        serviceAvailability: Record<string, boolean>;
        averageResponseTimes: Record<string, number>;
    };
    addCustomFallbackResponses(category: string, responses: string[]): void;
    updateCircuitBreakerSettings(threshold: number, timeout: number): void;
}
export declare const fallbackService: FallbackService;
//# sourceMappingURL=fallbackService.d.ts.map