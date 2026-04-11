/**
 * @fileoverview TerminalHeader
 *
 * Renders the top section of the terminal: ASCII banner and the interactive
 * welcome panel (shown only on first load before any command is typed).
 *
 * @description
 * Reads all required state from `useTerminalContext()`. No prop drilling.
 *
 * @example
 * ```tsx
 * <TerminalHeader />
 * ```
 *
 * @dependencies
 * - useTerminalContext – showWelcome, setShowWelcome, isTourActive, startTour,
 *                        handleWelcomeCommandSelect
 * - ASCIIBanner
 * - InteractiveWelcome
 */

"use client";

import { type JSX } from "react";
import { ASCIIBanner } from "@/components/molecules/shared/ascii-banner";
import { InteractiveWelcome } from "@/components/molecules/shared/interactive-welcome";
import { useTerminalContext } from "@/lib/context/terminal-context";

/**
 * TerminalHeader
 *
 * Renders the ASCII banner and, when no commands have been typed yet and the
 * tour is not active, the interactive welcome panel.
 */
export function TerminalHeader(): JSX.Element {
  const {
    showWelcome,
    setShowWelcome,
    isTourActive,
    startTour,
    handleWelcomeCommandSelect,
    history,
  } = useTerminalContext();

  return (
    <div>
      {/* ASCII banner – always visible */}
      <div className="mb-4 sm:mb-8">
        <ASCIIBanner />
      </div>

      {/* Interactive welcome – only before first command, outside tour */}
      {showWelcome && history.length === 0 && !isTourActive && (
        <InteractiveWelcome
          onCommandSelect={handleWelcomeCommandSelect}
          onDismiss={() => setShowWelcome(false)}
          onStartTour={() => {
            setShowWelcome(false);
            startTour();
          }}
        />
      )}
    </div>
  );
}
