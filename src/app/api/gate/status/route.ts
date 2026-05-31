import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

export async function GET(request: NextRequest) {
  return proxyGateRequest({
    method: "GET",
    backendPath: "/api/gate/status",
    request,
  });
}
