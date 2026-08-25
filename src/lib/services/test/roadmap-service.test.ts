import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RoadmapService } from "../roadmap-service";

let mockFetchHandler: (url: string) => Promise<unknown> = async () => null;

mock.module("@/lib/crypto/encrypted-fetch", () => ({
  encryptedFetch: async <T>(url: string): Promise<T | null> => {
    return (await mockFetchHandler(url)) as T | null;
  },
}));

describe("roadmap-service", () => {
  beforeEach(() => {
    mockFetchHandler = async () => null;
  });

  it("getInstance should return singleton RoadmapService instance", () => {
    const instance1 = RoadmapService.getInstance();
    const instance2 = RoadmapService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("initialize should load dashboard and streak data", async () => {
    const service = RoadmapService.getInstance();
    const mockDashboard = {
      username: "infinitedim",
      progresses: [
        {
          resourceId: "react",
          resourceTitle: "React",
          resourceType: "frontend",
          done: 10,
          total: 10,
          learning: 0,
        },
        {
          resourceId: "typescript",
          resourceTitle: "TypeScript",
          resourceType: "language",
          done: 5,
          total: 10,
          learning: 2,
        },
      ],
    };

    const mockStreak = {
      lastVisitAt: new Date().toISOString(),
      streakCount: 5,
    };

    mockFetchHandler = async (url: string) => {
      if (url.includes("dashboard")) return mockDashboard;
      if (url.includes("streak")) return mockStreak;
      return null;
    };

    await service.refreshData();
    const userProgress = await service.getUserProgress();

    expect(userProgress.username).toBe("infinitedim");
    expect(userProgress.completedSkills).toBe(15);
    expect(userProgress.totalSkills).toBe(20);

    const stats = await service.getStatistics();
    expect(stats.totalSkills).toBe(20);
    expect(stats.completedSkills).toBe(15);

    const reactCategory = await service.getCategoryProgress("react");
    expect(reactCategory?.name).toBe("React");

    const skill = await service.getSkill("react");
    expect(skill?.name).toBe("React");

    const completed = await service.getSkillsByStatus("completed");
    expect(completed.length).toBeGreaterThan(0);

    const updated = await service.updateSkillProgress("react", { skillId: "react", status: "completed", progress: 100 });
    expect(updated).toBe(true);
  });

  it("loadFallbackData should handle API failure gracefully", async () => {
    const service = RoadmapService.getInstance();
    mockFetchHandler = async () => null;

    await service.refreshData();
    const progress = await service.getUserProgress();
    expect(progress.username).toBe("infinitedim");
  });
});
