import { describe, it, beforeEach, expect, vi } from "vitest";
import { demoCommand, setDemoCallback } from "../demo-commands";
import { ProjectMetadataService, ProjectMetadata } from "@/lib/projects/project-metadata";

describe("demoCommand", () => {
  beforeEach(() => {
    const svc = ProjectMetadataService.getInstance();

    svc["projects"] = [
      {
        id: "p1",
        name: "Proj1",
        description: "Project description",
        technologies: ["React", "TypeScript"],
        tags: ["web", "frontend"],
        demoUrl: "https://demo.example.com",
        featured: true,
        category: "web-app",
      },
      {
        id: "p2",
        name: "Proj2",
        description: "Second project",
        technologies: ["Node.js"],
        tags: ["backend", "api"],
        demoUrl: "",
        featured: false,
        category: "api",
      },
    ] as unknown as ProjectMetadata[];
  });

  describe("list action", () => {
    it("returns info about projects", async () => {
      const out = await demoCommand.execute(["list"]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Available Projects");
    });

    it("shows project names in list", async () => {
      const out = await demoCommand.execute(["list"]);
      expect(out.content as string).toContain("Proj1");
    });

    it("shows technologies in list", async () => {
      const out = await demoCommand.execute(["list"]);
      expect(out.content as string).toContain("React");
    });

    it("returns info when no projects available", async () => {
      const svc = ProjectMetadataService.getInstance();
      svc["projects"] = [];

      const out = await demoCommand.execute(["list"]);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("No projects found");
    });
  });

  describe("open action", () => {
    it("returns error without project id", async () => {
      const out = await demoCommand.execute(["open"]);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("provide a project ID");
    });

    it("opens project with valid id and demo url", async () => {
      const callback = vi.fn();
      setDemoCallback(callback);

      const out = await demoCommand.execute(["open", "p1"]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Opening demo");
      expect(callback).toHaveBeenCalledWith("p1");
    });

    it("returns error for non-existent project", async () => {
      const out = await demoCommand.execute(["open", "nonexistent"]);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("not found");
    });

    it("returns error when project has no demo url", async () => {
      const out = await demoCommand.execute(["open", "p2"]);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("not available");
    });
  });

  describe("search action", () => {
    it("returns error without query", async () => {
      const out = await demoCommand.execute(["search"]);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("provide a search query");
    });

    it("returns search results for matching query", async () => {
      const out = await demoCommand.execute(["search", "React"]);
      expect(["success", "info"]).toContain(out.type);
    });

    it("returns info when no results found", async () => {
      const out = await demoCommand.execute([
        "search",
        "nonexistenttech",
      ]);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("No projects found");
    });
  });

  describe("tech action", () => {
    it("lists technologies used in projects", async () => {
      const out = await demoCommand.execute(["tech"]);
      expect(["success", "info"]).toContain(out.type);
    });
  });

  describe("category action", () => {
    it("lists project categories", async () => {
      const out = await demoCommand.execute(["category"]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Categories");
    });
  });

  describe("help action", () => {
    it("shows help when help action used", async () => {
      const out = await demoCommand.execute(["help"]);
      expect(out.type).toBe("info");
      expect(out.content as string).toContain("Demo Command Help");
    });

    it("shows help when no action provided", async () => {
      const out = await demoCommand.execute([]);
      expect(out.type).toBe("info");
    });
  });

  describe("unknown action", () => {
    it("returns error for unknown action", async () => {
      const out = await demoCommand.execute(["unknown"]);
      expect(out.type).toBe("error");
      expect(out.content as string).toContain("Unknown demo action");
    });
  });
});
