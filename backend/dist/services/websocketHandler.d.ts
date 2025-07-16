import { Server as SocketIOServer } from 'socket.io';
import { WebSocketSessionManager } from './sessionManager';
export declare class WebSocketHandler {
    private io;
    private sessionManager;
    constructor(io: SocketIOServer);
    private setupEventHandlers;
    private handleJoinSession;
    private handleVoiceInput;
    private handlePing;
    private handleLeaveSession;
    private handleDisconnection;
    private handleConnectionError;
    private sendAIResponse;
    private sendError;
    private sendStatus;
    broadcastToSession(sessionId: string, event: string, data: any): void;
    getSessionManager(): WebSocketSessionManager;
    getConnectionStats(): {
        activeConnections: number;
        activeSessions: number;
        totalConnections: number;
    };
}
//# sourceMappingURL=websocketHandler.d.ts.map