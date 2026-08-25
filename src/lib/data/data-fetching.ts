import { cache } from "react";

import { getApiUrl, getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * Resolves the backend base URL for data fetching depending on execution runtime environment.
 *
 * @returns The resolved backend API base URL string.
 */
function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return getServerApiUrl();
  }
  return getApiUrl();
}

/**
 * Root portfolio data aggregate containing projects, work experience, bio details, and update timestamp.
 */
export interface PortfolioData {
  /** List of featured and standard software portfolio projects. */
  projects: Project[];
  /** Chronological employment and professional experience records. */
  experience: Experience[];
  /** Personal biography and contact information. */
  about: AboutInfo;
  /** ISO-8601 string representing when the portfolio data was last retrieved or refreshed. */
  lastUpdated: string;
}

/**
 * Categorized collection of technical skills with an overall aggregate proficiency score.
 */
export interface SkillCategory {
  /** Name of the skill domain (e.g., 'Frontend', 'Backend', 'DevOps'). */
  name: string;
  /** Array of individual technical competencies belonging to this category. */
  skills: Skill[];
  /** Overall mastery percentage (0 to 100) for this skill group. */
  progress: number;
}

/**
 * Representation of a specific technical skill or technology competency.
 */
export interface Skill {
  /** Name of the technology or skill (e.g., 'TypeScript', 'Rust', 'PostgreSQL'). */
  name: string;
  /** Subjective proficiency classification. */
  level: "beginner" | "intermediate" | "advanced" | "expert";
  /** Cumulative years of practical experience with this technology. */
  yearsOfExperience: number;
  /** Associated portfolio project names demonstrating usage of this skill. */
  projects: string[];
}

/**
 * Primary domain or architectural category of a portfolio project.
 */
export type ProjectCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile-native"
  | "desktop-native"
  | "library";

/**
 * Target operating systems and deployment environments supported by a project.
 */
export type TargetPlatform =
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "web";

/**
 * Performance and quality benchmarks associated with a project.
 */
export interface ProjectMetrics {
  /** 95th percentile latency benchmark (e.g., '< 50ms'). */
  latencyP95?: string;
  /** Test coverage percentage metric (e.g., '92%'). */
  testCoverage?: string;
  /** Google Lighthouse audit score. */
  lighthouseScore?: number;
  /** Architectural pattern classification (e.g., 'Clean Architecture / Modular Monolith'). */
  architectureType?: string;
  /** Service Level Agreement uptime target (e.g., '99.9%'). */
  uptimeSla?: string;
  /** Production JavaScript bundle size metric. */
  bundleSize?: string;
  /** Request throughput benchmark in requests per second. */
  throughputRps?: string;
  /** Compiled binary or application install size. */
  appSize?: string;
  /** Minimum supported OS version. */
  minOsVersion?: string;
  /** Aggregate user download count metric. */
  downloadsCount?: string;
}

/**
 * Key engineering achievement or feature highlight for a project.
 */
export interface ProjectHighlight {
  /** Unique highlight identifier. */
  readonly id: string;
  /** Categorization tag for the highlight (e.g., 'performance', 'security'). */
  readonly category: string;
  /** Summary title of the achievement or feature. */
  readonly title: string;
  /** Detailed technical explanation of the highlight. */
  readonly detail?: string;
}

/**
 * Detailed representation of a software engineering portfolio project.
 */
