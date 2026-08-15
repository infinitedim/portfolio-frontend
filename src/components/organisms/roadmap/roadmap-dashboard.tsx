"use client";

import type { RoadmapDashboard, RoadmapStreak } from "@/lib/data/data-fetching";
import { RoadmapCard } from "@/components/molecules/roadmap/roadmap-card";
import { RoadmapProgressBar } from "@/components/molecules/roadmap/roadmap-progress-bar";
import { RoadmapStreakCard } from "@/components/molecules/roadmap/roadmap-streak-card";

interface RoadmapDashboardProps {
  dashboard: RoadmapDashboard;
  streak: RoadmapStreak | null;
}

export function RoadmapDashboardOrganism({
  dashboard,
  streak,
}: RoadmapDashboardProps) {
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
    <div className="flex flex-col gap-8 font-mono">
      {/* Profile Header Telemetry Banner */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

        <div className="flex items-center gap-4">
          {dashboard.avatar ? (
            <img
              src={dashboard.avatar}
              alt={dashboard.name || "Roadmap Profile"}
              className="h-14 w-14 rounded-xl border border-emerald-500/30 object-cover shadow-md"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xl">
              {dashboard.name?.charAt(0) || "D"}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {dashboard.name}
              </h2>
              <span className="text-xs text-emerald-400 font-mono">
                @{dashboard.username}
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-md">
              {dashboard.headline || "Continuous Learning & Skill Telemetry"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>SYNCED :: roadmap.sh</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {progresses.length} Active Trackers
          </span>
        </div>
      </div>

      {/* Streak Diagnostics Panel */}
      <RoadmapStreakCard streak={streak} />

      {/* Overall Progress Summary Box */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">$</span>
            <span className="text-white font-semibold text-sm">roadmap</span>
            <span className="text-neutral-500 text-sm">--overview</span>
          </div>
          <span className="text-xs text-neutral-400">
            Completed: <strong className="text-emerald-400 font-bold">{totalDone}</strong> · Skipped: <strong className="text-amber-400 font-bold">{totalSkipped}</strong> / {totalTopics} Topics
          </span>
        </div>

        <RoadmapProgressBar
          totalSegments={totalTopics}
          activeSegments={totalDone}
          showAscii
          size="lg"
          label={`OVERALL :: ${overallPercent}% COMPLETED`}
        />
      </div>

      {/* Roadmaps Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-neutral-300 font-semibold">roadmap</span>
          <span className="text-neutral-500">--list --sort=progress_desc</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {progresses.map((p, idx) => (
            <RoadmapCard key={p.resourceId} progress={p} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
