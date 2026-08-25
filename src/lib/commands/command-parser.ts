import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { TypoTolerance } from "./typo-tolerance";

/**
 * Supported chain operators separating consecutive command segments.
 * `;` executes the next command unconditionally.
 * `&&` executes the next command only if the prior command succeeded.
 */
type ChainOperator = ";" | "&&";

/**
 * Represents a discrete segment within a chained command string.
 *
 * @interface ParsedSegment
 * @property {string} command - The isolated single command or pipeline stage string.
 * @property {ChainOperator} [operator] - Optional chaining operator connecting this segment to the subsequent one.
 */
interface ParsedSegment {
  command: string;
  operator?: ChainOperator;
}

/**
 * Splits a full raw input string into sequential command segments delimited by chaining operators (`;` or `&&`).
 * Respects single and double quotation marks and escaped characters.
 *
 * @param {string} input - The raw command line input string.
 * @returns {ParsedSegment[]} An array of parsed command segments along with their trailing chain operators.
 * @example
 * ```ts
 * splitCommandChain('echo "hello world" && theme dracula; help');
 * ```
 */
export function splitCommandChain(input: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let i = 0;

  let pendingOperator: ChainOperator | undefined;

  const pushSegment = () => {
    const trimmed = current.trim();
    if (trimmed) {
      segments.push({ command: trimmed, operator: pendingOperator });
      pendingOperator = undefined;
    }
    current = "";
  };

  while (i < input.length) {
    const ch = input[i];

    if (quote) {
      current += ch;
      if (ch === quote && input[i - 1] !== "\\") {
        quote = null;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      i++;
      continue;
    }

    if (ch === ";" || (ch === "&" && input[i + 1] === "&")) {
      const operator: ChainOperator = ch === ";" ? ";" : "&&";
      pushSegment();
      pendingOperator = operator;
      i += operator === "&&" ? 2 : 1;
      continue;
    }

    current += ch;
    i++;
  }

  pushSegment();
  return segments;
}

/**
 * Splits a command string containing UNIX-like pipe operators (`|`) into individual execution stages.
 * Ignores pipe characters enclosed within quotes.
 *
 * @param {string} command - The command string to split on pipe operators.
 * @returns {string[]} An array of individual command stages.
 * @example
 * ```ts
 * splitPipeChain('tech-stack list | grep react');
 * ```
 */
export function splitPipeChain(command: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];

    if (quote) {
      current += ch;
      if (ch === quote && command[i - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === "|") {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  return parts.length > 0 ? parts : [command.trim()];
}

/**
 * Evaluates whether a CommandOutput represents a successful command execution.
 *
 * @param {CommandOutput} output - The output result from an executed command.
 * @returns {boolean} True if output type is 'success' or 'info', false otherwise.
 */
function isSuccessOutput(output: CommandOutput): boolean {
  return output.type === "success" || output.type === "info";
}

/**
 * Registry and parser engine for interactive terminal commands.
 * Handles command registration, aliasing, fuzzy typo tolerance, pipe chains, and logical operators.
 *
 * @class CommandParser
 */
export class CommandParser {
  /**
   * Internal mapping from lowercase command names and aliases to their registered Command definitions.
   * @private
   */
  private commands: Map<string, Command> = new Map();

  /**
   * Registers a new command definition and maps all its aliases into the parser registry.
   *
   * @param {Command} command - The command specification to register.
   * @returns {void}
   */
  register(command: Command): void {
    if (!command) return;
    this.commands.set(command.name.toLowerCase(), command);
    command.aliases?.forEach((alias) =>
      this.commands.set(alias.toLowerCase(), command),
    );
  }

  /**
   * Retrieves an array of all unique registered command objects.
   *
   * @returns {Command[]} Array of unique registered commands.
   */
  getCommands(): Command[] {
    const uniqueCommands = new Map<string, Command>();
    for (const command of Array.from(this.commands.values())) {
      uniqueCommands.set(command.name, command);
    }
    return Array.from(uniqueCommands.values());
  }

  /**
   * Executes an individual command stage with optional piped input from a previous stage.
   *
   * @private
   * @param {string} input - The single command invocation string with arguments.
   * @param {string} [pipedInput] - Optional output string piped from a preceding command.
   * @returns {Promise<CommandOutput>} Result of the command execution or an error output if not found.
   */
  private async executeSingle(
    input: string,
    pipedInput?: string,
  ): Promise<CommandOutput> {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return {
        type: "error",
        content: "Please enter a command. Type 'help' for available commands.",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const [commandName, ...args] = trimmedInput.split(/\s+/);
    const command = this.commands.get(commandName.toLowerCase());

    if (!command) {
      const availableCommands = Array.from(
        new Set(Array.from(this.commands.keys())),
      );
      const suggestion = TypoTolerance.findSimilarCommand(
        commandName,
        availableCommands,
      );

      return {
        type: "error",
        content: suggestion
          ? `Command not found. Did you mean '${suggestion}'?`
          : `Command '${commandName}' not found. Type 'help' for available commands.`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const pipeArgs = pipedInput ? pipedInput.split(/\s+/).filter(Boolean) : [];
    const mergedArgs = [...pipeArgs, ...args];

    try {
      const usedCommandName = commandName.toLowerCase();
      if (
        command.name === "theme" ||
        command.name === "font" ||
        usedCommandName === "theme" ||
        usedCommandName === "font"
      ) {
        return await command.execute(mergedArgs, trimmedInput);
      }

      return await command.execute(mergedArgs);
    } catch (error) {
      return {
        type: "error",
        content: `Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
        id: generateId(),
      };
    }
  }

  /**
   * Executes a sequence of commands joined by pipe (`|`) operators, piping stdout of each stage to stdin of the next.
   *
   * @private
   * @param {string} commandLine - Piped pipeline command string.
   * @returns {Promise<CommandOutput>} The final command output or an error output if any stage fails.
   */
  private async executePiped(commandLine: string): Promise<CommandOutput> {
    const stages = splitPipeChain(commandLine);
    let pipedContent: string | undefined;

    for (let i = 0; i < stages.length; i++) {
      const output = await this.executeSingle(stages[i], pipedContent);
      if (output.type === "error") {
        return output;
      }
      pipedContent =
        typeof output.content === "string"
          ? output.content
          : String(output.content ?? "");
      if (i === stages.length - 1) {
        return output;
      }
    }

    return {
      type: "error",
      content: "Empty pipe chain",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  /**
   * Parses and executes a full command line input string, evaluating chaining operators (`;`, `&&`) and pipelines.
   *
   * @param {string} input - The raw command line input to parse and run.
   * @returns {Promise<CommandOutput>} Resulting output containing formatted text or errors.
   * @example
   * ```ts
   * const output = await parser.parse("tech-stack stats && theme dracula");
   * ```
   */
  async parse(input: string): Promise<CommandOutput> {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        type: "error",
        content: "Please enter a command. Type 'help' for available commands.",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const chain = splitCommandChain(trimmed);
    if (chain.length === 1) {
      return this.executePiped(chain[0].command);
    }

    const outputs: string[] = [];
    for (let i = 0; i < chain.length; i++) {
      const segment = chain[i];
      const output = await this.executePiped(segment.command);

      if (output.type === "error") {
        return output;
      }

      outputs.push(
        typeof output.content === "string"
          ? output.content
          : String(output.content ?? ""),
      );

      const next = chain[i + 1];
      if (next?.operator === "&&" && !isSuccessOutput(output)) {
        return {
          type: "error",
          content: `Chain stopped: previous command did not succeed.\n\n${outputs.join("\n\n---\n\n")}`,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    return {
      type: "success",
      content: outputs.join("\n\n---\n\n"),
      timestamp: new Date(),
      id: generateId(),
    };
  }
}

