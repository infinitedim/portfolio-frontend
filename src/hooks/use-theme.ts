"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ThemeConfig, ThemeName, ThemeColors } from "../types/theme";
import {
  themes,
  defaultTheme,
  getSortedThemeNames,
  validateTheme,
} from "@/lib/themes/theme-config";
import {
  safeDOMManipulation,
  useLocalStorage,
  useMountRef,
} from "./hooks-utils";
import { PerformanceMonitor } from "@/lib/performance/performance-monitor";

/**
 * Local storage key used to persist the active terminal theme.
 */
const STORAGE_KEY = "terminal-theme" as const;

/**
 * Array of mandatory color token keys that every valid theme configuration must define.
 */
const REQUIRED_COLORS = ["bg", "text", "accent", "muted", "border"] as const;

/**
 * Internal state representation for the theme hook.
 *
 * @interface ThemeState
 * @property {ThemeName} theme - Currently active theme identifier.
 * @property {string | null} error - Error message if a theme operation failed, otherwise null.
 * @property {boolean} mounted - Flag indicating whether the component has mounted on the client.
 */
interface ThemeState {
  theme: ThemeName;
  error: string | null;
  mounted: boolean;
}

/**
 * Return type and API interface exposed by the `useTheme` hook.
 *
 * @interface UseThemeReturn
 * @property {ThemeName} theme - The currently active theme identifier.
 * @property {ThemeConfig} themeConfig - The complete configuration object for the active theme.
 * @property {string | null} error - The current error message, if any.
 * @property {boolean} hasError - Boolean flag indicating if there is an active error.
 * @property {boolean} mounted - Indicates whether the hook has completed client-side hydration.
 * @property {(newTheme: ThemeName) => boolean} changeTheme - Function to switch the active theme.
 * @property {() => void} clearError - Function to clear the current error state.
 * @property {ThemeName[]} availableThemes - Sorted list of all registered theme names.
 * @property {(themeName?: ThemeName) => ThemeConfig} getThemeInfo - Retrieves configuration for a given theme or current theme.
 * @property {(themeName: ThemeName) => boolean} isThemeActive - Checks if the specified theme is currently active.
 * @property {typeof validateTheme} validateTheme - Validation utility function for theme names.
 * @property {object} themeMetrics - Runtime performance and usage metrics for theme switching.
 * @property {number} themeMetrics.switchCount - Total number of theme switches performed.
 * @property {number} themeMetrics.averageSwitchTime - Average time taken in milliseconds for theme switches.
 * @property {number} themeMetrics.lastSwitchTime - Duration of the most recent theme switch in milliseconds.
 * @property {Array<{ theme: ThemeName; count: number }>} themeMetrics.popularThemes - Top theme usage counts.
 * @property {number} themeMetrics.renderTime - Render application time in milliseconds for the last theme change.
 * @property {() => object} getPerformanceReport - Computes and returns an aggregate performance summary.
 * @property {() => void} resetPerformanceMetrics - Resets all collected performance metrics.
 */
interface UseThemeReturn {
  theme: ThemeName;
  themeConfig: ThemeConfig;
  error: string | null;
  hasError: boolean;
  mounted: boolean;
  changeTheme: (newTheme: ThemeName) => boolean;
  clearError: () => void;
  availableThemes: ThemeName[];
  getThemeInfo: (themeName?: ThemeName) => ThemeConfig;
  isThemeActive: (themeName: ThemeName) => boolean;
  validateTheme: typeof validateTheme;
  themeMetrics: {
    switchCount: number;
    averageSwitchTime: number;
    lastSwitchTime: number;
    popularThemes: { theme: ThemeName; count: number }[];
    renderTime: number;
  };
  getPerformanceReport: () => {
    totalSwitches: number;
    averageTime: number;
    fastestSwitch: number;
    slowestSwitch: number;
    themeUsage: Record<ThemeName, number>;
  };
  resetPerformanceMetrics: () => void;
}

