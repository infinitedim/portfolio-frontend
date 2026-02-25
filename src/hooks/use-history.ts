"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface HistoryItem {
  command: string;
  timestamp: Date;
  success: boolean;
  category?: string;
  favorite?: boolean;
  executionTime?: number;
}

interface UseHistoryOptions {
  maxHistorySize?: number;
  persistKey?: string;
  categorizeCommands?: boolean;
}

interface SerializedHistoryItem {
  command: string;
  timestamp: string;
  success: boolean;
  category?: string;
  favorite?: boolean;
  executionTime?: number;
}

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
      if (
        ["skills", "projects", "about", "experience", "education"].includes(cmd)
      )
        return "portfolio";
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
