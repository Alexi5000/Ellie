import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API for testing
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      onupdatefound: null,
      installing: null,
    }),
    ready: Promise.resolve({
      unregister: vi.fn().mockResolvedValue(true),
    }),
  },
});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:5000',
    VITE_WS_URL: 'http://localhost:5000',
    BASE_URL: '/',
    PROD: false,
  },
});