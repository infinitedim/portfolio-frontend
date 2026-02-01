/**
 * Performance monitor tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PerformanceMonitor,
  usePerformanceMonitor,
} from "../performance-monitor";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    monitor.stopMonitoring();
    vi.restoreAllMocks();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const a = PerformanceMonitor.getInstance();
      const b = PerformanceMonitor.getInstance();
      expect(a).toBe(b);
    });
  });

  describe("setEnabled", () => {
    it("should disable monitoring when false", () => {
      monitor.setEnabled(false);
      monitor.startTiming("test", "system");
      const duration = monitor.endTiming("test", "system");
      expect(duration).toBe(0);
    });

    it("should enable monitoring when true", () => {
      monitor.setEnabled(true);
      monitor.startTiming("test", "system");
      const duration = monitor.endTiming("test", "system");
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("startTiming / endTiming", () => {
    it("should return 0 when endTiming without startTiming", () => {
      monitor.setEnabled(true);
      const duration = monitor.endTiming("nonexistent", "system");
      expect(duration).toBe(0);
    });

    it("should record duration when start and end", () => {
      monitor.setEnabled(true);
      monitor.startTiming("op", "command");
      const duration = monitor.endTiming("op", "command");
      expect(duration).toBeGreaterThanOrEqual(0);
      const report = monitor.getReport();
      const commandMetrics = report.metrics.filter(
        (m) => m.category === "command",
      );
      expect(commandMetrics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("recordMetric", () => {
    it("should add metric to report", () => {
      monitor.setEnabled(true);
      monitor.recordMetric("custom", 42, "system", { foo: "bar" });
      const report = monitor.getReport();
      expect(
        report.metrics.some((m) => m.name === "custom" && m.value === 42),
      ).toBe(true);
    });
  });

  describe("getReport", () => {
    it("should return summary with totalCommands, averageCommandTime, etc.", () => {
      const report = monitor.getReport();
      expect(report.summary).toHaveProperty("totalCommands");
      expect(report.summary).toHaveProperty("averageCommandTime");
      expect(report.summary).toHaveProperty("averageRenderTime");
      expect(report.summary).toHaveProperty("slowestCommand");
      expect(report).toHaveProperty("recommendations");
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.generatedAt).toBeGreaterThan(0);
    });
  });

  describe("getMetricsByCategory", () => {
    it("should filter metrics by category", () => {
      monitor.setEnabled(true);
      monitor.recordMetric("a", 1, "command");
      monitor.recordMetric("b", 2, "render");
      const commandMetrics = monitor.getMetricsByCategory("command");
      expect(commandMetrics.length).toBe(1);
      expect(commandMetrics[0].name).toBe("a");
    });
  });

  describe("clearMetrics", () => {
    it("should clear all metrics", () => {
      monitor.setEnabled(true);
      monitor.recordMetric("x", 1, "system");
      monitor.clearMetrics();
      const report = monitor.getReport();
      expect(report.metrics.length).toBe(0);
    });
  });

  describe("exportMetrics", () => {
    it("should return JSON string", () => {
      const json = monitor.exportMetrics();
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty("summary");
      expect(parsed).toHaveProperty("metrics");
    });
  });

  describe("measureCommand", () => {
    it("should resolve with result when enabled", async () => {
      monitor.setEnabled(true);
      const result = await monitor.measureCommand("test", async () => "ok");
      expect(result).toBe("ok");
    });

    it("should reject and record on error", async () => {
      monitor.setEnabled(true);
      await expect(
        monitor.measureCommand("fail", async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow("fail");
    });
  });

  describe("measureRender", () => {
    it("should call renderFn when enabled", () => {
      monitor.setEnabled(true);
      const fn = vi.fn();
      monitor.measureRender("TestComponent", fn);
      expect(fn).toHaveBeenCalled();
    });
  });
});

describe("usePerformanceMonitor", () => {
  it("should return measureRender, recordMetric, startTiming, endTiming, getReport, clearMetrics", () => {
    const result = usePerformanceMonitor();
    expect(result.measureRender).toBeTypeOf("function");
    expect(result.recordMetric).toBeTypeOf("function");
    expect(result.startTiming).toBeTypeOf("function");
    expect(result.endTiming).toBeTypeOf("function");
    expect(result.getReport).toBeTypeOf("function");
    expect(result.clearMetrics).toBeTypeOf("function");
  });

  it("measureRender should return a function that accepts renderFn", () => {
    const { measureRender } = usePerformanceMonitor();
    const wrapper = measureRender("Test");
    expect(wrapper).toBeTypeOf("function");
    expect(() => wrapper(() => {})).not.toThrow();
  });
});
