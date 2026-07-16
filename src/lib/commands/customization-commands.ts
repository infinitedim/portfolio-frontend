import type { Command } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { CustomizationService } from "@/lib/services/customization-service";

const customizationService = CustomizationService.getInstance();

export const customizeCommand: Command = {
  name: "customize",
  description: "Open the customization manager",
  aliases: ["custom", "appearance", "ui"],
  async execute() {
    return {
      type: "text",
      content: "OPEN_CUSTOMIZATION_MANAGER",
      timestamp: new Date(),
      id: generateId(),
    };
  },
  category: "customization",
};

export const themesCommand: Command = {
  name: "themes",
  category: "customization",
  description: "List all available themes",
  aliases: ["theme-list"],
  async execute() {
    const allThemes = customizationService.getAllThemes();
    const builtInCount = allThemes.filter(
      (t) => t.source === "built-in",
    ).length;

    const themeList = [
      "All Available Themes",
      "═".repeat(50),
      "",
      "Built-in Themes:",
      ...allThemes
        .filter((t) => t.source === "built-in")
        .map((theme) => `  • ${theme.name} (${theme.id})`),
      "",
      "Summary:",
      `  Built-in: ${builtInCount}`,
      `  Total: ${allThemes.length}`,
      "",
      "Commands:",
      "  customize           # Open theme manager",
      "  theme <name>        # Apply theme",
    ].join("\n");

    return {
      type: "success",
      content: themeList,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const fontsCommand: Command = {
  name: "fonts",
  category: "customization",
  description: "List all available fonts",
  aliases: ["font-list"],
  async execute() {
    const allFonts = customizationService.getAllFonts();
    const systemCount = allFonts.filter((f) => f.source === "system").length;
    const ligaturesCount = allFonts.filter((f) => f.ligatures).length;

    const fontList = [
      "All Available Fonts",
      "═".repeat(50),
      "",
      "System Fonts:",
      ...allFonts
        .filter((f) => f.source === "system")
        .map(
          (font) => `  • ${font.name}${font.ligatures ? " (ligatures)" : ""}`,
        ),
      "",
      "Summary:",
      `  System: ${systemCount}`,
      `  With Ligatures: ${ligaturesCount}`,
      `  Total: ${allFonts.length}`,
      "",
      "Commands:",
      "  customize           # Open font manager",
      "  font <name>         # Apply font",
    ].join("\n");

    return {
      type: "success",
      content: fontList,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
