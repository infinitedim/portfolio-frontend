import { useState, useCallback, useRef, useEffect } from "react";
import { EnhancedError, ErrorUtils } from "./error-types";
import { AsyncErrorHandler, AsyncResult } from "./async-error-handler";

/**
 * State snapshot representing the active error status, retry count, and loading progress.
 */
export interface ErrorState {
  /**
   * The currently active enhanced error object, or null if no error has occurred.
   */
  error: EnhancedError | null;
  /**
   * Whether an asynchronous operation or retry attempt is actively executing.
   */
  isLoading: boolean;
  /**
   * Number of retry attempts that have been executed for the current failure.
   */
  retryCount: number;
  /**
   * Timestamp when the most recent retry attempt was initiated, or null if never retried.
   */
  lastRetryAt: Date | null;
}

/**
 * Configuration options for customizing the behavior of the `useErrorHandler` React hook.
 */
export interface UseErrorHandlerOptions {
  /**
   * Maximum number of automatic or manual retry attempts before giving up.
   */
  maxRetries?: number;
  /**
   * Base backoff delay in milliseconds between retry attempts.
   */
  retryDelay?: number;
  /**
   * Callback invoked whenever an error is encountered.
   * @param error - The enhanced error instance captured.
   */
  onError?: (error: EnhancedError) => void;
  /**
   * Callback invoked prior to executing a retry attempt.
   * @param error - The enhanced error triggering the retry.
   * @param attempt - The current retry attempt number (1-indexed).
   */
  onRetry?: (error: EnhancedError, attempt: number) => void;
  /**
   * Callback invoked when an operation executes successfully.
   */
  onSuccess?: () => void;
  /**
   * Whether to clear the error state and reset retry counts upon a successful operation.
   */
  resetOnSuccess?: boolean;
}

/**
 * Custom React hook providing robust error state management, automated retries with exponential backoff, and recovery callbacks for async operations.
 * @param options - Configuration options for retry limits, delays, and event callbacks.
 * @returns An object containing error state, execution triggers, retry utilities, and manual setters.
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
    lastRetryAt: null,
  });

  const asyncHandler = useRef(AsyncErrorHandler.getInstance());
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess,
    resetOnSuccess = true,
  } = options;

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setErrorState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result: AsyncResult<T> = await asyncHandler.current.execute(fn, {
          retryConfig: {
            maxRetries,
            baseDelay: retryDelay,
            maxDelay: 30000,
            backoffFactor: 2,
            onRetry: (error, attempt) => {
              const enhancedError = ErrorUtils.enhance(error);
              setErrorState((prev) => ({
                ...prev,
                retryCount: attempt,
                lastRetryAt: new Date(),
                error: enhancedError,
              }));
              onRetry?.(enhancedError, attempt);
            },
          },
          onError: (error) => {
            const enhancedError = ErrorUtils.enhance(error);
            setErrorState((prev) => ({
              ...prev,
              error: enhancedError,
              isLoading: false,
            }));
            onError?.(enhancedError);
          },
          onSuccess: () => {
            if (resetOnSuccess) {
              setErrorState({
                error: null,
                isLoading: false,
                retryCount: 0,
                lastRetryAt: null,
              });
            } else {
              setErrorState((prev) => ({
                ...prev,
                isLoading: false,
              }));
            }
            onSuccess?.();
          },
        });

        if (result.success) {
          return result.data as T;
        } else {
          throw result.error || new Error("Operation failed");
        }
      } catch (error) {
        const enhancedError = ErrorUtils.enhance(error as Error);
        setErrorState((prev) => ({
          ...prev,
          error: enhancedError,
          isLoading: false,
        }));
        return null;
      }
    },
    [maxRetries, retryDelay, onError, onRetry, onSuccess, resetOnSuccess],
  );

  const setError = useCallback((error: Error | string) => {
    const enhancedError =
      typeof error === "string"
        ? new EnhancedError(error)
        : ErrorUtils.enhance(error);
    setErrorState((prev) => ({
      ...prev,
      error: enhancedError,
      isLoading: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0,
      lastRetryAt: null,
    });
  }, []);

  const retry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (errorState.retryCount >= maxRetries) {
        return null;
      }
      return execute(fn);
    },
    [execute, errorState.retryCount, maxRetries],
  );

  return {
    ...errorState,
    execute,
    setError,
    clearError,
    retry,
    canRetry:
      errorState.error?.isRetryable && errorState.retryCount < maxRetries,
  };
}

/**
 * Custom React hook for safely executing isolated asynchronous tasks with integrated loading, error catching, and data state management.
 * @template T - Type of data returned by the asynchronous operation.
 * @returns An object containing data, error, loading flags, execute runner, and state reset function.
 */
