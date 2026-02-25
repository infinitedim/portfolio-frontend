"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { encryptedFetch } from "@/lib/crypto/encrypted-fetch";

interface UseEncryptedFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseEncryptedFetchOptions extends Omit<RequestInit, "body"> {
  body?: string;

  auto?: boolean;
}

export function useEncryptedFetch<T = unknown>(
  url: string,
  options: UseEncryptedFetchOptions = {},
): UseEncryptedFetchState<T> {
  const { auto = true, ...fetchOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef(0);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await encryptedFetch<T>(url, fetchOptions);
      setData(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchOptions, url]);

  useEffect(() => {
    if (auto || triggerRef.current > 0) {
      execute();
    }
  }, [auto, execute]);

  const refetch = useCallback(() => {
    triggerRef.current += 1;
    execute();
  }, [execute]);

  return { data, loading, error, refetch };
}
