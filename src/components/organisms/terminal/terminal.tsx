/**
 * @fileoverview Terminal – main component (refactored)
 *
 * This file is now a thin composition layer. All state and business logic
 * live in `TerminalProvider` (via TerminalContext). This component is
 * responsible only for:
 *
 *  1. Wrapping `TerminalContent` with `<TerminalProvider>`
 *  2. Rendering the full-page loading screen before mount
 *  3. Wiring DOM-level side effects (scroll, global keydown, click-focus)
 *  4. Laying out the structural regions of the terminal page
 *
 * @example
 * ```tsx
 * <Terminal onThemeChange={handleTheme} onFontChange={handleFont} />
 * ```
 */

"use client";

import {
  useState,
  useEffect,
  useRef,

  type JSX,
} from "react";
import { TerminalProvider, useTerminalContext } from "@/lib/context/terminal-context";
import { TerminalHeader } from "./terminal-header";
import { TerminalInputSection } from "./terminal-input-section";
import { TerminalCustomizationToolbar } from "./terminal-customization-toolbar";
import { TerminalHistory } from "./terminal-history";
import { MobileTerminal } from "@/components/organisms/terminal/mobile-terminal";
import { SkipLinks } from "@/components/molecules/accessibility/skip-to-content";
import { LetterGlitch } from "@/components/molecules/shared/letter-glitch";
import { GuidedTour } from "@/components/organisms/onboarding/guided-tour";
import { DevelopmentBanner } from "@/components/molecules/shared/development-banner";
import { AccessibilityMenu } from "@/components/molecules/accessibility/accessibility-menu";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TerminalProps {
  onThemeChange?: (theme: string) => void;
  onFontChange?: (font: string) => void;
}

// ---------------------------------------------------------------------------
// TerminalContent – uses context
// ---------------------------------------------------------------------------

