import type { Metadata } from "next";
import type { JSX } from "react";
import { OfflinePageContent } from "./offline-page-content";

/**
 * Static metadata configuration for the offline fallback route.
 *
 * @description Configures indexing directives to prevent search engine bots
 * from indexing the offline placeholder page.
 */
export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/**
 * Server Component entry point for the offline status route (`/offline`).
 *
 * @description Serves the client-side interactive offline page containing connection
 * diagnostics, retry mechanisms, and radar animations.
 *
 * @returns {JSX.Element} The rendered OfflinePage component.
 */
export default function OfflinePage(): JSX.Element {
  return <OfflinePageContent />;
}
