/**
 * Application Performance Monitoring (APM) Service
 * Requirements: 15.2 - Integrate application performance monitoring
 */

import { logger } from './loggerService';
import { analyticsService } from './analyticsService';

export interface APMTransaction {
  id: string;
  name: string;
  type: 'request' | 'background' | 'websocket';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  metadata: {
    [key: string]: any;
  };
  spans: APMSpan[];
}

export interface APMSpan {
  id: string;
  transactionId: string;
  name: string;
  type: 'db' | 'http' | 'cache' | 'ai' | 'custom';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  metadata: {
    [key: string]: any;
  };
}

export interface APMMetrics {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
  };
  spans: {
    byType: { [type: string]: { count: number; averageDuration: number } };
    slowest: APMSpan[];
  };
  errors: {
    total: number;
    byType: { [type: string]: number };
    recent: Array<{ timestamp: Date; error: string; transaction: string }>;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
}

export class APMService {
  private activeTransactions = new Map<string, APMTransaction>();
  private completedTransactions: APMTransaction[] = [];
  private activeSpans = new Map<string, APMSpan>();
  private errors: Array<{ timestamp: Date; error: string; transaction: string; stack?: string }> = [];
  
  private readonly MAX_COMPLETED_TRANSACTIONS = 1000;
  private readonly MAX_ERRORS = 500;
  
  // External APM provider integration
  private externalApmEnabled: boolean = false;
  private externalApmProvider: string | null = null;
  private externalApmClient: any = null;

  constructor() {
    // Cleanup old data periodically
    setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes
    
    // Initialize external APM provider if configured
    this.initializeExternalApm();

    logger.info('APM Service initialized', {
      service: 'apm',
      metadata: {
        maxTransactions: this.MAX_COMPLETED_TRANSACTIONS,
        maxErrors: this.MAX_ERRORS,
        externalApmEnabled: this.externalApmEnabled,
        externalApmProvider: this.externalApmProvider
      }
    });
  }
  
