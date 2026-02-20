

import React, { useRef, useEffect, useCallback, RefObject } from "react";

export const isClientSide = (): boolean => {
  return typeof window !== "undefined";
};

export function useMountRef(): RefObject<boolean> {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

export function useClientEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
) {
  useEffect(() => {
    if (!isClientSide()) return;
    return effect();
  }, [deps, effect]);
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): {
  getValue: () => T;
  setValue: (value: T) => boolean;
  removeValue: () => boolean;
} {
  const getValue = useCallback((): T => {
    if (!isClientSide()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (typeof item === "string" && item !== null && item !== "undefined") {
        const parsed = JSON.parse(item) as T;
        return parsed !== null && parsed !== undefined ? parsed : defaultValue;
      }

      return defaultValue;
    } catch (error) {
      console.warn(`Failed to load from localStorage (${key}):`, error);
      return defaultValue;
    }
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T): boolean => {
      if (!isClientSide()) return false;

      try {
        if (value === null || value === undefined) {
          console.warn(
            `Attempted to store null/undefined value for key: ${key}`,
          );
          return false;
        }

        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Failed to save to localStorage (${key}):`, error);
        return false;
      }
    },
    [key],
  );

  const removeValue = useCallback((): boolean => {
    if (!isClientSide()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  }, [key]);

  return { getValue, setValue, removeValue };
}

export function useTimerManager(): {
  setTimer: (id: string, callback: () => void, delay: number) => void;
  clearTimer: (id: string) => void;
  clearAllTimers: () => void;
} {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  const setTimer = useCallback(
    (id: string, callback: () => void, delay: number) => {
      if (!isMountedRef.current) return;

      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          callback();
        }
        timersRef.current.delete(id);
      }, delay);

      timersRef.current.set(id, timer);
    },
    [isMountedRef],
  );

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return { setTimer, clearTimer, clearAllTimers };
}

export function useIntervalManager(): {
  setInterval: (id: string, callback: () => void, delay: number) => void;
  clearInterval: (id: string) => void;
  clearAllIntervals: () => void;
} {
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  const clearInterval = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval.toString());
      intervalsRef.current.delete(id);
    }
  }, []);

  const setInterval = useCallback(
    (id: string, callback: () => void, delay: number) => {
      if (!isMountedRef.current) return;

      const existingInterval = intervalsRef.current.get(id);
      if (existingInterval) {
        clearInterval(existingInterval.toString());
      }

      const interval = window.setInterval(() => {
        if (isMountedRef.current) {
          callback();
        }
      }, delay);

      intervalsRef.current.set(id, interval as unknown as NodeJS.Timeout);
    },
    [clearInterval, isMountedRef],
  );

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach((interval) =>
      clearInterval(interval.toString()),
    );
    intervalsRef.current.clear();
  }, [clearInterval]);

  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return { setInterval, clearInterval, clearAllIntervals };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

export function safeDOMManipulation(callback: () => void) {
  if (!isClientSide()) return;

  try {
    requestAnimationFrame(() => {
      callback();
    });
  } catch (error) {
    console.warn("DOM manipulation failed:", error);
  }
}

export function generateId(prefix: string = "id"): string {
  if (isClientSide()) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `${prefix}_${Date.now()}`;
}

export function withErrorHandling<
  T extends (...args: unknown[]) => unknown,
  F = undefined,
>(fn: T, fallback?: F): (...args: Parameters<T>) => ReturnType<T> | F {
  return (...args: Parameters<T>): ReturnType<T> | F => {
    try {
      return fn(...args) as ReturnType<T>;
    } catch (error) {
      console.error("Hook execution error:", error);
      return fallback as F;
    }
  };
}
