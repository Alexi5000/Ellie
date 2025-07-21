import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
}

export function useRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffFactor, maxDelay]);

  const executeWithRetry = useCallback(async (...args: T): Promise<R> => {
    let currentAttempt = 0;
    let lastError: Error;

    setState(prev => ({ ...prev, isRetrying: true, attempt: 0, lastError: null }));

    while (currentAttempt < maxAttempts) {
      currentAttempt++;
      
      setState(prev => ({ ...prev, attempt: currentAttempt }));

      try {
        const result = await fn(...args);
        setState(prev => ({ ...prev, isRetrying: false, lastError: null }));
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({ ...prev, lastError }));

        if (currentAttempt < maxAttempts) {
          onRetry?.(currentAttempt, lastError);
          
          const delay = calculateDelay(currentAttempt);
          
          await new Promise((resolve) => {
            timeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }
    }

    setState(prev => ({ ...prev, isRetrying: false }));
    onMaxAttemptsReached?.(lastError!);
    throw lastError!;
  }, [fn, maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      isRetrying: false,
      attempt: 0,
      lastError: null,
    });
  }, []);

  return {
    executeWithRetry,
    reset,
    ...state,
  };
}

export default useRetry;