/**
 * Internal component that consumes TerminalContext.
 * Handles DOM side-effects and assembles the visible page regions.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TerminalContent({ onThemeChange, onFontChange }: TerminalProps): JSX.Element | null {
  const {
    themeConfig,
    fontConfig,
    mounted,
    isReducedMotion,
    history,
    backgroundSettings,
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    tourProgress,
    hasCompletedTour,
    isFirstVisit,
    startTour,
    handleTourNext,
    handleTourSkip,
    handleTourDemoCommand,
    prevStep,
    commandInputRef,
    terminalRef,
    bottomRef,
    t,
  } = useTerminalContext();

  const [hasMinimumLoadingTime, setHasMinimumLoadingTime] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  /** Tracks if customization manager is open (used to gate global keydown) */
  const isCustomizationOpenRef = useRef(false);

  useEffect(() => { setIsMounted(true); }, []);

  /** Minimum loading delay so the splash screen isn't a flash */
  useEffect(() => {
    const timer = setTimeout(() => setHasMinimumLoadingTime(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /** Auto-start tour for first-time visitors once history is empty */
  useEffect(() => {
    if (isMounted && !hasCompletedTour && isFirstVisit && history.length === 0) {
      const timer = setTimeout(() => startTour(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMounted, hasCompletedTour, isFirstVisit, history.length, startTour]);

  /** Scroll to bottom whenever history updates */
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

  /** Listen for customization panel open/close to gate global keydown */
  useEffect(() => {
    const open = () => { isCustomizationOpenRef.current = true; };
    const close = () => { isCustomizationOpenRef.current = false; };
    window.addEventListener("terminal:open-customization", open);
    window.addEventListener("terminal:close-customization", close);
    return () => {
      window.removeEventListener("terminal:open-customization", open);
      window.removeEventListener("terminal:close-customization", close);
    };
  }, []);

  /** Global keydown: redirect printable characters to the command input */
  const setCurrentInput = useTerminalContext().setCurrentInput;
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.contentEditable === "true" ||
        e.ctrlKey || e.altKey || e.metaKey ||
        e.key === "Tab" || e.key === "Escape" || e.key === "Enter" ||
        e.key === "ArrowUp" || e.key === "ArrowDown" ||
        e.key === "ArrowLeft" || e.key === "ArrowRight" ||
        isCustomizationOpenRef.current
      ) {
        return;
      }

      if (document.activeElement && document.activeElement !== document.body) {
        const active = document.activeElement as HTMLElement;
        if (active.tagName.toLowerCase() !== "body" && active !== commandInputRef.current) {
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

  /** Focus the command input when the user clicks on the terminal background */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "A"
      ) return;
      const input = terminalRef.current?.querySelector("input");
      if (input) input.focus();
    };

    const el = terminalRef.current;
    if (el) {
      el.addEventListener("click", handleClick);
      return () => el.removeEventListener("click", handleClick);
    }
  }, [terminalRef]);

  // ── Loading screens ──────────────────────────────────────────────────

  if (!themeConfig || !fontConfig) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: "var(--terminal-bg, #0a0a0a)", color: "var(--terminal-text, #e5e5e5)" }}
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
            completionText={`🔧 ${t("terminalReady")}!`}
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
        style={{ backgroundColor: "var(--terminal-bg, #0a0a0a)", color: "var(--terminal-text, #e5e5e5)" }}
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
              { path: "src/components/terminal/CommandInput.tsx", size: "12.4 KB" },
              { path: "src/lib/commands/commandRegistry.ts", size: "22.1 KB" },
              { path: "src/hooks/useCommandSuggestions.ts", size: "11.8 KB" },
              { path: "src/types/terminal.ts", size: "2.9 KB" },
              { path: "package.json", size: "3.4 KB" },
              { path: "next.config.js", size: "1.6 KB" },
            ]}
            completionText="🚀 Terminal Portfolio Ready!"
            autoStart={true}
            showSystemInfo={true}
            showProgressBar={true}
            enableTypewriter={true}
          />
        </div>
      </div>
    );
  }

  // ── Derived glitch colours ───────────────────────────────────────────

  const DEFAULT_GLITCH_COLORS = ["#2b4539", "#61dca3", "#61b3dc"];

  const isDefaultGlitchColors = (colors: string[]): boolean => {
    if (colors.length !== DEFAULT_GLITCH_COLORS.length) return false;
    return colors.every((c, i) => c === DEFAULT_GLITCH_COLORS[i]);
  };

  const themeGlitchColors = themeConfig?.colors
    ? [themeConfig.colors.bg, themeConfig.colors.accent, themeConfig.colors.muted || themeConfig.colors.border]
    : DEFAULT_GLITCH_COLORS;

  // ── Main render ──────────────────────────────────────────────────────

  return (
    <>
      <SkipLinks
        links={[
          { id: "main-content", label: "Skip to terminal", icon: "💻" },
          { id: "command-input", label: "Skip to command input", icon: "⌨️" },
          { id: "customization", label: "Skip to customization", icon: "🎨" },
        ]}
      />

      <MobileTerminal>
        <DevelopmentBanner />
        <AccessibilityMenu />

        {/* Background animation */}
        {backgroundSettings.type === "letter-glitch" && backgroundSettings.letterGlitch && (
          <LetterGlitch
            glitchColors={
              isDefaultGlitchColors(backgroundSettings.letterGlitch.glitchColors)
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

        {/* Main terminal area */}
        <div
          ref={terminalRef}
          id="main-content"
          className={`min-h-screen w-full pt-4 px-2 pb-4 sm:pt-16 sm:px-6 lg:px-8 cursor-text terminal-container relative z-10 ${!isReducedMotion ? "transition-all duration-300" : ""}`}
          style={{
            backgroundColor: "transparent",
            color: themeConfig?.colors?.text ?? "#ffffff",
            fontFamily: fontConfig?.family ?? "monospace",
            fontWeight: fontConfig?.weight ?? "normal",
            fontFeatureSettings: fontConfig?.ligatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0',
          }}
          suppressHydrationWarning={true}
          role="main"
          aria-label="Terminal interface"
        >
          <div className="relative z-10 w-full max-w-4xl mx-auto space-y-4 sm:space-y-8 mt-2 sm:mt-10">
            {/* Header: ASCII banner + welcome */}
            <TerminalHeader />

            {/* Command history */}
            <TerminalHistory history={history} />

            {/* Input + loading indicator */}
            <TerminalInputSection />

            {/* Scroll sentinel */}
            <div ref={bottomRef} />
          </div>

          {/* Customization button + manager + toasts */}
          <TerminalCustomizationToolbar />
        </div>

        {/* Guided tour overlay */}
        {isTourActive && currentStep && (
          <GuidedTour
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            progress={tourProgress}
            onNext={handleTourNext}
            onPrev={prevStep}
            onSkip={handleTourSkip}
            onDemoCommand={handleTourDemoCommand}
          />
        )}
      </MobileTerminal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Terminal – public export
// ---------------------------------------------------------------------------

/**
 * Terminal
 *
 * Public entry point. Wraps `TerminalContent` with `TerminalProvider` so
 * the entire sub-tree has access to the terminal context.
 *
 * @param onThemeChange - Callback fired after a successful theme change
 * @param onFontChange  - Callback fired after a successful font change
 */
export function Terminal({ onThemeChange, onFontChange }: TerminalProps): JSX.Element {
  return (
    <TerminalProvider onThemeChange={onThemeChange} onFontChange={onFontChange}>
      <TerminalContent onThemeChange={onThemeChange} onFontChange={onFontChange} />
    </TerminalProvider>
  );
}
