"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeConfig } from "@/types/theme";

/**
 * Represents a structured telemetry or runtime application log event.
 *
 * @interface LogEntry
 * @property {string} id - Unique identifier for the log record.
 * @property {string} timestamp - ISO-8601 formatted timestamp string when the event occurred.
 * @property {"INFO" | "WARN" | "ERROR" | "DEBUG"} level - Severity level classification.
 * @property {string} message - Primary event description text.
 * @property {string} source - Originating subsystem or module (e.g., "auth", "api").
 * @property {string} [details] - Optional contextual diagnostic metadata or payload.
 */
interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  source: string;
  details?: string;
}

/**
 * Properties for the LoggingMonitor telemetry dashboard component.
 *
 * @interface LoggingMonitorProps
 * @property {ThemeConfig} themeConfig - Active theme configuration providing interface styling colors.
 */
interface LoggingMonitorProps {
  themeConfig: ThemeConfig;
}

/**
 * Supported severity log levels for filtering and styling stream entries.
 *
 * @constant
 * @type {readonly ["INFO", "WARN", "ERROR", "DEBUG"]}
 */
const logLevels = ["INFO", "WARN", "ERROR", "DEBUG"] as const;

/**
 * Supported subsystem source tags for filtering log streams.
 *
 * @constant
 * @type {readonly ["system", "auth", "database", "api", "frontend"]}
 */
const logSources = ["system", "auth", "database", "api", "frontend"] as const;

/**
 * Administrative real-time log tailing and filtering monitor console.
 *
 * Simulates a streaming log console with live auto-scroll, full-text substring search,
 * severity level toggle filters, and source category toggles.
 *
 * @param {LoggingMonitorProps} props - The component properties.
 * @param {ThemeConfig} props.themeConfig - Color scheme and style definitions.
 * @returns {JSX.Element} The rendered log monitoring dashboard.
 */
export function LoggingMonitor({ themeConfig }: LoggingMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, _setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(logLevels),
  );
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(logSources),
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Generates a randomized mock log record for live telemetry demonstration.
   *
   * @returns {LogEntry} A newly generated log entry object.
   */
  const generateMockLog = (): LogEntry => {
    const levels: LogEntry["level"][] = ["INFO", "WARN", "ERROR", "DEBUG"];
    const sources: LogEntry["source"][] = [
      "system",
      "auth",
      "database",
      "api",
      "frontend",
    ];
    const messages = [
      "User authentication successful",
      "Database query executed",
      "API request processed",
      "Cache miss occurred",
      "Session timeout",
      "Rate limit exceeded",
      "File upload completed",
      "Email sent successfully",
      "Backup completed",
      "System health check passed",
    ];

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      details:
        Math.random() > 0.7 ? "Additional context information" : undefined,
    };
  };

  useEffect(() => {
    const initialLogs = Array.from({ length: 50 }, () => generateMockLog());
    setLogs(initialLogs);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLogs = [...prev, generateMockLog()];
        if (newLogs.length > 1000) {
          newLogs.splice(0, 100);
        }
        return newLogs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevels.has(log.level);
    const matchesSource = selectedSources.has(log.source);

    return matchesSearch && matchesLevel && matchesSource;
  });

  /**
   * Resolves the theme color hex code associated with a specific log severity level.
   *
   * @param {LogEntry["level"]} level - The log severity level.
   * @returns {string} Hex color string matching the theme configuration.
   */
  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "ERROR":
        return themeConfig.colors.error || "#ff4444";
      case "WARN":
        return themeConfig.colors.warning || "#ffaa00";
      case "INFO":
        return themeConfig.colors.info || "#00aaff";
      case "DEBUG":
        return themeConfig.colors.muted;
      default:
        return themeConfig.colors.text;
    }
  };

  /**
   * Toggles the filter inclusion state for a specific log severity level.
   *
   * @param {string} level - Severity level name to toggle.
   * @returns {void}
   */
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  /**
   * Toggles the filter inclusion state for a specific subsystem source origin.
   *
   * @param {string} source - Subsystem origin tag to toggle.
   * @returns {void}
   */
  const toggleSource = (source: string) => {
    setSelectedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  /**
   * Clears the current buffer of accumulated log entries.
   *
   * @returns {void}
   */
  const _clearLogs = () => {
    setLogs([]);
  };

  /**
   * Exports the currently filtered log records as a downloadable plain-text file.
   *
   * @returns {void}
   */
  const _exportLogs = () => {
    const logText = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`,
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              logs@portfolio:~$
            </span>
            <span className="text-sm opacity-70">./tail -f logs</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs opacity-70 mb-2">Search</div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            />
          </div>

          <div>
            <div className="text-xs opacity-70 mb-2">Log Levels</div>
            <div className="flex flex-wrap gap-1">
              {logLevels.map((level) => {
                const logStyle = `px-2 py-1 text-xs border rounded transition-colors ${selectedLevels.has(level) ? "opacity-100" : "opacity-50"}`;
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={logStyle}
                    style={{
                      borderColor: getLevelColor(level),
                      color: getLevelColor(level),
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs opacity-70 mb-2">Sources</div>
            <div className="flex flex-wrap gap-1">
              {logSources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${selectedSources.has(source) ? "opacity-100" : "opacity-50"}`}
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span>Total: {logs.length}</span>
              <span>Filtered: {filteredLogs.length}</span>
              <span>Auto-scroll: {autoScroll ? "ON" : "OFF"}</span>
            </div>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className="px-2 py-1 border rounded transition-colors"
              style={{
                borderColor: autoScroll
                  ? themeConfig.colors.success
                  : themeConfig.colors.border,
                color: autoScroll
                  ? themeConfig.colors.success
                  : themeConfig.colors.text,
              }}
            >
              {autoScroll ? "Lock" : "Unlock"}
            </button>
          </div>
        </div>
      </div>

      <div
        className="border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-bold"
            style={{ color: themeConfig.colors.accent }}
          >
            Application Logs
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          <div className="space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                No logs match the current filters
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-2 hover:opacity-80 transition-opacity"
                >
                  <span className="opacity-50 min-w-35">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className="min-w-15 font-bold"
                    style={{ color: getLevelColor(log.level) }}
                  >
                    {log.level}
                  </span>
                  <span className="opacity-70 min-w-20">[{log.source}]</span>
                  <span className="flex-1">{log.message}</span>
                  {log.details && (
                    <span className="opacity-50 text-xs">({log.details})</span>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
