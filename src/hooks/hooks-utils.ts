/**
 * @fileoverview Utility functions and helper hooks for client-side state, lifecycle, timers, and storage.
 * @module hooks/hooks-utils
 */

import { useRef, useEffect, useCallback, type RefObject } from "react";

/**
 * Checks whether the current execution context is on the client side (browser) where `window` is defined.
 *
 * @returns {boolean} True if running in a browser environment with a defined `window` object; false during SSR.
 */
export const isClientSide = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * React hook that returns a ref tracking whether the component is currently mounted.
 *
 * Sets `isMountedRef.current` to true on mount and resets it to false on unmount.
 * Useful for preventing state updates or asynchronous callbacks after unmounting.
 *
 * @returns {RefObject<boolean>} A React ref object containing the current mount boolean state.
 */
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

/**
 * React hook for interacting with browser localStorage in a type-safe and SSR-safe manner.
 *
 * @template T - Type of the stored data value.
 * @param {string} key - The localStorage storage key.
 * @param {T} defaultValue - Default fallback value returned if key is missing, invalid, or during SSR.
 * @returns {{ getValue: () => T; setValue: (value: T) => boolean; removeValue: () => boolean; }} Object containing accessor and mutator methods for localStorage.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): {
  getValue: () => T;
  setValue: (value: T) => boolean;
  removeValue: () => boolean;
} {
  /**
   * Retrieves and parses the JSON value from localStorage for the configured key.
   *
   * @returns {T} The parsed value from localStorage or the defaultValue if unset or on error.
   */
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

  /**
   * Serializes and persists a value to localStorage for the configured key.
   *
   * @param {T} value - The value to store in localStorage.
   * @returns {boolean} True if storage succeeded, false if invalid value, SSR, or quota exceeded.
   */
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

  /**
   * Removes the item associated with the configured key from localStorage.
   *
   * @returns {boolean} True if successfully removed or false on failure / SSR.
   */
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

/**
 * React hook that manages multiple named `setTimeout` timers, ensuring automatic cleanup on component unmount.
 *
 * @returns {{ setTimer: (id: string, callback: () => void, delay: number) => void; clearTimer: (id: string) => void; clearAllTimers: () => void; }} Timer management functions: `setTimer`, `clearTimer`, and `clearAllTimers`.
 */
export function useTimerManager(): {
  setTimer: (id: string, callback: () => void, delay: number) => void;
  clearTimer: (id: string) => void;
  clearAllTimers: () => void;
} {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  /**
   * Sets or replaces a named timeout timer.
   *
   * @param {string} id - Unique identifier for the timer.
   * @param {() => void} callback - Function executed when the timer fires.
   * @param {number} delay - Delay in milliseconds before firing.
   */
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

  /**
   * Clears a specific active timer by identifier.
   *
   * @param {string} id - Unique identifier of the timer to cancel.
   */
  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Clears all currently active timers managed by this hook instance.
   */
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

/**
 * React hook that manages multiple named `setInterval` recurring timers with automatic unmount cleanup.
 *
 * @returns {{ setInterval: (id: string, callback: () => void, delay: number) => void; clearInterval: (id: string) => void; clearAllIntervals: () => void; }} Interval management functions: `setInterval`, `clearInterval`, and `clearAllIntervals`.
 */
export function useIntervalManager(): {
  setInterval: (id: string, callback: () => void, delay: number) => void;
  clearInterval: (id: string) => void;
  clearAllIntervals: () => void;
} {
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useMountRef();

  /**
   * Clears a specific active interval by identifier.
   *
   * @param {string} id - Unique identifier of the interval to cancel.
   */
  const clearInterval = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval.toString());
      intervalsRef.current.delete(id);
    }
  }, []);

  /**
   * Sets or replaces a named interval timer.
   *
   * @param {string} id - Unique identifier for the recurring interval.
   * @param {() => void} callback - Function executed on each tick.
   * @param {number} delay - Interval delay in milliseconds between executions.
   */
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

  /**
   * Clears all currently active intervals managed by this hook instance.
   */
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

/**
 * Safely executes a DOM mutation callback inside `requestAnimationFrame` on the client side.
 * Catches and logs any unexpected exceptions without crashing execution.
 *
 * @param {() => void} callback - DOM mutation or measurement callback.
 * @returns {void}
 */
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

/**
 * Generates a unique string identifier with an optional prefix, timestamp, and random suffix.
 *
 * @param {string} [prefix] - Prefix prepended to the generated identifier.
 * @returns {string} Unique identifier string.
 */
export function generateId(prefix: string = "id"): string {
  if (isClientSide()) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `${prefix}_${Date.now()}`;
}

/**
 * Higher-order function that wraps a function with a try-catch block and returns a fallback value upon error.
 *
 * @template T - Function type.
 * @template F - Fallback value type.
 * @param {T} fn - Target function to wrap.
 * @param {F} [fallback] - Fallback return value if an exception occurs during execution.
 * @returns {(...args: Parameters<T>) => ReturnType<T> | F} Safe wrapper function.
 */
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
