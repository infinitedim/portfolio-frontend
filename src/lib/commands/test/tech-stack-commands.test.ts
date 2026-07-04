import { describe, it, expect, beforeEach } from "vitest";
import { techStackCommand } from "../tech-stack-commands";
import { ProjectMetadataService, ProjectMetadata } from "@/lib/projects/project-metadata";

describe("techStackCommand", () => {
  beforeEach(() => {
    const svc = ProjectMetadataService.getInstance();
    svc["projects"] = [
      {
        id: "p1",
        name: "P1",
        description: "d",
        technologies: ["React", "Node.js"],
        featured: true,
      } as unknown as ProjectMetadata,
    ];
  });

  it("list returns success when technologies exist", async () => {
    const out = await techStackCommand.execute(["list"]);
    expect(out.type).toBe("success");
  });

  it("projects without tech returns error", async () => {
    const out = await techStackCommand.execute(["projects"]);
    expect(out.type).toBe("error");
  });
});
