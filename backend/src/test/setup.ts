// Test setup for backend
import dotenv from 'dotenv';

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

// Create global mock instances that can be shared across tests
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

// Mock VoiceProcessingService to avoid constructor issues
jest.mock('../services/voiceProcessingService', () => {
  return {
    VoiceProcessingService: jest.fn().mockImplementation(() => mockVoiceProcessingService)
  };
});

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
jest.setTimeout(15000);

// Global test cleanup
beforeEach(() => {
  testRunning = true;
  currentTestName = expect.getState().currentTestName || '';
  
  // Clear any existing timers before each test
  activeTimers.forEach(timer => clearTimeout(timer));
  activeIntervals.forEach(interval => clearInterval(interval));
  activeTimers.clear();
  activeIntervals.clear();
  
  // Clear all Jest timers
  jest.clearAllTimers();
});

afterEach(async () => {
  // Clear all active timers and intervals
  activeTimers.forEach(timer => clearTimeout(timer));
  activeIntervals.forEach(interval => clearInterval(interval));
  activeTimers.clear();
  activeIntervals.clear();
  
  // Clear all Jest timers
  jest.clearAllTimers();
  
  // Wait for any pending async operations to complete
  await new Promise(resolve => setImmediate(resolve));
  
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
  try {
    const { RateLimitService } = require('../services/rateLimitService');
    const rateLimitInstance = RateLimitService.getInstance();
    if (rateLimitInstance && typeof rateLimitInstance.destroy === 'function') {
      rateLimitInstance.destroy();
    }
  } catch (error) {
    // Service might not be loaded, ignore
  }

  try {
    const { LoggerService } = require('../services/loggerService');
    const loggerInstance = LoggerService.getInstance();
    if (loggerInstance && typeof loggerInstance.clearLogs === 'function') {
      loggerInstance.clearLogs();
    }
  } catch (error) {
    // Service might not be loaded, ignore
  }

  // Cleanup WebSocket session manager
  try {
    const { WebSocketSessionManager } = require('../services/sessionManager');
    // If there are any instances, clean them up
    const sessionManagerModule = require('../services/sessionManager');
    if (sessionManagerModule.sessionManager && typeof sessionManagerModule.sessionManager.destroy === 'function') {
      sessionManagerModule.sessionManager.destroy();
    }
  } catch (error) {
    // Service might not be loaded, ignore
  }

  // Cleanup conversation logging service intervals
  try {
    const conversationLoggingModule = require('../services/conversationLoggingService');
    // If there are any instances created during tests, clean them up
    // This is handled by individual test cleanup, but we ensure no global instances remain
  } catch (error) {
    // Service might not be loaded, ignore
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
  
  // Wait for any final async operations
  await new Promise(resolve => setTimeout(resolve, 100));
});