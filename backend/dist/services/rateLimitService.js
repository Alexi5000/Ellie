"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitService = exports.RateLimitService = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const errors_1 = require("../types/errors");
const loggerService_1 = require("./loggerService");
class RateLimitService {
    constructor() {
        this.limitStore = new Map();
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    static getInstance() {
        if (!RateLimitService.instance) {
            RateLimitService.instance = new RateLimitService();
        }
        return RateLimitService.instance;
    }
    createLimiter(config) {
        const { windowMs, maxRequests, queueSize = 10, queueTimeoutMs = 30000, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = (req) => req.ip || 'unknown', onLimitReached } = config;
        return (req, res, next) => {
            const key = keyGenerator(req);
            const now = Date.now();
            const resetTime = now + windowMs;
            let entry = this.limitStore.get(key);
            if (!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime,
                    queue: []
                };
                this.limitStore.set(key, entry);
            }
            const shouldCount = !skipSuccessfulRequests && !skipFailedRequests;
            if (shouldCount) {
                if (entry.count >= maxRequests * 0.8) {
                    loggerService_1.logger.logRateLimit(req.ip || 'unknown', req.path, req.requestId, entry.count, maxRequests);
                }
                if (entry.count >= maxRequests) {
                    this.handleLimitExceeded(req, res, entry, queueSize, queueTimeoutMs, onLimitReached);
                    return;
                }
                entry.count++;
            }
            if (skipSuccessfulRequests || skipFailedRequests) {
                const originalSend = res.send;
                res.send = function (body) {
                    const statusCode = res.statusCode;
                    const isSuccess = statusCode >= 200 && statusCode < 300;
                    const isFailure = statusCode >= 400;
                    if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailure)) {
                        entry.count--;
                    }
                    return originalSend.call(this, body);
                };
            }
            next();
        };
    }
    handleLimitExceeded(req, res, entry, queueSize, queueTimeoutMs, onLimitReached) {
        if (entry.queue.length >= queueSize) {
            loggerService_1.logger.error('Rate limit queue full', {
                requestId: req.requestId,
                service: 'rate-limiter',
                metadata: {
                    ip: req.ip || 'unknown',
                    path: req.path,
                    queueSize: entry.queue.length,
                    maxQueueSize: queueSize
                }
            });
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Server is currently overloaded. Please try again later.', {
                retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
                queueFull: true
            }, req.requestId);
            res.status(429).json(errorResponse);
            return;
        }
        const timeoutId = setTimeout(() => {
            this.removeFromQueue(entry, req.requestId);
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.CONNECTION_TIMEOUT, 'Request timed out while waiting in queue. Please try again.', {
                queueTimeout: true,
                retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
            }, req.requestId);
            if (!res.headersSent) {
                res.status(408).json(errorResponse);
            }
        }, queueTimeoutMs);
        const queuedRequest = {
            req,
            res,
            next: () => {
                clearTimeout(timeoutId);
                this.removeFromQueue(entry, req.requestId);
            },
            timestamp: Date.now(),
            timeoutId
        };
        entry.queue.push(queuedRequest);
        loggerService_1.logger.info('Request queued due to rate limit', {
            requestId: req.requestId,
            service: 'rate-limiter',
            metadata: {
                ip: req.ip || 'unknown',
                path: req.path,
                queuePosition: entry.queue.length,
                estimatedWaitTime: Math.ceil((entry.resetTime - Date.now()) / 1000)
            }
        });
        onLimitReached?.(req, res);
        const queueResponse = {
            message: 'Request queued due to high traffic',
            queuePosition: entry.queue.length,
            estimatedWaitTime: Math.ceil((entry.resetTime - Date.now()) / 1000),
            requestId: req.requestId
        };
        if (!res.headersSent) {
            res.status(202).json(queueResponse);
        }
        setTimeout(() => {
            this.processQueue(entry);
        }, entry.resetTime - Date.now());
    }
    removeFromQueue(entry, requestId) {
        const index = entry.queue.findIndex(item => item.req.requestId === requestId);
        if (index !== -1) {
            const removed = entry.queue.splice(index, 1)[0];
            clearTimeout(removed.timeoutId);
        }
    }
    processQueue(entry) {
        const now = Date.now();
        while (entry.queue.length > 0 && entry.count < entry.resetTime) {
            const queuedRequest = entry.queue.shift();
            if (!queuedRequest.res.headersSent) {
                clearTimeout(queuedRequest.timeoutId);
                entry.count++;
                loggerService_1.logger.info('Processing queued request', {
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
    getRateLimitStatus(key) {
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
    createVoiceRateLimiter() {
        return this.createLimiter({
            windowMs: 60 * 1000,
            maxRequests: 20,
            queueSize: 5,
            queueTimeoutMs: 10000,
            keyGenerator: (req) => `voice:${req.ip}`,
            onLimitReached: (req, res) => {
                loggerService_1.logger.warn('Voice rate limit reached', {
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
    createApiRateLimiter() {
        return this.createLimiter({
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            queueSize: 20,
            queueTimeoutMs: 30000,
            skipSuccessfulRequests: false,
            skipFailedRequests: true,
            keyGenerator: (req) => `api:${req.ip}`,
            onLimitReached: (req, res) => {
                loggerService_1.logger.warn('API rate limit reached', {
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
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limitStore.entries()) {
            if (now > entry.resetTime && entry.queue.length === 0) {
                this.limitStore.delete(key);
            }
        }
    }
    getStats() {
        const stats = {
            totalKeys: this.limitStore.size,
            totalQueuedRequests: 0,
            averageQueueLength: 0,
            topLimitedIPs: []
        };
        const ipStats = {};
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
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        for (const entry of this.limitStore.values()) {
            entry.queue.forEach(item => clearTimeout(item.timeoutId));
        }
        this.limitStore.clear();
    }
}
exports.RateLimitService = RateLimitService;
exports.rateLimitService = RateLimitService.getInstance();
//# sourceMappingURL=rateLimitService.js.map