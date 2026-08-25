"use client";

import { type JSX, useEffect } from "react";
import dynamic from "next/dynamic";

/**
 * Dynamically loaded client-side component responsible for PWA service worker registration and lifecycle events.
 */
const PWARegistration = dynamic(
  () =>
    import("../organisms/pwa/pwa-registration").then(
      (mod) => mod.PWARegistration,
    ),
  { ssr: false },
);

/**
 * Dynamically loaded client-side monitor tracking Core Web Vitals performance metrics (LCP, FID, CLS, INP).
 */
const WebVitalsMonitor = dynamic(
  () =>
    import("../monitoring/web-vitals-monitor").then(
      (mod) => mod.WebVitalsMonitor,
    ),
  { ssr: false },
);

/**
 * Dynamically loaded Vercel Speed Insights tracking component enabled conditionally in production environments.
 */
const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({
      default: mod.SpeedInsights,
    })),
  { ssr: false },
);

/**
 * Container component that mounts client-only instrumentation, background bundle optimization routines, Web Vitals telemetry, and PWA service workers without server-side rendering overhead.
 *
 * @returns {JSX.Element} Fragment containing active client-only monitoring and registration components.
 */
export function ClientOnlyComponents(): JSX.Element {
  useEffect(() => {
    void import("@/lib/utils/bundler-optimization").then(
      ({ initBundleOptimizations }) => {
        initBundleOptimizations();
        return undefined;
      },
    );
  }, []);

  const showSpeedInsights = process.env.NODE_ENV === "production";

  return (
    <>
      <PWARegistration />
      <WebVitalsMonitor />
      {showSpeedInsights ? <SpeedInsights /> : null}
    </>
  );
}
