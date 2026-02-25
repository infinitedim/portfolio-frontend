"use client";

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import clientLogger from "./client-logger";

const THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },

  FID: {
    good: 100,
    needsImprovement: 300,
  },

  INP: {
    good: 200,
    needsImprovement: 500,
  },

  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },

  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },

  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

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

function reportMetric(metric: Metric): void {
  const { name, value, rating, id, navigationType } = metric;

  const ourRating = getRating(name, value);

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

export function initWebVitals(): void {
  try {
    onCLS(reportMetric);

    onFCP(reportMetric);

    onINP(reportMetric);

    onLCP(reportMetric);

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

export function getWebVitalsSummary(): {
  metrics: Record<string, number>;
  ratings: Record<string, string>;
} {
  return {
    metrics: {},
    ratings: {},
  };
}

export default initWebVitals;
