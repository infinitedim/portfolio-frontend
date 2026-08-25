import type {
  RoadmapData,
  RoadmapSkill,
  ProgressUpdate,
  RoadmapCategory,
} from "@/types/roadmap";
import type { RoadmapDashboard, RoadmapStreak } from "@/lib/data/data-fetching";

/**
 * Executes a network fetch for roadmap data, using encrypted fetch in client or direct fetch on server.
 *
 * @template T - Expected JSON response payload type.
 * @param url - Full target endpoint URL.
 * @returns Promise resolving to parsed data or null on failure.
 */
async function apiFetch<T>(url: string): Promise<T | null> {
  try {
    if (typeof window === "undefined") {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } else {
      const { encryptedFetch } = await import("@/lib/crypto/encrypted-fetch");
      return encryptedFetch<T>(url);
    }
  } catch {
    return null;
  }
}

/**
 * Singleton service for fetching, caching, and updating developer roadmap skills and progress.
 */
export class RoadmapService {
  /** Singleton instance reference. */
  private static instance: RoadmapService;
  /** Cached roadmap data state. */
  private progress: RoadmapData | null = null;
  /** Flag indicating whether roadmap data has been loaded. */
  private loaded = false;
  /** In-memory cache validity duration in milliseconds (5 minutes). */
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  /** Timestamp when roadmap data was last fetched. */
  private lastFetchTime = 0;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Retrieves the global singleton instance of RoadmapService.
   *
   * @returns The singleton RoadmapService instance.
   */
  public static getInstance(): RoadmapService {
    if (!RoadmapService.instance) {
      RoadmapService.instance = new RoadmapService();
    }
    return RoadmapService.instance;
  }

  /**
   * Resolves the full URL for a specific roadmap API endpoint path.
   *
   * @param path - Relative roadmap endpoint subpath.
   * @returns Complete API URL string.
   */
  private roadmapUrl(path: string): string {
    const base =
      typeof window === "undefined"
        ? (process.env.BACKEND_URL ??
          process.env.NEXT_PUBLIC_API_URL ??
          "http://localhost:8080")
        : (process.env.NEXT_PUBLIC_API_URL ?? "");
    return `${base}/api/roadmap/${path}`;
  }

  /**
   * Helper method to perform an API GET request for roadmap data.
   *
   * @template T - Expected response type.
   * @param path - Endpoint subpath to query.
   * @returns Promise resolving to parsed data or null.
   */
  private async get<T>(path: string): Promise<T | null> {
    return apiFetch<T>(this.roadmapUrl(path));
  }

  /**
   * Resolves a hex color representation for a roadmap category or skill topic.
   *
   * @param id - Category identifier.
   * @returns Hex color string.
   */
  private getCategoryColor(id: string): string {
    const colorMap: Record<string, string> = {
      react: "#61dafb",
      javascript: "#f7df1e",
      typescript: "#3178c6",
      frontend: "#61dafb",
      backend: "#339933",
      flutter: "#02569b",
      nodejs: "#339933",
      "full-stack": "#764abc",
      "cyber-security": "#ff6b6b",
      docker: "#2496ed",
      devops: "#326ce5",
      "code-review": "#8b5cf6",
      "design-system": "#f59e0b",
    };
    return colorMap[id] ?? "#6366f1";
  }

  /**
   * Fetches latest roadmap dashboard and streak data from the backend API.
   *
   * @returns Promise resolving when data is loaded into cache.
   */
  private async loadApiData(): Promise<void> {
    const now = Date.now();
    if (this.loaded && now - this.lastFetchTime < this.CACHE_DURATION) return;

    const [dashboard, streak] = await Promise.all([
      this.get<RoadmapDashboard>("dashboard"),
      this.get<RoadmapStreak>("streak"),
    ]);

    if (!dashboard) {
      this.loadFallbackData();
      return;
    }

    const categories: RoadmapCategory[] = dashboard.progresses.map((p) => {
      const progressPct =
        p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
      const skill: RoadmapSkill = {
        id: p.resourceId,
        name: p.resourceTitle,
        category: p.resourceType,
        description: `${p.resourceTitle} roadmap`,
        status:
          progressPct === 100
            ? "completed"
            : p.learning > 0
              ? "in-progress"
              : "not-started",
        progress: progressPct,
        priority: p.learning > 0 ? "high" : progressPct > 50 ? "medium" : "low",
      };
      return {
        id: p.resourceId,
        name: p.resourceTitle,
        description: `${p.resourceTitle} roadmap progress`,
        skills: [skill],
        progress: progressPct,
        color: this.getCategoryColor(p.resourceId),
      };
    });

    const totalDone = dashboard.progresses.reduce((s, p) => s + p.done, 0);
    const totalItems = dashboard.progresses.reduce((s, p) => s + p.total, 0);
    const overallPct =
      totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    this.progress = {
      userId: dashboard.username,
      username: dashboard.username,
      totalProgress: overallPct,
      completedSkills: totalDone,
      totalSkills: totalItems,
      categories,
      lastUpdated: streak ? new Date(streak.lastVisitAt) : new Date(),
    };

    this.loaded = true;
    this.lastFetchTime = now;
  }

