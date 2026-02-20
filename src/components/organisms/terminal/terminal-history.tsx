"use client";

import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import { CommandOutput } from "@/components/molecules/terminal/command-output";
import type { TerminalHistory as TerminalHistoryType } from "@/types/terminal";
import { type JSX } from "react";

interface TerminalHistoryProps {
  history: TerminalHistoryType[];
}

export function TerminalHistory({
  history,
}: TerminalHistoryProps): JSX.Element | null {
  const { theme, themeConfig } = useTheme();
  const { isReducedMotion } = useAccessibility();

  if (history.length === 0) {
    return null;
  }

  return (
    <div
      key={`terminal-history-${theme}`}
      className="space-y-4 terminal-history"
      role="log"
      aria-label="Command history"
    >
      {history.map((entry, index) => (
        <div
          key={`${index}-${theme}`}
          className={`${!isReducedMotion ? "fade-in" : ""}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          { }
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-bold"
              style={{ color: themeConfig.colors.prompt }}
              aria-hidden="true"
            >
              $
            </span>
            <span
              className="font-mono"
              style={{ color: themeConfig.colors.text }}
            >
              {entry.input}
            </span>
          </div>

          { }
          {entry.output && (
            <div className="ml-4 mb-4">
              <CommandOutput output={entry.output} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
