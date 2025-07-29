"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedLoggerService = exports.AdvancedLoggerService = void 0;
const loggerService_1 = require("./loggerService");
const cacheService_1 = require("./cacheService");
class AdvancedLoggerService {
    constructor() {
        this.logBuffer = [];
        this.aggregations = new Map();
        this.alerts = new Map();
        this.patterns = [];
        this.MAX_BUFFER_SIZE = 5000;
        this.AGGREGATION_INTERVALS = ['1m', '5m', '1h', '1d'];
        this.initializePatterns();
        setInterval(() => {
            this.processAggregations();
        }, 60000);
        setInterval(() => {
            this.cleanup();
        }, 300000);
        loggerService_1.logger.info('Advanced Logger Service initialized', {
            service: 'advanced-logger',
            metadata: {
                maxBufferSize: this.MAX_BUFFER_SIZE,
                patternsCount: this.patterns.length
            }
        });
    }
    log(level, message, service, metadata, requestId) {
        const logEntry = {
            timestamp: new Date(),
            level,
            service,
            message,
            metadata,
            requestId
        };
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
        }
        this.checkPatterns(logEntry);
        this.cacheLogEntry(logEntry);
        switch (level) {
            case 'debug':
                loggerService_1.logger.debug(message, { service, requestId, metadata });
                break;
            case 'info':
                loggerService_1.logger.info(message, { service, requestId, metadata });
                break;
            case 'warn':
                loggerService_1.logger.warn(message, { service, requestId, metadata });
                break;
            case 'error':
                loggerService_1.logger.error(message, { service, requestId, metadata });
                break;
            default:
                loggerService_1.logger.info(message, { service, requestId, metadata });
        }
    }
    getLogMetrics(timeWindow = 3600000) {
        const cutoffTime = new Date(Date.now() - timeWindow);
        const recentLogs = this.logBuffer.filter(log => log.timestamp >= cutoffTime);
        const logsByLevel = {};
        recentLogs.forEach(log => {
            logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
        });
        const logsByService = {};
        recentLogs.forEach(log => {
            logsByService[log.service] = (logsByService[log.service] || 0) + 1;
        });
        const totalLogs = recentLogs.length;
        const errorLogs = recentLogs.filter(log => log.level === 'error').length;
        const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
        const errorCounts = {};
        recentLogs
            .filter(log => log.level === 'error')
            .forEach(log => {
            const key = log.message.substring(0, 100);
            if (!errorCounts[key]) {
                errorCounts[key] = { count: 0, service: log.service };
            }
            errorCounts[key].count++;
        });
        const topErrors = Object.entries(errorCounts)
            .map(([message, data]) => ({ message, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const recentAlerts = Array.from(this.alerts.values())
            .filter(alert => alert.lastOccurrence >= cutoffTime)
            .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
            .slice(0, 20);
        const recentAggregations = Array.from(this.aggregations.values())
            .filter(agg => agg.lastOccurrence >= cutoffTime)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);
        return {
            totalLogs,
            logsByLevel,
            logsByService,
            errorRate,
            topErrors,
            recentAlerts,
            aggregations: recentAggregations
        };
    }
    searchLogs(filters) {
        const { level, service, message, timeWindow = 3600000, limit = 100 } = filters;
        const cutoffTime = new Date(Date.now() - timeWindow);
        let filteredLogs = this.logBuffer.filter(log => {
            if (log.timestamp < cutoffTime)
                return false;
            if (level && log.level !== level)
                return false;
            if (service && log.service !== service)
                return false;
            if (message && !log.message.toLowerCase().includes(message.toLowerCase()))
                return false;
            return true;
        });
        return filteredLogs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getAggregations(timeWindow = '1h', service, level) {
        return Array.from(this.aggregations.values())
            .filter(agg => {
            if (agg.timeWindow !== timeWindow)
                return false;
            if (service && agg.service !== service)
                return false;
            if (level && agg.level !== level)
                return false;
            return true;
        })
            .sort((a, b) => b.count - a.count);
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => alert.status === 'active')
            .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0)
                return severityDiff;
            return b.lastOccurrence.getTime() - a.lastOccurrence.getTime();
        });
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.status = 'resolved';
            loggerService_1.logger.info('Log alert resolved', {
                service: 'advanced-logger',
                metadata: {
                    alertId,
                    pattern: alert.pattern,
                    severity: alert.severity
                }
            });
            return true;
        }
        return false;
    }
    addPattern(pattern) {
        this.patterns.push(pattern);
        loggerService_1.logger.info('Log pattern added', {
            service: 'advanced-logger',
            metadata: {
                patternName: pattern.name,
                severity: pattern.severity
            }
        });
    }
    exportLogs(format = 'json', filters = {}) {
        const logs = this.searchLogs({ ...filters, limit: 10000 });
        switch (format) {
            case 'csv':
                const headers = ['timestamp', 'level', 'service', 'message', 'requestId', 'metadata'];
                const rows = logs.map(log => [
                    log.timestamp.toISOString(),
                    log.level,
                    log.service,
                    `"${log.message.replace(/"/g, '""')}"`,
                    log.requestId || '',
                    log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
                ]);
                return [headers, ...rows].map(row => row.join(',')).join('\n');
            case 'txt':
                return logs.map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.service}] ${log.message}${log.requestId ? ` (${log.requestId})` : ''}`).join('\n');
            case 'json':
            default:
                return JSON.stringify(logs, null, 2);
        }
    }
    initializePatterns() {
        this.patterns = [
            {
                pattern: /rate limit exceeded/i,
                name: 'Rate Limit Exceeded',
                severity: 'medium',
                description: 'API rate limit has been exceeded',
                action: 'Monitor traffic patterns and consider scaling'
            },
            {
                pattern: /database connection failed/i,
                name: 'Database Connection Failed',
                severity: 'high',
                description: 'Database connection failure detected',
                action: 'Check database health and connection pool'
            },
            {
                pattern: /out of memory|memory leak/i,
                name: 'Memory Issue',
                severity: 'critical',
                description: 'Memory-related issues detected',
                action: 'Investigate memory usage and potential leaks'
            },
            {
                pattern: /timeout|timed out/i,
                name: 'Timeout Error',
                severity: 'medium',
                description: 'Request or operation timeout',
                action: 'Check service response times and network connectivity'
            },
            {
                pattern: /authentication failed|unauthorized/i,
                name: 'Authentication Failure',
                severity: 'medium',
                description: 'Authentication or authorization failure',
                action: 'Review authentication logs and security policies'
            },
            {
                pattern: /circuit breaker opened/i,
                name: 'Circuit Breaker Opened',
                severity: 'high',
                description: 'Circuit breaker has opened due to failures',
                action: 'Check downstream service health'
            },
            {
                pattern: /unhandled error|uncaught exception/i,
                name: 'Unhandled Error',
                severity: 'high',
                description: 'Unhandled error or exception occurred',
                action: 'Review error handling and add proper exception handling'
            }
        ];
    }
    checkPatterns(logEntry) {
        this.patterns.forEach(pattern => {
            if (pattern.pattern.test(logEntry.message)) {
                this.createOrUpdateAlert(pattern, logEntry);
            }
        });
    }
    createOrUpdateAlert(pattern, logEntry) {
        const alertKey = `${pattern.name}_${logEntry.service}`;
        const existing = this.alerts.get(alertKey);
        if (existing) {
            existing.count++;
            existing.lastOccurrence = logEntry.timestamp;
            existing.status = 'active';
        }
        else {
            const alert = {
                id: this.generateAlertId(),
                pattern: pattern.name,
                severity: pattern.severity,
                count: 1,
                timeWindow: 3600000,
                firstOccurrence: logEntry.timestamp,
                lastOccurrence: logEntry.timestamp,
                status: 'active',
                message: `${pattern.description} in service ${logEntry.service}`
            };
            this.alerts.set(alertKey, alert);
            loggerService_1.logger.warn('New log alert created', {
                service: 'advanced-logger',
                metadata: {
                    alertId: alert.id,
                    pattern: pattern.name,
                    severity: pattern.severity,
                    service: logEntry.service
                }
            });
        }
    }
    processAggregations() {
        const now = new Date();
        this.AGGREGATION_INTERVALS.forEach(interval => {
            const windowMs = this.parseTimeWindow(interval);
            const cutoffTime = new Date(now.getTime() - windowMs);
            const recentLogs = this.logBuffer.filter(log => log.timestamp >= cutoffTime);
            const groups = {};
            recentLogs.forEach(log => {
                const key = `${interval}_${log.service}_${log.level}`;
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(log);
            });
            Object.entries(groups).forEach(([key, logs]) => {
                const [timeWindow, service, level] = key.split('_');
                const existing = this.aggregations.get(key);
                if (existing) {
                    existing.count = logs.length;
                    existing.lastOccurrence = now;
                    existing.samples = logs.slice(-5).map(log => ({
                        timestamp: log.timestamp,
                        message: log.message,
                        metadata: log.metadata
                    }));
                }
                else {
                    const aggregation = {
                        timeWindow,
                        level: level,
                        service,
                        count: logs.length,
                        firstOccurrence: logs[0].timestamp,
                        lastOccurrence: now,
                        samples: logs.slice(-5).map(log => ({
                            timestamp: log.timestamp,
                            message: log.message,
                            metadata: log.metadata
                        }))
                    };
                    this.aggregations.set(key, aggregation);
                }
            });
        });
    }
    async cacheLogEntry(logEntry) {
        try {
            const cacheKey = `log:${logEntry.timestamp.getTime()}:${logEntry.service}`;
            await cacheService_1.cacheService.cacheUserSession(cacheKey, logEntry, { ttl: 86400 });
            this.sendToExternalLogAggregation(logEntry);
        }
        catch (error) {
        }
    }
    sendToExternalLogAggregation(logEntry) {
        try {
            const loggingProvider = process.env.LOGGING_PROVIDER?.toLowerCase();
            if (!loggingProvider)
                return;
            switch (loggingProvider) {
                case 'elasticsearch':
                    this.sendToElasticsearch(logEntry);
                    break;
                case 'logstash':
                    this.sendToLogstash(logEntry);
                    break;
                case 'cloudwatch':
                    this.sendToCloudWatch(logEntry);
                    break;
                case 'stackdriver':
                    this.sendToStackdriver(logEntry);
                    break;
                case 'splunk':
                    this.sendToSplunk(logEntry);
                    break;
            }
        }
        catch (error) {
        }
    }
    sendToElasticsearch(logEntry) {
        try {
            const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
            const elasticsearchIndex = process.env.ELASTICSEARCH_INDEX || 'ellie-logs';
            if (!elasticsearchUrl) {
                return;
            }
        }
        catch (error) {
        }
    }
    sendToLogstash(logEntry) {
        try {
            const logstashHost = process.env.LOGSTASH_HOST;
            const logstashPort = process.env.LOGSTASH_PORT;
            if (!logstashHost || !logstashPort) {
                return;
            }
        }
        catch (error) {
        }
    }
    sendToCloudWatch(logEntry) {
        try {
            const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
            const logStreamName = process.env.CLOUDWATCH_LOG_STREAM || `ellie-${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`;
            if (!logGroupName) {
                return;
            }
        }
        catch (error) {
        }
    }
    sendToStackdriver(logEntry) {
        try {
            const projectId = process.env.GOOGLE_CLOUD_PROJECT;
            if (!projectId) {
                return;
            }
        }
        catch (error) {
        }
    }
    sendToSplunk(logEntry) {
        try {
            const splunkUrl = process.env.SPLUNK_URL;
            const splunkToken = process.env.SPLUNK_TOKEN;
            if (!splunkUrl || !splunkToken) {
                return;
            }
        }
        catch (error) {
        }
    }
    parseTimeWindow(window) {
        const unit = window.slice(-1);
        const value = parseInt(window.slice(0, -1));
        switch (unit) {
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 60 * 1000;
        }
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    cleanup() {
        const cutoffTime = new Date(Date.now() - 86400000);
        this.logBuffer = this.logBuffer.filter(log => log.timestamp >= cutoffTime);
        for (const [key, aggregation] of this.aggregations.entries()) {
            if (aggregation.lastOccurrence < cutoffTime) {
                this.aggregations.delete(key);
            }
        }
        for (const [key, alert] of this.alerts.entries()) {
            if (alert.status === 'resolved' && alert.lastOccurrence < cutoffTime) {
                this.alerts.delete(key);
            }
        }
        loggerService_1.logger.debug('Advanced logger cleanup completed', {
            service: 'advanced-logger',
            metadata: {
                logBufferSize: this.logBuffer.length,
                aggregationsCount: this.aggregations.size,
                alertsCount: this.alerts.size
            }
        });
    }
    getServiceStats() {
        const activeAlertsCount = Array.from(this.alerts.values())
            .filter(alert => alert.status === 'active').length;
        const memoryUsage = Math.round((JSON.stringify(this.logBuffer).length +
            JSON.stringify(Array.from(this.aggregations.values())).length +
            JSON.stringify(Array.from(this.alerts.values())).length) / 1024);
        return {
            logBufferSize: this.logBuffer.length,
            aggregationsCount: this.aggregations.size,
            alertsCount: this.alerts.size,
            activeAlertsCount,
            patternsCount: this.patterns.length,
            memoryUsage
        };
    }
}
exports.AdvancedLoggerService = AdvancedLoggerService;
exports.advancedLoggerService = new AdvancedLoggerService();
//# sourceMappingURL=advancedLoggerService.js.map