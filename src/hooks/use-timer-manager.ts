import { useRef, useCallback, useEffect, useState } from "react";
import { EnhancedError, ErrorUtils } from "../lib/errors/error-types";

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
