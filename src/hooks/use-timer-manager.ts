import { useRef, useCallback, useEffect, useState } from "react";
import { EnhancedError, ErrorUtils } from "../lib/errors/error-types";

/**
 * Interface representing a centralized timer manager instance.
 * Provides safe wrappers around browser timer APIs (`setTimeout`, `setInterval`)
 * with automatic tracking, error handling, cancellation, and cleanup capabilities.
 *
 * @interface TimerManager
 * @property {(callback: () => void, delay: number, id?: string) => string} setTimeout - Schedules a one-time callback execution after specified delay.
 * @property {(callback: () => void, delay: number, id?: string) => string} setInterval - Schedules recurring callback execution at specified interval.
 * @property {(id: string) => void} clearTimeout - Cancels an active timeout by its identifier.
 * @property {(id: string) => void} clearInterval - Cancels an active interval by its identifier.
 * @property {() => void} clearAll - Cancels all active timeouts, intervals, and clears recorded errors.
 * @property {() => void} clearAllTimeouts - Cancels all currently active timeouts.
 * @property {() => void} clearAllIntervals - Cancels all currently active recurring intervals.
 * @property {() => EnhancedError[]} getErrors - Retrieves an array of all errors caught during timer executions.
 * @property {() => void} clearErrors - Clears all recorded timer execution errors.
 * @property {boolean} hasErrors - Boolean flag indicating if any timer errors have occurred.
 */
export interface TimerManager {
  setTimeout: (callback: () => void, delay: number, id?: string) => string;
  setInterval: (callback: () => void, delay: number, id?: string) => string;
  clearTimeout: (id: string) => void;
  clearInterval: (id: string) => void;
  clearAll: () => void;
  clearAllTimeouts: () => void;
  clearAllIntervals: () => void;
  getErrors: () => EnhancedError[];
  clearErrors: () => void;
  hasErrors: boolean;
}

/**
 * Custom React hook that provides managed, memory-safe timer scheduling.
 * Automatically clears all pending timeouts and intervals on unmount, page hide, or beforeunload.
 * Captures execution errors in safe callbacks and tracks them via `EnhancedError`.
 *
 * @returns {TimerManager} An object containing timer creation, cancellation, and error-handling utilities.
 *
 * @example
 * ```tsx
 * const { setTimeout, clearTimeout, clearAll } = useTimerManager();
 * const timerId = setTimeout(() => {
 *   console.log('Delayed action');
 * }, 1000);
 * ```
 */
