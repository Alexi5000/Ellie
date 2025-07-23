/**
 * Advanced Logger Service - Enhanced logging with aggregation and structured logging
 * Requirements: 15.2 - Advanced logging with log aggregation
 */

import { logger } from './loggerService';
import { cacheService } from './cacheService';

export interface LogAggregation {
  timeWindow: string; // '1m', '5m', '1h', '1d'
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
  logsByLevel: { [level: string]: number };
  logsByService: { [service: string]: number };
  errorRate: number;
  topErrors: Array<{ message: string; count: number; service: string }>;
  recentAlerts: LogAlert[];
  aggregations: LogAggregation[];
}

export class AdvancedLoggerService {
  private logBuffer: Array<{
    timestamp: Date;
    level: string;
    service: string;
    message: string;
    metadata?: any;
    requestId?: string;
  }> = [];

  private aggregations = new Map<string, LogAggregation>();
  private alerts = new Map<string, LogAlert>();
  private patterns: LogPattern[] = [];

  private readonly MAX_BUFFER_SIZE = 5000;
  private readonly AGGREGATION_INTERVALS = ['1m', '5m', '1h', '1d'];

  constructor() {
    this.initializePatterns();
    
    // Start aggregation and cleanup intervals
    setInterval(() => {
      this.processAggregations();
    }, 60000); // Every minute

    setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes

    logger.info('Advanced Logger Service initialized', {
      service: 'advanced-logger',
      metadata: {
        maxBufferSize: this.MAX_BUFFER_SIZE,
        patternsCount: this.patterns.length
      }
    });
  }

