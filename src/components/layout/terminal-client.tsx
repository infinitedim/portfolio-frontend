"use client";

import dynamic from "next/dynamic";
import { TerminalLoadingProgress } from "../molecules/terminal/terminal-loading-progress";

// Dynamic import with ssr:false must live inside a Client Component.
// page.tsx is a Server Component (it exports metadata), so we use this
// thin wrapper to satisfy the Next.js constraint.
const Terminal = dynamic(
  () =>
    import("../organisms/terminal/terminal").then((m) => m.Terminal),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <TerminalLoadingProgress />
      </div>
    ),
  },
);

export function TerminalClient() {
  return <Terminal />;
}
