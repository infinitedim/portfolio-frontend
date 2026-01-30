/**
 * Web Vitals Monitor Component
 * Client-side component for initializing Web Vitals monitoring
 */

"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/logger/web-vitals";

/**
 * Web Vitals Monitor
 * Initializes Web Vitals monitoring on mount
 */
export function WebVitalsMonitor(): null {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}

export default WebVitalsMonitor;
