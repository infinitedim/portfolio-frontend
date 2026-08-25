import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

/**
 * Handles the POST request to complete the gate unlocking process by proxying to the backend.
 *
 * @param request - The incoming Next.js API request containing gate cookies.
 * @returns A promise resolving to the proxied backend response.
 */
export async function POST(request: NextRequest) {
  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/unlock",
    request,
    body: "{}",
  });
}
