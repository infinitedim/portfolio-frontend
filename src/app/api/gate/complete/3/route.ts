import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";
import { getTerminalRefererUrl } from "@/lib/gate/referer-check";

export async function POST(request: NextRequest) {
  const referer = request.headers.get("referer");
  const modifiedRequest = new NextRequest(request, {
    headers: new Headers(request.headers),
  });

  if (referer && referer.includes("/gate/3")) {
    modifiedRequest.headers.set("referer", getTerminalRefererUrl());
  }

  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/complete/3",
    request: modifiedRequest,
    body: "{}",
    forwardReferer: true,
  });
}

