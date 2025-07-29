import { Request, Response, NextFunction } from 'express';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    queueSize?: number;
    queueTimeoutMs?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    onLimitReached?: (req: Request, res: Response) => void;
}
export declare class RateLimitService {
    private static instance;
    private limitStore;
    private cleanupInterval;
    private constructor();
    static getInstance(): RateLimitService;
    createLimiter(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => void;
    private handleLimitExceeded;
    private removeFromQueue;
    private processQueue;
    getRateLimitStatus(key: string): {
        count: number;
        remaining: number;
        resetTime: number;
        queueLength: number;
    } | null;
    createVoiceRateLimiter(): (req: Request, res: Response, next: NextFunction) => void;
    createApiRateLimiter(): (req: Request, res: Response, next: NextFunction) => void;
    private cleanup;
    getStats(): {
        totalKeys: number;
        totalQueuedRequests: number;
        averageQueueLength: number;
        topLimitedIPs: Array<{
            ip: string;
            count: number;
            queueLength: number;
        }>;
    };
    destroy(): void;
}
export declare const rateLimitService: RateLimitService;
export {};
//# sourceMappingURL=rateLimitService.d.ts.map