/**
 * Branch-to-color mapping for Git Graph visualization.
 *
 * Uses semantic colors for well-known branch patterns (main, develop, feature/*, etc.)
 * with a deterministic hash-based fallback for unknown branch names.
 */

/** Fixed colors for well-known branch names */
const BRANCH_COLOR_MAP: Record<string, string> = {
  main: "#34d399", // emerald-400
  master: "#34d399",
  develop: "#22d3ee", // cyan-400
  dev: "#22d3ee",
  staging: "#a78bfa", // violet-400
  release: "#a78bfa",
};

/** Pattern-based colors for branch name prefixes */
const PATTERN_COLORS: [RegExp, string][] = [
  [/^feature\//, "#fbbf24"], // amber-400
  [/^feat\//, "#fbbf24"],
  [/^copilot\//, "#f472b6"], // pink-400
  [/^hotfix\//, "#f87171"], // red-400
  [/^fix\//, "#f87171"],
  [/^bugfix\//, "#fb923c"], // orange-400
  [/^release\//, "#a78bfa"], // violet-400
  [/^chore\//, "#94a3b8"], // slate-400
  [/^refactor\//, "#38bdf8"], // sky-400
  [/^docs\//, "#a3e635"], // lime-400
];

/** Rotating palette for branches that don't match any pattern */
const FALLBACK_PALETTE = [
  "#f472b6", // pink-400
  "#c084fc", // purple-400
  "#60a5fa", // blue-400
  "#2dd4bf", // teal-400
  "#facc15", // yellow-400
  "#fb7185", // rose-400
  "#4ade80", // green-400
  "#818cf8", // indigo-400
];

/**
 * Simple deterministic hash for a string.
 * Produces a consistent numeric value for any given input.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color for a branch name.
 *
 * Priority:
 * 1. Exact match in BRANCH_COLOR_MAP
 * 2. Prefix match in PATTERN_COLORS
 * 3. Deterministic fallback from FALLBACK_PALETTE based on name hash
 */
export function getBranchColor(branchName: string): string {
  // 1. Exact match
  const exact = BRANCH_COLOR_MAP[branchName.toLowerCase()];
  if (exact) return exact;

  // 2. Pattern match
  for (const [pattern, color] of PATTERN_COLORS) {
    if (pattern.test(branchName)) return color;
  }

  // 3. Hash fallback
  const index = hashString(branchName) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

/**
 * Get a dimmed version of a branch color for inactive/background elements.
 * Appends alpha channel to hex color.
 */
export function getBranchColorDimmed(branchName: string): string {
  return `${getBranchColor(branchName)}40`; // 25% opacity
}

/**
 * Get a highlighted version of a branch color for hover states.
 * Returns the color with full opacity and a glow-friendly format.
 */
export function getBranchColorGlow(branchName: string): string {
  return `${getBranchColor(branchName)}80`; // 50% opacity for glow
}