export function useSafeAsync<T>() {
  const [state, setState] = useState<{
    data: T | null;
    error: EnhancedError | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fn();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      const enhancedError = ErrorUtils.enhance(error as Error);
      setState({ data: null, error: enhancedError, isLoading: false });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Custom React hook for concurrently or sequentially executing batches of asynchronous tasks with partial failure tolerance and summary reporting.
 * @template T - Type of data returned by each individual task function.
 * @returns An object containing execution results array, loading status, batch summary metrics, execute runner, and state reset function.
 */
export function useBatchAsync<T>() {
  const [state, setState] = useState<{
    results: Array<{ success: boolean; data?: T; error?: EnhancedError }>;
    isLoading: boolean;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>({
    results: [],
    isLoading: false,
    summary: { total: 0, successful: 0, failed: 0 },
  });

  const executeBatch = useCallback(
    async (
      functions: Array<() => Promise<T>>,
      options: { continueOnError?: boolean; maxConcurrency?: number } = {},
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { continueOnError = true, maxConcurrency = 3 } = options;
      const results: Array<{
        success: boolean;
        data?: T;
        error?: EnhancedError;
      }> = [];

      for (let i = 0; i < functions.length; i += maxConcurrency) {
        const batch = functions.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(async (fn) => {
          try {
            const data = await fn();
            return { success: true, data };
          } catch (error) {
            const enhancedError = ErrorUtils.enhance(error as Error);
            if (!continueOnError) {
              throw enhancedError;
            }
            return { success: false, error: enhancedError };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const summary = {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      };

      setState({
        results,
        isLoading: false,
        summary,
      });

      return { results, summary };
    },
    [],
  );

  const reset = useCallback(() => {
    setState({
      results: [],
      isLoading: false,
      summary: { total: 0, successful: 0, failed: 0 },
    });
  }, []);

  return {
    ...state,
    executeBatch,
    reset,
  };
}

/**
 * Custom React hook providing interval and timeout timers wrapped with automated exception handling, error state tracking, and cleanup on unmount.
 * @returns An object containing timer execution state, error details, startInterval, startTimeout, stop, and clearError functions.
 */
export function useTimerWithErrorHandling() {
  const [state, setState] = useState<{
    isRunning: boolean;
    error: EnhancedError | null;
    lastExecuted: Date | null;
  }>({
    isRunning: false,
    error: null,
    lastExecuted: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInterval = useCallback(
    (fn: () => Promise<void> | void, delay: number) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      intervalRef.current = setInterval(async () => {
        try {
          await fn();
          setState((prev) => ({
            ...prev,
            lastExecuted: new Date(),
            error: null,
          }));
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setState((prev) => ({
            ...prev,
            error: enhancedError,
            isRunning: false,
          }));
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, delay);
    },
    [],
  );

  const startTimeout = useCallback(
    (fn: () => Promise<void> | void, delay: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState((prev) => ({ ...prev, isRunning: true, error: null }));

      timeoutRef.current = setTimeout(async () => {
        try {
          await fn();
          setState((prev) => ({
            ...prev,
            lastExecuted: new Date(),
            error: null,
            isRunning: false,
          }));
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setState((prev) => ({
            ...prev,
            error: enhancedError,
            isRunning: false,
          }));
        }
        timeoutRef.current = null;
      }, delay);
    },
    [],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    startInterval,
    startTimeout,
    stop,
    clearError,
  };
}

/**
 * Custom React hook for orchestrating multiple named or auto-identified timers, managing individual timer errors, and auto-canceling on critical errors or unmount.
 * @returns An object with timer scheduling methods (setTimeout, setInterval), cancellation methods (clearTimeout, clearInterval, clearAll), and error inspectors.
 */
export function useEnhancedTimerManager() {
  const [errors, setErrors] = useState<Map<string, EnhancedError>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);

  const generateId = useCallback((): string => {
    idCounterRef.current += 1;
    return `timer_${Date.now()}_${idCounterRef.current}`;
  }, []);

  const setTimeoutSafe = useCallback(
    (
      callback: () => Promise<void> | void,
      delay: number,
      id?: string,
    ): string => {
      const timerId = id || generateId();

      const existingTimeout = timeoutsRef.current.get(timerId);
      if (existingTimeout) {
        global.clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          await callback();
          setErrors((prev) => {
            const next = new Map(prev);
            next.delete(timerId);
            return next;
          });
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setErrors((prev) => new Map(prev).set(timerId, enhancedError));
        } finally {
          timeoutsRef.current.delete(timerId);
        }
      }, delay);

      timeoutsRef.current.set(timerId, timeout);
      return timerId;
    },
    [generateId],
  );

  const setIntervalSafe = useCallback(
    (
      callback: () => Promise<void> | void,
      delay: number,
      id?: string,
    ): string => {
      const timerId = id || generateId();

      const existingInterval = intervalsRef.current.get(timerId);
      if (existingInterval) {
        global.clearInterval(existingInterval);
      }

      const interval = setInterval(async () => {
        try {
          await callback();
          setErrors((prev) => {
            const next = new Map(prev);
            next.delete(timerId);
            return next;
          });
        } catch (error) {
          const enhancedError = ErrorUtils.enhance(error as Error);
          setErrors((prev) => new Map(prev).set(timerId, enhancedError));

          if (enhancedError.severity === "CRITICAL") {
            const intervalToStop = intervalsRef.current.get(timerId);
            if (intervalToStop) {
              global.clearInterval(intervalToStop);
              intervalsRef.current.delete(timerId);
            }
          }
        }
      }, delay);

      intervalsRef.current.set(timerId, interval);
      return timerId;
    },
    [generateId],
  );

  const clearTimeout = useCallback((id: string): void => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      global.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearInterval = useCallback((id: string): void => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      global.clearInterval(interval);
      intervalsRef.current.delete(id);
    }
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback((): void => {
    timeoutsRef.current.forEach((timeout) => global.clearTimeout(timeout));
    intervalsRef.current.forEach((interval) => global.clearInterval(interval));
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
    setErrors(new Map());
  }, []);

  const getErrors = useCallback(() => {
    return Array.from(errors.values());
  }, [errors]);

  const hasErrors = errors.size > 0;

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setTimeout: setTimeoutSafe,
    setInterval: setIntervalSafe,
    clearTimeout,
    clearInterval,
    clearAll,
    errors: getErrors(),
    hasErrors,
  };
}
