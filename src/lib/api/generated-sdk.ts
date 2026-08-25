/**
 * Response payload structure returned by the system health check endpoint.
 *
 * @interface HealthCheckResponse
 * @property {"ok" | "degraded" | "error"} status - Overall health status of the service.
 * @property {string} [database] - Status string for database connection.
 * @property {string} [redis] - Status string for Redis cache connection.
 * @property {number} [uptimeSeconds] - Service uptime in seconds.
 */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  database?: string;
  redis?: string;
  uptimeSeconds?: number;
}

/**
 * Representation of a portfolio project item.
 *
 * @interface PortfolioProject
 * @property {string} id - Unique identifier for the project.
 * @property {string} title - Project title / display name.
 * @property {string} description - Brief summary or description of the project.
 * @property {string[]} tags - Categorical keywords or tech stack tags.
 * @property {string} [githubUrl] - Optional URL pointing to the GitHub repository.
 * @property {string} [liveUrl] - Optional URL to the live deployment / demo.
 * @property {boolean} featured - Indicates whether the project is featured prominently.
 */
export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

/**
 * Response payload returned by the gate challenge status endpoint.
 *
 * @interface GateStatusResponse
 * @property {boolean} unlocked - Whether the security gate challenge has been unlocked.
 * @property {number} currentLevel - Current progression level achieved.
 */
export interface GateStatusResponse {
  unlocked: boolean;
  currentLevel: number;
}

/**
 * Type map defining strongly typed endpoint routes, supported HTTP methods, and their response models.
 *
 * @interface ApiRoutesMap
 */
export interface ApiRoutesMap {
  "/health": { GET: { response: HealthCheckResponse } };
  "/api/gate/status": { GET: { response: GateStatusResponse } };
  "/api/portfolio": { GET: { response: PortfolioProject[] } };
}

/**
 * Creates a strongly typed API client for interacting with backend endpoints.
 * Provides end-to-end type safety for request paths and response data.
 *
 * @param baseUrl - The base URL for the backend API.
 * @returns Typed API client object exposing typed HTTP method helpers.
 *
 * @example
 * ```ts
 * const api = createTypedApiClient("https://api.example.com");
 * const health = await api.get("/health");
 * console.log(health.status);
 * ```
 */
export function createTypedApiClient(baseUrl: string = "http://localhost:8080") {
  return {
    /**
     * Performs a type-safe HTTP GET request to the specified API route.
     *
     * @param path - The relative endpoint path.
     * @param init - Optional standard fetch request configuration.
     * @returns Promise resolving to the typed endpoint response.
     * @throws Throws an error if the HTTP response is not ok.
     */
    async get<K extends keyof ApiRoutesMap>(
      path: K,
      init?: RequestInit,
    ): Promise<ApiRoutesMap[K]["GET"]["response"]> {
      const url = `${baseUrl}${path}`;
      const res = await fetch(url, { ...init, method: "GET" });
      if (!res.ok) {
        throw new Error(`API error ${res.status} for ${path}`);
      }
      return (await res.json()) as ApiRoutesMap[K]["GET"]["response"];
    },
  };
}
