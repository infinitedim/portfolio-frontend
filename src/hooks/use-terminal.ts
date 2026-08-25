"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CommandParser } from "@/lib/commands/command-parser";
import {
  createHelpCommand,
  homeCommand,
  aboutCommand,
  projectsCommand,
  contactCommand,
  clearCommand,
  themeCommand,
  fontCommand,
  gitCommand,
} from "@/lib/commands/command-registry";
import { languageCommand } from "@/lib/commands/language-commands";
import { useCommandHistory } from "./use-command-history";
import { generateId } from "@/lib/utils/utils";

/**
 * Dynamically loads the roadmap command definitions.
 *
 * @returns An object containing the loaded `roadmapCommand` or null if loading fails or executed in SSR.
 */
const getRoadmapCommands = async () => {
  if (typeof window === "undefined") return { roadmapCommand: null };
  try {
    const { roadmapCommand } = await import("@/lib/commands/roadmap-commands");
    return { roadmapCommand };
  } catch (error) {
    console.error("Failed to load roadmap commands:", error);
    return { roadmapCommand: null };
  }
};

/**
 * Dynamically imports the tech stack command definitions.
 *
 * @returns The tech stack commands module, or null if import fails.
 */
const getTechStackCommands = async () => {
  try {
    return await import("@/lib/commands/tech-stack-commands");
  } catch {
    return null;
  }
};

/**
 * Dynamically imports the blog command definitions.
 *
 * @returns The blog commands module, or null if import fails.
 */
const getBlogCommands = async () => {
  try {
    return await import("@/lib/commands/blog-commands");
  } catch {
    return null;
  }
};

/**
 * Dynamically imports the general and resume command definitions.
 *
 * @returns The commands module, or null if import fails.
 */
const getResumeCommand = async () => {
  try {
    return await import("@/lib/commands/commands");
  } catch {
    return null;
  }
};

import type { CommandOutput, TerminalHistory } from "@/types/terminal";

/**
 * Local storage keys used for terminal state persistence.
 */
const STORAGE_KEYS = {
  COMMAND_HISTORY: "terminal-command-history",
} as const;

/**
 * Internal command action tokens for special terminal behavior.
 */
const SPECIAL_COMMANDS = {
  CLEAR: "CLEAR",
  THEME_PREFIX: "CHANGE_THEME:",
  FONT_PREFIX: "CHANGE_FONT:",
} as const;

/**
 * Complete list of available terminal root commands for autocomplete and suggestions.
 */
const ALL_COMMANDS = [
  "help",
  "about",
  "projects",
  "contact",
  "resume",
  "blog",
  "roadmap",
  "tech-stack",
  "skills",
  "theme",
  "font",
  "language",
  "clear",
] as const;

/**
 * Primary React hook orchestrating the interactive terminal emulator.
 *
 * Coordinates command parsing (via {@link CommandParser}), asynchronous command registration,
 * session output history, input line state, history traversal with up/down navigation,
 * and command frequency analytics.
 *
 * @param onOpenAuth - Optional callback triggered when a command requires authentication.
 * @param themePerformance - Optional performance profiling metrics for theme switching.
 * @param themePerformance.getPerformanceReport - Function returning performance summary report.
 * @param themePerformance.themeMetrics - Performance metrics collection object.
 * @param themePerformance.themeMetrics.switchCount - Total number of theme switch operations.
 * @param themePerformance.themeMetrics.averageSwitchTime - Average duration of theme switches.
 * @param themePerformance.themeMetrics.lastSwitchTime - Timestamp of the most recent theme switch.
 * @param themePerformance.themeMetrics.popularThemes - Array of most frequently chosen themes.
 * @param themePerformance.themeMetrics.renderTime - Time taken to render the active theme.
 * @param themePerformance.resetMetrics - Resets recorded theme performance metrics.
 * @returns An object managing terminal state, history, execution, and autocompletion:
 * - `history`: Array of {@link TerminalHistory} records containing past input/output pairs.
 * - `currentInput`: Current value of the terminal command line input prompt.
 * - `setCurrentInput`: State setter for the active input prompt string.
 * - `isProcessing`: True while an asynchronous command is actively executing.
 * - `isClearing`: True while the terminal clear transition animation is occurring.
 * - `executeCommand`: Parses and runs a command string, appending results to history.
 * - `addToHistory`: Manually appends a new input/output record to history.
 * - `navigateHistory`: Steps backward ('up') or forward ('down') through executed command history.
 * - `clearHistory`: Wipes all terminal output and command history from state and storage.
 * - `commandHistory`: Raw array of executed command strings.
 * - `lastError`: Error message from the most recent command failure, or null.
 * - `clearError`: Clears the current `lastError` state.
 * - `getCommandSuggestions`: Returns autocomplete candidate commands matching an input prefix.
 * - `getFrequentCommands`: Returns list of the most frequently executed commands.
 * - `commandAnalytics`: Analytics metrics computed by {@link useCommandHistory}.
 * - `favoriteCommands`: Bookmarked commands list.
 * - `enhancedHistory`: Full enhanced history list with metadata.
 *
 * @example
 * ```tsx
 * const {
 *   history,
 *   currentInput,
 *   setCurrentInput,
 *   executeCommand,
 *   navigateHistory,
 * } = useTerminal();
 * ```
 */
