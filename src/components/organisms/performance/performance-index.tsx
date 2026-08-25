"use client";

import { JSX, Profiler, ProfilerOnRenderCallback, ReactNode } from "react";

/**
 * Singleton service for recording, aggregating, and retrieving client-side performance measurements.
 */
export class PerformanceMonitor {
  /**
   * Cached singleton instance of the PerformanceMonitor.
   */
  private static instance: PerformanceMonitor;
  /**
   * Internal registry mapping metric names to their series of recorded numeric values in milliseconds.
   */
  private metrics: Map<string, number[]> = new Map();

  /**
   * Retrieves the singleton instance of {@link PerformanceMonitor}, initializing it if necessary.
   *
   * @returns {PerformanceMonitor} The singleton instance.
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Records a new sample value for a named metric, maintaining a rolling buffer of up to 100 entries.
   *
   * @param {string} name - Identifier name of the metric.
   * @param {number} value - Measured duration or metric value in milliseconds.
   * @returns {void}
   */
  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  /**
   * Calculates the arithmetic mean for all recorded samples of a specified metric.
   *
   * @param {string} name - Identifier name of the metric to average.
   * @returns {number} The average value, or 0 if no samples exist.
   */
  public getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Compiles summary statistics (average, latest value, and sample count) across all registered metrics.
   *
   * @returns {Record<string, { average: number; latest: number; count: number }>} Dictionary of metric summaries keyed by metric name.
   */
  public getAllMetrics(): Record<
    string,
    { average: number; latest: number; count: number }
  > {
    const result: Record<
      string,
      { average: number; latest: number; count: number }
    > = {};

    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverageMetric(name),
        latest: values[values.length - 1] || 0,
        count: values.length,
      };
    });

    return result;
  }

  /**
   * Begins a synchronous execution timer for a given metric identifier.
   *
   * @param {string} name - Identifier name of the operation being measured.
   * @returns {{ end: () => number }} An object exposing an `end` callback that stops timing, records the metric, and returns the elapsed duration in milliseconds.
   */
  public startMeasure(name: string): { end: () => number } {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(name, duration);
        return duration;
      },
    };
  }

  /**
   * Outputs aggregated performance metrics to the browser developer console in a grouped format.
   *
   * @returns {void}
   */
  public logMetrics(): void {
    console.group("Performance Metrics");
    const metrics = this.getAllMetrics();
    Object.entries(metrics).forEach(([name, data]) => {
      console.log(
        `${name}: avg=${data.average.toFixed(2)}ms, latest=${data.latest.toFixed(2)}ms, count=${data.count}`,
      );
    });
    console.groupEnd();
  }
}

/**
 * Properties for the {@link PerformanceProfiler} component.
 */
interface PerformanceProfilerProps {
  /**
   * Unique identifier string for the profiler subtree.
   */
  id: string;
  /**
   * Child React nodes to be profiled during mounting and rendering updates.
   */
  children: ReactNode;
  /**
   * Optional callback fired when the profiled component tree commits a render phase.
   *
   * @param {string} id - Identifier of the profiler boundary that rendered.
   * @param {"mount" | "update" | "nested-update"} phase - The render lifecycle phase.
   * @param {number} actualDuration - Time in milliseconds spent rendering the committed update.
   */
  onRender?: (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
  ) => void;
}

/**
 * React Profiler wrapper component that measures render execution timings and records metrics into {@link PerformanceMonitor}.
 *
 * @param props - Component properties.
 * @param props.id - Profiler tree identifier.
 * @param props.children - Child elements to measure.
 * @param props.onRender - Optional render notification callback.
 * @returns The rendered React Profiler wrapper.
 */
export function PerformanceProfiler({
  id,
  children,
  onRender,
}: PerformanceProfilerProps): JSX.Element {
  const performanceMonitor = PerformanceMonitor.getInstance();

  /**
   * Callback executed by React Profiler on each render commit.
   *
   * @param {string} id - Profiler identifier.
   * @param {"mount" | "update" | "nested-update"} phase - Phase of the render lifecycle.
   * @param {number} actualDuration - Duration in milliseconds of the render commit.
   * @param {number} baseDuration - Estimated duration to render the entire subtree without memoization.
   */
  const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
  ) => {
    performanceMonitor.recordMetric(`${id}-${phase}`, actualDuration);
    performanceMonitor.recordMetric(`${id}-base`, baseDuration);

    onRender?.(id, phase, actualDuration);

    if (process.env.NODE_ENV === "development" && actualDuration > 16) {
      console.warn(
        `Slow render detected: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`,
      );
    }
  };

  return (
    <Profiler
      id={id}
      onRender={handleRender}
    >
      {children}
    </Profiler>
  );
}

/**
 * Custom React hook providing convenient utility functions for measuring synchronous and asynchronous operations.
 *
 * @returns Object containing performance measurement helper methods (startMeasure, measureAsync, getMetrics, logMetrics).
 */
export function usePerfMeasure() {
  const performanceMonitor = PerformanceMonitor.getInstance();

  return {
    startMeasure: (name: string) => {
      const startTime = performance.now();

      return {
        end: () => {
          const duration = performance.now() - startTime;
          performanceMonitor.recordMetric(name, duration);
          return duration;
        },
      };
    },

    measureAsync: async <T,>(
      name: string,
      fn: () => Promise<T>,
    ): Promise<T> => {
      const measure = performanceMonitor.startMeasure(name);
      try {
        const result = await fn();
        measure.end();
        return result;
      } catch (error) {
        measure.end();
        throw error;
      }
    },

    getMetrics: () => performanceMonitor.getAllMetrics(),
    logMetrics: () => performanceMonitor.logMetrics(),
  };
}

export { PerformanceDashboard } from "@/components/organisms/performance/performance-dashboard";
