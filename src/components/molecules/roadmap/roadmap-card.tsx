"use client";

import Link from "next/link";
import type { Route } from "next";
import type { RoadmapProgress } from "@/lib/data/data-fetching";
import { RoadmapProgressBar } from "./roadmap-progress-bar";

interface RoadmapCardProps {
  progress: RoadmapProgress;
  index: number;
}

export function RoadmapCard({ progress, index }: RoadmapCardProps) {
  const percent =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  const isCompleted = percent >= 100;
  const isInProgress = percent > 0 && percent < 100;

  const statusBadge = isCompleted ? (
    <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      [100% EXECUTED]
    </span>
  ) : isInProgress ? (
    <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
      [EXECUTING :: {percent}%]
    </span>
  ) : (
    <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
      [PLANNED]
    </span>
  );

  const orderNum = String(index + 1).padStart(2, "0");

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 font-mono shadow-xl backdrop-blur-md overflow-hidden flex flex-col transition-all duration-200 hover:border-neutral-700">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-emerald-500 font-bold">{orderNum} ::</span>
          <a
            href={`https://roadmap.sh/${progress.resourceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-emerald-400 transition-colors font-semibold truncate max-w-[200px] sm:max-w-[240px]"
            title={`View ${progress.resourceTitle} on roadmap.sh`}
          >
            ~/roadmap.sh/{progress.resourceId}
          </a>
        </div>
        {statusBadge}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1 justify-between">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white tracking-tight">
            {progress.resourceTitle}
          </h3>

          <RoadmapProgressBar
            totalSegments={progress.total}
            activeSegments={progress.done}
            showAscii
            size="md"
          />
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] border-t border-neutral-800/60 pt-3">
          <div className="rounded border border-emerald-500/20 bg-emerald-500/5 py-1 text-emerald-400">
            <span className="block text-[9px] text-neutral-400 font-sans uppercase">Done</span>
            <span className="font-bold">{progress.done}</span>
          </div>
          <div className="rounded border border-cyan-500/20 bg-cyan-500/5 py-1 text-cyan-400">
            <span className="block text-[9px] text-neutral-400 font-sans uppercase">Learning</span>
            <span className="font-bold">{progress.learning}</span>
          </div>
          <div className="rounded border border-amber-500/20 bg-amber-500/5 py-1 text-amber-400">
            <span className="block text-[9px] text-neutral-400 font-sans uppercase">Skipped</span>
            <span className="font-bold">{progress.skipped ?? 0}</span>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-950 py-1 text-neutral-400">
            <span className="block text-[9px] text-neutral-400 font-sans uppercase">Total</span>
            <span className="font-bold">{progress.total}</span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[10px] text-neutral-400">
            ID: {progress.resourceId}
          </span>
          <Link
            href={`/roadmap/${progress.resourceId}` as Route}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold group cursor-pointer"
          >
            <span>$ cd /roadmap/{progress.resourceId}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
