import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: Array<(event: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    listeners = [];
    
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners.push(handler);
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners = listeners.filter(l => l !== handler);
        }
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false initially when media query does not match', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);
  });

  it('should return true initially when media query matches', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(true);
  });

  it('should update when media query match changes', () => {
    const addEventListenerMock = vi.fn();
    
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const changeHandler = addEventListenerMock.mock.calls[0][1];
      changeHandler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it('should handle multiple media queries independently', () => {
    const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    const { result: result2 } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));
    
    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 768px)');
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerMock = vi.fn();
    
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    unmount();
    
    expect(removeEventListenerMock).toHaveBeenCalled();
  });

  it('should use deprecated addListener/removeListener for older browsers', () => {
    const addListenerMock = vi.fn();
    const removeListenerMock = vi.fn();
    
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: undefined, // Simulate old browser
      removeEventListener: undefined,
      addListener: addListenerMock,
      removeListener: removeListenerMock,
      dispatchEvent: vi.fn(),
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(addListenerMock).toHaveBeenCalled();
    
    unmount();
    
    expect(removeListenerMock).toHaveBeenCalled();
  });

  it('should work with common responsive breakpoints', () => {
    const queries = [
      '(max-width: 640px)',  // mobile
      '(min-width: 768px)',  // tablet
      '(min-width: 1024px)', // desktop
      '(min-width: 1280px)', // large desktop
    ];

    queries.forEach(query => {
      const { result } = renderHook(() => useMediaQuery(query));
      expect(typeof result.current).toBe('boolean');
    });
  });

  it('should work with prefers-color-scheme queries', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));
    
    expect(result.current).toBe(true);
  });

  it('should work with prefers-reduced-motion queries', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));
    
    expect(result.current).toBe(true);
  });
});
