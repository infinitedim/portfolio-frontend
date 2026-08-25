/**
 * @fileoverview Custom hook and fuzzy matching engine for intelligent terminal command suggestions and autocomplete.
 * @module hooks/use-command-suggestions
 */

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/**
 * Represents an individual command auto-suggestion item with ranking and contextual metadata.
 *
 * @interface SuggestionItem
 * @property {string} command - Suggested command string.
 * @property {number} score - Relevance and fuzzy matching score (higher is more relevant).
 * @property {"exact" | "prefix" | "fuzzy" | "contextual" | "recent" | "popular"} type - Classification of suggestion source/match.
 * @property {string} [description] - Human-readable summary of what the command does.
 * @property {string} [usage] - Syntax guide or parameter format example.
 * @property {string} [category] - Functional category grouping.
 * @property {number} [frequency] - Execution frequency count.
 * @property {Date} [lastUsed] - Last execution timestamp.
 * @property {"start" | "middle" | "end" | "any"} [matchType] - Substring match location.
 */
export interface SuggestionItem {
  command: string;
  score: number;
  type: "exact" | "prefix" | "fuzzy" | "contextual" | "recent" | "popular";
  description?: string;
  usage?: string;
  category?: string;
  frequency?: number;
  lastUsed?: Date;
  matchType?: "start" | "middle" | "end" | "any";
}

/**
 * Detailed metadata profile describing a built-in terminal command.
 *
 * @interface CommandMetadata
 * @property {string} description - Summary of command functionality.
 * @property {string} category - Command classification.
 * @property {string} [usage] - Parameter usage example.
 * @property {string[]} [examples] - Example invocation strings.
 * @property {number} frequency - Global execution counter.
 * @property {Date} [lastUsed] - Last execution timestamp.
 * @property {string[]} [aliases] - Alternative command names or shorthands.
 * @property {string[]} [parameters] - Supported flags or subcommands.
 * @property {string[]} [tags] - Keyword tags for search matching.
 */
interface CommandMetadata {
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
  frequency: number;
  lastUsed?: Date;
  aliases?: string[];
  parameters?: string[];
  tags?: string[];
}

/**
 * Tracks session history and execution habits to personalize suggestion rankings.
 *
 * @interface UserContext
 * @property {string[]} recentCommands - Chronological list of recently executed commands.
 * @property {Map<string, number>} frequentCommands - Execution count map per command name.
 * @property {Map<string, string[]>} commandSequences - Sequential command transition chains.
 * @property {Date} sessionStartTime - Session initialization timestamp.
 * @property {number} totalCommands - Total count of executed commands in session.
 */
interface UserContext {
  recentCommands: string[];
  frequentCommands: Map<string, number>;
  commandSequences: Map<string, string[]>;
  sessionStartTime: Date;
  totalCommands: number;
}

/**
 * Built-in metadata dictionary for standard portfolio terminal commands.
 */
