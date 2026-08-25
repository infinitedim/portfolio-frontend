/**
 * @fileoverview Main terminal organism component with full terminal emulator functionality,
 * theme/font customization, command history, and accessibility features.
 * @module components/organisms/terminal
 */

"use client";

import { useState, useEffect, useRef, useCallback, type JSX } from "react";
import {
  TerminalProvider,
  useTerminalContext,
} from "@/lib/context/terminal-context";
import { TerminalHeader } from "./terminal-header";
import { TerminalInputSection } from "./terminal-input-section";
import { TerminalCustomizationToolbar } from "./terminal-customization-toolbar";
import { TerminalHistory } from "./terminal-history";
import { MobileTerminal } from "@/components/organisms/terminal/mobile-terminal";
import { SkipLinks } from "@/components/molecules/accessibility/skip-to-content";
import { LetterGlitch } from "@/components/molecules/shared/letter-glitch";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";
import { useTerminalShortcuts } from "@/hooks/use-terminal-shortcuts";
import { KeyboardShortcut } from "@/components/molecules/terminal/keyboard-shortcuts";
import { HistorySearchPanel } from "@/components/molecules/terminal/history-search-panel";
import type { ThemeName } from "@/types/theme";

/**
 * Props for the Terminal component and its internal subcomponents.
 *
 * @interface TerminalProps
 * @property {(theme: string) => void} [onThemeChange] - Optional callback triggered when the terminal theme changes.
 * @property {(font: string) => void} [onFontChange] - Optional callback triggered when the terminal font changes.
 */
interface TerminalProps {
  onThemeChange?: (theme: string) => void;
  onFontChange?: (font: string) => void;
}

/**
 * Internal terminal content renderer that connects to the TerminalContext.
 *
 * Renders the terminal interface including header, history list, command input prompt,
 * animated backgrounds, shortcut modals, history search panels, and customization toolbars.
 * Handles keyboard navigation, global focus traps, and loading states.
 *
 * @param {TerminalProps} props - The component props.
 * @param {(theme: string) => void} [props.onThemeChange] - Optional theme change callback.
 * @param {(font: string) => void} [props.onFontChange] - Optional font change callback.
 * @returns {JSX.Element | null} The rendered terminal interface or loading indicator while initializing.
 */
