/**
 * Represents an individual performance measurement data point.
 *
 * @interface PerformanceMetric
 * @property {string} name - The identifier or description of the measured operation.
 * @property {number} value - The measured value (typically duration in milliseconds).
 * @property {number} timestamp - High-resolution timestamp when the metric was recorded.
 * @property {"command" | "render" | "theme" | "font" | "history" | "system"} category - Categorization bucket for the metric.
 * @property {Record<string, unknown>} [metadata] - Optional contextual metadata associated with the measurement.
 */
interface PerformanceMetric {
  /**
   * The identifier or description of the measured operation.
   */
  name: string;
  /**
   * The duration in milliseconds or measured numeric value.
   */
  value: number;
  /**
   * High-resolution timestamp from `performance.now()`.
   */
  timestamp: number;
  /**
   * Metric category classification.
   */
  category: "command" | "render" | "theme" | "font" | "history" | "system";
  /**
   * Optional custom key-value metadata for deeper analysis.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Summarized diagnostic performance report containing raw metrics, computed averages, and suggestions.
 *
 * @interface PerformanceReport
 * @property {PerformanceMetric[]} metrics - List of all captured performance metrics.
 * @property {object} summary - Aggregated statistical figures and resource usages.
 * @property {number} summary.totalCommands - Total count of executed command metrics.
 * @property {number} summary.averageCommandTime - Average execution time for commands in milliseconds.
 * @property {number} summary.averageRenderTime - Average component rendering time in milliseconds.
 * @property {{ name: string; time: number }} summary.slowestCommand - Information about the command with longest duration.
 * @property {number} [summary.memoryUsage] - JS heap memory usage in bytes if available in environment.
 * @property {number} summary.historySize - Number of items stored in terminal command history.
 * @property {string[]} recommendations - Automated actionable optimization suggestions based on analyzed metrics.
 * @property {number} generatedAt - Epoch timestamp when the report was generated.
 */
interface PerformanceReport {
  /**
   * Array of recorded performance metric points.
   */
  metrics: PerformanceMetric[];
  /**
   * Aggregated performance statistics and metrics summary.
   */
  summary: {
    /** Total number of tracked commands. */
    totalCommands: number;
    /** Average execution time for commands in milliseconds. */
    averageCommandTime: number;
    /** Average render time for components in milliseconds. */
    averageRenderTime: number;
    /** Slowest recorded command name and duration. */
    slowestCommand: { name: string; time: number };
    /** Used JS heap size in bytes, if available. */
    memoryUsage?: number;
    /** Total entries in terminal command history. */
    historySize: number;
  };
  /**
   * Actionable performance recommendations derived from recorded metrics.
   */
  recommendations: string[];
  /**
   * Timestamp (epoch ms) of report generation.
   */
  generatedAt: number;
}

/**
 * Singleton performance monitoring service providing timing measurement, system resource tracking,
 * metric aggregation, and optimization recommendations.
 *
 * @class PerformanceMonitor
 */
export class PerformanceMonitor {
  /**
   * Singleton instance reference.
   */
  private static instance: PerformanceMonitor;
  /**
   * In-memory buffer of captured performance metrics.
   */
  private metrics: PerformanceMetric[] = [];
  /**
   * Active timer start timestamps mapped by label name.
   */
  private startTimes: Map<string, number> = new Map();
  /**
   * Active periodic interval timers for background system monitoring.
   */
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  /**
   * Active timeout timers.
   */
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  /**
   * Flag controlling whether metric capturing is active.
   */
  private isEnabled: boolean = true;
  /**
   * Maximum capacity of metric items to prevent memory unbounded growth.
   */
  private maxMetrics: number = 1000;

  /**
   * Internal React/Next.js development measure names to ignore during observer filtering.
   */
  private static readonly DEV_INTERNAL_MEASURE_NAMES = new Set([
    "HotReload",
    "Mount",
    "Reconnect",
    "AppDevOverlayErrorBoundary",
    "DevRootHTTPAccessFallbackBoundary",
    "HTTPAccessFallbackBoundary",
    "HTTPAccessFallbackErrorBoundary",
    "RedirectBoundary",
    "RedirectErrorBoundary",
  ]);

  /**
   * Private constructor to enforce singleton pattern and initialize observers and polling.
   */
  private constructor() {
    this.setupPerformanceObserver();
    this.startSystemMonitoring();
  }

  /**
   * Retrieves the global singleton instance of the PerformanceMonitor.
   *
   * @static
   * @returns {PerformanceMonitor} The singleton instance.
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enables or disables performance metric collection.
   *
   * @param {boolean} enabled - Whether performance monitoring is active.
   * @returns {void}
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Performance monitoring ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Starts a high-resolution performance timer under the given operation name.
   *
   * @param name - Unique identifier for the timed operation.
   * @param category - Category for the operation.
   * @returns {void}
   */
  startTiming(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    category: PerformanceMetric["category"] = "system",
  ): void {
    if (!this.isEnabled) return;

    this.startTimes.set(name, performance.now());
  }

