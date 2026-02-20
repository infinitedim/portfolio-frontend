"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from "next-themes";

export function useThemeContext() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme: theme || "system",
    setTheme,
    resolvedTheme,
  };
}

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      {...props}
      storageKey="terminal-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
