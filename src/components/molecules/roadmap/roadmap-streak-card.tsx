"use client";

import type { RoadmapStreak } from "@/lib/data/data-fetching";
import { useI18n } from "@/hooks/use-i18n";

interface RoadmapStreakCardProps {
  streak: RoadmapStreak | null;
  className?: string;
}

export function RoadmapStreakCard({
  streak,
  className = "",
}: RoadmapStreakCardProps) {
  const { t } = useI18n();

  if (!streak) return null;

  const formatDate = (raw?: string | null) => {
    if (!raw) return "N/A";
    try {
      return new Date(raw).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return raw;
    }
  };

  const daysLabel = t("roadmapStreakDays");

  const metrics = [
    {
      code: "CURRENT",
      label: t("roadmapStreakActive"),
      value: `${streak.count} ${daysLabel}`,
      highlight: true,
    },
    {
      code: "LONGEST",
      label: t("roadmapStreakRecord"),
      value: `${streak.longestCount} ${daysLabel}`,
      highlight: false,
    },
    {
      code: "PREVIOUS",
      label: t("roadmapStreakPrior"),
      value: `${streak.previousCount} ${daysLabel}`,
      highlight: false,
    },
    {
      code: "REFERRALS",
      label: t("roadmapStreakPeers"),
      value: `${streak.refByUserCount}`,
      highlight: false,
    },
  ];

  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 font-mono shadow-xl backdrop-blur-md relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

      {/* CLI Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-white font-semibold text-sm">roadmap</span>
          <span className="text-neutral-500 text-sm">--streak</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>LAST_ACTIVE :: {formatDate(streak.lastVisitAt)}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.code}
            className={`rounded-lg border p-3 flex flex-col gap-1 transition-colors ${
              m.highlight
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-neutral-800 bg-neutral-950/70 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <span className="text-[10px] text-neutral-500 font-semibold tracking-wider">
              [{m.code}]
            </span>
            <span className="text-lg font-bold tracking-tight">{m.value}</span>
            <span className="text-[10px] text-neutral-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
