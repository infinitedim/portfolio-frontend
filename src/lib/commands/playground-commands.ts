import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";

export const playgroundCommand: Command = {
  name: "playground",
  description: "Open the live coding playground",
  aliases: ["sandpack", "demo-code"],
  async execute(args: string[]): Promise<CommandOutput> {
    const id = args[0]?.trim();
    const path = id ? `/playground?id=${encodeURIComponent(id)}` : "/playground";

    if (typeof window !== "undefined") {
      window.open(path, "_blank", "noopener,noreferrer");
    }

    return {
      type: "success",
      content: id
        ? `Opening playground snippet ${id} in a new tab…`
        : "Opening live coding playground in a new tab…",
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
