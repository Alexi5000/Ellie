import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { socketService } from './socketService';
import { AudioResponse, ErrorResponse, VoiceState } from '../types';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('SocketService', () => {
  let mockSocket: any;
  
  beforeEach(() => {
    // Create mock socket instance
    mockSocket = {
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
    
    // Mock io function to return our mock socket
    (io as any).mockReturnValue(mockSocket);
    
    // Reset service state
    socketService.disconnect();
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketService.disconnect();
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      const state = socketService.getConnectionState();
      expect(state.isConnected).toBe(false);
      expect(state.isConnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should connect successfully', async () => {
      const connectPromise = socketService.connect();
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(socketService.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const connectPromise = socketService.connect();
      
      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )[1];
      const error = new Error('Connection failed');
      errorHandler(error);
      
      await expect(connectPromise).rejects.toThrow('Connection failed');
      expect(socketService.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      // First connect normally
      const connectPromise1 = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise1;
      
      // Try to connect again - should resolve immediately
      const connectPromise2 = socketService.connect();
      await expect(connectPromise2).resolves.toBeUndefined();
      
      // Should only have called io once
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should disconnect properly', async () => {
      // First connect
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise;
      
      // Then disconnect
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.isConnected()).toBe(false);
    });

    it('should force reconnect', async () => {
      // First connect
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise;
      
      // Then force reconnect
      socketService.forceReconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise;
    });

    it('should handle ai-response events', () => {
      const mockResponse: AudioResponse = {
        text: 'Hello, how can I help you?',
        audioBuffer: new ArrayBuffer(1024),
        confidence: 0.95,
        processingTime: 1500,
      };

      const handler = vi.fn();
      socketService.on('ai-response', handler);

      // Simulate receiving ai-response event
      const aiResponseHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'ai-response'
      )[1];
      aiResponseHandler(mockResponse);

      expect(handler).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle error events', () => {
      const mockError: ErrorResponse = {
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process audio',
          timestamp: new Date(),
          requestId: 'req-123',
        },
      };

      const handler = vi.fn();
      socketService.on('error', handler);

      // Simulate receiving error event
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      )[1];
      errorHandler(mockError);

      expect(handler).toHaveBeenCalledWith(mockError);
    });

    it('should handle status events', () => {
      const mockStatus = {
        state: VoiceState.PROCESSING,
        message: 'Processing your request...',
      };

      const handler = vi.fn();
      socketService.on('status', handler);

      // Simulate receiving status event
      const statusHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'status'
      )[1];
      statusHandler(mockStatus);

      expect(handler).toHaveBeenCalledWith(mockStatus);
    });

    it('should handle disconnect events', () => {
      const handler = vi.fn();
      socketService.on('disconnect', handler);

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )[1];
      mockSocket.connected = false;
      disconnectHandler('transport close');

      expect(handler).toHaveBeenCalledWith('transport close');
      expect(socketService.isConnected()).toBe(false);
    });

    it('should handle reconnection events', () => {
      const reconnectHandler = vi.fn();
      const reconnectAttemptHandler = vi.fn();
      
      socketService.on('reconnect', reconnectHandler);
      socketService.on('reconnect_attempt', reconnectAttemptHandler);

      // Simulate reconnect attempt
      const attemptHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )[1];
      attemptHandler(2);

      expect(reconnectAttemptHandler).toHaveBeenCalledWith(2);

      // Simulate successful reconnect
      const successHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect'
      )[1];
      mockSocket.connected = true;
      successHandler(2);

      expect(reconnectHandler).toHaveBeenCalledWith(2);
      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('Voice Input', () => {
    beforeEach(async () => {
      const connectPromise = socketService.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise;
    });

    it('should send voice input when connected', () => {
      const audioData = new ArrayBuffer(1024);
      socketService.sendVoiceInput(audioData);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('voice-input', audioData);
    });

    it('should throw error when sending voice input while disconnected', () => {
      mockSocket.connected = false;
      const audioData = new ArrayBuffer(1024);
      
      expect(() => socketService.sendVoiceInput(audioData)).toThrow('Socket not connected');
    });
  });

  describe('Event Listener Management', () => {
    it('should add and remove event listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // Add listeners
      const unsubscribe1 = socketService.on('ai-response', handler1);
      const unsubscribe2 = socketService.on('ai-response', handler2);

      // Remove one listener
      unsubscribe1();

      // Simulate event - only handler2 should be called
      const mockResponse: AudioResponse = {
        text: 'Test response',
        audioBuffer: new ArrayBuffer(512),
        confidence: 0.9,
        processingTime: 1000,
      };

      // We need to connect first to set up the socket event handlers
      socketService.connect();
      const aiResponseHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'ai-response'
      )[1];
      aiResponseHandler(mockResponse);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(mockResponse);

      // Remove remaining listener
      unsubscribe2();
    });

    it('should handle errors in event listeners gracefully', () => {
      const faultyHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      socketService.on('ai-response', faultyHandler);
      socketService.on('ai-response', goodHandler);

      // Connect and simulate event
      socketService.connect();
      const aiResponseHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'ai-response'
      )[1];
      
      const mockResponse: AudioResponse = {
        text: 'Test response',
        audioBuffer: new ArrayBuffer(512),
        confidence: 0.9,
        processingTime: 1000,
      };

      // Should not throw, and good handler should still be called
      expect(() => aiResponseHandler(mockResponse)).not.toThrow();
      expect(goodHandler).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('Connection State Tracking', () => {
    it('should track connection state correctly', async () => {
      // Initial state
      let state = socketService.getConnectionState();
      expect(state.isConnected).toBe(false);
      expect(state.isConnecting).toBe(false);

      // During connection
      const connectPromise = socketService.connect();
      state = socketService.getConnectionState();
      expect(state.isConnecting).toBe(true);

      // After successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];
      mockSocket.connected = true;
      connectHandler();
      await connectPromise;

      state = socketService.getConnectionState();
      expect(state.isConnected).toBe(true);
      expect(state.isConnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should track reconnection attempts', () => {
      socketService.connect();
      
      // Simulate reconnection attempts
      const attemptHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )[1];
      attemptHandler(3);

      const state = socketService.getConnectionState();
      expect(state.reconnectAttempts).toBe(3);
    });

    it('should track last error', async () => {
      const connectPromise = socketService.connect();
      
      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )[1];
      const error = new Error('Network error');
      errorHandler(error);

      try {
        await connectPromise;
      } catch (e) {
        // Expected to throw
      }

      const state = socketService.getConnectionState();
      expect(state.lastError).toBe('Network error');
    });
  });
});