import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService, SocketEventName, SocketEvents, ConnectionState } from '../services/socketService';
import { AudioResponse, ErrorResponse, VoiceState } from '../types';

export interface UseSocketReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendVoiceInput: (audioData: ArrayBuffer) => void;
  forceReconnect: () => void;
}

export function useSocket(): UseSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socketService.getConnectionState()
  );
  const [isConnected, setIsConnected] = useState(socketService.isConnected());

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = socketService.getConnectionState();
      const newIsConnected = socketService.isConnected();
      
      setConnectionState(newState);
      setIsConnected(newIsConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Set up event listeners for connection state changes
  useEffect(() => {
    const unsubscribeConnect = socketService.on('connect', () => {
      setIsConnected(true);
      setConnectionState(socketService.getConnectionState());
    });

    const unsubscribeDisconnect = socketService.on('disconnect', () => {
      setIsConnected(false);
      setConnectionState(socketService.getConnectionState());
    });

    const unsubscribeConnectError = socketService.on('connect_error', () => {
      setConnectionState(socketService.getConnectionState());
    });

    const unsubscribeReconnect = socketService.on('reconnect', () => {
      setIsConnected(true);
      setConnectionState(socketService.getConnectionState());
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeConnectError();
      unsubscribeReconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const sendVoiceInput = useCallback((audioData: ArrayBuffer) => {
    try {
      socketService.sendVoiceInput(audioData);
    } catch (error) {
      console.error('Failed to send voice input:', error);
      throw error;
    }
  }, []);

  const forceReconnect = useCallback(() => {
    socketService.forceReconnect();
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    sendVoiceInput,
    forceReconnect,
  };
}

export interface UseSocketEventOptions<T extends SocketEventName> {
  eventName: T;
  handler: SocketEvents[T];
  dependencies?: React.DependencyList;
}

export function useSocketEvent<T extends SocketEventName>({
  eventName,
  handler,
  dependencies = [],
}: UseSocketEventOptions<T>): void {
  const handlerRef = useRef(handler);
  
  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = ((...args: any[]) => {
      handlerRef.current(...args);
    }) as SocketEvents[T];

    const unsubscribe = socketService.on(eventName, wrappedHandler);
    
    return unsubscribe;
  }, [eventName, ...dependencies]);
}

// Convenience hooks for specific events
export function useSocketAIResponse(
  handler: (response: AudioResponse) => void,
  dependencies?: React.DependencyList
): void {
  useSocketEvent({
    eventName: 'ai-response',
    handler,
    dependencies,
  });
}

export function useSocketError(
  handler: (error: ErrorResponse) => void,
  dependencies?: React.DependencyList
): void {
  useSocketEvent({
    eventName: 'error',
    handler,
    dependencies,
  });
}

export function useSocketStatus(
  handler: (status: { state: VoiceState; message?: string }) => void,
  dependencies?: React.DependencyList
): void {
  useSocketEvent({
    eventName: 'status',
    handler,
    dependencies,
  });
}