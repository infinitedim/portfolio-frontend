import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

/**
 * Proxies puzzle gate status and progress queries to the backend gate service.
 *
 * @param request - The incoming NextRequest containing current session cookies.
 * @returns A promise resolving to the proxied NextResponse with gate unlock and level status.
 */
export async function GET(request: NextRequest) {
  return proxyGateRequest({
    method: "GET",
    backendPath: "/api/gate/status",
    request,
  });
}
