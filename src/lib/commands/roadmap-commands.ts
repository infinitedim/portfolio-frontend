import type { Command } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import type { RoadmapSkill } from "@/types/roadmap";
import type { RoadmapService as RoadmapServiceType } from "@/lib/services/roadmap-service";

let roadmapService: RoadmapServiceType | null = null;
let roadmapServicePromise: Promise<RoadmapServiceType | null> | null = null;

const getRoadmapService = async (): Promise<RoadmapServiceType | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (roadmapService) {
    return roadmapService;
  }

  if (roadmapServicePromise) {
    return await roadmapServicePromise;
  }

  roadmapServicePromise = (async () => {
    try {
      const { RoadmapService } = await import("@/lib/services/roadmap-service");
      roadmapService = RoadmapService.getInstance();
      return roadmapService;
    } catch (error) {
      console.error("Failed to load RoadmapService:", error);
      return null;
    }
  })();

  return await roadmapServicePromise;
};

type ServiceResult =
  | { error: true; message: string; service?: undefined }
  | { error: false; message: string; service: RoadmapServiceType };

const getServiceOrError = async (): Promise<ServiceResult> => {
  try {
    const service = await getRoadmapService();
    if (!service) {
      return {
        error: true,
        message:
          "Roadmap service is not available during server-side rendering",
      };
    }

    if (typeof service.getUserProgress !== "function") {
      return {
        error: true,
        message: "Service method getUserProgress not available",
      };
    }

    if (typeof service.getCategoryProgress !== "function") {
      return {
        error: true,
        message: "Service method getCategoryProgress not available",
      };
    }

    if (typeof service.updateSkillProgress !== "function") {
      return {
        error: true,
        message: "Service method updateSkillProgress not available",
      };
    }

    if (typeof service.getSkillsByStatus !== "function") {
      return {
        error: true,
        message: "Service method getSkillsByStatus not available",
      };
    }

    if (typeof service.refreshData !== "function") {
      return {
        error: true,
        message: "Service method refreshData not available",
      };
    }

    return { service, error: false, message: "" };
  } catch (error) {
    return {
      error: true,
      message: `Failed to load roadmap service: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

export const roadmapCommand: Command = {
  name: "roadmap",
  category: "skills",
  description: "View roadmap progress and manage skills",
  usage: "roadmap [overview|skills|update|search] [args...]",
  async execute(args) {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === "overview") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const data = await service.getUserProgress();

      const overviewText = [
        "🗺️ Roadmap Progress Overview",
        "═".repeat(50),
        "",
        `👤 Profile: ${data.username}`,
        `📊 Overall Progress: ${Math.round(data.totalProgress)}%`,
        `✅ Completed Skills: ${data.completedSkills}/${data.totalSkills}`,
        `📅 Last Updated: ${data.lastUpdated.toLocaleDateString()}`,
        "",
        "📋 Categories:",
        ...data.categories.map(
          (cat: {
            name: string;
            skills: Array<{ status: string }>;
            progress: number;
          }) => {
            const completed = cat.skills.filter(
              (s: { status: string }) => s.status === "completed",
            ).length;
            const total = cat.skills.length;
            const progressBar =
              "▓".repeat(Math.floor(cat.progress / 10)) +
              "░".repeat(10 - Math.floor(cat.progress / 10));
            return `  ${cat.name.padEnd(20)} [${progressBar}] ${Math.round(cat.progress)}% (${completed}/${total})`;
          },
        ),
        "",
        "💡 Available commands:",
        "  roadmap skills [category]     - List skills by category",
        "  roadmap update <skill> <status> - Update skill status",
        "  roadmap search <query>        - Search skills",
        "  roadmap completed             - Show completed skills",
        "  roadmap progress              - Show in-progress skills",
      ].join("\n");

      return {
        type: "success",
        content: overviewText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "skills") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const category = args[1]?.toLowerCase();
      const data = await service.getUserProgress();

      if (category) {
        const categoryData = await service.getCategoryProgress(category);
        if (!categoryData) {
          return {
            type: "error",
            content: `Category "${category}" not found. Available: ${data.categories.map((c: { id: string }) => c.id).join(", ")}`,
            timestamp: new Date(),
            id: generateId(),
          };
        }

        const skillsText = [
          `🛠️ ${categoryData.name.toUpperCase()} Skills`,
          "═".repeat(40),
          "",
          ...categoryData.skills.map((skill: RoadmapSkill) => {
            const statusIcon =
              skill.status === "completed"
                ? "✅"
                : skill.status === "in-progress"
                  ? "🔄"
                  : "⭕";
            const progressBar =
              "▓".repeat(Math.floor(skill.progress / 10)) +
              "░".repeat(10 - Math.floor(skill.progress / 10));
            return `  ${statusIcon} ${skill.name.padEnd(15)} [${progressBar}] ${skill.progress}%`;
          }),
        ].join("\n");

        return {
          type: "success",
          content: skillsText,
          timestamp: new Date(),
          id: generateId(),
        };
      } else {
        const skillsText = [
          "🛠️ All Skills by Category",
          "═".repeat(40),
          "",
          ...data.categories.flatMap(
            (cat: { name: string; skills: RoadmapSkill[] }) => [
              `📁 ${cat.name}:`,
              ...cat.skills.map((skill: RoadmapSkill) => {
                const statusIcon =
                  skill.status === "completed"
                    ? "✅"
                    : skill.status === "in-progress"
                      ? "🔄"
                      : "⭕";
                return `  ${statusIcon} ${skill.name} (${skill.progress}%)`;
              }),
              "",
            ],
          ),
        ].join("\n");

        return {
          type: "success",
          content: skillsText,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    if (subcommand === "update") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const skillName = args[1];
      const status = args[2] as RoadmapSkill["status"];

      if (!skillName || !status) {
        return {
          type: "error",
          content: [
            "Usage: roadmap update <skill> <status>",
            "",
            "Status options: not-started, in-progress, completed",
            "Example: roadmap update react completed",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const validStatuses = ["not-started", "in-progress", "completed"];
      if (!validStatuses.includes(status)) {
        return {
          type: "error",
          content: `Invalid status "${status}". Valid options: ${validStatuses.join(", ")}`,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const success = await service.updateSkillProgress(
        skillName.toLowerCase(),
        {
          skillId: skillName.toLowerCase(),
          status,
          progress:
            status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
        },
      );

      if (success) {
        return {
          type: "success",
          content: [
            `✅ Updated ${skillName} status to "${status}"`,
            "",
            "💾 Progress saved automatically",
            "📊 Use 'roadmap overview' to see updated progress",
          ].join("\n"),
          timestamp: new Date(),
          id: generateId(),
        };
      } else {
        return {
          type: "error",
          content: `Skill "${skillName}" not found. Use 'roadmap skills' to see available skills.`,
          timestamp: new Date(),
          id: generateId(),
        };
      }
    }

    if (subcommand === "search") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const query = args.slice(1).join(" ");
      if (!query) {
        return {
          type: "error",
          content:
            "Usage: roadmap search <query>\nExample: roadmap search react",
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const data = await service.getUserProgress();
      const results: RoadmapSkill[] = [];

      data.categories.forEach((category: { skills: RoadmapSkill[] }) => {
        category.skills.forEach((skill: RoadmapSkill) => {
          if (
            skill.name.toLowerCase().includes(query.toLowerCase()) ||
            skill.description.toLowerCase().includes(query.toLowerCase())
          ) {
            results.push(skill);
          }
        });
      });

      if (results.length === 0) {
        return {
          type: "info",
          content: `No skills found matching "${query}"`,
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const searchText = [
        `🔍 Search Results for "${query}"`,
        "═".repeat(40),
        "",
        ...results.map((skill: RoadmapSkill) => {
          const statusIcon =
            skill.status === "completed"
              ? "✅"
              : skill.status === "in-progress"
                ? "🔄"
                : "⭕";
          return `  ${statusIcon} ${skill.name} (${skill.category}) - ${skill.progress}%`;
        }),
      ].join("\n");

      return {
        type: "success",
        content: searchText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "completed") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const completedSkills = await service.getSkillsByStatus("completed");

      const completedText = [
        "✅ Completed Skills",
        "═".repeat(30),
        "",
        ...completedSkills.map(
          (skill: RoadmapSkill) =>
            `  ✅ ${skill.name} (${skill.category}) - Recently completed`,
        ),
        "",
        `Total: ${completedSkills.length} skills completed`,
      ].join("\n");

      return {
        type: "success",
        content: completedText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (subcommand === "progress" || subcommand === "in-progress") {
      const { service, error, message } = await getServiceOrError();
      if (error) {
        return {
          type: "error",
          content: message || "An unknown error occurred",
          timestamp: new Date(),
          id: generateId(),
        };
      }
      const inProgressSkills = await service.getSkillsByStatus("in-progress");

      const progressText = [
        "🔄 Skills In Progress",
        "═".repeat(30),
        "",
        ...inProgressSkills.map((skill: RoadmapSkill) => {
          const progressBar =
            "▓".repeat(Math.floor(skill.progress / 10)) +
            "░".repeat(10 - Math.floor(skill.progress / 10));
          return `  🔄 ${skill.name.padEnd(15)} [${progressBar}] ${skill.progress}%`;
        }),
        "",
        `Total: ${inProgressSkills.length} skills in progress`,
      ].join("\n");

      return {
        type: "success",
        content: progressText,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    return {
      type: "error",
      content: [
        `Unknown subcommand: ${subcommand}`,
        "",
        "Available subcommands:",
        "  overview  - Show progress overview",
        "  skills    - List skills by category",
        "  update    - Update skill status",
        "  search    - Search skills",
        "  completed - Show completed skills",
        "  progress  - Show in-progress skills",
      ].join("\n"),
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const progressCommand: Command = {
  name: "progress",
  description: "Quick view of current progress",
  aliases: ["prog"],
  category: "skills",
  async execute() {
    const { service, error, message } = await getServiceOrError();
    if (error) {
      return {
        type: "error",
        content: message || "An unknown error occurred",
        timestamp: new Date(),
        id: generateId(),
      };
    }
    const data = await service.getUserProgress();
    const inProgress = await service.getSkillsByStatus("in-progress");
    const completed = await service.getSkillsByStatus("completed");

    const progressText = [
      "📊 Quick Progress Summary",
      "═".repeat(35),
      "",
      `🎯 Overall Progress: ${Math.round(data.totalProgress)}%`,
      `✅ Completed: ${completed.length} skills`,
      `🔄 In Progress: ${inProgress.length} skills`,
      `⭕ Not Started: ${data.totalSkills - completed.length - inProgress.length} skills`,
      "",
      "🔥 Recent Activity:",
      ...completed
        .slice(-3)
        .map(
          (skill: RoadmapSkill) => `  ✅ ${skill.name} - Recently completed`,
        ),
      "",
      "💡 Use 'roadmap overview' for detailed view",
    ].join("\n");

    return {
      type: "success",
      content: progressText,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};
