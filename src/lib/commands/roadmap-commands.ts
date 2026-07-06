import type { Command } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";

export const roadmapCommand: Command = {
  name: "roadmap",
  description: "Open roadmap.sh profile",
  async execute() {
    if (typeof window !== "undefined") {
      window.open("https://roadmap.sh/u/infinitedim", "_blank", "noopener,noreferrer");
    }
    return {
      type: "success",
      content: "Opening roadmap.sh profile (https://roadmap.sh/u/infinitedim)...",
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
