import { describe, it, expect, beforeEach, jest, mock } from "bun:test";
import { techStackCommand } from "../tech-stack-commands";

const mockProjects = [
  {
    id: "p1",
    name: "P1",
    description: "d",
    technologies: ["React", "Node.js"],
    featured: true,
    status: "completed" as const,
  },
];

mock.module("@/lib/data/data-fetching", () => ({
  getProjectsData: jest.fn(async () => mockProjects),
}));

describe("techStackCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
