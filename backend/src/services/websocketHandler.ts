/**
 * WebSocket event handlers for voice communication
 * Requirements: 5.5, 7.1, 7.2
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { 
  WebSocketEvents, 
  VoiceInputData, 
  AIResponseData, 
  WebSocketErrorData, 
  StatusData, 
  JoinSessionData,
  SessionJoinedData,
  LanguageChangeData
} from '../types/websocket';
import { languageDetectionService } from './languageDetectionService';
import { WebSocketSessionManager } from './sessionManager';
import { ErrorHandler } from '../utils/errorHandler';
import { ERROR_CODES } from '../types/errors';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketHandler {
  private sessionManager: WebSocketSessionManager;

  constructor(private io: SocketIOServer) {
    this.sessionManager = new WebSocketSessionManager();
    this.setupEventHandlers();
    this.sessionManager.startCleanupInterval();
  }

  /**
   * Sets up Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[${new Date().toISOString()}] WebSocket client connected: ${socket.id}`);
      
      // Create session for new connection
      const sessionId = this.sessionManager.createSession(socket.id);
      
      // Send session joined confirmation
      const sessionJoinedData: SessionJoinedData = {
        sessionId,
        timestamp: Date.now(),
        status: 'connected'
      };
      socket.emit('session-joined', sessionJoinedData);

      // Handle join session event
      socket.on('join-session', (data: JoinSessionData) => {
        this.handleJoinSession(socket, data);
      });

      // Handle voice input
      socket.on('voice-input', (data: VoiceInputData) => {
        this.handleVoiceInput(socket, data);
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        this.handlePing(socket);
      });

      // Handle leave session
      socket.on('leave-session', () => {
        this.handleLeaveSession(socket);
      });
      
      // Handle language change
      socket.on('change-language', (data: LanguageChangeData) => {
        this.handleLanguageChange(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle connection errors
      socket.on('error', (error: Error) => {
        this.handleConnectionError(socket, error);
      });
    });
  }

  /**
   * Handles join session requests
   */
  private handleJoinSession(socket: Socket, data: JoinSessionData): void {
    try {
      const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
      if (!sessionId) {
        this.sendError(socket, ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
        return;
      }

      // Update session with user preferences
      if (data.userPreferences) {
        // Set default language if not provided
        if (!data.userPreferences.language) {
          data.userPreferences.language = languageDetectionService.getDefaultLanguage();
        }
        
        this.sessionManager.updateSession(sessionId, {
          preferences: data.userPreferences
        });
      }

      this.sessionManager.updateActivity(sessionId);

      // Send confirmation
      const sessionJoinedData: SessionJoinedData = {
        sessionId,
        timestamp: Date.now(),
        status: 'joined'
      };
      socket.emit('session-joined', sessionJoinedData);

      console.log(`[${new Date().toISOString()}] Client joined session: ${sessionId}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error handling join session:`, error);
      this.sendError(socket, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to join session');
    }
  }

  /**
   * Handles voice input from clients
   */
  private handleVoiceInput(socket: Socket, data: VoiceInputData): void {
    try {
      const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
      if (!sessionId) {
        this.sendError(socket, ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
        return;
      }

      // Validate voice input data
      if (!data.audioBuffer || !Buffer.isBuffer(data.audioBuffer)) {
        this.sendError(socket, ERROR_CODES.INVALID_AUDIO_FORMAT, 'Invalid audio data');
        return;
      }

      // Check audio size limits
      const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '10485760'); // 10MB
      if (data.audioBuffer.length > maxSize) {
        this.sendError(socket, ERROR_CODES.AUDIO_TOO_LARGE, 'Audio file too large');
        return;
      }

      // Update session status
      this.sessionManager.updateSession(sessionId, { status: 'processing' });
      this.sessionManager.updateActivity(sessionId);

      // Send status update
      this.sendStatus(socket, sessionId, 'processing', 'Processing voice input...');

      console.log(`[${new Date().toISOString()}] Voice input received from session: ${sessionId}, size: ${data.audioBuffer.length} bytes`);

      // TODO: This will be implemented in later tasks - voice processing service integration
      // For now, send a placeholder response
      setTimeout(() => {
        const mockResponse: AIResponseData = {
          text: "I received your voice input. Voice processing will be implemented in the next tasks.",
          sessionId,
          timestamp: Date.now(),
          processingTime: 1000
        };
        
        this.sendAIResponse(socket, mockResponse);
        this.sessionManager.updateSession(sessionId, { status: 'idle' });
        this.sendStatus(socket, sessionId, 'idle', 'Ready for next input');
      }, 1000);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error handling voice input:`, error);
      this.sendError(socket, ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to process voice input');
    }
  }

  /**
   * Handles ping requests for connection health
   */
  private handlePing(socket: Socket): void {
    const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
    if (sessionId) {
      this.sessionManager.updateActivity(sessionId);
    }
    socket.emit('pong');
  }

  /**
   * Handles leave session requests
   */
  private handleLeaveSession(socket: Socket): void {
    const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
    if (sessionId) {
      this.sessionManager.updateSession(sessionId, { status: 'disconnected' });
      console.log(`[${new Date().toISOString()}] Client left session: ${sessionId}`);
    }
  }

  /**
   * Handles client disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
    if (sessionId) {
      this.sessionManager.removeSessionBySocketId(socket.id);
      console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}, session: ${sessionId}, reason: ${reason}`);
    }
  }

  /**
   * Handles connection errors
   */
  private handleConnectionError(socket: Socket, error: Error): void {
    console.error(`[${new Date().toISOString()}] WebSocket connection error for ${socket.id}:`, error);
    this.sendError(socket, ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Connection error occurred');
  }

  /**
   * Sends AI response to client
   */
  private sendAIResponse(socket: Socket, data: AIResponseData): void {
    socket.emit('ai-response', data);
  }

  /**
   * Sends error message to client
   */
  private sendError(socket: Socket, code: string, message: string, sessionId?: string): void {
    const errorData: WebSocketErrorData = {
      code,
      message: ErrorHandler.formatUserMessage(code as any),
      sessionId,
      timestamp: Date.now(),
      requestId: uuidv4()
    };
    socket.emit('error', errorData);
  }

  /**
   * Sends status update to client
   */
  private sendStatus(socket: Socket, sessionId: string, status: StatusData['status'], details?: string): void {
    const statusData: StatusData = {
      status,
      sessionId,
      timestamp: Date.now(),
      details
    };
    socket.emit('status', statusData);
  }

  /**
   * Broadcasts message to all clients in a session (for future multi-client support)
   */
  public broadcastToSession(sessionId: string, event: string, data: any): void {
    this.io.emit(event, data); // For now, broadcast to all clients
  }

  /**
   * Gets session manager for external access
   */
  public getSessionManager(): WebSocketSessionManager {
    return this.sessionManager;
  }

  /**
   * Gets connection statistics
   */
  public getConnectionStats(): {
    activeConnections: number;
    activeSessions: number;
    totalConnections: number;
  } {
    return {
      activeConnections: this.io.sockets.sockets.size,
      activeSessions: this.sessionManager.getActiveSessionsCount(),
      totalConnections: this.io.engine.clientsCount
    };
  }
}  /**
   * 
Handles language change requests
   */
  private handleLanguageChange(socket: Socket, data: LanguageChangeData): void {
    try {
      const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
      if (!sessionId) {
        this.sendError(socket, ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
        return;
      }

      // Validate language code
      if (!data.languageCode || !languageDetectionService.isLanguageSupported(data.languageCode)) {
        this.sendError(socket, ERROR_CODES.INVALID_INPUT, 'Unsupported language');
        return;
      }

      // Get current session data
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        this.sendError(socket, ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
        return;
      }

      // Update session preferences with new language
      const updatedPreferences = {
        ...session.preferences,
        language: data.languageCode
      };

      this.sessionManager.updateSession(sessionId, {
        preferences: updatedPreferences
      });

      // Send confirmation
      socket.emit('language-changed', {
        languageCode: data.languageCode,
        sessionId,
        timestamp: Date.now(),
        languageName: languageDetectionService.getLanguageDetails(data.languageCode)?.name || data.languageCode
      });

      console.log(`[${new Date().toISOString()}] Language changed for session ${sessionId} to ${data.languageCode}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error handling language change:`, error);
      this.sendError(socket, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to change language');
    }
  }