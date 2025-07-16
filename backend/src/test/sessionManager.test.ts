/**
 * Unit tests for WebSocket Session Manager
 * Requirements: 5.5, 7.1, 7.2
 */

import { WebSocketSessionManager } from '../services/sessionManager';
import { ConnectionState } from '../types/websocket';

describe('WebSocketSessionManager', () => {
  let sessionManager: WebSocketSessionManager;

  beforeEach(() => {
    sessionManager = new WebSocketSessionManager();
  });

  afterEach(() => {
    // Clean up any intervals
    jest.clearAllTimers();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);

      const session = sessionManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.status).toBe('connected');
    });

    it('should create sessions with different IDs for different sockets', () => {
      const sessionId1 = sessionManager.createSession('socket-1');
      const sessionId2 = sessionManager.createSession('socket-2');

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should set default preferences for new sessions', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);
      const session = sessionManager.getSession(sessionId);

      expect(session?.preferences).toEqual({
        voiceSpeed: 1.0,
        language: 'en-US',
        accessibilityMode: false
      });
    });
  });

  describe('getSession', () => {
    it('should return session data for valid session ID', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);
      const session = sessionManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return undefined for invalid session ID', () => {
      const session = sessionManager.getSession('invalid-session-id');
      expect(session).toBeUndefined();
    });
  });

  describe('getSessionBySocketId', () => {
    it('should return session ID for valid socket ID', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);
      const foundSessionId = sessionManager.getSessionBySocketId(socketId);

      expect(foundSessionId).toBe(sessionId);
    });

    it('should return undefined for invalid socket ID', () => {
      const foundSessionId = sessionManager.getSessionBySocketId('invalid-socket-id');
      expect(foundSessionId).toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session data and activity timestamp', (done) => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);
      const originalSession = sessionManager.getSession(sessionId);
      const originalActivity = originalSession?.lastActivity;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        sessionManager.updateSession(sessionId, { status: 'processing' });
        const updatedSession = sessionManager.getSession(sessionId);

        expect(updatedSession?.status).toBe('processing');
        expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(originalActivity?.getTime() || 0);
        done();
      }, 10);
    });

    it('should not update non-existent session', () => {
      const initialCount = sessionManager.getActiveSessionsCount();
      sessionManager.updateSession('invalid-session-id', { status: 'processing' });
      const finalCount = sessionManager.getActiveSessionsCount();

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('updateActivity', () => {
    it('should update last activity timestamp', (done) => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);
      const originalSession = sessionManager.getSession(sessionId);
      const originalActivity = originalSession?.lastActivity;

      setTimeout(() => {
        sessionManager.updateActivity(sessionId);
        const updatedSession = sessionManager.getSession(sessionId);

        expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(originalActivity?.getTime() || 0);
        done();
      }, 10);
    });
  });

  describe('removeSession', () => {
    it('should remove session and socket mapping', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);

      expect(sessionManager.getSession(sessionId)).toBeDefined();
      expect(sessionManager.getSessionBySocketId(socketId)).toBe(sessionId);

      sessionManager.removeSession(sessionId);

      expect(sessionManager.getSession(sessionId)).toBeUndefined();
      expect(sessionManager.getSessionBySocketId(socketId)).toBeUndefined();
    });

    it('should handle removal of non-existent session gracefully', () => {
      const initialCount = sessionManager.getActiveSessionsCount();
      sessionManager.removeSession('invalid-session-id');
      const finalCount = sessionManager.getActiveSessionsCount();

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('removeSessionBySocketId', () => {
    it('should remove session by socket ID', () => {
      const socketId = 'socket-123';
      const sessionId = sessionManager.createSession(socketId);

      expect(sessionManager.getSession(sessionId)).toBeDefined();

      sessionManager.removeSessionBySocketId(socketId);

      expect(sessionManager.getSession(sessionId)).toBeUndefined();
      expect(sessionManager.getSessionBySocketId(socketId)).toBeUndefined();
    });
  });

  describe('getActiveSessionsCount', () => {
    it('should return correct count of active sessions', () => {
      expect(sessionManager.getActiveSessionsCount()).toBe(0);

      sessionManager.createSession('socket-1');
      expect(sessionManager.getActiveSessionsCount()).toBe(1);

      sessionManager.createSession('socket-2');
      expect(sessionManager.getActiveSessionsCount()).toBe(2);

      sessionManager.removeSessionBySocketId('socket-1');
      expect(sessionManager.getActiveSessionsCount()).toBe(1);
    });
  });

  describe('cleanupInactiveSessions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should remove expired sessions', () => {
      // Mock environment variable for shorter timeout in tests
      const originalTimeout = process.env.SESSION_TIMEOUT_MS;
      process.env.SESSION_TIMEOUT_MS = '1000'; // 1 second

      const sessionManager = new WebSocketSessionManager();
      const sessionId = sessionManager.createSession('socket-123');

      expect(sessionManager.getActiveSessionsCount()).toBe(1);

      // Fast-forward time beyond session timeout
      jest.advanceTimersByTime(2000);

      sessionManager.cleanupInactiveSessions();

      expect(sessionManager.getActiveSessionsCount()).toBe(0);
      expect(sessionManager.getSession(sessionId)).toBeUndefined();

      // Restore original timeout
      if (originalTimeout) {
        process.env.SESSION_TIMEOUT_MS = originalTimeout;
      } else {
        delete process.env.SESSION_TIMEOUT_MS;
      }
    });

    it('should not remove active sessions', () => {
      const originalTimeout = process.env.SESSION_TIMEOUT_MS;
      process.env.SESSION_TIMEOUT_MS = '2000'; // 2 seconds

      const sessionManager = new WebSocketSessionManager();
      const sessionId = sessionManager.createSession('socket-123');

      // Fast-forward time but not beyond timeout
      jest.advanceTimersByTime(1000);

      sessionManager.cleanupInactiveSessions();

      expect(sessionManager.getActiveSessionsCount()).toBe(1);
      expect(sessionManager.getSession(sessionId)).toBeDefined();

      // Restore original timeout
      if (originalTimeout) {
        process.env.SESSION_TIMEOUT_MS = originalTimeout;
      } else {
        delete process.env.SESSION_TIMEOUT_MS;
      }
    });
  });

  describe('getAllSessions', () => {
    it('should return all active sessions', () => {
      const sessionId1 = sessionManager.createSession('socket-1');
      const sessionId2 = sessionManager.createSession('socket-2');

      const allSessions = sessionManager.getAllSessions();

      expect(allSessions).toHaveLength(2);
      expect(allSessions.map(s => s.sessionId)).toContain(sessionId1);
      expect(allSessions.map(s => s.sessionId)).toContain(sessionId2);
    });

    it('should return empty array when no sessions exist', () => {
      const allSessions = sessionManager.getAllSessions();
      expect(allSessions).toHaveLength(0);
    });
  });
});