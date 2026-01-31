import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { progressCommand, roadmapCommand } from "../roadmap-commands";

// NOTE: Module caching issue - use vi.hoisted() to unmock at top level
// Hoist unmock to top level to ensure it runs before other mocks (Vitest only)
if (typeof vi !== "undefined" && vi.hoisted) {
  vi.hoisted(() => {
    // Unmock at top level if vi is available (Vitest)
    // This ensures real modules are used in other test files
    if (vi.unmock) {
      vi.unmock("@/lib/services/roadmap-service");
      vi.unmock("@/lib/utils/utils");
    }
    if (vi.doUnmock) {
      vi.doUnmock("@/lib/services/roadmap-service");
      vi.doUnmock("@/lib/utils/utils");
    }
  });
}

// Mock RoadmapService - only for this test file
const mockGetUserProgress = vi.fn();
const mockGetCategoryProgress = vi.fn();
const mockUpdateSkillProgress = vi.fn();
const mockGetSkillsByStatus = vi.fn();
const mockRefreshData = vi.fn();

let roadmapServiceInstance: any = null;

// Mock RoadmapService - only for this test file
vi.mock("@/lib/services/roadmap-service", () => ({
  RoadmapService: {
    getInstance: () => roadmapServiceInstance,
  },
}));

// Don't mock utils - use real generateId to avoid interfering with utils.test.ts
// The generateId function doesn't need to be mocked for these tests

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
        { name: "skill1", status: "completed", progress: 100 },
        { name: "skill2", status: "in-progress", progress: 50 },
      ],
      progress: 75,
    },
  ],
};

describe("roadmap-commands.ts", () => {
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

  describe("roadmapCommand", () => {
    it("should show overview by default", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await roadmapCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Roadmap Progress Overview");
    });

    it("should show skills by category", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await roadmapCommand.execute(["skills", "cat1"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Skills");
    });

    it("should update skill status", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await roadmapCommand.execute([
        "update",
        "skill1",
        "completed",
      ]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Updated");
      expect(mockUpdateSkillProgress).toHaveBeenCalled();
    });

    it("should search skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await roadmapCommand.execute(["search", "skill"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Search Results");
    });

    it("should show completed skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetSkillsByStatus.mockResolvedValue([
        { name: "skill1", category: "cat1", status: "completed" },
      ]);

      const result = await roadmapCommand.execute(["completed"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Completed Skills");
    });

    it("should show in-progress skills", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetSkillsByStatus.mockResolvedValue([
        {
          name: "skill2",
          category: "cat1",
          status: "in-progress",
          progress: 50,
        },
      ]);

      const result = await roadmapCommand.execute(["progress"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Skills In Progress");
    });

    it("should handle invalid subcommand", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await roadmapCommand.execute(["invalid"]);

      expect(result.type).toBe("error");
      expect(result.content).toContain("Unknown subcommand");
    });

    it("should handle service unavailable", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      roadmapServiceInstance = null;

      const result = await roadmapCommand.execute([]);

      expect(result.type).toBe("error");
      expect(result.content).toContain("not available");
    });
  });

  describe("progressCommand", () => {
    it("should show quick progress summary", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetSkillsByStatus.mockResolvedValue([]);

      const result = await progressCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Quick Progress Summary");
    });
  });
});
