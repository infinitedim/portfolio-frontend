import { cache } from "react";

function getBackendUrl(): string {
  if (typeof window === "undefined") {
    
    return (
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3001"
    );
  }
  
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

interface GitHubRepository {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubUser {
  followers: number;
  following: number;
  public_repos: number;
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
    demoUrl: "https://infinitedim.site",
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

async function fetchWithCache<T>(
  url: string,
  options: RequestInit & { cacheTime?: number } = {},
): Promise<T> {
  
  
  const { cacheTime: _cacheTime, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Not Found");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data as T;
  } catch (error) {
    console.error("Fetch error occurred", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: "SSRDataFetching",
      operation: "safeFetch",
    });
    throw error;
  }
}

export const getPortfolioData = cache(async (): Promise<PortfolioData> => {
  const backendUrl = getBackendUrl();

  try {
    
    const [skillsRes, projectsRes, experienceRes, aboutRes] = await Promise.allSettled([
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
        ? (await skillsRes.value.json()).data ?? []
        : [];

    const projects =
      projectsRes.status === "fulfilled" && projectsRes.value.ok
        ? (await projectsRes.value.json()).data ?? STATIC_PROJECTS
        : STATIC_PROJECTS;

    const experience =
      experienceRes.status === "fulfilled" && experienceRes.value.ok
        ? (await experienceRes.value.json()).data ?? []
        : [];

    const about =
      aboutRes.status === "fulfilled" && aboutRes.value.ok
        ? (await aboutRes.value.json()).data ?? getFallbackAboutData()
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
        }
      );

      if (response.ok) {
        const data = await response.json();
        const projects = data.data ?? STATIC_PROJECTS;
        return limit ? projects.slice(0, limit) : projects;
      }
    } catch (error) {
      console.error("Failed to fetch projects data from backend", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    
    return limit ? STATIC_PROJECTS.slice(0, limit) : STATIC_PROJECTS;
  }
);

export const getExperienceData = cache(async (): Promise<Experience[]> => {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(
      `${backendUrl}/api/portfolio?section=experience`,
      {
        next: { revalidate: CACHE_DURATIONS.EXPERIENCE / 1000 },
      }
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

export const getAnalyticsData = cache(
  async (): Promise<{
    pageViews: number;
    uniqueVisitors: number;
    topProjects: string[];
    topSkills: string[];
  }> => {
    return {
      pageViews: 15420,
      uniqueVisitors: 8342,
      topProjects: [
        "terminal-portfolio",
        "ecommerce-platform",
        "task-management",
      ],
      topSkills: ["React", "Next.js", "TypeScript", "Node.js"],
    };
  },
);

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
    const token = process.env.GH_TOKEN;

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Terminal-Portfolio",
      };

      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      const [reposResponse, userResponse] = await Promise.all([
        fetchWithCache(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
          {
            headers,
            cacheTime: 1000 * 60 * 30,
          },
        ),
        fetchWithCache(`https://api.github.com/users/${username}`, {
          headers,
          cacheTime: 1000 * 60 * 60,
        }),
      ]);

      const repositories = (reposResponse as GitHubRepository[]).map(
        (repo) => ({
          name: repo.name,
          description: repo.description || "",
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || "Unknown",
          updated: repo.updated_at,
        }),
      );

      const profile = {
        followers: (userResponse as GitHubUser).followers,
        following: (userResponse as GitHubUser).following,
        publicRepos: (userResponse as GitHubUser).public_repos,
      };

      return { repositories, profile };
    } catch (error) {
      console.error("Failed to fetch GitHub data", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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

  try {
    const [apiCheck, githubCheck] = await Promise.allSettled([
      fetch(`${backendUrl}/api/portfolio?section=about`),
      getGitHubData(),
    ]);

    return {
      api: apiCheck.status === "fulfilled" && apiCheck.value.ok,
      github: githubCheck.status === "fulfilled",
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
