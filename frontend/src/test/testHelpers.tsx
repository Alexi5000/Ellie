/**
 * Frontend Test Helper Utilities
 * 
 * Provides utility functions for React component testing, mock management, and common test operations.
 */

import { ReactElement } from 'react';
import { render, RenderOptions, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Wait for all pending promises to complete
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setImmediate(resolve));
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset all mock services to their default state
 */
export function resetAllMocks(): void {
  vi.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as any).mockReset();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
    });
  }
  
  // Reset Audio mock
  if (global.Audio && vi.isMockFunction(global.Audio)) {
    (global.Audio as any).mockClear();
  }
  
  // Reset MediaRecorder mock
  const mockMediaRecorder = (global as any).MockMediaRecorder;
  if (mockMediaRecorder && vi.isMockFunction(mockMediaRecorder)) {
    mockMediaRecorder.mockClear();
  }
}

/**
 * Create a mock Blob for audio data
 */
export function createMockAudioBlob(size: number = 1024): Blob {
  const buffer = new ArrayBuffer(size);
  return new Blob([buffer], { type: 'audio/webm' });
}

/**
 * Create a mock MediaStream for testing
 */
export function createMockMediaStream(): MediaStream {
  return {
    getTracks: () => [
      {
        stop: vi.fn(),
        kind: 'audio',
        enabled: true,
        readyState: 'live',
      } as any,
    ],
    getAudioTracks: () => [
      {
        stop: vi.fn(),
        kind: 'audio',
        enabled: true,
        readyState: 'live',
      } as any,
    ],
  } as any;
}

/**
 * Mock successful microphone access
 */
export function mockGetUserMedia(stream?: MediaStream): void {
  const mockStream = stream || createMockMediaStream();
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);
  }
}

/**
 * Mock failed microphone access
 */
export function mockGetUserMediaError(error: Error = new Error('Permission denied')): void {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue(error);
  }
}

/**
 * Mock successful fetch response
 */
export function mockFetchSuccess(data: any = {}, status: number = 200): void {
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as any).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      blob: async () => new Blob([JSON.stringify(data)]),
    });
  }
}

/**
 * Mock failed fetch response
 */
export function mockFetchError(error: Error = new Error('Network error')): void {
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as any).mockRejectedValue(error);
  }
}

/**
 * Mock Socket.io connection
 */
export function mockSocketConnection(connected: boolean = true): any {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected,
    id: 'mock-socket-id',
  };
  
  return mockSocket;
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
 * Suppress console output during tests
 */
export function suppressConsole(): { restore: () => void } {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();

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
 * Custom render function with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for element to be removed with custom timeout
 */
export async function waitForElementToBeRemoved(
  callback: () => HTMLElement | null,
  timeout: number = 5000
): Promise<void> {
  await waitFor(
    () => {
      const element = callback();
      if (element !== null) {
        throw new Error('Element still present');
      }
    },
    { timeout }
  );
}

/**
 * Simulate user typing with delay
 */
export async function typeWithDelay(
  element: HTMLElement,
  text: string,
  delay: number = 50
): Promise<void> {
  for (const char of text) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: char }));
    (element as HTMLInputElement).value += char;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
    await wait(delay);
  }
}

/**
 * Simulate mobile device
 */
export function mockMobileDevice(): { restore: () => void } {
  const originalUserAgent = navigator.userAgent;
  
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    configurable: true,
  });
  
  return {
    restore: () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    },
  };
}

/**
 * Simulate desktop device
 */
export function mockDesktopDevice(): { restore: () => void } {
  const originalUserAgent = navigator.userAgent;
  
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    configurable: true,
  });
  
  return {
    restore: () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    },
  };
}

/**
 * Mock environment variable for a test
 */
export function mockEnvVar(key: string, value: string): { restore: () => void } {
  // Access import.meta.env safely
  const env = (import.meta as any).env || {};
  const originalValue = env[key];
  env[key] = value;

  return {
    restore: () => {
      if (originalValue === undefined) {
        delete env[key];
      } else {
        env[key] = originalValue;
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

/**
 * Clean up all test resources
 */
export async function cleanupTestResources(): Promise<void> {
  // Clear all timers
  vi.clearAllTimers();
  
  // Clear all mocks
  resetAllMocks();
  
  // Wait for pending operations
  await flushPromises();
  
  // Additional cleanup delay
  await wait(10);
}

/**
 * Setup test environment for a test suite
 * Note: This function should be called within a describe block where beforeEach/afterEach are available
 */
export function setupTestEnvironment(): {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
} {
  return {
    beforeEach: async () => {
      resetAllMocks();
      await flushPromises();
    },
    afterEach: async () => {
      await cleanupTestResources();
    },
  };
}

/**
 * Create a mock audio context
 */
export function createMockAudioContext(): AudioContext {
  return {
    createMediaStreamSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createAnalyser: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
    }),
    close: vi.fn(),
    resume: vi.fn(),
    suspend: vi.fn(),
  } as any;
}

/**
 * Trigger a custom event on an element
 */
export function triggerEvent(element: HTMLElement, eventName: string, detail?: any): void {
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Wait for next animation frame
 */
export async function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver(): void {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as any;
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver(): void {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}
