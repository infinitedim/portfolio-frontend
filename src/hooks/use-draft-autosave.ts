"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface DraftData {
  content: string;
  title: string;
  summary: string;
  tags: string[];
  savedAt: string;
}

interface UseDraftAutosaveOptions {
  key: string;
  debounceMs?: number;
}

interface UseDraftAutosaveReturn {
  savedDraft: DraftData | null;
  saveDraft: (data: DraftData) => void;
  clearDraft: () => void;
  lastSavedAt: Date | null;
  hasDraft: boolean;
}

function isSSR(): boolean {
  return typeof window === "undefined";
}

function readDraft(key: string): DraftData | null {
  if (isSSR()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function writeDraft(key: string, data: DraftData): void {
  if (isSSR()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save draft to localStorage:", e);
  }
}

function removeDraft(key: string): void {
  if (isSSR()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function useDraftAutosave({
  key,
  debounceMs = 2000,
}: UseDraftAutosaveOptions): UseDraftAutosaveReturn {
  const [savedDraft, setSavedDraft] = useState<DraftData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);

  // Update key ref
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Load draft on mount / key change
  useEffect(() => {
    const draft = readDraft(key);
    setSavedDraft(draft);
    if (draft?.savedAt) {
      setLastSavedAt(new Date(draft.savedAt));
    }
  }, [key]);

  const saveDraft = useCallback(
    (data: DraftData) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const draftWithTimestamp: DraftData = {
          ...data,
          savedAt: new Date().toISOString(),
        };
        writeDraft(keyRef.current, draftWithTimestamp);
        setSavedDraft(draftWithTimestamp);
        setLastSavedAt(new Date());
      }, debounceMs);
    },
    [debounceMs],
  );

  const clearDraft = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    removeDraft(keyRef.current);
    setSavedDraft(null);
    setLastSavedAt(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    savedDraft,
    saveDraft,
    clearDraft,
    lastSavedAt,
    hasDraft: savedDraft !== null,
  };
}
