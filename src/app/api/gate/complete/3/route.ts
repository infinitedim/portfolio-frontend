import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

/**
 * Proxies the Level 3 challenge completion submission to the backend gate service.
 *
 * @param request - The incoming NextRequest containing the solved challenge secret payload.
 * @returns A promise resolving to the proxied NextResponse indicating level completion status.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/complete/3",
    request,
    body,
  });
}
