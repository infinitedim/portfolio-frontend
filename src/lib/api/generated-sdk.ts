/**
 * AUTO-GENERATED API SDK CONTRACT (Rust Axum utoipa -> Bun TypeScript)
 * Generated at: 2026-08-22T14:50:50.353Z
 * Source OpenAPI: Fetched live from backend
 */

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  database?: string;
  redis?: string;
  uptimeSeconds?: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

export interface GateStatusResponse {
  unlocked: boolean;
  currentLevel: number;
}

export interface ApiRoutesMap {
  "/health": { GET: { response: HealthCheckResponse } };
  "/api/gate/status": { GET: { response: GateStatusResponse } };
  "/api/portfolio": { GET: { response: PortfolioProject[] } };
}

export function createTypedApiClient(baseUrl: string = "http://localhost:8080") {
  return {
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
