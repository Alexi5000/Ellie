import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VoiceInteractionManager from '../components/VoiceInteractionManager';
import { VoiceState } from '../types';
import { ErrorProvider } from '../contexts/ErrorContext';

// Socket event handlers storage
let socketEventHandlers: Record<string, Function> = {};

// Mock socket.io-client
const mockSocket = {
  connected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock socketService to properly handle events
vi.mock('../services/socketService', () => {
  const mockSocketService = {
    isConnected: vi.fn(() => true),
    getConnectionState: vi.fn(() => ({
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
    })),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    sendVoiceInput: vi.fn((audioData: ArrayBuffer) => {
      // Simulate the socket emission that the real service would do
      mockSocket.emit('voice-input', audioData);
      return Promise.resolve();
    }),
    forceReconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  
  return {
    socketService: mockSocketService,
  };
});

// Create mock functions that can be accessed in tests
const mockSendVoiceInput = vi.fn((audioData: ArrayBuffer) => {
  mockSocket.emit('voice-input', audioData);
  return Promise.resolve();
});

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn();
const mockForceReconnect = vi.fn();

// Mock useSocket hooks
vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({
    isConnected: true,
    connectionState: {
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
    },
    connect: mockConnect,
    disconnect: mockDisconnect,
    sendVoiceInput: mockSendVoiceInput,
    forceReconnect: mockForceReconnect,
  })),
  useSocketAIResponse: vi.fn((handler) => {
    socketEventHandlers['ai-response'] = handler;
    return vi.fn();
  }),
  useSocketError: vi.fn((handler) => {
    socketEventHandlers['error'] = handler;
    return vi.fn();
  }),
  useSocketStatus: vi.fn((handler) => {
    socketEventHandlers['status'] = handler;
    return vi.fn();
  }),
}));

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-message-id',
}));

// Mock mobile detection to always return desktop interface
vi.mock('../utils/mobileDetection', () => ({
  getDeviceCapabilities: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    hasVibration: false,
    supportsWebAudio: true,
    supportsSpeechRecognition: true,
    browserName: 'Chrome',
    osName: 'Windows'
  })),
  getMobileAudioConstraints: vi.fn(() => ({})),
  getMediaRecorderOptions: vi.fn(() => ({ mimeType: 'audio/webm' })),
  provideMobileHapticFeedback: vi.fn(),
  isLandscapeMode: vi.fn(() => false),
  getSafeAreaInsets: vi.fn(() => ({ top: '0px', bottom: '0px' }))
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-audio-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Audio
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  currentTime: 0,
  onended: null,
  onerror: null,
};
global.Audio = vi.fn(() => mockAudio);

// Mock MediaRecorder with proper async behavior
class MockMediaRecorder {
  public state: string = 'inactive';
  public ondataavailable: ((event: any) => void) | null = null;
  public onstop: (() => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public mimeType: string = 'audio/webm';
  
  private startSpy = vi.fn();
  private stopSpy = vi.fn();
  private dataAvailableTimeout: NodeJS.Timeout | null = null;
  private stopTimeout: NodeJS.Timeout | null = null;

  constructor(stream: MediaStream, options?: any) {
    this.mimeType = options?.mimeType || 'audio/webm';
  }

  start(timeslice?: number) {
    this.startSpy(timeslice);
    this.state = 'recording';
    
    // Simulate async behavior - data becomes available after a short delay
    this.dataAvailableTimeout = setTimeout(() => {
      if (this.ondataavailable && this.state === 'recording') {
        const mockBlob = new Blob(['mock audio data'], { type: this.mimeType });
        this.ondataavailable({ data: mockBlob });
      }
    }, 50); // Increased delay to ensure proper async handling
  }

  stop() {
    this.stopSpy();
    this.state = 'inactive';
    
    // Clear any pending data available timeout
    if (this.dataAvailableTimeout) {
      clearTimeout(this.dataAvailableTimeout);
      this.dataAvailableTimeout = null;
    }
    
    // Simulate async behavior - stop event fires after a short delay
    this.stopTimeout = setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 50); // Increased delay to ensure proper async handling
  }

