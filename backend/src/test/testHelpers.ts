/**
 * Test Helper Utilities
 * 
 * Provides utility functions for test isolation, mock management, and common test operations.
 */

/**
 * Wait for all pending promises and timers to complete
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Wait for a specific amount of time (useful for async operations)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset all mock services to their default state
 */
export function resetAllMockServices(): void {
  // Reset voice processing service
  if ((global as any).sharedMockVoiceProcessingService) {
    const mockService = (global as any).sharedMockVoiceProcessingService;
    mockService.validateAudioFormat.mockReturnValue(true);
    mockService.processAudioInput.mockResolvedValue('Mock transcription');
    mockService.convertTextToSpeech.mockResolvedValue(Buffer.from('mock-audio-data'));
    mockService.getCacheStats.mockReturnValue({ size: 0, keys: [] });
    mockService.clearTTSCache.mockClear();
    mockService.createAudioInput.mockClear();
  }

  // Reset AI response service
  if ((global as any).sharedMockAIResponseService) {
    const mockService = (global as any).sharedMockAIResponseService;
    mockService.generateResponse.mockResolvedValue('Mock AI response');
    mockService.routeToOptimalAPI.mockReturnValue('groq');
    mockService.processWithGroq.mockResolvedValue('Mock Groq response');
    mockService.processWithOpenAI.mockResolvedValue('Mock OpenAI response');
    mockService.validateLegalCompliance.mockResolvedValue(true);
    mockService.handleFallbackResponses.mockReturnValue('Fallback response');
  }

  // Reset rate limiting
  if ((global as any).disableRateLimiting) {
    (global as any).disableRateLimiting();
  }
  if ((global as any).resetRateLimitCounts) {
    (global as any).resetRateLimitCounts();
  }
}

/**
 * Enable rate limiting for tests that need to test rate limit behavior
 */
export function enableRateLimiting(): void {
  if ((global as any).enableRateLimiting) {
    (global as any).enableRateLimiting();
  }
}

/**
 * Disable rate limiting (default state for most tests)
 */
export function disableRateLimiting(): void {
  if ((global as any).disableRateLimiting) {
    (global as any).disableRateLimiting();
  }
}

/**
 * Reset rate limit counters
 */
export function resetRateLimitCounts(): void {
  if ((global as any).resetRateLimitCounts) {
    (global as any).resetRateLimitCounts();
  }
}

/**
 * Create a mock audio buffer for testing
 */
export function createMockAudioBuffer(size: number = 1024): Buffer {
  return Buffer.alloc(size);
}

/**
 * Create a mock Express.Multer.File for testing
 */
export function createMockMulterFile(options: {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
} = {}): Express.Multer.File {
  const buffer = options.buffer || createMockAudioBuffer(options.size || 1024);
  
  return {
    fieldname: options.fieldname || 'audio',
    originalname: options.originalname || 'test-audio.wav',
    encoding: options.encoding || '7bit',
    mimetype: options.mimetype || 'audio/wav',
    size: options.size || buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };
}

/**
 * Create a mock conversation context for testing
 */
export function createMockConversationContext(overrides: any = {}): any {
  return {
    sessionId: 'test-session-id',
    conversationHistory: [],
    userPreferences: {
      voiceSpeed: 1.0,
      language: 'en',
      accessibilityMode: false,
    },
    legalDisclaimer: true,
    ...overrides,
  };
}

/**
 * Create a mock message for conversation history
 */
export function createMockMessage(overrides: any = {}): any {
  return {
    id: 'test-message-id',
    timestamp: new Date(),
    type: 'user',
    content: 'Test message',
    metadata: {},
    ...overrides,
  };
}

/**
 * Suppress console output during tests (useful for noisy tests)
 */
export function suppressConsole(): { restore: () => void } {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();

  return {
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    },
  };
}

/**
 * Wait for a condition to be true (with timeout)
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock request object for Express route testing
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    method: 'GET',
    path: '/',
    ...overrides,
  };
}

/**
 * Create a mock response object for Express route testing
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock next function for Express middleware testing
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Clean up all test resources (timers, mocks, etc.)
 */
export async function cleanupTestResources(): Promise<void> {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset mock services
  resetAllMockServices();
  
  // Wait for pending operations
  await flushPromises();
  
  // Additional cleanup delay
  await wait(50);
}

/**
 * Setup test environment for a test suite
 */
export function setupTestEnvironment(): void {
  beforeEach(async () => {
    resetAllMockServices();
    await flushPromises();
  });

  afterEach(async () => {
    await cleanupTestResources();
  });
}

/**
 * Mock environment variable for a test
 */
export function mockEnvVar(key: string, value: string): { restore: () => void } {
  const originalValue = process.env[key];
  process.env[key] = value;

  return {
    restore: () => {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    },
  };
}

/**
 * Run a test with a specific environment variable
 */
export async function withEnvVar<T>(
  key: string,
  value: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const mock = mockEnvVar(key, value);
  try {
    return await fn();
  } finally {
    mock.restore();
  }
}
