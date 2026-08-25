/**
 * @fileoverview Theme provider and hook wrapper around `next-themes` for terminal theme management.
 * @module components/organisms/shared/theme-provider
 */

"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Custom React hook providing access to the current theme state and theme switcher.
 *
 * @description
 * Wraps next-themes' `useTheme` hook to provide fallback system theme resolution and typed setter helpers.
 *
 * @returns {{ theme: string; setTheme: (theme: string) => void; resolvedTheme: string | undefined }} Object containing current theme name, setter function, and resolved system/active theme.
 */
export function useThemeContext() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme: theme || "system",
    setTheme,
    resolvedTheme,
  };
}

/**
 * Strongly typed reference to NextThemesProvider compatible with React 19 children prop conventions.
 */
const TypedNextThemesProvider = NextThemesProvider as unknown as React.ComponentType<
  React.PropsWithChildren<ThemeProviderProps>
>;

/**
 * ThemeProvider wrapper component that manages terminal theme persistence and system preference sync.
 *
 * @description
 * Sets the default localStorage persistence key to `"terminal-theme"` and wraps children within `next-themes` provider.
 *
 * @param {React.PropsWithChildren<ThemeProviderProps>} props - Provider configuration props and child elements.
 * @param {React.ReactNode} props.children - Child components to render inside the theme provider context.
 * @returns {React.JSX.Element} The NextThemesProvider element configured for the terminal application.
 */
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
