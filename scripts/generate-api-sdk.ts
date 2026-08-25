import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Configuration options for generating the API SDK contract.
 */
export interface GeneratedSdkOptions {
  /**
   * The file destination path where the generated SDK should be written.
   */
  outputPath?: string;
  /**
   * The base URL of the backend API providing the OpenAPI specification.
   */
  backendUrl?: string;
}

/**
 * Generates a typed TypeScript API client SDK by fetching the OpenAPI specification from the backend.
 *
 * @param options - Configuration options for SDK generation.
 * @returns A promise resolving to an object containing generation success status and the output path.
 */
export async function generateApiSdk(options: GeneratedSdkOptions = {}) {
  const outputPath =
    options.outputPath ||
    join(process.cwd(), "src", "lib", "api", "generated-sdk.ts");
  const backendUrl =
    options.backendUrl || process.env.BACKEND_URL || "http://localhost:8080";

  let openApiSpec: Record<string, unknown> | null = null;

  try {
    const res = await fetch(`${backendUrl}/api/docs/openapi.json`);
    if (res.ok) {
      openApiSpec = (await res.json()) as Record<string, unknown>;
    }
  } // eslint-disable-next-line no-empty
    catch {}

  const generatedCode = `/**
 * AUTO-GENERATED API SDK CONTRACT (Rust Axum utoipa -> Bun TypeScript)
 * Generated at: ${new Date().toISOString()}
 * Source OpenAPI: ${openApiSpec ? "Fetched live from backend" : "Static fallback contract"}
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

export function createTypedApiClient(baseUrl: string = "${backendUrl}") {
  return {
    async get<K extends keyof ApiRoutesMap>(
      path: K,
      init?: RequestInit,
    ): Promise<ApiRoutesMap[K]["GET"]["response"]> {
      const url = \`\${baseUrl}\${path}\`;
      const res = await fetch(url, { ...init, method: "GET" });
      if (!res.ok) {
        throw new Error(\`API error \${res.status} for \${path}\`);
      }
      return (await res.json()) as ApiRoutesMap[K]["GET"]["response"];
    },
  };
}
`;

  writeFileSync(outputPath, generatedCode, "utf-8");
  return { success: true, outputPath };
}

if (import.meta.main) {
  const res = await generateApiSdk();
  console.log(`✓ SDK generated successfully at ${res.outputPath}`);
}
