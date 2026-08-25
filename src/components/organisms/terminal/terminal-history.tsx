"use client";

import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import { CommandOutput } from "@/components/molecules/terminal/command-output";
import type { TerminalHistory as TerminalHistoryType } from "@/types/terminal";
import { type JSX } from "react";

/**
 * Properties for the {@link TerminalHistory} component.
 */
interface TerminalHistoryProps {
  /**
   * Array of historical command entries executed in the terminal session.
   */
  history: TerminalHistoryType[];
  /**
   * Optional flag indicating whether a screen clear animation is currently active.
   */
  isClearing?: boolean;
}

/**
 * Renders the chronological list of previously executed terminal commands along with their outputs.
 *
 * @param {TerminalHistoryProps} props - Component properties.
 * @param {TerminalHistoryType[]} props.history - List of command execution records to display.
 * @param {boolean} [props.isClearing] - Whether the terminal is currently animating a clear transition.
 * @returns {JSX.Element | null} The rendered command history log, or `null` if the history is empty.
 */
export function TerminalHistory({
  history,
  isClearing = false,
}: TerminalHistoryProps): JSX.Element | null {
  const { theme, themeConfig } = useTheme();
  const { isReducedMotion } = useAccessibility();

  if (history.length === 0) {
    return null;
  }

  return (
    <div
      key={`terminal-history-${theme}`}
      className={`space-y-4 terminal-history ${isClearing && !isReducedMotion ? "animate-scanline-clear" : ""}`}
      role="log"
      aria-label="Command history"
    >
      {history.map((entry, index) => (
        <div
          key={`${index}-${theme}`}
          className={`${!isReducedMotion ? "fade-in" : ""}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
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
