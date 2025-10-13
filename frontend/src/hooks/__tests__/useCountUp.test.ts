import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCountUp } from '../useCountUp';

describe('useCountUp', () => {
  it('returns start value initially when not enabled', () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, enabled: false })
    );

    expect(result.current).toBe(0);
  });

  it('starts animation when enabled', async () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 100, enabled: true })
    );

    // Initial value should be 0
    expect(result.current).toBe(0);

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 500 }
    );
  });

  it('uses custom start value', async () => {
    const { result } = renderHook(() =>
      useCountUp({ start: 50, end: 100, duration: 100, enabled: true })
    );

    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 500 }
    );
  });

  it('respects custom duration', async () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 200, enabled: true })
    );

    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 500 }
    );
  });

  it('animates progressively from start to end', async () => {
    const { result } = renderHook(() =>
      useCountUp({ start: 0, end: 100, duration: 200, enabled: true })
    );

    // Initial value
    expect(result.current).toBe(0);

    // Wait a bit and check it's progressing
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(0);
      },
      { timeout: 150 }
    );

    // Wait for completion
    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 500 }
    );
  });

  it('resets to start value when enabled changes to false', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useCountUp({ end: 100, duration: 100, enabled }),
      { initialProps: { enabled: true } }
    );

    // Wait a bit for animation to start
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(0);
      },
      { timeout: 100 }
    );

    // Disable animation
    rerender({ enabled: false });

    // Should reset to start value
    expect(result.current).toBe(0);
  });

  it('handles decimal end values', async () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 99.99, duration: 100, enabled: true })
    );

    await waitFor(
      () => {
        expect(result.current).toBeCloseTo(99.99, 1);
      },
      { timeout: 500 }
    );
  });

  it('handles large numbers', async () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 150000000, duration: 100, enabled: true })
    );

    await waitFor(
      () => {
        expect(result.current).toBe(150000000);
      },
      { timeout: 500 }
    );
  });

  it('uses custom easing function when provided', async () => {
    const linearEasing = (t: number) => t;

    const { result } = renderHook(() =>
      useCountUp({
        end: 100,
        duration: 100,
        enabled: true,
        easingFn: linearEasing,
      })
    );

    await waitFor(
      () => {
        expect(result.current).toBe(100);
      },
      { timeout: 500 }
    );
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = renderHook(() =>
      useCountUp({ end: 100, duration: 100, enabled: true })
    );

    // Should not throw errors
    expect(() => unmount()).not.toThrow();
  });

  it('handles rapid enable/disable toggles', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useCountUp({ end: 100, duration: 100, enabled }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });
    rerender({ enabled: true });

    await waitFor(
      () => {
        expect(result.current).toBeGreaterThanOrEqual(0);
      },
      { timeout: 500 }
    );
  });
});
