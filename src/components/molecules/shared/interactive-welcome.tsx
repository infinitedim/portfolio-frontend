"use client";

import { useState, memo, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { HelpCircle, User, FolderGit2, Mail } from "lucide-react";

interface InteractiveWelcomeProps {
  onCommandSelect: (command: string) => void;
  onDismiss: () => void;
}

export const InteractiveWelcome = memo(function InteractiveWelcome({
  onCommandSelect,
  onDismiss,
}: InteractiveWelcomeProps): JSX.Element {
  const { themeConfig } = useTheme();
  const { t } = useI18n();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const quickCommands = [
    {
      command: "help",
      description:
        t("terminalWelcomeDescHelp") || "View all available commands",
      icon: HelpCircle,
      highlight: true,
    },
    {
      command: "about",
      description: t("terminalWelcomeDescAbout") || "Learn about me",
      icon: User,
    },
    {
      command: "projects",
      description: t("terminalWelcomeDescProjects") || "Explore my projects",
      icon: FolderGit2,
    },
    {
      command: "contact",
      description: t("terminalWelcomeDescContact") || "Get in touch",
      icon: Mail,
    },
  ];

  const handleCommandClick = (command: string) => {
    setSelectedCommand(command);

    setTimeout(() => {
      onCommandSelect(command);
      onDismiss();
    }, 200);
  };

  return (
    <div
      className="bg-black/10 backdrop-blur-sm rounded-lg border p-6 mb-6"
      style={{
        borderColor: `${themeConfig.colors.border}60`,
        backgroundColor: `${themeConfig.colors.bg}40`,
      }}
    >
      <div className="text-center mb-6">
        <div
          className="text-lg font-bold mb-2"
          style={{ color: themeConfig.colors.accent }}
        >
          {t("terminalWelcomeTitle") || "Welcome to My Terminal Portfolio!"}
        </div>
        <div
          className="text-sm opacity-75"
          style={{ color: themeConfig.colors.muted }}
        >
          {t("terminalWelcomeSubtitle") ||
            "Click on any command below to get started, or type directly in the terminal"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {quickCommands.map((cmd) => {
          const isHighlighted = "highlight" in cmd && cmd.highlight;
          const IconComponent = cmd.icon;
          return (
            <button
              key={cmd.command}
              onClick={() => handleCommandClick(cmd.command)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left hover:scale-105 hover:bg-(--terminal-accent)/10 hover:border-(--terminal-accent) focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none ${
                selectedCommand === cmd.command ? "animate-pulse" : ""
              }`}
              style={
                {
                  borderColor: isHighlighted
                    ? themeConfig.colors.accent
                    : themeConfig.colors.border,
                  backgroundColor:
                    selectedCommand === cmd.command || isHighlighted
                      ? `${themeConfig.colors.accent}20`
                      : `${themeConfig.colors.bg}20`,
                  color: themeConfig.colors.text,

                  "--tw-ring-color": isHighlighted
                    ? themeConfig.colors.accent
                    : undefined,
                } as React.CSSProperties
              }
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComponent
                  className="w-4 h-4"
                  style={{ color: themeConfig.colors.accent }}
                />
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {cmd.command}
                </span>
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: themeConfig.colors.muted }}
              >
                {cmd.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div
          className="opacity-60"
          style={{ color: themeConfig.colors.muted }}
        >
          {t("terminalWelcomeTip") ||
            "Tip: Use Tab for auto-completion and ↑↓ for command history"}
        </div>
        <button
          onClick={onDismiss}
          className="px-3 py-1 rounded border hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:outline-none"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          {t("terminalWelcomeSkip") || "Skip intro"}
        </button>
      </div>
    </div>
  );
});
