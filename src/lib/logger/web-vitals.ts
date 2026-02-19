/**
 * Web Vitals Monitoring
 * Track and log Core Web Vitals metrics
 */

"use client";

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import clientLogger from "./client-logger";

/**
 * Web Vitals metric thresholds
 * Based on Google's Core Web Vitals recommendations
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * Get rating for a metric value
 */
function getRating(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];

  if (!threshold) {
    return "good";
  }

  if (value <= threshold.good) {
    return "good";
  }

  if (value <= threshold.needsImprovement) {
    return "needs-improvement";
  }

  return "poor";
}

/**
 * Report a Web Vitals metric
 */
function reportMetric(metric: Metric): void {
  const { name, value, rating, id, navigationType } = metric;

  // Get our own rating (in case web-vitals doesn't provide it)
  const ourRating = getRating(name, value);

  // Log the metric
  clientLogger.logPerformance(
    name,
    value,
    {
      rating: rating || ourRating,
      metricId: id,
      navigationType,
      url: window.location.href,
      timestamp: Date.now(),
    },
    {
      component: "web-vitals",
      action: "metric-collected",
    },
  );

  // Log warning/error for poor metrics
  if (rating === "poor" || ourRating === "poor") {
    clientLogger.warn(
      `Poor Web Vital detected: ${name} = ${value}`,
      {
        component: "web-vitals",
        url: window.location.href,
      },
      {
        metricName: name,
        value,
        rating: rating || ourRating,
        threshold: THRESHOLDS[name as keyof typeof THRESHOLDS],
      },
    );
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  try {
    // Track Cumulative Layout Shift
    onCLS(reportMetric);

    // Track First Contentful Paint
    onFCP(reportMetric);

    // Track Interaction to Next Paint
    onINP(reportMetric);

    // Track Largest Contentful Paint
    onLCP(reportMetric);

    // Track Time to First Byte
    onTTFB(reportMetric);

    clientLogger.debug("Web Vitals monitoring initialized", {
      component: "web-vitals",
    });
  } catch (error) {
    clientLogger.error("Failed to initialize Web Vitals monitoring", error, {
      component: "web-vitals",
    });
  }
}

/**
 * Report Web Vitals (alias for backward compatibility)
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void): void {
  if (!onPerfEntry) {
    initWebVitals();
    return;
  }

  try {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  } catch (error) {
    clientLogger.error("Failed to report Web Vitals", error, {
      component: "web-vitals",
    });
  }
}

/**
 * Get Web Vitals summary
 */
export function getWebVitalsSummary(): {
  metrics: Record<string, number>;
  ratings: Record<string, string>;
} {
  // This would typically read from a store or accumulator
  // For now, return empty object
  return {
    metrics: {},
    ratings: {},
  };
}

export default initWebVitals;