function TerminalContent({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onThemeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFontChange,
}: TerminalProps): JSX.Element | null {
  const {
    themeConfig,
    fontConfig,
    mounted,
    isReducedMotion,
    history,
    backgroundSettings,

    commandInputRef,
    terminalRef,
    bottomRef,
    t,
    clearHistory,
    isClearing,
    handleSubmit,
    changeTheme,
    availableThemes,
    theme,
  } = useTerminalContext();

  const [hasMinimumLoadingTime, setHasMinimumLoadingTime] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isCustomizationOpenRef = useRef(false);

  /**
   * Cycles through available terminal color themes sequentially.
   */
  const cycleTheme = useCallback(() => {
    if (!availableThemes?.length) return;
    const idx = availableThemes.indexOf(theme);
    const nextIndex = idx >= 0 ? (idx + 1) % availableThemes.length : 0;
    changeTheme(availableThemes[nextIndex] as ThemeName);
  }, [availableThemes, theme, changeTheme]);

  const { shortcuts, updateShortcutKeys } = useTerminalShortcuts({
    onClear: clearHistory,
    onHelp: () => handleSubmit("help"),
    onThemeToggle: cycleTheme,
    onHistoryOpen: () => setHistoryOpen(true),
    onShortcutsOpen: () => setShortcutsOpen(true),
    onCommandExecute: (command) => handleSubmit(command),
  });

  useEffect(() => {
    /**
     * Opens the keyboard shortcuts modal.
     * @returns {void}
     */
    const openShortcuts = () => setShortcutsOpen(true);
    /**
     * Opens the command history search panel.
     * @returns {void}
     */
    const openHistory = () => setHistoryOpen(true);
    window.addEventListener("terminal:open-shortcuts", openShortcuts);
    window.addEventListener("terminal:open-history", openHistory);
    return () => {
      window.removeEventListener("terminal:open-shortcuts", openShortcuts);
      window.removeEventListener("terminal:open-history", openHistory);
    };
  }, []);

  useEffect(() => {
    /**
     * Closes open overlay panels on Escape key press.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (shortcutsOpen) {
        setShortcutsOpen(false);
        e.preventDefault();
        e.stopPropagation();
      } else if (historyOpen) {
        setHistoryOpen(false);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [shortcutsOpen, historyOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setHasMinimumLoadingTime(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (bottomRef.current && !isReducedMotion) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (bottomRef.current) {
        bottomRef.current.scrollIntoView();
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [history, isReducedMotion, bottomRef]);

  useEffect(() => {
    /**
     * Marks the customization toolbar as open.
     */
    const open = () => {
      isCustomizationOpenRef.current = true;
    };
    /**
     * Marks the customization toolbar as closed.
     */
    const close = () => {
      isCustomizationOpenRef.current = false;
    };
    window.addEventListener("terminal:open-customization", open);
    window.addEventListener("terminal:close-customization", close);
    return () => {
      window.removeEventListener("terminal:open-customization", open);
      window.removeEventListener("terminal:close-customization", close);
    };
  }, []);

  const setCurrentInput = useTerminalContext().setCurrentInput;
  useEffect(() => {
    /**
     * Handles global keystrokes to auto-focus terminal input when typing.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     */
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.contentEditable === "true" ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        isCustomizationOpenRef.current
      ) {
        return;
      }

      if (document.activeElement && document.activeElement !== document.body) {
        const active = document.activeElement as HTMLElement;
        if (
          active.tagName.toLowerCase() !== "body" &&
          active !== commandInputRef.current
        ) {
          return;
        }
      }

      if (
        commandInputRef.current &&
        e.key.length === 1 &&
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]$/.test(e.key)
      ) {
        commandInputRef.current.focus();
        setCurrentInput((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [commandInputRef, setCurrentInput]);

  useEffect(() => {
    /**
     * Focuses the terminal input when the user clicks on the terminal body.
     *
     * @param {MouseEvent} e - Mouse click event.
     */
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "A"
      )
        return;
      const input = terminalRef.current?.querySelector("input");
      if (input) input.focus();
    };

    const el = terminalRef.current;
    if (el) {
      el.addEventListener("click", handleClick);
      return () => el.removeEventListener("click", handleClick);
    }
  }, [terminalRef]);

  if (!themeConfig || !fontConfig) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: "var(--terminal-bg, #0a0a0a)",
          color: "var(--terminal-text, #e5e5e5)",
        }}
        suppressHydrationWarning={true}
      >
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-800" />
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
          <TerminalLoadingProgress
            duration={2000}
            files={[
              { path: t("loading"), size: "" },
              { path: t("loading"), size: "" },
              { path: t("loading"), size: "" },
            ]}
            completionText={`${t("terminalReady")}!`}
            autoStart={true}
            showSystemInfo={true}
          />
        </div>
      </div>
    );
  }

  if (!mounted || !hasMinimumLoadingTime) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: "var(--terminal-bg, #0a0a0a)",
          color: "var(--terminal-text, #e5e5e5)",
        }}
        suppressHydrationWarning={true}
      >
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-800" />
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
          <TerminalLoadingProgress
            duration={3500}
            files={[
              { path: "src/components/terminal/Terminal.tsx", size: "18.2 KB" },
              { path: "src/hooks/useTheme.ts", size: "7.9 KB" },
              { path: "src/hooks/useFont.ts", size: "5.4 KB" },
              { path: "src/hooks/useTerminal.ts", size: "15.6 KB" },
              { path: "src/lib/themes/themeConfig.ts", size: "9.8 KB" },
              { path: "src/lib/fonts/fontConfig.ts", size: "6.2 KB" },
              { path: "src/components/ui/LetterGlitch.tsx", size: "8.1 KB" },
              { path: "src/components/ui/ASCIIBanner.tsx", size: "4.3 KB" },
              {
                path: "src/components/terminal/CommandInput.tsx",
                size: "12.4 KB",
              },
              { path: "src/lib/commands/commandRegistry.ts", size: "22.1 KB" },
              { path: "src/hooks/useCommandSuggestions.ts", size: "11.8 KB" },
              { path: "src/types/terminal.ts", size: "2.9 KB" },
              { path: "package.json", size: "3.4 KB" },
              { path: "next.config.js", size: "1.6 KB" },
            ]}
            completionText={`${t("terminalReady")}!`}
            autoStart={true}
            showSystemInfo={true}
            showProgressBar={true}
            enableTypewriter={true}
          />
        </div>
      </div>
    );
  }

  const DEFAULT_GLITCH_COLORS = ["#2b4539", "#61dca3", "#61b3dc"];

  /**
   * Checks whether the provided array of color strings matches the default glitch colors.
   *
   * @param {string[]} colors - Array of color hex codes or CSS color strings to compare.
   * @returns {boolean} True if the colors array matches the default glitch palette exactly; otherwise false.
   */
  const isDefaultGlitchColors = (colors: string[]): boolean => {
    if (colors.length !== DEFAULT_GLITCH_COLORS.length) return false;
    return colors.every((c, i) => c === DEFAULT_GLITCH_COLORS[i]);
  };

  const themeGlitchColors = themeConfig?.colors
    ? [
        themeConfig.colors.bg,
        themeConfig.colors.accent,
        themeConfig.colors.muted || themeConfig.colors.border,
      ]
    : DEFAULT_GLITCH_COLORS;

  return (
    <>
      <SkipLinks
        links={[
          { id: "main-content", label: "Skip to terminal", icon: "" },
          { id: "command-input", label: "Skip to command input", icon: "⌨️" },
          { id: "customization", label: "Skip to customization", icon: "" },
        ]}
      />

      <MobileTerminal>
        {backgroundSettings.type === "letter-glitch" &&
          backgroundSettings.letterGlitch && (
            <LetterGlitch
              glitchColors={
                isDefaultGlitchColors(
                  backgroundSettings.letterGlitch.glitchColors,
                )
                  ? themeGlitchColors
                  : backgroundSettings.letterGlitch.glitchColors
              }
              glitchSpeed={backgroundSettings.letterGlitch.glitchSpeed}
              centerVignette={backgroundSettings.letterGlitch.centerVignette}
              outerVignette={backgroundSettings.letterGlitch.outerVignette}
              smooth={backgroundSettings.letterGlitch.smooth}
              characters={backgroundSettings.letterGlitch.characters}
              className="opacity-30 fixed inset-0 z-0"
            />
          )}
        <div
          ref={terminalRef}
          id="main-content"
          className={`min-h-screen w-full pt-4 px-2 pb-4 sm:pt-16 sm:px-6 lg:px-8 cursor-text terminal-container relative z-10 ${!isReducedMotion ? "transition-all duration-300" : ""}`}
          style={{
            backgroundColor: "transparent",
            color: themeConfig?.colors?.text ?? "#ffffff",
            fontFamily: fontConfig?.family ?? "monospace",
            fontWeight: fontConfig?.weight ?? "normal",
            fontFeatureSettings: fontConfig?.ligatures
              ? '"liga" 1, "calt" 1'
              : '"liga" 0, "calt" 0',
          }}
          suppressHydrationWarning={true}
          role="main"
          aria-label="Terminal interface"
        >
          <div className="relative z-10 w-full max-w-4xl mx-auto space-y-4 sm:space-y-8 mt-2 sm:mt-10">
            <TerminalHeader />
            <TerminalHistory
              history={history}
              isClearing={isClearing}
            />
            <TerminalInputSection />
            <div ref={bottomRef} />
          </div>
          <TerminalCustomizationToolbar />
        </div>

        <KeyboardShortcut
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
          shortcuts={shortcuts}
          onShortcutChange={updateShortcutKeys}
        />

        <HistorySearchPanel
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onSelectCommand={(command) => {
            setHistoryOpen(false);
            handleSubmit(command);
          }}
        />
      </MobileTerminal>
    </>
  );
}

/**
 * Main Terminal organism component.
 *
 * Wraps the TerminalContent inside a TerminalProvider to provide state management
 * for terminal commands, history, theme, font, and background customizations.
 *
 * @param {TerminalProps} props - Configuration props for theme and font change callbacks.
 * @param {(theme: string) => void} [props.onThemeChange] - Optional theme change callback.
 * @param {(font: string) => void} [props.onFontChange] - Optional font change callback.
 * @returns {JSX.Element} The wrapped terminal application interface.
 */
export function Terminal({
  onThemeChange,
  onFontChange,
}: TerminalProps): JSX.Element {
  return (
    <TerminalProvider
      onThemeChange={onThemeChange}
      onFontChange={onFontChange}
    >
      <TerminalContent
        onThemeChange={onThemeChange}
        onFontChange={onFontChange}
      />
    </TerminalProvider>
  );
}
