/**
 * Circuit Breaker Service
 * Provides fault tolerance and prevents cascading failures
 */

import { EventEmitter } from 'events';
import { logger } from './loggerService';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, requests fail fast
  HALF_OPEN = 'half_open' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time to wait before trying half-open
  successThreshold: number;      // Successes needed to close from half-open
  timeout: number;              // Request timeout
  monitoringPeriod: number;     // Time window for failure counting
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private nextAttempt: Date = new Date();
  private config: CircuitBreakerConfig;

  constructor(
    private serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    super();
    
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000, // 1 minute
      successThreshold: config.successThreshold || 3,
      timeout: config.timeout || 30000, // 30 seconds
      monitoringPeriod: config.monitoringPeriod || 300000 // 5 minutes
    };

    logger.info(`Circuit breaker initialized for service: ${serviceName}`, {
      service: 'circuit-breaker',
      metadata: { serviceName, config: this.config }
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt.getTime()) {
        const error = new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
        this.emit('requestRejected', { serviceName: this.serviceName, error });
        throw error;
      } else {
        // Try to transition to half-open
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker transitioning to HALF_OPEN: ${this.serviceName}`, {
          service: 'circuit-breaker',
          metadata: { serviceName: this.serviceName }
        });
        this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();
    this.failureCount = 0; // Reset failure count on success

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.info(`Circuit breaker CLOSED for service: ${this.serviceName}`, {
          service: 'circuit-breaker',
          metadata: { serviceName: this.serviceName }
        });
        this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
      }
    }

    this.emit('requestSucceeded', { serviceName: this.serviceName });
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.totalFailures++;
    this.lastFailureTime = new Date();
    this.failureCount++;

    logger.warn(`Circuit breaker recorded failure for service: ${this.serviceName}`, {
      service: 'circuit-breaker',
      metadata: { 
        serviceName: this.serviceName, 
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      },
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Go back to open state
      this.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
      logger.warn(`Circuit breaker OPENED (from half-open) for service: ${this.serviceName}`, {
        service: 'circuit-breaker',
        metadata: { serviceName: this.serviceName }
      });
      this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
      // Open the circuit
      this.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
      logger.error(`Circuit breaker OPENED for service: ${this.serviceName}`, {
        service: 'circuit-breaker',
        metadata: { 
          serviceName: this.serviceName,
          failureCount: this.failureCount,
          threshold: this.config.failureThreshold
        }
      });
      this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
    }

    this.emit('requestFailed', { serviceName: this.serviceName, error });
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit breaker allows requests
   */
  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      return true;
    }
    
    if (this.state === CircuitState.OPEN) {
      return Date.now() >= this.nextAttempt.getTime();
    }
    
    return false;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = new Date();
    
    logger.info(`Circuit breaker manually reset for service: ${this.serviceName}`, {
      service: 'circuit-breaker',
      metadata: { serviceName: this.serviceName }
    });
    
    this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info(`Circuit breaker configuration updated for service: ${this.serviceName}`, {
      service: 'circuit-breaker',
      metadata: { serviceName: this.serviceName, config: this.config }
    });
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker(serviceName, config);
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(serviceName: string, fn: () => Promise<T>, config?: Partial<CircuitBreakerConfig>): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName, config);
    return circuitBreaker.execute(fn);
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      stats[serviceName] = circuitBreaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    
    logger.info('All circuit breakers reset', {
      service: 'circuit-breaker'
    });
  }

  /**
   * Remove a circuit breaker
   */
  removeCircuitBreaker(serviceName: string): void {
    this.circuitBreakers.delete(serviceName);
    
    logger.info(`Circuit breaker removed for service: ${serviceName}`, {
      service: 'circuit-breaker',
      metadata: { serviceName }
    });
  }
}

export const circuitBreakerManager = CircuitBreakerManager.getInstance();