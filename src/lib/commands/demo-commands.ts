import { getProjectsData } from "@/lib/data/data-fetching";
import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";

let globalOnOpenDemo: ((projectId: string) => void) | null = null;

export function setDemoCallback(callback: (projectId: string) => void) {
  globalOnOpenDemo = callback;
}

export const demoCommand: Command = {
  name: "demo",
  description: "Interactive project demo system",
  aliases: ["project-demo", "show-demo"],
  async execute(args: string[]): Promise<CommandOutput> {
    const [action, ...params] = args;

    switch (action) {
      case "list":
        return await listProjects();
      case "open":
        return await openProject(params[0]);
      case "search":
        return await searchProjects(params.join(" "));
      case "tech":
        return await listTechnologies();
      case "category":
        return await listCategories();
      case "help":
        return showDemoHelp();
      default:
        if (!action) {
          return showDemoHelp();
        }
        return {
          type: "error",
          content: `Unknown demo action: ${action}. Use 'demo help' for available commands.`,
          timestamp: new Date(),
          id: generateId(),
        };
    }
  },
};

async function listProjects(): Promise<CommandOutput> {
  const projects = await getProjectsData();

  if (projects.length === 0) {
    return {
      type: "info",
      content: "No projects found.",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  const projectList = projects
    .map((project, index) => {
      const demoStatus = project.demoUrl ? "(demo)" : "(no demo)";
      const featured = project.featured ? " [featured]" : "";
      return `${index + 1}. ${demoStatus} ${project.name}${featured}\n   Description: ${project.description}\n   Technologies: ${project.technologies.join(", ")}\n   ID:           ${project.id}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `Available Projects:\n\n${projectList}\n\nUse 'demo open <project-id>' to launch a demo`,
    timestamp: new Date(),
    id: generateId(),
  };
}

async function openProject(projectId: string): Promise<CommandOutput> {
  if (!projectId) {
    return {
      type: "error",
      content:
        "Please provide a project ID. Use 'demo list' to see available projects.",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  const projects = await getProjectsData();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return {
      type: "error",
      content: `Project '${projectId}' not found. Use 'demo list' to see available projects.`,
      timestamp: new Date(),
      id: generateId(),
    };
  }

  if (!project.demoUrl) {
    return {
      type: "error",
      content: `Demo not available for project '${project.name}'.`,
      timestamp: new Date(),
      id: generateId(),
    };
  }

  if (globalOnOpenDemo) {
    globalOnOpenDemo(projectId);
  }

  return {
    type: "success",
    content: `Opening demo for ${project.name}...`,
    timestamp: new Date(),
    id: generateId(),
  };
}

async function searchProjects(query: string): Promise<CommandOutput> {
  if (!query) {
    return {
      type: "error",
      content: "Please provide a search query. Usage: demo search <query>",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  const projects = await getProjectsData();
  const searchTerm = query.toLowerCase();
  const results = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.technologies.some((tech) =>
        tech.toLowerCase().includes(searchTerm),
      ),
  );

  if (results.length === 0) {
    return {
      type: "info",
      content: `No projects found matching '${query}'.`,
      timestamp: new Date(),
      id: generateId(),
    };
  }

  const resultList = results
    .map((project, index) => {
      const demoStatus = project.demoUrl ? "(demo)" : "(no demo)";
      return `${index + 1}. ${demoStatus} ${project.name}\n   Description: ${project.description}\n   Technologies: ${project.technologies.join(", ")}\n   ID:           ${project.id}`;
    })
    .join("\n\n");

  return {
    type: "success",
    content: `Search Results for '${query}':\n\n${resultList}\n\nUse 'demo open <project-id>' to launch a demo`,
    timestamp: new Date(),
    id: generateId(),
  };
}

async function listTechnologies(): Promise<CommandOutput> {
  const projects = await getProjectsData();
  const techSet = new Set<string>();
  projects.forEach((project) => {
    project.technologies.forEach((tech) => techSet.add(tech));
  });
  const technologies = Array.from(techSet).sort();

  if (technologies.length === 0) {
    return {
      type: "info",
      content: "No technologies found.",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  return {
    type: "success",
    content: `Technologies used in projects:\n\n${technologies.join(", ")}\n\nUse 'demo search <technology>' to find projects using a specific technology`,
    timestamp: new Date(),
    id: generateId(),
  };
}

async function listCategories(): Promise<CommandOutput> {
  const projects = await getProjectsData();

  if (projects.length === 0) {
    return {
      type: "success",
      content: "Project Categories:\n\nNo categories found.",
      timestamp: new Date(),
      id: generateId(),
    };
  }

  return {
    type: "success",
    content: `Project Categories:\n\nGeneral (${projects.length} projects)\n\nUse 'demo search <category>' to find projects in a specific category`,
    timestamp: new Date(),
    id: generateId(),
  };
}

function showDemoHelp(): CommandOutput {
  return {
    type: "info",
    content: `Demo Command Help

Available commands:
• demo list                    - List all available projects
• demo open <project-id>       - Open a project demo
• demo search <query>          - Search projects by name, description, or technology
• demo tech                    - List all technologies used in projects
• demo category                - List all project categories
• demo help                    - Show this help message

Examples:
• demo open portfolio-terminal
• demo search react
• demo search api

Use 'demo list' to see all available projects with their IDs`,
    timestamp: new Date(),
    id: generateId(),
  };
}
