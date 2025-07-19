import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VoiceInterface from './VoiceInterface';
import { VoiceState } from '../types';

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  state: string = 'inactive';
  mimeType: string = 'audio/webm';

  constructor(stream: MediaStream, options?: any) {
    this.mimeType = options?.mimeType || 'audio/webm';
  }

  start = vi.fn(() => {
    this.state = 'recording';
  });

  stop = vi.fn(() => {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  });

  requestData = vi.fn();
}

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
const mockStream = {
  getTracks: vi.fn(() => [
    { stop: vi.fn() }
  ])
};

// Mock navigator
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
});

Object.defineProperty(global.navigator, 'permissions', {
  value: {
    query: vi.fn()
  },
  writable: true
});

// Mock window.MediaRecorder
Object.defineProperty(global.window, 'MediaRecorder', {
  value: MockMediaRecorder,
  writable: true
});

describe('VoiceInterface', () => {
  const mockOnVoiceInput = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    onVoiceInput: mockOnVoiceInput,
    onError: mockOnError,
    voiceState: VoiceState.IDLE
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
    
    // Reset navigator.mediaDevices mock
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia
      },
      writable: true
    });
    
    // Reset navigator.permissions mock
    Object.defineProperty(global.navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' })
      },
      writable: true
    });
    
    // Reset MediaRecorder mock
    Object.defineProperty(global.window, 'MediaRecorder', {
      value: MockMediaRecorder,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders microphone button with correct initial state', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label', 'Tap to Speak');
        expect(screen.getByText('Tap to Speak')).toBeInTheDocument();
      });
    });

    it('displays correct text for different voice states', () => {
      const { rerender } = render(<VoiceInterface {...defaultProps} />);
      
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.LISTENING} />);
      expect(screen.getByText('Listening...')).toBeInTheDocument();
      
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.SPEAKING} />);
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
      
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.ERROR} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows voice state indicator with correct status', () => {
      const { rerender } = render(<VoiceInterface {...defaultProps} />);
      
      expect(screen.getByText('idle')).toBeInTheDocument();
      
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.LISTENING} />);
      expect(screen.getByText('listening')).toBeInTheDocument();
    });

    it('disables button when disabled prop is true', async () => {
      render(<VoiceInterface {...defaultProps} disabled={true} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Microphone Permissions', () => {
    it('checks microphone permission on mount', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'microphone' });
      });
    });

    it('displays error when microphone permission is denied', async () => {
      (navigator.permissions.query as any).mockResolvedValue({
        state: 'denied'
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
      });
    });

    it('handles browsers without permissions API', async () => {
      // Remove permissions API
      Object.defineProperty(global.navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      render(<VoiceInterface {...defaultProps} />);
      
      // When permissions API is not available, the component should still work
      // but may show an error message. The button should still be functional
      // after the initial permission check settles
      await waitFor(() => {
        // The component should show an error about checking permissions
        expect(screen.getByText(/Unable to check microphone permissions/)).toBeInTheDocument();
        
        // But the button should still be present (though may be disabled due to error)
        const micButton = screen.getByLabelText('Tap to Speak');
        expect(micButton).toBeInTheDocument();
      });
    });

    it('displays error when mediaDevices is not supported', async () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Your browser does not support microphone access/)).toBeInTheDocument();
      });
    });
  });

  describe('Recording Functionality', () => {
    it('starts recording when microphone button is clicked', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      });
      
      expect(screen.getByText('Recording...')).toBeInTheDocument();
    });

    it('stops recording when button is clicked while recording', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      // Start recording
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument();
      });
      
      // Stop recording
      await act(async () => {
        fireEvent.click(button);
      });
      
      expect(screen.getByText('Tap to Speak')).toBeInTheDocument();
    });

    it('calls onVoiceInput when recording stops with audio data', async () => {
      // Create a more realistic MediaRecorder mock that captures callbacks
      let capturedMediaRecorder: MockMediaRecorder | null = null;
      const OriginalMockMediaRecorder = MockMediaRecorder;
      
      class TestMediaRecorder extends OriginalMockMediaRecorder {
        constructor(stream: MediaStream, options?: any) {
          super(stream, options);
          capturedMediaRecorder = this;
        }
      }
      
      Object.defineProperty(global.window, 'MediaRecorder', {
        value: TestMediaRecorder,
        writable: true
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      // Start recording
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument();
        expect(capturedMediaRecorder).not.toBeNull();
      });
      
      // Simulate MediaRecorder data available
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      
      await act(async () => {
        if (capturedMediaRecorder?.ondataavailable) {
          capturedMediaRecorder.ondataavailable({ data: mockBlob });
        }
        
        // Stop recording
        fireEvent.click(button);
        
        // Simulate stop event which should trigger onVoiceInput
        if (capturedMediaRecorder?.onstop) {
          capturedMediaRecorder.onstop();
        }
      });
      
      await waitFor(() => {
        expect(mockOnVoiceInput).toHaveBeenCalledWith(expect.any(Blob));
      });
    });

    it('handles getUserMedia errors appropriately', async () => {
      const notAllowedError = new Error('Permission denied');
      notAllowedError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(notAllowedError);

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('handles different getUserMedia error types', async () => {
      const testCases = [
        { name: 'NotFoundError', expectedMessage: /No microphone found/ },
        { name: 'NotReadableError', expectedMessage: /Microphone is being used by another application/ },
        { name: 'UnknownError', expectedMessage: /Microphone error/ }
      ];

      for (const testCase of testCases) {
        const error = new Error('Test error');
        error.name = testCase.name;
        mockGetUserMedia.mockRejectedValue(error);

        const { unmount } = render(<VoiceInterface {...defaultProps} />);
        
        const button = screen.getByLabelText('Tap to Speak');
        
        await act(async () => {
          fireEvent.click(button);
        });
        
        await waitFor(() => {
          expect(screen.getByText(testCase.expectedMessage)).toBeInTheDocument();
        });
        
        unmount();
        vi.clearAllMocks();
      }
    });
  });

  describe('State Management', () => {
    it('prevents recording when in processing state', async () => {
      render(<VoiceInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Processing...');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(mockGetUserMedia).not.toHaveBeenCalled();
      });
    });

    it('prevents recording when in speaking state', async () => {
      render(<VoiceInterface {...defaultProps} voiceState={VoiceState.SPEAKING} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Speaking...');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(mockGetUserMedia).not.toHaveBeenCalled();
      });
    });

    it('shows correct button styles for different states', async () => {
      const { rerender } = render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        // Idle state
        expect(button).toHaveClass('bg-blue-500');
      });
      
      // Processing state
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      await waitFor(() => {
        const button = screen.getByLabelText('Processing...');
        expect(button).toHaveClass('bg-yellow-500');
      });
      
      // Speaking state
      rerender(<VoiceInterface {...defaultProps} voiceState={VoiceState.SPEAKING} />);
      await waitFor(() => {
        const button = screen.getByLabelText('Speaking...');
        expect(button).toHaveClass('bg-green-500');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toHaveAttribute('aria-label', 'Tap to Speak');
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('updates ARIA pressed state when recording', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('has focus ring for keyboard navigation', async () => {
      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toHaveClass('focus:ring-4', 'focus:ring-blue-300');
      });
    });
  });

  describe('Cleanup', () => {
    it('stops recording and cleans up streams on unmount', async () => {
      // Create a mock stream with spy functions
      const mockTrack = { stop: vi.fn() };
      const testMockStream = {
        getTracks: vi.fn(() => [mockTrack])
      };
      mockGetUserMedia.mockResolvedValue(testMockStream);

      const { unmount } = render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument();
      });
      
      unmount();
      
      // Verify cleanup was called
      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles MediaRecorder not supported', async () => {
      // Remove MediaRecorder support
      Object.defineProperty(global.window, 'MediaRecorder', {
        value: undefined,
        writable: true
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Audio recording is not supported in your browser');
      });
    });

    it('handles MediaRecorder errors during recording', async () => {
      // Create a MediaRecorder mock that captures the instance
      let capturedMediaRecorder: MockMediaRecorder | null = null;
      const OriginalMockMediaRecorder = MockMediaRecorder;
      
      class ErrorTestMediaRecorder extends OriginalMockMediaRecorder {
        constructor(stream: MediaStream, options?: any) {
          super(stream, options);
          capturedMediaRecorder = this;
        }
      }
      
      Object.defineProperty(global.window, 'MediaRecorder', {
        value: ErrorTestMediaRecorder,
        writable: true
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        const button = screen.getByLabelText('Tap to Speak');
        expect(button).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText('Tap to Speak');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument();
        expect(capturedMediaRecorder).not.toBeNull();
      });
      
      // Simulate MediaRecorder error on the actual instance
      await act(async () => {
        if (capturedMediaRecorder?.onerror) {
          capturedMediaRecorder.onerror(new Event('error'));
        }
      });
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Recording failed. Please try again.');
      });
    });

    it('shows retry button for permission errors', async () => {
      (navigator.permissions.query as any).mockResolvedValue({
        state: 'denied'
      });

      render(<VoiceInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(navigator.permissions.query).toHaveBeenCalledTimes(2);
    });
  });
});