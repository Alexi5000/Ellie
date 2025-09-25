"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerManager = exports.CircuitBreakerManager = exports.CircuitBreaker = exports.CircuitState = void 0;
const events_1 = require("events");
const loggerService_1 = require("./loggerService");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker extends events_1.EventEmitter {
    constructor(serviceName, config = {}) {
        super();
        this.serviceName = serviceName;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.lastSuccessTime = null;
        this.totalRequests = 0;
        this.totalFailures = 0;
        this.totalSuccesses = 0;
        this.nextAttempt = new Date();
        this.config = {
            failureThreshold: config.failureThreshold || 5,
            recoveryTimeout: config.recoveryTimeout || 60000,
            successThreshold: config.successThreshold || 3,
            timeout: config.timeout || 30000,
            monitoringPeriod: config.monitoringPeriod || 300000
        };
        loggerService_1.logger.info(`Circuit breaker initialized for service: ${serviceName}`, {
            service: 'circuit-breaker',
            metadata: { serviceName, config: this.config }
        });
    }
    async execute(fn) {
        this.totalRequests++;
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt.getTime()) {
                const error = new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
                this.emit('requestRejected', { serviceName: this.serviceName, error });
                throw error;
            }
            else {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
                loggerService_1.logger.info(`Circuit breaker transitioning to HALF_OPEN: ${this.serviceName}`, {
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
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    async executeWithTimeout(fn) {
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
    onSuccess() {
        this.totalSuccesses++;
        this.lastSuccessTime = new Date();
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.state = CircuitState.CLOSED;
                loggerService_1.logger.info(`Circuit breaker CLOSED for service: ${this.serviceName}`, {
                    service: 'circuit-breaker',
                    metadata: { serviceName: this.serviceName }
                });
                this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
            }
        }
        this.emit('requestSucceeded', { serviceName: this.serviceName });
    }
    onFailure(error) {
        this.totalFailures++;
        this.lastFailureTime = new Date();
        this.failureCount++;
        loggerService_1.logger.warn(`Circuit breaker recorded failure for service: ${this.serviceName}`, {
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
            this.state = CircuitState.OPEN;
            this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
            loggerService_1.logger.warn(`Circuit breaker OPENED (from half-open) for service: ${this.serviceName}`, {
                service: 'circuit-breaker',
                metadata: { serviceName: this.serviceName }
            });
            this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
        }
        else if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
            loggerService_1.logger.error(`Circuit breaker OPENED for service: ${this.serviceName}`, {
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
    getStats() {
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
    getState() {
        return this.state;
    }
    canExecute() {
        if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
            return true;
        }
        if (this.state === CircuitState.OPEN) {
            return Date.now() >= this.nextAttempt.getTime();
        }
        return false;
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = new Date();
        loggerService_1.logger.info(`Circuit breaker manually reset for service: ${this.serviceName}`, {
            service: 'circuit-breaker',
            metadata: { serviceName: this.serviceName }
        });
        this.emit('stateChanged', { serviceName: this.serviceName, state: this.state });
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        loggerService_1.logger.info(`Circuit breaker configuration updated for service: ${this.serviceName}`, {
            service: 'circuit-breaker',
            metadata: { serviceName: this.serviceName, config: this.config }
        });
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitBreakerManager {
    constructor() {
        this.circuitBreakers = new Map();
    }
    static getInstance() {
        if (!CircuitBreakerManager.instance) {
            CircuitBreakerManager.instance = new CircuitBreakerManager();
        }
        return CircuitBreakerManager.instance;
    }
    getCircuitBreaker(serviceName, config) {
        if (!this.circuitBreakers.has(serviceName)) {
            const circuitBreaker = new CircuitBreaker(serviceName, config);
            this.circuitBreakers.set(serviceName, circuitBreaker);
        }
        return this.circuitBreakers.get(serviceName);
    }
    async execute(serviceName, fn, config) {
        const circuitBreaker = this.getCircuitBreaker(serviceName, config);
        return circuitBreaker.execute(fn);
    }
    getAllStats() {
        const stats = {};
        for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
            stats[serviceName] = circuitBreaker.getStats();
        }
        return stats;
    }
    resetAll() {
        for (const circuitBreaker of this.circuitBreakers.values()) {
            circuitBreaker.reset();
        }
        loggerService_1.logger.info('All circuit breakers reset', {
            service: 'circuit-breaker'
        });
    }
    removeCircuitBreaker(serviceName) {
        this.circuitBreakers.delete(serviceName);
        loggerService_1.logger.info(`Circuit breaker removed for service: ${serviceName}`, {
            service: 'circuit-breaker',
            metadata: { serviceName }
        });
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
exports.circuitBreakerManager = CircuitBreakerManager.getInstance();
//# sourceMappingURL=circuitBreaker.js.map