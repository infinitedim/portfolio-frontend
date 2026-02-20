

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: "command" | "render" | "theme" | "font" | "history" | "system";
  metadata?: Record<string, unknown>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalCommands: number;
    averageCommandTime: number;
    averageRenderTime: number;
    slowestCommand: { name: string; time: number };
    memoryUsage?: number;
    historySize: number;
  };
  recommendations: string[];
  generatedAt: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;

  private constructor() {
    this.setupPerformanceObserver();
    this.startSystemMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Performance monitoring ${enabled ? "enabled" : "disabled"}`);
  }

  

  startTiming(
    name: string,
    
    category: PerformanceMetric["category"] = "system",
  ): void {
    if (!this.isEnabled) return;

    this.startTimes.set(name, performance.now());
  }

  

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

    if (value > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${value.toFixed(2)}ms`,
        metadata,
      );
    }
  }

  

  measureCommand<T>(
    commandName: string,
    commandFn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.isEnabled) return commandFn();

    this.startTiming(`command-${commandName}`, "command");

    return commandFn()
      .then((result) => {
        this.endTiming(`command-${commandName}`, "command", {
          ...metadata,
          success: true,
        });
        return result;
      })
      .catch((error) => {
        this.endTiming(`command-${commandName}`, "command", {
          ...metadata,
          success: false,
          error: (error as Error).message,
        });
        throw error;
      });
  }

  

  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.isEnabled) {
      renderFn();
      return;
    }

    this.startTiming(`render-${componentName}`, "render");
    renderFn();
    this.endTiming(`render-${componentName}`, "render");
  }

  

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

  

  getMetricsByCategory(
    category: PerformanceMetric["category"],
  ): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  

  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
    console.log("Performance metrics cleared");
  }

  

  exportMetrics(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }

  

  private setupPerformanceObserver(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "measure") {
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
