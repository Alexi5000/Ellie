/**
 * Tests for RateLimitService
 * Requirements: 5.4, 5.5
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rateLimitService';

// Mock express request/response
const createMockReq = (ip: string = '127.0.0.1', path: string = '/test'): Partial<Request> => ({
  ip,
  path,
  requestId: 'test-request-id',
  get: jest.fn().mockReturnValue('test-user-agent')
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    headersSent: false
  };
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    rateLimitService = RateLimitService.getInstance();
    // Clear any existing rate limit data
    (rateLimitService as any).limitStore.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    rateLimitService.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RateLimitService.getInstance();
      const instance2 = RateLimitService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Should allow first request
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 2,
        queueSize: 0 // Disable queueing for this test
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Allow first two requests
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Third request should be blocked
      limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
    });

    it('should reset count after window expires', (done) => {
      const windowMs = 100; // Short window for testing
      const limiter = rateLimitService.createLimiter({
        windowMs,
        maxRequests: 1
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // First request should be allowed
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Second request should be blocked
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1); // Still 1

      // Wait for window to expire
      setTimeout(() => {
        // Third request should be allowed after window reset
        limiter(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledTimes(2);
        done();
      }, windowMs + 10);
    });
  });

  describe('Queueing System', () => {
    it('should queue requests when limit exceeded', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        queueSize: 2,
        queueTimeoutMs: 5000
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // First request should be allowed
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Second request should be queued
      limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(202); // Queued response
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request queued due to high traffic',
          queuePosition: 1
        })
      );
    });

    it('should reject requests when queue is full', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        queueSize: 1
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Fill up the limit and queue
      limiter(req as Request, res as Response, next); // Allowed
      limiter(req as Request, res as Response, next); // Queued

      // This should be rejected (queue full)
      limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.objectContaining({
              queueFull: true
            })
          })
        })
      );
    });

    it('should timeout queued requests', (done) => {
      const queueTimeoutMs = 100;
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        queueSize: 2,
        queueTimeoutMs
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Fill up the limit
      limiter(req as Request, res as Response, next);

      // Queue a request
      limiter(req as Request, res as Response, next);

      // Wait for timeout
      setTimeout(() => {
        expect(res.status).toHaveBeenCalledWith(408);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              details: expect.objectContaining({
                queueTimeout: true
              })
            })
          })
        );
        done();
      }, queueTimeoutMs + 10);
    });
  });

  describe('Custom Key Generation', () => {
    it('should use custom key generator', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req) => `custom:${req.get('user-id') || 'anonymous'}`
      });

      const req1 = createMockReq();
      (req1.get as jest.Mock).mockReturnValue('user-123');
      const req2 = createMockReq();
      (req2.get as jest.Mock).mockReturnValue('user-456');

      const res = createMockRes();
      const next = createMockNext();

      // Different users should have separate limits
      limiter(req1 as Request, res as Response, next);
      limiter(req2 as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  describe('Skip Conditions', () => {
    it('should skip successful requests when configured', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skipSuccessfulRequests: true
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Mock successful response
      res.statusCode = 200;
      res.send = jest.fn().mockImplementation(function(body) {
        // Simulate response completion
        return this;
      });

      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);

      // Both should be allowed since successful requests are skipped
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('should skip failed requests when configured', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        skipFailedRequests: true
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Mock failed response
      res.statusCode = 400;
      res.send = jest.fn().mockImplementation(function(body) {
        return this;
      });

      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);

      // Both should be allowed since failed requests are skipped
      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  describe('Predefined Limiters', () => {
    it('should create voice rate limiter', () => {
      const limiter = rateLimitService.createVoiceRateLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should create API rate limiter', () => {
      const limiter = rateLimitService.createApiRateLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('Rate Limit Status', () => {
    it('should return rate limit status', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Make some requests
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);

      const status = rateLimitService.getRateLimitStatus(req.ip!);
      expect(status).toBeDefined();
      expect(status!.count).toBe(2);
      expect(status!.queueLength).toBe(0);
    });

    it('should return null for non-existent key', () => {
      const status = rateLimitService.getRateLimitStatus('non-existent-key');
      expect(status).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return rate limiting statistics', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 2,
        queueSize: 2
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Make requests to generate stats
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next); // This should be queued

      const stats = rateLimitService.getStats();
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.totalQueuedRequests).toBeGreaterThan(0);
      expect(stats.topLimitedIPs).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 100, // Short window
        maxRequests: 1
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      limiter(req as Request, res as Response, next);

      // Manually trigger cleanup after window expires
      setTimeout(() => {
        (rateLimitService as any).cleanup();
        const stats = rateLimitService.getStats();
        expect(stats.totalKeys).toBe(0);
      }, 150);
    });

    it('should destroy service properly', () => {
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        queueSize: 1
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Create some queued requests
      limiter(req as Request, res as Response, next);
      limiter(req as Request, res as Response, next);

      // Destroy should clear everything
      rateLimitService.destroy();
      const stats = rateLimitService.getStats();
      expect(stats.totalKeys).toBe(0);
      expect(stats.totalQueuedRequests).toBe(0);
    });
  });

  describe('Callback Handling', () => {
    it('should call onLimitReached callback', () => {
      const onLimitReached = jest.fn();
      const limiter = rateLimitService.createLimiter({
        windowMs: 60000,
        maxRequests: 1,
        queueSize: 1,
        onLimitReached
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      // Fill up the limit
      limiter(req as Request, res as Response, next);
      
      // This should trigger the callback
      limiter(req as Request, res as Response, next);

      expect(onLimitReached).toHaveBeenCalledWith(req, res);
    });
  });
});