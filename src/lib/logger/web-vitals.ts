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

const vitalsStore: {
  metrics: Record<string, number>;
  ratings: Record<string, string>;
} = {
  metrics: {},
  ratings: {},
};

function getRoutePathname(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    return new URL(window.location.href).pathname;
  } catch {
    return window.location.pathname;
  }
}

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
  const route = getRoutePathname();
  const ourRating = getRating(name, value);
  const resolvedRating = rating || ourRating;
  const isTimingMetric = name !== "CLS";

  vitalsStore.metrics[name] = value;
  vitalsStore.ratings[name] = resolvedRating;

  clientLogger.info(
    `Web Vital: ${name} = ${value}${isTimingMetric ? "ms" : ""} (${resolvedRating})`,
    {
      component: "web-vitals",
      action: "metric-collected",
    },
    {
      metricName: name,
      value,
      unit: isTimingMetric ? "ms" : "score",
      rating: resolvedRating,
      metricId: id,
      navigationType,
      url: window.location.href,
      route,
      pathname: route,
    },
  );

  if (resolvedRating === "poor") {
    clientLogger.warn(
      `Poor Web Vital detected: ${name} = ${value}`,
      {
        component: "web-vitals",
        url: window.location.href,
        route,
      },
      {
        metricName: name,
        value,
        rating: resolvedRating,
        route,
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
    metrics: { ...vitalsStore.metrics },
    ratings: { ...vitalsStore.ratings },
  };
}

export default initWebVitals;