export interface Project {
  /** Unique project identifier. */
  id: string;
  /** Display title of the project. */
  name: string;
  /** URL-friendly slug for routing. */
  slug: string;
  /** Narrative description of project purpose and architecture. */
  description: string;
  /** Core technologies, languages, and frameworks utilized. */
  technologies: string[];
  /** Architectural domain category. */
  category?: ProjectCategory;
  /** Supported runtime and device platforms. */
  platforms?: TargetPlatform[];
  /** URL to live demo or production deployment. */
  demoUrl?: string;
  /** URL to source code repository on GitHub. */
  githubUrl?: string;
  /** URL to interactive API documentation. */
  apiDocsUrl?: string;
  /** Google Play Store application link. */
  playStoreUrl?: string;
  /** Apple App Store application link. */
  appStoreUrl?: string;
  /** Direct binary or package download link. */
  downloadUrl?: string;
  /** Registry package link (e.g., npm / crates.io). */
  packageUrl?: string;
  /** Hero preview image asset URL. */
  imageUrl?: string;
  /** Architecture diagram asset URL. */
  architectureImageUrl?: string;
  /** Current development lifecycle state. */
  status: "completed" | "in-progress" | "planned";
  /** Flag indicating whether the project is featured prominently on the landing page. */
  featured: boolean;
  /** Performance and reliability benchmark metrics. */
  metrics?: ProjectMetrics;
  /** Key engineering highlights and architectural accomplishments. */
  highlights?: ProjectHighlight[];
}

/**
 * Employment classification type for professional work history.
 */
export type ExperienceType = "intern" | "full-time" | "part-time" | "freelance";

/**
 * Record of professional work experience or employment tenure.
 */
export interface Experience {
  /** Company or organization name. */
  company: string;
  /** Job title or professional role. */
  position: string;
  /** Tenure date range string (e.g., '2022 — Present'). */
  duration: string;
  /** Bullet points describing key responsibilities and impact. */
  description: string[];
  /** Technologies and tools used in this role. */
  technologies: string[];
  /** Contractual employment type. */
  type?: ExperienceType;
}

/**
 * Personal profile details, biography, and contact social links.
 */
export interface AboutInfo {
  /** Full display name. */
  name: string;
  /** Professional job title / headline. */
  title: string;
  /** Biographical summary. */
  bio: string;
  /** Geographic location. */
  location: string;
  /** Direct contact channels and social profiles. */
  contact: {
    /** Primary contact email address. */
    email: string;
    /** GitHub profile URL. */
    github: string;
    /** LinkedIn profile URL. */
    linkedin: string;
    /** Optional Twitter / X profile URL. */
    twitter?: string;
  };
}

/**
 * Cache revalidation TTL durations in milliseconds for portfolio content sections.
 */
const CACHE_DURATIONS = {
  SKILLS: 1000 * 60 * 15,
  PROJECTS: 1000 * 60 * 30,
  EXPERIENCE: 1000 * 60 * 60,
  ABOUT: 1000 * 60 * 60 * 24,
} as const;

/**
 * Fetches comprehensive portfolio data including projects, experience, and bio from the backend API.
 * Uses React request deduplication and Next.js ISR tags.
 *
 * @param locale - I18n locale identifier for localized content retrieval.
 * @returns Promise resolving to the complete portfolio dataset or fallback data upon network failure.
 */
