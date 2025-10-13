import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from '../useIntersectionObserver';

describe('useIntersectionObserver', () => {
  it('returns a ref and initial isIntersecting state', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const [ref, isIntersecting] = result.current;

    expect(ref).toBeDefined();
    expect(ref.current).toBeNull();
    expect(isIntersecting).toBe(false);
  });

  it('accepts threshold option', () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({
        threshold: 0.5,
      })
    );

    const [ref, isIntersecting] = result.current;
    expect(ref).toBeDefined();
    expect(isIntersecting).toBe(false);
  });

  it('accepts rootMargin option', () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({
        rootMargin: '10px',
      })
    );

    const [ref, isIntersecting] = result.current;
    expect(ref).toBeDefined();
    expect(isIntersecting).toBe(false);
  });

  it('accepts triggerOnce option', () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({ triggerOnce: true })
    );

    const [ref, isIntersecting] = result.current;
    expect(ref).toBeDefined();
    expect(isIntersecting).toBe(false);
  });

  it('returns entry as third element in tuple', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const [, , entry] = result.current;
    expect(entry).toBeNull();
  });

  it('cleans up on unmount without errors', () => {
    const { unmount } = renderHook(() => useIntersectionObserver());

    expect(() => unmount()).not.toThrow();
  });

  it('handles missing IntersectionObserver gracefully', () => {
    // Remove IntersectionObserver temporarily
    const originalIO = global.IntersectionObserver;
    (global as any).IntersectionObserver = undefined;

    const { result } = renderHook(() => useIntersectionObserver());

    const [ref, isIntersecting] = result.current;

    // Should not throw errors when IntersectionObserver is not supported
    expect(ref).toBeDefined();
    expect(typeof isIntersecting).toBe('boolean');

    // Restore
    global.IntersectionObserver = originalIO;
  });

  it('works with different threshold values', () => {
    const { result: result1 } = renderHook(() =>
      useIntersectionObserver({ threshold: 0 })
    );
    const { result: result2 } = renderHook(() =>
      useIntersectionObserver({ threshold: 1 })
    );
    const { result: result3 } = renderHook(() =>
      useIntersectionObserver({ threshold: [0, 0.5, 1] })
    );

    expect(result1.current[0]).toBeDefined();
    expect(result2.current[0]).toBeDefined();
    expect(result3.current[0]).toBeDefined();
  });

  it('accepts root option', () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({
        root: null,
      })
    );

    const [ref, isIntersecting] = result.current;
    expect(ref).toBeDefined();
    expect(isIntersecting).toBe(false);
  });

  it('returns consistent ref object across renders', () => {
    const { result, rerender } = renderHook(() => useIntersectionObserver());

    const [ref1] = result.current;
    rerender();
    const [ref2] = result.current;

    expect(ref1).toBe(ref2);
  });
});
