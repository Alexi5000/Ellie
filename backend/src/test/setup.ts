// Test setup for backend

// Use the shared mock instances from env-setup.ts

import * as dotenv from 'dotenv';

// Load test environment variables first
dotenv.config({ path: '.env.test' });

// Ensure required environment variables are set for tests
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test_openai_api_key_mock';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test_groq_api_key_mock';
process.env.NODE_ENV = 'test';

// Track active timers and intervals for cleanup
const activeTimers = new Set<NodeJS.Timeout>();
const activeIntervals = new Set<NodeJS.Timeout>();

// Override setTimeout and setInterval to track them
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

global.setTimeout = ((callback: (...args: any[]) => void, ms?: number, ...args: any[]) => {
  const timer = originalSetTimeout(callback, ms, ...args);
  activeTimers.add(timer);
  return timer;
}) as typeof setTimeout;

global.setInterval = ((callback: (...args: any[]) => void, ms?: number, ...args: any[]) => {
  const interval = originalSetInterval(callback, ms, ...args);
  activeIntervals.add(interval);
  return interval;
}) as typeof setInterval;

global.clearTimeout = (timer: string | number | NodeJS.Timeout | undefined) => {
  if (timer) {
    activeTimers.delete(timer as NodeJS.Timeout);
    return originalClearTimeout(timer as NodeJS.Timeout);
  }
};

global.clearInterval = (interval: string | number | NodeJS.Timeout | undefined) => {
  if (interval) {
    activeIntervals.delete(interval as NodeJS.Timeout);
    return originalClearInterval(interval as NodeJS.Timeout);
  }
};

// Mock console methods to prevent excessive logging during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

let testRunning = true;
let currentTestName = '';

// Track which console messages should be suppressed
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

const shouldSuppressMessage = (message: string): boolean => {
  return suppressedMessages.some(suppressed => 
    message.includes(suppressed)
  );
};

