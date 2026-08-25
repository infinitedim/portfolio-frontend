/**
 * Structured result produced after parsing command-line input strings or argument arrays.
 */
export interface ParsedArgs {
  /** The primary command name or binary invocation. */
  command: string;
  /** Optional secondary command or subcommand identifier. */
  subcommand?: string;
  /** List of parsed single-character short flags (e.g. ['v', 'f'] from '-vf'). */
  flags: string[];
  /** List of parsed long flags without leading hyphens (e.g. ['verbose', 'force'] from '--verbose --force'). */
  longFlags: string[];
  /** List of non-flag positional argument strings. */
  positional: string[];
}

/**
 * Command-line argument parser utility providing parsing for subcommands,
 * combined short flags, long flags, and positional arguments.
 */
export class ArgumentParser {
  /**
   * Parses an array of raw argument tokens (e.g. process.argv slices).
   *
   * @param args - Array of raw command-line argument strings.
   * @returns Structured ParsedArgs object containing parsed flags, subcommands, and positional arguments.
   */
  static parseArgv(args: string[]): ParsedArgs {
    if (args.length === 0) {
      return {
        command: "",
        flags: [],
        longFlags: [],
        positional: [],
      };
    }
    return this.parse(`_ ${args.join(" ")}`.trim());
  }

  /**
   * Parses a single command-line input string into structured components.
   *
   * @param input - The raw command-line string (e.g. "git commit -am 'message'").
   * @returns Structured ParsedArgs object.
   */
  static parse(input: string): ParsedArgs {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || "";

    const flags: string[] = [];
    const longFlags: string[] = [];
    const positional: string[] = [];
    let subcommand: string | undefined;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith("--")) {
        longFlags.push(part.slice(2));
      } else if (part.startsWith("-") && part.length > 1) {
        const shortFlags = part.slice(1).split("");
        flags.push(...shortFlags);
      } else {
        if (!subcommand && i === 1) {
          subcommand = part;
        } else {
          positional.push(part);
        }
      }
    }

    return {
      command,
      subcommand,
      flags,
      longFlags,
      positional,
    };
  }

  /**
   * Checks whether a specific short or long flag was provided in the parsed arguments.
   *
   * @param args - The parsed arguments structure.
   * @param short - Short flag character to look for (e.g. 'h').
   * @param long - Optional long flag name to look for (e.g. 'help').
   * @returns True if either the short or long flag is present, otherwise false.
   */
  static hasFlag(args: ParsedArgs, short: string, long?: string): boolean {
    return (
      args.flags.includes(short) ||
      (long ? args.longFlags.includes(long) : false)
    );
  }

  /**
   * Checks whether any of the specified flag options are present in the parsed arguments.
   *
   * @param args - The parsed arguments structure.
   * @param options - Array of flag objects with short and optional long flag names.
   * @returns True if at least one matching flag option is present, otherwise false.
   */
  static hasFlagAny(
    args: ParsedArgs,
    options: Array<{ short: string; long?: string }>,
  ): boolean {
    return options.some((option) =>
      this.hasFlag(args, option.short, option.long),
    );
  }
}

