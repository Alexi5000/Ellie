/**
 * Enhanced logging service with structured logging and request tracking
 * Requirements: 5.4, 5.5
 */

import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from '../types/errors';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
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

export class LoggerService {
  private static instance: LoggerService;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;
  private testMode = false;

  private constructor() {
    // Check if we're in test environment
    this.testMode = process.env.NODE_ENV === 'test';
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Log an error with structured information
   */
  error(message: string, options: Partial<LogEntry> = {}): void {
    this.log(LogLevel.ERROR, message, options);
  }

  /**
   * Log a warning
   */
  warn(message: string, options: Partial<LogEntry> = {}): void {
    this.log(LogLevel.WARN, message, options);
  }

  /**
   * Log informational message
   */
  info(message: string, options: Partial<LogEntry> = {}): void {
    this.log(LogLevel.INFO, message, options);
  }

  /**
   * Log debug information
   */
  debug(message: string, options: Partial<LogEntry> = {}): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, message, options);
    }
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string
  ): void {
    this.log(LogLevel.INFO, `API Request: ${method} ${url}`, {
      requestId,
      userId,
      method,
      url,
      statusCode,
      duration,
      service: 'api'
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(
    event: string,
    socketId: string,
    sessionId?: string,
    error?: Error
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.INFO;
    const message = error ? `WebSocket Error: ${event}` : `WebSocket Event: ${event}`;
    
    this.log(level, message, {
      sessionId,
      service: 'websocket',
      metadata: { socketId, event },
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * Log external API calls
   */
  logExternalApiCall(
    service: string,
    endpoint: string,
    duration: number,
    success: boolean,
    requestId: string,
    error?: Error
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `External API: ${service} ${endpoint} - ${success ? 'Success' : 'Failed'}`;
    
    this.log(level, message, {
      requestId,
      service: `external-${service}`,
      duration,
      metadata: { endpoint, success },
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * Log voice processing events
   */
  logVoiceProcessing(
    stage: 'transcription' | 'ai-response' | 'tts',
    duration: number,
    success: boolean,
    requestId: string,
    sessionId?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Voice Processing: ${stage} - ${success ? 'Success' : 'Failed'}`;
    
    this.log(level, message, {
      requestId,
      sessionId,
      service: 'voice-processing',
      duration,
      metadata: { stage, success, ...metadata },
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(
    ip: string,
    endpoint: string,
    requestId: string,
    currentCount: number,
    limit: number
  ): void {
    this.log(LogLevel.WARN, `Rate limit approached: ${endpoint}`, {
      requestId,
      service: 'rate-limiter',
      metadata: {
        ip,
        endpoint,
        currentCount,
        limit,
        percentage: Math.round((currentCount / limit) * 100)
      }
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, options: Partial<LogEntry> = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: options.requestId || uuidv4(),
      ...options
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    
    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Output to console with formatting
    this.outputToConsole(logEntry);

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry);
    }
  }

  /**
   * Format and output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    // Skip console output in test mode to prevent logging after test completion
    if (this.testMode) {
      return;
    }

    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const requestId = entry.requestId ? `[${entry.requestId.slice(0, 8)}]` : '';
    const service = entry.service ? `[${entry.service}]` : '';
    
    let output = `${timestamp} ${level} ${requestId}${service} ${entry.message}`;
    
    // Add additional context for API requests
    if (entry.method && entry.url) {
      output += ` - ${entry.method} ${entry.url}`;
      if (entry.statusCode) {
        output += ` - ${entry.statusCode}`;
      }
      if (entry.duration) {
        output += ` - ${entry.duration}ms`;
      }
    }

    // Add error details
    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.code) {
        output += ` (${entry.error.code})`;
      }
      if (entry.error.stack && process.env.NODE_ENV === 'development') {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    // Add metadata
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    console.log(output);
  }

  /**
   * Send log entry to external logging service (placeholder)
   */
  private sendToExternalLogger(entry: LogEntry): void {
    // In a real implementation, you might send to services like:
    // - Winston with external transports
    // - Elasticsearch
    // - CloudWatch
    // - Datadog
    // - Sentry (for errors)
    
    // For now, just store in memory buffer
    // This could be enhanced to batch send to external services
  }

  /**
   * Get recent log entries (for debugging/monitoring)
   */
  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let logs = this.logBuffer.slice(-count);
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs.reverse(); // Most recent first
  }

  /**
   * Get logs for a specific request
   */
  getRequestLogs(requestId: string): LogEntry[] {
    return this.logBuffer.filter(log => log.requestId === requestId);
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 3600000): { // Default 1 hour
    total: number;
    byCode: Record<string, number>;
    byService: Record<string, number>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const errorLogs = this.logBuffer.filter(
      log => log.level === LogLevel.ERROR && new Date(log.timestamp) > cutoff
    );

    const stats = {
      total: errorLogs.length,
      byCode: {} as Record<string, number>,
      byService: {} as Record<string, number>
    };

    errorLogs.forEach(log => {
      if (log.error?.code) {
        stats.byCode[log.error.code] = (stats.byCode[log.error.code] || 0) + 1;
      }
      if (log.service) {
        stats.byService[log.service] = (stats.byService[log.service] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear log buffer (for testing)
   */
  clearLogs(): void {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();