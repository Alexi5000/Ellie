"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env.test' });
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test_openai_api_key_mock';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test_groq_api_key_mock';
process.env.NODE_ENV = 'test';
const activeTimers = new Set();
const activeIntervals = new Set();
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;
global.setTimeout = ((callback, ms, ...args) => {
    const timer = originalSetTimeout(callback, ms, ...args);
    activeTimers.add(timer);
    return timer;
});
global.setInterval = ((callback, ms, ...args) => {
    const interval = originalSetInterval(callback, ms, ...args);
    activeIntervals.add(interval);
    return interval;
});
global.clearTimeout = (timer) => {
    if (timer) {
        activeTimers.delete(timer);
        return originalClearTimeout(timer);
    }
};
global.clearInterval = (interval) => {
    if (interval) {
        activeIntervals.delete(interval);
        return originalClearInterval(interval);
    }
};
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
let testRunning = true;
let currentTestName = '';
const suppressedMessages = [
    'Session cleanup interval started',
    'Session cleanup interval stopped',
    'Conversation logging cleanup scheduler started',
    'Conversation logging cleanup scheduler stopped',
    'Privacy settings updated for session',
    'Scheduled cleanup completed',
    'Message logged for session',
    'Conversation log deleted for session',
    'Data deletion',
    'Data export generated for session',
    'Session created:',
    'Session updated:',
    'Session removed:',
    'Cleaning up expired session:',
    'Cleaned up',
    'Professional referral request:',
    'Professional referral processed for',
    'Failed to process professional referral:'
];
const shouldSuppressMessage = (message) => {
    return suppressedMessages.some(suppressed => message.includes(suppressed));
};
const silentConsole = {
    log: (...args) => {
        const message = args.join(' ');
        if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
            return;
        }
        if (!testRunning && process.env.NODE_ENV === 'test') {
            return;
        }
        return originalConsoleLog(...args);
    },
    error: (...args) => {
        const message = args.join(' ');
        if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
            return;
        }
        if (!testRunning && process.env.NODE_ENV === 'test') {
            return;
        }
        return originalConsoleError(...args);
    },
    warn: (...args) => {
        const message = args.join(' ');
        if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
            return;
        }
        if (!testRunning && process.env.NODE_ENV === 'test') {
            return;
        }
        return originalConsoleWarn(...args);
    },
    info: (...args) => {
        const message = args.join(' ');
        if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
            return;
        }
        if (!testRunning && process.env.NODE_ENV === 'test') {
            return;
        }
        return originalConsoleInfo(...args);
    }
};
console.log = silentConsole.log;
console.error = silentConsole.error;
console.warn = silentConsole.warn;
console.info = silentConsole.info;
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        audio: {
            transcriptions: {
                create: jest.fn().mockResolvedValue('Mock transcription result')
            },
            speech: {
                create: jest.fn().mockResolvedValue({
                    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
                })
            }
        }
    }));
});
const mockVoiceProcessingService = global.sharedMockVoiceProcessingService;
const mockAIResponseService = global.sharedMockAIResponseService;
jest.mock('../services/loggerService', () => {
    const mockLoggerService = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        logRequest: jest.fn(),
        logVoiceProcessing: jest.fn(),
        logWebSocketEvent: jest.fn(),
        logExternalApiCall: jest.fn(),
        logRateLimit: jest.fn(),
        getErrorStats: jest.fn().mockReturnValue({}),
        getRecentLogs: jest.fn().mockReturnValue([]),
        getRequestLogs: jest.fn().mockReturnValue([]),
        clearLogs: jest.fn(),
        getInstance: jest.fn()
    };
    mockLoggerService.getInstance.mockReturnValue(mockLoggerService);
    return {
        LoggerService: jest.fn().mockImplementation(() => mockLoggerService),
        LogLevel: {
            ERROR: 'error',
            WARN: 'warn',
            INFO: 'info',
            DEBUG: 'debug'
        },
        logger: mockLoggerService
    };
});
let rateLimitingEnabled = false;
let requestCounts = {};
const createMockRateLimiter = (maxRequests) => {
    return (req, res, next) => {
        if (!rateLimitingEnabled) {
            return next();
        }
        const key = req.ip || 'test-ip';
        requestCounts[key] = (requestCounts[key] || 0) + 1;
        if (requestCounts[key] > maxRequests) {
            return res.status(429).json({
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests',
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId || 'test-request-id'
                }
            });
        }
        next();
    };
};
jest.mock('../services/rateLimitService', () => {
    const mockLimitStore = new Map();
    const mockRateLimitService = {
        createApiRateLimiter: jest.fn().mockImplementation(() => createMockRateLimiter(100)),
        createVoiceRateLimiter: jest.fn().mockImplementation(() => createMockRateLimiter(10)),
        createVoiceProcessingLimiter: jest.fn().mockImplementation(() => createMockRateLimiter(10)),
        createTTSLimiter: jest.fn().mockImplementation(() => createMockRateLimiter(20)),
        getStats: jest.fn().mockReturnValue({ totalKeys: 0, totalQueuedRequests: 0, averageQueueLength: 0 }),
        getRateLimitStatus: jest.fn().mockReturnValue(null),
        destroy: jest.fn(),
        limitStore: mockLimitStore
    };
    return {
        RateLimitService: {
            getInstance: jest.fn().mockReturnValue(mockRateLimitService)
        },
        rateLimitService: mockRateLimitService
    };
});
global.enableRateLimiting = () => {
    rateLimitingEnabled = true;
    requestCounts = {};
};
global.disableRateLimiting = () => {
    rateLimitingEnabled = false;
    requestCounts = {};
};
global.resetRateLimitCounts = () => {
    requestCounts = {};
};
jest.mock('../services/fallbackService', () => {
    const mockFallbackService = {
        getContextualFallback: jest.fn().mockReturnValue({
            text: 'Mock fallback response',
            isFallback: true,
            fallbackReason: 'Mock fallback'
        }),
        getServiceHealth: jest.fn().mockReturnValue({}),
        getFallbackStats: jest.fn().mockReturnValue({}),
        getInstance: jest.fn(),
        resetInstance: jest.fn(),
        initializeServiceStatus: jest.fn(),
        recordServiceCall: jest.fn(),
        isServiceAvailable: jest.fn().mockReturnValue(true),
        getFallbackForTranscription: jest.fn().mockReturnValue({
            text: 'Mock transcription fallback',
            isFallback: true,
            fallbackReason: 'Mock fallback'
        }),
        getFallbackForAI: jest.fn().mockReturnValue({
            text: 'Mock AI fallback',
            isFallback: true,
            fallbackReason: 'Mock fallback'
        }),
        getFallbackForTTS: jest.fn().mockReturnValue({
            text: 'Mock TTS fallback',
            isFallback: true,
            fallbackReason: 'Mock fallback'
        }),
        addCustomFallbackResponses: jest.fn(),
        updateCircuitBreakerSettings: jest.fn()
    };
    mockFallbackService.getInstance.mockReturnValue(mockFallbackService);
    return {
        FallbackService: jest.fn().mockImplementation(() => mockFallbackService),
        fallbackService: mockFallbackService
    };
});
jest.mock('../services/cacheService', () => {
    const mockCacheService = {
        isAvailable: jest.fn().mockReturnValue(true),
        getCacheStats: jest.fn().mockResolvedValue({ size: 0, keys: [] }),
        clearCache: jest.fn().mockResolvedValue(true),
        invalidateByPattern: jest.fn().mockResolvedValue(0),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getCachedTTSAudio: jest.fn().mockResolvedValue(null),
        cacheTTSAudio: jest.fn().mockResolvedValue(undefined),
        cacheAIResponse: jest.fn().mockResolvedValue(true),
        getCachedAIResponse: jest.fn().mockResolvedValue(null),
        cacheUserSession: jest.fn().mockResolvedValue(true),
        getCachedUserSession: jest.fn().mockResolvedValue(null)
    };
    return {
        CacheService: jest.fn().mockImplementation(() => mockCacheService),
        cacheService: mockCacheService
    };
});
jest.mock('../services/cdnService', () => {
    const mockCDNService = {
        cacheMiddleware: jest.fn().mockReturnValue((req, res, next) => next()),
        getFrontendConfig: jest.fn().mockReturnValue({}),
        getStats: jest.fn().mockReturnValue({}),
        purgeCDNCache: jest.fn().mockResolvedValue(true),
        getAssetUrl: jest.fn().mockImplementation((path) => path),
        getCacheHeaders: jest.fn().mockReturnValue({}),
        generateETag: jest.fn().mockReturnValue('"mock-etag"'),
        shouldUseCDN: jest.fn().mockReturnValue(false)
    };
    return {
        CDNService: jest.fn().mockImplementation(() => mockCDNService),
        cdnService: mockCDNService
    };
});
jest.mock('../services/analyticsService', () => ({
    analyticsService: {
        getServiceStats: jest.fn().mockReturnValue({}),
        getUsageMetrics: jest.fn().mockReturnValue({}),
        getPerformanceMetrics: jest.fn().mockResolvedValue({}),
        getBusinessMetrics: jest.fn().mockReturnValue({}),
        getDashboardData: jest.fn().mockReturnValue({}),
        exportData: jest.fn().mockReturnValue('')
    }
}));
jest.mock('../services/apmService', () => ({
    apmService: {
        createExpressMiddleware: jest.fn().mockReturnValue((req, res, next) => next()),
        getServiceStats: jest.fn().mockReturnValue({}),
        getMetrics: jest.fn().mockReturnValue({}),
        getActiveOperations: jest.fn().mockReturnValue([]),
        getTransaction: jest.fn().mockReturnValue(null)
    }
}));
jest.mock('../services/advancedLoggerService', () => ({
    advancedLoggerService: {
        getServiceStats: jest.fn().mockReturnValue({}),
        getLogMetrics: jest.fn().mockReturnValue({}),
        searchLogs: jest.fn().mockReturnValue([]),
        getAggregations: jest.fn().mockReturnValue({}),
        getActiveAlerts: jest.fn().mockReturnValue([]),
        resolveAlert: jest.fn().mockReturnValue(true),
        exportLogs: jest.fn().mockReturnValue('')
    }
}));
jest.mock('../services/websocketHandler', () => ({
    WebSocketHandler: jest.fn().mockImplementation(() => ({
        getConnectionStats: jest.fn().mockReturnValue({
            activeConnections: 0,
            totalConnections: 0
        })
    }))
}));
jest.mock('../services/legalComplianceService', () => ({
    LegalComplianceService: jest.fn().mockImplementation(() => ({
        analyzeLegalCompliance: jest.fn().mockResolvedValue({
            isCompliant: true,
            requiresDisclaimer: false,
            suggestedResponse: 'Mock legal response'
        }),
        processReferralRequest: jest.fn().mockResolvedValue({
            success: true,
            referralId: 'mock-referral-id'
        })
    }))
}));
jest.mock('../services/conversationLoggingService', () => ({
    ConversationLoggingService: jest.fn().mockImplementation(() => ({
        logMessage: jest.fn().mockResolvedValue(undefined),
        getConversationLog: jest.fn().mockResolvedValue(null),
        updatePrivacySettings: jest.fn().mockResolvedValue(undefined),
        scheduleDataDeletion: jest.fn().mockResolvedValue(undefined),
        exportUserData: jest.fn().mockResolvedValue(null),
        getAnalyticsData: jest.fn().mockResolvedValue(null),
        destroy: jest.fn(),
        stopCleanupScheduler: jest.fn()
    })),
    conversationLoggingService: {
        logMessage: jest.fn().mockResolvedValue(undefined),
        getConversationLog: jest.fn().mockResolvedValue(null),
        updatePrivacySettings: jest.fn().mockResolvedValue(undefined),
        scheduleDataDeletion: jest.fn().mockResolvedValue(undefined),
        exportUserData: jest.fn().mockResolvedValue(null),
        getAnalyticsData: jest.fn().mockResolvedValue(null),
        destroy: jest.fn(),
        stopCleanupScheduler: jest.fn()
    }
}));
global.mockVoiceProcessingService = mockVoiceProcessingService;
global.mockAIResponseService = mockAIResponseService;
jest.mock('groq-sdk', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{
                            message: {
                                content: 'Mock AI response'
                            }
                        }]
                })
            }
        }
    }));
});
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        isReady: false,
        isOpen: false
    }))
}));
jest.setTimeout(30000);
beforeEach(async () => {
    testRunning = true;
    currentTestName = expect.getState().currentTestName || '';
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
    jest.clearAllMocks();
    if (global.resetRateLimitCounts) {
        global.resetRateLimitCounts();
    }
    if (global.disableRateLimiting) {
        global.disableRateLimiting();
    }
    await new Promise(resolve => setImmediate(resolve));
});
afterEach(async () => {
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
    jest.clearAllMocks();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setTimeout(resolve, 10));
    testRunning = false;
});
afterAll(async () => {
    testRunning = false;
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
    const servicesToCleanup = [
        '../services/rateLimitService',
        '../services/loggerService',
        '../services/sessionManager',
        '../services/conversationLoggingService',
        '../services/cacheService',
        '../services/cdnService'
    ];
    for (const servicePath of servicesToCleanup) {
        try {
            const serviceModule = require(servicePath);
            if (serviceModule.RateLimitService?.getInstance) {
                const instance = serviceModule.RateLimitService.getInstance();
                if (instance?.destroy)
                    instance.destroy();
            }
            if (serviceModule.LoggerService?.getInstance) {
                const instance = serviceModule.LoggerService.getInstance();
                if (instance?.clearLogs)
                    instance.clearLogs();
            }
            if (serviceModule.sessionManager?.destroy) {
                serviceModule.sessionManager.destroy();
            }
            if (serviceModule.conversationLoggingService?.destroy) {
                serviceModule.conversationLoggingService.destroy();
            }
            if (serviceModule.cacheService?.disconnect) {
                await serviceModule.cacheService.disconnect();
            }
        }
        catch (error) {
        }
    }
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    global.setTimeout = originalSetTimeout;
    global.setInterval = originalSetInterval;
    global.clearTimeout = originalClearTimeout;
    global.clearInterval = originalClearInterval;
    await new Promise(resolve => setTimeout(resolve, 200));
});
//# sourceMappingURL=setup.js.map