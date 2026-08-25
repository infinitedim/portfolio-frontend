/**
 * Static mapping of canonical branch names to designated hex color codes.
 */
const BRANCH_COLOR_MAP: Record<string, string> = {
  main: "#34d399",
  master: "#34d399",
  develop: "#22d3ee",
  dev: "#22d3ee",
  staging: "#a78bfa",
  release: "#a78bfa",
};

/**
 * Regular expression patterns matching conventional branch prefixes to theme hex colors.
 */
const PATTERN_COLORS: [RegExp, string][] = [
  [/^feature\//, "#fbbf24"],
  [/^feat\//, "#fbbf24"],
  [/^copilot\//, "#f472b6"],
  [/^hotfix\//, "#f87171"],
  [/^fix\//, "#f87171"],
  [/^bugfix\//, "#fb923c"],
  [/^release\//, "#a78bfa"],
  [/^chore\//, "#94a3b8"],
  [/^refactor\//, "#38bdf8"],
  [/^docs\//, "#a3e635"],
];

/**
 * Distinct color palette used as a deterministic hash fallback for custom branch names.
 */
const FALLBACK_PALETTE = [
  "#f472b6",
  "#c084fc",
  "#60a5fa",
  "#2dd4bf",
  "#facc15",
  "#fb7185",
  "#4ade80",
  "#818cf8",
];

/**
 * Computes a non-cryptographic 32-bit integer hash code from a string.
 * @param str - Input string to hash.
 * @returns Non-negative 32-bit integer hash code.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Determines the visual representation color for a Git branch name using exact matching, pattern matching, or deterministic hashing.
 * @param branchName - Name of the git branch to resolve a color for.
 * @returns 6-digit hex color string.
 */
export function getBranchColor(branchName: string): string {
  const exact = BRANCH_COLOR_MAP[branchName.toLowerCase()];
  if (exact) return exact;

  for (const [pattern, color] of PATTERN_COLORS) {
    if (pattern.test(branchName)) return color;
  }

  const index = hashString(branchName) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

/**
 * Generates a semi-transparent dimmed color variant (25% opacity) for background rails or inactive branch tracks.
 * @param branchName - Name of the git branch.
 * @returns 8-digit hex color string with 40 alpha channel.
 */
export function getBranchColorDimmed(branchName: string): string {
  return `${getBranchColor(branchName)}40`;
}

/**
 * Generates a glowing color variant (50% opacity) for active branch highlights or SVG drop-shadow filters.
 * @param branchName - Name of the git branch.
 * @returns 8-digit hex color string with 80 alpha channel.
 */
export function getBranchColorGlow(branchName: string): string {
  return `${getBranchColor(branchName)}80`;
}
