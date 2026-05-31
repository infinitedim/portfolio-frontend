import { cache } from "react";

import { getApiUrl, getServerApiUrl } from "@/lib/api/get-api-url";

function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return getServerApiUrl();
  }
  return getApiUrl();
}

export interface PortfolioData {
  skills: SkillCategory[];
  projects: Project[];
  experience: Experience[];
  about: AboutInfo;
  lastUpdated: string;
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
  progress: number;
}

export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  projects: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  status: "completed" | "in-progress" | "planned";
  featured: boolean;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string[];
  technologies: string[];
}

export interface AboutInfo {
  name: string;
  title: string;
  bio: string;
  location: string;
  contact: {
    email: string;
    github: string;
    linkedin: string;
    twitter?: string;
  };
}

const CACHE_DURATIONS = {
  SKILLS: 1000 * 60 * 15,
  PROJECTS: 1000 * 60 * 30,
  EXPERIENCE: 1000 * 60 * 60,
  ABOUT: 1000 * 60 * 60 * 24,
} as const;

const STATIC_PROJECTS: Project[] = [
  {
    id: "terminal-portfolio",
    name: "Terminal Portfolio",
    description:
      "Interactive terminal-themed developer portfolio with command-line interface",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React"],
    demoUrl: "https://infinitedim.vercel.app",
    githubUrl: "https://github.com/infinitedim/portfolio",
    status: "completed",
    featured: true,
  },
  {
    id: "ecommerce-platform",
    name: "E-Commerce Platform",
    description:
      "Full-stack online store with payment integration and real-time inventory",
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "JWT"],
    githubUrl: "https://github.com/infinitedim/ecommerce",
    status: "completed",
    featured: true,
  },
  {
    id: "task-management",
    name: "Task Management App",
    description:
      "Collaborative project management tool with real-time features",
    technologies: ["React", "Firebase", "Material-UI", "WebSocket"],
    demoUrl: "https://taskapp-demo.com",
    status: "completed",
    featured: false,
  },
  {
    id: "weather-dashboard",
    name: "Weather Dashboard",
    description: "Beautiful weather app with forecasts and interactive charts",
    technologies: ["React", "OpenWeather API", "Chart.js", "Sass"],
    demoUrl: "https://weather-demo.com",
    status: "completed",
    featured: false,
  },
];

export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  const backendUrl = getBackendUrl();

  try {
    const [skillsRes, projectsRes, experienceRes, aboutRes] =
      await Promise.allSettled([
        fetch(`${backendUrl}/api/portfolio?section=skills`, {
          next: { revalidate: CACHE_DURATIONS.SKILLS / 1000 },
        }),
        fetch(`${backendUrl}/api/portfolio?section=projects`, {
          next: { revalidate: CACHE_DURATIONS.PROJECTS / 1000 },
        }),
        fetch(`${backendUrl}/api/portfolio?section=experience`, {
          next: { revalidate: CACHE_DURATIONS.EXPERIENCE / 1000 },
        }),
        fetch(`${backendUrl}/api/portfolio?section=about`, {
          next: { revalidate: CACHE_DURATIONS.ABOUT / 1000 },
        }),
      ]);

    const skills =
      skillsRes.status === "fulfilled" && skillsRes.value.ok
        ? ((await skillsRes.value.json()).data ?? [])
        : [];

    const projects =
      projectsRes.status === "fulfilled" && projectsRes.value.ok
        ? ((await projectsRes.value.json()).data ?? STATIC_PROJECTS)
        : STATIC_PROJECTS;

    const experience =
      experienceRes.status === "fulfilled" && experienceRes.value.ok
        ? ((await experienceRes.value.json()).data ?? [])
        : [];

    const about =
      aboutRes.status === "fulfilled" && aboutRes.value.ok
        ? ((await aboutRes.value.json()).data ?? getFallbackAboutData())
        : getFallbackAboutData();

    return {
      skills,
      projects,
      experience,
      about,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch portfolio data from backend", {
      error: error instanceof Error ? error.message : String(error),
    });
    return getFallbackPortfolioData();
  }
});

