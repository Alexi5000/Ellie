import { renderHook, act } from '@testing-library/react';
import { useRetry } from '../useRetry';

// Mock timers
jest.useFakeTimers();

describe('useRetry', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('executes function successfully on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(mockFn));

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('arg1', 'arg2');
    });

    const value = await promise!;
    expect(value).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attempt).toBe(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const onRetry = jest.fn();
    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 3, initialDelay: 1000, onRetry })
    );

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    // Fast-forward through delays
    act(() => {
      jest.advanceTimersByTime(1000); // First retry delay
    });

    act(() => {
      jest.advanceTimersByTime(2000); // Second retry delay (exponential backoff)
    });

    const value = await promise!;
    expect(value).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
  });

  it('fails after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    const onMaxAttemptsReached = jest.fn();

    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 2, initialDelay: 500, onMaxAttemptsReached })
    );

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    // Fast-forward through delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await expect(promise!).rejects.toThrow('Always fails');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(onMaxAttemptsReached).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.isRetrying).toBe(false);
  });

  it('uses exponential backoff for delays', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxAttempts: 3, 
        initialDelay: 1000, 
        backoffFactor: 2 
      })
    );

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    // First retry: 1000ms delay
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(mockFn).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second retry: 2000ms delay (1000 * 2^1)
    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(mockFn).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockFn).toHaveBeenCalledTimes(3);

    await expect(promise!).rejects.toThrow('Always fails');
  });

  it('respects max delay limit', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxAttempts: 4, 
        initialDelay: 1000, 
        backoffFactor: 10,
        maxDelay: 2000 
      })
    );

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    // First retry: 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Second retry: should be 10000ms but capped at 2000ms
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Third retry: should also be capped at 2000ms
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await expect(promise!).rejects.toThrow('Always fails');
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  it('updates state correctly during retry process', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 2, initialDelay: 1000 })
    );

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attempt).toBe(0);

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.attempt).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.attempt).toBe(2);

    await promise!;
    expect(result.current.isRetrying).toBe(false);
  });

  it('resets state when reset is called', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 3, initialDelay: 1000 })
    );

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.attempt).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attempt).toBe(0);
    expect(result.current.lastError).toBe(null);

    // Promise should still reject
    await expect(promise!).rejects.toThrow('Always fails');
  });

  it('handles non-Error objects thrown', async () => {
    const mockFn = jest.fn().mockRejectedValue('String error');
    const { result } = renderHook(() => useRetry(mockFn, { maxAttempts: 1 }));

    let promise: Promise<string>;
    act(() => {
      promise = result.current.executeWithRetry('test');
    });

    await expect(promise!).rejects.toThrow('String error');
    expect(result.current.lastError).toBeInstanceOf(Error);
    expect(result.current.lastError?.message).toBe('String error');
  });
});