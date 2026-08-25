"use client";

import { AnimatedButton } from "@/components/atoms/shared/button";
import { useTheme } from "@/hooks/use-theme";
import { isThemeName } from "@/types/theme";
import type { JSX } from "react";

/**
 * Renders an interactive theme switcher component displaying buttons for all available themes.
 * Allows users to toggle active themes with visual indication for current selection.
 *
 * @returns {JSX.Element} The rendered theme switcher interface with theme selection buttons.
 */
export function ThemeSwitcher(): JSX.Element {
  const { theme, changeTheme, availableThemes } = useTheme();

  /**
   * Handles theme switching with validation against known theme identifiers.
   *
   * @param {string} newTheme - The target theme name to apply.
   */
  const handleThemeChange = (newTheme: string) => {
    try {
      if (isThemeName(newTheme)) {
        changeTheme(newTheme);
      }
    } catch (error) {
      console.warn("Error changing theme:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {availableThemes.map((themeName) => (
          <AnimatedButton
            key={themeName}
            variant={theme === themeName ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleThemeChange(themeName)}
            className={theme === themeName ? "opacity-100" : "opacity-70"}
          >
            {themeName}
          </AnimatedButton>
        ))}
      </div>
    </div>
  );
}
