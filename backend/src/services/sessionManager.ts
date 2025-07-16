/**
 * Session management for WebSocket connections
 * Requirements: 5.5, 7.1, 7.2
 */

import { v4 as uuidv4 } from 'uuid';
import { ConnectionState, SessionManager } from '../types/websocket';

export class WebSocketSessionManager implements SessionManager {
  private sessions: Map<string, ConnectionState> = new Map();
  private socketToSession: Map<string, string> = new Map();
  private readonly SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '1800000'); // 30 minutes

  /**
   * Creates a new session for a socket connection
   */
  createSession(socketId: string): string {
    const sessionId = uuidv4();
    const now = new Date();
    
    const connectionState: ConnectionState = {
      sessionId,
      connectedAt: now,
      lastActivity: now,
      status: 'connected',
      preferences: {
        voiceSpeed: 1.0,
        language: 'en-US',
        accessibilityMode: false
      }
    };

    this.sessions.set(sessionId, connectionState);
    this.socketToSession.set(socketId, sessionId);

    console.log(`[${new Date().toISOString()}] Session created: ${sessionId} for socket: ${socketId}`);
    return sessionId;
  }

  /**
   * Retrieves session data by session ID
   */
  getSession(sessionId: string): ConnectionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets session ID by socket ID
   */
  getSessionBySocketId(socketId: string): string | undefined {
    return this.socketToSession.get(socketId);
  }

  /**
   * Updates session data
   */
  updateSession(sessionId: string, updates: Partial<ConnectionState>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        ...updates,
        lastActivity: new Date()
      };
      this.sessions.set(sessionId, updatedSession);
      console.log(`[${new Date().toISOString()}] Session updated: ${sessionId}`);
    }
  }

  /**
   * Updates session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Removes a session
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      
      // Remove socket mapping
      for (const [socketId, sessId] of this.socketToSession.entries()) {
        if (sessId === sessionId) {
          this.socketToSession.delete(socketId);
          break;
        }
      }
      
      console.log(`[${new Date().toISOString()}] Session removed: ${sessionId}`);
    }
  }

  /**
   * Removes session by socket ID
   */
  removeSessionBySocketId(socketId: string): void {
    const sessionId = this.socketToSession.get(socketId);
    if (sessionId) {
      this.removeSession(sessionId);
    }
  }

  /**
   * Cleans up inactive sessions
   */
  cleanupInactiveSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      if (timeSinceActivity > this.SESSION_TIMEOUT_MS) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      console.log(`[${new Date().toISOString()}] Cleaning up expired session: ${sessionId}`);
      this.removeSession(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`[${new Date().toISOString()}] Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Gets count of active sessions
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Gets all active sessions (for monitoring)
   */
  getAllSessions(): ConnectionState[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Starts periodic cleanup of inactive sessions
   */
  startCleanupInterval(): void {
    const cleanupInterval = Math.max(this.SESSION_TIMEOUT_MS / 4, 60000); // Every 1/4 of timeout or 1 minute minimum
    
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, cleanupInterval);

    console.log(`[${new Date().toISOString()}] Session cleanup interval started: ${cleanupInterval}ms`);
  }
}