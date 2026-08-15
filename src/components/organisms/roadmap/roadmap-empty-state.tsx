"use client";

import type { RoadmapFetchError } from "@/lib/data/data-fetching";

interface RoadmapEmptyStateProps {
  error?: RoadmapFetchError | null;
}

export function RoadmapEmptyState({ error }: RoadmapEmptyStateProps) {
  const isCredentialMissing =
    error?.status === 401 ||
    error?.message?.toLowerCase().includes("credential");

  return (
    <div className="mx-auto max-w-xl py-12 font-mono text-center">
      <div className="rounded-2xl border border-red-500/30 bg-neutral-900/80 p-8 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center gap-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>
            {isCredentialMissing
              ? "status :: CREDENTIALS_UNCONFIGURED"
              : "status :: UPSTREAM_UNREACHABLE"}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          <span className="text-red-400">$</span> roadmap --connect --fail
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
          {isCredentialMissing
            ? "Roadmap authentication credentials (`ROADMAP_EMAIL` / `ROADMAP_PASSWORD`) are not set on the backend service."
            : error?.message ||
              "Unable to sync telemetry from roadmap.sh backend proxy. Please verify backend API status."}
        </p>

        <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-[11px] text-neutral-500 font-mono">
          <span>Error Code: {error?.status || 503}</span>
          <span className="mx-2">|</span>
          <span>Target: /api/roadmap/dashboard</span>
        </div>
      </div>
    </div>
  );
}
