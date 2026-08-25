"use client";

import { JSX, useState, useEffect } from "react";
import type { ThemeName, ThemeConfig } from "@/types/theme";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";

/**
 * Properties for the LazyThemeLoader component.
 *
 * @interface LazyThemeLoaderProps
 * @property {ThemeName} themeName - Identifier of the theme configuration to dynamically load.
 * @property {(themeConfig: ThemeConfig) => React.ReactNode} children - Render prop function invoked with the resolved theme configuration once loaded.
 */
interface LazyThemeLoaderProps {
  themeName: ThemeName;
  children: (themeConfig: ThemeConfig) => React.ReactNode;
}

/**
 * Asynchronously loads a terminal theme configuration bundle on demand.
 *
 * Displays an interactive terminal loading animation while dynamically importing the theme module,
 * preventing heavy theme stylesheets/configurations from blocking initial bundle evaluation.
 *
 * @param {LazyThemeLoaderProps} props - The component properties.
 * @param {ThemeName} props.themeName - Name of the target theme to asynchronously fetch.
 * @param {(themeConfig: ThemeConfig) => React.ReactNode} props.children - Render prop receiving the resolved ThemeConfig.
 * @returns {JSX.Element} The rendered fallback loading progress screen or resolved children output.
 */
export function LazyThemeLoader({
  themeName,
  children,
}: LazyThemeLoaderProps): JSX.Element {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    import("@/lib/themes/theme-config")
      .then((module) => {
        if (!cancelled) {
          setThemeConfig(module.themes[themeName]);
          setIsLoading(false);
        }
        return;
      })
      .catch((error) => {
        console.error("Failed to load theme config:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [themeName]);

  if (isLoading || !themeConfig) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
        }}
      >
        <div className="w-full max-w-md p-6">
          <TerminalLoadingProgress
            duration={2000}
            completionText="Theme loaded successfully!"
            autoStart={true}
          />
        </div>
      </div>
    );
  }

  return <>{children(themeConfig)}</>;
}
