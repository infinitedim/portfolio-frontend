"use client";

import React, { JSX, useState, useEffect } from "react";
import type { ThemeName, ThemeConfig } from "@/types/theme";
import { TerminalLoadingProgress } from "@/components/molecules/terminal/terminal-loading-progress";

interface LazyThemeLoaderProps {
  themeName: ThemeName;
  children: (themeConfig: ThemeConfig) => React.ReactNode;
}

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
            completionText="🎨 Theme loaded successfully!"
            autoStart={true}
          />
        </div>
      </div>
    );
  }

  return <>{children(themeConfig)}</>;
}