  /**
   * Initializes roadmap data loading if not already cached.
   *
   * @returns Promise resolving when initialization is complete.
   */
  public async initialize(): Promise<void> {
    await this.loadApiData();
  }

  /**
   * Forces a cache invalidation and re-fetches roadmap data.
   *
   * @returns Promise resolving when data has refreshed.
   */
  public async refreshData(): Promise<void> {
    this.loaded = false;
    this.lastFetchTime = 0;
    await this.initialize();
  }

  /**
   * Retrieves full user roadmap progress data, fetching from API if needed.
   *
   * @returns Promise resolving to the user's RoadmapData object.
   */
  public async getUserProgress(): Promise<RoadmapData> {
    if (!this.loaded) await this.initialize();
    return this.progress!;
  }

  /**
   * Retrieves progress details for a specific category ID.
   *
   * @param categoryId - Unique category identifier.
   * @returns Promise resolving to the RoadmapCategory object or null if not found.
   */
  public async getCategoryProgress(
    categoryId: string,
  ): Promise<RoadmapCategory | null> {
    const progress = await this.getUserProgress();
    return progress.categories.find((cat) => cat.id === categoryId) ?? null;
  }

  /**
   * Calculates overall aggregate skill statistics across all categories.
   *
   * @returns Promise resolving to skill totals, completed counts, in-progress counts, and category totals.
   */
  public async getStatistics(): Promise<{
    totalSkills: number;
    completedSkills: number;
    inProgressSkills: number;
    categories: number;
  }> {
    const progress = await this.getUserProgress();
    const inProgressSkills = progress.categories.reduce(
      (total, cat) =>
        total +
        cat.skills.filter((skill) => skill.status === "in-progress").length,
      0,
    );
    return {
      totalSkills: progress.totalSkills,
      completedSkills: progress.completedSkills,
      inProgressSkills,
      categories: progress.categories.length,
    };
  }

  /**
   * Updates the completion status or percentage progress of an individual skill.
   *
   * @param skillId - Identifier of the skill to update.
   * @param update - Progress and status update values.
   * @returns Promise resolving to true if skill was found and updated, otherwise false.
   */
  public async updateSkillProgress(
    skillId: string,
    update: ProgressUpdate,
  ): Promise<boolean> {
    try {
      const progress = await this.getUserProgress();
      for (const category of progress.categories) {
        const skill = category.skills.find((s) => s.id === skillId);
        if (skill) {
          skill.status = update.status;
          if (update.progress !== undefined) skill.progress = update.progress;
          category.progress = Math.round(
            category.skills.reduce((sum, s) => sum + s.progress, 0) /
              category.skills.length,
          );
          progress.lastUpdated = new Date();
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves a single skill object by its identifier.
   *
   * @param skillId - Identifier of the skill to locate.
   * @returns Promise resolving to the matching RoadmapSkill or null.
   */
  public async getSkill(skillId: string): Promise<RoadmapSkill | null> {
    const progress = await this.getUserProgress();
    for (const category of progress.categories) {
      const skill = category.skills.find((s) => s.id === skillId);
      if (skill) return skill;
    }
    return null;
  }

  /**
   * Filters and returns all skills matching a specific progress status.
   *
   * @param status - Target status ('completed', 'in-progress', or 'not-started').
   * @returns Promise resolving to array of matching skills.
   */
  public async getSkillsByStatus(
    status: "completed" | "in-progress" | "not-started",
  ): Promise<RoadmapSkill[]> {
    const progress = await this.getUserProgress();
    return progress.categories.flatMap((cat) =>
      cat.skills.filter((s) => s.status === status),
    );
  }

  /**
   * Populates default fallback roadmap data when API fetching fails.
   */
  private loadFallbackData(): void {
    this.progress = {
      userId: "infinitedim",
      username: "infinitedim",
      totalProgress: 0,
      completedSkills: 0,
      totalSkills: 0,
      categories: [],
      lastUpdated: new Date(),
    };
    this.loaded = true;
  }
}
