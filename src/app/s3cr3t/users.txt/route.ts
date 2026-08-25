import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";
import {
  applyBackendGateCookies,
  buildGateCookieHeader,
} from "@/lib/gate/gate-proxy";

/**
 * Route handler proxy for fetching challenge 2 users list artifact.
 *
 * @description Forwards incoming gate challenge cookie sessions to the backend challenge API
 * (`/api/gate/challenge/2/users.txt`), propagates gate session cookies in response headers,
 * and streams the resulting plain text contents.
 *
 * @async
 * @returns {Promise<NextResponse>} The HTTP response delivering the plain-text file or error status.
 */
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
