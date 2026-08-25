"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/logger/web-vitals";

/**
 * Headless monitoring component that initializes real-user performance metric tracking on mount.
 *
 * Integrates with Core Web Vitals telemetry (e.g., LCP, FID, CLS, INP, TTFB) by invoking `initWebVitals`
 * on the client side once the root layout mounts. Does not render any visible DOM nodes.
 *
 * @returns {null} Renders nothing to the DOM.
 */
export function WebVitalsMonitor(): null {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
