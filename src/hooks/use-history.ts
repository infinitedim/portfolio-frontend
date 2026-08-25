"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/**
 * Represents a single executed terminal command record within the command history.
 */
export interface HistoryItem {
  /** The full command line string executed by the user. */
  command: string;
  /** Date object representing the exact time the command was run. */
  timestamp: Date;
  /** Indicates whether the command execution completed successfully without error. */
  success: boolean;
  /** Categorization tag inferred from the command root (e.g., 'system', 'portfolio', 'customization'). */
  category?: string;
  /** Flag marking whether the command has been starred or bookmarked by the user. */
  favorite?: boolean;
  /** Duration in milliseconds that the command took to finish executing. */
  executionTime?: number;
}

/**
 * Configuration options for initializing the command history management hook.
 */
interface UseHistoryOptions {
  /** Maximum number of history items to retain in memory and persistence (defaults to 200). */
  maxHistorySize?: number;
  /** LocalStorage key utilized for persisting serialized history (defaults to "-terminal-history"). */
  persistKey?: string;
  /** Whether to automatically classify commands into functional categories (defaults to true). */
  categorizeCommands?: boolean;
}

/**
 * Serialized representation of a command history entry stored in JSON format within localStorage.
 */
interface SerializedHistoryItem {
  /** The executed command line string. */
  command: string;
  /** ISO 8601 string representation of the execution timestamp. */
  timestamp: string;
  /** Whether the command succeeded. */
  success: boolean;
  /** Categorization tag. */
  category?: string;
  /** Favorite status flag. */
  favorite?: boolean;
  /** Execution elapsed time in milliseconds. */
  executionTime?: number;
}

/**
 * Custom React hook for tracking, persisting, filtering, and analyzing terminal command execution history.
 *
 * Provides localStorage persistence, debounced full-text search, automatic command categorization,
 * multi-criteria sorting (recency, frequency, alphabetical), favorites management, suggestions,
 * and JSON import/export capabilities.
 *
 * @param options - Configuration options controlling history size, storage key, and categorization behavior.
 * @param options.maxHistorySize - Maximum number of history items to retain in memory and persistence.
 * @param options.persistKey - LocalStorage key utilized for persisting serialized history.
 * @param options.categorizeCommands - Whether to automatically classify commands into functional categories.
 * @returns An object containing filtered history, analytics, search states, and manipulation actions:
 * - `history`: Filtered and sorted array of {@link HistoryItem} entries.
 * - `favorites`: Top favorite command entries.
 * - `frequentCommands`: Top most frequently executed commands with run counts.
 * - `categories`: List of unique category names available across recorded history.
 * - `commandFrequency`: Frequency map of command strings to execution counts.
 * - `searchQuery`: Current raw search query string.
 * - `setSearchQuery`: Dispatcher to update the search query.
 * - `selectedCategory`: Active category filter.
 * - `setSelectedCategory`: Dispatcher to update the category filter.
 * - `sortBy`: Active sort mode ('recent' | 'frequency' | 'alphabetical').
 * - `setSortBy`: Dispatcher to switch sort mode.
 * - `addToHistory`: Appends a new executed command to the history.
 * - `toggleFavorite`: Toggles the bookmark status of a specific command string.
 * - `clearHistory`: Clears all history entries from state and local storage.
 * - `exportHistory`: Downloads the entire command history as a JSON file.
 * - `importHistory`: Parses and loads command history from an uploaded JSON file.
 * - `getSuggestions`: Retrieves auto-completion command suggestions based on prefix match.
 * - `totalCommands`: Total number of recorded command history entries.
 * - `successRate`: Percentage of successfully executed commands (0-100).
 *
 * @example
 * ```tsx
 * const {
 *   history,
 *   addToHistory,
 *   searchQuery,
 *   setSearchQuery,
 *   getSuggestions,
 * } = useHistory({ maxHistorySize: 100 });
 * ```
 */
