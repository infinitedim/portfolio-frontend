/**
 * @fileoverview Custom hook for terminal command history management, analytics, search, filtering, and persistence.
 * @module hooks/use-command-history
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/**
 * Represents a single persisted terminal command execution record.
 *
 * @interface CommandHistoryEntry
 * @property {string} id - Unique identifier for the history entry.
 * @property {string} command - Raw command string that was entered.
 * @property {Date} timestamp - Date and time when the command was executed.
 * @property {boolean} success - Whether the command executed without runtime errors.
 * @property {number} [executionTime] - Optional execution duration in milliseconds.
 * @property {string} category - Command category (e.g. "portfolio", "system", "development", "social").
 * @property {boolean} favorite - Whether the user marked this command as a favorite.
 * @property {number} frequency - Number of times this exact command has been executed.
 * @property {string} [context] - Optional execution context or arguments metadata.
 */
export interface CommandHistoryEntry {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  executionTime?: number;
  category: string;
  favorite: boolean;
  frequency: number;
  context?: string;
}

/**
 * Filter and sorting criteria for querying command history entries.
 *
 * @interface HistorySearchOptions
 * @property {string} query - Text substring query to match against command or category.
 * @property {string} [category] - Specific category to filter by.
 * @property {boolean} [favorite] - Filter only favorite commands if true.
 * @property {"today" | "week" | "month" | "all"} [timeRange] - Time window constraint.
 * @property {"recent" | "frequency" | "alphabetical" | "execution_time"} sortBy - Sorting algorithm to apply.
 * @property {boolean} [success] - Filter by execution success status.
 */
export interface HistorySearchOptions {
  query: string;
  category?: string;
  favorite?: boolean;
  timeRange?: "today" | "week" | "month" | "all";
  sortBy: "recent" | "frequency" | "alphabetical" | "execution_time";
  success?: boolean;
}

/**
 * Configuration options for the useCommandHistory hook.
 *
 * @interface UseCommandHistoryOptions
 * @property {number} [maxHistorySize] - Maximum number of history entries retained in storage.
 * @property {string} [persistKey] - LocalStorage key for persisting history.
 * @property {boolean} [enableAnalytics] - Whether to calculate usage analytics and metrics.
 * @property {boolean} [autoCategories] - Whether to automatically assign categories to commands.
 */
interface UseCommandHistoryOptions {
  maxHistorySize?: number;
  persistKey?: string;
  enableAnalytics?: boolean;
  autoCategories?: boolean;
}

/**
 * Aggregated metrics and usage statistics derived from command history records.
 *
 * @interface HistoryAnalytics
 * @property {number} totalCommands - Total count of executed commands.
 * @property {number} uniqueCommands - Count of distinct command strings.
 * @property {number} successRate - Percentage of successfully executed commands (0-100).
 * @property {number} averageExecutionTime - Mean execution time across commands in milliseconds.
 * @property {Array<{ command: string; count: number; avgTime: number }>} topCommands - Most frequently run commands.
 * @property {Record<string, number>} commandsByCategory - Distribution of command executions per category.
 * @property {Array<{ date: string; count: number }>} recentActivity - Daily command counts over the past 7 days.
 * @property {Array<{ command: string; count: number }>} errorCommands - Commands that most frequently failed.
 */
export interface HistoryAnalytics {
  totalCommands: number;
  uniqueCommands: number;
  successRate: number;
  averageExecutionTime: number;
  topCommands: Array<{ command: string; count: number; avgTime: number }>;
  commandsByCategory: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  errorCommands: Array<{ command: string; count: number }>;
}

/**
 * React hook managing terminal command history, persistence to localStorage, search filtering, auto-suggestions, and analytics.
 *
 * @param {UseCommandHistoryOptions} [options] - Configuration options for history capacity, storage key, analytics, and categorization.
 * @returns {object} History collections, search filters, mutators, import/export utilities, and analytics.
 */