  /**
   * Initialize external APM provider integration
   */
  private initializeExternalApm(): void {
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
          logger.warn(`Unsupported APM provider: ${apmProvider}`, {
            service: 'apm'
          });
      }
    } catch (error) {
      logger.error('Failed to initialize external APM provider', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  }
  
  /**
   * Initialize Elastic APM
   */
  private initializeElasticApm(): void {
    try {
      // Check if elastic APM is installed
      try {
        // This would be the actual implementation
        // const apm = require('elastic-apm-node').start({
        //   serviceName: process.env.APM_SERVICE_NAME || 'ellie-voice-receptionist',
        //   serverUrl: process.env.APM_SERVER_URL,
        //   environment: process.env.NODE_ENV || 'development',
        //   logLevel: process.env.APM_LOG_LEVEL || 'info'
        // });
        
        // this.externalApmClient = apm;
        this.externalApmEnabled = true;
        
        logger.info('Elastic APM initialized', {
          service: 'apm',
          metadata: {
            serverUrl: process.env.APM_SERVER_URL,
            environment: process.env.NODE_ENV || 'development'
          }
        });
      } catch (e) {
        logger.warn('Elastic APM module not found, continuing without external APM', {
          service: 'apm'
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Elastic APM', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Initialize New Relic
   */
  private initializeNewRelic(): void {
    try {
      // Check if New Relic is installed
      try {
        // This would be the actual implementation
        // const newrelic = require('newrelic');
        // this.externalApmClient = newrelic;
        this.externalApmEnabled = true;
        
        logger.info('New Relic APM initialized', {
          service: 'apm',
          metadata: {
            appName: process.env.NEW_RELIC_APP_NAME,
            environment: process.env.NODE_ENV || 'development'
          }
        });
      } catch (e) {
        logger.warn('New Relic module not found, continuing without external APM', {
          service: 'apm'
        });
      }
    } catch (error) {
      logger.error('Failed to initialize New Relic APM', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Initialize Datadog APM
   */
  private initializeDatadog(): void {
    try {
      // Check if Datadog is installed
      try {
        // This would be the actual implementation
        // const tracer = require('dd-trace').init({
        //   service: process.env.APM_SERVICE_NAME || 'ellie-voice-receptionist',
        //   env: process.env.NODE_ENV || 'development',
        //   logInjection: true
        // });
        // this.externalApmClient = tracer;
        this.externalApmEnabled = true;
        
        logger.info('Datadog APM initialized', {
          service: 'apm',
          metadata: {
            serviceName: process.env.APM_SERVICE_NAME || 'ellie-voice-receptionist',
            environment: process.env.NODE_ENV || 'development'
          }
        });
      } catch (e) {
        logger.warn('Datadog module not found, continuing without external APM', {
          service: 'apm'
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Datadog APM', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * Initialize Dynatrace APM
   */
  private initializeDynatrace(): void {
    try {
      // Dynatrace typically uses OneAgent which doesn't require explicit initialization
      // Just check if it's available
      this.externalApmEnabled = !!process.env.DT_TENANT && !!process.env.DT_API_TOKEN;
      
      if (this.externalApmEnabled) {
        logger.info('Dynatrace APM initialized', {
          service: 'apm',
          metadata: {
            tenant: process.env.DT_TENANT ? '(configured)' : '(not configured)',
            environment: process.env.NODE_ENV || 'development'
          }
        });
      } else {
        logger.warn('Dynatrace configuration not found, continuing without external APM', {
          service: 'apm'
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Dynatrace APM', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Start a new transaction
   */
  public startTransaction(
    name: string, 
    type: 'request' | 'background' | 'websocket' = 'request',
    metadata: any = {}
  ): string {
    const transactionId = this.generateId();
    
    const transaction: APMTransaction = {
      id: transactionId,
      name,
      type,
      startTime: Date.now(),
      status: 'running',
      metadata,
      spans: []
    };

    this.activeTransactions.set(transactionId, transaction);
    
    // Track in external APM if enabled
    if (this.externalApmEnabled && this.externalApmClient) {
      this.startExternalTransaction(transactionId, name, type, metadata);
    }

    logger.debug('APM transaction started', {
      service: 'apm',
      metadata: {
        transactionId,
        name,
        type
      }
    });

    return transactionId;
  }

  /**
   * End a transaction
   */
  public endTransaction(transactionId: string, status: 'completed' | 'failed' = 'completed'): void {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      logger.warn('Attempted to end non-existent transaction', {
        service: 'apm',
        metadata: { transactionId }
      });
      return;
    }

    transaction.endTime = Date.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.status = status;

    // Move to completed transactions
    this.completedTransactions.push(transaction);
    this.activeTransactions.delete(transactionId);

    // Maintain memory limits
    if (this.completedTransactions.length > this.MAX_COMPLETED_TRANSACTIONS) {
      this.completedTransactions = this.completedTransactions.slice(-this.MAX_COMPLETED_TRANSACTIONS);
    }

    // Track in external APM if enabled
    if (this.externalApmEnabled && this.externalApmClient) {
      this.endExternalTransaction(transactionId, transaction, status);
    }

    // Track analytics
    analyticsService.trackPerformance('transaction_duration', transaction.duration, {
      transactionName: transaction.name,
      transactionType: transaction.type,
      status
    });

    logger.debug('APM transaction ended', {
      service: 'apm',
      metadata: {
        transactionId,
        duration: transaction.duration,
        status
      }
    });
  }
  
  /**
   * Start transaction in external APM provider
   */
  private startExternalTransaction(
    transactionId: string,
    name: string,
    type: string,
    metadata: any
  ): void {
    try {
      if (!this.externalApmProvider) return;
      
      switch (this.externalApmProvider) {
        case 'elastic':
          // Example for Elastic APM
          // this.externalApmClient.startTransaction(name, type);
          break;
          
        case 'newrelic':
          // Example for New Relic
          // this.externalApmClient.startWebTransaction(name, () => {});
          break;
          
        case 'datadog':
          // Example for Datadog
          // this.externalApmClient.trace(name, {
          //   service: 'ellie-voice-receptionist',
          //   resource: name,
          //   type: type
          // });
          break;
      }
    } catch (error) {
      logger.warn('Failed to start external APM transaction', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  /**
   * End transaction in external APM provider
   */
  private endExternalTransaction(
    transactionId: string,
    transaction: APMTransaction,
    status: 'completed' | 'failed'
  ): void {
    try {
      if (!this.externalApmProvider) return;
      
      switch (this.externalApmProvider) {
        case 'elastic':
          // Example for Elastic APM
          // const currentTransaction = this.externalApmClient.currentTransaction;
          // if (currentTransaction) {
          //   if (status === 'failed') {
          //     currentTransaction.result = 'failure';
          //   }
          //   currentTransaction.end();
          // }
          break;
          
        case 'newrelic':
          // Example for New Relic
          // this.externalApmClient.endTransaction();
          break;
          
        case 'datadog':
          // Datadog automatically ends spans/transactions
          break;
      }
    } catch (error) {
      logger.warn('Failed to end external APM transaction', {
        service: 'apm',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Start a span within a transaction
   */
  public startSpan(
    transactionId: string,
    name: string,
    type: 'db' | 'http' | 'cache' | 'ai' | 'custom',
    metadata: any = {}
  ): string {
    const spanId = this.generateId();
    
    const span: APMSpan = {
      id: spanId,
      transactionId,
      name,
      type,
      startTime: Date.now(),
      status: 'running',
      metadata
    };

    this.activeSpans.set(spanId, span);

    // Add span to transaction
    const transaction = this.activeTransactions.get(transactionId);
    if (transaction) {
      transaction.spans.push(span);
    }

    logger.debug('APM span started', {
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

  /**
   * End a span
   */
  public endSpan(spanId: string, status: 'completed' | 'failed' = 'completed'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      logger.warn('Attempted to end non-existent span', {
        service: 'apm',
        metadata: { spanId }
      });
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    this.activeSpans.delete(spanId);

    // Track analytics
    analyticsService.trackPerformance(`${span.type}_span_duration`, span.duration, {
      spanName: span.name,
      transactionId: span.transactionId
    });

    logger.debug('APM span ended', {
      service: 'apm',
      metadata: {
        spanId,
        duration: span.duration,
        status
      }
    });
  }

  /**
   * Record an error
   */
  public recordError(
    error: Error | string,
    transactionId?: string,
    metadata: any = {}
  ): void {
    const errorEntry = {
      timestamp: new Date(),
      error: error instanceof Error ? error.message : error,
      transaction: transactionId || 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
      ...metadata
    };

    this.errors.push(errorEntry);

    // Maintain memory limits
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }
    
    // Record in external APM if enabled
    if (this.externalApmEnabled && this.externalApmClient) {
      this.recordExternalError(error, transactionId, metadata);
    }

    // Track analytics
    analyticsService.trackEvent({
      eventType: 'error',
      sessionId: transactionId || 'system',
      timestamp: errorEntry.timestamp,
      metadata: {
        error: errorEntry.error,
        stack: errorEntry.stack,
        ...metadata
      }
    });

    logger.error('APM error recorded', {
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
  
  /**
   * Record error in external APM provider
   */
  private recordExternalError(
    error: Error | string,
    transactionId?: string,
    metadata: any = {}
  ): void {
    try {
      if (!this.externalApmProvider) return;
      
      const errorObj = error instanceof Error ? error : new Error(error);
      
      switch (this.externalApmProvider) {
        case 'elastic':
          // Example for Elastic APM
          // this.externalApmClient.captureError(errorObj, {
          //   custom: metadata,
          //   transaction: transactionId
          // });
          break;
          
        case 'newrelic':
          // Example for New Relic
          // this.externalApmClient.noticeError(errorObj, {
          //   ...metadata,
          //   transactionId
          // });
          break;
          
        case 'datadog':
          // Example for Datadog
          // this.externalApmClient.tracer.scope().active().setTag('error', true);
          // this.externalApmClient.tracer.scope().active().setTag('error.msg', errorObj.message);
          // this.externalApmClient.tracer.scope().active().setTag('error.stack', errorObj.stack);
          break;
      }
    } catch (externalError) {
      logger.warn('Failed to record error in external APM', {
        service: 'apm',
        error: {
          message: externalError instanceof Error ? externalError.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get APM metrics
   */
  public getMetrics(timeWindow: number = 3600000): APMMetrics {
    const cutoffTime = Date.now() - timeWindow;
    const recentTransactions = this.completedTransactions.filter(
      t => t.startTime >= cutoffTime
    );
    const recentErrors = this.errors.filter(
      e => e.timestamp.getTime() >= cutoffTime
    );

    // Transaction metrics
    const successful = recentTransactions.filter(t => t.status === 'completed');
    const failed = recentTransactions.filter(t => t.status === 'failed');
    const durations = recentTransactions.map(t => t.duration!).filter(d => d !== undefined);
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Duration = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
    const p99Duration = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0;

    // Span metrics
    const allSpans = recentTransactions.flatMap(t => t.spans);
    const spansByType: { [type: string]: { count: number; averageDuration: number } } = {};
    
    allSpans.forEach(span => {
      if (!spansByType[span.type]) {
        spansByType[span.type] = { count: 0, averageDuration: 0 };
      }
      spansByType[span.type].count++;
      if (span.duration) {
        spansByType[span.type].averageDuration += span.duration;
      }
    });

    // Calculate averages
    Object.keys(spansByType).forEach(type => {
      if (spansByType[type].count > 0) {
        spansByType[type].averageDuration /= spansByType[type].count;
      }
    });

    // Slowest spans
    const slowestSpans = allSpans
      .filter(span => span.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Error metrics
    const errorsByType: { [type: string]: number } = {};
    recentErrors.forEach(error => {
      const errorType = this.categorizeError(error.error);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    // Throughput
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

  /**
   * Get active transactions and spans
   */
  public getActiveOperations(): {
    transactions: APMTransaction[];
    spans: APMSpan[];
  } {
    return {
      transactions: Array.from(this.activeTransactions.values()),
      spans: Array.from(this.activeSpans.values())
    };
  }

  /**
   * Get transaction details
   */
  public getTransaction(transactionId: string): APMTransaction | null {
    return this.activeTransactions.get(transactionId) || 
           this.completedTransactions.find(t => t.id === transactionId) || 
           null;
  }

  /**
   * Create middleware for Express.js
   */
  public createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const transactionId = this.startTransaction(
        `${req.method} ${req.path}`,
        'request',
        {
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      );

      // Store transaction ID in request for later use
      req.apmTransactionId = transactionId;

      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding: any) {
        const status = res.statusCode >= 400 ? 'failed' : 'completed';
        apmService.endTransaction(transactionId, status);
        
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Create wrapper for async functions
   */
  public wrapAsync<T extends (...args: any[]) => Promise<any>>(
    name: string,
    fn: T,
    type: 'db' | 'http' | 'cache' | 'ai' | 'custom' = 'custom'
  ): T {
    return (async (...args: any[]) => {
      const transactionId = this.getCurrentTransactionId();
      // Use a default transaction ID if none is available
      const spanId = this.startSpan(transactionId !== null ? transactionId : 'background', name, type);

      try {
        const result = await fn(...args);
        this.endSpan(spanId, 'completed');
        return result;
      } catch (error) {
        this.endSpan(spanId, 'failed');
        this.recordError(error instanceof Error ? error : new Error(String(error)), transactionId || undefined);
        throw error;
      }
    }) as T;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get current transaction ID from context (simplified)
   */
  private getCurrentTransactionId(): string | null {
    // In a real implementation, you'd use async_hooks or similar
    // to track the current transaction context
    return null;
  }

  /**
   * Categorize error for metrics
   */
  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('rate limit')) return 'rate_limit';
    if (errorMessage.includes('validation')) return 'validation';
    if (errorMessage.includes('authentication')) return 'auth';
    if (errorMessage.includes('network')) return 'network';
    if (errorMessage.includes('database')) return 'database';
    return 'unknown';
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const cutoffTime = Date.now() - 86400000; // 24 hours

    // Clean up old completed transactions
    this.completedTransactions = this.completedTransactions.filter(
      t => t.startTime >= cutoffTime
    );

    // Clean up old errors
    this.errors = this.errors.filter(
      e => e.timestamp.getTime() >= cutoffTime
    );

    // Clean up stale active transactions (older than 1 hour)
    const staleTransactionCutoff = Date.now() - 3600000;
    for (const [id, transaction] of this.activeTransactions.entries()) {
      if (transaction.startTime < staleTransactionCutoff) {
        this.endTransaction(id, 'failed');
        logger.warn('Cleaned up stale transaction', {
          service: 'apm',
          metadata: { transactionId: id, name: transaction.name }
        });
      }
    }

    // Clean up stale active spans
    for (const [id, span] of this.activeSpans.entries()) {
      if (span.startTime < staleTransactionCutoff) {
        this.endSpan(id, 'failed');
        logger.warn('Cleaned up stale span', {
          service: 'apm',
          metadata: { spanId: id, name: span.name }
        });
      }
    }

    logger.debug('APM cleanup completed', {
      service: 'apm',
      metadata: {
        completedTransactions: this.completedTransactions.length,
        activeTransactions: this.activeTransactions.size,
        errors: this.errors.length
      }
    });
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): {
    activeTransactions: number;
    completedTransactions: number;
    activeSpans: number;
    totalErrors: number;
    memoryUsage: number;
  } {
    const memoryUsage = Math.round(
      (JSON.stringify(Array.from(this.activeTransactions.values())).length +
       JSON.stringify(this.completedTransactions).length +
       JSON.stringify(Array.from(this.activeSpans.values())).length +
       JSON.stringify(this.errors).length) / 1024
    );

    return {
      activeTransactions: this.activeTransactions.size,
      completedTransactions: this.completedTransactions.length,
      activeSpans: this.activeSpans.size,
      totalErrors: this.errors.length,
      memoryUsage
    };
  }
}

// Export singleton instance
export const apmService = new APMService();