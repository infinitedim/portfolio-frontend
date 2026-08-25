/**
 * Configuration options for rendering monospace typography in the terminal and editor interfaces.
 */
export interface FontConfig {
  /** Display label or identifier for the font configuration. */
  name: string;
  /** CSS font family definition string. */
  family: string;
  /** Whether font ligatures are enabled for programming symbols. */
  ligatures: boolean;
  /** CSS font weight value or numeric string. */
  weight: string;
}

/**
 * Supported monospace font identifier slugs.
 */
export type FontName =
  | "jetbrains-mono"
  | "fira-code"
  | "source-code-pro"
  | "inconsolata"
  | "ubuntu-mono"
  | "roboto-mono";

/**
 * Immutable list of supported monospace font identifier slugs.
 */
export const FONT_NAMES: readonly FontName[] = [
  "jetbrains-mono",
  "fira-code",
  "source-code-pro",
  "inconsolata",
  "ubuntu-mono",
  "roboto-mono",
] as const;

/**
 * Type guard validating whether an arbitrary string matches a supported `FontName`.
 *
 * @param value - The input string candidate to test against valid font names.
 * @returns `true` if the input is a valid `FontName`, otherwise `false`.
 */
export function isFontName(value: string): value is FontName {
  return FONT_NAMES.includes(value as FontName);
}

