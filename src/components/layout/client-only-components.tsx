"use client";

import dynamic from "next/dynamic";

const PWARegistration = dynamic(
  () => import("../organisms/pwa/pwa-registration"),
  { ssr: false },
);

const WebVitalsMonitor = dynamic(
  () => import("../monitoring/web-vitals-monitor"),
  { ssr: false },
);

export function ClientOnlyComponents() {
  return (
    <>
      <PWARegistration />
      <WebVitalsMonitor />
    </>
  );
}
