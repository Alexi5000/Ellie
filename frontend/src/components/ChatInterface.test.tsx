import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChatInterface from './ChatInterface';
import { Message, VoiceState, MessageMetadata } from '../types';

// Mock HTMLAudioElement
class MockAudio {
  src: string = '';
  currentTime: number = 0;
  paused: boolean = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(src?: string) {
    if (src) this.src = src;
  }

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
}

// Mock global Audio constructor
Object.defineProperty(global.window, 'Audio', {
  value: MockAudio,
  writable: true
});

describe('ChatInterface', () => {
  const mockOnPlayAudio = vi.fn();
  const mockOnClearConversation = vi.fn();

  const createMockMessage = (
    id: string,
    type: 'user' | 'assistant',
    content: string,
    audioUrl?: string,
    metadata: Partial<MessageMetadata> = {}
  ): Message => ({
    id,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    type,
    content,
    audioUrl,
    metadata: {
      confidence: 0.95,
      processingTime: 150,
      audioFormat: 'audio/mp3',
      transcriptionSource: 'whisper',
      ...metadata
    }
  });

  const defaultProps = {
    messages: [],
    voiceState: VoiceState.IDLE,
    onPlayAudio: mockOnPlayAudio,
    onClearConversation: mockOnClearConversation
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders empty state when no messages', () => {
      render(<ChatInterface {...defaultProps} />);
      
      expect(screen.getByText('Welcome to Ellie')).toBeInTheDocument();
      expect(screen.getByText(/Hi! I'm Ellie, your AI legal assistant/)).toBeInTheDocument();
      expect(screen.getByText('AI Legal Assistant')).toBeInTheDocument();
    });

    it('renders messages correctly', () => {
      const messages = [
        createMockMessage('1', 'user', 'Hello, I need legal help'),
        createMockMessage('2', 'assistant', 'Hello! I\'d be happy to help you with your legal questions.', 'audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('Hello, I need legal help')).toBeInTheDocument();
      expect(screen.getByText('Hello! I\'d be happy to help you with your legal questions.')).toBeInTheDocument();
    });

    it('displays timestamps correctly', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      // Should display formatted timestamp (the exact format depends on timezone)
      // Just check that a timestamp is displayed
      expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument();
    });

    it('shows processing time when available', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', undefined, { processingTime: 250 })
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('(250ms)')).toBeInTheDocument();
    });

    it('renders clear button when messages exist', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByLabelText('Clear conversation')).toBeInTheDocument();
    });

    it('does not render clear button when no messages', () => {
      render(<ChatInterface {...defaultProps} />);
      
      expect(screen.queryByLabelText('Clear conversation')).not.toBeInTheDocument();
    });
  });

  describe('Voice State Indicators', () => {
    it('shows correct state for idle', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.IDLE} />);
      
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('shows correct state for listening', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.LISTENING} />);
      
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    it('shows correct state for processing', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('shows correct state for speaking', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.SPEAKING} />);
      
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });

    it('shows correct state for error', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.ERROR} />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Typing Indicator', () => {
    it('shows typing indicator when processing', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      
      expect(screen.getByText('Ellie is thinking...')).toBeInTheDocument();
    });

    it('does not show typing indicator when not processing', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.IDLE} />);
      
      expect(screen.queryByText('Ellie is thinking...')).not.toBeInTheDocument();
    });

    it('shows animated dots in typing indicator', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.PROCESSING} />);
      
      // Check for animated dots (they should have animate-bounce class)
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Audio Playback', () => {
    it('renders play button for assistant messages with audio', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    });

    it('does not render play button for user messages', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message', 'audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.queryByLabelText('Play audio')).not.toBeInTheDocument();
    });

    it('does not render play button for assistant messages without audio', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.queryByLabelText('Play audio')).not.toBeInTheDocument();
    });

    it('calls onPlayAudio when play button is clicked', async () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'test-audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const playButton = screen.getByLabelText('Play audio');
      
      await act(async () => {
        fireEvent.click(playButton);
      });
      
      expect(mockOnPlayAudio).toHaveBeenCalledWith('test-audio-url');
    });

    it('changes play button to stop button when playing', async () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'test-audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const playButton = screen.getByLabelText('Play audio');
      
      await act(async () => {
        fireEvent.click(playButton);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Stop audio')).toBeInTheDocument();
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });
    });

    it('stops audio when stop button is clicked', async () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'test-audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      // Start playing
      const playButton = screen.getByLabelText('Play audio');
      await act(async () => {
        fireEvent.click(playButton);
      });
      
      // Stop playing
      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop audio');
        fireEvent.click(stopButton);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
        expect(screen.getByText('Play')).toBeInTheDocument();
      });
    });

    it('displays confidence score when available', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'audio-url', { confidence: 0.87 })
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('87% confidence')).toBeInTheDocument();
    });
  });

  describe('Message Layout', () => {
    it('applies correct styling for user messages', () => {
      const messages = [
        createMockMessage('1', 'user', 'User message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const messageContainer = screen.getByText('User message').closest('.inline-block');
      expect(messageContainer).toHaveClass('bg-blue-500', 'text-white');
    });

    it('applies correct styling for assistant messages', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Assistant message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const messageContainer = screen.getByText('Assistant message').closest('.inline-block');
      expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-900');
    });

    it('displays user messages on the right side', () => {
      const messages = [
        createMockMessage('1', 'user', 'User message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const messageWrapper = screen.getByText('User message').closest('.flex');
      expect(messageWrapper).toHaveClass('flex-row-reverse');
    });

    it('displays assistant messages on the left side', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Assistant message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const messageWrapper = screen.getByText('Assistant message').closest('.flex');
      expect(messageWrapper).not.toHaveClass('flex-row-reverse');
    });
  });

  describe('Conversation Management', () => {
    it('calls onClearConversation when clear button is clicked', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const clearButton = screen.getByLabelText('Clear conversation');
      fireEvent.click(clearButton);
      
      expect(mockOnClearConversation).toHaveBeenCalled();
    });

    it('handles long messages with proper text wrapping', () => {
      const longMessage = 'This is a very long message that should wrap properly and not overflow the container boundaries when displayed in the chat interface.';
      const messages = [
        createMockMessage('1', 'user', longMessage)
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const messageElement = screen.getByText(longMessage);
      expect(messageElement).toHaveClass('whitespace-pre-wrap', 'break-words');
    });

    it('handles multiple messages correctly', () => {
      const messages = [
        createMockMessage('1', 'user', 'First message'),
        createMockMessage('2', 'assistant', 'Second message'),
        createMockMessage('3', 'user', 'Third message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for audio controls', () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    });

    it('has proper ARIA label for clear button', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      expect(screen.getByLabelText('Clear conversation')).toBeInTheDocument();
    });

    it('includes screen reader description', () => {
      render(<ChatInterface {...defaultProps} />);
      
      expect(screen.getByText(/Conversation with Ellie, your AI legal assistant/)).toBeInTheDocument();
    });

    it('provides alternative text for voice state', () => {
      render(<ChatInterface {...defaultProps} voiceState={VoiceState.LISTENING} />);
      
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles audio playback errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock Audio to throw error on play
      const mockAudio = new MockAudio();
      mockAudio.play = vi.fn().mockRejectedValue(new Error('Playback failed'));
      
      Object.defineProperty(global.window, 'Audio', {
        value: vi.fn(() => mockAudio),
        writable: true
      });

      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'test-audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} />);
      
      const playButton = screen.getByLabelText('Play audio');
      
      await act(async () => {
        fireEvent.click(playButton);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error playing audio:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles missing onPlayAudio callback', async () => {
      const messages = [
        createMockMessage('1', 'assistant', 'Test response', 'audio-url')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} onPlayAudio={undefined} />);
      
      // Should not render play button when onPlayAudio is not provided
      expect(screen.queryByLabelText('Play audio')).not.toBeInTheDocument();
    });

    it('handles missing onClearConversation callback', () => {
      const messages = [
        createMockMessage('1', 'user', 'Test message')
      ];

      render(<ChatInterface {...defaultProps} messages={messages} onClearConversation={undefined} />);
      
      // Should not render clear button when onClearConversation is not provided
      expect(screen.queryByLabelText('Clear conversation')).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ChatInterface {...defaultProps} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('maintains default styling when no className provided', () => {
      const { container } = render(<ChatInterface {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });
});