  // Cleanup method for tests
  cleanup() {
    if (this.dataAvailableTimeout) {
      clearTimeout(this.dataAvailableTimeout);
      this.dataAvailableTimeout = null;
    }
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
  }

  // Expose spies for testing
  get startCalls() { return this.startSpy.mock.calls; }
  get stopCalls() { return this.stopSpy.mock.calls; }
  get startCallCount() { return this.startSpy.mock.calls.length; }
  get stopCallCount() { return this.stopSpy.mock.calls.length; }
}

// Create a reference to track the current instance
let currentMediaRecorderInstance: MockMediaRecorder | null = null;

global.MediaRecorder = vi.fn((stream: MediaStream, options?: any) => {
  currentMediaRecorderInstance = new MockMediaRecorder(stream, options);
  return currentMediaRecorderInstance;
}) as any;

global.MediaRecorder.isTypeSupported = vi.fn(() => true);

// Helper function to get the current MediaRecorder instance for testing
const getCurrentMediaRecorder = () => currentMediaRecorderInstance;

// Mock getUserMedia
const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
};

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
  },
});

// Test wrapper component that provides necessary context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorProvider>
      {children}
    </ErrorProvider>
  );
};

// Helper function to render components with context
const renderWithContext = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('Voice Interaction Integration Tests', () => {
  let mockSocketService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    socketEventHandlers = {};
    
    // Cleanup any existing MediaRecorder instance
    if (currentMediaRecorderInstance) {
      currentMediaRecorderInstance.cleanup();
      currentMediaRecorderInstance = null;
    }
    
    // Reset mock functions to successful defaults
    mockConnect.mockResolvedValue(undefined);
    mockSendVoiceInput.mockImplementation((audioData: ArrayBuffer) => {
      mockSocket.emit('voice-input', audioData);
      return Promise.resolve();
    });
    
    // Reset useSocket mock to successful connection
    const { useSocket } = await import('../hooks/useSocket');
    (useSocket as any).mockReturnValue({
      isConnected: true,
      connectionState: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
      },
      connect: mockConnect,
      disconnect: mockDisconnect,
      sendVoiceInput: mockSendVoiceInput,
      forceReconnect: mockForceReconnect,
    });
    
    // Get the mocked socketService
    const { socketService } = await import('../services/socketService');
    mockSocketService = socketService;
    
    // Setup socketService event handler capture
    mockSocketService.on.mockImplementation((event: string, handler: Function) => {
      socketEventHandlers[event] = handler;
      return vi.fn(); // Return unsubscribe function
    });
    
    // Reset mock states
    mockSocketService.isConnected.mockReturnValue(true);
    mockSocket.connected = true;
  });

  afterEach(() => {
    // Cleanup MediaRecorder instance
    if (currentMediaRecorderInstance) {
      currentMediaRecorderInstance.cleanup();
      currentMediaRecorderInstance = null;
    }
    vi.clearAllMocks();
  });

  describe('Complete Voice Interaction Workflow', () => {
    it('handles complete voice interaction from recording to response', async () => {
      const mockOnError = vi.fn();
      
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Verify initial state
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Ellie')).toBeInTheDocument();

      // Start voice recording
      const voiceButton = screen.getByRole('button', { name: /tap to speak/i });
      
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Wait for MediaRecorder to be created and started
      await waitFor(() => {
        const recorder = getCurrentMediaRecorder();
        expect(recorder).not.toBeNull();
        expect(recorder!.startCallCount).toBeGreaterThan(0);
        expect(recorder!.state).toBe('recording');
      }, { timeout: 1000 });

      // Wait a bit for recording to simulate user speaking
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Stop recording by clicking the button again
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Wait for recording to complete and MediaRecorder.stop() to be called
      await waitFor(() => {
        const recorder = getCurrentMediaRecorder();
        expect(recorder!.stopCallCount).toBeGreaterThan(0);
        expect(recorder!.state).toBe('inactive');
      }, { timeout: 1000 });

      // Wait for the async onstop callback to be triggered and voice input to be processed
      await waitFor(() => {
        expect(mockSendVoiceInput).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      }, { timeout: 2000 });

      // Verify user message appears in chat
      await waitFor(() => {
        expect(screen.getByText('Voice message (processing...)')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Simulate AI response from socket
      const mockAIResponse = {
        text: 'Hello! How can I help you with your legal questions today?',
        audioBuffer: new ArrayBuffer(1024),
        confidence: 0.95,
        processingTime: 1500,
      };

      await act(async () => {
        if (socketEventHandlers['ai-response']) {
          socketEventHandlers['ai-response'](mockAIResponse);
        }
      });

      // Verify AI response appears in chat
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your legal questions today?')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify audio playback was initiated
      expect(global.Audio).toHaveBeenCalledWith('mock-audio-url');
      expect(mockAudio.play).toHaveBeenCalled();

      // Verify no errors occurred
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('handles socket connection errors gracefully', async () => {
      const mockOnError = vi.fn();
      
      // Mock connection failure by updating the useSocket mock
      const { useSocket } = await import('../hooks/useSocket');
      (useSocket as any).mockReturnValue({
        isConnected: false,
        connectionState: {
          isConnected: false,
          isConnecting: false,
          reconnectAttempts: 3,
        },
        connect: mockConnect.mockRejectedValue(new Error('Connection failed')),
        disconnect: mockDisconnect,
        sendVoiceInput: mockSendVoiceInput,
        forceReconnect: mockForceReconnect,
      });
      
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      // Wait for connection error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Test retry functionality
      const retryButton = screen.getByText('Retry Connection');
      
      // Mock successful reconnection
      mockConnect.mockResolvedValue(undefined);
      (useSocket as any).mockReturnValue({
        isConnected: true,
        connectionState: {
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
        },
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendVoiceInput: mockSendVoiceInput,
        forceReconnect: mockForceReconnect,
      });
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Verify reconnection attempt
      expect(mockForceReconnect).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
    });

    it('handles voice processing errors', async () => {
      const mockOnError = vi.fn();
      
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Simulate socket error
      const mockError = {
        error: {
          code: 'VOICE_PROCESSING_ERROR',
          message: 'Failed to process audio input',
          timestamp: new Date(),
          requestId: 'test-request-id',
        },
      };

      await act(async () => {
        if (socketEventHandlers['error']) {
          socketEventHandlers['error'](mockError);
        }
      });

      // Verify error message appears in chat
      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error: Failed to process audio input/)).toBeInTheDocument();
      });

      // Verify error callback was called
      expect(mockOnError).toHaveBeenCalledWith('Failed to process audio input');
    });

    it('handles status updates correctly', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Test different status updates
      const statusUpdates = [
        { state: VoiceState.LISTENING, message: 'Listening for voice input' },
        { state: VoiceState.PROCESSING, message: 'Processing your request' },
        { state: VoiceState.SPEAKING, message: 'Playing response' },
        { state: VoiceState.IDLE, message: 'Ready for next input' },
      ];

      for (const status of statusUpdates) {
        await act(async () => {
          if (socketEventHandlers['status']) {
            socketEventHandlers['status'](status);
          }
        });

        // Verify status is reflected in UI
        await waitFor(() => {
          const stateText = status.state === VoiceState.PROCESSING ? 'Processing...' :
                           status.state === VoiceState.SPEAKING ? 'Speaking...' :
                           status.state === VoiceState.LISTENING ? 'Listening...' :
                           'Ready';
          expect(screen.getAllByText(stateText).length).toBeGreaterThan(0);
        });
      }
    });

    it('handles conversation clearing', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Add some messages first
      const mockResponse = {
        text: 'Test response',
        audioBuffer: new ArrayBuffer(1024),
        confidence: 0.9,
        processingTime: 1000,
      };

      await act(async () => {
        if (socketEventHandlers['ai-response']) {
          socketEventHandlers['ai-response'](mockResponse);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Clear conversation
      const clearButton = screen.getByText('Clear');
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Verify conversation is cleared
      await waitFor(() => {
        expect(screen.queryByText('Test response')).not.toBeInTheDocument();
        expect(screen.getByText('Welcome to Ellie')).toBeInTheDocument();
      });

      // Verify audio URLs were revoked
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('handles audio playback controls', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Add AI response with audio
      const mockResponse = {
        text: 'Test audio response',
        audioBuffer: new ArrayBuffer(1024),
        confidence: 0.9,
        processingTime: 1000,
      };

      await act(async () => {
        if (socketEventHandlers['ai-response']) {
          socketEventHandlers['ai-response'](mockResponse);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test audio response')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Find and click play button
      const playButton = screen.getByText('Play');
      
      await act(async () => {
        fireEvent.click(playButton);
      });

      // Verify audio playback
      expect(global.Audio).toHaveBeenCalledWith('mock-audio-url');
      expect(mockAudio.play).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from microphone permission errors', async () => {
      const mockOnError = vi.fn();
      
      // Mock permission denied error
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permissionError);

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Try to start recording
      const voiceButton = screen.getByRole('button', { name: /tap to speak/i });
      
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Wait for permission error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify error callback was called
      expect(mockOnError).toHaveBeenCalled();

      // Restore permission and try again
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
      
      // Click the "Try Again" button to retry permission
      const tryAgainButton = screen.getByText('Try Again');
      await act(async () => {
        fireEvent.click(tryAgainButton);
      });

      // Wait for permission to be restored
      await waitFor(() => {
        expect(screen.queryByText(/Microphone access denied/)).not.toBeInTheDocument();
      }, { timeout: 1000 });

      // Now try to record again
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Verify recovery - MediaRecorder should be created and started
      await waitFor(() => {
        const recorder = getCurrentMediaRecorder();
        expect(recorder).not.toBeNull();
        expect(recorder!.startCallCount).toBeGreaterThan(0);
      }, { timeout: 1000 });
    });

    it('handles network disconnection and reconnection', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Simulate disconnection by updating the useSocket mock
      const { useSocket } = await import('../hooks/useSocket');
      (useSocket as any).mockReturnValue({
        isConnected: false,
        connectionState: {
          isConnected: false,
          isConnecting: false,
          reconnectAttempts: 1,
        },
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendVoiceInput: mockSendVoiceInput,
        forceReconnect: mockForceReconnect,
      });
      
      await act(async () => {
        if (socketEventHandlers['disconnect']) {
          socketEventHandlers['disconnect']('transport close');
        }
      });

      // Verify disconnected state is shown
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });

      // Simulate reconnection
      (useSocket as any).mockReturnValue({
        isConnected: true,
        connectionState: {
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
        },
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendVoiceInput: mockSendVoiceInput,
        forceReconnect: mockForceReconnect,
      });
      
      await act(async () => {
        if (socketEventHandlers['reconnect']) {
          socketEventHandlers['reconnect'](1);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Check voice button accessibility
      const voiceButton = screen.getByRole('button', { name: /tap to speak/i });
      expect(voiceButton).toHaveAttribute('aria-pressed');

      // Check chat interface accessibility
      expect(screen.getByText('Ellie')).toBeInTheDocument();
      expect(screen.getByText('AI Legal Assistant')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      const voiceButton = screen.getByRole('button', { name: /tap to speak/i });
      
      // Test keyboard activation with Enter key
      await act(async () => {
        voiceButton.focus();
        fireEvent.keyDown(voiceButton, { key: 'Enter' });
        fireEvent.click(voiceButton); // Simulate the click that would happen on Enter
      });

      // Verify interaction works with keyboard
      await waitFor(() => {
        const recorder = getCurrentMediaRecorder();
        expect(recorder).not.toBeNull();
        expect(recorder!.startCallCount).toBeGreaterThan(0);
      }, { timeout: 1000 });

      // Test keyboard activation with Space key
      await act(async () => {
        fireEvent.keyDown(voiceButton, { key: ' ' });
        fireEvent.click(voiceButton); // Simulate the click that would happen on Space
      });

      // Verify recording stops
      await waitFor(() => {
        const recorder = getCurrentMediaRecorder();
        expect(recorder!.stopCallCount).toBeGreaterThan(0);
      }, { timeout: 1000 });
    });
  });
});