"use client";

import type { RoadmapDashboard, RoadmapStreak } from "@/lib/data/data-fetching";
import { RoadmapCard } from "@/components/molecules/roadmap/roadmap-card";
import { RoadmapProgressBar } from "@/components/molecules/roadmap/roadmap-progress-bar";
import { RoadmapStreakCard } from "@/components/molecules/roadmap/roadmap-streak-card";
import { useI18n } from "@/hooks/use-i18n";

interface RoadmapDashboardProps {
  dashboard: RoadmapDashboard;
  streak: RoadmapStreak | null;
}

export function RoadmapDashboardOrganism({
  dashboard,
  streak,
}: RoadmapDashboardProps) {
  const { t } = useI18n();

  const rawProgresses = dashboard.progresses ?? [];
  const progresses = [...rawProgresses].sort((a, b) => {
    const pctA = a.total > 0 ? a.done / a.total : 0;
    const pctB = b.total > 0 ? b.done / b.total : 0;
    if (pctB !== pctA) {
      return pctB - pctA;
    }
    return b.done - a.done;
  });

  const totalDone = progresses.reduce((acc, p) => acc + p.done, 0);
  const totalSkipped = progresses.reduce((acc, p) => acc + (p.skipped || 0), 0);
  const totalTopics = progresses.reduce((acc, p) => acc + p.total, 0);
  const overallPercent =
    totalTopics > 0 ? Math.round((totalDone / totalTopics) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 font-mono transition-colors duration-300">
      {/* Profile Header Telemetry Banner */}
      <div className="rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/70 p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-(--terminal-accent)/0 via-(--terminal-accent) to-(--terminal-accent)/0" />

        <div className="flex items-center gap-4">
          {dashboard.avatar ? (
            <img
              src={dashboard.avatar}
              alt={dashboard.name || "Roadmap Profile"}
              className="h-14 w-14 rounded-xl border border-(--terminal-accent)/30 object-cover shadow-md"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 flex items-center justify-center font-bold text-(--terminal-accent) text-xl">
              {dashboard.name?.charAt(0) || "D"}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-(--terminal-text) tracking-tight">
                {dashboard.name}
              </h2>
              <span className="text-xs text-(--terminal-accent) font-mono">
                @{dashboard.username}
              </span>
            </div>
            <p className="text-xs text-(--terminal-muted) max-w-md">
              {dashboard.headline || t("roadmapProfileHeadline")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--terminal-accent)/30 bg-(--terminal-accent)/10 text-(--terminal-accent) text-xs">
            <span className="h-2 w-2 rounded-full bg-(--terminal-accent)" />
            <span>{t("roadmapStatusSynced")}</span>
          </div>
          <span className="text-[11px] text-(--terminal-muted)">
            {progresses.length} {t("roadmapActiveTrackers")}
          </span>
        </div>
      </div>

      {/* Streak Diagnostics Panel */}
      <RoadmapStreakCard streak={streak} />

      {/* Overall Progress Summary Box */}
      <div className="rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/70 p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-(--terminal-border)/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-(--terminal-accent) font-bold">$</span>
            <span className="text-(--terminal-text) font-semibold text-sm">roadmap</span>
            <span className="text-(--terminal-muted) text-sm">--overview</span>
          </div>
          <span className="text-xs text-(--terminal-muted)">
            {t("roadmapCompleted")}:{" "}
            <strong className="text-(--terminal-accent) font-bold">{totalDone}</strong>{" "}
            · {t("roadmapSkipped")}:{" "}
            <strong className="text-(--terminal-muted) font-bold">{totalSkipped}</strong>{" "}
            / {totalTopics} {t("roadmapTotalTopics")}
          </span>
        </div>

        <RoadmapProgressBar
          totalSegments={totalTopics}
          activeSegments={totalDone}
          showAscii
          size="lg"
          label={`OVERALL :: ${overallPercent}% ${t("roadmapCompleted").toUpperCase()}`}
        />
      </div>

      {/* Roadmaps Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-(--terminal-muted)">
          <span className="text-(--terminal-accent) font-bold">$</span>
          <span className="text-(--terminal-text) font-semibold">roadmap</span>
          <span className="text-(--terminal-muted)">--list --sort=progress_desc</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {progresses.map((p, idx) => (
            <RoadmapCard
              key={p.resourceId}
              progress={p}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
