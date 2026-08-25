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
import { CustomizationService } from "@/lib/services/customization-service";
import { isThemeName } from "@/types/theme";
import { isFontName } from "@/types/font";
import type {
  TerminalContextType,
  TerminalNotification,
} from "@/types/terminal-context";
import type { BackgroundSettings } from "@/types/customization";

const TerminalContext = createContext<TerminalContextType | null>(null);

/**
 * Default color palette used for the terminal background glitch effect.
 */
const DEFAULT_GLITCH_COLORS = ["#2b4539", "#61dca3", "#61b3dc"] as const;

/**
 * Default background settings for the terminal canvas animation.
 */
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

/**
 * Component props for the {@link TerminalProvider}.
 */
interface TerminalProviderProps {
  /** The child React components rendered inside the terminal context. */
  children: ReactNode;
  /** Optional callback invoked when the terminal theme changes. */
  onThemeChange?: (theme: string) => void;
  /** Optional callback invoked when the terminal typography font changes. */
  onFontChange?: (font: string) => void;
}

/**
 * Context provider component managing terminal emulator state, themes, fonts, i18n, accessibility, and background effects.
 *
 * @param props - Component props containing child components and optional change handlers.
 * @param props.children - The child React components rendered inside the terminal context.
 * @param props.onThemeChange - Optional callback invoked when the terminal theme changes.
 * @param props.onFontChange - Optional callback invoked when the terminal typography font changes.
 * @returns The rendered TerminalProvider wrapping child components with context.
 */
export function TerminalProvider({
  children,
  onThemeChange,
  onFontChange,
}: TerminalProviderProps): JSX.Element {
                                                                            
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
    isClearing,
    executeCommand,
    addToHistory,
    navigateHistory,
    clearHistory,
    getCommandSuggestions,
    getFrequentCommands,
    commandAnalytics,
  } = useTerminal(undefined, themePerformance);

                                                                            
  const [showWelcome, setShowWelcome] = useState(true);
  const [notification, setNotification] = useState<TerminalNotification | null>(
    null,
  );
  const [backgroundSettings, setBackgroundSettings] =
    useState<BackgroundSettings>(DEFAULT_BACKGROUND_SETTINGS);

                                                                            
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

                                                                            

                                                     
  useEffect(() => {
    if (history.length > 0) setShowWelcome(false);
  }, [history.length]);

                          
  useEffect(() => {
    announceMessage("Terminal portfolio loaded", "polite");
  }, [announceMessage]);

                                                           
  useEffect(() => {
    const customizationService = CustomizationService.getInstance();

    if (typeof customizationService.getBackgroundSettings === "function") {
      setBackgroundSettings(customizationService.getBackgroundSettings());
    }

    const handleBackgroundUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<BackgroundSettings>;
      if (customEvent.detail) {
        setBackgroundSettings(customEvent.detail);
      } else if (
        typeof customizationService.getBackgroundSettings === "function"
      ) {
        setBackgroundSettings(customizationService.getBackgroundSettings());
      }
    };

    window.addEventListener(
      "background-settings-updated",
      handleBackgroundUpdate,
    );
    return () =>
      window.removeEventListener(
        "background-settings-updated",
        handleBackgroundUpdate,
      );
  }, []);

                                                                            

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

     
                 
    
                                                                          
                                                                             
                                              
     
  const handleSubmit = useCallback(
    async (command: string): Promise<void> => {
      const output = await executeCommand(command);

      if (!output) {
        setCurrentInput("");
        return;
      }

                                                                            
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
                `Theme changed to "${themeName}"`,
                "Theme preference saved automatically.",
                "Theme applied instantly!",
              ].join("\n"),
              type: "success",
            });
          } else {
            const errorMsg =
              themeError ?? `Theme "${themeName}" may not exist or be invalid.`;
            showNotification(`Failed to change theme: ${errorMsg}`, "error");
            addToHistory(command, {
              ...output,
              content: [
                `Failed to change theme to "${themeName}"`,
                `Error: ${errorMsg}`,
                "Use 'theme -l' to list available themes.",
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
              `Font changed to "${fontName}"`,
              "",
              `Applied ${fontConfig?.name ?? "Unknown"} typeface`,
              `Family: ${fontConfig?.family ?? "Unknown"}`,
              `${fontConfig?.ligatures ? "Font ligatures enabled for enhanced readability" : "Standard font rendering"}`,
              "Font preference saved automatically",
              "",
              "Use 'font -l' for a detailed list",
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

                                                                            
      addToHistory(command, output);
      setCurrentInput("");
    },
    [
      addToHistory,
      announceMessage,
      changeFont,
      changeTheme,
      executeCommand,
      fontConfig?.family,
      fontConfig?.ligatures,
      fontConfig?.name,
      onFontChange,
      onThemeChange,
      setCurrentInput,
      showNotification,
      themeError,
    ],
  );

  const handleWelcomeCommandSelect = useCallback(
    (command: string) => {
      handleSubmit(command);
    },
    [handleSubmit],
  );

                                                                            

  const contextValue = useMemo<TerminalContextType>(
    () => ({
                      
      history,
      currentInput,
      setCurrentInput,
      isProcessing,
      isClearing,
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

                   
      backgroundSettings,
      setBackgroundSettings,

                 
      showWelcome,
      setShowWelcome,
      notification,
      showNotification,
      clearNotification,

                            
      handleSubmit,

      handleWelcomeCommandSelect,

             
      commandInputRef,
      terminalRef,
      bottomRef,
    }),
    [
      history,
      currentInput,
      setCurrentInput,
      isProcessing,
      isClearing,
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

      backgroundSettings,
      showWelcome,
      notification,
      showNotification,
      clearNotification,
      handleSubmit,

      handleWelcomeCommandSelect,
    ],
  );

  return (
    <TerminalContext.Provider value={contextValue}>
      {children}
    </TerminalContext.Provider>
  );
}

/**
 * Custom React hook to access terminal emulator context state and actions.
 *
 * @returns The current {@link TerminalContextType} object.
 * @throws Throws an error if invoked outside of a `<TerminalProvider>` component tree.
 *
 * @example
 * ```tsx
 * const { history, executeCommand, currentInput, setCurrentInput } = useTerminalContext();
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
