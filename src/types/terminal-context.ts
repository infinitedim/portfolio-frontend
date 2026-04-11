/**
 * @fileoverview TypeScript interfaces for the TerminalContext.
 *
 * Groups all state and handlers exposed by TerminalProvider into
 * feature-domain sections for clarity.
 */

import type { MutableRefObject } from "react";
import type { ThemeName, ThemeConfig } from "@/types/theme";
import type { FontName, FontConfig } from "@/types/font";
import type { CommandOutput, TerminalHistory } from "@/types/terminal";
import type { TourStep } from "@/components/organisms/onboarding/tour-steps";
import type { BackgroundSettings } from "@/types/customization";
import type { TranslationKeys } from "@/lib/i18n/i18n-service";

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export interface TerminalNotification {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

// ---------------------------------------------------------------------------
// Theme performance (passed into useTerminal)
// ---------------------------------------------------------------------------

export interface ThemePerformance {
  getPerformanceReport: () => {
    totalSwitches: number;
    averageTime: number;
    fastestSwitch: number;
    slowestSwitch: number;
    themeUsage: Record<ThemeName, number>;
  };
  themeMetrics: {
    switchCount: number;
    averageSwitchTime: number;
    lastSwitchTime: number;
    popularThemes: { theme: ThemeName; count: number }[];
    renderTime: number;
  };
  resetMetrics: () => void;
}

// ---------------------------------------------------------------------------
// Full context type
// ---------------------------------------------------------------------------

export interface TerminalContextType {
  // ── Terminal core ──────────────────────────────────────────────────────
  /** Ordered list of executed commands and their outputs */
  history: TerminalHistory[];

  /** Current value of the command input field */
  currentInput: string;

  /** Update the command input value */
  setCurrentInput: (value: string | ((prev: string) => string)) => void;

  /** True while a command is being processed */
  isProcessing: boolean;

  /**
   * Low-level execute that returns raw CommandOutput without side-effects.
   * Prefer `handleSubmit` for high-level orchestration (theme changes, tour, etc.).
   */
  executeCommand: (input: string) => Promise<CommandOutput | null>;

  /** Append a command + output pair to the visible history */
  addToHistory: (input: string, output: CommandOutput) => void;

  /** Navigate up/down through previous commands, returns the command string */
  navigateHistory: (direction: "up" | "down") => string;

  /** Wipe the displayed history and internal command log */
  clearHistory: () => void;

  /** Simple substring-based suggestions for the current input */
  getCommandSuggestions: (input: string, limit?: number) => string[];

  /** Top-10 most frequently used commands */
  getFrequentCommands: () => string[];

  /** Command usage analytics from the advanced history tracker */
  commandAnalytics: {
    totalCommands: number;
    uniqueCommands: number;
    successRate: number;
    topCommands: { command: string; count: number }[];
    commandsByCategory?: Record<string, number>;
  } | null;

  // ── Theme ──────────────────────────────────────────────────────────────
  /** Current theme name (e.g. "default", "dracula") */
  theme: ThemeName;

  /** Full theme configuration object (colors, name, etc.) */
  themeConfig: ThemeConfig;

  /**
   * Change the active theme.
   * @returns true on success, false if the theme name is invalid
   */
  changeTheme: (newTheme: ThemeName) => boolean;

  /** All built-in theme names, sorted */
  availableThemes: ThemeName[];

  /** Last theme error message, or null */
  themeError: string | null;

  /** Whether the theme system has mounted and applied styles */
  mounted: boolean;

  /** Raw theme performance metrics */
  themeMetrics: ThemePerformance["themeMetrics"];

  /** Returns aggregated performance data for theme switches */
  getPerformanceReport: ThemePerformance["getPerformanceReport"];

  /** Reset all accumulated theme performance data */
  resetPerformanceMetrics: () => void;

  // ── Font ───────────────────────────────────────────────────────────────
  /** Current font name */
  font: FontName;

  /** Full font configuration (family, weight, ligatures, etc.) */
  fontConfig: FontConfig;

  /**
   * Change the active font.
   * Silently ignores unknown font names.
   */
  changeFont: (newFont: FontName) => void;

  /** All available font names */
  availableFonts: FontName[];

  // ── i18n ───────────────────────────────────────────────────────────────
  /** Translate a key from the current locale */
  t: (key: keyof TranslationKeys) => string;

  /** ISO locale code currently active (e.g. "en", "id") */
  currentLocale: string;

  /** Change the active locale. Returns false if locale is unsupported. */
  changeLocale: (localeCode: string) => boolean;

  // ── Accessibility ──────────────────────────────────────────────────────
  /** Send a message to the screen-reader live region */
  announceMessage: (message: string, priority?: "polite" | "assertive") => void;

  /** True when the OS-level "reduce motion" preference is active */
  isReducedMotion: boolean;

  /** True when the OS-level "high contrast" preference is active */
  isHighContrast: boolean;

  /** Terminal base font size preference */
  fontSize: "small" | "medium" | "large";

  /** Update font size preference */
  setFontSize: (size: "small" | "medium" | "large") => void;

  /** Whether focus-mode (no-distraction) is active */
  focusMode: boolean;

  /** Toggle focus mode on/off */
  setFocusMode: (enabled: boolean) => void;

  // ── Tour ───────────────────────────────────────────────────────────────
  /** True while the onboarding tour is running */
  isTourActive: boolean;

  /** The current tour step's data, or null when tour is inactive */
  currentStep: TourStep | null;

  /** Zero-based index of the displayed tour step */
  currentStepIndex: number;

  /** Total number of tour steps */
  totalSteps: number;

  /** Completion percentage (0-100) */
  tourProgress: number;

  /** True if the user has previously completed the tour */
  hasCompletedTour: boolean;

  /** True only the very first time the app is visited */
  isFirstVisit: boolean;

  /** Begin the tour from step 0 */
  startTour: () => void;

  /** Advance to the next step (or complete the tour) */
  nextStep: () => void;

  /** Go back one step */
  prevStep: () => void;

  /** Skip and mark the tour as completed */
  skipTour: () => void;

  // ── Background ─────────────────────────────────────────────────────────
  /** Current background animation / colour settings */
  backgroundSettings: BackgroundSettings;

  /** Update background animation settings */
  setBackgroundSettings: (settings: BackgroundSettings) => void;

  // ── UI State ───────────────────────────────────────────────────────────
  /** Whether the interactive welcome panel is visible */
  showWelcome: boolean;

  /** Show or hide the welcome panel */
  setShowWelcome: (show: boolean) => void;

  /** Active toast notification, or null */
  notification: TerminalNotification | null;

  /**
   * Display a transient toast notification.
   * @param message - Text to display
   * @param type    - Severity (defaults to "info")
   */
  showNotification: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;

  /** Dismiss the current notification */
  clearNotification: () => void;

  // ── High-level handlers ────────────────────────────────────────────────
  /**
   * Full command submit pipeline:
   * parses special outputs (CHANGE_THEME, CHANGE_FONT, START_GUIDED_TOUR, etc.)
   * and calls the appropriate hook functions before adding to history.
   */
  handleSubmit: (command: string) => Promise<void>;

  /** Move to the next tour step (clears history at step 3) */
  handleTourNext: () => void;

  /** Skip the tour and reset the welcome screen */
  handleTourSkip: () => void;

  /** Execute a demo command from within the tour overlay */
  handleTourDemoCommand: (command: string) => void;

  /** Set the current input to a selected welcome-panel command */
  handleWelcomeCommandSelect: (command: string) => string;

  // ── Refs ───────────────────────────────────────────────────────────────
  /** Ref for the hidden text input element used to receive typed characters */
  commandInputRef: MutableRefObject<HTMLInputElement | null>;

  /** Ref for the outermost terminal container div */
  terminalRef: MutableRefObject<HTMLDivElement | null>;

  /** Ref for the invisible sentinel div at the bottom (used for auto-scroll) */
  bottomRef: MutableRefObject<HTMLDivElement | null>;
}
