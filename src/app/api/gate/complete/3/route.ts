import { NextRequest } from "next/server";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";
import { getTerminalRefererUrl } from "@/lib/gate/referer-check";

export async function POST(request: NextRequest) {
  const referer = request.headers.get("referer");
  const modifiedHeaders = new Headers(request.headers);

  if (referer && referer.includes("/gate/3")) {
    modifiedHeaders.set("referer", getTerminalRefererUrl());
  }

  const fakeRequest = {
    headers: modifiedHeaders,
  } as unknown as NextRequest;

  return proxyGateRequest({
    method: "POST",
    backendPath: "/api/gate/complete/3",
    request: fakeRequest,
    body: "{}",
    forwardReferer: true,
  });
}