export function useTerminal(
  onOpenAuth?: () => void,
  themePerformance?: {
    getPerformanceReport: () => {
      totalSwitches: number;
      averageTime: number;
      fastestSwitch: number;
      slowestSwitch: number;
      themeUsage: Record<string, number>;
    };
    themeMetrics: {
      switchCount: number;
      averageSwitchTime: number;
      lastSwitchTime: number;
      popularThemes: { theme: string; count: number }[];
      renderTime: number;
    };
    resetMetrics: () => void;
  },
) {
  const [isClient, setIsClient] = useState(false);
  const [history, setHistory] = useState<TerminalHistory[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const {
    addCommand: addToAdvancedHistory,
    analytics,
    favorites,
    clearHistory: clearAdvancedHistory,
    history: advancedHistory,
  } = useCommandHistory({
    maxHistorySize: 500,
    persistKey: "terminal-command-history-enhanced",
    enableAnalytics: true,
    autoCategories: true,
  });

  const clearAdvancedHistoryRef = useRef(clearAdvancedHistory);
  const analyticsRef = useRef(analytics);
  const advancedHistoryRef = useRef(advancedHistory);
  const themePerformanceRef = useRef(themePerformance);

  clearAdvancedHistoryRef.current = clearAdvancedHistory;
  analyticsRef.current = analytics;
  advancedHistoryRef.current = advancedHistory;
  themePerformanceRef.current = themePerformance;

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isClearing, setIsClearing] = useState(false);

  const parserRef = useRef<CommandParser | null>(null);
  const isMountedRef = useRef(false);
  const currentInputRef = useRef(currentInput);
  const historyIndexRef = useRef(historyIndex);
  const historyDraftRef = useRef("");
  const lastHistoryNavigationValueRef = useRef<string | null>(null);

  currentInputRef.current = currentInput;
  historyIndexRef.current = historyIndex;

  const resetHistoryNavigation = useCallback(() => {
    historyIndexRef.current = -1;
    historyDraftRef.current = "";
    lastHistoryNavigationValueRef.current = null;
    setHistoryIndex(-1);
  }, []);

  const updateCurrentInput = useCallback(
    (value: string | ((prev: string) => string)) => {
      setCurrentInput((prev) => {
        const next = typeof value === "function" ? value(prev) : value;

        if (
          historyIndexRef.current !== -1 &&
          lastHistoryNavigationValueRef.current !== next
        ) {
          resetHistoryNavigation();
        }

        return next;
      });
    },
    [resetHistoryNavigation],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;
    if (!sessionStorage.getItem("gate_just_unlocked")) return;

    setHistory([
      {
        input: "",
        output: {
          type: "info",
          content:
            "Natas 0 → 3 → 5 cleared. Welcome to the terminal. Type `help`.",
          timestamp: new Date(),
          id: generateId(),
        },
        timestamp: new Date(),
      },
    ]);
    sessionStorage.removeItem("gate_just_unlocked");
  }, [isClient]);

  useEffect(() => {
    isMountedRef.current = true;

    const initializeParser = async () => {
      const parser = new CommandParser();

      parser.register(homeCommand);
      parser.register(aboutCommand);
      parser.register(projectsCommand);
      parser.register(contactCommand);
      parser.register(clearCommand);
      parser.register(themeCommand);
      parser.register(fontCommand);

      const [resumeCmds, techCmds, blogCmds] =
        await Promise.allSettled([
          getResumeCommand(),
          getTechStackCommands(),
          getBlogCommands(),
        ]);

      const blog = blogCmds.status === "fulfilled" ? blogCmds.value : null;
      if (blog?.blogCommand) parser.register(blog.blogCommand);

      const resume = resumeCmds.status === "fulfilled" ? resumeCmds.value : null;
      if (resume?.resumeCommand) parser.register(resume.resumeCommand);

      const { roadmapCommand } = await getRoadmapCommands();

      if (roadmapCommand) parser.register(roadmapCommand);

      parser.register(languageCommand);
      parser.register(gitCommand);

      const tech = techCmds.status === "fulfilled" ? techCmds.value : null;
      if (tech?.techStackCommand) parser.register(tech.techStackCommand);

      parser.register(createHelpCommand(() => parser.getCommands()));

      parserRef.current = parser;
    };

    initializeParser().catch((error) => {
      console.error("Failed to initialize command parser:", error);
    });

    return () => {
      isMountedRef.current = false;
      parserRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;

    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.COMMAND_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);

        if (typeof parsed === "object" && parsed !== null) {
          setCommandHistory(parsed as string[]);
        }
      }
    } catch (error) {
      console.warn("Failed to load command history:", error);
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.COMMAND_HISTORY,
          JSON.stringify(commandHistory),
        );
      } catch (error) {
        console.warn("Failed to save command history:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [commandHistory, isClient]);

  const commandHistoryRef = useRef(commandHistory);
  commandHistoryRef.current = commandHistory;

  const getNavigableHistory = useCallback(() => {
    const successfulAdvancedCommands = advancedHistoryRef.current
      .filter((entry) => entry.success)
      .map((entry) => entry.command.trim())
      .filter(Boolean);

    const fallbackCommands = commandHistoryRef.current
      .slice()
      .reverse()
      .map((command) => command.trim())
      .filter(Boolean);

    const source =
      successfulAdvancedCommands.length > 0
        ? successfulAdvancedCommands
        : fallbackCommands;

    const seen = new Set<string>();
    return source.filter((command) => {
      if (seen.has(command)) return false;
      seen.add(command);
      return true;
    });
  }, []);

  const executeCommand = useCallback(
    async (input: string): Promise<CommandOutput | null> => {
      setLastError(null);
      resetHistoryNavigation();

      if (!parserRef.current || !isMountedRef.current) {
        const errorMsg = "Terminal not ready";
        setLastError(errorMsg);
        return {
          type: "error",
          content: errorMsg,
          timestamp: new Date(),
          id: "error-not-ready",
        };
      }

      setIsProcessing(true);
      const startTime = performance.now();

      try {
        const output = await parserRef.current.parse(input);
        const executionTime = performance.now() - startTime;

        if (input.trim()) {
          addToAdvancedHistory(
            input.trim(),
            output.type !== "error",
            executionTime,
          );

          if (
            commandHistoryRef.current.length === 0 ||
            commandHistoryRef.current[commandHistoryRef.current.length - 1] !==
              input.trim()
          ) {
            setCommandHistory((prev) => [...prev, input.trim()]);
          }
        }

        if (output.content === SPECIAL_COMMANDS.CLEAR) {
          setHistory([]);
          setLastError(null);
          return null;
        }

        if (
          typeof output.content === "string" &&
          output.content.startsWith(SPECIAL_COMMANDS.THEME_PREFIX)
        ) {
          return output;
        }

        if (
          typeof output.content === "string" &&
          output.content.startsWith(SPECIAL_COMMANDS.FONT_PREFIX)
        ) {
          const fontName = output.content.split(":")[1];
          return {
            ...output,
            content: `Font changed to ${fontName}`,
          };
        }

        if (output.type === "error") {
          const errorMsg =
            typeof output.content === "string"
              ? output.content
              : "Unknown error occurred";
          setLastError(errorMsg);
        } else {
          setLastError(null);
        }

        return output;
      } catch (error) {
        const errorMsg = `Command execution failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        setLastError(errorMsg);
        console.error("Command execution error:", error);

        addToAdvancedHistory(
          input.trim(),
          false,
          performance.now() - startTime,
        );

        return {
          type: "error",
          content: errorMsg,
          timestamp: new Date(),
          id: "error-execution",
        };
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [addToAdvancedHistory, resetHistoryNavigation],
  );

  const addToHistory = useCallback(
    (input: string, output: CommandOutput) => {
      if (!isMountedRef.current) return;

      const newEntry: TerminalHistory = {
        input,
        output,
        timestamp:
          isClient && typeof window !== "undefined" ? new Date() : new Date(0),
      };
      setHistory((prev) => [...prev, newEntry]);
    },
    [isClient],
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      const recentCommands = getNavigableHistory();
      if (recentCommands.length === 0) return currentInputRef.current;

      const currentIndex = historyIndexRef.current;

      if (direction === "up") {
        if (currentIndex === -1) {
          historyDraftRef.current = currentInputRef.current;
        }

        const newIndex =
          currentIndex === -1
            ? 0
            : Math.min(recentCommands.length - 1, currentIndex + 1);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);

        const nextValue = recentCommands[newIndex] || "";
        lastHistoryNavigationValueRef.current = nextValue;
        return nextValue;
      }

      if (currentIndex === -1) {
        return currentInputRef.current;
      }

      const newIndex = currentIndex - 1;
      if (newIndex < 0) {
        historyIndexRef.current = -1;
        setHistoryIndex(-1);

        const draft = historyDraftRef.current;
        historyDraftRef.current = "";
        lastHistoryNavigationValueRef.current = draft;
        return draft;
      }

      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);

      const nextValue = recentCommands[newIndex] || "";
      lastHistoryNavigationValueRef.current = nextValue;
      return nextValue;
    },
    [getNavigableHistory],
  );

  const clearHistory = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsClearing(true);
    setTimeout(() => {
      if (!isMountedRef.current) return;

      setHistory([]);
      setCommandHistory([]);
      resetHistoryNavigation();
      setLastError(null);
      setIsClearing(false);

      clearAdvancedHistory();

      try {
        localStorage.removeItem(STORAGE_KEYS.COMMAND_HISTORY);
      } catch (error) {
        console.warn("Failed to clear command history from localStorage:", error);
      }
    }, 150);
  }, [clearAdvancedHistory, resetHistoryNavigation]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const getCommandSuggestions = useCallback(
    (input: string, limit: number = 8) => {
      if (!input.trim()) return [];

      const query = input.toLowerCase();
      const suggestions = ALL_COMMANDS.filter((command) =>
        command.toLowerCase().includes(query),
      )
        .sort((a, b) => {
          if (a.toLowerCase() === query) return -1;
          if (b.toLowerCase() === query) return 1;

          const aStartsWith = a.toLowerCase().startsWith(query);
          const bStartsWith = b.toLowerCase().startsWith(query);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          return a.localeCompare(b);
        })
        .slice(0, limit);

      return suggestions;
    },
    [],
  );

  const getFrequentCommands = useCallback(() => {
    const frequency = advancedHistory.reduce(
      (acc, entry) => {
        acc[entry.command] = (acc[entry.command] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command]) => command);
  }, [advancedHistory]);

  return {
    history,
    currentInput,
    setCurrentInput: updateCurrentInput,
    isProcessing,
    isClearing,
    executeCommand,
    addToHistory,
    navigateHistory,
    clearHistory,
    commandHistory,
    lastError,
    clearError,
    getCommandSuggestions,
    getFrequentCommands,
    commandAnalytics: analytics,
    favoriteCommands: favorites,
    enhancedHistory: advancedHistory,
  };
}