export function useHistory({
  maxHistorySize = 200,
  persistKey = "-terminal-history",
  categorizeCommands = true,
}: UseHistoryOptions = {}) {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedHistory = localStorage.getItem(persistKey);
      if (!savedHistory) return [];

      const data: unknown = JSON.parse(savedHistory);

      if (!Array.isArray(data) || data.length === 0) return [];

      const isValidItem = (item: unknown): item is SerializedHistoryItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SerializedHistoryItem).command === "string" &&
        typeof (item as SerializedHistoryItem).timestamp === "string";

      if (!data.every(isValidItem)) return [];

      return data.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "frequency" | "alphabetical">(
    "recent",
  );

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [history, persistKey]);

  const categorizeCommand = useCallback(
    (command: string): string => {
      if (!categorizeCommands) return "general";

      const cmd = command.toLowerCase().split(" ")[0];

      if (["theme", "font", "customize"].includes(cmd)) return "customization";
      if (["skills", "projects", "about"].includes(cmd)) return "portfolio";
      if (["help", "clear", "status", "alias"].includes(cmd)) return "system";
      if (["roadmap", "progress"].includes(cmd)) return "development";

      return "general";
    },
    [categorizeCommands],
  );

  const addToHistory = useCallback(
    (command: string, success: boolean = true, executionTime?: number) => {
      const trimmedCommand = command.trim();
      const category = categorizeCommand(trimmedCommand);

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.command !== trimmedCommand);
        const newItem: HistoryItem = {
          command: trimmedCommand,
          timestamp: new Date(),
          success,
          category,
          executionTime,
        };
        return [newItem, ...filtered].slice(0, maxHistorySize);
      });
    },
    [categorizeCommand, maxHistorySize],
  );

  const toggleFavorite = useCallback((command: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.command === command ? { ...item, favorite: !item.favorite } : item,
      ),
    );
  }, []);

  const getCommandFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};
    history.forEach((item) => {
      frequency[item.command] = (frequency[item.command] || 0) + 1;
    });
    return frequency;
  }, [history]);

  const categories = useMemo(() => {
    const cats = new Set(history.map((item) => item.category || "general"));
    return ["all", ...Array.from(cats)].sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.command.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    switch (sortBy) {
      case "frequency":
        return [...filtered].sort(
          (a, b) =>
            (getCommandFrequency[b.command] || 0) -
            (getCommandFrequency[a.command] || 0),
        );
      case "alphabetical":
        return [...filtered].sort((a, b) => a.command.localeCompare(b.command));
      case "recent":
      default:
        return [...filtered].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
    }
  }, [
    history,
    debouncedSearchQuery,
    selectedCategory,
    sortBy,
    getCommandFrequency,
  ]);

  const favorites = useMemo(
    () => history.filter((item) => item.favorite).slice(0, 10),
    [history],
  );

  const frequentCommands = useMemo(() => {
    return Object.entries(getCommandFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));
  }, [getCommandFrequency]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(persistKey);
  }, [persistKey]);

  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terminal-history-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  const importHistory = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);

        if (Array.isArray(imported)) {
          const validHistory = imported
            .filter(
              (item): item is SerializedHistoryItem =>
                typeof item === "object" &&
                item !== null &&
                typeof item.command === "string" &&
                item.timestamp,
            )
            .map((item) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            }));
          setHistory(validHistory);
        }
      } catch (error) {
        console.error("Failed to import history:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  const getSuggestions = useCallback(
    (partialCommand: string, limit: number = 5) => {
      const lowerPartial = partialCommand.toLowerCase();
      return history
        .filter((item) => item.command.toLowerCase().startsWith(lowerPartial))
        .slice(0, limit)
        .map((item) => item.command);
    },
    [history],
  );

  const stats = useMemo(
    () => ({
      totalCommands: history.length,
      successRate:
        history.length > 0
          ? (history.filter((item) => item.success).length / history.length) *
            100
          : 100,
    }),
    [history],
  );

  return {
    history: filteredHistory,
    favorites,
    frequentCommands,
    categories,
    commandFrequency: getCommandFrequency,

    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    addToHistory,
    toggleFavorite,
    clearHistory,
    exportHistory,
    importHistory,
    getSuggestions,

    totalCommands: stats.totalCommands,
    successRate: stats.successRate,
  };
}
