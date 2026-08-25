"use client";

import type { JSX } from "react";

/**
 * Properties for configuring the CommandErrorHandler fallback component.
 */
interface CommandErrorHandlerProps {
  /** The error object thrown during command execution */
  error: Error;
  /** The raw command string that failed to execute */
  command: string;
  /** Callback to re-attempt execution of the failed command */
  onRetry: () => void;
  /** Callback to report the command error */
  onReport: () => void;
}

/**
 * Terminal command error handler component rendering an error alert with
 * command diagnostics, recovery actions (retry), and issue reporting.
 *
 * @param props - Component properties.
 * @param props.error - Error thrown during execution.
 * @param props.command - The failed command string.
 * @param props.onRetry - Callback to retry command execution.
 * @param props.onReport - Callback to report the error.
 * @returns Rendered command error display component.
 */
export function CommandErrorHandler({
  error,
  command,
  onRetry,
  onReport,
}: CommandErrorHandlerProps): JSX.Element {
  return (
    <div className="p-4 rounded border border-red-500/30 bg-red-900/10 font-mono">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-400"></span>
        <span className="font-bold text-red-400">Command Error</span>
      </div>

      <div className="mb-3">
        <div className="text-sm opacity-75">
          Command: <code className="bg-gray-800 px-1 rounded">{command}</code>
        </div>
        <div className="text-sm text-red-400">{error.message}</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs rounded border border-green-500/30 bg-green-900/20 text-green-400 hover:bg-green-900/30 transition-colors"
        >
          Retry
        </button>

        <button
          onClick={onReport}
          className="px-3 py-1 text-xs rounded border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors"
        >
          Report Issue
        </button>
      </div>

      <div className="mt-3 text-xs opacity-75">
        Try typing 'help' to see available commands or 'clear' to reset the
        terminal.
      </div>
    </div>
  );
}
