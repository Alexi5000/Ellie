"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
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
const mockVoiceProcessingService = {
    validateAudioFormat: jest.fn().mockReturnValue(true),
    processAudioInput: jest.fn().mockResolvedValue('Mock transcription'),
    convertTextToSpeech: jest.fn().mockResolvedValue(Buffer.from('mock-audio-data')),
    getCacheStats: jest.fn().mockReturnValue({ size: 0, keys: [] }),
    clearTTSCache: jest.fn(),
    createAudioInput: jest.fn()
};
const mockAIResponseService = {
    generateResponse: jest.fn().mockResolvedValue('Mock AI response'),
    routeToOptimalAPI: jest.fn().mockReturnValue('groq'),
    processWithGroq: jest.fn().mockResolvedValue('Mock Groq response'),
    processWithOpenAI: jest.fn().mockResolvedValue('Mock OpenAI response'),
    validateLegalCompliance: jest.fn().mockResolvedValue(true),
    handleFallbackResponses: jest.fn().mockReturnValue('Fallback response')
};
jest.mock('../services/voiceProcessingService', () => {
    return {
        VoiceProcessingService: jest.fn().mockImplementation(() => mockVoiceProcessingService)
    };
});
jest.mock('../services/aiResponseService', () => {
    return {
        AIResponseService: jest.fn().mockImplementation(() => mockAIResponseService)
    };
});
jest.mock('../services/loggerService', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        logRequest: jest.fn(),
        logVoiceProcessing: jest.fn(),
        getErrorStats: jest.fn().mockReturnValue({}),
        getRecentLogs: jest.fn().mockReturnValue([])
    }
}));
jest.mock('../services/rateLimitService', () => ({
    rateLimitService: {
        createApiRateLimiter: jest.fn().mockReturnValue((req, res, next) => next()),
        createVoiceRateLimiter: jest.fn().mockReturnValue((req, res, next) => next()),
        createVoiceProcessingLimiter: jest.fn().mockReturnValue((req, res, next) => next()),
        createTTSLimiter: jest.fn().mockReturnValue((req, res, next) => next()),
        getStats: jest.fn().mockReturnValue({ totalKeys: 0, totalQueuedRequests: 0, averageQueueLength: 0 })
    }
}));
jest.mock('../services/fallbackService', () => ({
    fallbackService: {
        getContextualFallback: jest.fn().mockReturnValue({
            text: 'Mock fallback response',
            isFallback: true,
            fallbackReason: 'Mock fallback'
        }),
        getServiceHealth: jest.fn().mockReturnValue({}),
        getFallbackStats: jest.fn().mockReturnValue({})
    }
}));
jest.mock('../services/cacheService', () => ({
    cacheService: {
        isAvailable: jest.fn().mockReturnValue(true),
        getCacheStats: jest.fn().mockResolvedValue({ size: 0, keys: [] }),
        clearCache: jest.fn().mockResolvedValue(true),
        invalidateByPattern: jest.fn().mockResolvedValue(0),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getCachedTTSAudio: jest.fn().mockResolvedValue(null),
        cacheTTSAudio: jest.fn().mockResolvedValue(undefined)
    }
}));
jest.mock('../services/cdnService', () => ({
    cdnService: {
        cacheMiddleware: jest.fn().mockReturnValue((req, res, next) => next()),
        getFrontendConfig: jest.fn().mockReturnValue({}),
        getStats: jest.fn().mockReturnValue({}),
        purgeCDNCache: jest.fn().mockResolvedValue(true)
    }
}));
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
        getConversationHistory: jest.fn().mockResolvedValue([]),
        deleteConversationData: jest.fn().mockResolvedValue(true),
        updatePrivacySettings: jest.fn().mockResolvedValue(undefined),
        getAnalyticsData: jest.fn().mockResolvedValue(null),
        exportConversationData: jest.fn().mockResolvedValue('')
    }))
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
jest.setTimeout(15000);
beforeEach(() => {
    testRunning = true;
    currentTestName = expect.getState().currentTestName || '';
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
});
afterEach(async () => {
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
    await new Promise(resolve => setImmediate(resolve));
    testRunning = false;
});
afterAll(async () => {
    testRunning = false;
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers.clear();
    activeIntervals.clear();
    jest.clearAllTimers();
    try {
        const { RateLimitService } = require('../services/rateLimitService');
        const rateLimitInstance = RateLimitService.getInstance();
        if (rateLimitInstance && typeof rateLimitInstance.destroy === 'function') {
            rateLimitInstance.destroy();
        }
    }
    catch (error) {
    }
    try {
        const { LoggerService } = require('../services/loggerService');
        const loggerInstance = LoggerService.getInstance();
        if (loggerInstance && typeof loggerInstance.clearLogs === 'function') {
            loggerInstance.clearLogs();
        }
    }
    catch (error) {
    }
    try {
        const { WebSocketSessionManager } = require('../services/sessionManager');
        const sessionManagerModule = require('../services/sessionManager');
        if (sessionManagerModule.sessionManager && typeof sessionManagerModule.sessionManager.destroy === 'function') {
            sessionManagerModule.sessionManager.destroy();
        }
    }
    catch (error) {
    }
    try {
        const conversationLoggingModule = require('../services/conversationLoggingService');
    }
    catch (error) {
    }
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    global.setTimeout = originalSetTimeout;
    global.setInterval = originalSetInterval;
    global.clearTimeout = originalClearTimeout;
    global.clearInterval = originalClearInterval;
    await new Promise(resolve => setTimeout(resolve, 100));
});
//# sourceMappingURL=setup.js.map