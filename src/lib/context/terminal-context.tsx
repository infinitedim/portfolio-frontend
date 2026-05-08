/**
 * @fileoverview TerminalProvider + useTerminalContext
 *
 * Centralises all terminal-related state management so child components can
 * access any piece of state without prop drilling.
 *
 * Usage:
 * ```tsx
 * // Wrap your component tree:
 * <TerminalProvider>
 *   <TerminalContent />
 * </TerminalProvider>
 *
 * // Consume anywhere inside the tree:
 * const { history, handleSubmit } = useTerminalContext();
 * ```
 *
 * Dependencies (hooks integrated):
 *  - useTheme         – active theme + changeTheme
 *  - useFont          – active font + changeFont
 *  - useI18n          – translations + locale switching
 *  - useAccessibility – a11y flags + announcer
 *  - useTerminal      – command history + executor
 *  - useTour          – guided-tour state machine
 */

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type JSX,
} from "react";
import { useTheme } from "@/hooks/use-theme";
import { useFont } from "@/hooks/use-font";
import { useI18n } from "@/hooks/use-i18n";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import { useTerminal } from "@/hooks/use-terminal";
import { useTour } from "@/hooks/use-tour";
import { CustomizationService } from "@/lib/services/customization-service";
import { isThemeName } from "@/types/theme";
import { isFontName } from "@/types/font";
import type { TerminalContextType, TerminalNotification } from "@/types/terminal-context";
import type { BackgroundSettings } from "@/types/customization";

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------

const TerminalContext = createContext<TerminalContextType | null>(null);

// ---------------------------------------------------------------------------
// Default background settings constant
// ---------------------------------------------------------------------------

const DEFAULT_GLITCH_COLORS = ["#2b4539", "#61dca3", "#61b3dc"] as const;

const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: "letter-glitch",
  letterGlitch: {
    glitchColors: [...DEFAULT_GLITCH_COLORS],
    glitchSpeed: 50,
    centerVignette: false,
    outerVignette: true,
    smooth: true,
    characters:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
  },
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface TerminalProviderProps {
  children: ReactNode;
  /** Called when the user changes the theme via a command */
  onThemeChange?: (theme: string) => void;
  /** Called when the user changes the font via a command */
  onFontChange?: (font: string) => void;
}

/**
 * TerminalProvider
 *
 * Integrates all terminal-related hooks and exposes their combined state +
 * handlers via React Context. Wrap `<TerminalContent />` (or any component
 * tree) with this provider.
 */
