/**
 * Utility class providing string distance metrics, fuzzy matching, and typo tolerance for terminal commands.
 *
 * @class TypoTolerance
 */
export class TypoTolerance {
  /**
   * Calculates the Levenshtein edit distance between two strings using dynamic programming.
   *
   * @param a - The first input string.
   * @param b - The second input string.
   * @returns The minimum number of single-character edits (insertions, deletions, or substitutions).
   * @example
   * ```ts
   * TypoTolerance.levenshteinDistance("theem", "theme"); // 1
   * ```
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Finds the closest matching command from an array of candidates within a given edit distance threshold.
   *
   * @param input - The mistyped user input string.
   * @param availableCommands - List of valid command names and aliases.
   * @param threshold - Maximum allowable Levenshtein distance for a match.
   * @returns The closest command candidate or null if none within the threshold.
   * @example
   * ```ts
   * TypoTolerance.findSimilarCommand("hlelp", ["help", "clear", "theme"]); // "help"
   * ```
   */
  static findSimilarCommand(
    input: string,
    availableCommands: string[],
    threshold = 2,
  ): string | null {
    let bestMatch: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const command of availableCommands) {
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        command.toLowerCase(),
      );
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = command;
      }
    }

    return bestMatch;
  }

  /**
   * Returns a list of candidate commands ranked by fuzzy string similarity to the input.
   *
   * @param input - The input query to match against.
   * @param commands - Array of candidate command strings.
   * @returns Filtered and sorted array of matching commands in order of ascending edit distance.
   */
  static fuzzyMatch(input: string, commands: string[]): string[] {
    const matches = commands.filter((command) => {
      const distance = this.levenshteinDistance(
        input.toLowerCase(),
        command.toLowerCase(),
      );
      return distance <= Math.max(1, Math.floor(command.length * 0.3));
    });

    return matches.sort((a, b) => {
      const distanceA = this.levenshteinDistance(
        input.toLowerCase(),
        a.toLowerCase(),
      );
      const distanceB = this.levenshteinDistance(
        input.toLowerCase(),
        b.toLowerCase(),
      );
      return distanceA - distanceB;
    });
  }

  /**
   * Computes a relevance score from 0 to 100 indicating how closely a candidate command matches user input.
   * Exact matches yield 100, prefix matches yield 80-95, substring matches yield 30-60, and typo distance yields 10-50.
   *
   * @param input - User query string.
   * @param command - Target command string.
   * @returns Numeric relevance score between 0 (no match) and 100 (exact match).
   */
  static getSuggestionScore(input: string, command: string): number {
    const lowerInput = input.toLowerCase();
    const lowerCommand = command.toLowerCase();

    if (lowerCommand === lowerInput) {
      return 100;
    }

    if (lowerCommand.startsWith(lowerInput)) {
      return 80 + (lowerInput.length / lowerCommand.length) * 15;
    }

    if (lowerCommand.includes(lowerInput)) {
      const position = lowerCommand.indexOf(lowerInput);
      return Math.max(
        60 - position * 2 + (lowerInput.length / lowerCommand.length) * 10,
        30,
      );
    }

    const distance = this.levenshteinDistance(lowerInput, lowerCommand);
    const maxDistance = Math.max(2, Math.floor(lowerCommand.length * 0.4));

    if (distance <= maxDistance) {
      return Math.max(50 - distance * 8, 10);
    }

    return 0;
  }

  /**
   * Classifies the match relationship category between the user's input and a candidate command.
   *
   * @param input - User query string.
   * @param command - Target candidate command name.
   * @returns The categorized match type.
   */
  static getSuggestionType(
    input: string,
    command: string,
  ): "exact" | "prefix" | "fuzzy" | "typo" {
    const lowerInput = input.toLowerCase();
    const lowerCommand = command.toLowerCase();

    if (lowerCommand === lowerInput) {
      return "exact";
    }

    if (lowerCommand.startsWith(lowerInput)) {
      return "prefix";
    }

    if (lowerCommand.includes(lowerInput)) {
      return "fuzzy";
    }

    return "typo";
  }
}

