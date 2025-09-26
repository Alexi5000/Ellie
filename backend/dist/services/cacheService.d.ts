export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
}
export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    port?: number;
    language?: string;
}
export declare class CacheService {
    private client;
    private isConnected;
    private stats;
    private readonly AI_RESPONSE_PREFIX;
    private readonly TTS_AUDIO_PREFIX;
    private readonly USER_SESSION_PREFIX;
    private readonly DEFAULT_TTL;
    constructor();
    initializeConnection(): Promise<void>;
    isAvailable(): boolean;
    cacheAIResponse(userInput: string, context: any, response: string, options?: CacheOptions): Promise<boolean>;
    getCachedAIResponse(userInput: string, context: any): Promise<string | null>;
    cacheTTSAudio(text: string, voice: string, speed: number, audioBuffer: Buffer, options?: CacheOptions): Promise<boolean>;
    getCachedTTSAudio(text: string, voice: string, speed: number, language?: string): Promise<Buffer | null>;
    cacheUserSession(sessionId: string, sessionData: any, options?: CacheOptions): Promise<boolean>;
    getCachedUserSession(sessionId: string): Promise<any | null>;
    invalidateByPattern(pattern: string): Promise<number>;
    getCacheStats(): Promise<CacheStats>;
    clearCache(): Promise<boolean>;
    private generateAIResponseKey;
    private generateTTSKey;
    private hashString;
    private hashObject;
    private updateHitRate;
    private compress;
    private decompress;
    disconnect(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cacheService.d.ts.map