"use client";

import dynamic from "next/dynamic";

// These components must be loaded client-side only (ssr: false).
// They are placed here in a Client Component so layout.tsx (Server Component)
// can import them without hitting the "ssr: false not allowed in Server Components" error.
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
