import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket, useSocketAIResponse, useSocketError, useSocketStatus } from './useSocket';
import { Message, VoiceState, AudioResponse, ErrorResponse } from '../types';
import { useRetry } from './useRetry';
import { useNetworkStatus } from './useNetworkStatus';
import { v4 as uuidv4 } from 'uuid';

export interface UseVoiceInteractionReturn {
  // State
  messages: Message[];
  voiceState: VoiceState;
  isConnected: boolean;
  isInitialized: boolean;
  connectionError: string | null;
  
  // Actions
  handleVoiceInput: (audioBlob: Blob) => Promise<void>;
  handlePlayAudio: (audioUrl: string) => void;
  handleClearConversation: () => void;
  handleRetryConnection: () => Promise<void>;
  
  // Error handling
  onError?: (error: string) => void;
}

export interface UseVoiceInteractionOptions {
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

export function useVoiceInteraction(options: UseVoiceInteractionOptions = {}): UseVoiceInteractionReturn {
  const { onError, autoConnect = true } = options;

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.IDLE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Audio management
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef<Set<string>>(new Set());

  // Socket connection
  const { isConnected, connect, sendVoiceInput, forceReconnect } = useSocket();
  
  // Network status monitoring
  const networkStatus = useNetworkStatus();

  // Retry logic for connection
  const {
    executeWithRetry: connectWithRetry,
    isRetrying: isRetryingConnection,
    attempt: connectionAttempt,
  } = useRetry(connect, {
    maxAttempts: 3,
    initialDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Connection retry attempt ${attempt}:`, error.message);
      onError?.(`Connection failed. Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max connection attempts reached:', error);
      setConnectionError('Unable to connect after multiple attempts. Please check your internet connection.');
      onError?.('Connection failed after multiple attempts. Please try again later.');
    },
  });

  // Handle errors
  const handleVoiceError = useCallback((errorMessage: string) => {
    setVoiceState(VoiceState.ERROR);
    onError?.(errorMessage);

    // Add error message to chat
    const errorMsg: Message = {
      id: uuidv4(),
      timestamp: new Date(),
      type: 'assistant',
      content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
      metadata: {}
    };

    setMessages(prev => [...prev, errorMsg]);

    // Reset to idle after a delay
    setTimeout(() => {
      setVoiceState(VoiceState.IDLE);
    }, 3000);
  }, [onError]);

  // Retry logic for voice input
  const {
    executeWithRetry: sendVoiceInputWithRetry,
    isRetrying: isRetryingVoiceInput,
  } = useRetry(
    async (arrayBuffer: ArrayBuffer) => {
      if (!isConnected) {
        throw new Error('Not connected to voice service');
      }
      return sendVoiceInput(arrayBuffer);
    },
    {
      maxAttempts: 2,
      initialDelay: 500,
      onRetry: (attempt, error) => {
        console.log(`Voice input retry attempt ${attempt}:`, error.message);
        setVoiceState(VoiceState.PROCESSING);
      },
      onMaxAttemptsReached: (error) => {
        console.error('Voice input failed after retries:', error);
        handleVoiceError('Failed to send voice input after multiple attempts');
      },
    }
  );

  // Initialize connection
  useEffect(() => {
    if (autoConnect && !isInitialized) {
      initializeConnection();
    }

    return () => {
      cleanup();
    };
  }, [autoConnect, isInitialized]);

  const initializeConnection = useCallback(async () => {
    try {
      await connectWithRetry();
      setIsInitialized(true);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      const errorMessage = 'Failed to connect to voice service. Please try again.';
      setConnectionError(errorMessage);
      setVoiceState(VoiceState.ERROR);
      onError?.(errorMessage);
    }
  }, [connectWithRetry, onError]);

  const cleanup = useCallback(() => {
    // Cleanup audio URLs
    audioUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    audioUrlsRef.current.clear();
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  // Handle AI responses
  useSocketAIResponse(
    useCallback((response: AudioResponse) => {
      try {
        // Create audio URL from buffer
        const audioBlob = new Blob([response.audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlsRef.current.add(audioUrl);

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          timestamp: new Date(),
          type: 'assistant',
          content: response.text,
          audioUrl,
          metadata: {
            confidence: response.confidence,
            processingTime: response.processingTime,
            audioFormat: 'audio/mpeg'
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        setVoiceState(VoiceState.SPEAKING);

        // Auto-play the response
        playAudioResponse(audioUrl);
      } catch (error) {
        console.error('Error handling AI response:', error);
        handleVoiceError('Failed to process AI response');
      }
    }, [])
  );

  // Handle socket errors
  useSocketError(
    useCallback((error: ErrorResponse) => {
      console.error('Socket error:', error);
      handleVoiceError(error.error.message || 'An error occurred during voice processing');
    }, [])
  );

  // Handle status updates
  useSocketStatus(
    useCallback((status: { state: VoiceState; message?: string }) => {
      setVoiceState(status.state);
      if (status.message && status.state === VoiceState.ERROR) {
        handleVoiceError(status.message);
      }
    }, [])
  );

  // Handle voice input
  const handleVoiceInput = useCallback(async (audioBlob: Blob) => {
    if (!networkStatus.isOnline) {
      handleVoiceError('You appear to be offline. Please check your internet connection.');
      return;
    }

    if (!isConnected) {
      handleVoiceError('Not connected to voice service');
      return;
    }

    try {
      setVoiceState(VoiceState.PROCESSING);

      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Create user message with audio
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlsRef.current.add(audioUrl);

      const userMessage: Message = {
        id: uuidv4(),
        timestamp: new Date(),
        type: 'user',
        content: 'Voice message (processing...)',
        audioUrl,
        metadata: {
          audioFormat: audioBlob.type,
          transcriptionSource: 'whisper'
        }
      };

      setMessages(prev => [...prev, userMessage]);

      // Send audio data to backend with retry logic
      await sendVoiceInputWithRetry(arrayBuffer);

    } catch (error) {
      console.error('Error processing voice input:', error);
      handleVoiceError('Failed to process voice input');
    }
  }, [isConnected, networkStatus.isOnline, sendVoiceInputWithRetry]);

  // Play audio response
  const playAudioResponse = useCallback(async (audioUrl: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setVoiceState(VoiceState.IDLE);
        currentAudioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setVoiceState(VoiceState.IDLE);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setVoiceState(VoiceState.IDLE);
    }
  }, []);

  // Handle manual audio playback
  const handlePlayAudio = useCallback((audioUrl: string) => {
    playAudioResponse(audioUrl);
  }, [playAudioResponse]);

  // Clear conversation
  const handleClearConversation = useCallback(() => {
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Revoke all audio URLs
    audioUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    audioUrlsRef.current.clear();

    // Clear messages and reset state
    setMessages([]);
    setVoiceState(VoiceState.IDLE);
  }, []);

  // Retry connection
  const handleRetryConnection = useCallback(async () => {
    try {
      setConnectionError(null);
      setVoiceState(VoiceState.IDLE);
      forceReconnect();
      await connect();
      setIsInitialized(true);
    } catch (error) {
      console.error('Retry connection failed:', error);
      setConnectionError('Failed to reconnect. Please refresh the page.');
    }
  }, [forceReconnect, connect]);

  return {
    // State
    messages,
    voiceState,
    isConnected,
    isInitialized,
    connectionError,
    
    // Actions
    handleVoiceInput,
    handlePlayAudio,
    handleClearConversation,
    handleRetryConnection,
    
    // Error handling
    onError,
  };
}