  /**
   * Stops an active timer, calculates elapsed duration, and records the metric.
   *
   * @param name - Identifier corresponding to the previously started timer.
   * @param category - Category bucket for the metric.
   * @param metadata - Optional contextual metadata.
   * @returns {number} The elapsed duration in milliseconds, or 0 if timer was missing/disabled.
   */
  endTiming(
    name: string,
    category: PerformanceMetric["category"] = "system",
    metadata?: Record<string, unknown>,
  ): number {
    if (!this.isEnabled) return 0;

    const startTime = this.startTimes.get(name);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(name);

    this.recordMetric(name, duration, category, metadata);
    return duration;
  }

  /**
   * Records an explicit performance metric data point directly into the collection buffer.
   *
   * @param {string} name - Operation or metric name.
   * @param {number} value - Measured numerical value (e.g., duration in ms).
   * @param {PerformanceMetric["category"]} category - Category bucket for classification.
   * @param {Record<string, unknown>} [metadata] - Additional contextual data.
   * @returns {void}
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric["category"],
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    if (name !== "memory-usage" && name !== "history-size" && value > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${value.toFixed(2)}ms`,
        metadata,
      );
    }
  }

  /**
   * Measures the execution duration of an asynchronous command operation.
   *
   * @async
   * @template T
   * @param {string} commandName - Name or identifier of the command being executed.
   * @param {() => Promise<T>} commandFn - Async function executing the command logic.
   * @param {Record<string, unknown>} [metadata] - Optional metadata to associate with execution.
   * @returns {Promise<T>} The result returned by `commandFn`.
   * @throws Will rethrow any error thrown during command execution.
   */
  async measureCommand<T>(
    commandName: string,
    commandFn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.isEnabled) return commandFn();

    this.startTiming(`command-${commandName}`, "command");

    try {
      const result = await commandFn();
      this.endTiming(`command-${commandName}`, "command", {
        ...metadata,
        success: true,
      });
      return result;
    } catch (error) {
      this.endTiming(`command-${commandName}`, "command", {
        ...metadata,
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Measures the execution time of a synchronous render function.
   *
   * @param {string} componentName - Name of the component being rendered.
   * @param {() => void} renderFn - Callback executing component rendering logic.
   * @returns {void}
   */
  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.isEnabled) {
      renderFn();
      return;
    }

    this.startTiming(`render-${componentName}`, "render");
    renderFn();
    this.endTiming(`render-${componentName}`, "render");
  }

  /**
   * Computes an aggregate diagnostic performance report including averages and automated recommendations.
   *
   * @returns {PerformanceReport} Structured performance report object.
   */
  getReport(): PerformanceReport {
    const commandMetrics = this.metrics.filter((m) => m.category === "command");
    const renderMetrics = this.metrics.filter((m) => m.category === "render");

    const totalCommands = commandMetrics.length;
    const averageCommandTime =
      totalCommands > 0
        ? commandMetrics.reduce((sum, m) => sum + m.value, 0) / totalCommands
        : 0;

    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) /
          renderMetrics.length
        : 0;

    const slowestCommand = commandMetrics.reduce(
      (slowest, current) =>
        current.value > slowest.time
          ? { name: current.name, time: current.value }
          : slowest,
      { name: "none", time: 0 },
    );

    const recommendations = this.generateRecommendations();

    return {
      metrics: [...this.metrics],
      summary: {
        totalCommands,
        averageCommandTime,
        averageRenderTime,
        slowestCommand,
        memoryUsage: this.getMemoryUsage(),
        historySize: this.getHistorySize(),
      },
      recommendations,
      generatedAt: Date.now(),
    };
  }

