import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VoiceInteractionManager from '../components/VoiceInteractionManager';
import { VoiceState } from '../types';
import { ErrorProvider } from '../contexts/ErrorContext';

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

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-message-id',
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

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  onerror: null,
  mimeType: 'audio/webm',
};

global.MediaRecorder = vi.fn(() => mockMediaRecorder) as any;
global.MediaRecorder.isTypeSupported = vi.fn(() => true);

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
  let socketEventHandlers: Record<string, Function> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    socketEventHandlers = {};
    
    // Setup socket event handler capture
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      socketEventHandlers[event] = handler;
      return vi.fn(); // Return unsubscribe function
    });
    
    mockSocket.connected = true;
    mockMediaRecorder.state = 'inactive';
  });

  afterEach(() => {
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

      // Verify recording started
      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });

      // Simulate recording data and stop
      const mockAudioData = new Blob(['audio data'], { type: 'audio/webm' });
      
      await act(async () => {
        // Simulate data available
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
        }
        
        // Stop recording
        fireEvent.click(voiceButton);
        
        // Simulate recording stop
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop();
        }
      });

      // Verify voice input was sent to socket
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('voice-input', expect.any(ArrayBuffer));
      });

      // Verify user message appears in chat
      await waitFor(() => {
        expect(screen.getByText('Voice message (processing...)')).toBeInTheDocument();
      });

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
      });

      // Verify audio playback was initiated
      expect(global.Audio).toHaveBeenCalledWith('mock-audio-url');
      expect(mockAudio.play).toHaveBeenCalled();

      // Verify no errors occurred
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('handles socket connection errors gracefully', async () => {
      const mockOnError = vi.fn();
      mockSocket.connected = false;
      
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      // Simulate connection error
      await act(async () => {
        if (socketEventHandlers['connect_error']) {
          socketEventHandlers['connect_error'](new Error('Connection failed'));
        }
      });

      // Verify error state is displayed
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText('Retry Connection');
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Verify reconnection attempt
      expect(mockSocket.connect).toHaveBeenCalled();
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
          expect(screen.getByText(stateText)).toBeInTheDocument();
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
      });

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
      });

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
      
      // Mock permission denied
      navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
        new Error('Permission denied')
      );

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      });

      // Try to start recording
      const voiceButton = screen.getByRole('button', { name: /tap to speak/i });
      
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Verify error handling
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // Restore permission and try again
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
      
      await act(async () => {
        fireEvent.click(voiceButton);
      });

      // Verify recovery
      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });
    });

    it('handles network disconnection and reconnection', async () => {
      renderWithContext(<VoiceInteractionManager />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Simulate disconnection
      mockSocket.connected = false;
      
      await act(async () => {
        if (socketEventHandlers['disconnect']) {
          socketEventHandlers['disconnect']('transport close');
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });

      // Simulate reconnection
      mockSocket.connected = true;
      
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
      const voiceButton = screen.getByRole('button', { name: /hold to speak/i });
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

      const voiceButton = screen.getByRole('button', { name: /hold to speak/i });
      
      // Test keyboard activation
      await act(async () => {
        voiceButton.focus();
        fireEvent.keyDown(voiceButton, { key: 'Enter' });
      });

      // Verify interaction works with keyboard
      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled();
      });
    });
  });
});