export const getSkillsData = cache(async (): Promise<SkillCategory[]> => {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(`${backendUrl}/api/portfolio?section=skills`, {
      next: { revalidate: CACHE_DURATIONS.SKILLS / 1000 },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data ?? [];
    }
  } catch (error) {
    console.error("Failed to fetch skills data from backend", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [];
});

export const getProjectsData = cache(
  async (limit?: number): Promise<Project[]> => {
    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(
        `${backendUrl}/api/portfolio?section=projects`,
        {
          next: { revalidate: CACHE_DURATIONS.PROJECTS / 1000 },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const projects = normalizeProjects(data.data ?? STATIC_PROJECTS);
        return limit ? projects.slice(0, limit) : projects;
      }
    } catch (error) {
      console.error("Failed to fetch projects data from backend", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return limit
      ? normalizeProjects(STATIC_PROJECTS).slice(0, limit)
      : normalizeProjects(STATIC_PROJECTS);
  },
);

function normalizeProjectStatus(status: unknown): Project["status"] {
  const value = String(status ?? "completed").toLowerCase();
  const map: Record<string, Project["status"]> = {
    active: "completed",
    completed: "completed",
    "in-progress": "in-progress",
    in_progress: "in-progress",
    planned: "planned",
  };
  return map[value] ?? "completed";
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    status: normalizeProjectStatus(project.status),
  };
}

function normalizeProjects(projects: Project[]): Project[] {
  return projects.map(normalizeProject);
}

export const getExperienceData = cache(async (): Promise<Experience[]> => {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(
      `${backendUrl}/api/portfolio?section=experience`,
      {
        next: { revalidate: CACHE_DURATIONS.EXPERIENCE / 1000 },
      },
    );

    if (response.ok) {
      const data = await response.json();
      return data.data ?? [];
    }
  } catch (error) {
    console.error("Failed to fetch experience data from backend", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [];
});

export const getAboutData = cache(async (): Promise<AboutInfo> => {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(`${backendUrl}/api/portfolio?section=about`, {
      next: { revalidate: CACHE_DURATIONS.ABOUT / 1000 },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data ?? getFallbackAboutData();
    }
  } catch (error) {
    console.error("Failed to fetch about data from backend", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return getFallbackAboutData();
});

export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getProjectsData();
  return projects.filter((project) => project.featured);
});

export const getGitHubData = cache(
  async (): Promise<{
    repositories: Array<{
      name: string;
      description: string;
      stars: number;
      forks: number;
      language: string;
      updated: string;
    }>;
    profile: {
      followers: number;
      following: number;
      publicRepos: number;
    };
  }> => {
    const username = process.env.GH_USERNAME || "infinitedim";
    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(
        `${backendUrl}/api/github/stats/${encodeURIComponent(username)}`,
        { next: { revalidate: 1800 } },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const stats = await response.json();
      const repositories = (stats.repositories ?? []).map(
        (repo: {
          name: string;
          description: string | null;
          stars: number;
          forks: number;
          language: string | null;
          updatedAt: string;
        }) => ({
          name: repo.name,
          description: repo.description || "",
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language || "Unknown",
          updated: repo.updatedAt,
        }),
      );

      return {
        repositories,
        profile: {
          followers: stats.profile?.followers ?? 0,
          following: stats.profile?.following ?? 0,
          publicRepos: stats.profile?.publicRepos ?? 0,
        },
      };
    } catch (error) {
      console.error("Failed to fetch GitHub data via backend proxy", {
        error: error instanceof Error ? error.message : String(error),
        component: "SSRDataFetching",
        operation: "getGitHubData",
      });
      return {
        repositories: [],
        profile: { followers: 0, following: 0, publicRepos: 0 },
      };
    }
  },
);

function getFallbackPortfolioData(): PortfolioData {
  return {
    skills: [],
    projects: STATIC_PROJECTS,
    experience: [],
    about: getFallbackAboutData(),
    lastUpdated: new Date().toISOString(),
  };
}

function getFallbackAboutData(): AboutInfo {
  return {
    name: "Dimas Saputra",
    title: "Full-Stack Developer",
    bio: "Passionate full-stack developer with expertise in modern web technologies.",
    location: "Indonesia",
    contact: {
      email: "dragdimas9@gmail.com",
      github: "https://github.com/infinitedim",
      linkedin: "https://linkedin.com/in/infinitedim",
    },
  };
}

export interface RoadmapProgress {
  resourceTitle: string;
  resourceType: string;
  resourceId: string;
  done: number;
  learning: number;
  skipped: number;
  total: number;
  updatedAt: string;
  isFavorite: boolean;
  isCustomResource: boolean;
}

export interface RoadmapDashboard {
  name: string;
  email: string;
  avatar: string;
  headline: string;
  username: string;
  progresses: RoadmapProgress[];
  profileVisibility: string;
  projects: unknown[];
}

export interface RoadmapStreak {
  count: number;
  longestCount: number;
  previousCount: number;
  firstVisitAt: string;
  lastVisitAt: string;
  refByUserCount: number;
}

export interface RoadmapTeam {
  _id: string;
  name: string;
  type: string;
  avatar: string;
  roadmaps: string[];
  memberId: string;
  role: string;
  status: string;
  personalProgressOnly: boolean;
}

export interface RoadmapFavourites {
  roadmapSlugs: string[];
  weeklySubscriptions: string[];
}

const ROADMAP_FETCH_TIMEOUT_MS = 15_000;

export interface RoadmapFetchError {
  status?: number;
  message: string;
}

async function fetchRoadmapBackend(
  path: string,
  revalidateSeconds: number,
): Promise<Response | null> {
  const backendUrl = getBackendUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    ROADMAP_FETCH_TIMEOUT_MS,
  );

  try {
    return await fetch(`${backendUrl}${path}`, {
      next: { revalidate: revalidateSeconds },
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Failed to fetch roadmap backend", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseRoadmapError(response: Response): Promise<RoadmapFetchError> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return { status: response.status, message: body.error };
    }
  } catch {
    // ignore parse errors
  }
  return {
    status: response.status,
    message: `Backend returned HTTP ${response.status}`,
  };
}

export async function getRoadmapDashboardWithError(): Promise<{
  data: RoadmapDashboard | null;
  error: RoadmapFetchError | null;
}> {
  const response = await fetchRoadmapBackend("/api/roadmap/dashboard", 300);
  if (!response) {
    return {
      data: null,
      error: {
        message: `Request timed out after ${ROADMAP_FETCH_TIMEOUT_MS / 1000}s — check BACKEND_URL on Vercel`,
      },
    };
  }
  if (!response.ok) {
    return { data: null, error: await parseRoadmapError(response) };
  }
  return { data: (await response.json()) as RoadmapDashboard, error: null };
}

export const getRoadmapDashboard = cache(
  async (): Promise<RoadmapDashboard | null> => {
    const { data } = await getRoadmapDashboardWithError();
    return data;
  },
);

export const getRoadmapStreak = cache(
  async (): Promise<RoadmapStreak | null> => {
    const response = await fetchRoadmapBackend("/api/roadmap/streak", 300);
    if (!response?.ok) return null;
    return (await response.json()) as RoadmapStreak;
  },
);

export const getRoadmapTeams = cache(async (): Promise<RoadmapTeam[]> => {
  const response = await fetchRoadmapBackend("/api/roadmap/teams", 600);
  if (!response?.ok) return [];
  return (await response.json()) as RoadmapTeam[];
});

export const getRoadmapFavourites = cache(
  async (): Promise<RoadmapFavourites | null> => {
    const response = await fetchRoadmapBackend("/api/roadmap/favourites", 600);
    if (!response?.ok) return null;
    return (await response.json()) as RoadmapFavourites;
  },
);

export async function invalidateCache(section?: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `invalidateCache('${section ?? "all"}') is not implemented. ` +
        "Use revalidatePath / revalidateTag in a Server Action instead.",
    );
  }

  console.warn(
    `[invalidateCache] Called with section='${
      section ?? "all"
    }' but no-op implementation is active. Wire up revalidatePath/revalidateTag.`,
  );
}

export async function checkDataHealth(): Promise<{
  api: boolean;
  github: boolean;
  lastCheck: string;
}> {
  const backendUrl = getBackendUrl();
  const username = process.env.GH_USERNAME || "infinitedim";

  try {
    const [apiCheck, githubCheck] = await Promise.allSettled([
      fetch(`${backendUrl}/api/portfolio?section=about`),
      fetch(`${backendUrl}/api/github/stats/${encodeURIComponent(username)}`),
    ]);

    return {
      api: apiCheck.status === "fulfilled" && apiCheck.value.ok,
      github: githubCheck.status === "fulfilled" && githubCheck.value.ok,
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      api: false,
      github: false,
      lastCheck: new Date().toISOString(),
    };
  }
}
