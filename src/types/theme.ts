/**
 * Supported color theme identifier slugs for terminal and UI skinning.
 */
export type ThemeName =
  | "default"
  | "matrix"
  | "cyberpunk"
  | "dracula"
  | "monokai"
  | "solarized"
  | "gruvbox"
  | "nord"
  | "tokyo"
  | "onedark"
  | "catppuccin"
  | "synthwave"
  | "vscode"
  | "github"
  | "terminal"
  | "hacker"
  | "neon"
  | "retro"
  | "minimal"
  | "ocean"
  | "forest";

/**
 * Immutable list of supported theme identifier slugs.
 */
export const THEME_NAMES: readonly ThemeName[] = [
  "default",
  "matrix",
  "cyberpunk",
  "dracula",
  "monokai",
  "solarized",
  "gruvbox",
  "nord",
  "tokyo",
  "onedark",
  "catppuccin",
  "synthwave",
  "vscode",
  "github",
  "terminal",
  "hacker",
  "neon",
  "retro",
  "minimal",
  "ocean",
  "forest",
] as const;

/**
 * Type guard validating whether an arbitrary string matches a supported `ThemeName`.
 *
 * @param value - The input string candidate to test against valid theme names.
 * @returns `true` if the input is a valid `ThemeName`, otherwise `false`.
 */
export function isThemeName(value: string): value is ThemeName {
  return THEME_NAMES.includes(value as ThemeName);
}

/**
 * Color palette definition comprising required core colors and optional diagnostic/status accents.
 */
export interface ThemeColors {
  /** Background color hex or CSS value. */
  bg: string;
  /** Primary text color hex or CSS value. */
  text: string;
  /** Accent highlight color hex or CSS value. */
  accent: string;
  /** Muted/secondary text or background color hex or CSS value. */
  muted: string;
  /** Border stroke color hex or CSS value. */
  border: string;
  /** Success status color hex or CSS value. */
  success?: string;
  /** Error status color hex or CSS value. */
  error?: string;
  /** Warning status color hex or CSS value. */
  warning?: string;
  /** Informational status color hex or CSS value. */
  info?: string;
  /** Terminal prompt symbol color hex or CSS value. */
  prompt?: string;
}

/**
 * Complete theme configuration including palette colors, metadata, and attribution.
 */
export interface ThemeConfig {
  /** Display name of the theme. */
  name: string;
  /** Palette color tokens for the theme. */
  colors: ThemeColors;
  /** Brief description or visual theme summary. */
  description?: string;
  /** Author or creator attribution. */
  author?: string;
}

/**
 * Dictionary mapping every registered `ThemeName` to its corresponding `ThemeConfig`.
 */
export type ThemeRegistry = Record<ThemeName, ThemeConfig>;

/**
 * State tracking object representing dynamic theme switching status and error state.
 */
export interface ThemeApplicationStatus {
  /** Whether a theme transition or application is currently in progress. */
  isApplying: boolean;
  /** The theme name most recently applied, or null if none applied yet. */
  lastApplied: ThemeName | null;
  /** Error message string if theme application failed, or null if successful. */
  error: string | null;
}

