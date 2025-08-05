import { ErrorCode } from '../types/errors';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    requestId?: string;
    userId?: string;
    sessionId?: string;
    service?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    error?: {
        code?: ErrorCode;
        message: string;
        stack?: string;
        details?: any;
    };
    metadata?: Record<string, any>;
}
export declare class LoggerService {
    private static instance;
    private logBuffer;
    private readonly maxBufferSize;
    private testMode;
    private constructor();
    static getInstance(): LoggerService;
    error(message: string, options?: Partial<LogEntry>): void;
    warn(message: string, options?: Partial<LogEntry>): void;
    info(message: string, options?: Partial<LogEntry>): void;
    debug(message: string, options?: Partial<LogEntry>): void;
    logRequest(method: string, url: string, statusCode: number, duration: number, requestId: string, userId?: string): void;
    logWebSocketEvent(event: string, socketId: string, sessionId?: string, error?: Error): void;
    logExternalApiCall(service: string, endpoint: string, duration: number, success: boolean, requestId: string, error?: Error): void;
    logVoiceProcessing(stage: 'transcription' | 'ai-response' | 'tts', duration: number, success: boolean, requestId: string, sessionId?: string, error?: Error, metadata?: Record<string, any>): void;
    logRateLimit(ip: string, endpoint: string, requestId: string, currentCount: number, limit: number): void;
    private log;
    private outputToConsole;
    private sendToExternalLogger;
    getRecentLogs(count?: number, level?: LogLevel): LogEntry[];
    getRequestLogs(requestId: string): LogEntry[];
    getErrorStats(timeWindow?: number): {
        total: number;
        byCode: Record<string, number>;
        byService: Record<string, number>;
    };
    clearLogs(): void;
}
export declare const logger: LoggerService;
//# sourceMappingURL=loggerService.d.ts.map