"use client";

import { useState, useEffect, useRef, useMemo } from "react";

/**
 * React hook that returns a debounced version of a value, updating only after the specified delay has elapsed since the last change.
 *
 * @template T - Type of the input value.
 * @param {T} value - The dynamic value to debounce.
 * @param {number} [delay] - Debounce delay in milliseconds before state is updated.
 * @returns {T} The debounced value.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook that returns a debounced version of a callback function, delaying execution until after the specified delay has elapsed since the last invocation.
 *
 * @template T - Callback function type.
 * @param {T} callback - The callback function to debounce.
 * @param {number} [delay] - Debounce delay in milliseconds.
 * @returns {T} The debounced callback function.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300,
): T {
  const callbackRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const debouncedCallback = useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timerRef.current = null;
      }, delay);
    };
    return fn as T;
  }, [delay]);

  return debouncedCallback;
}