export function useCommandHistory({
  maxHistorySize = 500,
  persistKey = "-terminal-history",
  enableAnalytics = true,
  autoCategories = true,
}: UseCommandHistoryOptions = {}) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [searchOptions, setSearchOptions] = useState<HistorySearchOptions>({
    query: "",
    sortBy: "recent",
  });

  const debouncedSearch = useDebouncedValue(searchOptions.query, 150);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validHistory = parsed
          .filter((entry: unknown) => {
            const e = entry as Record<string, unknown>;
            return e.command && e.timestamp;
          })
          .map((entry: unknown) => {
            const e = entry as Record<string, unknown>;
            return {
              ...e,
              timestamp: new Date(e.timestamp as string),
            };
          });
        setHistory(validHistory);
      }
    } catch (error) {
      console.warn("Failed to load command history:", error);
    }
  }, [persistKey]);

  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [history, persistKey]);

  /**
   * Categorizes a command string based on known keywords and conventions.
   *
   * @param {string} command - Command name or input string.
   * @returns {string} Assigned category name.
   */
  const categorizeCommand = useCallback(
    (command: string): string => {
      if (!autoCategories) return "general";

      const cmd = command.toLowerCase().trim().split(" ")[0];

      if (["about", "skills", "projects", "resume"].includes(cmd)) {
        return "portfolio";
      }

      if (
        ["help", "clear", "status", "whoami", "pwd", "ls", "cd"].includes(cmd)
      ) {
        return "system";
      }

      if (
        ["build", "deploy", "test", "run", "start", "stop", "dev"].includes(cmd)
      ) {
        return "development";
      }

      if (["theme", "font", "customize", "config", "settings"].includes(cmd)) {
        return "customization";
      }

      if (["github", "linkedin", "email", "contact", "blog"].includes(cmd)) {
        return "social";
      }

      if (["demo"].includes(cmd)) {
        return "entertainment";
      }

      return "general";
    },
    [autoCategories],
  );

  /**
   * Records a new command execution entry in history or bumps the frequency of an existing one.
   *
   * @param {string} command - Command string executed.
   * @param {boolean} [success] - Whether the command succeeded.
   * @param {number} [executionTime] - Optional duration in ms.
   * @param {string} [context] - Optional execution context.
   */
  const addCommand = useCallback(
    (
      command: string,
      success: boolean = true,
      executionTime?: number,
      context?: string,
    ) => {
      if (!command.trim()) return;

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setHistory((prev) => {
        const existingIndex = prev.findIndex(
          (entry) => entry.command === command,
        );

        const newEntry: CommandHistoryEntry = {
          id,
          command: command.trim(),
          timestamp: new Date(),
          success,
          executionTime,
          category: categorizeCommand(command),
          favorite: false,
          frequency: existingIndex >= 0 ? prev[existingIndex].frequency + 1 : 1,
          context,
        };

        const filtered =
          existingIndex >= 0
            ? prev.filter((_, index) => index !== existingIndex)
            : prev;

        const updated = [newEntry, ...filtered];

        return updated.slice(0, maxHistorySize);
      });
    },
    [maxHistorySize, categorizeCommand],
  );

  /**
   * Toggles the favorite status of a specific command history entry by ID.
   *
   * @param {string} commandId - Unique ID of the history entry to toggle.
   */
  const toggleFavorite = useCallback((commandId: string) => {
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === commandId
          ? { ...entry, favorite: !entry.favorite }
          : entry,
      ),
    );
  }, []);

  /**
   * Removes a specific command from history by ID.
   *
   * @param {string} commandId - Unique ID of the history entry to delete.
   */
  const removeCommand = useCallback((commandId: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== commandId));
  }, []);

  /**
   * Clears all command history from memory and localStorage.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn("Failed to clear history:", error);
    }
  }, [persistKey]);

  /**
   * Creates a predicate function for filtering history entries by a time window.
   *
   * @param {string} timeRange - Time range string ("today", "week", "month", "all").
   * @returns {(entry: CommandHistoryEntry) => boolean} Filter predicate function.
   */
  const getTimeRangeFilter = useCallback((timeRange: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
      case "today":
        return (entry: CommandHistoryEntry) => entry.timestamp >= today;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return (entry: CommandHistoryEntry) => entry.timestamp >= weekAgo;
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return (entry: CommandHistoryEntry) => entry.timestamp >= monthAgo;
      }
      case "all":
      default:
        return () => true;
    }
  }, []);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.command.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query),
      );
    }

    if (searchOptions.category) {
      filtered = filtered.filter(
        (entry) => entry.category === searchOptions.category,
      );
    }

    if (searchOptions.favorite) {
      filtered = filtered.filter((entry) => entry.favorite);
    }

    if (searchOptions.timeRange) {
      const timeFilter = getTimeRangeFilter(searchOptions.timeRange);
      filtered = filtered.filter(timeFilter);
    }

    if (typeof searchOptions.success === "boolean") {
      filtered = filtered.filter(
        (entry) => entry.success === searchOptions.success,
      );
    }

    switch (searchOptions.sortBy) {
      case "frequency":
        return filtered.sort((a, b) => b.frequency - a.frequency);
      case "alphabetical":
        return filtered.sort((a, b) => a.command.localeCompare(b.command));
      case "execution_time":
        return filtered.sort(
          (a, b) => (b.executionTime || 0) - (a.executionTime || 0),
        );
      case "recent":
      default:
        return filtered.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
    }
  }, [history, debouncedSearch, searchOptions, getTimeRangeFilter]);

  /**
   * Generates autocomplete suggestions matching a partial command prefix weighted by frequency and recency.
   *
   * @param {string} partialCommand - Partial command input typed by user.
   * @param {number} [limit] - Maximum number of suggestions to return.
   * @returns {string[]} Ordered list of matching command suggestions.
   */
  const getSuggestions = useCallback(
    (partialCommand: string, limit: number = 8) => {
      if (!partialCommand.trim()) return [];

      const query = partialCommand.toLowerCase();

      return history
        .filter((entry) => entry.command.toLowerCase().startsWith(query))
        .sort((a, b) => {
          const frequencyScore = b.frequency - a.frequency;
          const recencyScore = b.timestamp.getTime() - a.timestamp.getTime();
          return frequencyScore * 0.7 + recencyScore * 0.3;
        })
        .slice(0, limit)
        .map((entry) => entry.command);
    },
    [history],
  );

  const categories = useMemo(() => {
    const cats = new Set(history.map((entry) => entry.category));
    return Array.from(cats).sort();
  }, [history]);

  const favorites = useMemo(() => {
    return history.filter((entry) => entry.favorite);
  }, [history]);

  const analytics = useMemo((): HistoryAnalytics => {
    if (!enableAnalytics || history.length === 0) {
      return {
        totalCommands: 0,
        uniqueCommands: 0,
        successRate: 100,
        averageExecutionTime: 0,
        topCommands: [],
        commandsByCategory: {},
        recentActivity: [],
        errorCommands: [],
      };
    }

    const uniqueCommands = new Set(history.map((entry) => entry.command)).size;
    const successfulCommands = history.filter((entry) => entry.success).length;
    const successRate = (successfulCommands / history.length) * 100;

    const commandsWithTime = history.filter((entry) => entry.executionTime);
    const averageExecutionTime =
      commandsWithTime.length > 0
        ? commandsWithTime.reduce(
            (sum, entry) => sum + (entry.executionTime || 0),
            0,
          ) / commandsWithTime.length
        : 0;

    const commandFrequency: Record<
      string,
      { count: number; totalTime: number; executions: number }
    > = {};

    history.forEach((entry) => {
      if (!commandFrequency[entry.command]) {
        commandFrequency[entry.command] = {
          count: 0,
          totalTime: 0,
          executions: 0,
        };
      }
      commandFrequency[entry.command].count += 1;
      if (entry.executionTime) {
        commandFrequency[entry.command].totalTime += entry.executionTime;
        commandFrequency[entry.command].executions += 1;
      }
    });

    const topCommands = Object.entries(commandFrequency)
      .map(([command, data]) => ({
        command,
        count: data.count,
        avgTime: data.executions > 0 ? data.totalTime / data.executions : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const commandsByCategory: Record<string, number> = {};
    history.forEach((entry) => {
      commandsByCategory[entry.category] =
        (commandsByCategory[entry.category] || 0) + 1;
    });

    const recentActivity: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = history.filter((entry) => {
        const entryDate = entry.timestamp.toISOString().split("T")[0];
        return entryDate === dateStr;
      }).length;

      recentActivity.push({ date: dateStr, count });
    }

    const errorCommands = Object.entries(
      history
        .filter((entry) => !entry.success)
        .reduce(
          (acc, entry) => {
            acc[entry.command] = (acc[entry.command] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
    )
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCommands: history.length,
      uniqueCommands,
      successRate,
      averageExecutionTime,
      topCommands,
      commandsByCategory,
      recentActivity,
      errorCommands,
    };
  }, [history, enableAnalytics]);

  /**
   * Serializes history entries into a downloadable JSON file artifact.
   */
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

  /**
   * Imports and merges history entries from an uploaded JSON file.
   *
   * @param {File} file - JSON file to import.
   */
  const importHistory = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);

          if (Array.isArray(imported)) {
            const validHistory = imported
              .filter((entry: unknown) => {
                const e = entry as Record<string, unknown>;
                return e.command && e.timestamp;
              })
              .map((entry: unknown) => {
                const e = entry as Record<string, unknown>;
                return {
                  id:
                    (e.id as string) ||
                    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  command: e.command as string,
                  timestamp: new Date(e.timestamp as string),
                  success:
                    e.success !== undefined ? (e.success as boolean) : true,
                  executionTime: e.executionTime as number | undefined,
                  category:
                    (e.category as string) ||
                    categorizeCommand(e.command as string),
                  favorite: (e.favorite as boolean) || false,
                  frequency: (e.frequency as number) || 1,
                  context: e.context as string | undefined,
                } as CommandHistoryEntry;
              });
            setHistory(validHistory);
          }
        } catch (error) {
          console.error("Failed to import history:", error);
        }
      };
      reader.readAsText(file);
    },
    [categorizeCommand],
  );

  return {
    history: filteredHistory,
    allHistory: history,
    categories,
    favorites,
    analytics,
    searchOptions,
    setSearchOptions,
    updateSearchQuery: (query: string) =>
      setSearchOptions((prev) => ({ ...prev, query })),
    addCommand,
    toggleFavorite,
    removeCommand,
    clearHistory,
    exportHistory,
    importHistory,
    getSuggestions,
    totalCommands: history.length,
    uniqueCommands: new Set(history.map((entry) => entry.command)).size,
  };
}
