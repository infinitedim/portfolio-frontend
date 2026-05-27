import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { streamAiChat, type ChatTurn } from "@/lib/services/ai-service";

const sessionHistory: ChatTurn[] = [];

export const askCommand: Command = {
  name: "ask",
  description: "Ask the portfolio AI assistant a question",
  aliases: ["ai", "chat"],
  async execute(args: string[]): Promise<CommandOutput> {
    const question = args.join(" ").trim();
    if (!question) {
      return {
        type: "error",
        content: "Usage: ask <your question>",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    let answer = "";
    try {
      await streamAiChat(
        { message: question, history: sessionHistory },
        (token) => {
          answer += token;
        },
      );

      sessionHistory.push({ role: "user", content: question });
      sessionHistory.push({ role: "assistant", content: answer });

      if (sessionHistory.length > 20) {
        sessionHistory.splice(0, sessionHistory.length - 20);
      }

      return {
        type: "success",
        content: answer || "No response from assistant.",
        timestamp: new Date(),
        id: generateId(),
      };
    } catch (err) {
      return {
        type: "error",
        content:
          err instanceof Error
            ? err.message
            : "AI assistant unavailable. Check GEMINI_API_KEY on the backend.",
        timestamp: new Date(),
        id: generateId(),
      };
    }
  },
};
