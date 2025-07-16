"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandler = void 0;
const sessionManager_1 = require("./sessionManager");
const errorHandler_1 = require("../utils/errorHandler");
const errors_1 = require("../types/errors");
const uuid_1 = require("uuid");
class WebSocketHandler {
    constructor(io) {
        this.io = io;
        this.sessionManager = new sessionManager_1.WebSocketSessionManager();
        this.setupEventHandlers();
        this.sessionManager.startCleanupInterval();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[${new Date().toISOString()}] WebSocket client connected: ${socket.id}`);
            const sessionId = this.sessionManager.createSession(socket.id);
            const sessionJoinedData = {
                sessionId,
                timestamp: Date.now(),
                status: 'connected'
            };
            socket.emit('session-joined', sessionJoinedData);
            socket.on('join-session', (data) => {
                this.handleJoinSession(socket, data);
            });
            socket.on('voice-input', (data) => {
                this.handleVoiceInput(socket, data);
            });
            socket.on('ping', () => {
                this.handlePing(socket);
            });
            socket.on('leave-session', () => {
                this.handleLeaveSession(socket);
            });
            socket.on('disconnect', (reason) => {
                this.handleDisconnection(socket, reason);
            });
            socket.on('error', (error) => {
                this.handleConnectionError(socket, error);
            });
        });
    }
    handleJoinSession(socket, data) {
        try {
            const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
            if (!sessionId) {
                this.sendError(socket, errors_1.ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
                return;
            }
            if (data.userPreferences) {
                this.sessionManager.updateSession(sessionId, {
                    preferences: data.userPreferences
                });
            }
            this.sessionManager.updateActivity(sessionId);
            const sessionJoinedData = {
                sessionId,
                timestamp: Date.now(),
                status: 'joined'
            };
            socket.emit('session-joined', sessionJoinedData);
            console.log(`[${new Date().toISOString()}] Client joined session: ${sessionId}`);
        }
        catch (error) {
            console.error(`[${new Date().toISOString()}] Error handling join session:`, error);
            this.sendError(socket, errors_1.ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to join session');
        }
    }
    handleVoiceInput(socket, data) {
        try {
            const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
            if (!sessionId) {
                this.sendError(socket, errors_1.ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Session not found');
                return;
            }
            if (!data.audioBuffer || !Buffer.isBuffer(data.audioBuffer)) {
                this.sendError(socket, errors_1.ERROR_CODES.INVALID_AUDIO_FORMAT, 'Invalid audio data');
                return;
            }
            const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '10485760');
            if (data.audioBuffer.length > maxSize) {
                this.sendError(socket, errors_1.ERROR_CODES.AUDIO_TOO_LARGE, 'Audio file too large');
                return;
            }
            this.sessionManager.updateSession(sessionId, { status: 'processing' });
            this.sessionManager.updateActivity(sessionId);
            this.sendStatus(socket, sessionId, 'processing', 'Processing voice input...');
            console.log(`[${new Date().toISOString()}] Voice input received from session: ${sessionId}, size: ${data.audioBuffer.length} bytes`);
            setTimeout(() => {
                const mockResponse = {
                    text: "I received your voice input. Voice processing will be implemented in the next tasks.",
                    sessionId,
                    timestamp: Date.now(),
                    processingTime: 1000
                };
                this.sendAIResponse(socket, mockResponse);
                this.sessionManager.updateSession(sessionId, { status: 'idle' });
                this.sendStatus(socket, sessionId, 'idle', 'Ready for next input');
            }, 1000);
        }
        catch (error) {
            console.error(`[${new Date().toISOString()}] Error handling voice input:`, error);
            this.sendError(socket, errors_1.ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to process voice input');
        }
    }
    handlePing(socket) {
        const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
        if (sessionId) {
            this.sessionManager.updateActivity(sessionId);
        }
        socket.emit('pong');
    }
    handleLeaveSession(socket) {
        const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
        if (sessionId) {
            this.sessionManager.updateSession(sessionId, { status: 'disconnected' });
            console.log(`[${new Date().toISOString()}] Client left session: ${sessionId}`);
        }
    }
    handleDisconnection(socket, reason) {
        const sessionId = this.sessionManager.getSessionBySocketId(socket.id);
        if (sessionId) {
            this.sessionManager.removeSessionBySocketId(socket.id);
            console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}, session: ${sessionId}, reason: ${reason}`);
        }
    }
    handleConnectionError(socket, error) {
        console.error(`[${new Date().toISOString()}] WebSocket connection error for ${socket.id}:`, error);
        this.sendError(socket, errors_1.ERROR_CODES.WEBSOCKET_CONNECTION_FAILED, 'Connection error occurred');
    }
    sendAIResponse(socket, data) {
        socket.emit('ai-response', data);
    }
    sendError(socket, code, message, sessionId) {
        const errorData = {
            code,
            message: errorHandler_1.ErrorHandler.formatUserMessage(code),
            sessionId,
            timestamp: Date.now(),
            requestId: (0, uuid_1.v4)()
        };
        socket.emit('error', errorData);
    }
    sendStatus(socket, sessionId, status, details) {
        const statusData = {
            status,
            sessionId,
            timestamp: Date.now(),
            details
        };
        socket.emit('status', statusData);
    }
    broadcastToSession(sessionId, event, data) {
        this.io.emit(event, data);
    }
    getSessionManager() {
        return this.sessionManager;
    }
    getConnectionStats() {
        return {
            activeConnections: this.io.sockets.sockets.size,
            activeSessions: this.sessionManager.getActiveSessionsCount(),
            totalConnections: this.io.engine.clientsCount
        };
    }
}
exports.WebSocketHandler = WebSocketHandler;
//# sourceMappingURL=websocketHandler.js.map