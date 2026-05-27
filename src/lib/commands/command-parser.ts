import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { TypoTolerance } from "./typo-tolerance";

type ChainOperator = ";" | "&&";

interface ParsedSegment {
  command: string;
  operator?: ChainOperator;
}

/** Split a command line on `;` or `&&` while respecting quoted strings. */
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

/** Split a single command on unquoted `|` for piping. */
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

function isSuccessOutput(output: CommandOutput): boolean {
  return output.type === "success" || output.type === "info";
}

export class CommandParser {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    if (!command) return;
    this.commands.set(command.name.toLowerCase(), command);
    command.aliases?.forEach((alias) =>
      this.commands.set(alias.toLowerCase(), command),
    );
  }

  getCommands(): Command[] {
    const uniqueCommands = new Map<string, Command>();
    for (const command of Array.from(this.commands.values())) {
      uniqueCommands.set(command.name, command);
    }
    return Array.from(uniqueCommands.values());
  }

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

    const pipeArgs = pipedInput
      ? pipedInput.split(/\s+/).filter(Boolean)
      : [];
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
