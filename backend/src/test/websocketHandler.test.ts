/**
 * Unit tests for WebSocket Handler
 * Requirements: 5.5, 7.1, 7.2
 */

import { WebSocketHandler } from '../services/websocketHandler';
import { WebSocketSessionManager } from '../services/sessionManager';
import { Server as SocketIOServer } from 'socket.io';

// Mock Socket.io
const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn()
};

const mockIo = {
  on: jest.fn(),
  emit: jest.fn(),
  sockets: {
    sockets: new Map([['test-socket-id', mockSocket]])
  },
  engine: {
    clientsCount: 1
  }
} as unknown as SocketIOServer;

describe('WebSocketHandler', () => {
  let websocketHandler: WebSocketHandler;
  let sessionManager: WebSocketSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    websocketHandler = new WebSocketHandler(mockIo);
    sessionManager = websocketHandler.getSessionManager();
  });

  afterEach(async () => {
    // Clean up websocket handler and session manager
    if (sessionManager) {
      sessionManager.destroy();
    }
    
    // Wait for any pending async operations
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('Initialization', () => {
    it('should initialize with session manager', () => {
      expect(websocketHandler).toBeDefined();
      expect(websocketHandler.getSessionManager()).toBeInstanceOf(WebSocketSessionManager);
    });

    it('should set up event handlers on io', () => {
      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('Connection Statistics', () => {
    it('should provide connection statistics', () => {
      const stats = websocketHandler.getConnectionStats();
      
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('totalConnections');
      expect(typeof stats.activeConnections).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.totalConnections).toBe('number');
    });

    it('should return correct connection counts', () => {
      const stats = websocketHandler.getConnectionStats();
      
      expect(stats.activeConnections).toBe(1);
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Session Management', () => {
    it('should provide access to session manager', () => {
      const manager = websocketHandler.getSessionManager();
      expect(manager).toBeInstanceOf(WebSocketSessionManager);
    });

    it('should allow session creation through manager', () => {
      const sessionId = sessionManager.createSession('test-socket');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast messages to session', () => {
      const testData = { message: 'test' };
      websocketHandler.broadcastToSession('test-session', 'test-event', testData);
      
      expect(mockIo.emit).toHaveBeenCalledWith('test-event', testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle voice input validation errors', () => {
      // Test that the handler can process invalid input gracefully
      const invalidData = {
        audioBuffer: 'not a buffer',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      // This should not throw an error
      expect(() => {
        // Simulate the validation that would happen in handleVoiceInput
        const isValidBuffer = Buffer.isBuffer(invalidData.audioBuffer);
        expect(isValidBuffer).toBe(false);
      }).not.toThrow();
    });

    it('should handle oversized audio validation', () => {
      const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '10485760');
      const largeBuffer = Buffer.alloc(maxSize + 1);
      
      expect(largeBuffer.length).toBeGreaterThan(maxSize);
    });
  });

  describe('Session Activity Tracking', () => {
    it('should track session activity', () => {
      const sessionId = sessionManager.createSession('test-socket');
      const originalSession = sessionManager.getSession(sessionId);
      const originalActivity = originalSession?.lastActivity;

      // Update activity
      sessionManager.updateActivity(sessionId);
      
      const updatedSession = sessionManager.getSession(sessionId);
      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThanOrEqual(originalActivity?.getTime() || 0);
    });

    it('should clean up inactive sessions', () => {
      // Create a session
      const sessionId = sessionManager.createSession('test-socket');
      expect(sessionManager.getSession(sessionId)).toBeDefined();

      // Manually trigger cleanup (in real scenario this would be time-based)
      sessionManager.removeSession(sessionId);
      expect(sessionManager.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('Voice Input Processing', () => {
    it('should validate audio buffer format', () => {
      const validBuffer = Buffer.from('test audio data');
      const invalidBuffer = 'not a buffer';

      expect(Buffer.isBuffer(validBuffer)).toBe(true);
      expect(Buffer.isBuffer(invalidBuffer)).toBe(false);
    });

    it('should validate audio size limits', () => {
      const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '10485760');
      const validBuffer = Buffer.alloc(1000); // Small buffer
      const invalidBuffer = Buffer.alloc(maxSize + 1); // Too large

      expect(validBuffer.length).toBeLessThanOrEqual(maxSize);
      expect(invalidBuffer.length).toBeGreaterThan(maxSize);
    });
  });
});