/**
 * Converts a 6-character hexadecimal color string into HSL space representation formatted as `"H S% L%"`.
 *
 * @param {string} hex - The hexadecimal color code (e.g., "#1e1e2e").
 * @returns {string} The formatted HSL string (e.g., "240 21% 15%"), or "0 0% 0%" for invalid input.
 */
const hexToHsl = (hex: string): string => {
  if (!hex?.match(/^#[0-9A-Fa-f]{6}$/)) return "0 0% 0%";

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Validates that a theme configuration object has all required color definitions in valid hex format.
 *
 * @param {ThemeConfig} config - The theme configuration object to validate.
 * @returns {boolean} True if the theme configuration meets all color requirements; false otherwise.
 */
const isValidThemeConfig = (config: ThemeConfig): boolean => {
  if (!config?.colors) return false;
  return REQUIRED_COLORS.every(
    (color) =>
      typeof config.colors[color] === "string" &&
      config.colors[color].startsWith("#"),
  );
};

/**
 * Generates a complete mapping of CSS custom properties (variables) from theme colors.
 * Maps terminal colors, content colors, and Tailwind/shadcn-compatible HSL variables.
 *
 * @param {ThemeColors} colors - The palette of theme colors.
 * @returns {Record<string, string>} A key-value dictionary of CSS variable names to their values.
 */
const generateCSSVariables = (colors: ThemeColors) => ({
  "--terminal-bg": colors.bg,
  "--terminal-text": colors.text,
  "--terminal-accent": colors.accent,
  "--terminal-muted": colors.muted,
  "--terminal-border": colors.border,
  "--terminal-success": colors.success || colors.accent,
  "--terminal-error": colors.error || "#ff4444",
  "--terminal-warning": colors.warning || "#ffaa00",
  "--terminal-info": colors.info || "#00aaff",
  "--terminal-prompt": colors.prompt || colors.accent,

  "--content-bg": `color-mix(in oklab, ${colors.bg} 92%, #1a1a2e)`,
  "--content-text": `color-mix(in oklab, ${colors.text} 45%, #d4d4d4)`,
  "--content-accent": colors.accent,
  "--content-muted": `color-mix(in oklab, ${colors.muted} 65%, #9ca3af)`,
  "--content-border": `color-mix(in oklab, ${colors.border} 25%, #374151)`,

  "--background": hexToHsl(colors.bg),
  "--foreground": hexToHsl(colors.text),
  "--primary": hexToHsl(colors.accent),
  "--primary-foreground": hexToHsl(colors.bg),
  "--muted": hexToHsl(colors.muted),
  "--muted-foreground": hexToHsl(colors.text),
  "--border": hexToHsl(colors.border),
  "--input": hexToHsl(colors.border),
  "--ring": hexToHsl(colors.accent),
  "--secondary": hexToHsl(colors.muted),
  "--secondary-foreground": hexToHsl(colors.text),
  "--accent": hexToHsl(colors.accent),
  "--accent-foreground": hexToHsl(colors.bg),
  "--destructive": hexToHsl(colors.error || "#ef4444"),
  "--destructive-foreground": hexToHsl(colors.bg),
  "--card": hexToHsl(colors.bg),
  "--card-foreground": hexToHsl(colors.text),
  "--popover": hexToHsl(colors.bg),
  "--popover-foreground": hexToHsl(colors.text),
});

/**
 * Custom React hook for managing application terminal and global UI themes.
 * Provides theme persistence via localStorage, CSS variable injection into DOM,
 * cross-tab/window event synchronization, and theme switching performance monitoring.
 *
 * @returns {UseThemeReturn} An object containing the current theme, config, handlers, and performance metrics.
 *
 * @example
 * ```tsx
 * const { theme, changeTheme, availableThemes } = useTheme();
 * changeTheme('matrix');
 * ```
 */
export function useTheme(): UseThemeReturn {
  const isMountedRef = useMountRef();
  const { getValue, setValue } = useLocalStorage(STORAGE_KEY, defaultTheme);

  const appliedThemeRef = useRef<ThemeName | null>(null);

  const performanceMonitor = useMemo(
    () => PerformanceMonitor.getInstance(),
    [],
  );
  const switchTimesRef = useRef<number[]>([]);
  const themeUsageRef = useRef<Map<ThemeName, number>>(new Map());
  const [themeMetrics, setThemeMetrics] = useState({
    switchCount: 0,
    averageSwitchTime: 0,
    lastSwitchTime: 0,
    popularThemes: [] as { theme: ThemeName; count: number }[],
    renderTime: 0,
  });

  const [state, setState] = useState<ThemeState>({
    theme: defaultTheme,
    error: null,
    mounted: false,
  });

  const themeConfig = useMemo(() => {
    const config = themes[state.theme];
    return config && isValidThemeConfig(config) ? config : themes[defaultTheme];
  }, [state.theme]);

  const availableThemes = useMemo(() => getSortedThemeNames(), []);

  const applyTheme = useCallback(
    (config: ThemeConfig, themeName: ThemeName) => {
      if (!isMountedRef.current || !isValidThemeConfig(config)) {
        return;
      }

      if (appliedThemeRef.current === themeName) {
        return;
      }

      const startTime = performance.now();
      performanceMonitor.startTiming("theme-application", "theme");

      try {
        const root = document.documentElement;
        const body = document.body;

        if (!root || !body) {
          throw new Error("DOM elements not available");
        }

        safeDOMManipulation(() => {
          const themeClasses = body.className
            .split(" ")
            .filter((cls) => !cls.startsWith("theme-"));
          themeClasses.push(`theme-${themeName}`);
          body.className = themeClasses.join(" ");

          const cssVars = generateCSSVariables(config.colors);
          Object.entries(cssVars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
          });

          appliedThemeRef.current = themeName;
        });

        setTimeout(() => {
          const renderTime = performanceMonitor.endTiming(
            "theme-application",
            "theme",
            { theme: themeName },
          );

          if (isMountedRef.current) {
            setThemeMetrics((prev) => ({
              ...prev,
              renderTime,
              lastSwitchTime: renderTime,
            }));
          }
        }, 0);
      } catch (error) {
        console.warn("Failed to apply theme:", error);
        performanceMonitor.recordMetric(
          "theme-application-error",
          performance.now() - startTime,
          "theme",
          { error: String(error), theme: themeName },
        );

        performanceMonitor.endTiming("theme-application", "theme");
        if (isMountedRef.current) {
          setState((prev) => ({ ...prev, error: "Failed to apply theme" }));
        }
      }
    },
    [isMountedRef, performanceMonitor],
  );

  const changeTheme = useCallback(
    (newTheme: ThemeName): boolean => {
      if (!isMountedRef.current) return false;

      if (
        !validateTheme(newTheme) ||
        !themes[newTheme] ||
        !isValidThemeConfig(themes[newTheme])
      ) {
        setState((prev) => ({ ...prev, error: `Invalid theme: ${newTheme}` }));
        return false;
      }

      if (state.theme === newTheme) return true;

      performanceMonitor.startTiming("theme-switch", "theme");

      const currentCount = themeUsageRef.current.get(newTheme) || 0;
      themeUsageRef.current.set(newTheme, currentCount + 1);

      setState((prev) => ({ ...prev, theme: newTheme, error: null }));

      if (!setValue(newTheme)) {
        console.warn("Failed to save theme to localStorage");
      }

      const switchTime = performanceMonitor.endTiming("theme-switch", "theme", {
        fromTheme: state.theme,
        toTheme: newTheme,
      });

      switchTimesRef.current.push(switchTime);
      if (switchTimesRef.current.length > 100) {
        switchTimesRef.current = switchTimesRef.current.slice(-100);
      }

      const averageTime =
        switchTimesRef.current.reduce((sum, time) => sum + time, 0) /
        switchTimesRef.current.length;

      const themeEntries = Array.from(themeUsageRef.current.entries()).map(
        ([theme, count]) => ({ theme, count }),
      );
      themeEntries.sort((a, b) => b.count - a.count);

      setThemeMetrics((prev) => ({
        ...prev,
        switchCount: prev.switchCount + 1,
        averageSwitchTime: averageTime,
        lastSwitchTime: switchTime,
        popularThemes: themeEntries.slice(0, 5),
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("theme-change", { detail: newTheme }),
        );
      }

      return true;
    },
    [
      isMountedRef,
      state.theme,
      setValue,
      performanceMonitor,
      themeUsageRef,
      switchTimesRef,
      setThemeMetrics,
    ],
  );

  const getValueRef = useRef(getValue);
  useEffect(() => {
    getValueRef.current = getValue;
  }, [getValue]);

  useEffect(() => {
    try {
      appliedThemeRef.current = null;
      setState((prev) => ({ ...prev, mounted: true }));

      const savedTheme = getValueRef.current();
      if (savedTheme && validateTheme(savedTheme) && themes[savedTheme]) {
        setState((prev) => ({ ...prev, theme: savedTheme as ThemeName }));
      }
    } catch (error) {
      console.warn("Error initializing theme:", error);
      setState((prev) => ({ ...prev, mounted: true, theme: defaultTheme }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeName>;
      const newTheme = customEvent.detail;
      if (
        newTheme &&
        validateTheme(newTheme) &&
        themes[newTheme] &&
        isMountedRef.current
      ) {
        setState((prev) => {
          if (prev.theme === newTheme) return prev;
          return { ...prev, theme: newTheme, error: null };
        });
      }
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, [isMountedRef]);

  useEffect(() => {
    try {
      if (state.mounted && isMountedRef.current) {
        applyTheme(themeConfig, state.theme);
      }
    } catch (error) {
      console.warn("Error applying theme:", error);
    }
  }, [state.mounted, state.theme, themeConfig, applyTheme, isMountedRef]);

  const getThemeInfo = useCallback(
    (themeName?: ThemeName): ThemeConfig => {
      const targetTheme = themeName || state.theme;
      const config = themes[targetTheme];
      return config && isValidThemeConfig(config)
        ? config
        : themes[defaultTheme];
    },
    [state.theme],
  );

  const isThemeActive = useCallback(
    (themeName: ThemeName): boolean => state.theme === themeName,
    [state.theme],
  );

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, error: null }));
    }
  }, [isMountedRef]);

  const getPerformanceReport = useCallback(() => {
    const times = switchTimesRef.current;
    const usage = Array.from(themeUsageRef.current.entries()).reduce(
      (acc, [theme, count]) => {
        acc[theme] = count;
        return acc;
      },
      {} as Record<ThemeName, number>,
    );

    return {
      totalSwitches: times.length,
      averageTime:
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      fastestSwitch: times.length > 0 ? Math.min(...times) : 0,
      slowestSwitch: times.length > 0 ? Math.max(...times) : 0,
      themeUsage: usage,
    };
  }, []);

  const resetPerformanceMetrics = useCallback(() => {
    switchTimesRef.current = [];
    themeUsageRef.current.clear();
    setThemeMetrics({
      switchCount: 0,
      averageSwitchTime: 0,
      lastSwitchTime: 0,
      popularThemes: [],
      renderTime: 0,
    });
  }, []);

  return useMemo(
    () => ({
      theme: state.theme,
      themeConfig,
      error: state.error,
      hasError: !!state.error,
      mounted: state.mounted,
      changeTheme,
      clearError,
      availableThemes,
      getThemeInfo,
      isThemeActive,
      validateTheme,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,
    }),
    [
      state.theme,
      state.error,
      state.mounted,
      themeConfig,
      changeTheme,
      clearError,
      availableThemes,
      getThemeInfo,
      isThemeActive,
      themeMetrics,
      getPerformanceReport,
      resetPerformanceMetrics,
    ],
  );
}
