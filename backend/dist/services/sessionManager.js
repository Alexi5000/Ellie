"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSessionManager = void 0;
const uuid_1 = require("uuid");
class WebSocketSessionManager {
    constructor() {
        this.sessions = new Map();
        this.socketToSession = new Map();
        this.SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '1800000');
    }
    createSession(socketId) {
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const connectionState = {
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
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getSessionBySocketId(socketId) {
        return this.socketToSession.get(socketId);
    }
    updateSession(sessionId, updates) {
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
    updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
    }
    removeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            for (const [socketId, sessId] of this.socketToSession.entries()) {
                if (sessId === sessionId) {
                    this.socketToSession.delete(socketId);
                    break;
                }
            }
            console.log(`[${new Date().toISOString()}] Session removed: ${sessionId}`);
        }
    }
    removeSessionBySocketId(socketId) {
        const sessionId = this.socketToSession.get(socketId);
        if (sessionId) {
            this.removeSession(sessionId);
        }
    }
    cleanupInactiveSessions() {
        const now = new Date();
        const expiredSessions = [];
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
    getActiveSessionsCount() {
        return this.sessions.size;
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    startCleanupInterval() {
        const cleanupInterval = Math.max(this.SESSION_TIMEOUT_MS / 4, 60000);
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, cleanupInterval);
        console.log(`[${new Date().toISOString()}] Session cleanup interval started: ${cleanupInterval}ms`);
    }
}
exports.WebSocketSessionManager = WebSocketSessionManager;
//# sourceMappingURL=sessionManager.js.map