export function TerminalProvider({
  children,
  onThemeChange,
  onFontChange,
}: TerminalProviderProps): JSX.Element {
  // ── Hooks ──────────────────────────────────────────────────────────────
  const themeHookResult = useTheme();
  const fontHookResult = useFont();
  const { t, currentLocale, changeLocale } = useI18n();
  const {
    announceMessage,
    isReducedMotion,
    isHighContrast,
    fontSize,
    setFontSize,
    focusMode,
    setFocusMode,
  } = useAccessibility();

  const {
    theme,
    themeConfig,
    changeTheme,
    availableThemes,
    mounted,
    error: themeError,
    getPerformanceReport,
    themeMetrics,
    resetPerformanceMetrics,
  } = themeHookResult;

  const { font, fontConfig, changeFont, availableFonts } = fontHookResult;

  /** Performance object forwarded into useTerminal so the `perf` command works */
  const themePerformance = useMemo(
    () => ({
      getPerformanceReport,
      themeMetrics,
      resetMetrics: resetPerformanceMetrics,
    }),
    [getPerformanceReport, themeMetrics, resetPerformanceMetrics],
  );

  const {
    history,
    currentInput,
    setCurrentInput,
    isProcessing,
    executeCommand,
    addToHistory,
    navigateHistory,
    clearHistory,
    getCommandSuggestions,
    getFrequentCommands,
    commandAnalytics,
  } = useTerminal(undefined, undefined, themePerformance);

  const {
    isActive: isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress: tourProgress,
    hasCompletedTour,
    isFirstVisit,
    startTour,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  // ── Local UI state ─────────────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(true);
  const [notification, setNotification] = useState<TerminalNotification | null>(null);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>(
    DEFAULT_BACKGROUND_SETTINGS,
  );

  // ── Refs exposed to children ───────────────────────────────────────────
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ── Side effects ───────────────────────────────────────────────────────

  /** Hide welcome panel once history is non-empty */
  useEffect(() => {
    if (history.length > 0) setShowWelcome(false);
  }, [history.length]);

  /** Load custom fonts + announce on mount */
  useEffect(() => {
    const customizationService = CustomizationService.getInstance();
    customizationService.loadAllCustomFonts();
    announceMessage("Terminal portfolio loaded", "polite");
  }, [announceMessage]);

  /** Sync background settings from CustomizationService */
  useEffect(() => {
    const customizationService = CustomizationService.getInstance();

    if (typeof customizationService.getBackgroundSettings === "function") {
      setBackgroundSettings(customizationService.getBackgroundSettings());
    }

    const handleBackgroundUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<BackgroundSettings>;
      if (customEvent.detail) {
        setBackgroundSettings(customEvent.detail);
      } else if (typeof customizationService.getBackgroundSettings === "function") {
        setBackgroundSettings(customizationService.getBackgroundSettings());
      }
    };

    window.addEventListener("background-settings-updated", handleBackgroundUpdate);
    return () => window.removeEventListener("background-settings-updated", handleBackgroundUpdate);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────

  const showNotification = useCallback(
    (
      message: string,
      type: "info" | "success" | "warning" | "error" = "info",
    ) => {
      setNotification({ message, type });
    },
    [],
  );

  const clearNotification = useCallback(() => setNotification(null), []);

  const handleWelcomeCommandSelect = useCallback(
    (command: string) => {
      setCurrentInput(command);
      return command;
    },
    [setCurrentInput],
  );

  const handleTourDemoCommand = useCallback(
    async (command: string) => {
      // Show the command in the input briefly so the user can see what the
      // tour is running for them.
      setCurrentInput(command);
      const output = await executeCommand(command);

      // Mirror the regular submit pipeline so the demo command shows up in
      // the visible terminal history. Without this the user reaches the
      // "history" step with an apparently empty terminal and has nothing to
      // recall via the arrow keys.
      if (output) {
        addToHistory(command, output);
      }

      // Reset the input and refocus so the next interaction (typing or arrow
      // navigation) actually lands on the input element.
      setCurrentInput("");
      setTimeout(() => commandInputRef.current?.focus(), 50);
    },
    [executeCommand, addToHistory, setCurrentInput],
  );

  // Note: we deliberately do NOT clear the command history when stepping past
  // the "history" step. Users need their demo commands to remain available
  // both to actually exercise the history-navigation step and so that
  // pressing the Back button returns them to a usable state.
  const handleTourNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handleTourSkip = useCallback(() => {
    if (history.length > 0) clearHistory();
    setShowWelcome(true);
    setCurrentInput("");
    skipTour();
  }, [history.length, clearHistory, setCurrentInput, skipTour]);

  /**
   * handleSubmit
   *
   * Full command pipeline. Parses special sentinel values returned by the
   * command registry (e.g. "CHANGE_THEME:dracula") and calls the appropriate
   * hook functions before writing to history.
   */
  const handleSubmit = useCallback(
    async (command: string): Promise<void> => {
      const customizationService = CustomizationService.getInstance();
      const output = await executeCommand(command);

      if (!output) {
        setCurrentInput("");
        return;
      }

      // ── START_GUIDED_TOUR ──────────────────────────────────────────────
      if (
        typeof output.content === "string" &&
        output.content === "START_GUIDED_TOUR"
      ) {
        startTour();
        addToHistory(command, {
          ...output,
          content: "🚀 Starting guided tour...",
          type: "success",
        });
        setCurrentInput("");
        return;
      }

      // ── OPEN_CUSTOMIZATION_MANAGER ─────────────────────────────────────
      if (
        typeof output.content === "string" &&
        output.content === "OPEN_CUSTOMIZATION_MANAGER"
      ) {
        // Signal the terminal UI to open the manager via a custom event
        window.dispatchEvent(new CustomEvent("terminal:open-customization"));
        addToHistory(command, {
          ...output,
          content: "🎨 Opening customization manager...",
          type: "success",
        });
        showNotification("Customization manager opened!", "success");
        setCurrentInput("");
        return;
      }

      // ── CHANGE_THEME:* ─────────────────────────────────────────────────
      if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_THEME:")
      ) {
        const themeName = output.content.split(":")[1];

        if (isThemeName(themeName)) {
          const success = changeTheme(themeName);

          if (success) {
            onThemeChange?.(themeName);
            showNotification(`Theme changed to "${themeName}"`, "success");
            announceMessage(`Theme changed to ${themeName}`, "polite");
            addToHistory(command, {
              ...output,
              content: [
                `✅ Theme changed to "${themeName}"`,
                "💾 Theme preference saved automatically.",
                "🎨 Theme applied instantly!",
              ].join("\n"),
              type: "success",
            });
          } else {
            const errorMsg = themeError ?? `Theme "${themeName}" may not exist or be invalid.`;
            showNotification(`Failed to change theme: ${errorMsg}`, "error");
            addToHistory(command, {
              ...output,
              content: [
                `❌ Failed to change theme to "${themeName}"`,
                `🔍 Error: ${errorMsg}`,
                "💡 Use 'theme -l' to list available themes.",
              ].join("\n"),
              type: "error",
            });
          }
        } else {
          showNotification("Theme change function not available", "error");
        }

        setCurrentInput("");
        return;
      }

      // ── CHANGE_FONT:* ──────────────────────────────────────────────────
      if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_FONT:")
      ) {
        const fontName = output.content.split(":")[1];

        if (isFontName(fontName)) {
          changeFont(fontName);
          onFontChange?.(fontName);
          showNotification(`Font changed to "${fontName}"`, "success");
          announceMessage(`Font changed to ${fontName}`, "polite");
          addToHistory(command, {
            ...output,
            content: [
              `✅ Font changed to "${fontName}"`,
              "",
              `🔤 Applied ${fontConfig?.name ?? "Unknown"} typeface`,
              `🔤 Family: ${fontConfig?.family ?? "Unknown"}`,
              `${fontConfig?.ligatures ? "✨ Font ligatures enabled for enhanced readability" : "📝 Standard font rendering"}`,
              "💾 Font preference saved automatically",
              "",
              "💡 Quick commands:",
              "   font -l    # List all fonts",
              "   font -c    # Show current font info",
              "   customize  # Open customization manager",
            ].join("\n"),
            type: "success",
          });
        } else {
          showNotification("Font change function not available", "error");
        }

        setCurrentInput("");
        return;
      }

      // ── SHOW_STATUS ────────────────────────────────────────────────────
      if (
        typeof output.content === "string" &&
        output.content === "SHOW_STATUS"
      ) {
        const uptime = new Date().toLocaleString();
        const customThemes = customizationService.getCustomThemes().length;
        const customFonts = customizationService.getCustomFonts().length;

        const analytics = commandAnalytics ?? {
          totalCommands: 0,
          uniqueCommands: 0,
          successRate: 100,
          topCommands: [],
        };

        const perfReport = getPerformanceReport();
        const currentMetrics = themeMetrics;

        const statusInfo = [
          "🖥️  Terminal Portfolio System Status",
          "═".repeat(60),
          "",
          `📊 Status: ${Math.random() > 0.5 ? "🟢 Online" : "🟡 Development"}`,
          `🎨 Current Theme: ${themeConfig?.name ?? "Unknown"} (${theme})`,
          `🔤 Current Font: ${fontConfig?.name ?? "Unknown"}${fontConfig?.ligatures ? " (ligatures)" : ""}`,
          `⏰ Session Started: ${uptime}`,
          `💻 Platform: ${mounted && typeof window !== "undefined" ? window.navigator.platform : "Server"}`,
          "",
          "📈 Command Analytics:",
          `   • Total commands executed: ${analytics.totalCommands}`,
          `   • Unique commands used: ${analytics.uniqueCommands}`,
          `   • Success rate: ${analytics.successRate.toFixed(1)}%`,
          `   • Most used: ${analytics.topCommands[0]?.command ?? "N/A"}`,
          "",
          "⚡ Performance Metrics:",
          `   • Theme switches: ${perfReport.totalSwitches}`,
          `   • Average switch time: ${perfReport.averageTime.toFixed(1)}ms`,
          `   • Current theme render: ${currentMetrics.renderTime.toFixed(1)}ms`,
          `   • Fastest switch: ${perfReport.fastestSwitch.toFixed(1)}ms`,
          `   • Most used theme: ${currentMetrics.popularThemes[0]?.theme ?? theme}`,
          "",
          "🎨 Theme System:",
          `   • ${availableThemes?.length ?? 0} built-in themes available`,
          `   • ${customThemes} custom themes created`,
          "   • Use 'theme -l' to list all themes",
          "",
          "🔤 Font System:",
          `   • ${availableFonts?.length ?? 0} system fonts available`,
          `   • ${customFonts} custom fonts uploaded`,
          "   • Use 'font -l' to list all fonts",
          "",
          "⌨️  Enhanced Features:",
          "   • Smart command suggestions (↑/↓ or Ctrl+R)",
          "   • Command analytics and favorites",
          "   • Tab completion with history",
          "   • Real-time performance monitoring",
          "",
          "🎯 Development Progress:",
          "   ▓▓▓▓▓▓▓▓▓░ 95% Complete",
        ].join("\n");

        addToHistory(command, { ...output, content: statusInfo, type: "success" });
        setCurrentInput("");
        return;
      }

      // ── Default: pass through ──────────────────────────────────────────
      addToHistory(command, output);
      setCurrentInput("");
    },
    [
      addToHistory,
      announceMessage,
      availableFonts?.length,
      availableThemes?.length,
      changeFont,
      changeTheme,
      commandAnalytics,
      executeCommand,
      fontConfig?.family,
      fontConfig?.ligatures,
      fontConfig?.name,
      getPerformanceReport,
      mounted,
      onFontChange,
      onThemeChange,
      setCurrentInput,
      showNotification,
      startTour,
      theme,
      themeConfig?.name,
      themeError,
      themeMetrics,
    ],
  );

  // ── Context value ──────────────────────────────────────────────────────

  const contextValue = useMemo<TerminalContextType>(
    () => ({
      // Terminal core
      history,
      currentInput,
      setCurrentInput,
      isProcessing,
      executeCommand,
      addToHistory,
      navigateHistory,
      clearHistory,
      getCommandSuggestions,
      getFrequentCommands,
      commandAnalytics,

      // Theme
      theme,
      themeConfig,
      changeTheme,
      availableThemes,
      themeError,
      mounted,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,

      // Font
      font,
      fontConfig,
      changeFont,
      availableFonts,

      // i18n
      t,
      currentLocale,
      changeLocale,

      // Accessibility
      announceMessage,
      isReducedMotion,
      isHighContrast,
      fontSize,
      setFontSize,
      focusMode,
      setFocusMode,

      // Tour
      isTourActive,
      currentStep,
      currentStepIndex,
      totalSteps,
      tourProgress,
      hasCompletedTour,
      isFirstVisit,
      startTour,
      nextStep,
      prevStep,
      skipTour,

      // Background
      backgroundSettings,
      setBackgroundSettings,

      // UI state
      showWelcome,
      setShowWelcome,
      notification,
      showNotification,
      clearNotification,

      // High-level handlers
      handleSubmit,
      handleTourNext,
      handleTourSkip,
      handleTourDemoCommand,
      handleWelcomeCommandSelect,

      // Refs
      commandInputRef,
      terminalRef,
      bottomRef,
    }),
    [
      history,
      currentInput,
      setCurrentInput,
      isProcessing,
      executeCommand,
      addToHistory,
      navigateHistory,
      clearHistory,
      getCommandSuggestions,
      getFrequentCommands,
      commandAnalytics,
      theme,
      themeConfig,
      changeTheme,
      availableThemes,
      themeError,
      mounted,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,
      font,
      fontConfig,
      changeFont,
      availableFonts,
      t,
      currentLocale,
      changeLocale,
      announceMessage,
      isReducedMotion,
      isHighContrast,
      fontSize,
      setFontSize,
      focusMode,
      setFocusMode,
      isTourActive,
      currentStep,
      currentStepIndex,
      totalSteps,
      tourProgress,
      hasCompletedTour,
      isFirstVisit,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      backgroundSettings,
      showWelcome,
      notification,
      showNotification,
      clearNotification,
      handleSubmit,
      handleTourNext,
      handleTourSkip,
      handleTourDemoCommand,
      handleWelcomeCommandSelect,
    ],
  );

  return (
    <TerminalContext.Provider value={contextValue}>
      {children}
    </TerminalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * useTerminalContext
 *
 * Returns the full TerminalContextType. Must be called from within a
 * component wrapped by `<TerminalProvider>`.
 *
 * @throws {Error} when called outside a TerminalProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { history, handleSubmit } = useTerminalContext();
 *   // ...
 * }
 * ```
 */
export function useTerminalContext(): TerminalContextType {
  const ctx = useContext(TerminalContext);
  if (!ctx) {
    throw new Error(
      "useTerminalContext() must be used within a <TerminalProvider>. " +
        "Make sure the component is a descendant of TerminalProvider.",
    );
  }
  return ctx;
}
