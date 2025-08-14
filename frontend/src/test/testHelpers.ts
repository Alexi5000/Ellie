// Frontend test helper utilities for improved test isolation and setup

import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Frontend test isolation helper
 */
export class FrontendTestHelper {
  private static mockInstances = new Map<string, any>();
  private static originalValues = new Map<string, any>();

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
    // Clear all mocks
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset DOM
    cleanup();

    // Reset any global state
    if ((global as any).cleanupFrontendTest) {
      (global as any).cleanupFrontendTest();
    }

    // Wait for any pending operations
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Cleanup after each test
   */
  static async cleanupAfterTest() {
    // Clear all mocks
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset DOM
    cleanup();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Final cleanup after all tests
   */
  static async finalCleanup() {
    // Clear mock instances
    this.mockInstances.clear();

    // Restore original values
    this.originalValues.forEach((value, key) => {
      try {
        const [obj, prop] = key.split('.');
        if (obj === 'window' && prop in window) {
          (window as any)[prop] = value;
        } else if (obj === 'navigator' && prop in navigator) {
          (navigator as any)[prop] = value;
        }
      } catch (error) {
        // Ignore restoration errors
      }
    });
    this.originalValues.clear();

    // Final wait
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Mock a browser API safely
   */
  static mockBrowserAPI(
    object: 'window' | 'navigator' | 'document',
    property: string,
    mockValue: any
  ) {
    const key = `${object}.${property}`;
    const target = object === 'window' ? window : object === 'navigator' ? navigator : document;

    // Store original value if not already stored
    if (!this.originalValues.has(key) && property in target) {
      this.originalValues.set(key, (target as any)[property]);
    }

    // Apply mock
    try {
      Object.defineProperty(target, property, {
        writable: true,
        configurable: true,
        value: mockValue,
      });
    } catch (error) {
      // If property is not configurable, try direct assignment
      (target as any)[property] = mockValue;
    }
  }

  /**
   * Create a mock MediaRecorder with realistic behavior
   */
  static createMockMediaRecorder() {
    return vi.fn().mockImplementation(() => {
      const recorder = {
        start: vi.fn().mockImplementation(() => {
          setTimeout(() => {
            if (recorder.onstart) recorder.onstart(new Event('start'));
          }, 10);
        }),
        stop: vi.fn().mockImplementation(() => {
          setTimeout(() => {
            if (recorder.ondataavailable) {
              const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
              recorder.ondataavailable({ data: mockBlob });
            }
            if (recorder.onstop) recorder.onstop(new Event('stop'));
          }, 10);
        }),
        addEventListener: vi.fn().mockImplementation((event, handler) => {
          if (event === 'start') recorder.onstart = handler;
          if (event === 'stop') recorder.onstop = handler;
          if (event === 'dataavailable') recorder.ondataavailable = handler;
        }),
        removeEventListener: vi.fn(),
        state: 'inactive',
        mimeType: 'audio/webm',
        onstart: null,
        onstop: null,
        ondataavailable: null,
      };
      return recorder;
    });
  }

  /**
   * Create a mock getUserMedia function
   */
  static createMockGetUserMedia() {
    return vi.fn().mockResolvedValue({
      getTracks: () => [{ 
        stop: vi.fn(),
        kind: 'audio',
        enabled: true,
        readyState: 'live'
      }],
      getAudioTracks: () => [{ 
        stop: vi.fn(),
        kind: 'audio',
        enabled: true,
        readyState: 'live'
      }],
    });
  }

  /**
   * Create a mock fetch function
   */
  static createMockFetch() {
    return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      // Default successful response
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ message: 'Mock response' }),
        text: () => Promise.resolve('Mock response'),
        blob: () => Promise.resolve(new Blob(['mock data'])),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        headers: new Headers(),
        url,
      });
    });
  }

  /**
   * Create a mock WebSocket
   */
  static createMockWebSocket() {
    return vi.fn().mockImplementation((url: string) => {
      const ws = {
        url,
        readyState: 1, // OPEN
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null,
      };

      // Simulate connection opening
      setTimeout(() => {
        if (ws.onopen) ws.onopen(new Event('open'));
      }, 10);

      return ws;
    });
  }

  /**
   * Create a mock Audio element
   */
  static createMockAudio() {
    return vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      currentTime: 0,
      duration: 0,
      paused: true,
      ended: false,
      volume: 1,
      muted: false,
      src: '',
    }));
  }

  /**
   * Wait for an element to appear in the DOM
   */
  static async waitForElement(
    selector: string,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<Element> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`);
  }

  /**
   * Simulate user interaction delay
   */
  static async simulateUserDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
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
 * Voice interaction test helper
 */
export class VoiceTestHelper {
  /**
   * Simulate a voice recording session
   */
  static async simulateVoiceRecording(
    button: HTMLElement,
    options: { duration?: number; shouldSucceed?: boolean } = {}
  ) {
    const { duration = 1000, shouldSucceed = true } = options;

    // Start recording
    button.click();
    await FrontendTestHelper.simulateUserDelay(50);

    // Simulate recording duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Stop recording
    button.click();
    await FrontendTestHelper.simulateUserDelay(50);

    if (shouldSucceed) {
      // Simulate successful processing
      await FrontendTestHelper.simulateUserDelay(200);
    }
  }

  /**
   * Mock voice service responses
   */
  static mockVoiceServiceResponses(responses: {
    transcription?: string;
    aiResponse?: string;
    audioUrl?: string;
    shouldFail?: boolean;
  }) {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/voice/process')) {
        if (responses.shouldFail) {
          return Promise.reject(new Error('Voice processing failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            transcription: responses.transcription || 'Mock transcription',
            response: responses.aiResponse || 'Mock AI response',
            audioUrl: responses.audioUrl || '/mock-audio.mp3',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    global.fetch = mockFetch;
    return mockFetch;
  }
}

/**
 * Socket.IO test helper
 */
export class SocketTestHelper {
  private static mockSocket: any = null;

  /**
   * Create a mock Socket.IO client
   */
  static createMockSocket() {
    const mockSocket = {
      connected: true,
      id: 'mock-socket-id',
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      listeners: new Map(),
    };

    // Simulate event handling
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      mockSocket.listeners.set(event, handler);
    });

    mockSocket.emit.mockImplementation((event: string, data?: any) => {
      // Simulate server responses for common events
      setTimeout(() => {
        if (event === 'voice-input' && mockSocket.listeners.has('ai-response')) {
          const handler = mockSocket.listeners.get('ai-response');
          handler({
            text: 'Mock AI response',
            audioUrl: '/mock-audio.mp3',
            timestamp: new Date().toISOString(),
          });
        }
      }, 100);
    });

    this.mockSocket = mockSocket;
    return mockSocket;
  }

  /**
   * Get the current mock socket
   */
  static getMockSocket() {
    return this.mockSocket;
  }

  /**
   * Simulate socket events
   */
  static simulateSocketEvent(event: string, data?: any) {
    if (this.mockSocket && this.mockSocket.listeners.has(event)) {
      const handler = this.mockSocket.listeners.get(event);
      handler(data);
    }
  }

  /**
   * Reset the mock socket
   */
  static resetMockSocket() {
    this.mockSocket = null;
  }
}