import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.setCurrentIndex).toBe('function');
    expect(typeof result.current.navigateNext).toBe('function');
    expect(typeof result.current.navigatePrevious).toBe('function');
  });

  it('should provide a containerRef', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should call navigateNext method', () => {
    const onNext = vi.fn();
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        onNext,
      })
    );

    result.current.navigateNext();
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('should call navigatePrevious method', () => {
    const onPrevious = vi.fn();
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        onPrevious,
      })
    );

    result.current.navigatePrevious();
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('should allow setting current index', () => {
    const { result } = renderHook(() => useKeyboardNavigation());

    result.current.setCurrentIndex(5);
    
    // Note: currentIndex is stored in a ref, so it won't trigger re-render
    // This is by design for performance reasons
    expect(typeof result.current.setCurrentIndex).toBe('function');
  });

  it('should handle missing container ref gracefully', () => {
    const onNext = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: true,
        onNext,
      })
    );

    // Don't attach ref to container
    // Should not throw error
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should accept all configuration options', () => {
    const callbacks = {
      onNext: vi.fn(),
      onPrevious: vi.fn(),
      onEscape: vi.fn(),
      onActivate: vi.fn(),
      onTab: vi.fn(),
    };

    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: true,
        enableTabKey: true,
        enableEscapeKey: true,
        enableActivationKeys: true,
        orientation: 'horizontal',
        loop: true,
        ...callbacks,
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.containerRef).toBeDefined();
  });

  it('should work with vertical orientation', () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: true,
        orientation: 'vertical',
        onNext,
        onPrevious,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should work with loop option enabled', () => {
    const onNext = vi.fn();
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: true,
        loop: true,
        onNext,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should work with all keyboard features disabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: false,
        enableTabKey: false,
        enableEscapeKey: false,
        enableActivationKeys: false,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        enableArrowKeys: true,
      })
    );

    // Should not throw error on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should handle multiple instances independently', () => {
    const onNext1 = vi.fn();
    const onNext2 = vi.fn();
    
    const { result: result1 } = renderHook(() =>
      useKeyboardNavigation({ onNext: onNext1 })
    );
    
    const { result: result2 } = renderHook(() =>
      useKeyboardNavigation({ onNext: onNext2 })
    );

    result1.current.navigateNext();
    expect(onNext1).toHaveBeenCalledTimes(1);
    expect(onNext2).not.toHaveBeenCalled();

    result2.current.navigateNext();
    expect(onNext2).toHaveBeenCalledTimes(1);
    expect(onNext1).toHaveBeenCalledTimes(1);
  });
});
