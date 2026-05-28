import type { Metadata } from "next";
import type { JSX } from "react";
import { OfflinePageContent } from "./offline-page-content";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage(): JSX.Element {
  return <OfflinePageContent />;
}
