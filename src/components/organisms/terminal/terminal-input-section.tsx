/**
 * @fileoverview TerminalInputSection
 *
 * Renders the sticky command input bar at the bottom of the terminal viewport.
 * Includes the command input field, loading indicator, and manages focus/submit.
 *
 * @description
 * Reads all required state from `useTerminalContext()`. No prop drilling.
 *
 * @example
 * ```tsx
 * <TerminalInputSection availableCommands={AVAILABLE_COMMANDS} />
 * ```
 *
 * @dependencies
 * - useTerminalContext – currentInput, setCurrentInput, handleSubmit, isProcessing,
 *                        navigateHistory, getCommandSuggestions, getFrequentCommands,
 *                        commandInputRef
 * - CommandInput
 * - CommandLoadingIndicator
 */

"use client";

import { type JSX } from "react";
import { CommandInput } from "@/components/molecules/terminal/command-input";
import { CommandLoadingIndicator } from "@/components/molecules/terminal/command-loading-indicator";
import { useTerminalContext } from "@/lib/context/terminal-context";

/** Commands available for tab-completion / suggestions */
const AVAILABLE_COMMANDS = [
  "help",
  "skills",
  "customize",
  "themes",
  "fonts",
  "status",
  "clear",
  "alias",
  "about",
  "contact",
  "projects",
  "experience",
  "education",
  "roadmap",
  "progress",
  "theme",
  "font",
  "language",
  "demo",
  "github",
  "tech-stack",
  "resume",
  "social",
  "shortcuts",
  "easter-eggs",
  "pwa",
  "tour",
] as const;

const LOADING_MESSAGES = [
  "Processing command...",
  "Executing request...",
  "Gathering data...",
  "Compiling response...",
  "Almost finished...",
] as const;

/**
 * TerminalInputSection
 *
 * Sticky bottom bar containing the command input. When a command is being
 * processed, a loading indicator is shown above the input field.
 */
export function TerminalInputSection(): JSX.Element {
  const {
    currentInput,
    setCurrentInput,
    handleSubmit,
    isProcessing,
    navigateHistory,
    getCommandSuggestions,
    getFrequentCommands,
    commandInputRef,
  } = useTerminalContext();

  return (
    <div
      id="command-input"
      className="sticky bottom-0 py-2 command-input-container"
      style={{ backgroundColor: "transparent" }}
      suppressHydrationWarning={true}
      tabIndex={-1}
    >
      {/* Loading indicator – shown above the input while processing */}
      {isProcessing && (
        <CommandLoadingIndicator
          command={currentInput}
          visible={isProcessing}
          messages={[...LOADING_MESSAGES]}
        />
      )}

      <CommandInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={handleSubmit}
        onHistoryNavigate={navigateHistory}
        isProcessing={isProcessing}
        availableCommands={AVAILABLE_COMMANDS as unknown as string[]}
        inputRef={commandInputRef}
        getCommandSuggestions={getCommandSuggestions}
        getFrequentCommands={getFrequentCommands}
        showOnEmpty={false}
      />
    </div>
  );
}
