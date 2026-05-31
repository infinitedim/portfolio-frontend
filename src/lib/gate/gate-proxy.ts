import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";

export const GATE_COOKIE_NAMES = ["gate_progress", "portfolio_gate"] as const;

type GateCookieName = (typeof GATE_COOKIE_NAMES)[number];

function isGateCookieName(name: string): name is GateCookieName {
  return (GATE_COOKIE_NAMES as readonly string[]).includes(name);
}

export function buildGateCookieHeader(
  store: Awaited<ReturnType<typeof cookies>>,
): string {
  return GATE_COOKIE_NAMES.map((name) => {
    const value = store.get(name)?.value;
    return value ? `${name}=${value}` : null;
  })
    .filter((part): part is string => part !== null)
    .join("; ");
}

function parseSetCookieValue(setCookie: string): string | null {
  const eq = setCookie.indexOf("=");
  if (eq <= 0) return null;
  const semi = setCookie.indexOf(";", eq);
  return semi === -1
    ? setCookie.slice(eq + 1)
    : setCookie.slice(eq + 1, semi);
}

function parseMaxAge(setCookie: string): number | undefined {
  const match = setCookie.match(/Max-Age=(\d+)/i);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Re-home backend Set-Cookie headers onto the frontend origin (same-site). */
export function applyBackendGateCookies(
  backendResponse: Response,
  nextResponse: NextResponse,
): void {
  const setCookies =
    typeof backendResponse.headers.getSetCookie === "function"
      ? backendResponse.headers.getSetCookie()
      : [];

  for (const header of setCookies) {
    const name = header.split("=")[0]?.trim();
    if (!name || !isGateCookieName(name)) continue;

    const value = parseSetCookieValue(header);
    if (!value) continue;

    nextResponse.cookies.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: parseMaxAge(header),
    });
  }
}

interface ProxyGateOptions {
  method: string;
  backendPath: string;
  request: NextRequest;
  body?: string;
  forwardReferer?: boolean;
}

export async function proxyGateRequest(
  options: ProxyGateOptions,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const cookieHeader = buildGateCookieHeader(cookieStore);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (options.forwardReferer) {
    const referer = options.request.headers.get("referer");
    if (referer) {
      headers.Referer = referer;
    }
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(
      `${getServerApiUrl()}${options.backendPath}`,
      {
        method: options.method,
        headers,
        body: options.body,
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Gate backend unreachable" },
      { status: 502 },
    );
  }

  const responseBody = await backendResponse.text();
  const nextResponse = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });

  applyBackendGateCookies(backendResponse, nextResponse);
  return nextResponse;
}
