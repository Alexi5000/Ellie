"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apmService = exports.APMService = void 0;
const loggerService_1 = require("./loggerService");
const analyticsService_1 = require("./analyticsService");
class APMService {
    constructor() {
        this.activeTransactions = new Map();
        this.completedTransactions = [];
        this.activeSpans = new Map();
        this.errors = [];
        this.MAX_COMPLETED_TRANSACTIONS = 1000;
        this.MAX_ERRORS = 500;
        this.externalApmEnabled = false;
        this.externalApmProvider = null;
        this.externalApmClient = null;
        setInterval(() => {
            this.cleanup();
        }, 300000);
        this.initializeExternalApm();
        loggerService_1.logger.info('APM Service initialized', {
            service: 'apm',
            metadata: {
                maxTransactions: this.MAX_COMPLETED_TRANSACTIONS,
                maxErrors: this.MAX_ERRORS,
                externalApmEnabled: this.externalApmEnabled,
                externalApmProvider: this.externalApmProvider
            }
        });
    }
    initializeExternalApm() {
        try {
            const apmProvider = process.env.APM_PROVIDER?.toLowerCase();
            if (!apmProvider) {
                return;
            }
            this.externalApmProvider = apmProvider;
            switch (apmProvider) {
                case 'elastic':
                    this.initializeElasticApm();
                    break;
                case 'newrelic':
                    this.initializeNewRelic();
                    break;
                case 'datadog':
                    this.initializeDatadog();
                    break;
                case 'dynatrace':
                    this.initializeDynatrace();
                    break;
                default:
                    loggerService_1.logger.warn(`Unsupported APM provider: ${apmProvider}`, {
                        service: 'apm'
                    });
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize external APM provider', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
        }
    }
    initializeElasticApm() {
        try {
            try {
                this.externalApmEnabled = true;
                loggerService_1.logger.info('Elastic APM initialized', {
                    service: 'apm',
                    metadata: {
                        serverUrl: process.env.APM_SERVER_URL,
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
            }
            catch (e) {
                loggerService_1.logger.warn('Elastic APM module not found, continuing without external APM', {
                    service: 'apm'
                });
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize Elastic APM', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    initializeNewRelic() {
        try {
            try {
                this.externalApmEnabled = true;
                loggerService_1.logger.info('New Relic APM initialized', {
                    service: 'apm',
                    metadata: {
                        appName: process.env.NEW_RELIC_APP_NAME,
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
            }
            catch (e) {
                loggerService_1.logger.warn('New Relic module not found, continuing without external APM', {
                    service: 'apm'
                });
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize New Relic APM', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    initializeDatadog() {
        try {
            try {
                this.externalApmEnabled = true;
                loggerService_1.logger.info('Datadog APM initialized', {
                    service: 'apm',
                    metadata: {
                        serviceName: process.env.APM_SERVICE_NAME || 'ellie-voice-receptionist',
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
            }
            catch (e) {
                loggerService_1.logger.warn('Datadog module not found, continuing without external APM', {
                    service: 'apm'
                });
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize Datadog APM', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    initializeDynatrace() {
        try {
            this.externalApmEnabled = !!process.env.DT_TENANT && !!process.env.DT_API_TOKEN;
            if (this.externalApmEnabled) {
                loggerService_1.logger.info('Dynatrace APM initialized', {
                    service: 'apm',
                    metadata: {
                        tenant: process.env.DT_TENANT ? '(configured)' : '(not configured)',
                        environment: process.env.NODE_ENV || 'development'
                    }
                });
            }
            else {
                loggerService_1.logger.warn('Dynatrace configuration not found, continuing without external APM', {
                    service: 'apm'
                });
            }
        }
        catch (error) {
            loggerService_1.logger.error('Failed to initialize Dynatrace APM', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    startTransaction(name, type = 'request', metadata = {}) {
        const transactionId = this.generateId();
        const transaction = {
            id: transactionId,
            name,
            type,
            startTime: Date.now(),
            status: 'running',
            metadata,
            spans: []
        };
        this.activeTransactions.set(transactionId, transaction);
        if (this.externalApmEnabled && this.externalApmClient) {
            this.startExternalTransaction(transactionId, name, type, metadata);
        }
        loggerService_1.logger.debug('APM transaction started', {
            service: 'apm',
            metadata: {
                transactionId,
                name,
                type
            }
        });
        return transactionId;
    }
    endTransaction(transactionId, status = 'completed') {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) {
            loggerService_1.logger.warn('Attempted to end non-existent transaction', {
                service: 'apm',
                metadata: { transactionId }
            });
            return;
        }
        transaction.endTime = Date.now();
        transaction.duration = transaction.endTime - transaction.startTime;
        transaction.status = status;
        this.completedTransactions.push(transaction);
        this.activeTransactions.delete(transactionId);
        if (this.completedTransactions.length > this.MAX_COMPLETED_TRANSACTIONS) {
            this.completedTransactions = this.completedTransactions.slice(-this.MAX_COMPLETED_TRANSACTIONS);
        }
        if (this.externalApmEnabled && this.externalApmClient) {
            this.endExternalTransaction(transactionId, transaction, status);
        }
        analyticsService_1.analyticsService.trackPerformance('transaction_duration', transaction.duration, {
            transactionName: transaction.name,
            transactionType: transaction.type,
            status
        });
        loggerService_1.logger.debug('APM transaction ended', {
            service: 'apm',
            metadata: {
                transactionId,
                duration: transaction.duration,
                status
            }
        });
    }
    startExternalTransaction(transactionId, name, type, metadata) {
        try {
            if (!this.externalApmProvider)
                return;
            switch (this.externalApmProvider) {
                case 'elastic':
                    break;
                case 'newrelic':
                    break;
                case 'datadog':
                    break;
            }
        }
        catch (error) {
            loggerService_1.logger.warn('Failed to start external APM transaction', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    endExternalTransaction(transactionId, transaction, status) {
        try {
            if (!this.externalApmProvider)
                return;
            switch (this.externalApmProvider) {
                case 'elastic':
                    break;
                case 'newrelic':
                    break;
                case 'datadog':
                    break;
            }
        }
        catch (error) {
            loggerService_1.logger.warn('Failed to end external APM transaction', {
                service: 'apm',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    }
    startSpan(transactionId, name, type, metadata = {}) {
        const spanId = this.generateId();
        const span = {
            id: spanId,
            transactionId,
            name,
            type,
            startTime: Date.now(),
            status: 'running',
            metadata
        };
        this.activeSpans.set(spanId, span);
        const transaction = this.activeTransactions.get(transactionId);
        if (transaction) {
            transaction.spans.push(span);
        }
        loggerService_1.logger.debug('APM span started', {
            service: 'apm',
            metadata: {
                spanId,
                transactionId,
                name,
                type
            }
        });
        return spanId;
    }
    endSpan(spanId, status = 'completed') {
        const span = this.activeSpans.get(spanId);
        if (!span) {
            loggerService_1.logger.warn('Attempted to end non-existent span', {
                service: 'apm',
                metadata: { spanId }
            });
            return;
        }
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.status = status;
        this.activeSpans.delete(spanId);
        analyticsService_1.analyticsService.trackPerformance(`${span.type}_span_duration`, span.duration, {
            spanName: span.name,
            transactionId: span.transactionId
        });
        loggerService_1.logger.debug('APM span ended', {
            service: 'apm',
            metadata: {
                spanId,
                duration: span.duration,
                status
            }
        });
    }
    recordError(error, transactionId, metadata = {}) {
        const errorEntry = {
            timestamp: new Date(),
            error: error instanceof Error ? error.message : error,
            transaction: transactionId || 'unknown',
            stack: error instanceof Error ? error.stack : undefined,
            ...metadata
        };
        this.errors.push(errorEntry);
        if (this.errors.length > this.MAX_ERRORS) {
            this.errors = this.errors.slice(-this.MAX_ERRORS);
        }
        if (this.externalApmEnabled && this.externalApmClient) {
            this.recordExternalError(error, transactionId, metadata);
        }
        analyticsService_1.analyticsService.trackEvent({
            eventType: 'error',
            sessionId: transactionId || 'system',
            timestamp: errorEntry.timestamp,
            metadata: {
                error: errorEntry.error,
                stack: errorEntry.stack,
                ...metadata
            }
        });
        loggerService_1.logger.error('APM error recorded', {
            service: 'apm',
            error: {
                message: errorEntry.error,
                stack: errorEntry.stack
            },
            metadata: {
                transactionId,
                ...metadata
            }
        });
    }
    recordExternalError(error, transactionId, metadata = {}) {
        try {
            if (!this.externalApmProvider)
                return;
            const errorObj = error instanceof Error ? error : new Error(error);
            switch (this.externalApmProvider) {
                case 'elastic':
                    break;
                case 'newrelic':
                    break;
                case 'datadog':
                    break;
            }
        }
        catch (externalError) {
            loggerService_1.logger.warn('Failed to record error in external APM', {
                service: 'apm',
                error: {
                    message: externalError instanceof Error ? externalError.message : 'Unknown error'
                }
            });
        }
    }
    getMetrics(timeWindow = 3600000) {
        const cutoffTime = Date.now() - timeWindow;
        const recentTransactions = this.completedTransactions.filter(t => t.startTime >= cutoffTime);
        const recentErrors = this.errors.filter(e => e.timestamp.getTime() >= cutoffTime);
        const successful = recentTransactions.filter(t => t.status === 'completed');
        const failed = recentTransactions.filter(t => t.status === 'failed');
        const durations = recentTransactions.map(t => t.duration).filter(d => d !== undefined);
        const averageDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const sortedDurations = durations.sort((a, b) => a - b);
        const p95Duration = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
        const p99Duration = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0;
        const allSpans = recentTransactions.flatMap(t => t.spans);
        const spansByType = {};
        allSpans.forEach(span => {
            if (!spansByType[span.type]) {
                spansByType[span.type] = { count: 0, averageDuration: 0 };
            }
            spansByType[span.type].count++;
            if (span.duration) {
                spansByType[span.type].averageDuration += span.duration;
            }
        });
        Object.keys(spansByType).forEach(type => {
            if (spansByType[type].count > 0) {
                spansByType[type].averageDuration /= spansByType[type].count;
            }
        });
        const slowestSpans = allSpans
            .filter(span => span.duration !== undefined)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0))
            .slice(0, 10);
        const errorsByType = {};
        recentErrors.forEach(error => {
            const errorType = this.categorizeError(error.error);
            errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        });
        const timeWindowSeconds = timeWindow / 1000;
        const requestsPerSecond = recentTransactions.length / timeWindowSeconds;
        const requestsPerMinute = requestsPerSecond * 60;
        return {
            transactions: {
                total: recentTransactions.length,
                successful: successful.length,
                failed: failed.length,
                averageDuration,
                p95Duration,
                p99Duration
            },
            spans: {
                byType: spansByType,
                slowest: slowestSpans
            },
            errors: {
                total: recentErrors.length,
                byType: errorsByType,
                recent: recentErrors.slice(-10).map(e => ({
                    timestamp: e.timestamp,
                    error: e.error,
                    transaction: e.transaction
                }))
            },
            throughput: {
                requestsPerSecond,
                requestsPerMinute
            }
        };
    }
    getActiveOperations() {
        return {
            transactions: Array.from(this.activeTransactions.values()),
            spans: Array.from(this.activeSpans.values())
        };
    }
    getTransaction(transactionId) {
        return this.activeTransactions.get(transactionId) ||
            this.completedTransactions.find(t => t.id === transactionId) ||
            null;
    }
    createExpressMiddleware() {
        return (req, res, next) => {
            const transactionId = this.startTransaction(`${req.method} ${req.path}`, 'request', {
                method: req.method,
                path: req.path,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            req.apmTransactionId = transactionId;
            const originalEnd = res.end;
            res.end = function (chunk, encoding) {
                const status = res.statusCode >= 400 ? 'failed' : 'completed';
                exports.apmService.endTransaction(transactionId, status);
                return originalEnd.call(this, chunk, encoding);
            };
            next();
        };
    }
    wrapAsync(name, fn, type = 'custom') {
        return (async (...args) => {
            const transactionId = this.getCurrentTransactionId();
            const spanId = this.startSpan(transactionId !== null ? transactionId : 'background', name, type);
            try {
                const result = await fn(...args);
                this.endSpan(spanId, 'completed');
                return result;
            }
            catch (error) {
                this.endSpan(spanId, 'failed');
                this.recordError(error instanceof Error ? error : new Error(String(error)), transactionId || undefined);
                throw error;
            }
        });
    }
    generateId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
    getCurrentTransactionId() {
        return null;
    }
    categorizeError(errorMessage) {
        if (errorMessage.includes('timeout'))
            return 'timeout';
        if (errorMessage.includes('rate limit'))
            return 'rate_limit';
        if (errorMessage.includes('validation'))
            return 'validation';
        if (errorMessage.includes('authentication'))
            return 'auth';
        if (errorMessage.includes('network'))
            return 'network';
        if (errorMessage.includes('database'))
            return 'database';
        return 'unknown';
    }
    cleanup() {
        const cutoffTime = Date.now() - 86400000;
        this.completedTransactions = this.completedTransactions.filter(t => t.startTime >= cutoffTime);
        this.errors = this.errors.filter(e => e.timestamp.getTime() >= cutoffTime);
        const staleTransactionCutoff = Date.now() - 3600000;
        for (const [id, transaction] of this.activeTransactions.entries()) {
            if (transaction.startTime < staleTransactionCutoff) {
                this.endTransaction(id, 'failed');
                loggerService_1.logger.warn('Cleaned up stale transaction', {
                    service: 'apm',
                    metadata: { transactionId: id, name: transaction.name }
                });
            }
        }
        for (const [id, span] of this.activeSpans.entries()) {
            if (span.startTime < staleTransactionCutoff) {
                this.endSpan(id, 'failed');
                loggerService_1.logger.warn('Cleaned up stale span', {
                    service: 'apm',
                    metadata: { spanId: id, name: span.name }
                });
            }
        }
        loggerService_1.logger.debug('APM cleanup completed', {
            service: 'apm',
            metadata: {
                completedTransactions: this.completedTransactions.length,
                activeTransactions: this.activeTransactions.size,
                errors: this.errors.length
            }
        });
    }
    getServiceStats() {
        const memoryUsage = Math.round((JSON.stringify(Array.from(this.activeTransactions.values())).length +
            JSON.stringify(this.completedTransactions).length +
            JSON.stringify(Array.from(this.activeSpans.values())).length +
            JSON.stringify(this.errors).length) / 1024);
        return {
            activeTransactions: this.activeTransactions.size,
            completedTransactions: this.completedTransactions.length,
            activeSpans: this.activeSpans.size,
            totalErrors: this.errors.length,
            memoryUsage
        };
    }
}
exports.APMService = APMService;
exports.apmService = new APMService();
//# sourceMappingURL=apmService.js.map