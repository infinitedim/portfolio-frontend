import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

/**
 * Proxies puzzle authentication login requests (Levels 1 and 2) to the backend gate service.
 *
 * @param request - The incoming NextRequest containing the level authentication credentials payload.
 * @returns A promise resolving to the proxied NextResponse with session progress cookies.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/login",
    request,
    body,
  });
}
