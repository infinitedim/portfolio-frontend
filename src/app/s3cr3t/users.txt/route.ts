import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import {
  applyBackendGateCookies,
  buildGateCookieHeader,
} from "@/lib/gate/gate-proxy";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const cookieHeader = buildGateCookieHeader(cookieStore);

  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(
    `${getServerApiUrl()}/api/gate/challenge/2/users.txt`,
    { cache: "no-store", headers },
  );

  const body = await response.text();

  if (!response.ok) {
    const errorResponse = new NextResponse(body || "Not found", {
      status: response.status,
    });
    applyBackendGateCookies(response, errorResponse);
    return errorResponse;
  }

  const okResponse = new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
  applyBackendGateCookies(response, okResponse);
  return okResponse;
}