const silentConsole = {
  log: (...args: any[]) => {
    const message = args.join(' ');
    if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
      return;
    }
    if (!testRunning && process.env.NODE_ENV === 'test') {
      return; // Suppress all logging after tests complete
    }
    return originalConsoleLog(...args);
  },
  error: (...args: any[]) => {
    const message = args.join(' ');
    if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
      return;
    }
    if (!testRunning && process.env.NODE_ENV === 'test') {
      return; // Suppress all logging after tests complete
    }
    return originalConsoleError(...args);
  },
  warn: (...args: any[]) => {
    const message = args.join(' ');
    if (process.env.NODE_ENV === 'test' && shouldSuppressMessage(message)) {
      return;
    }
    if (!testRunning && process.env.NODE_ENV === 'test') {
      return;
    }
    return originalConsoleWarn(...args);
  },
  info: (...args: any[]) => {
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

// Apply console mocking
console.log = silentConsole.log;
console.error = silentConsole.error;
console.warn = silentConsole.warn;
console.info = silentConsole.info;

// Mock OpenAI SDK with proper structure
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

// Export the shared mock instances for use in tests
const mockVoiceProcessingService = (global as any).sharedMockVoiceProcessingService;
const mockAIResponseService = (global as any).sharedMockAIResponseService;

// Mock logger service
jest.mock('../services/loggerService', () => {
  const mockLoggerInstance = {
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
    clearLogs: jest.fn()
  };

  // Create a mock class with getInstance as a static method
  class MockLoggerService {
    static getInstance() {
      return mockLoggerInstance;
    }
    
    // Instance methods (in case someone tries to instantiate directly)
    info = mockLoggerInstance.info;
    error = mockLoggerInstance.error;
    warn = mockLoggerInstance.warn;
    debug = mockLoggerInstance.debug;
    logRequest = mockLoggerInstance.logRequest;
    logVoiceProcessing = mockLoggerInstance.logVoiceProcessing;
    logWebSocketEvent = mockLoggerInstance.logWebSocketEvent;
    logExternalApiCall = mockLoggerInstance.logExternalApiCall;
    logRateLimit = mockLoggerInstance.logRateLimit;
    getErrorStats = mockLoggerInstance.getErrorStats;
    getRecentLogs = mockLoggerInstance.getRecentLogs;
    getRequestLogs = mockLoggerInstance.getRequestLogs;
    clearLogs = mockLoggerInstance.clearLogs;
  }

  return {
    LoggerService: MockLoggerService,
    LogLevel: {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    },
    logger: mockLoggerInstance
  };
});

// Mock rate limit service with configurable behavior for testing
let rateLimitingEnabled = false;
let requestCounts: Record<string, number> = {};

const createMockRateLimiter = (maxRequests: number) => {
  return (req: any, res: any, next: any) => {
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

// Export functions to control rate limiting behavior in tests
(global as any).enableRateLimiting = () => {
  rateLimitingEnabled = true;
  requestCounts = {};
};

(global as any).disableRateLimiting = () => {
  rateLimitingEnabled = false;
  requestCounts = {};
};

(global as any).resetRateLimitCounts = () => {
  requestCounts = {};
};

// Mock fallback service
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

  // Make getInstance return the mock instance
  mockFallbackService.getInstance.mockReturnValue(mockFallbackService);

  return {
    FallbackService: jest.fn().mockImplementation(() => mockFallbackService),
    fallbackService: mockFallbackService
  };
});

// Mock cache service
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

// Mock CDN service
jest.mock('../services/cdnService', () => {
  const mockCDNService = {
    cacheMiddleware: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
    getFrontendConfig: jest.fn().mockReturnValue({}),
    getStats: jest.fn().mockReturnValue({}),
    purgeCDNCache: jest.fn().mockResolvedValue(true),
    getAssetUrl: jest.fn().mockImplementation((path: string) => path),
    getCacheHeaders: jest.fn().mockReturnValue({}),
    generateETag: jest.fn().mockReturnValue('"mock-etag"'),
    shouldUseCDN: jest.fn().mockReturnValue(false)
  };

  return {
    CDNService: jest.fn().mockImplementation(() => mockCDNService),
    cdnService: mockCDNService
  };
});

// Mock analytics service
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

// Mock APM service
jest.mock('../services/apmService', () => ({
  apmService: {
    createExpressMiddleware: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
    getServiceStats: jest.fn().mockReturnValue({}),
    getMetrics: jest.fn().mockReturnValue({}),
    getActiveOperations: jest.fn().mockReturnValue([]),
    getTransaction: jest.fn().mockReturnValue(null)
  }
}));

// Mock advanced logger service
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

// Mock WebSocket handler
jest.mock('../services/websocketHandler', () => ({
  WebSocketHandler: jest.fn().mockImplementation(() => ({
    getConnectionStats: jest.fn().mockReturnValue({
      activeConnections: 0,
      totalConnections: 0
    })
  }))
}));

// Mock legal compliance service
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

// Mock conversation logging service
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

// Note: AIResponseService is not mocked globally to allow unit testing
// Individual tests can mock it if needed

// Export mocks for use in tests
(global as any).mockVoiceProcessingService = mockVoiceProcessingService;
(global as any).mockAIResponseService = mockAIResponseService;

// Mock Groq SDK
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

// Mock Redis to prevent connection attempts during tests
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

// Set test timeout
jest.setTimeout(30000); // Increased timeout for async operations

// Global test cleanup with improved isolation
beforeEach(async () => {
  testRunning = true;
  currentTestName = expect.getState().currentTestName || '';
  
  // Clear any existing timers before each test
  activeTimers.forEach(timer => {
    try {
      clearTimeout(timer);
    } catch (e) {
      // Timer may already be cleared
    }
  });
  activeIntervals.forEach(interval => {
    try {
      clearInterval(interval);
    } catch (e) {
      // Interval may already be cleared
    }
  });
  activeTimers.clear();
  activeIntervals.clear();
  
  // Clear all Jest timers
  jest.clearAllTimers();
  
  // Reset all mocks to ensure clean state
  jest.clearAllMocks();
  
  // Reset rate limiting state
  if ((global as any).resetRateLimitCounts) {
    (global as any).resetRateLimitCounts();
  }
  if ((global as any).disableRateLimiting) {
    (global as any).disableRateLimiting();
  }
  
  // Reset shared mock implementations to default behavior
  if ((global as any).sharedMockVoiceProcessingService) {
    const mockService = (global as any).sharedMockVoiceProcessingService;
    mockService.validateAudioFormat.mockReturnValue(true);
    mockService.processAudioInput.mockResolvedValue('Mock transcription');
    mockService.convertTextToSpeech.mockResolvedValue(Buffer.from('mock-audio-data'));
  }
  
  if ((global as any).sharedMockAIResponseService) {
    const mockService = (global as any).sharedMockAIResponseService;
    mockService.generateResponse.mockResolvedValue('Mock AI response');
    mockService.routeToOptimalAPI.mockReturnValue('groq');
  }
  
  // Wait for any pending operations to complete
  await new Promise(resolve => setImmediate(resolve));
});

afterEach(async () => {
  // Clear all active timers and intervals with error handling
  activeTimers.forEach(timer => {
    try {
      clearTimeout(timer);
    } catch (e) {
      // Timer may already be cleared
    }
  });
  activeIntervals.forEach(interval => {
    try {
      clearInterval(interval);
    } catch (e) {
      // Interval may already be cleared
    }
  });
  activeTimers.clear();
  activeIntervals.clear();
  
  // Clear all Jest timers
  jest.clearAllTimers();
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Wait for any pending async operations to complete
  await new Promise(resolve => setImmediate(resolve));
  
  // Additional cleanup delay to prevent race conditions between tests
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mark test as no longer running after cleanup
  testRunning = false;
});

afterAll(async () => {
  testRunning = false;
  
  // Final cleanup of all timers
  activeTimers.forEach(timer => clearTimeout(timer));
  activeIntervals.forEach(interval => clearInterval(interval));
  activeTimers.clear();
  activeIntervals.clear();
  
  // Clear all Jest timers
  jest.clearAllTimers();
  
  // Cleanup singleton services that might have intervals
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
      
      // Try different cleanup patterns
      if (serviceModule.RateLimitService?.getInstance) {
        const instance = serviceModule.RateLimitService.getInstance();
        if (instance?.destroy) instance.destroy();
      }
      
      if (serviceModule.LoggerService?.getInstance) {
        const instance = serviceModule.LoggerService.getInstance();
        if (instance?.clearLogs) instance.clearLogs();
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
      
    } catch (error) {
      // Service might not be loaded or might not have cleanup methods, ignore
    }
  }
  
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  
  // Restore original timer functions
  global.setTimeout = originalSetTimeout;
  global.setInterval = originalSetInterval;
  global.clearTimeout = originalClearTimeout;
  global.clearInterval = originalClearInterval;
  
  // Final cleanup delay
  await new Promise(resolve => setTimeout(resolve, 200));
});