const COMMAND_METADATA: Record<string, CommandMetadata> = {
  help: {
    description: "Show all available commands and usage information",
    category: "system",
    usage: "help [command]",
    examples: ["help", "help theme", "help skills"],
    frequency: 0,
    tags: ["documentation", "assistance", "guide"],
  },
  clear: {
    description: "Clear the terminal screen and history",
    category: "system",
    usage: "clear",
    examples: ["clear", "cls"],
    frequency: 0,
    aliases: ["cls", "clr", "clean"],
    tags: ["cleanup", "reset", "screen"],
  },
  about: {
    description: "Display personal and professional information",
    category: "info",
    usage: "about",
    examples: ["about", "whoami"],
    frequency: 0,
    aliases: ["whoami", "info", "me"],
    tags: ["personal", "bio", "introduction"],
  },
  skills: {
    description: "Show technical skills and expertise levels",
    category: "info",
    usage: "skills [action] [category]",
    examples: ["skills", "skills overview", "skills list frontend"],
    frequency: 0,
    parameters: ["overview", "list", "update", "sync"],
    tags: ["expertise", "abilities", "roadmap"],
  },
  projects: {
    description: "Display portfolio projects and work samples",
    category: "info",
    usage: "projects [filter]",
    examples: ["projects", "projects web", "projects featured"],
    frequency: 0,
    aliases: ["portfolio", "work", "proj"],
    tags: ["portfolio", "work", "showcase"],
  },
  contact: {
    description: "Get contact information and social links",
    category: "info",
    usage: "contact",
    examples: ["contact", "reach", "connect"],
    frequency: 0,
    aliases: ["reach", "connect", "email"],
    tags: ["communication", "social", "networking"],
  },
  theme: {
    description: "Change terminal appearance and color scheme",
    category: "customization",
    usage: "theme [options] [name]",
    examples: ["theme -l", "theme dracula", "theme --preview matrix"],
    frequency: 0,
    parameters: ["-l", "--list", "-p", "--preview", "-c", "--current"],
    tags: ["appearance", "colors", "style"],
  },
  font: {
    description: "Change terminal font family and settings",
    category: "customization",
    usage: "font [options] [name]",
    examples: ["font -l", "font fira-code", "font --current"],
    frequency: 0,
    parameters: ["-l", "--list", "-c", "--current"],
    tags: ["typography", "appearance", "readability"],
  },
  customize: {
    description: "Open the terminal customization panel",
    category: "customization",
    usage: "customize",
    examples: ["customize"],
    frequency: 0,
    tags: ["settings", "preferences", "configuration"],
  },
  roadmap: {
    description: "Display learning progress and skill roadmap",
    category: "info",
    usage: "roadmap [section]",
    examples: ["roadmap", "roadmap frontend", "roadmap backend"],
    frequency: 0,
    tags: ["learning", "progress", "development"],
  },
  status: {
    description: "Show system status and information",
    category: "system",
    usage: "status",
    examples: ["status", "info", "sys"],
    frequency: 0,
    aliases: ["info", "sys", "system"],
    tags: ["system", "information", "diagnostics"],
  },
};

/**
 * Fuzzy search engine providing weighted score calculations and HTML match highlighting.
 */
class FuzzyMatcher {
  private static readonly WEIGHTS = {
    EXACT_MATCH: 100,
    PREFIX_MATCH: 85,
    WORD_BOUNDARY: 75,
    SEQUENTIAL_MATCH: 65,
    SCATTERED_MATCH: 45,
    POSITION_BONUS: 10,
    LENGTH_PENALTY: 5,
  };

  /**
   * Calculates a weighted relevance score comparing a user query against a candidate command string.
   *
   * @param {string} query - Typed query substring.
   * @param {string} target - Candidate command string to evaluate.
   * @returns {number} Numeric relevance score (0 if no match, up to 100 for exact match).
   */
  static calculateScore(query: string, target: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (lowerQuery === lowerTarget) {
      return this.WEIGHTS.EXACT_MATCH;
    }

    if (lowerTarget.startsWith(lowerQuery)) {
      const lengthRatio = lowerQuery.length / lowerTarget.length;
      return (
        this.WEIGHTS.PREFIX_MATCH + lengthRatio * this.WEIGHTS.POSITION_BONUS
      );
    }

    const words = lowerTarget.split(/[-_\s]+/);
    for (const word of words) {
      if (word.startsWith(lowerQuery)) {
        return this.WEIGHTS.WORD_BOUNDARY;
      }
    }

    let queryIndex = 0;
    let targetIndex = 0;
    let consecutiveMatches = 0;
    let totalMatches = 0;

    while (queryIndex < lowerQuery.length && targetIndex < lowerTarget.length) {
      if (lowerQuery[queryIndex] === lowerTarget[targetIndex]) {
        queryIndex++;
        totalMatches++;
        consecutiveMatches++;
      } else {
        consecutiveMatches = 0;
      }
      targetIndex++;
    }

    if (queryIndex === lowerQuery.length) {
      const matchRatio = totalMatches / lowerQuery.length;
      const consecutiveBonus = consecutiveMatches > 1 ? 10 : 0;
      const positionPenalty =
        ((targetIndex - totalMatches) / lowerTarget.length) *
        this.WEIGHTS.LENGTH_PENALTY;

      return Math.max(
        this.WEIGHTS.SCATTERED_MATCH * matchRatio +
          consecutiveBonus -
          positionPenalty,
        0,
      );
    }

    return 0;
  }

