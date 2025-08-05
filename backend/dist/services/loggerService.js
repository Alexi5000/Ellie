"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LoggerService = exports.LogLevel = void 0;
const uuid_1 = require("uuid");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LoggerService {
    constructor() {
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.testMode = false;
        this.testMode = process.env.NODE_ENV === 'test';
    }
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
    error(message, options = {}) {
        this.log(LogLevel.ERROR, message, options);
    }
    warn(message, options = {}) {
        this.log(LogLevel.WARN, message, options);
    }
    info(message, options = {}) {
        this.log(LogLevel.INFO, message, options);
    }
    debug(message, options = {}) {
        if (process.env.NODE_ENV === 'development') {
            this.log(LogLevel.DEBUG, message, options);
        }
    }
    logRequest(method, url, statusCode, duration, requestId, userId) {
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
    logWebSocketEvent(event, socketId, sessionId, error) {
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
    logExternalApiCall(service, endpoint, duration, success, requestId, error) {
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
    logVoiceProcessing(stage, duration, success, requestId, sessionId, error, metadata) {
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
    logRateLimit(ip, endpoint, requestId, currentCount, limit) {
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
    log(level, message, options = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            requestId: options.requestId || (0, uuid_1.v4)(),
            ...options
        };
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
        this.outputToConsole(logEntry);
        if (process.env.NODE_ENV === 'production') {
            this.sendToExternalLogger(logEntry);
        }
    }
    outputToConsole(entry) {
        if (this.testMode) {
            return;
        }
        const timestamp = entry.timestamp;
        const level = entry.level.toUpperCase().padEnd(5);
        const requestId = entry.requestId ? `[${entry.requestId.slice(0, 8)}]` : '';
        const service = entry.service ? `[${entry.service}]` : '';
        let output = `${timestamp} ${level} ${requestId}${service} ${entry.message}`;
        if (entry.method && entry.url) {
            output += ` - ${entry.method} ${entry.url}`;
            if (entry.statusCode) {
                output += ` - ${entry.statusCode}`;
            }
            if (entry.duration) {
                output += ` - ${entry.duration}ms`;
            }
        }
        if (entry.error) {
            output += `\n  Error: ${entry.error.message}`;
            if (entry.error.code) {
                output += ` (${entry.error.code})`;
            }
            if (entry.error.stack && process.env.NODE_ENV === 'development') {
                output += `\n  Stack: ${entry.error.stack}`;
            }
        }
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
        }
        console.log(output);
    }
    sendToExternalLogger(entry) {
    }
    getRecentLogs(count = 100, level) {
        let logs = this.logBuffer.slice(-count);
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        return logs.reverse();
    }
    getRequestLogs(requestId) {
        return this.logBuffer.filter(log => log.requestId === requestId);
    }
    getErrorStats(timeWindow = 3600000) {
        const cutoff = new Date(Date.now() - timeWindow);
        const errorLogs = this.logBuffer.filter(log => log.level === LogLevel.ERROR && new Date(log.timestamp) > cutoff);
        const stats = {
            total: errorLogs.length,
            byCode: {},
            byService: {}
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
    clearLogs() {
        this.logBuffer = [];
    }
}
exports.LoggerService = LoggerService;
exports.logger = LoggerService.getInstance();
//# sourceMappingURL=loggerService.js.map