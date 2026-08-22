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

const TypedNextThemesProvider = NextThemesProvider as unknown as React.ComponentType<
  React.PropsWithChildren<ThemeProviderProps>
>;

export function ThemeProvider({
  children,
  ...props
}: React.PropsWithChildren<ThemeProviderProps>): React.JSX.Element {
  return (
    <TypedNextThemesProvider
      {...props}
      storageKey="terminal-theme"
    >
      {children}
    </TypedNextThemesProvider>
  );
}
