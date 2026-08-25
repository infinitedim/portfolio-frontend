"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Schema representing autosaved blog post draft data persisted in browser storage.
 *
 * @interface DraftData
 * @property {string} content - Markdown/MDX body content of the draft post.
 * @property {string} title - Title of the draft article.
 * @property {string} summary - Brief excerpt or summary description.
 * @property {string[]} tags - Array of associated category tags.
 * @property {string} savedAt - ISO 8601 timestamp string representing when the draft was saved.
 */
export interface DraftData {
  content: string;
  title: string;
  summary: string;
  tags: string[];
  savedAt: string;
}

/**
 * Options configuring the {@link useDraftAutosave} hook.
 *
 * @interface UseDraftAutosaveOptions
 * @property {string} key - Unique localStorage storage key for the draft entity.
 * @property {number} [debounceMs] - Debounce interval in milliseconds before persisting changes.
 */
interface UseDraftAutosaveOptions {
  key: string;
  debounceMs?: number;
}

/**
 * Return type and action methods provided by the {@link useDraftAutosave} hook.
 *
 * @interface UseDraftAutosaveReturn
 * @property {DraftData | null} savedDraft - Current autosaved draft state loaded from storage.
 * @property {(data: DraftData) => void} saveDraft - Function to queue an autosave operation with debounce.
 * @property {() => void} clearDraft - Function to remove the persisted draft from storage.
 * @property {Date | null} lastSavedAt - Date instance representing when the latest save completed.
 * @property {boolean} hasDraft - Flag indicating whether a saved draft currently exists.
 */
interface UseDraftAutosaveReturn {
  savedDraft: DraftData | null;
  saveDraft: (data: DraftData) => void;
  clearDraft: () => void;
  lastSavedAt: Date | null;
  hasDraft: boolean;
}

/**
 * Checks whether the current code execution is running in a server-side rendering environment.
 *
 * @returns {boolean} True if running on the server (no `window` object); false in the browser.
 */
function isSSR(): boolean {
  return typeof window === "undefined";
}

/**
 * Reads and parses a persisted draft record from localStorage.
 *
 * @param {string} key - The localStorage storage key.
 * @returns {DraftData | null} Parsed draft data object, or `null` if missing or invalid.
 */
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

/**
 * Serializes and writes draft data to localStorage.
 *
 * @param {string} key - The localStorage storage key.
 * @param {DraftData} data - The draft data object to persist.
 */
function writeDraft(key: string, data: DraftData): void {
  if (isSSR()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save draft to localStorage:", e);
  }
}

/**
 * Removes a persisted draft record from localStorage.
 *
 * @param {string} key - The localStorage storage key to delete.
 */
function removeDraft(key: string): void {
  if (isSSR()) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    throw new Error("Failed to remove draft from localStorage", { cause: e });
  }
}

/**
 * React hook that provides debounced local draft autosave and restore functionality for blog post editing forms.
 *
 * @param {UseDraftAutosaveOptions} options - Autosave options including storage key and debounce delay.
 * @param {string} options.key - Unique localStorage key for the draft.
 * @param {number} [options.debounceMs] - Debounce delay in milliseconds before saving to storage.
 * @returns {UseDraftAutosaveReturn} Autosave state and draft control handlers.
 */
export function useDraftAutosave({
  key,
  debounceMs = 2000,
}: UseDraftAutosaveOptions): UseDraftAutosaveReturn {
  const [savedDraft, setSavedDraft] = useState<DraftData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

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
