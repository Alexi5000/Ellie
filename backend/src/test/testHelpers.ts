// Test helper utilities for improved test isolation and setup

import { jest } from '@jest/globals';

/**
 * Test isolation helper to ensure clean state between tests
 */
export class TestIsolationHelper {
  private static activeTimers = new Set<NodeJS.Timeout>();
  private static activeIntervals = new Set<NodeJS.Timeout>();
  private static mockInstances = new Map<string, any>();

  /**
   * Setup test isolation for a test suite
   */
  static setupTestSuite() {
    beforeEach(async () => {
      await this.cleanupBeforeTest();
    });

    afterEach(async () => {
      await this.cleanupAfterTest();
    });

    afterAll(async () => {
      await this.finalCleanup();
    });
  }

  /**
   * Cleanup before each test
   */
  static async cleanupBeforeTest() {
    // Clear all timers
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimers.clear();
    this.activeIntervals.clear();

    // Clear all Jest mocks
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset rate limiting
    if ((global as any).resetRateLimitCounts) {
      (global as any).resetRateLimitCounts();
    }
    if ((global as any).disableRateLimiting) {
      (global as any).disableRateLimiting();
    }

    // Wait for any pending operations
    await new Promise(resolve => setImmediate(resolve));
  }

  /**
   * Cleanup after each test
   */
  static async cleanupAfterTest() {
    // Clear all timers
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimers.clear();
    this.activeIntervals.clear();

    // Clear all Jest mocks
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Wait for async operations to complete
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Final cleanup after all tests
   */
  static async finalCleanup() {
    // Clear all timers
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimers.clear();
    this.activeIntervals.clear();

    // Clear mock instances
    this.mockInstances.clear();

    // Final wait
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Track a timer for cleanup
   */
  static trackTimer(timer: NodeJS.Timeout) {
    this.activeTimers.add(timer);
    return timer;
  }

  /**
   * Track an interval for cleanup
   */
  static trackInterval(interval: NodeJS.Timeout) {
    this.activeIntervals.add(interval);
    return interval;
  }

  /**
   * Register a mock instance for cleanup
   */
  static registerMockInstance(name: string, instance: any) {
    this.mockInstances.set(name, instance);
  }

  /**
   * Get a registered mock instance
   */
  static getMockInstance(name: string) {
    return this.mockInstances.get(name);
  }
}

/**
 * Mock API response helper
 */
export class MockAPIHelper {
  /**
   * Create a mock OpenAI response
   */
  static createMockOpenAIResponse(content: string = 'Mock OpenAI response') {
    return {
      choices: [{
        message: {
          content,
          role: 'assistant'
        },
        finish_reason: 'stop',
        index: 0
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }

  /**
   * Create a mock Groq response
   */
  static createMockGroqResponse(content: string = 'Mock Groq response') {
    return {
      choices: [{
        message: {
          content,
          role: 'assistant'
        },
        finish_reason: 'stop',
        index: 0
      }],
      usage: {
        prompt_tokens: 8,
        completion_tokens: 15,
        total_tokens: 23
      }
    };
  }

  /**
   * Create a mock TTS response
   */
  static createMockTTSResponse(size: number = 1024) {
    return {
      arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(size)))
    };
  }

  /**
   * Create a mock transcription response
   */
  static createMockTranscriptionResponse(text: string = 'Mock transcription') {
    return {
      text,
      language: 'en',
      duration: 2.5,
      segments: []
    };
  }
}

/**
 * Test timeout helper
 */
export class TestTimeoutHelper {
  /**
   * Create a promise that resolves after a delay
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(resolve, ms);
      TestIsolationHelper.trackTimer(timer);
    });
  }

  /**
   * Create a promise that rejects after a timeout
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error(`Test timeout after ${ms}ms`)), ms);
        TestIsolationHelper.trackTimer(timer);
      })
    ]);
  }

  /**
   * Wait for a condition to be true
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.delay(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

/**
 * Environment helper for tests
 */
export class TestEnvironmentHelper {
  private static originalEnv: Record<string, string | undefined> = {};

  /**
   * Set environment variables for a test
   */
  static setEnvVars(vars: Record<string, string>) {
    Object.keys(vars).forEach(key => {
      if (!(key in this.originalEnv)) {
        this.originalEnv[key] = process.env[key];
      }
      process.env[key] = vars[key];
    });
  }

  /**
   * Restore original environment variables
   */
  static restoreEnvVars() {
    Object.keys(this.originalEnv).forEach(key => {
      if (this.originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = this.originalEnv[key];
      }
    });
    this.originalEnv = {};
  }

  /**
   * Setup environment for a test suite
   */
  static setupTestEnvironment(vars: Record<string, string>) {
    beforeAll(() => {
      this.setEnvVars(vars);
    });

    afterAll(() => {
      this.restoreEnvVars();
    });
  }
}