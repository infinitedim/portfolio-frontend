/**
 * @fileoverview Terminal header organism component that renders the top ASCII banner and initial welcome message.
 * @module components/organisms/terminal/terminal-header
 */

"use client";

import { type JSX } from "react";
import { ASCIIBanner } from "@/components/molecules/shared/ascii-banner";
import { InteractiveWelcome } from "@/components/molecules/shared/interactive-welcome";
import { useTerminalContext } from "@/lib/context/terminal-context";

/**
 * Terminal header organism component displaying startup graphics and interactive welcome onboarding.
 *
 * @description
 * Renders the ASCII art portfolio title banner and conditionally displays the interactive welcome guide
 * with clickable starter commands if no commands have been executed yet (`history.length === 0`).
 *
 * @returns {JSX.Element} The rendered ASCII banner and welcome component elements.
 */
export function TerminalHeader(): JSX.Element {
  const { showWelcome, setShowWelcome, handleWelcomeCommandSelect, history } =
    useTerminalContext();

  return (
    <div>
      <div className="mb-4 sm:mb-8">
        <ASCIIBanner />
      </div>

      {showWelcome && history.length === 0 && (
        <InteractiveWelcome
          onCommandSelect={handleWelcomeCommandSelect}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