  /**
   * Wraps matching characters with `<mark>` tags for search highlighting in UI components.
   *
   * @param {string} query - Typed query substring.
   * @param {string} target - Full target string to highlight.
   * @returns {string} HTML string containing `<mark>` elements surrounding matching characters.
   */
  static highlightMatches(query: string, target: string): string {
    if (!query) return target;

    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();
    let result = "";
    let queryIndex = 0;

    for (let i = 0; i < target.length; i++) {
      if (
        queryIndex < lowerQuery.length &&
        lowerTarget[i] === lowerQuery[queryIndex]
      ) {
        result += `<mark>${target[i]}</mark>`;
        queryIndex++;
      } else {
        result += target[i];
      }
    }

    return result;
  }
}

/**
 * In-memory cache for computed suggestion lists with time-to-live expiration and LRU eviction.
 */
class SuggestionCache {
  private cache = new Map<
    string,
    { suggestions: SuggestionItem[]; timestamp: number; hits: number }
  >();
  private readonly TTL = 5 * 60 * 1000;
  private readonly MAX_SIZE = 50;

  /**
   * Stores a query suggestion result in the cache.
   *
   * @param {string} key - Cache query key.
   * @param {SuggestionItem[]} suggestions - List of computed suggestions.
   */
  set(key: string, suggestions: SuggestionItem[]): void {
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      suggestions,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Retrieves cached suggestions if available and within TTL.
   *
   * @param {string} key - Cache query key.
   * @returns {SuggestionItem[] | null} Cached suggestions or null if expired or missing.
   */
  get(key: string): SuggestionItem[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.suggestions;
  }

  /**
   * Identifies the least recently used or oldest entry in the cache for eviction.
   *
   * @private
   * @returns {string | null} Cache key of the oldest entry.
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime || entry.hits < lowestHits) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = entry.hits;
      }
    }

    return oldestKey;
  }

  /**
   * Empties the suggestion cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * React hook providing smart command autocomplete suggestions using fuzzy matching, history learning, and caching.
 *
 * @param {string} input - Current raw terminal input string.
 * @param {string[]} availableCommands - List of valid registered command names.
 * @param {object} [options] - Custom configuration parameters for debouncing, cache, and limits.
 * @param {number} [options.maxSuggestions] - Maximum number of suggestions returned.
 * @param {number} [options.debounceMs] - Input debounce time in milliseconds.
 * @param {boolean} [options.showOnEmpty] - Whether to show recent/popular suggestions when input is empty.
 * @param {boolean} [options.enableCache] - Whether to enable query result caching.
 * @param {boolean} [options.enableLearning] - Whether to record usage to adapt suggestions over time.
 * @param {number} [options.minQueryLength] - Minimum query length required to trigger suggestions.
 * @returns {object} Suggestions state, loading indicator, usage tracking callback, and cache controls.
 */
export function useCommandSuggestions(
  input: string,
  availableCommands: string[],
  options: {
    maxSuggestions?: number;
    debounceMs?: number;
    showOnEmpty?: boolean;
    enableCache?: boolean;
    enableLearning?: boolean;
    minQueryLength?: number;
  } = {},
) {
  const {
    maxSuggestions = 8,
    debounceMs = 50,
    showOnEmpty = true,
    enableCache = true,
    enableLearning = true,
    minQueryLength = 1,
  } = options;

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>(() => ({
    recentCommands: [],
    frequentCommands: new Map(),
    commandSequences: new Map(),
    sessionStartTime: new Date(),
    totalCommands: 0,
  }));

  const cacheRef = useRef(new SuggestionCache());
  const lastQueryRef = useRef("");

  const debouncedInput = useDebouncedValue(input.trim(), debounceMs);

  /**
   * Updates user execution statistics when a command is executed.
   *
   * @param {string} command - Executed command name.
   */
  const updateCommandUsage = useCallback(
    (command: string) => {
      if (!enableLearning) return;

      setUserContext((prev) => {
        const newContext = { ...prev };

        newContext.recentCommands = [
          command,
          ...prev.recentCommands.filter((c) => c !== command),
        ].slice(0, 10);

        const currentFreq = prev.frequentCommands.get(command) || 0;
        newContext.frequentCommands.set(command, currentFreq + 1);

        newContext.totalCommands++;

        return newContext;
      });

      const metadata = COMMAND_METADATA[command];
      if (metadata) {
        metadata.frequency++;
        metadata.lastUsed = new Date();
      }
    },
    [enableLearning],
  );

  /**
   * Generates and ranks contextual suggestions for a given input query.
   *
   * @param {string} query - Command query substring.
   * @returns {SuggestionItem[]} Sorted array of suggestion objects.
   */
  const generateContextualSuggestions = useCallback(
    (query: string): SuggestionItem[] => {
      const results: SuggestionItem[] = [];

      if (!query && showOnEmpty) {
        userContext.recentCommands.forEach((cmd, index) => {
          if (availableCommands.includes(cmd)) {
            const metadata = COMMAND_METADATA[cmd];
            results.push({
              command: cmd,
              score: 90 - index * 5,
              type: "recent",
              description: metadata?.description,
              category: metadata?.category,
              frequency: metadata?.frequency || 0,
              lastUsed: metadata?.lastUsed,
            });
          }
        });

        const popularCommands = [
          "help",
          "about",
          "skills",
          "projects",
          "contact",
        ].filter(
          (cmd) =>
            availableCommands.includes(cmd) &&
            !userContext.recentCommands.includes(cmd),
        );

        popularCommands.forEach((cmd, index) => {
          const metadata = COMMAND_METADATA[cmd];
          results.push({
            command: cmd,
            score: 80 - index * 3,
            type: "popular",
            description: metadata?.description,
            category: metadata?.category,
            frequency: metadata?.frequency || 0,
          });
        });

        return results.slice(0, maxSuggestions);
      }

      const uniqueCommands = Array.from(new Set(availableCommands));

      for (const command of uniqueCommands) {
        const score = FuzzyMatcher.calculateScore(query, command);

        if (score > 0) {
          const metadata = COMMAND_METADATA[command];
          const isRecent = userContext.recentCommands.includes(command);
          const frequency = userContext.frequentCommands.get(command) || 0;

          let adjustedScore = score;
          if (isRecent) adjustedScore += 15;
          if (frequency > 0) adjustedScore += Math.min(frequency * 2, 20);
          if (metadata?.lastUsed) {
            const daysSinceUsed =
              (Date.now() - metadata.lastUsed.getTime()) /
              (1000 * 60 * 60 * 24);
            if (daysSinceUsed < 1) adjustedScore += 10;
          }

          let type: SuggestionItem["type"] = "fuzzy";
          if (score >= 100) type = "exact";
          else if (score >= 85) type = "prefix";
          else if (isRecent && frequency > 0) type = "contextual";

          results.push({
            command,
            score: adjustedScore,
            type,
            description: metadata?.description,
            category: metadata?.category,
            usage: metadata?.usage,
            frequency: frequency,
            lastUsed: metadata?.lastUsed,
          });
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
    },
    [availableCommands, userContext, showOnEmpty, maxSuggestions],
  );

  const generateSuggestions = useMemo(() => {
    return (query: string): SuggestionItem[] => {
      if (enableCache) {
        const cached = cacheRef.current.get(query);
        if (cached) {
          return cached;
        }
      }

      setIsLoading(true);
      const suggestions = generateContextualSuggestions(query);

      if (enableCache) {
        cacheRef.current.set(query, suggestions);
      }

      setIsLoading(false);
      return suggestions;
    };
  }, [generateContextualSuggestions, enableCache]);

  useEffect(() => {
    if (debouncedInput.length < minQueryLength && !showOnEmpty) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = generateSuggestions(debouncedInput);
    setSuggestions(newSuggestions);
    lastQueryRef.current = debouncedInput;
  }, [debouncedInput, generateSuggestions, minQueryLength, showOnEmpty]);

  /**
   * Flushes the suggestion query cache.
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * Returns current user context statistics.
   *
   * @returns {UserContext} Current context state.
   */
  const getUserContext = useCallback(() => userContext, [userContext]);

  return {
    suggestions,
    isLoading,
    updateCommandUsage,
    clearCache,
    getUserContext,
    setUserContext,
  };
}
