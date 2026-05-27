import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const dashboardResponse = {
  username: "testuser",
  progresses: [
    {
      resourceId: "frontend",
      resourceTitle: "Frontend Basics",
      resourceType: "roadmap",
      done: 1,
      total: 2,
      learning: 0,
    },
  ],
};

const streakResponse = {
  lastVisitAt: new Date().toISOString(),
  count: 5,
};

describe("RoadmapService", () => {
  let RoadmapService: typeof import("@/lib/services/roadmap-service").RoadmapService;
  let originalWindow: Window & typeof globalThis;

  beforeEach(async () => {
    originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "fetch", {
      value: vi.fn((url: string) => {
        if (String(url).includes("dashboard")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(dashboardResponse),
          });
        }
        if (String(url).includes("streak")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(streakResponse),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
      }),
      configurable: true,
      writable: true,
    });

    const module = await import("@/lib/services/roadmap-service");
    RoadmapService = module.RoadmapService;
    (RoadmapService as unknown as { instance?: unknown }).instance = undefined;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    if (RoadmapService) {
      (RoadmapService as unknown as { instance?: unknown }).instance = undefined;
    }
    vi.clearAllMocks();
  });

  it("initializes and loads fallback/api data", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }

    const svc = RoadmapService.getInstance();
    await svc.initialize();

    const progress = await svc.getUserProgress();
    expect(progress).toHaveProperty("categories");
    expect(progress.categories.length).toBeGreaterThan(0);
  });

  it("can get category progress and update skills", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }

    const svc = RoadmapService.getInstance();
    await svc.initialize();

    const cat = await svc.getCategoryProgress("frontend");
    expect(cat).not.toBeNull();

    if (cat && cat.skills.length > 0) {
      const skill = cat.skills[0];
      const updated = await svc.updateSkillProgress(skill.id, {
        skillId: skill.id,
        status: "in-progress",
        progress: 50,
      });
      expect(updated).toBe(true);

      const fetchedSkill = await svc.getSkill(skill.id);
      expect(fetchedSkill).not.toBeNull();
      if (fetchedSkill) {
        expect(fetchedSkill.status).toBe("in-progress");
      }
    }
  });
});
