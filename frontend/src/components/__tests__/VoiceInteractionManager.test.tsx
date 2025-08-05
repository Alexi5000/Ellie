import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VoiceInteractionManager from '../VoiceInteractionManager';
import { useVoiceInteraction } from '../../hooks/useVoiceInteraction';
import { VoiceState } from '../../types';
import { ErrorProvider } from '../../contexts/ErrorContext';

// Mock the useVoiceInteraction hook
vi.mock('../../hooks/useVoiceInteraction');

// Mock the useNetworkStatus hook
vi.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
    connectionType: 'wifi',
    effectiveType: '4g'
  })
}));

// Mock the VoiceInterface and ChatInterface components
vi.mock('../VoiceInterface', () => ({
  VoiceInterface: ({ onVoiceInput, onError, voiceState, disabled }: any) => (
    <div data-testid="voice-interface">
      <button
        data-testid="voice-button"
        onClick={() => {
          const mockBlob = new Blob(['test audio'], { type: 'audio/wav' });
          onVoiceInput(mockBlob);
        }}
        disabled={disabled}
      >
        Voice Button - {voiceState}
      </button>
      <button
        data-testid="error-button"
        onClick={() => onError('Test error')}
      >
        Trigger Error
      </button>
    </div>
  )
}));

vi.mock('../ChatInterface', () => ({
  ChatInterface: ({ messages, voiceState, onPlayAudio, onClearConversation }: any) => (
    <div data-testid="chat-interface">
      <div data-testid="voice-state">{voiceState}</div>
      <div data-testid="message-count">{messages.length}</div>
      <button
        data-testid="play-audio-button"
        onClick={() => onPlayAudio('test-audio-url')}
      >
        Play Audio
      </button>
      <button
        data-testid="clear-conversation-button"
        onClick={onClearConversation}
      >
        Clear Conversation
      </button>
      {messages.map((msg: any, index: number) => (
        <div key={index} data-testid={`message-${index}`}>
          {msg.content}
        </div>
      ))}
    </div>
  )
}));

const mockUseVoiceInteraction = vi.mocked(useVoiceInteraction);

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

describe('VoiceInteractionManager', () => {
  const mockHandleVoiceInput = vi.fn();
  const mockHandlePlayAudio = vi.fn();
  const mockHandleClearConversation = vi.fn();
  const mockHandleRetryConnection = vi.fn();
  const mockOnError = vi.fn();

  const defaultMockReturn = {
    messages: [],
    voiceState: VoiceState.IDLE,
    isConnected: true,
    isInitialized: true,
    connectionError: null,
    handleVoiceInput: mockHandleVoiceInput,
    handlePlayAudio: mockHandlePlayAudio,
    handleClearConversation: mockHandleClearConversation,
    handleRetryConnection: mockHandleRetryConnection,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVoiceInteraction.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders voice interface and chat interface when initialized', () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByTestId('voice-interface')).toBeInTheDocument();
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
      expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
      expect(screen.getByText('Click the microphone and speak naturally')).toBeInTheDocument();
    });

    it('shows connected status when socket is connected', () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows disconnected status when socket is not connected', () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        isConnected: false,
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('handles voice input correctly', async () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const voiceButton = screen.getByTestId('voice-button');
      fireEvent.click(voiceButton);

      await waitFor(() => {
        expect(mockHandleVoiceInput).toHaveBeenCalledTimes(1);
        expect(mockHandleVoiceInput).toHaveBeenCalledWith(
          expect.any(Blob)
        );
      });
    });

    it('handles audio playback correctly', async () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const playAudioButton = screen.getByTestId('play-audio-button');
      fireEvent.click(playAudioButton);

      await waitFor(() => {
        expect(mockHandlePlayAudio).toHaveBeenCalledTimes(1);
        expect(mockHandlePlayAudio).toHaveBeenCalledWith('test-audio-url');
      });
    });

    it('handles conversation clearing correctly', async () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const clearButton = screen.getByTestId('clear-conversation-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockHandleClearConversation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state when not initialized', () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        isInitialized: false,
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByText('Connecting to voice service...')).toBeInTheDocument();
      expect(screen.queryByTestId('voice-interface')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows connection error state when there is a connection error', () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        isConnected: false,
        connectionError: 'Unable to connect after multiple attempts. Please check your internet connection.',
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect after multiple attempts. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('Retry Connection')).toBeInTheDocument();
    });

    it('handles retry connection correctly', async () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        isConnected: false,
        connectionError: 'Unable to connect after multiple attempts. Please check your internet connection.',
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const retryButton = screen.getByText('Retry Connection');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockHandleRetryConnection).toHaveBeenCalledTimes(1);
      });
    });

    it('passes error handler to voice interface', () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const errorButton = screen.getByTestId('error-button');
      fireEvent.click(errorButton);

      expect(mockOnError).toHaveBeenCalledWith('Test error');
    });

    it('provides default error handler when none provided', () => {
      renderWithContext(<VoiceInteractionManager />);

      const errorButton = screen.getByTestId('error-button');
      
      // Should not throw error when clicking
      expect(() => fireEvent.click(errorButton)).not.toThrow();
    });
  });

  describe('Voice State Management', () => {
    it('displays current voice state in chat interface', () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        voiceState: VoiceState.PROCESSING,
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByTestId('voice-state')).toHaveTextContent('processing');
    });

    it('disables voice interface when not connected', () => {
      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        isConnected: false,
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const voiceButton = screen.getByTestId('voice-button');
      expect(voiceButton).toBeDisabled();
    });

    it('enables voice interface when connected', () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      const voiceButton = screen.getByTestId('voice-button');
      expect(voiceButton).not.toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('displays messages in chat interface', () => {
      const mockMessages = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user' as const,
          content: 'Hello Ellie',
          metadata: {}
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'assistant' as const,
          content: 'Hello! How can I help you?',
          metadata: {}
        }
      ];

      mockUseVoiceInteraction.mockReturnValue({
        ...defaultMockReturn,
        messages: mockMessages,
      });

      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
      expect(screen.getByTestId('message-0')).toHaveTextContent('Hello Ellie');
      expect(screen.getByTestId('message-1')).toHaveTextContent('Hello! How can I help you?');
    });
  });

  describe('Integration with useVoiceInteraction Hook', () => {
    it('passes correct options to useVoiceInteraction hook', () => {
      renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(mockUseVoiceInteraction).toHaveBeenCalledWith({
        onError: expect.any(Function)
      });
    });

    it('passes undefined onError when not provided', () => {
      renderWithContext(<VoiceInteractionManager />);

      expect(mockUseVoiceInteraction).toHaveBeenCalledWith({
        onError: expect.any(Function)
      });
    });
  });

  describe('CSS Classes', () => {
    it('applies custom className', () => {
      const { container } = renderWithContext(
        <VoiceInteractionManager className="custom-class" onError={mockOnError} />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies default className when none provided', () => {
      const { container } = renderWithContext(<VoiceInteractionManager onError={mockOnError} />);

      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'lg:flex-row');
    });
  });
});