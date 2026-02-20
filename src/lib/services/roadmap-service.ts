import type {
  RoadmapData,
  RoadmapSkill,
  ProgressUpdate,
  RoadmapCategory,
} from "@/types/roadmap";

interface RoadmapApiResponse {
  done: { total: number };
  learning: {
    total: number;
    roadmaps: Array<{
      title: string;
      id: string;
      done: number;
      skipped: number;
      learning: number;
      total: number;
      updatedAt: string;
      roadmapSlug?: string;
    }>;
    bestPractices: Array<{
      title: string;
      id: string;
      done: number;
      total: number;
      updatedAt: string;
    }>;
  };
  streak: {
    count: number;
    firstVisitAt?: string;
    lastVisitAt?: string;
  };
  activities?: unknown[];
  projects?: unknown[];
}

export class RoadmapService {
  private static instance: RoadmapService;
  private progress: RoadmapData | null = null;
  private roadmapData: RoadmapApiResponse | null = null;
  private loaded = false;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private constructor() {}

  

  public static getInstance(): RoadmapService {
    if (!RoadmapService.instance) {
      RoadmapService.instance = new RoadmapService();
    }
    return RoadmapService.instance;
  }

  

  private getApiConfig() {
    if (typeof window === "undefined") {
      return { authToken: null, userId: "infinitedim" };
    }

    const authToken =
      process.env.NEXT_PUBLIC_ROADMAP_AUTH_TOKEN ||
      process.env.ROADMAP_AUTH_TOKEN;
    const userId =
      process.env.NEXT_PUBLIC_ROADMAP_USER_ID ||
      process.env.ROADMAP_USER_ID ||
      "infinitedim";

    if (typeof window !== "undefined") {
      console.log("Roadmap API Config:", {
        hasAuthToken: !!authToken,
        userId,
        envVars: {
          NEXT_PUBLIC_ROADMAP_AUTH_TOKEN:
            !!process.env.NEXT_PUBLIC_ROADMAP_AUTH_TOKEN,
          ROADMAP_AUTH_TOKEN: !!process.env.ROADMAP_AUTH_TOKEN,
          NEXT_PUBLIC_ROADMAP_USER_ID:
            !!process.env.NEXT_PUBLIC_ROADMAP_USER_ID,
          ROADMAP_USER_ID: !!process.env.ROADMAP_USER_ID,
        },
      });
    }

    return { authToken, userId };
  }

  

  private async loadApiData(): Promise<void> {
    
    this.loadFallbackData();
  }

  

  private isValidApiResponse(data: unknown): data is RoadmapApiResponse {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    return (
      typeof obj.done === "object" &&
      obj.done !== null &&
      typeof (obj.done as Record<string, unknown>).total === "number" &&
      typeof obj.learning === "object" &&
      obj.learning !== null &&
      typeof (obj.learning as Record<string, unknown>).total === "number" &&
      Array.isArray((obj.learning as Record<string, unknown>).roadmaps) &&
      Array.isArray((obj.learning as Record<string, unknown>).bestPractices) &&
      typeof obj.streak === "object" &&
      obj.streak !== null &&
      typeof (obj.streak as Record<string, unknown>).count === "number"
    );
  }

  

  private async loadStaticData(): Promise<void> {
    
    this.loadFallbackData();
  }

  

