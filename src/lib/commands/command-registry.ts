import type { Command } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { ArgumentParser } from "@/lib/utils/arg-parser";
import { ThemeDisplay } from "@/lib/utils/theme-display";
import { themes, getSortedThemeNames } from "@/lib/themes/theme-config";
import type { ThemeName } from "@/types/theme";

export const createHelpCommand = (getCommands: () => Command[]): Command => ({
  name: "help",
  description: "Show available commands",
  aliases: ["h", "?", "man", "commands"],
  async execute() {
    const commands = getCommands();
    const helpText = [
      "Available Commands:",
      "═".repeat(50),
      "",
      ...commands.map((cmd) => {
        const name = cmd.name.padEnd(12);
        const desc = cmd.description;
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";

        if (cmd.name === "theme") {
          return `  • ${name} - ${desc}${aliases}`;
        }
        if (cmd.name === "font") {
          return `  • ${name} - ${desc}${aliases}`;
        }
        return `  • ${name} - ${desc}${aliases}`;
      }),
      "",
      "Featured Commands:",
      "  theme -l                      - List all available themes",
      "  theme dracula                 - Switch to dracula theme",
      "  font fira-code                - Switch to Fira Code font",
      "  demo list                     - List available project demos",
      "  tech-stack list               - Show technology stack",
      "",
      "Command-Line Arguments:",
      "  theme -l, --list              - Show theme list",
      "  theme -p, --preview <name>    - Preview theme colors",
      "  theme -c, --current           - Show current theme info",
      "  font -l, --list               - Show font list",
      "",
      "Tips:",
      "  • Use arrow keys (↑/↓) to navigate command history",
      "  • Commands support aliases (e.g., 'cls' for 'clear')",
      "  • Commands are case-insensitive with typo tolerance",
      "  • Use flags for quick access to lists and previews",
      "  • Font ligatures supported for enhanced readability",
    ].join("\n");

    return {
      type: "success",
      content: helpText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
});

export const aboutCommand: Command = {
  name: "about",
  description: "Learn more about me",
  aliases: ["whoami", "info", "me"],
  async execute() {
    const projectName = "Project";
    const aboutText = [
      "Hello! I'm a Full-Stack Developer",
      "",
      "Passionate about creating innovative web solutions",
      "Specialized in React, Next.js, and modern web technologies",
      "Love combining technical skills with creative design",
      "Always learning and exploring new technologies",
      "",
      "This terminal-themed portfolio showcases my skills in:",
      "  • Frontend Development (React, Next.js, TypeScript)",
      "  • UI/UX Design (Tailwind CSS, Responsive Design)",
      "  • DevOps (CI/CD, Performance Optimization)",
      "  • Creative Problem Solving",
      "",
      "My learning journey is tracked on roadmap.sh",
      "   Visit the homepage roadmap to see my current progress!",
      "",
      `Type "${projectName}" to see my work or "contact" to get in touch!`,
    ].join("\n");

    return {
      type: "success",
      content: aboutText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const projectsCommand: Command = {
  name: "projects",
  description: "View my portfolio projects",
  aliases: ["portfolio", "work", "proj"],
  async execute() {
    const projectsText = [
      "Featured Projects:",
      "",
      "1. Terminal Portfolio (Current)",
      "   • Interactive Linux terminal-themed website",
      "   • Next.js, TypeScript, Tailwind CSS",
      "   • Command parsing with typo tolerance",
      "   • roadmap.sh integration for skills tracking",
      "   • Multiple theme support with font customization",
      "   • Command-line argument support with flags",
      "",
      "2. E-Commerce Platform",
      "   • Full-stack online store with payment integration",
      "   • React, Node.js, PostgreSQL",
      "   • Real-time inventory management",
      "   • JWT authentication system",
      "",
      "3. Task Management App",
      "   • Collaborative project management tool",
      "   • React, Firebase, Material-UI",
      "   • Real-time collaboration features",
      "   • MongoDB for data persistence",
      "",
      "4. Weather Dashboard",
      "   • Beautiful weather app with forecasts",
      "   • React, OpenWeather API, Chart.js",
      "   • Responsive design with animations",
      "   • Sass/SCSS for styling",
      "",
      "All projects contribute to my roadmap.sh progress!",
      "   Visit the homepage roadmap to see how they map to my skills.",
      "",
      "Visit my GitHub for more projects and source code!",
    ].join("\n");

    return {
      type: "success",
      content: projectsText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const contactCommand: Command = {
  name: "contact",
  description: "Get my contact information",
  aliases: ["reach", "connect", "email"],
  async execute() {
    const contactText = [
      "Let's Connect!",
      "",
      "Email: dragdimas9@gmail.com",
      "LinkedIn: linkedin.com/in/infinitedim",
      "GitHub: github.com/infinitedim",
      "Twitter: @infinitedim",
      "Website: infinitedim.dev",
      "Roadmap: https://roadmap.sh/u/infinitedim",
      "",
      "I'm always open to:",
      "  • Collaboration opportunities",
      "  • Technical discussions",
      "  • Freelance projects",
      "  • Coffee chats about tech",
      "  • Mentoring and knowledge sharing",
      "",
      "Feel free to reach out anytime!",
    ].join("\n");

    return {
      type: "success",
      content: contactText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const clearCommand: Command = {
  name: "clear",
  description: "Clear the terminal screen",
  aliases: ["cls", "clr", "clean"],
  async execute() {
    return {
      type: "text",
      content: "CLEAR",
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const themeCommand: Command = {
  name: "theme",
  description: "Change terminal theme or view theme information",
  usage: "theme [options] [theme-name]",
  aliases: ["color", "style"],
  async execute(args, fullInput = "") {
    const parsedArgs = ArgumentParser.parse(fullInput);
    const availableThemes = getSortedThemeNames();

    const isListFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "l", long: "list" },
      { short: "list" },
      {
        long: "theme-list",
        short: "theme -l",
      },
    ]);

    const isCurrentFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "c", long: "current" },
    ]);

    const isPreviewFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "p", long: "preview" },
    ]);

    const isCompactFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "compact" },
    ]);

    const isHelpFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "h", long: "help" },
    ]);

    if (isHelpFlag) {
      return {
        type: "success",
        content: [
          "Theme Command Help",
          "═".repeat(30),
          "",
          "Usage:",
          "  theme [options] [theme-name]",
          "",
          "Options:",
          "  -l, --list           Show all available themes",
          "  -c, --current        Show current theme information",
          "  -p, --preview <name> Show color preview for theme",
          "  --compact            Show compact theme list",
          "  -h, --help           Show this help message",
          "",
          "Examples:",
          "  theme -l                    # List all themes",
          "  theme --list                # List all themes (long form)",
          "  theme -p dracula            # Preview dracula theme colors",
          "  theme --preview monokai     # Preview monokai theme colors",
          "  theme dracula               # Switch to dracula theme",
          "  theme -c                    # Show current theme info",
          "",
          `Available themes: ${availableThemes.length} total`,
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (isListFlag) {
      const currentTheme: ThemeName =
        (typeof window !== "undefined" &&
          (localStorage.getItem("terminal-theme") as ThemeName)) ||
        "default";

      const themeList = ThemeDisplay.generateList({
        showCurrent: true,
        currentTheme,
        compact: isCompactFlag,
        showColors: true,
        columns: isCompactFlag ? 1 : 2,
      });

      const additionalInfo = [
        "",
        "Usage Tips:",
        "  • Use 'theme <name>' to switch themes",
        "  • Use 'theme -p <name>' to preview colors",
        "  • Use 'theme -c' to see current theme details",
        "",
        "Quick Commands:",
        "  theme dracula    # Switch to dracula",
        "  theme -p hacker  # Preview hacker theme",
        "  theme --current  # Show current theme",
      ];

      return {
        type: "success",
        content: themeList + additionalInfo.join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (isCurrentFlag) {
      const currentTheme =
        (typeof window !== "undefined"
          ? (localStorage.getItem("terminal-theme") as ThemeName)
          : "default") || "default";

      const config = themes[currentTheme as ThemeName];
      const currentInfo = [
        "Current Theme Information",
        "═".repeat(35),
        "",
        `Name: ${config.name}`,
        `ID: ${currentTheme}`,
        "",
        "Color Palette:",
        `  Background: ${config.colors.bg}`,
        `  Text:       ${config.colors.text}`,
        `  Prompt:     ${config.colors.prompt}`,
        `  Success:    ${config.colors.success}`,
        `  Error:      ${config.colors.error}`,
        `  Accent:     ${config.colors.accent}`,
        `  Border:     ${config.colors.border}`,
        "",
        "To change theme: theme <name>",
        "To see all themes: theme -l",
      ].join("\n");

      return {
        type: "success",
        content: currentInfo,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (isPreviewFlag) {
      const previewTheme = parsedArgs.positional[0] || args[1];

      if (!previewTheme) {
        return {
          type: "error",
          content: [
            "Preview theme name required",
            "",
            "Usage: theme -p <theme-name>",
            "Example: theme -p dracula",
            "",
            `Available themes: ${availableThemes.join(", ")}`,
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      if (!availableThemes.includes(previewTheme as ThemeName)) {
        return {
          type: "error",
          content: [
            `Theme "${previewTheme}" not found`,
            "",
            `Available themes: ${availableThemes.join(", ")}`,
            "",
            "Use 'theme -l' to see all available themes",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const preview = ThemeDisplay.generateColorPreview(
        previewTheme as ThemeName,
      );
      return {
        type: "success",
        content: preview,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (args.length === 0 && parsedArgs.positional.length === 0) {
      const currentTheme =
        (typeof window !== "undefined"
          ? (localStorage.getItem("terminal-theme") as ThemeName)
          : "default") || "default";

      const themeList = ThemeDisplay.generateList({
        showCurrent: true,
        currentTheme,
        compact: false,
        showColors: false,
        columns: 2,
      });

      const helpInfo = [
        "",
        "Available Flags:",
        "  -l, --list     Show detailed theme list",
        "  -c, --current  Show current theme info",
        "  -p, --preview  Preview theme colors",
        "  -h, --help     Show command help",
        "",
        "Usage: theme [flag] or theme <name>",
      ];

      return {
        type: "success",
        content: themeList + helpInfo.join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const requestedTheme = parsedArgs.positional[0] || args[0];
    if (!requestedTheme) {
      return {
        type: "error",
        content: "Theme name required. Use 'theme -l' to see available themes.",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (!availableThemes.includes(requestedTheme.toLowerCase() as ThemeName)) {
      return {
        type: "error",
        content: [
          `Invalid theme "${requestedTheme}"`,
          "",
          `Available themes: ${availableThemes.join(", ")}`,
          "",
          "Use 'theme -l' for a detailed list",
          "Use 'theme -p <name>' to preview colors",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    return {
      type: "success",
      content: `CHANGE_THEME:${requestedTheme.toLowerCase()}`,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const fontCommand: Command = {
  name: "font",
  description: "Change terminal font or view font information",
  usage: "font [options] [font-name]",
  aliases: ["typeface", "typography"],
  async execute(args, fullInput = "") {
    const parsedArgs = ArgumentParser.parse(fullInput);

    const availableFonts = [
      "fira-code",
      "inconsolata",
      "jetbrains-mono",
      "roboto-mono",
      "source-code-pro",
      "ubuntu-mono",
    ];

    const isListFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "l", long: "list" },
    ]);

    const isCurrentFlag = ArgumentParser.hasFlagAny(parsedArgs, [
      { short: "c", long: "current" },
    ]);

    if (isListFlag) {
      const currentFont =
        (typeof window !== "undefined"
          ? localStorage.getItem("terminal-font")
          : "jetbrains-mono") || "jetbrains-mono";

      const fontList = availableFonts.map((font) => {
        const displayName = font
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        const ligatures = ["fira-code", "jetbrains-mono"].includes(font)
          ? " (ligatures)"
          : "";
        const isCurrent = currentFont === font;
        const indicator = isCurrent ? "► " : "  ";

        return `${indicator}${font.padEnd(18)} - ${displayName}${ligatures} ${isCurrent ? " (current)" : ""}`;
      });

      return {
        type: "success",
        content: [
          "Available Terminal Fonts",
          "═".repeat(40),
          "",
          `Current Font: ${currentFont}`,
          "",
          "Font List:",
          "",
          ...fontList,
          "",
          `Total: ${availableFonts.length} fonts available`,
          "",
          "Usage:",
          "  font <name>        # Switch to font",
          "  font -c            # Show current font info",
          "",
          "Fonts with ligatures enhance code readability!",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (isCurrentFlag) {
      const currentFont =
        (typeof window !== "undefined"
          ? localStorage.getItem("terminal-font")
          : "jetbrains-mono") || "jetbrains-mono";

      const displayName = currentFont
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const hasLigatures = ["fira-code", "jetbrains-mono"].includes(
        currentFont,
      );

      return {
        type: "success",
        content: [
          "Current Font Information",
          "═".repeat(30),
          "",
          `Name: ${displayName}`,
          `ID: ${currentFont}`,
          `Ligatures: ${hasLigatures ? "Enabled" : "Disabled"}`,
          "",
          "To change font: font <name>",
          "To see all fonts: font -l",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (args.length === 0) {
      const fontList = availableFonts.map((font) => {
        const displayName = font
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        const ligatures = ["fira-code", "jetbrains-mono"].includes(font)
          ? " (ligatures)"
          : "";
        return `  ${font.padEnd(18)} - ${displayName}${ligatures}`;
      });

      return {
        type: "success",
        content: [
          "Terminal Font Manager",
          "",
          "Available fonts (optimized with Next.js):",
          ...fontList,
          "",
          "Available Flags:",
          "  -l, --list     Show detailed font list",
          "  -c, --current  Show current font info",
          "",
          "Usage examples:",
          "  font -l             # List all fonts",
          "  font fira-code      # Switch to Fira Code",
          "  font -c             # Show current font",
          "",
          "Fonts with ligatures enhance code readability!",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const requestedFont = args[0].toLowerCase();
    if (!availableFonts.includes(requestedFont)) {
      return {
        type: "error",
        content: [
          `Invalid font "${requestedFont}"`,
          "",
          `Available fonts: ${availableFonts.join(", ")}`,
          "",
          "Use 'font -l' for a detailed list",
          "Example: font fira-code",
        ].join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    }

    return {
      type: "success",
      content: `CHANGE_FONT:${requestedFont}`,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const statusCommand: Command = {
  name: "status",
  description: "Show system status and current theme",
  aliases: ["info", "sys", "system"],
  async execute() {
    return {
      type: "text",
      content: "SHOW_STATUS",
      timestamp: new Date(),
      id: generateId(),
    };
  },
};



export const aliasCommand: Command = {
  name: "alias",
  description: "Show available command aliases",
  aliases: ["aliases"],
  async execute() {
    const aliasText = [
      "Command Aliases",
      "═".repeat(30),
      "",
      "Available command aliases:",
      "",
      "General Commands:",
      "  help     → h, ?, man, commands",
      "  about    → whoami, info, me",
      "  contact  → reach, connect, email",
      "  projects → portfolio, work, proj",
      "",
      "System Commands:",
      "  clear    → cls, clr, clean",
      "  status   → info, sys, system",
      "",
      "Customization:",
      "  theme    → color, style",
      "  font     → typeface, typography",
      "",
      "Language Commands:",
      "  lang     → language, locale",
      "",
      "Interactive Commands:",
      "  demo     → project-demo, show-demo",
      "  tech-stack → tech, stack, technologies",
      "",
      "Command-Line Flags:",
      "  theme -l, --list              # List themes",
      "  theme -p, --preview <name>    # Preview theme",
      "  theme -c, --current           # Current theme info",
      "  font -l, --list               # List fonts",
      "  font -c, --current            # Current font info",
      "",
      "You can use any alias instead of the main command!",
      "   Examples: 'cls' = 'clear', 'h' = 'help'",
    ].join("\n");

    return {
      type: "success",
      content: aliasText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
