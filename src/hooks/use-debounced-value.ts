"use client";

import { useState, useEffect, useRef, useMemo } from "react";

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
