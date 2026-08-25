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
      className={`rounded-xl border border-(--terminal-border) bg-(--terminal-bg)/70 p-5 font-mono shadow-xl backdrop-blur-md relative overflow-hidden transition-colors duration-300 ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-(--terminal-accent)/0 via-(--terminal-accent) to-(--terminal-accent)/0" />

                                
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-(--terminal-border)/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-(--terminal-accent) font-bold">$</span>
          <span className="text-(--terminal-text) font-semibold text-sm">roadmap</span>
          <span className="text-(--terminal-muted) text-sm">--streak</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-(--terminal-muted)">
          <span className="h-2 w-2 rounded-full bg-(--terminal-accent)" />
          <span>LAST_ACTIVE :: {formatDate(streak.lastVisitAt)}</span>
        </div>
      </div>

                               
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.code}
            className={`rounded-lg border p-3 flex flex-col gap-1 transition-colors ${
              m.highlight
                ? "border-(--terminal-accent)/40 bg-(--terminal-accent)/10 text-(--terminal-accent)"
                : "border-(--terminal-border) bg-(--terminal-bg)/70 text-(--terminal-text) hover:border-(--terminal-accent)/40"
            }`}
          >
            <span className="text-[10px] text-(--terminal-muted) font-semibold tracking-wider">
              [{m.code}]
            </span>
            <span className="text-lg font-bold tracking-tight">{m.value}</span>
            <span className="text-[10px] text-(--terminal-muted)">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
