import { ConnectionState, SessionManager } from '../types/websocket';
export declare class WebSocketSessionManager implements SessionManager {
    private sessions;
    private socketToSession;
    private readonly SESSION_TIMEOUT_MS;
    private cleanupIntervalId?;
    createSession(socketId: string): string;
    getSession(sessionId: string): ConnectionState | undefined;
    getSessionBySocketId(socketId: string): string | undefined;
    updateSession(sessionId: string, updates: Partial<ConnectionState>): void;
    updateActivity(sessionId: string): void;
    removeSession(sessionId: string): void;
    removeSessionBySocketId(socketId: string): void;
    cleanupInactiveSessions(): void;
    getActiveSessionsCount(): number;
    getAllSessions(): ConnectionState[];
    startCleanupInterval(): void;
    stopCleanupInterval(): void;
    destroy(): void;
}
//# sourceMappingURL=sessionManager.d.ts.map