import { describe, it, expect, beforeEach, vi } from "vitest";
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

vi.mock("@/lib/data/data-fetching", () => ({
  getProjectsData: vi.fn(async () => mockProjects),
}));

describe("techStackCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
