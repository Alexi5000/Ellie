/**
 * Advanced rate limiting service with queue system and user feedback
 * Requirements: 5.4, 5.5
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../utils/errorHandler';
import { ERROR_CODES } from '../types/errors';
import { logger } from './loggerService';

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

interface RateLimitEntry {
  count: number;
  resetTime: number;
  queue: QueuedRequest[];
}

interface QueuedRequest {
  req: Request;
  res: Response;
  next: NextFunction;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

export class RateLimitService {
  private static instance: RateLimitService;
  private limitStore = new Map<string, RateLimitEntry>();
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    // Don't start cleanup interval in test environment
    if (process.env.NODE_ENV !== 'test') {
      // Clean up expired entries every minute
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Reset singleton instance (for testing purposes only)
   */
  static resetInstance(): void {
    if (RateLimitService.instance) {
      RateLimitService.instance.destroy();
      RateLimitService.instance = undefined as any;
    }
  }

  /**
   * Cleanup method for tests and shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    // Clear all timeouts
    for (const entry of this.limitStore.values()) {
      entry.queue.forEach(item => clearTimeout(item.timeoutId));
    }
    
    this.limitStore.clear();
  }

  /**
   * Create rate limiting middleware
   */
  createLimiter(config: RateLimitConfig) {
    const {
      windowMs,
      maxRequests,
      queueSize = 10,
      queueTimeoutMs = 30000,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = (req) => req.ip || 'unknown',
      onLimitReached
    } = config;

    return (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();
      const resetTime = now + windowMs;

      // Get or create rate limit entry
      let entry = this.limitStore.get(key);
      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime,
          queue: []
        };
        this.limitStore.set(key, entry);
      }

      // Check if request should be counted
      const shouldCount = !skipSuccessfulRequests && !skipFailedRequests;
      
      if (shouldCount) {
        // Log rate limit approach
        if (entry.count >= maxRequests * 0.8) {
          logger.logRateLimit(req.ip || 'unknown', req.path, req.requestId!, entry.count, maxRequests);
        }

        // Check if limit exceeded
        if (entry.count >= maxRequests) {
          this.handleLimitExceeded(req, res, entry, queueSize, queueTimeoutMs, onLimitReached);
          return;
        }

        entry.count++;
      }

      // Track response to potentially skip counting
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          const isSuccess = statusCode >= 200 && statusCode < 300;
          const isFailure = statusCode >= 400;

          if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailure)) {
            entry!.count--;
          }

          return originalSend.call(this, body);
        };
      }

      next();
    };
  }

  /**
   * Handle rate limit exceeded with queueing
   */
  private handleLimitExceeded(
    req: Request,
    res: Response,
    entry: RateLimitEntry,
    queueSize: number,
    queueTimeoutMs: number,
    onLimitReached?: (req: Request, res: Response) => void
  ): void {
    // Check if queue is full
    if (entry.queue.length >= queueSize) {
      logger.error('Rate limit queue full', {
        requestId: req.requestId,
        service: 'rate-limiter',
        metadata: {
          ip: req.ip || 'unknown',
          path: req.path,
          queueSize: entry.queue.length,
          maxQueueSize: queueSize
        }
      });

      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Server is currently overloaded. Please try again later.',
        {
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
          queueFull: true
        },
        req.requestId
      );

      res.status(429).json(errorResponse);
      return;
    }

    // Add to queue
    const timeoutId = setTimeout(() => {
      this.removeFromQueue(entry, req.requestId!);
      
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.CONNECTION_TIMEOUT,
        'Request timed out while waiting in queue. Please try again.',
        {
          queueTimeout: true,
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
        },
        req.requestId
      );

      if (!res.headersSent) {
        res.status(408).json(errorResponse);
      }
    }, queueTimeoutMs);

    const queuedRequest: QueuedRequest = {
      req,
      res,
      next: () => {
        clearTimeout(timeoutId);
        this.removeFromQueue(entry, req.requestId!);
        // Continue with the request
      },
      timestamp: Date.now(),
      timeoutId
    };

    entry.queue.push(queuedRequest);

    logger.info('Request queued due to rate limit', {
      requestId: req.requestId,
      service: 'rate-limiter',
      metadata: {
        ip: req.ip || 'unknown',
        path: req.path,
        queuePosition: entry.queue.length,
        estimatedWaitTime: Math.ceil((entry.resetTime - Date.now()) / 1000)
      }
    });

    // Call custom handler if provided
    onLimitReached?.(req, res);

    // Send queue status response
    const queueResponse = {
      message: 'Request queued due to high traffic',
      queuePosition: entry.queue.length,
      estimatedWaitTime: Math.ceil((entry.resetTime - Date.now()) / 1000),
      requestId: req.requestId
    };

    if (!res.headersSent) {
      res.status(202).json(queueResponse);
    }

    // Process queue when rate limit resets
    setTimeout(() => {
      this.processQueue(entry);
    }, entry.resetTime - Date.now());
  }

  /**
   * Remove request from queue
   */
  private removeFromQueue(entry: RateLimitEntry, requestId: string) {
    const index = entry.queue.findIndex(item => item.req.requestId === requestId);
    if (index !== -1) {
      const removed = entry.queue.splice(index, 1)[0];
      clearTimeout(removed.timeoutId);
    }
  }

  /**
   * Process queued requests when rate limit resets
   */
  private processQueue(entry: RateLimitEntry) {
    const now = Date.now();
    
    // Process queued requests
    while (entry.queue.length > 0 && entry.count < entry.resetTime) {
      const queuedRequest = entry.queue.shift()!;
      
      // Check if request hasn't timed out
      if (!queuedRequest.res.headersSent) {
        clearTimeout(queuedRequest.timeoutId);
        entry.count++;
        
        logger.info('Processing queued request', {
          requestId: queuedRequest.req.requestId,
          service: 'rate-limiter',
          metadata: {
            waitTime: now - queuedRequest.timestamp,
            remainingQueue: entry.queue.length
          }
        });

        queuedRequest.next();
      }
    }
  }

  /**
   * Get rate limit status for a key
   */
  getRateLimitStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
    queueLength: number;
  } | null {
    const entry = this.limitStore.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, entry.resetTime - entry.count),
      resetTime: entry.resetTime,
      queueLength: entry.queue.length
    };
  }

  /**
   * Create voice-specific rate limiter
   */
  createVoiceRateLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 voice requests per minute
      queueSize: 5, // Small queue for voice requests
      queueTimeoutMs: 10000, // 10 second timeout for voice
      keyGenerator: (req) => `voice:${req.ip}`,
      onLimitReached: (req, res) => {
        logger.warn('Voice rate limit reached', {
          requestId: req.requestId,
          service: 'voice-rate-limiter',
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      }
    });
  }

  /**
   * Create API rate limiter
   */
  createApiRateLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      queueSize: 20,
      queueTimeoutMs: 30000,
      skipSuccessfulRequests: false,
      skipFailedRequests: true, // Don't count failed requests
      keyGenerator: (req) => `api:${req.ip}`,
      onLimitReached: (req, res) => {
        logger.warn('API rate limit reached', {
          requestId: req.requestId,
          service: 'api-rate-limiter',
          metadata: {
            ip: req.ip,
            endpoint: req.path,
            userAgent: req.get('User-Agent')
          }
        });
      }
    });
  }

  /**
   * Cleanup expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limitStore.entries()) {
      if (now > entry.resetTime && entry.queue.length === 0) {
        this.limitStore.delete(key);
      }
    }
  }

  /**
   * Get rate limiting statistics
   */
  getStats(): {
    totalKeys: number;
    totalQueuedRequests: number;
    averageQueueLength: number;
    topLimitedIPs: Array<{ ip: string; count: number; queueLength: number }>;
  } {
    const stats = {
      totalKeys: this.limitStore.size,
      totalQueuedRequests: 0,
      averageQueueLength: 0,
      topLimitedIPs: [] as Array<{ ip: string; count: number; queueLength: number }>
    };

    const ipStats: Record<string, { count: number; queueLength: number }> = {};

    for (const [key, entry] of this.limitStore.entries()) {
      stats.totalQueuedRequests += entry.queue.length;
      
      const ip = key.split(':')[1] || key;
      if (!ipStats[ip]) {
        ipStats[ip] = { count: 0, queueLength: 0 };
      }
      ipStats[ip].count += entry.count;
      ipStats[ip].queueLength += entry.queue.length;
    }

    stats.averageQueueLength = stats.totalKeys > 0 ? stats.totalQueuedRequests / stats.totalKeys : 0;

    stats.topLimitedIPs = Object.entries(ipStats)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }


}

export const rateLimitService = RateLimitService.getInstance();