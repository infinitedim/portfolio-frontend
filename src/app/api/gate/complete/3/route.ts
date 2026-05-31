import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

export async function POST(request: NextRequest) {
  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/complete/3",
    request,
    body: "{}",
    forwardReferer: true,
  });
}
