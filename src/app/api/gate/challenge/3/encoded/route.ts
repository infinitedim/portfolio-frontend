import { proxyGateRequest } from "@/lib/gate/gate-proxy";

/**
 * Proxies the Level 3 encoded challenge secret request to the backend gate service.
 *
 * @param request - The incoming HTTP Request.
 * @returns A promise resolving to the proxied NextResponse containing the encoded challenge secret.
 */
export async function GET(request: Request) {
  return proxyGateRequest({
    method: "GET",
    backendPath: "/api/gate/challenge/3/encoded",
    request: request as Parameters<typeof proxyGateRequest>[0]["request"],
  });
}