export function useTimerManager(): TimerManager {
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);
  const [errors, setErrors] = useState<Map<string, EnhancedError>>(new Map());

  const generateId = useCallback((): string => {
    idCounterRef.current += 1;
    return `timer_${Date.now()}_${idCounterRef.current}`;
  }, []);

  const setTimeout = useCallback(
    (callback: () => void, delay: number, id?: string): string => {
      const timerId = id || generateId();

      const existingTimeout = timeoutsRef.current.get(timerId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const safeCallback = () => {
        try {
          callback();
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
      };

      const timeout = global.setTimeout(safeCallback, delay);

      timeoutsRef.current.set(timerId, timeout);
      return timerId;
    },
    [generateId],
  );

  const setInterval = useCallback(
    (callback: () => void, delay: number, id?: string): string => {
      const timerId = id || generateId();

      const existingInterval = intervalsRef.current.get(timerId);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      const safeCallback = () => {
        try {
          callback();
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
      };

      const interval = global.setInterval(safeCallback, delay);
      intervalsRef.current.set(timerId, interval);
      return timerId;
    },
    [generateId],
  );

  const clearTimeoutById = useCallback((id: string): void => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      global.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearIntervalById = useCallback((id: string): void => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      global.clearInterval(interval);
      intervalsRef.current.delete(id);
    }
  }, []);

  const clearAllTimeouts = useCallback((): void => {
    timeoutsRef.current.forEach((timeout) => {
      global.clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
  }, []);

  const clearAllIntervals = useCallback((): void => {
    intervalsRef.current.forEach((interval) => {
      global.clearInterval(interval);
    });
    intervalsRef.current.clear();
  }, []);

  const clearAll = useCallback((): void => {
    clearAllTimeouts();
    clearAllIntervals();
    setErrors(new Map());
  }, [clearAllTimeouts, clearAllIntervals]);

  const getErrors = useCallback((): EnhancedError[] => {
    return Array.from(errors.values());
  }, [errors]);

  const clearErrors = useCallback((): void => {
    setErrors(new Map());
  }, []);

  const hasErrors = errors.size > 0;

  useEffect(() => {
    const currentTimeouts = timeoutsRef.current;
    const currentIntervals = intervalsRef.current;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
        currentIntervals.forEach((interval) => global.clearInterval(interval));

        currentTimeouts.clear();
        currentIntervals.clear();
      }
    };

    const handleBeforeUnload = () => {
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      currentTimeouts.forEach((timeout) => global.clearTimeout(timeout));
      currentIntervals.forEach((interval) => global.clearInterval(interval));
      currentTimeouts.clear();
      currentIntervals.clear();

      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, []);

  return {
    setTimeout,
    setInterval,
    clearTimeout: clearTimeoutById,
    clearInterval: clearIntervalById,
    clearAll,
    clearAllTimeouts,
    clearAllIntervals,
    getErrors,
    clearErrors,
    hasErrors,
  };
}

/**
 * Custom React hook that produces a debounced version of the provided callback function.
 * Delays invoking the callback until after the specified delay has elapsed since the last time it was invoked.
 *
 * @template T - The type of the callback function.
 * @param {T} func - The callback function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {T} The debounced function wrapper.
 *
 * @example
 * ```tsx
 * const handleSearch = useDebounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 * ```
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const timeoutIdRef = useRef<string | null>(null);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutIdRef.current) {
        timerManager.clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = timerManager.setTimeout(() => {
        funcRef.current(...args);
        timeoutIdRef.current = null;
      }, delay);
    },
    [delay, timerManager],
  ) as T;

  return debouncedFunction;
}

/**
 * Custom React hook that produces a throttled version of the provided callback function.
 * Ensures the callback is executed at most once within the specified time interval.
 * Subsequent calls within the window schedule a trailing execution if required.
 *
 * @template T - The type of the callback function.
 * @param {T} func - The callback function to throttle.
 * @param {number} delay - The throttle window delay in milliseconds.
 * @returns {T} The throttled function wrapper.
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottle((event: UIEvent) => {
 *   updateScrollPosition(event);
 * }, 100);
 * ```
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): T {
  const timerManager = useTimerManager();
  const funcRef = useRef(func);
  const lastCallTimeRef = useRef<number>(0);
  const timeoutIdRef = useRef<string | null>(null);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= delay) {
        funcRef.current(...args);
        lastCallTimeRef.current = now;
      } else {
        if (timeoutIdRef.current) {
          timerManager.clearTimeout(timeoutIdRef.current);
        }

        const remainingTime = delay - timeSinceLastCall;
        timeoutIdRef.current = timerManager.setTimeout(() => {
          funcRef.current(...args);
          lastCallTimeRef.current = Date.now();
          timeoutIdRef.current = null;
        }, remainingTime);
      }
    },
    [delay, timerManager],
  ) as T;

  return throttledFunction;
}

/**
 * Custom React hook for safely scheduling and cancelling animation frames (`requestAnimationFrame`).
 * Automatically cancels any pending animation frame when the component unmounts.
 *
 * @returns {{ requestFrame: (callback: () => void) => number; cancelFrame: () => void }}
 * An object providing `requestFrame` to queue a callback for the next repaint and `cancelFrame` to cancel it.
 *
 * @example
 * ```tsx
 * const { requestFrame, cancelFrame } = useAnimationFrame();
 * requestFrame(() => {
 *   element.style.transform = `translateX(${position}px)`;
 * });
 * ```
 */
export function useAnimationFrame() {
  const frameIdRef = useRef<number | null>(null);

  const requestFrame = useCallback((callback: () => void): number => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
    }

    frameIdRef.current = requestAnimationFrame(callback);
    return frameIdRef.current;
  }, []);

  const cancelFrame = useCallback((): void => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelFrame();
    };
  }, [cancelFrame]);

  return {
    requestFrame,
    cancelFrame,
  };
}
