"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Star, X, Play } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useCommandHistory } from "@/hooks/use-command-history";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Represents a single command entry in the interactive history timeline.
 */
interface TimelineEntry {
  /** Unique identifier for the timeline entry */
  id: string;
  /** Executed command string */
  command: string;
  /** Timestamp when the command was executed */
  timestamp: Date;
  /** Whether the command executed successfully */
  success: boolean;
  /** Execution duration in milliseconds */
  executionTime?: number;
  /** Category classification for the command */
  category: string;
  /** Whether the entry is marked as a favorite */
  favorite: boolean;
  /** Whether the entry details are currently expanded in the UI */
  expanded?: boolean;
  /** Execution context or environment details */
  context?: string;
}

/**
 * Configuration options for the history timeline view.
 */
interface TimelineConfig {
  /** Time-based grouping interval */
  groupBy: "hour" | "day" | "week" | "month";
  /** Whether to display detailed entry metadata */
  showDetails: boolean;
  /** Whether to display aggregate statistics */
  showStats: boolean;
  /** Whether to animate entries when first loaded */
  animateOnLoad: boolean;
  /** Whether search filtering is enabled */
  enableFiltering: boolean;
}

/**
 * Represents a recurring sequence of executed commands with usage statistics.
 */
interface ExecutionPattern {
  /** Sequence of command strings forming the pattern */
  sequence: string[];
  /** Number of times this sequence has been observed */
  frequency: number;
  /** Average time interval between commands in milliseconds */
  avgInterval: number;
  /** Percentage of successful executions in this sequence */
  successRate: number;
  /** Timestamp of the most recent execution of this sequence */
  lastUsed: Date;
}

/**
 * Props for the InteractiveCommandHistory component.
 */
interface InteractiveCommandHistoryProps {
  /** Whether the interactive history modal is visible */
  isVisible: boolean;
  /** Callback fired when a command is selected from history */
  onCommandSelect: (command: string) => void;
  /** Callback fired when the history modal is closed */
  onClose: () => void;
  /** Maximum height CSS value for the modal container */
  maxHeight?: string;
  /** Whether to subscribe to real-time command updates */
  enableRealTime?: boolean;
  /** Whether to detect and display recurring command patterns */
  showPatterns?: boolean;
  /** Whether automated command replay is supported */
  enableReplay?: boolean;
}

/**
 * Interactive modal component displaying command execution history with timeline filtering,
 * pattern recognition, automated replay capability, and execution analytics.
 *
 * @param props - Component properties for configuring history display and interactions.
 * @param props.isVisible - Whether the interactive history modal is visible.
 * @param props.onCommandSelect - Callback fired when a command is selected from history.
 * @param props.onClose - Callback fired when the history modal is closed.
 * @param props.maxHeight - Maximum height CSS value for the modal container.
 * @param props.enableRealTime - Whether to subscribe to real-time command updates.
 * @param props.showPatterns - Whether to detect and display recurring command patterns.
 * @param props.enableReplay - Whether automated command replay is supported.
 * @returns Rendered interactive command history overlay, or null if not visible.
 */
