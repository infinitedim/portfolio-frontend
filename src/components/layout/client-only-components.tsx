"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const PWARegistration = dynamic(
  () => import("../organisms/pwa/pwa-registration"),
  { ssr: false },
);

const WebVitalsMonitor = dynamic(
  () => import("../monitoring/web-vitals-monitor"),
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
