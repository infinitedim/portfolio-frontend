import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/login",
    request,
    body,
  });
}
