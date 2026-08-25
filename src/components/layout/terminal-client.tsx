"use client";

import dynamic from "next/dynamic";
import { TerminalLoadingProgress } from "../molecules/terminal/terminal-loading-progress";

/**
 * Dynamically loaded client-side terminal interface component.
 *
 * Disables server-side rendering (SSR) to ensure terminal state and browser APIs
 * (e.g. keyboard listeners, canvas/DOM dimensions) run strictly on the client,
 * rendering a centered `TerminalLoadingProgress` indicator while loading.
 */
const Terminal = dynamic(
  () => import("../organisms/terminal/terminal").then((m) => m.Terminal),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <TerminalLoadingProgress />
      </div>
    ),
  },
);

/**
 * Client-side entry point component for the interactive terminal emulator application.
 *
 * Serves as the root boundary for the dynamic client-only terminal lifecycle,
 * isolating SSR environments from DOM-dependent terminal systems.
 *
 * @returns {JSX.Element} The dynamically mounted terminal component.
 */
export function TerminalClient() {
  return <Terminal />;
}

