import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { AudioResponse, ErrorResponse, VoiceState } from '../types';

export interface SocketEvents {
  'voice-input': (audioData: ArrayBuffer) => void;
  'ai-response': (response: AudioResponse) => void;
  'error': (error: ErrorResponse) => void;
  'status': (status: { state: VoiceState; message?: string }) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_attempt': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'reconnect_failed': () => void;
}

export type SocketEventName = keyof SocketEvents;

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<SocketEventName, Set<Function>> = new Map();
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  };
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Initialize event listener sets for each event type
    const eventNames: SocketEventName[] = [
      'voice-input', 'ai-response', 'error', 'status',
      'connect', 'disconnect', 'connect_error', 'reconnect',
      'reconnect_attempt', 'reconnect_error', 'reconnect_failed'
    ];
    
    eventNames.forEach(eventName => {
      this.eventListeners.set(eventName, new Set());
    });
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.connectionState.isConnecting = true;
      this.connectionState.lastError = undefined;

      try {
        this.socket = io(config.websocket.url, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          maxHttpBufferSize: 1e8, // 100MB for audio data
        });

        this.setupSocketEventHandlers();

        // Handle successful connection
        this.socket.on('connect', () => {
          this.connectionState.isConnected = true;
          this.connectionState.isConnecting = false;
          this.connectionState.reconnectAttempts = 0;
          this.connectionState.lastError = undefined;
          this.emitToListeners('connect');
          resolve();
        });

        // Handle connection errors
        this.socket.on('connect_error', (error: Error) => {
          this.connectionState.isConnecting = false;
          this.connectionState.lastError = error.message;
          this.emitToListeners('connect_error', error);
          reject(error);
        });

      } catch (error) {
        this.connectionState.isConnecting = false;
        this.connectionState.lastError = (error as Error).message;
        reject(error);
      }
    });
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      this.connectionState.isConnected = false;
      this.connectionState.lastError = `Disconnected: ${reason}`;
      this.emitToListeners('disconnect', reason);
    });

    // Handle reconnection events
    this.socket.on('reconnect', (attemptNumber: number) => {
      this.connectionState.isConnected = true;
      this.connectionState.reconnectAttempts = attemptNumber;
      this.connectionState.lastError = undefined;
      this.emitToListeners('reconnect', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      this.connectionState.reconnectAttempts = attemptNumber;
      this.emitToListeners('reconnect_attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      this.connectionState.lastError = error.message;
      this.emitToListeners('reconnect_error', error);
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState.lastError = 'Failed to reconnect after maximum attempts';
      this.emitToListeners('reconnect_failed');
    });

    // Handle application-specific events
    this.socket.on('ai-response', (response: AudioResponse) => {
      this.emitToListeners('ai-response', response);
    });

    this.socket.on('error', (error: ErrorResponse) => {
      this.emitToListeners('error', error);
    });

    this.socket.on('status', (status: { state: VoiceState; message?: string }) => {
      this.emitToListeners('status', status);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
  }

  public sendVoiceInput(audioData: ArrayBuffer): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('voice-input', audioData);
  }

  public on<T extends SocketEventName>(
    eventName: T,
    callback: SocketEvents[T]
  ): () => void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  public off<T extends SocketEventName>(
    eventName: T,
    callback: SocketEvents[T]
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emitToListeners<T extends SocketEventName>(
    eventName: T,
    ...args: Parameters<SocketEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in socket event listener for ${eventName}:`, error);
        }
      });
    }
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;