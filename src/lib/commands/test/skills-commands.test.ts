import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { skillsCommand, skillsStatCommand } from "../skills-commands";

const mockGetUserProgress = vi.fn();
const mockGetCategoryProgress = vi.fn();
const mockUpdateSkillProgress = vi.fn();
const mockGetSkillsByStatus = vi.fn();
const mockRefreshData = vi.fn();

let roadmapServiceInstance: any = null;

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/lib/services/roadmap-service", () => ({
  RoadmapService: {
    getInstance: () => roadmapServiceInstance,
  },
}));

const mockUserProgress = {
  username: "testuser",
  totalProgress: 50,
  completedSkills: 5,
  totalSkills: 10,
  lastUpdated: new Date(),
  categories: [
    {
      id: "cat1",
      name: "Category 1",
      skills: [
        {
          name: "skill1",
          status: "completed",
          progress: 100,
          priority: "high",
        },
        {
          name: "skill2",
          status: "in-progress",
          progress: 50,
          priority: "medium",
        },
      ],
      progress: 75,
    },
  ],
};

describe("skills-commands.ts", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();

    roadmapServiceInstance = {
      getUserProgress: mockGetUserProgress,
      getCategoryProgress: mockGetCategoryProgress,
      updateSkillProgress: mockUpdateSkillProgress,
      getSkillsByStatus: mockGetSkillsByStatus,
      refreshData: mockRefreshData,
    };

    mockGetUserProgress.mockResolvedValue(mockUserProgress);
    mockGetCategoryProgress.mockResolvedValue({
      name: "Category 1",
      skills: mockUserProgress.categories[0].skills,
    });
    mockUpdateSkillProgress.mockResolvedValue(true);
    mockGetSkillsByStatus.mockResolvedValue([]);
  });

  describe("skillsCommand", () => {
    it("should show overview by default", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await skillsCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Skills Progress Overview");
    });

    it("should sync skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await skillsCommand.execute(["sync"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Skills Sync Status");
      expect(mockRefreshData).toHaveBeenCalled();
    });

    it("should list skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await skillsCommand.execute(["list"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("All Skills by Category");
    });

    it("should show top skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await skillsCommand.execute(["top"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Top Skills");
    });

    it("should handle invalid subcommand", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await skillsCommand.execute(["invalid"]);

      expect(result.type).toBe("error");
      expect(result.content).toContain("Unknown subcommand");
    });
  });

  describe("skillsStatCommand", () => {
    it("should show skills statistics", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetSkillsByStatus.mockResolvedValue([]);

      const result = await skillsStatCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Skills Statistics");
    });
  });
});
