"use client";

import type React from "react";
import { type JSX } from "react";
import { useMobile } from "@/hooks/use-mobile";

interface MobileTerminalProps {
  children: React.ReactNode;
}

export function MobileTerminal({ children }: MobileTerminalProps): JSX.Element {
  const { isMobile } = useMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center font-mono">
      <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
          <span className="text-xl font-bold">&gt;_</span>
        </div>
        <h2 className="text-lg font-bold text-white">Desktop Required</h2>
        <p className="mt-3 text-xs leading-relaxed text-neutral-400">
          The interactive terminal and gate puzzles are designed for desktop browsers with keyboard navigation. Please open this portfolio on a desktop computer for the full CLI experience.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-green-400/40 bg-green-400/10 px-5 py-2.5 text-xs font-bold text-green-400 transition-colors hover:bg-green-400/20"
        >
          ← Return to Portfolio
        </a>
      </div>
    </div>
  );
}
