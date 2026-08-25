import { themes, getSortedThemeNames } from "@/lib/themes/theme-config";
import type { ThemeName, ThemeRegistry } from "@/types/theme";

/**
 * Configuration options for rendering terminal theme listings and previews.
 */
export interface ThemeDisplayOptions {
  /** Whether to display the active theme indicator header. */
  showCurrent?: boolean;
  /** Name of the currently active theme. */
  currentTheme?: ThemeName;
  /** Whether to render a single-line compact list instead of a full grid. */
  compact?: boolean;
  /** Whether to output ANSI or text color values in the listing. */
  showColors?: boolean;
  /** Number of grid columns for multi-column output layout. */
  columns?: number;
}

/**
 * Utility class providing formatted text-based output generators for terminal themes.
 */
export class ThemeDisplay {
  /**
   * Generates a formatted ASCII table or list string displaying available terminal themes.
   *
   * @param options - Display configuration options including layout and active theme highlight.
   * @returns Formatted theme listing string.
   */
  static generateList(options: ThemeDisplayOptions = {}): string {
    const {
      showCurrent = true,
      currentTheme,
      compact = false,
      showColors = true,
      columns: rawColumns = 2,
    } = options;

    const columns = Math.max(1, rawColumns);

    const sortedThemes = getSortedThemeNames();
    const lines: string[] = [];

    if (!compact) {
      lines.push("Available Terminal Themes");
      lines.push("═".repeat(50));
      lines.push("");
    }

    if (showCurrent && currentTheme) {
      const currentConfig = themes[currentTheme];
      lines.push(`Current Theme: ${currentConfig.name} (${currentTheme})`);
      if (showColors) {
        lines.push(
          `   Colors: bg:${currentConfig.colors.bg} text:${currentConfig.colors.text} accent:${currentConfig.colors.accent}`,
        );
      }
      lines.push("");
    }

    if (compact) {
      const themeList = sortedThemes
        .map((theme) => (currentTheme === theme ? `[${theme}]` : theme))
        .join(", ");
      lines.push(`Themes: ${themeList}`);
    } else {
      lines.push("Theme List:");
      lines.push("");

      const themeGroups: string[][] = [];
      for (let i = 0; i < sortedThemes.length; i += columns) {
        themeGroups.push(sortedThemes.slice(i, i + columns));
      }

      themeGroups.forEach((group) => {
        const row = group
          .map((theme) => {
            const config = (themes as ThemeRegistry)[theme as ThemeName];
            if (!config) return null;
            const isCurrent = currentTheme === theme;
            const indicator = isCurrent ? "► " : "  ";
            const name = theme.padEnd(12);
            const displayName = config.name.padEnd(20);

            if (showColors) {
              return `${indicator}${name} - ${displayName} ${isCurrent ? "🟢" : ""}`;
            } else {
              return `${indicator}${name} - ${displayName} ${isCurrent ? "(current)" : ""}`;
            }
          })
          .filter(Boolean)
          .join("  ");

        lines.push(row);
      });

      lines.push("");
      lines.push(`Total: ${sortedThemes.length} themes available`);
    }

    return lines.join("\n");
  }

  /**
   * Generates a detailed color preview block showing hex color assignments for a specific theme.
   *
   * @param themeName - Identifier of the theme to preview.
   * @returns Formatted color preview string or empty string if theme not found.
   */
  static generateColorPreview(themeName: ThemeName): string {
    const config = themes[themeName];
    if (!config) return "";

    const lines = [
      `${config.name} Color Preview`,
      "─".repeat(30),
      "",
      `Background:  ${config.colors.bg}`,
      `Text:        ${config.colors.text}`,
      `Prompt:      ${config.colors.prompt}`,
      `Success:     ${config.colors.success}`,
      `Error:       ${config.colors.error}`,
      `Accent:      ${config.colors.accent}`,
      `Border:      ${config.colors.border}`,
      "",
      "Usage: theme " + themeName,
    ];

    return lines.join("\n");
  }

  /**
   * Generates a side-by-side comparison table between specified theme names.
   *
   * @param themeNames - Array of theme names to compare.
   * @returns Formatted comparison table string.
   */
  static generateThemeComparison(themeNames: ThemeName[]): string {
    if (themeNames.length === 0) return "No themes to compare";

    const lines = ["Theme Comparison", "═".repeat(50), ""];

    const maxNameLength = Math.max(...themeNames.map((t) => t.length));

    themeNames.forEach((themeName) => {
      const config = (themes as ThemeRegistry)[themeName];
      if (!config) return;

      lines.push(`${themeName.padEnd(maxNameLength)} | ${config.name}`);
    });

    return lines.join("\n");
  }
}
