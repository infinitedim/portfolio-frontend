import { proxyGateRequest } from "@/lib/gate/gate-proxy";

export async function GET(request: Request) {
  return proxyGateRequest({
    method: "GET",
    backendPath: "/api/gate/challenge/3/encoded",
    request: request as Parameters<typeof proxyGateRequest>[0]["request"],
  });
}
