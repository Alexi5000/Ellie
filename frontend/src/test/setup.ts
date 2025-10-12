import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Load test environment variables
const testEnv = {
  VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:5000',
  VITE_WS_URL: process.env.VITE_WS_URL || 'http://localhost:5000',
  VITE_APP_NAME: process.env.VITE_APP_NAME || 'Ellie Voice Receptionist (Test)',
  VITE_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0-test',
  VITE_MAX_RECORDING_TIME: process.env.VITE_MAX_RECORDING_TIME || '30000',
  VITE_AUDIO_SAMPLE_RATE: process.env.VITE_AUDIO_SAMPLE_RATE || '16000',
  VITE_PWA_ENABLED: process.env.VITE_PWA_ENABLED || 'false',
  VITE_TEST_MODE: process.env.VITE_TEST_MODE || 'true',
  VITE_MOCK_AUDIO: process.env.VITE_MOCK_AUDIO || 'true',
  VITE_SKIP_PERMISSIONS: process.env.VITE_SKIP_PERMISSIONS || 'true',
  BASE_URL: '/',
  PROD: false,
  DEV: false,
  MODE: 'test',
};

// Mock Web Audio API for testing
const mockMediaRecorder = vi.fn().mockImplementation(() => {
  const recorder = {
    start: vi.fn().mockImplementation(() => {
      // Simulate async start behavior
      setTimeout(() => {
        if (recorder.onstart) recorder.onstart(new Event('start'));
      }, 10);
    }),
    stop: vi.fn().mockImplementation(() => {
      // Simulate async stop behavior with data
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

Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: mockMediaRecorder,
});

// Make MediaRecorder available globally for tests
(global as any).MockMediaRecorder = mockMediaRecorder;

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
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
      waiting: null,
      active: null,
      scope: '/',
      update: vi.fn(),
      unregister: vi.fn().mockResolvedValue(true),
    }),
    ready: Promise.resolve({
      unregister: vi.fn().mockResolvedValue(true),
      update: vi.fn(),
      active: null,
      installing: null,
      waiting: null,
      scope: '/',
    }),
  },
});

// Mock navigator.vibrate for mobile tests - handle non-configurable property
try {
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(true),
  });
} catch (error) {
  // If property is not configurable, use a different approach
  if ('vibrate' in navigator) {
    // Property exists but is not configurable, mock it differently
    const originalVibrate = navigator.vibrate;
    (navigator as any).vibrate = vi.fn().mockReturnValue(true);
    
    // Store original for cleanup
    (global as any).originalNavigatorVibrate = originalVibrate;
  } else {
    // Property doesn't exist, add it
    (navigator as any).vibrate = vi.fn().mockReturnValue(true);
  }
}

// Mock import.meta.env with test environment variables
Object.defineProperty(import.meta, 'env', {
  value: testEnv,
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock WebSocket for Socket.io
global.WebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
}));

// Mock Socket.io client
vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  }),
}));

// Mock socketService for all tests
vi.mock('../src/services/socketService', () => ({
  socketService: {
    getConnectionState: vi.fn().mockReturnValue({
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
    }),
    isConnected: vi.fn().mockReturnValue(true),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    sendVoiceInput: vi.fn(),
    forceReconnect: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
  },
}));

// Mock Audio for TTS playback
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 0,
  paused: true,
  ended: false,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Console setup for test debugging
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Suppress specific React warnings in tests
  const message = args.join(' ');
  if (
    message.includes('Warning: ReactDOM.render is no longer supported') ||
    message.includes('Warning: validateDOMNesting') ||
    message.includes('Warning: Each child in a list should have a unique "key" prop')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Log test environment setup (only in verbose mode)
if (process.env.VITEST_VERBOSE === 'true') {
  console.log('Frontend test environment setup completed:', {
    VITE_API_URL: testEnv.VITE_API_URL,
    VITE_TEST_MODE: testEnv.VITE_TEST_MODE,
    VITE_MOCK_AUDIO: testEnv.VITE_MOCK_AUDIO,
    VITE_SKIP_PERMISSIONS: testEnv.VITE_SKIP_PERMISSIONS,
  });
}

// Global test cleanup function
(global as any).cleanupFrontendTest = () => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Clear any pending timers
  vi.clearAllTimers();
  
  // Reset fetch mock
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as any).mockClear();
  }
  
  // Reset WebSocket mock
  if (global.WebSocket && vi.isMockFunction(global.WebSocket)) {
    (global.WebSocket as any).mockClear();
  }
  
  // Reset Audio mock
  if (global.Audio && vi.isMockFunction(global.Audio)) {
    (global.Audio as any).mockClear();
  }
};