  /**
   * Filters and retrieves metrics associated with a specific category.
   *
   * @param {PerformanceMetric["category"]} category - Category identifier to filter by.
   * @returns {PerformanceMetric[]} Array of matching metrics.
   */
  getMetricsByCategory(
    category: PerformanceMetric["category"],
  ): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  /**
   * Clears all recorded metrics and pending start timers from memory.
   *
   * @returns {void}
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
    console.log("Performance metrics cleared");
  }

  /**
   * Exports the current performance report as formatted JSON string.
   *
   * @returns {string} JSON representation of the performance report.
   */
  exportMetrics(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Configures the browser PerformanceObserver API to track native measure entries.
   *
   * @private
   * @returns {void}
   */
  private setupPerformanceObserver(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "measure") {
            if (PerformanceMonitor.DEV_INTERNAL_MEASURE_NAMES.has(entry.name)) {
              return;
            }
            this.recordMetric(entry.name, entry.duration, "system", {
              entryType: entry.entryType,
            });
          }
        });
      });

      observer.observe({ entryTypes: ["measure", "navigation"] });
    } catch (error) {
      console.warn("Failed to setup PerformanceObserver:", error);
    }
  }

  /**
   * Starts background recurring timers to monitor memory usage and history growth.
   *
   * @private
   * @returns {void}
   */
  private startSystemMonitoring(): void {
    if (typeof window === "undefined") return;

    const memoryInterval = setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage) {
        this.recordMetric("memory-usage", memoryUsage, "system");
      }
    }, 30000);

    const historyInterval = setInterval(() => {
      const historySize = this.getHistorySize();
      this.recordMetric("history-size", historySize, "history");
    }, 10000);

    this.intervals.set("memory-monitoring", memoryInterval);
    this.intervals.set("history-monitoring", historyInterval);
  }

  /**
   * Stops all active intervals and timeouts, and clears metrics data.
   *
   * @returns {void}
   */
  stopMonitoring(): void {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    this.timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();

    this.metrics.length = 0;
  }

  /**
   * Retrieves used JavaScript heap size from browser performance memory API.
   *
   * @private
   * @returns {number | undefined} Heap size in bytes, or undefined if unsupported.
   */
  private getMemoryUsage(): number | undefined {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in performance
    ) {
      const memory = (
        performance as Performance & { memory?: { usedJSHeapSize: number } }
      ).memory;
      return memory?.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Retrieves current number of commands in terminal history from localStorage.
   *
   * @private
   * @returns {number} Count of history entries, or 0 if unreadable.
   */
  private getHistorySize(): number {
    try {
      const historyData = localStorage.getItem("terminal-history");

      if (typeof historyData === "string" && historyData !== null) {
        const parsed = JSON.parse(historyData);

        if (typeof parsed === "object" && parsed !== null) {
          return (parsed as string[]).length;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Analyzes recorded metrics to formulate optimization suggestions.
   *
   * @private
   * @returns {string[]} Array of human-readable optimization recommendation strings.
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const commandMetrics = this.getMetricsByCategory("command");
    const renderMetrics = this.getMetricsByCategory("render");
    const totalCommands = commandMetrics.length;
    const averageCommandTime =
      totalCommands > 0
        ? commandMetrics.reduce((sum, m) => sum + m.value, 0) / totalCommands
        : 0;
    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) /
          renderMetrics.length
        : 0;
    const slowestCommand = commandMetrics.reduce(
      (slowest, current) =>
        current.value > slowest.time
          ? { name: current.name, time: current.value }
          : slowest,
      { name: "none", time: 0 },
    );
    const memoryUsage = this.getMemoryUsage();
    const historySize = this.getHistorySize();

    if (averageCommandTime > 200) {
      recommendations.push(
        "Consider optimizing slow commands - average execution time is high",
      );
    }

    if (slowestCommand.time > 1000) {
      recommendations.push(
        `Command '${slowestCommand.name}' is very slow (${slowestCommand.time.toFixed(2)}ms)`,
      );
    }

    if (averageRenderTime > 50) {
      recommendations.push(
        "Consider using React.memo or useMemo for expensive renders",
      );
    }

    if (memoryUsage && memoryUsage > 50 * 1024 * 1024) {
      recommendations.push(
        "High memory usage detected - consider clearing old history",
      );
    }

    if (historySize > 1000) {
      recommendations.push(
        "Large history detected - consider using virtual scrolling",
      );
      recommendations.push(
        "Consider implementing history cleanup or archiving",
      );
    }

    const commandCounts = commandMetrics.reduce(
      (counts, metric) => {
        const command = metric.name.replace("command-", "");
        counts[command] = (counts[command] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    const mostUsedCommand = Object.entries(commandCounts).reduce(
      (most, [cmd, count]) =>
        count > most.count ? { command: cmd, count } : most,
      { command: "", count: 0 },
    );

    if (mostUsedCommand.count > 10 && mostUsedCommand.command) {
      recommendations.push(
        `Consider creating an alias for '${mostUsedCommand.command}' (used ${mostUsedCommand.count} times)`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Performance looks good! No recommendations at this time.",
      );
    }

    return recommendations;
  }
}

/**
 * Custom React hook providing access to performance monitoring utilities and metrics management.
 *
 * @function usePerformanceMonitor
 * @returns {object} Object exposing performance measurement and reporting functions.
 * @property {(componentName: string) => (renderFn: () => void) => void} measureRender - Higher-order function to time render operations.
 * @property {(name: string, value: number, category: PerformanceMetric["category"], metadata?: Record<string, unknown>) => void} recordMetric - Records custom metric.
 * @property {(name: string, category?: PerformanceMetric["category"]) => void} startTiming - Begins measurement timer.
 * @property {(name: string, category?: PerformanceMetric["category"], metadata?: Record<string, unknown>) => number} endTiming - Ends timer and records metric.
 * @property {() => PerformanceReport} getReport - Generates a performance report.
 * @property {() => void} clearMetrics - Clears all recorded metrics.
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const measureRender = (componentName: string) => {
    return (renderFn: () => void) =>
      monitor.measureRender(componentName, renderFn);
  };

  const recordMetric = (
    name: string,
    value: number,
    category: PerformanceMetric["category"],
    metadata?: Record<string, unknown>,
  ): void => {
    monitor.recordMetric(name, value, category, metadata);
  };

  return {
    measureRender,
    recordMetric,
    startTiming: monitor.startTiming.bind(monitor),
    endTiming: monitor.endTiming.bind(monitor),
    getReport: monitor.getReport.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
  };
}