export function InteractiveCommandHistory({
  isVisible,
  onCommandSelect,
  onClose,
  maxHeight = "70vh",
  enableRealTime = true,
  showPatterns = true,
  enableReplay = true,
}: InteractiveCommandHistoryProps) {
  const { themeConfig } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>({
    groupBy: "hour",
    showDetails: true,
    showStats: true,
    animateOnLoad: true,
    enableFiltering: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [replayMode, setReplayMode] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const { history, analytics, toggleFavorite, removeCommand, exportHistory } =
    useCommandHistory();

  /**
   * Filters and formats history entries based on search queries and expansion state.
   *
   * @returns Array of formatted timeline entries.
   */
  const timelineEntries = useCallback((): TimelineEntry[] => {
    const filtered = history.filter((entry) => {
      if (searchQuery) {
        return (
          entry.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    });

    return filtered.map((entry) => ({
      ...entry,
      expanded: selectedEntry === entry.id,
    }));
  }, [history, searchQuery, selectedEntry]);

  /**
   * Identifies recurring 3-command execution sequences with usage stats.
   *
   * @returns List of top recurring execution patterns.
   */
  const commandPatterns = useCallback((): ExecutionPattern[] => {
    if (!showPatterns || history.length < 3) return [];

    const patterns: Map<string, ExecutionPattern> = new Map();

    for (let i = 0; i <= history.length - 3; i++) {
      const sequence = history.slice(i, i + 3).map((entry) => entry.command);
      const key = sequence.join(" → ");

      if (patterns.has(key)) {
        const pattern = patterns.get(key)!;
        pattern.frequency++;
        pattern.lastUsed = history[i + 2].timestamp;
      } else {
        const timestamps = history
          .slice(i, i + 3)
          .map((entry) => entry.timestamp);
        const intervals = timestamps
          .slice(1)
          .map((time, idx) => time.getTime() - timestamps[idx].getTime());
        const avgInterval =
          intervals.reduce((sum, interval) => sum + interval, 0) /
          intervals.length;

        const successes = history
          .slice(i, i + 3)
          .filter((entry) => entry.success);
        const successRate = (successes.length / 3) * 100;

        patterns.set(key, {
          sequence,
          frequency: 1,
          avgInterval,
          successRate,
          lastUsed: history[i + 2].timestamp,
        });
      }
    }

    return Array.from(patterns.values())
      .filter((pattern) => pattern.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }, [history, showPatterns]);

  /**
   * Formats a date object into a human-readable relative time string.
   *
   * @param timestamp - The date timestamp to format.
   * @returns Relative time string (e.g., 'Just now', '5m ago', '2d ago').
   */
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  /**
   * Resolves the theme color associated with a command category.
   *
   * @param category - The command category name.
   * @returns Hex or CSS color string for the category.
   */
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      info: themeConfig.colors.info || "#3B82F6",
      system: themeConfig.colors.error || "#EF4444",
      customization: themeConfig.colors.warning || "#F59E0B",
      development: themeConfig.colors.success || "#10B981",
      navigation: themeConfig.colors.accent || "#8B5CF6",
    };
    return categoryColors[category] || themeConfig.colors.muted || "#6B7280";
  };

  /**
   * Plays back a sequence of commands sequentially with playback delay.
   *
   * @param commands - Array of command strings to execute.
   * @returns Promise resolving once replay completes.
   */
  const handleReplay = useCallback(
    async (commands: string[]) => {
      if (!enableReplay) return;

      setReplayMode(true);

      for (let i = 0; i < commands.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 / replaySpeed));
        onCommandSelect(commands[i]);

        setSelectedEntry(`replay-${i}`);
      }

      setReplayMode(false);
      setSelectedEntry(null);
    },
    [enableReplay, replaySpeed, onCommandSelect],
  );

  /**
   * Toggles expansion state for a timeline entry.
   *
   * @param entry - The clicked timeline entry.
   */
  const handleEntryClick = (entry: TimelineEntry) => {
    if (selectedEntry === entry.id) {
      setSelectedEntry(null);
    } else {
      setSelectedEntry(entry.id);
    }
  };

  /**
   * Selects a detected command pattern and triggers replay if enabled.
   *
   * @param pattern - The execution pattern to select.
   */
  const handlePatternSelect = (pattern: ExecutionPattern) => {
    setSelectedPattern(pattern.sequence.join(" → "));
    if (enableReplay) {
      handleReplay(pattern.sequence);
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r" && e.ctrlKey) {
        e.preventDefault();
        setReplayMode(!replayMode);
      } else if (e.key === "e" && e.ctrlKey) {
        e.preventDefault();
        exportHistory();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose, replayMode, exportHistory]);

  if (!isVisible) return null;

  const entries = timelineEntries();
  const patterns = commandPatterns();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => e.target === containerRef.current && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="button"
      aria-label="Close dialog"
      tabIndex={0}
    >
      <div
        className="w-full max-w-6xl mx-4 rounded-lg border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Interactive Command History"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
          maxHeight,
        }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: `${themeConfig.colors.accent}08`,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <h3
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.text }}
            >
              Interactive Command History
            </h3>

            {replayMode && (
              <div className="flex items-center gap-2">
                <span className="animate-pulse text-red-500"></span>
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Replaying commands...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={timelineConfig.groupBy}
              onValueChange={(val) =>
                setTimelineConfig((prev) => ({
                  ...prev,
                  groupBy: val as TimelineConfig["groupBy"],
                }))
              }
            >
              <SelectTrigger
                className="w-40 px-3 py-1 h-[30px] text-sm rounded border bg-transparent focus:outline-none"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Group by Hour</SelectItem>
                <SelectItem value="day">Group by Day</SelectItem>
                <SelectItem value="week">Group by Week</SelectItem>
                <SelectItem value="month">Group by Month</SelectItem>
              </SelectContent>
            </Select>

            {enableReplay && (
              <div className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Speed:
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="w-16"
                />
                <span
                  className="text-sm w-8"
                  style={{ color: themeConfig.colors.muted }}
                >
                  {replaySpeed}x
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-opacity-20 transition-colors"
              style={{ color: themeConfig.colors.muted }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands, categories, or contexts..."
                className="w-full px-4 py-3 rounded border bg-transparent focus:outline-none focus:ring-2"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                  backgroundColor: `${themeConfig.colors.accent}05`,
                }}
              />
            </div>

            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    entry.expanded ? "ring-2" : ""
                  }`}
                  style={{
                    backgroundColor: entry.expanded
                      ? `${themeConfig.colors.accent}10`
                      : `${themeConfig.colors.accent}03`,
                    borderColor: entry.expanded
                      ? themeConfig.colors.accent
                      : themeConfig.colors.border,
                  }}
                  onClick={() => handleEntryClick(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleEntryClick(entry);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={entry.expanded}
                  aria-label={`Command: ${entry.command}, ${formatRelativeTime(entry.timestamp)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: entry.success
                              ? themeConfig.colors.success
                              : themeConfig.colors.error,
                          }}
                        />

                        <code
                          className="font-mono text-sm font-medium truncate"
                          style={{ color: themeConfig.colors.text }}
                        >
                          {entry.command}
                        </code>

                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: `${getCategoryColor(entry.category)}20`,
                            color: getCategoryColor(entry.category),
                          }}
                        >
                          {entry.category}
                        </span>

                        {entry.favorite && (
                          <span style={{ color: themeConfig.colors.warning }}>
                            <Star size={12} className="fill-current inline" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm opacity-75">
                        <span style={{ color: themeConfig.colors.muted }}>
                          {formatRelativeTime(entry.timestamp)}
                        </span>

                        {entry.executionTime && (
                          <span style={{ color: themeConfig.colors.muted }}>
                            {entry.executionTime}ms
                          </span>
                        )}
                      </div>

                      {entry.expanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span
                                className="font-medium"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Executed:
                              </span>
                              <span
                                className="ml-2"
                                style={{ color: themeConfig.colors.muted }}
                              >
                                {entry.timestamp.toLocaleString()}
                              </span>
                            </div>

                            <div>
                              <span
                                className="font-medium"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Status:
                              </span>
                              <span
                                className="ml-2"
                                style={{
                                  color: entry.success
                                    ? themeConfig.colors.success
                                    : themeConfig.colors.error,
                                }}
                              >
                                {entry.success ? "Success" : "Failed"}
                              </span>
                            </div>
                          </div>

                          {entry.context && (
                            <div>
                              <span
                                className="font-medium text-sm"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Context:
                              </span>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: themeConfig.colors.muted }}
                              >
                                {entry.context}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCommandSelect(entry.command);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.accent,
                                color: themeConfig.colors.accent,
                              }}
                            >
                              Re-run
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(entry.id);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.warning,
                                color: themeConfig.colors.warning,
                              }}
                            >
                              {entry.favorite ? "Unfavorite" : "Favorite"}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCommand(entry.id);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.error,
                                color: themeConfig.colors.error,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {index < entries.length - 1 && (
                      <div
                        className="w-px h-8 mt-6 ml-4"
                        style={{ backgroundColor: themeConfig.colors.border }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="text-center py-12">
                  <div
                    className="text-6xl mb-4 opacity-50"
                    style={{ color: themeConfig.colors.muted }}
                  ></div>
                  <p
                    className="text-lg mb-2"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    No command history found
                  </p>
                  <p
                    className="text-sm opacity-75"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Start executing commands to build your history
                  </p>
                </div>
              )}
            </div>
          </div>

          {showPatterns && patterns.length > 0 && (
            <div
              className="w-80 border-l overflow-y-auto p-6"
              style={{
                backgroundColor: `${themeConfig.colors.accent}05`,
                borderColor: themeConfig.colors.border,
              }}
            >
              <h4
                className="text-lg font-bold mb-4"
                style={{ color: themeConfig.colors.text }}
              >
                Command Patterns
              </h4>

              <div className="space-y-3">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border cursor-pointer transition-all duration-200 ${
                      selectedPattern === pattern.sequence.join(" → ")
                        ? "ring-2"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        selectedPattern === pattern.sequence.join(" → ")
                          ? `${themeConfig.colors.accent}15`
                          : `${themeConfig.colors.accent}05`,
                      borderColor: themeConfig.colors.border,
                    }}
                    onClick={() => handlePatternSelect(pattern)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePatternSelect(pattern);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Command pattern: ${pattern.sequence.join(" → ")}`}
                  >
                    <div className="mb-2">
                      {pattern.sequence.map((cmd, cmdIndex) => (
                        <span key={cmdIndex}>
                          <code
                            className="text-xs"
                            style={{ color: themeConfig.colors.text }}
                          >
                            {cmd}
                          </code>
                          {cmdIndex < pattern.sequence.length - 1 && (
                            <span
                              className="mx-1 text-xs"
                              style={{ color: themeConfig.colors.muted }}
                            >
                              →
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: themeConfig.colors.muted }}>
                        Used {pattern.frequency}x
                      </span>
                      <span style={{ color: themeConfig.colors.success }}>
                        {Math.round(pattern.successRate)}% success
                      </span>
                    </div>

                    {enableReplay && (
                      <div className="mt-2">
                        <button
                          className="text-xs px-2 py-1 rounded border"
                          style={{
                            borderColor: themeConfig.colors.accent,
                            color: themeConfig.colors.accent,
                          }}
                        >
                          Replay Pattern
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h5
                  className="font-medium mb-3"
                  style={{ color: themeConfig.colors.text }}
                >
                  Quick Stats
                </h5>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Total Commands:
                    </span>
                    <span style={{ color: themeConfig.colors.text }}>
                      {analytics?.totalCommands || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Success Rate:
                    </span>
                    <span style={{ color: themeConfig.colors.success }}>
                      {Math.round(analytics?.successRate || 0)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Unique Commands:
                    </span>
                    <span style={{ color: themeConfig.colors.text }}>
                      {analytics?.uniqueCommands || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="px-6 py-3 border-t text-sm"
          style={{
            backgroundColor: `${themeConfig.colors.muted}05`,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Interactive History</span>
              {enableRealTime && <span>Real-time updates</span>}
              {showPatterns && <span>Pattern recognition</span>}
              {enableReplay && (
                <span className="inline-flex items-center gap-1">
                  <Play size={10} className="inline fill-current text-emerald-400" /> Command replay
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span>Ctrl+R: Toggle replay</span>
              <span className="text-neutral-600">|</span>
              <span>Ctrl+E: Export</span>
              <span className="text-neutral-600">|</span>
              <span>Esc: Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
