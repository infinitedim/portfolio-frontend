"use client";

import dynamic from "next/dynamic";
import { TerminalLoadingProgress } from "../molecules/terminal/terminal-loading-progress";

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
