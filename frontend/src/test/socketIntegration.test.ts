import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useSocket, useSocketAIResponse, useSocketError, useSocketStatus } from '../hooks/useSocket';
import { socketService } from '../services/socketService';
import { AudioResponse, ErrorResponse, VoiceState } from '../types';

// Mock socket.io-client for integration testing
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('Socket Integration Tests', () => {
  let mockSocket: any;
  let eventHandlers: Map<string, Function>;
  
  beforeEach(() => {
    eventHandlers = new Map();
    
    // Create comprehensive mock socket
    mockSocket = {
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: Function) => {
        eventHandlers.set(event, handler);
      }),
      off: vi.fn(),
    };
    
    (io as any).mockReturnValue(mockSocket);
    
    // Reset service state
    socketService.disconnect();
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketService.disconnect();
  });

  describe('Complete Voice Interaction Flow', () => {
    it('should handle complete voice interaction workflow', async () => {
      // Set up hooks
      const aiResponseHandler = vi.fn();
      const errorHandler = vi.fn();
      const statusHandler = vi.fn();
      
      const { result: socketResult } = renderHook(() => useSocket());
      renderHook(() => useSocketAIResponse(aiResponseHandler));
      renderHook(() => useSocketError(errorHandler));
      renderHook(() => useSocketStatus(statusHandler));
      
      // Step 1: Connect to socket
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      // Simulate successful connection
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      expect(socketResult.current.isConnected).toBe(true);
      
      // Step 2: Send voice input
      const audioData = new ArrayBuffer(1024);
      act(() => {
        socketResult.current.sendVoiceInput(audioData);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('voice-input', audioData);
      
      // Step 3: Receive status update (processing)
      const processingStatus = {
        state: VoiceState.PROCESSING,
        message: 'Processing your voice input...',
      };
      
      act(() => {
        eventHandlers.get('status')?.(processingStatus);
      });
      
      expect(statusHandler).toHaveBeenCalledWith(processingStatus);
      
      // Step 4: Receive AI response
      const aiResponse: AudioResponse = {
        text: 'Hello! How can I help you with your legal questions today?',
        audioBuffer: new ArrayBuffer(2048),
        confidence: 0.95,
        processingTime: 1500,
      };
      
      act(() => {
        eventHandlers.get('ai-response')?.(aiResponse);
      });
      
      expect(aiResponseHandler).toHaveBeenCalledWith(aiResponse);
      
      // Step 5: Receive final status (idle)
      const idleStatus = {
        state: VoiceState.IDLE,
        message: 'Ready for next input',
      };
      
      act(() => {
        eventHandlers.get('status')?.(idleStatus);
      });
      
      expect(statusHandler).toHaveBeenCalledWith(idleStatus);
    });

    it('should handle error scenarios in voice workflow', async () => {
      const errorHandler = vi.fn();
      const statusHandler = vi.fn();
      
      const { result: socketResult } = renderHook(() => useSocket());
      renderHook(() => useSocketError(errorHandler));
      renderHook(() => useSocketStatus(statusHandler));
      
      // Connect
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Send voice input
      const audioData = new ArrayBuffer(1024);
      act(() => {
        socketResult.current.sendVoiceInput(audioData);
      });
      
      // Simulate processing error
      const errorResponse: ErrorResponse = {
        error: {
          code: 'AUDIO_PROCESSING_ERROR',
          message: 'Failed to process audio input',
          details: { reason: 'Invalid audio format' },
          timestamp: new Date(),
          requestId: 'req-456',
        },
      };
      
      act(() => {
        eventHandlers.get('error')?.(errorResponse);
      });
      
      expect(errorHandler).toHaveBeenCalledWith(errorResponse);
      
      // Should receive error status
      const errorStatus = {
        state: VoiceState.ERROR,
        message: 'Audio processing failed',
      };
      
      act(() => {
        eventHandlers.get('status')?.(errorStatus);
      });
      
      expect(statusHandler).toHaveBeenCalledWith(errorStatus);
    });
  });

  describe('Connection Resilience', () => {
    it('should handle connection drops and reconnection', async () => {
      const { result: socketResult } = renderHook(() => useSocket());
      
      // Initial connection
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      expect(socketResult.current.isConnected).toBe(true);
      
      // Simulate connection drop
      act(() => {
        mockSocket.connected = false;
        eventHandlers.get('disconnect')?.('transport close');
      });
      
      expect(socketResult.current.isConnected).toBe(false);
      
      // Simulate reconnection attempts
      act(() => {
        eventHandlers.get('reconnect_attempt')?.(1);
      });
      
      act(() => {
        eventHandlers.get('reconnect_attempt')?.(2);
      });
      
      // Simulate successful reconnection
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('reconnect')?.(2);
      });
      
      expect(socketResult.current.isConnected).toBe(true);
      expect(socketResult.current.connectionState.reconnectAttempts).toBe(2);
    });

    it('should handle reconnection failures', async () => {
      const { result: socketResult } = renderHook(() => useSocket());
      
      // Initial connection
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Simulate connection drop
      act(() => {
        mockSocket.connected = false;
        eventHandlers.get('disconnect')?.('transport error');
      });
      
      // Simulate reconnection errors
      const reconnectError = new Error('Network unreachable');
      act(() => {
        eventHandlers.get('reconnect_error')?.(reconnectError);
      });
      
      // Simulate final reconnection failure
      act(() => {
        eventHandlers.get('reconnect_failed')?.();
      });
      
      expect(socketResult.current.isConnected).toBe(false);
      expect(socketResult.current.connectionState.lastError).toContain('Failed to reconnect');
    });

    it('should handle force reconnection', async () => {
      const { result: socketResult } = renderHook(() => useSocket());
      
      // Initial connection
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Force reconnection
      act(() => {
        socketResult.current.forceReconnect();
      });
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  describe('Multiple Event Handlers', () => {
    it('should handle multiple listeners for the same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      const { result: socketResult } = renderHook(() => useSocket());
      renderHook(() => useSocketAIResponse(handler1));
      renderHook(() => useSocketAIResponse(handler2));
      renderHook(() => useSocketAIResponse(handler3));
      
      // Connect
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Simulate AI response
      const aiResponse: AudioResponse = {
        text: 'Test response',
        audioBuffer: new ArrayBuffer(512),
        confidence: 0.9,
        processingTime: 1000,
      };
      
      act(() => {
        eventHandlers.get('ai-response')?.(aiResponse);
      });
      
      // All handlers should be called
      expect(handler1).toHaveBeenCalledWith(aiResponse);
      expect(handler2).toHaveBeenCalledWith(aiResponse);
      expect(handler3).toHaveBeenCalledWith(aiResponse);
    });

    it('should handle event handler errors gracefully', async () => {
      const faultyHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();
      
      const { result: socketResult } = renderHook(() => useSocket());
      renderHook(() => useSocketAIResponse(faultyHandler));
      renderHook(() => useSocketAIResponse(goodHandler));
      
      // Connect
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Simulate AI response
      const aiResponse: AudioResponse = {
        text: 'Test response',
        audioBuffer: new ArrayBuffer(512),
        confidence: 0.9,
        processingTime: 1000,
      };
      
      // Should not throw and good handler should still work
      expect(() => {
        act(() => {
          eventHandlers.get('ai-response')?.(aiResponse);
        });
      }).not.toThrow();
      
      expect(goodHandler).toHaveBeenCalledWith(aiResponse);
    });
  });

  describe('Voice Input Edge Cases', () => {
    it('should handle large audio data', async () => {
      const { result: socketResult } = renderHook(() => useSocket());
      
      // Connect
      const connectPromise = act(async () => {
        await socketResult.current.connect();
      });
      
      act(() => {
        mockSocket.connected = true;
        eventHandlers.get('connect')?.();
      });
      
      await connectPromise;
      
      // Send large audio data (10MB)
      const largeAudioData = new ArrayBuffer(10 * 1024 * 1024);
      
      act(() => {
        socketResult.current.sendVoiceInput(largeAudioData);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('voice-input', largeAudioData);
    });

    it('should prevent sending voice input when disconnected', () => {
      const { result: socketResult } = renderHook(() => useSocket());
      
      const audioData = new ArrayBuffer(1024);
      
      expect(() => {
        act(() => {
          socketResult.current.sendVoiceInput(audioData);
        });
      }).toThrow('Socket not connected');
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});