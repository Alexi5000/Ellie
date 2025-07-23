import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnect: () => {}
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const initializeSocket = () => {
    try {
      // Get API URL from environment or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Create socket connection
      const socketInstance = io(apiUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Socket event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setConnectionError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });

      socketInstance.on('error', (error: any) => {
        console.error('Socket error:', error);
        setConnectionError(`Socket error: ${error.message || 'Unknown error'}`);
      });

      // Set socket instance
      setSocket(socketInstance);

      // Clean up on unmount
      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setConnectionError(`Failed to initialize socket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return () => {};
    }
  };

  // Initialize socket on component mount
  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, []);

  // Function to manually reconnect
  const reconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    initializeSocket();
  };

  // Context value
  const value = {
    socket,
    isConnected,
    connectionError,
    reconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;