export const getPortfolioData = cache(async (locale: string = "en_US"): Promise<PortfolioData> => {
  const backendUrl = getBackendUrl();

  try {
    const [projectsRes, experienceRes, aboutRes] = await Promise.allSettled([
      fetch(`${backendUrl}/api/portfolio?section=projects`, {
        next: {
          revalidate: CACHE_DURATIONS.PROJECTS / 1000,
          tags: ["portfolio-projects"],
        },
      }),
      fetch(`${backendUrl}/api/portfolio?section=experience&locale=${encodeURIComponent(locale)}`, {
        next: {
          revalidate: CACHE_DURATIONS.EXPERIENCE / 1000,
          tags: ["portfolio-experience"],
        },
      }),
      fetch(`${backendUrl}/api/portfolio?section=about&locale=${encodeURIComponent(locale)}`, {
        next: {
          revalidate: CACHE_DURATIONS.ABOUT / 1000,
          tags: ["portfolio-about"],
        },
      }),
    ]);

    const projects =
      projectsRes.status === "fulfilled" && projectsRes.value.ok
        ? ((await projectsRes.value.json()).data ?? [])
        : [];

    const experience =
      experienceRes.status === "fulfilled" && experienceRes.value.ok
        ? ((await experienceRes.value.json()).data ?? [])
        : [];

    const about =
      aboutRes.status === "fulfilled" && aboutRes.value.ok
        ? ((await aboutRes.value.json()).data ?? getFallbackAboutData())
        : getFallbackAboutData();

    return {
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

/**
 * Fetches and normalizes the list of portfolio projects from the backend API.
 *
 * @param limit - Optional maximum number of project records to return.
 * @returns Promise resolving to an array of normalized project models.
 */
export const getProjectsData = cache(
  async (limit?: number): Promise<Project[]> => {
    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(
        `${backendUrl}/api/portfolio?section=projects`,
        {
          next: {
            revalidate: CACHE_DURATIONS.PROJECTS / 1000,
            tags: ["portfolio-projects"],
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const projects = normalizeProjects(data.data ?? []);
        return limit ? projects.slice(0, limit) : projects;
      }
    } catch (error) {
      console.error("Failed to fetch projects data from backend", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return [];
  },
);

/**
 * Normalizes an unknown status string into a typed project status enum value.
 *
 * @param status - Raw status value from the API.
 * @returns Standardized project status string.
 */
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

/**
 * Generates a URL-friendly slug from a project name.
 *
 * @param name - The project name string.
 * @returns URL-safe kebab-cased slug string.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Normalizes a single project model ensuring valid slug and status fields.
 *
 * @param project - The raw project data object.
 * @returns Normalized project model with valid slug and status.
 */
function normalizeProject(project: Project): Project {
  return {
    ...project,
    slug: project.slug || generateSlug(project.name),
    status: normalizeProjectStatus(project.status),
  };
}

/**
 * Normalizes an array of project models.
 *
 * @param projects - Array of raw project objects.
 * @returns Array of normalized project models.
 */
function normalizeProjects(projects: Project[]): Project[] {
  return projects.map(normalizeProject);
}

/**
 * Fetches localized work experience records from the backend API with fallback defaults.
 *
 * @param locale - Target locale identifier for localized experience descriptions.
 * @returns Promise resolving to an array of professional experience items.
 */
export async function getExperienceData(
  locale: string = "en_US",
): Promise<Experience[]> {
  const backendUrl = getBackendUrl();

  try {
    const i18nResponse = await fetch(
      `${backendUrl}/api/portfolio/experience?locale=${encodeURIComponent(locale)}`,
      {
        next: {
          revalidate: CACHE_DURATIONS.EXPERIENCE / 1000,
          tags: ["portfolio-experience"],
        },
      },
    );

    if (i18nResponse.ok) {
      const data = await i18nResponse.json();
      const result = data.data ?? [];
      if (result.length > 0) return result;
    }
  } // eslint-disable-next-line no-empty
    catch {}

  try {
    const response = await fetch(
      `${backendUrl}/api/portfolio?section=experience`,
      {
        next: {
          revalidate: CACHE_DURATIONS.EXPERIENCE / 1000,
          tags: ["portfolio-experience"],
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      const result = data.data ?? [];
      return result.length > 0 ? result : getFallbackExperienceData();
    }
  } catch (error) {
    console.error("Failed to fetch experience data from backend", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return getFallbackExperienceData();
}

/**
 * Fetches personal biography and contact information for the specified locale.
 *
 * @param locale - Target locale identifier.
 * @returns Promise resolving to the user's about information.
 */
export async function getAboutData(
  locale: string = "en_US",
): Promise<AboutInfo> {
  const backendUrl = getBackendUrl();

  try {
    const response = await fetch(
      `${backendUrl}/api/portfolio?section=about&locale=${encodeURIComponent(locale)}`,
      {
        next: {
          revalidate: CACHE_DURATIONS.ABOUT / 1000,
          tags: ["portfolio-about"],
        },
      },
    );

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
}

/**
 * Retrieves the subset of portfolio projects marked as featured for the showcase.
 *
 * @returns Promise resolving to an array of featured projects.
 */
export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getProjectsData();
  return projects.filter((project) => project.featured);
});

/**
 * Fetches repository statistics and public profile metrics for the configured GitHub account.
 *
 * @returns Promise resolving to GitHub repositories and profile statistics.
 */
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

/**
 * Fetches the GitHub avatar URL for a specified username via the backend proxy.
 *
 * @param username - GitHub username handle (defaults to environment configured user).
 * @returns Promise resolving to the avatar image URL or null if unavailable.
 */
export const getGitHubAvatar = cache(
  async (username?: string): Promise<string | null> => {
    const targetUsername = username || process.env.GH_USERNAME || "infinitedim";
    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(
        `${backendUrl}/api/github/user/${encodeURIComponent(targetUsername)}`,
        { next: { revalidate: 3600 } },
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.avatarUrl || data.avatar_url || null;
    } catch {
      return null;
    }
  },
);

/**
 * Constructs a fallback portfolio data structure for offline or error states.
 *
 * @returns Default fallback PortfolioData object.
 */
function getFallbackPortfolioData(): PortfolioData {
  return {
    projects: [],
    experience: [],
    about: getFallbackAboutData(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Constructs fallback about and biographical information.
 *
 * @returns Default fallback AboutInfo object.
 */
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

/**
 * Constructs fallback professional work experience records.
 *
 * @returns Array of fallback Experience items.
 */
function getFallbackExperienceData(): Experience[] {
  return [
    {
      company: "Freelance",
      position: "Full-Stack Developer",
      duration: "2022 — Present",
      description: [
        "Building modern web applications with React, Next.js, and TypeScript",
        "Developing REST APIs with Rust/Axum and Node.js",
        "Implementing CI/CD pipelines and cloud deployments on GCP",
      ],
      technologies: ["React", "Next.js", "TypeScript", "Rust", "GCP"],
      type: "freelance",
    },
  ];
}

/**
 * Progress tracking metrics for an individual roadmap.sh learning resource.
 */
export interface RoadmapProgress {
  /** Title of the roadmap or skill track. */
  resourceTitle: string;
  /** Resource type indicator (e.g., 'roadmap', 'best-practice'). */
  resourceType: string;
  /** Unique roadmap.sh resource identifier. */
  resourceId: string;
  /** Count of completed topics. */
  done: number;
  /** Count of currently in-progress learning topics. */
  learning: number;
  /** Count of skipped topics. */
  skipped: number;
  /** Total number of topics contained in the roadmap. */
  total: number;
  /** ISO-8601 timestamp when progress was last updated. */
  updatedAt: string;
  /** Flag indicating if this roadmap is bookmarked as favorite. */
  isFavorite: boolean;
  /** Flag indicating if this is a custom user-created roadmap. */
  isCustomResource: boolean;
}

/**
 * Summary dashboard metrics and active roadmaps retrieved from roadmap.sh.
 */
export interface RoadmapDashboard {
  /** User display name on roadmap.sh. */
  name: string;
  /** User email address. */
  email: string;
  /** URL to user profile avatar on roadmap.sh. */
  avatar: string;
  /** Profile headline or bio on roadmap.sh. */
  headline: string;
  /** Public username handle. */
  username: string;
  /** Array of active roadmap progress records. */
  progresses: RoadmapProgress[];
  /** Privacy visibility setting for the user profile. */
  profileVisibility: string;
  /** Associated projects on roadmap.sh. */
  projects: unknown[];
}

/**
 * Learning streak statistics from roadmap.sh.
 */
export interface RoadmapStreak {
  /** Current continuous active learning day streak. */
  count: number;
  /** Longest all-time streak recorded in days. */
  longestCount: number;
  /** Previous streak count prior to the current run. */
  previousCount: number;
  /** ISO-8601 timestamp of first platform visit. */
  firstVisitAt: string;
  /** ISO-8601 timestamp of most recent platform visit. */
  lastVisitAt: string;
  /** Count of user referrals. */
  refByUserCount: number;
}

/**
 * Team organization membership metadata on roadmap.sh.
 */
export interface RoadmapTeam {
  /** Unique team identifier. */
  _id: string;
  /** Team name. */
  name: string;
  /** Team organizational type. */
  type: string;
  /** URL to team avatar image. */
  avatar: string;
  /** List of roadmap slugs assigned to the team. */
  roadmaps: string[];
  /** User membership identifier. */
  memberId: string;
  /** Role within the team. */
  role: string;
  /** Active status of team membership. */
  status: string;
  /** Whether progress is visible only to the user. */
  personalProgressOnly: boolean;
}

/**
 * Bookmarked favorite roadmaps and weekly subscription topics on roadmap.sh.
 */
export interface RoadmapFavourites {
  /** Slugs of favorite roadmaps. */
  roadmapSlugs: string[];
  /** Slugs of weekly newsletter subscriptions. */
  weeklySubscriptions: string[];
}

/**
 * Maximum request timeout in milliseconds for roadmap backend proxy queries.
 */
const ROADMAP_FETCH_TIMEOUT_MS = 20_000;

/**
 * Error structure returned when roadmap data retrieval fails.
 */
export interface RoadmapFetchError {
  /** Optional HTTP status code returned by upstream service. */
  status?: number;
  /** Human-readable error message explaining failure reason. */
  message: string;
}

/**
 * Dispatches a cached fetch request to the backend roadmap proxy with timeout handling.
 *
 * @param path - Relative roadmap API endpoint path.
 * @param revalidateSeconds - ISR cache revalidation duration in seconds.
 * @returns Promise resolving to the fetch Response or null on failure/timeout.
 */
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
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
                                                                                                 
    if (process.env.NODE_ENV === "development") {
      console.warn(`Roadmap fetch failed (${path}): ${detail}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses and formats an error response from the roadmap API endpoint.
 *
 * @param response - The failed HTTP Response object.
 * @returns Promise resolving to a structured RoadmapFetchError object.
 */
async function parseRoadmapError(
  response: Response,
): Promise<RoadmapFetchError> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return { status: response.status, message: body.error };
    }
  } // eslint-disable-next-line no-empty
    catch {}
  return {
    status: response.status,
    message: `Backend returned HTTP ${response.status}`,
  };
}

/**
 * Fetches the user's roadmap.sh dashboard profile and active learning progresses, returning typed error details on failure.
 *
 * @returns Promise resolving to an object with dashboard data or error descriptor.
 */
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

/**
 * Fetches current learning streak metrics from the roadmap.sh backend proxy.
 *
 * @returns Promise resolving to streak statistics or null if unavailable.
 */
export const getRoadmapStreak = cache(
  async (): Promise<RoadmapStreak | null> => {
    const response = await fetchRoadmapBackend("/api/roadmap/streak", 300);
    if (!response?.ok) return null;
    return (await response.json()) as RoadmapStreak;
  },
);

/**
 * Fetches team memberships and assigned roadmaps from roadmap.sh.
 *
 * @returns Promise resolving to an array of roadmap teams.
 */
export const getRoadmapTeams = cache(async (): Promise<RoadmapTeam[]> => {
  const response = await fetchRoadmapBackend("/api/roadmap/teams", 600);
  if (!response?.ok) return [];
  return (await response.json()) as RoadmapTeam[];
});

/**
 * Fetches the user's favorite roadmaps and topic subscriptions from roadmap.sh.
 *
 * @returns Promise resolving to favorite roadmaps data or null.
 */
export const getRoadmapFavourites = cache(
  async (): Promise<RoadmapFavourites | null> => {
    const response = await fetchRoadmapBackend("/api/roadmap/favourites", 600);
    if (!response?.ok) return null;
    return (await response.json()) as RoadmapFavourites;
  },
);

/**
 * Invalidation placeholder for cache purging during server actions.
 *
 * @param section - Optional cache section name to invalidate.
 * @returns Promise resolving when cache invalidation request completes.
 * @throws Error in production environments where revalidatePath / revalidateTag should be used instead.
 */
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

/**
 * Performs a health check on backend portfolio and GitHub proxy API endpoints.
 *
 * @returns Promise resolving to health check statuses and timestamp.
 */
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
