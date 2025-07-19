import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket, useSocketEvent, useSocketAIResponse } from './useSocket';
import { socketService } from '../services/socketService';
import { AudioResponse, VoiceState } from '../types';

// Mock the socket service
vi.mock('../services/socketService', () => ({
  socketService: {
    getConnectionState: vi.fn(),
    isConnected: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendVoiceInput: vi.fn(),
    forceReconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe('useSocket Hook', () => {
  const mockSocketService = socketService as any;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set default mock implementations
    mockSocketService.getConnectionState.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    });
    mockSocketService.isConnected.mockReturnValue(false);
    mockSocketService.connect.mockResolvedValue(undefined);
    mockSocketService.on.mockReturnValue(() => {}); // Return unsubscribe function
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSocket());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toEqual({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    });
  });

  it('should update connection state periodically', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useSocket());
    
    // Change mock return values
    mockSocketService.getConnectionState.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
    });
    mockSocketService.isConnected.mockReturnValue(true);
    
    // Advance timer to trigger state update
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState.isConnected).toBe(true);
    
    vi.useRealTimers();
  });

  it('should connect successfully', async () => {
    const { result } = renderHook(() => useSocket());
    
    await act(async () => {
      await result.current.connect();
    });
    
    expect(mockSocketService.connect).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useSocket());
    const error = new Error('Connection failed');
    mockSocketService.connect.mockRejectedValue(error);
    
    await act(async () => {
      await expect(result.current.connect()).rejects.toThrow('Connection failed');
    });
  });

  it('should disconnect', () => {
    const { result } = renderHook(() => useSocket());
    
    act(() => {
      result.current.disconnect();
    });
    
    expect(mockSocketService.disconnect).toHaveBeenCalled();
  });

  it('should send voice input', () => {
    const { result } = renderHook(() => useSocket());
    const audioData = new ArrayBuffer(1024);
    
    act(() => {
      result.current.sendVoiceInput(audioData);
    });
    
    expect(mockSocketService.sendVoiceInput).toHaveBeenCalledWith(audioData);
  });

  it('should handle voice input errors', () => {
    const { result } = renderHook(() => useSocket());
    const error = new Error('Not connected');
    mockSocketService.sendVoiceInput.mockImplementation(() => {
      throw error;
    });
    
    const audioData = new ArrayBuffer(1024);
    
    expect(() => {
      act(() => {
        result.current.sendVoiceInput(audioData);
      });
    }).toThrow('Not connected');
  });

  it('should force reconnect', () => {
    const { result } = renderHook(() => useSocket());
    
    act(() => {
      result.current.forceReconnect();
    });
    
    expect(mockSocketService.forceReconnect).toHaveBeenCalled();
  });

  it('should set up event listeners for connection state changes', () => {
    renderHook(() => useSocket());
    
    // Verify that event listeners are set up
    expect(mockSocketService.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocketService.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocketService.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocketService.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    const unsubscribeFn = vi.fn();
    mockSocketService.on.mockReturnValue(unsubscribeFn);
    
    const { unmount } = renderHook(() => useSocket());
    
    unmount();
    
    // Should call unsubscribe functions
    expect(unsubscribeFn).toHaveBeenCalledTimes(4); // connect, disconnect, connect_error, reconnect
  });
});

describe('useSocketEvent Hook', () => {
  const mockSocketService = socketService as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService.on.mockReturnValue(() => {}); // Return unsubscribe function
  });

  it('should set up event listener', () => {
    const handler = vi.fn();
    
    renderHook(() =>
      useSocketEvent({
        eventName: 'ai-response',
        handler,
      })
    );
    
    expect(mockSocketService.on).toHaveBeenCalledWith('ai-response', expect.any(Function));
  });

  it('should clean up event listener on unmount', () => {
    const unsubscribeFn = vi.fn();
    mockSocketService.on.mockReturnValue(unsubscribeFn);
    
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useSocketEvent({
        eventName: 'ai-response',
        handler,
      })
    );
    
    unmount();
    
    expect(unsubscribeFn).toHaveBeenCalled();
  });

  it('should update handler when dependencies change', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    const { rerender } = renderHook(
      ({ handler, dep }) =>
        useSocketEvent({
          eventName: 'ai-response',
          handler,
          dependencies: [dep],
        }),
      {
        initialProps: { handler: handler1, dep: 1 },
      }
    );
    
    expect(mockSocketService.on).toHaveBeenCalledTimes(1);
    
    // Change dependencies
    rerender({ handler: handler2, dep: 2 });
    
    expect(mockSocketService.on).toHaveBeenCalledTimes(2);
  });

  it('should handle events with current handler', () => {
    let capturedHandler: Function;
    mockSocketService.on.mockImplementation((eventName: string, handler: Function) => {
      capturedHandler = handler;
      return () => {};
    });
    
    const handler = vi.fn();
    
    renderHook(() =>
      useSocketEvent({
        eventName: 'ai-response',
        handler,
      })
    );
    
    // Simulate event
    const mockResponse: AudioResponse = {
      text: 'Test response',
      audioBuffer: new ArrayBuffer(512),
      confidence: 0.9,
      processingTime: 1000,
    };
    
    act(() => {
      capturedHandler!(mockResponse);
    });
    
    expect(handler).toHaveBeenCalledWith(mockResponse);
  });
});

describe('useSocketAIResponse Hook', () => {
  const mockSocketService = socketService as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService.on.mockReturnValue(() => {});
  });

  it('should set up ai-response event listener', () => {
    const handler = vi.fn();
    
    renderHook(() => useSocketAIResponse(handler));
    
    expect(mockSocketService.on).toHaveBeenCalledWith('ai-response', expect.any(Function));
  });

  it('should call handler with ai-response data', () => {
    let capturedHandler: Function;
    mockSocketService.on.mockImplementation((eventName: string, handler: Function) => {
      if (eventName === 'ai-response') {
        capturedHandler = handler;
      }
      return () => {};
    });
    
    const handler = vi.fn();
    renderHook(() => useSocketAIResponse(handler));
    
    const mockResponse: AudioResponse = {
      text: 'Hello, how can I help you?',
      audioBuffer: new ArrayBuffer(1024),
      confidence: 0.95,
      processingTime: 1500,
    };
    
    act(() => {
      capturedHandler!(mockResponse);
    });
    
    expect(handler).toHaveBeenCalledWith(mockResponse);
  });
});