  /**
   * Enhanced log method with aggregation
   */
  public log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    service: string,
    metadata?: any,
    requestId?: string
  ): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      service,
      message,
      metadata,
      requestId
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Maintain buffer size
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Check for patterns and alerts
    this.checkPatterns(logEntry);

    // Cache log entry for persistence
    this.cacheLogEntry(logEntry);

    // Forward to original logger based on level
    switch (level) {
      case 'debug':
        logger.debug(message, { service, requestId, metadata });
        break;
      case 'info':
        logger.info(message, { service, requestId, metadata });
        break;
      case 'warn':
        logger.warn(message, { service, requestId, metadata });
        break;
      case 'error':
        logger.error(message, { service, requestId, metadata });
        break;
      default:
        logger.info(message, { service, requestId, metadata });
    }
  }

  /**
   * Get log metrics for dashboard
   */
  public getLogMetrics(timeWindow: number = 3600000): LogMetrics {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentLogs = this.logBuffer.filter(log => log.timestamp >= cutoffTime);

    // Logs by level
    const logsByLevel: { [level: string]: number } = {};
    recentLogs.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
    });

    // Logs by service
    const logsByService: { [service: string]: number } = {};
    recentLogs.forEach(log => {
      logsByService[log.service] = (logsByService[log.service] || 0) + 1;
    });

    // Error rate
    const totalLogs = recentLogs.length;
    const errorLogs = recentLogs.filter(log => log.level === 'error').length;
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

    // Top errors
    const errorCounts: { [key: string]: { count: number; service: string } } = {};
    recentLogs
      .filter(log => log.level === 'error')
      .forEach(log => {
        const key = log.message.substring(0, 100); // Truncate for grouping
        if (!errorCounts[key]) {
          errorCounts[key] = { count: 0, service: log.service };
        }
        errorCounts[key].count++;
      });

    const topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent alerts
    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.lastOccurrence >= cutoffTime)
      .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
      .slice(0, 20);

    // Recent aggregations
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

  /**
   * Search logs with filters
   */
  public searchLogs(filters: {
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
  }> {
    const {
      level,
      service,
      message,
      timeWindow = 3600000,
      limit = 100
    } = filters;

    const cutoffTime = new Date(Date.now() - timeWindow);
    
    let filteredLogs = this.logBuffer.filter(log => {
      if (log.timestamp < cutoffTime) return false;
      if (level && log.level !== level) return false;
      if (service && log.service !== service) return false;
      if (message && !log.message.toLowerCase().includes(message.toLowerCase())) return false;
      return true;
    });

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get log aggregations
   */
  public getAggregations(
    timeWindow: string = '1h',
    service?: string,
    level?: string
  ): LogAggregation[] {
    return Array.from(this.aggregations.values())
      .filter(agg => {
        if (agg.timeWindow !== timeWindow) return false;
        if (service && agg.service !== service) return false;
        if (level && agg.level !== level) return false;
        return true;
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): LogAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => {
        // Sort by severity first, then by last occurrence
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.lastOccurrence.getTime() - a.lastOccurrence.getTime();
      });
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      logger.info('Log alert resolved', {
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

  /**
   * Add custom log pattern
   */
  public addPattern(pattern: LogPattern): void {
    this.patterns.push(pattern);
    logger.info('Log pattern added', {
      service: 'advanced-logger',
      metadata: {
        patternName: pattern.name,
        severity: pattern.severity
      }
    });
  }

  /**
   * Export logs in various formats
   */
  public exportLogs(
    format: 'json' | 'csv' | 'txt' = 'json',
    filters: {
      level?: string;
      service?: string;
      timeWindow?: number;
    } = {}
  ): string {
    const logs = this.searchLogs({ ...filters, limit: 10000 });

    switch (format) {
      case 'csv':
        const headers = ['timestamp', 'level', 'service', 'message', 'requestId', 'metadata'];
        const rows = logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.service,
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
          log.requestId || '',
          log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');

      case 'txt':
        return logs.map(log => 
          `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.service}] ${log.message}${
            log.requestId ? ` (${log.requestId})` : ''
          }`
        ).join('\n');

      case 'json':
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Initialize default patterns
   */
  private initializePatterns(): void {
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

  /**
   * Check log entry against patterns
   */
  private checkPatterns(logEntry: any): void {
    this.patterns.forEach(pattern => {
      if (pattern.pattern.test(logEntry.message)) {
        this.createOrUpdateAlert(pattern, logEntry);
      }
    });
  }

  /**
   * Create or update alert
   */
  private createOrUpdateAlert(pattern: LogPattern, logEntry: any): void {
    const alertKey = `${pattern.name}_${logEntry.service}`;
    const existing = this.alerts.get(alertKey);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = logEntry.timestamp;
      existing.status = 'active';
    } else {
      const alert: LogAlert = {
        id: this.generateAlertId(),
        pattern: pattern.name,
        severity: pattern.severity,
        count: 1,
        timeWindow: 3600000, // 1 hour
        firstOccurrence: logEntry.timestamp,
        lastOccurrence: logEntry.timestamp,
        status: 'active',
        message: `${pattern.description} in service ${logEntry.service}`
      };

      this.alerts.set(alertKey, alert);

      logger.warn('New log alert created', {
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

  /**
   * Process log aggregations
   */
  private processAggregations(): void {
    const now = new Date();
    
    this.AGGREGATION_INTERVALS.forEach(interval => {
      const windowMs = this.parseTimeWindow(interval);
      const cutoffTime = new Date(now.getTime() - windowMs);
      
      const recentLogs = this.logBuffer.filter(log => log.timestamp >= cutoffTime);
      
      // Group by service and level
      const groups: { [key: string]: any[] } = {};
      recentLogs.forEach(log => {
        const key = `${interval}_${log.service}_${log.level}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(log);
      });

      // Create or update aggregations
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
        } else {
          const aggregation: LogAggregation = {
            timeWindow,
            level: level as any,
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

  /**
   * Cache log entry for persistence and send to external log aggregation services
   */
  private async cacheLogEntry(logEntry: any): Promise<void> {
    try {
      const cacheKey = `log:${logEntry.timestamp.getTime()}:${logEntry.service}`;
      await cacheService.cacheUserSession(cacheKey, logEntry, { ttl: 86400 }); // 24 hours
      
      // Send to external log aggregation service if configured
      this.sendToExternalLogAggregation(logEntry);
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to external log aggregation service
   */
  private sendToExternalLogAggregation(logEntry: any): void {
    try {
      const loggingProvider = process.env.LOGGING_PROVIDER?.toLowerCase();
      if (!loggingProvider) return;
      
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
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to Elasticsearch
   */
  private sendToElasticsearch(logEntry: any): void {
    try {
      const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
      const elasticsearchIndex = process.env.ELASTICSEARCH_INDEX || 'ellie-logs';
      
      if (!elasticsearchUrl) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Elasticsearch Node.js client
      /*
      const { Client } = require('@elastic/elasticsearch');
      const client = new Client({ node: elasticsearchUrl });
      
      client.index({
        index: elasticsearchIndex,
        body: {
          ...logEntry,
          '@timestamp': logEntry.timestamp
        }
      });
      */
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to Logstash
   */
  private sendToLogstash(logEntry: any): void {
    try {
      const logstashHost = process.env.LOGSTASH_HOST;
      const logstashPort = process.env.LOGSTASH_PORT;
      
      if (!logstashHost || !logstashPort) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Logstash TCP input
      /*
      const net = require('net');
      const client = new net.Socket();
      
      client.connect(parseInt(logstashPort), logstashHost, () => {
        client.write(JSON.stringify({
          ...logEntry,
          '@timestamp': logEntry.timestamp
        }) + '\n');
        client.destroy();
      });
      */
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to AWS CloudWatch Logs
   */
  private sendToCloudWatch(logEntry: any): void {
    try {
      const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
      const logStreamName = process.env.CLOUDWATCH_LOG_STREAM || `ellie-${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`;
      
      if (!logGroupName) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using AWS SDK
      /*
      const AWS = require('aws-sdk');
      const cloudWatchLogs = new AWS.CloudWatchLogs();
      
      cloudWatchLogs.putLogEvents({
        logGroupName,
        logStreamName,
        logEvents: [{
          timestamp: logEntry.timestamp.getTime(),
          message: JSON.stringify(logEntry)
        }]
      });
      */
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to Google Cloud Stackdriver Logging
   */
  private sendToStackdriver(logEntry: any): void {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;
      
      if (!projectId) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Google Cloud Logging client
      /*
      const { Logging } = require('@google-cloud/logging');
      const logging = new Logging({ projectId });
      const log = logging.log('ellie-logs');
      
      const metadata = {
        severity: logEntry.level.toUpperCase(),
        resource: {
          type: 'global',
          labels: {
            project_id: projectId
          }
        }
      };
      
      const entry = log.entry(metadata, {
        ...logEntry,
        timestamp: logEntry.timestamp
      });
      
      log.write(entry);
      */
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
  
  /**
   * Send log to Splunk
   */
  private sendToSplunk(logEntry: any): void {
    try {
      const splunkUrl = process.env.SPLUNK_URL;
      const splunkToken = process.env.SPLUNK_TOKEN;
      
      if (!splunkUrl || !splunkToken) {
        return;
      }
      
      // This would be implemented with actual API calls
      // Example using Splunk HTTP Event Collector
      /*
      const fetch = require('node-fetch');
      
      fetch(`${splunkUrl}/services/collector/event`, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${splunkToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: {
            ...logEntry,
            time: logEntry.timestamp.getTime() / 1000
          },
          sourcetype: 'ellie_logs',
          source: `ellie-${process.env.NODE_ENV}`
        })
      });
      */
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }

  /**
   * Parse time window string to milliseconds
   */
  private parseTimeWindow(window: string): number {
    const unit = window.slice(-1);
    const value = parseInt(window.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const cutoffTime = new Date(Date.now() - 86400000); // 24 hours

    // Clean up old log buffer entries
    this.logBuffer = this.logBuffer.filter(log => log.timestamp >= cutoffTime);

    // Clean up old aggregations
    for (const [key, aggregation] of this.aggregations.entries()) {
      if (aggregation.lastOccurrence < cutoffTime) {
        this.aggregations.delete(key);
      }
    }

    // Clean up resolved alerts older than 24 hours
    for (const [key, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved' && alert.lastOccurrence < cutoffTime) {
        this.alerts.delete(key);
      }
    }

    logger.debug('Advanced logger cleanup completed', {
      service: 'advanced-logger',
      metadata: {
        logBufferSize: this.logBuffer.length,
        aggregationsCount: this.aggregations.size,
        alertsCount: this.alerts.size
      }
    });
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): {
    logBufferSize: number;
    aggregationsCount: number;
    alertsCount: number;
    activeAlertsCount: number;
    patternsCount: number;
    memoryUsage: number;
  } {
    const activeAlertsCount = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active').length;

    const memoryUsage = Math.round(
      (JSON.stringify(this.logBuffer).length +
       JSON.stringify(Array.from(this.aggregations.values())).length +
       JSON.stringify(Array.from(this.alerts.values())).length) / 1024
    );

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

// Export singleton instance
export const advancedLoggerService = new AdvancedLoggerService();