  private parseRoadmapData(): void {
    if (!this.roadmapData) {
      this.loadFallbackData();
      return;
    }

    const categories: RoadmapCategory[] = [];

    this.roadmapData.learning.roadmaps.forEach((roadmap) => {
      const skills: RoadmapSkill[] = [
        {
          id: roadmap.id,
          name: roadmap.title,
          status: roadmap.done > 0 ? "completed" : "not-started",
          category: "Development",
          description: `${roadmap.title} development skills and concepts`,
          progress: Math.round((roadmap.done / roadmap.total) * 100),
          priority: roadmap.learning > 0 ? "high" : "medium",
        },
      ];

      categories.push({
        id: roadmap.id,
        name: roadmap.title,
        description: `${roadmap.title} development roadmap`,
        skills,
        progress: Math.round((roadmap.done / roadmap.total) * 100),
        color: this.getCategoryColor(roadmap.id),
      });
    });

    this.roadmapData.learning.bestPractices.forEach((practice) => {
      const skills: RoadmapSkill[] = [
        {
          id: practice.id,
          name: practice.title,
          status: practice.done > 0 ? "completed" : "not-started",
          category: "Best Practices",
          description: `${practice.title} best practices and guidelines`,
          progress: Math.round((practice.done / practice.total) * 100),
          priority: "high",
        },
      ];

      categories.push({
        id: practice.id,
        name: practice.title,
        description: `${practice.title} best practices`,
        skills,
        progress: Math.round((practice.done / practice.total) * 100),
        color: "#10b981",
      });
    });

    const { userId } = this.getApiConfig();

    this.progress = {
      userId,
      username: userId,
      totalProgress: Math.round((this.roadmapData.done.total / 1000) * 100),
      completedSkills: this.roadmapData.done.total,
      totalSkills: 1000,
      categories,
      lastUpdated: new Date(),
    };
  }

  

  private getCategoryColor(categoryId: string): string {
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
      "frontend-performance": "#10b981",
    };
    return colorMap[categoryId] || "#6366f1";
  }

  

  public async initialize(): Promise<void> {
    if (this.loaded) return;

    if (typeof window !== "undefined") {
      await this.loadApiData();
    } else {
      this.loadFallbackData();
    }

    this.loaded = true;
  }

  

  public async refreshData(): Promise<void> {
    this.loaded = false;
    this.lastFetchTime = 0;
    await this.initialize();
  }

  

  public async getUserProgress(): Promise<RoadmapData> {
    if (!this.loaded) {
      await this.initialize();
    }
    return this.progress!;
  }

  

  public async getCategoryProgress(
    categoryId: string,
  ): Promise<RoadmapCategory | null> {
    const progress = await this.getUserProgress();
    return progress.categories.find((cat) => cat.id === categoryId) || null;
  }

  

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
          if (update.progress !== undefined) {
            skill.progress = update.progress;
          }

          const categoryProgress = Math.round(
            category.skills.reduce((sum, s) => sum + s.progress, 0) /
              category.skills.length,
          );
          category.progress = categoryProgress;

          progress.lastUpdated = new Date();

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Failed to update skill progress:", error);
      return false;
    }
  }

  

  public async getSkill(skillId: string): Promise<RoadmapSkill | null> {
    const progress = await this.getUserProgress();

    for (const category of progress.categories) {
      const skill = category.skills.find((s) => s.id === skillId);
      if (skill) return skill;
    }

    return null;
  }

  

  public async getSkillsByStatus(
    status: "completed" | "in-progress" | "not-started",
  ): Promise<RoadmapSkill[]> {
    const progress = await this.getUserProgress();
    const skills: RoadmapSkill[] = [];

    progress.categories.forEach((category) => {
      skills.push(
        ...category.skills.filter((skill) => skill.status === status),
      );
    });

    return skills;
  }

  

  private calculateProgressPercentage(categories: RoadmapCategory[]): number {
    if (categories.length === 0) return 0;

    const totalProgress = categories.reduce(
      (sum, cat) => sum + cat.progress,
      0,
    );
    return Math.round(totalProgress / categories.length);
  }

  

  private loadFallbackData(): void {
    const { userId } = this.getApiConfig();

    this.progress = {
      userId,
      username: userId,
      totalProgress: 75,
      completedSkills: 43,
      totalSkills: 60,
      categories: [
        {
          id: "frontend",
          name: "Frontend Development",
          description: "Client-side web development technologies",
          skills: [
            {
              id: "react",
              name: "React",
              status: "completed",
              category: "Frontend Development",
              description: "Component-based UI library",
              progress: 85,
              priority: "high",
            },
          ],
          progress: 85,
          color: "#61dafb",
        },
      ],
      lastUpdated: new Date(),
    };
  }
}
