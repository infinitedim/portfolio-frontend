"use client";

import Link from "next/link";
import type { Route } from "next";
import type { RoadmapProgress } from "@/lib/data/data-fetching";
import { RoadmapProgressBar } from "./roadmap-progress-bar";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Props for the {@link RoadmapCard} component.
 */
interface RoadmapCardProps {
  /** The roadmap topic progress data including completion counts and resource metadata. */
  progress: RoadmapProgress;
  /** Zero-based display index for ordinal number formatting (e.g., 00, 01, 02). */
  index: number;
}

/**
 * Renders a terminal-styled roadmap progress card.
 *
 * @description Displays a learning roadmap's completion status, percentage badge,
 * visual segmented progress bar, detailed statistics (done, learning, skipped, total),
 * and navigation links to roadmap.sh and internal deep-dive pages.
 *
 * @param props - Component properties conforming to {@link RoadmapCardProps}.
 * @param props.progress - The roadmap topic progress data including completion counts and resource metadata.
 * @param props.index - Zero-based display index for ordinal number formatting.
 * @returns A JSX element rendering the styled roadmap summary card.
 */
export function RoadmapCard({ progress, index }: RoadmapCardProps) {
  const { t } = useI18n();

  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const isCompleted = percent >= 100;
  const isInProgress = percent > 0 && percent < 100;

  const statusBadge = isCompleted ? (
    <span className="rounded border border-(--terminal-accent)/40 bg-(--terminal-accent)/10 px-2 py-0.5 text-[10px] font-semibold text-(--terminal-accent)">
      [100% {t("roadmapStatusExecuted")}]
    </span>
  ) : isInProgress ? (
    <span className="rounded border border-(--terminal-accent)/40 bg-(--terminal-accent)/10 px-2 py-0.5 text-[10px] font-semibold text-(--terminal-accent)">
      [{t("roadmapStatusExecuting")} :: {percent}%]
    </span>
  ) : (
    <span className="rounded border border-(--terminal-border) bg-(--terminal-bg) px-2 py-0.5 text-[10px] font-semibold text-(--terminal-muted)">
      [{t("roadmapStatusPlanned")}]
    </span>
  );

  const orderNum = String(index + 1).padStart(2, "0");

  return (
    <div className="rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/70 font-mono shadow-xl backdrop-blur-md overflow-hidden flex flex-col transition-all duration-200 hover:border-(--terminal-accent)/40">
      <div className="flex items-center justify-between border-b border-(--terminal-border)/80 bg-(--terminal-bg)/90 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-(--terminal-accent) font-bold">{orderNum} ::</span>
          <a
            href={`https://roadmap.sh/${progress.resourceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--terminal-text) hover:text-(--terminal-accent) transition-colors font-semibold truncate max-w-50 sm:max-w-60"
            title={`View ${progress.resourceTitle} on roadmap.sh`}
          >
            ~/roadmap.sh/{progress.resourceId}
          </a>
        </div>
        {statusBadge}
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1 justify-between">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-(--terminal-text) tracking-tight">
            {progress.resourceTitle}
          </h3>

          <RoadmapProgressBar
            totalSegments={progress.total}
            activeSegments={progress.done}
            showAscii
            size="md"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[11px] border-t border-(--terminal-border)/60 pt-3">
          <div className="rounded border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 py-1 text-(--terminal-accent)">
            <span className="block text-[9px] text-(--terminal-muted) font-sans uppercase">
              {t("roadmapDone")}
            </span>
            <span className="font-bold">{progress.done}</span>
          </div>
          <div className="rounded border border-(--terminal-accent)/20 bg-(--terminal-accent)/5 py-1 text-(--terminal-accent)">
            <span className="block text-[9px] text-(--terminal-muted) font-sans uppercase">
              {t("roadmapLearning")}
            </span>
            <span className="font-bold">{progress.learning}</span>
          </div>
          <div className="rounded border border-(--terminal-border) bg-(--terminal-bg)/50 py-1 text-(--terminal-muted)">
            <span className="block text-[9px] text-(--terminal-muted) font-sans uppercase">
              {t("roadmapSkipped")}
            </span>
            <span className="font-bold">{progress.skipped ?? 0}</span>
          </div>
          <div className="rounded border border-(--terminal-border) bg-(--terminal-bg) py-1 text-(--terminal-muted)">
            <span className="block text-[9px] text-(--terminal-muted) font-sans uppercase">
              {t("roadmapCardTotal")}
            </span>
            <span className="font-bold">{progress.total}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[10px] text-(--terminal-muted)">
            ID: {progress.resourceId}
          </span>
          <Link
            href={`/roadmap/${progress.resourceId}` as Route}
            className="flex items-center gap-1.5 text-xs text-(--terminal-accent) hover:opacity-80 transition-colors font-semibold group cursor-pointer"
          >
            <span>$ cd /roadmap/{progress.resourceId}</span>
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

