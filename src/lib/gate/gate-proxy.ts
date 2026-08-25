import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/lib/api/get-api-url";

/**
 * List of cookie keys managed and forwarded by the portfolio gate system.
 */
const GATE_COOKIE_NAMES = ["gate_progress", "portfolio_gate"] as const;

/**
 * Type alias for valid gate cookie identifiers.
 */
type GateCookieName = (typeof GATE_COOKIE_NAMES)[number];

/**
 * Type guard determining whether a given cookie name matches a known gate cookie identifier.
 * @param name - Cookie name to test.
 * @returns True if the name is a known GateCookieName, false otherwise.
 */
function isGateCookieName(name: string): name is GateCookieName {
  return (GATE_COOKIE_NAMES as readonly string[]).includes(name);
}

/**
 * Constructs a serialized HTTP `Cookie` header string from Next.js server cookie store containing only gate-related cookies.
 * @param store - Read-only or mutable Next.js server cookie store instance.
 * @returns Semicolon-delimited cookie header string.
 */
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

/**
 * Extracts the cookie value from a raw `Set-Cookie` HTTP header string.
 * @param setCookie - Raw `Set-Cookie` header value.
 * @returns The extracted cookie value string, or null if malformed.
 */
function parseSetCookieValue(setCookie: string): string | null {
  const eq = setCookie.indexOf("=");
  if (eq <= 0) return null;
  const semi = setCookie.indexOf(";", eq);
  return semi === -1 ? setCookie.slice(eq + 1) : setCookie.slice(eq + 1, semi);
}

/**
 * Parses the `Max-Age` attribute in seconds from a raw `Set-Cookie` header string.
 * @param setCookie - Raw `Set-Cookie` header value.
 * @returns Parsed max age in seconds, or undefined if absent or invalid.
 */
function parseMaxAge(setCookie: string): number | undefined {
  const match = setCookie.match(/Max-Age=(\d+)/i);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Inspects `Set-Cookie` headers from the backend response and mirrors gate session cookies onto the Next.js client response.
 * @param backendResponse - The Response object received from the backend gate service.
 * @param nextResponse - The outgoing NextResponse being prepared for the client.
 */
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

/**
 * Configuration options for proxying Next.js Route Handler requests to the upstream Gate backend.
 */
interface ProxyGateOptions {
  /**
   * HTTP method (e.g. 'GET', 'POST').
   */
  method: string;
  /**
   * Relative backend path (e.g. '/api/gate/login').
   */
  backendPath: string;
  /**
   * Incoming NextRequest object from the route handler.
   */
  request: NextRequest;
  /**
   * Optional serialized JSON body payload to send upstream.
   */
  body?: string;
  /**
   * Whether to propagate the incoming request's `Referer` header to the backend.
   */
  forwardReferer?: boolean;
}

/**
 * Forwards an incoming Next.js API route request to the backend gate service, passing session cookies and relaying responses and Set-Cookie headers.
 * @param options - Proxy configuration options including method, path, request, body, and referer flag.
 * @returns A promise resolving to a NextResponse mirroring backend payload, status, headers, and cookies.
 */
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
