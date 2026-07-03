"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const PWARegistration = dynamic(
  () => import("../organisms/pwa/pwa-registration").then((mod) => mod.PWARegistration),
  { ssr: false },
);

const WebVitalsMonitor = dynamic(
  () => import("../monitoring/web-vitals-monitor").then((mod) => mod.WebVitalsMonitor),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({
      default: mod.SpeedInsights,
    })),
  { ssr: false },
);

export function ClientOnlyComponents() {
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
