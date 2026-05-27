"use client";

import Link from "next/link";
import { type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";

const LEVELS = [
  { level: 1, key: "gateLevelBandit" as const, href: "/gate/1" },
  { level: 2, key: "gateLevelNatas" as const, href: "/gate/2" },
  { level: 3, key: "gateLevelBehemoth" as const, href: "/gate/3" },
] as const;

interface GateProgressProps {
  currentLevel: number;
  completedLevels: number[];
}

export function GateProgress({
  currentLevel,
  completedLevels,
}: GateProgressProps): JSX.Element {
  const { t } = useI18n();

  return (
    <nav
      aria-label="Gate progress"
      className="mb-8 flex flex-wrap items-center justify-center gap-2"
    >
      {LEVELS.map(({ level, key, href }) => {
        const completed = completedLevels.includes(level);
        const current = currentLevel === level;
        const locked = level > currentLevel && !completed;

        return (
          <Link
            key={level}
            href={locked ? "#" : href}
            aria-disabled={locked}
            className={`rounded border px-3 py-1.5 font-mono text-xs transition-colors ${
              completed
                ? "border-green-500/50 bg-green-500/10 text-green-400"
                : current
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                  : locked
                    ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            }`}
            onClick={locked ? (e) => e.preventDefault() : undefined}
          >
            {completed ? "✓ " : ""}
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
