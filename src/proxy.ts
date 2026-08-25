import { NextRequest, NextResponse } from "next/server";

/**
 * Parsed browser client metadata.
 */
interface BrowserInfo {
  /** Name of the detected browser (e.g., Chrome, Safari, Edge, Firefox). */
  name: string;
  /** Major version string of the detected browser. */
  version?: string;
}

/**
 * Extension of NextRequest incorporating geographic location metadata provided by edge runtime.
 */
interface NextRequestWithGeo extends NextRequest {
  /** Geographic location details extracted by edge routing. */
  geo?: {
    /** Two-letter ISO country code. */
    country?: string;
    /** Region or state identifier. */
    region?: string;
    /** City name. */
    city?: string;
  };
}

/**
 * Structured logger for edge and proxy middleware execution.
 */
const edgeLogger = {
  /**
   * Logs warning messages with structured JSON payload.
   *
   * @param message - The warning message description.
   * @param fields - Additional metadata fields to log.
   */
  warn(message: string, fields: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "test") return;
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        component: "proxy",
        message,
        ...fields,
      }),
    );
  },
  /**
   * Logs informational messages with structured JSON payload.
   *
   * @param message - The info message description.
   * @param fields - Additional metadata fields to log.
   */
  info(message: string, fields: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "test") return;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        component: "proxy",
        message,
        ...fields,
      }),
    );
  },
};

/** Maximum permitted requests per rate limit time window. */
const RATE_LIMIT = 200;
/** Rate limiting rolling window duration in milliseconds (60 seconds). */
const RATE_LIMIT_WINDOW_MS = 60000;
/** In-memory rate limiting map tracking IP hit counts and expirations. */
const rateLimitMap = new Map<string, { count: number; expires: number }>();

/**
 * Evaluates whether an incoming IP address has exceeded the rate limit threshold.
 *
 * @param ip - Client IP address string.
 * @returns True if request is allowed within rate limit bounds, false if rate limit is exceeded.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.expires < now) {
    rateLimitMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count > RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}

/**
 * Normalizes an API origin URL string, upgrading insecure non-localhost protocols to HTTPS.
 *
 * @param raw - The raw origin string or environment variable value.
 * @returns Normalized origin URL string with trailing slashes removed.
 */
export function normalizeApiOrigin(raw: string | undefined): string {
  const fallback = "https://api.infinitedim.dev";
  if (!raw?.trim()) return fallback;
  try {
    const parsed = new URL(raw.trim());
    if (
      parsed.protocol === "http:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    ) {
      parsed.protocol = "https:";
    }
    return parsed.origin;
  } catch {
    return raw.trim().replace(/\/+$/, "");
  }
}

/**
 * Converts an HTTP/HTTPS origin URL into its corresponding WebSocket (ws:/wss:) origin.
 *
 * @param httpOrigin - The HTTP/HTTPS origin URL to convert.
 * @returns The converted WebSocket origin URL.
 */
function toWebSocketOrigin(httpOrigin: string): string {
  try {
    const parsed = new URL(httpOrigin);
    parsed.protocol = parsed.protocol === "http:" ? "ws:" : "wss:";
    return parsed.origin;
  } catch {
    return httpOrigin;
  }
}

/**
 * Generates the Content Security Policy (CSP) header string tailored for production or development modes.
 *
 * @param isDev - Whether the current execution environment is development.
 * @returns Formatted Content-Security-Policy header string.
 */
function buildCsp(isDev: boolean): string {
  const apiOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com",
      "https://vercel.live",
      "https://challenges.cloudflare.com",
      "https://*.challenges.cloudflare.com",
      "https://challenge.cloudflare.com",
      "https://*.challenge.cloudflare.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "script-src-elem": [
      "'self'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com",
      "https://vercel.live",
      "https://challenges.cloudflare.com",
      "https://*.challenges.cloudflare.com",
      "https://challenge.cloudflare.com",
      "https://*.challenge.cloudflare.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": [
      "'self'",
      "blob:",
      "data:",
      "https://avatars.githubusercontent.com",
      "https://raw.githubusercontent.com",
      "https://infinitedim.dev",
      "https://storage.googleapis.com",
    ],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      apiOrigin,
      toWebSocketOrigin(apiOrigin),
      "https://giscus.app",
      "https://api.github.com",
      "https://vitals.vercel-insights.com",
      "https://vercel.live",
      "https://challenges.cloudflare.com",
      "https://*.challenges.cloudflare.com",
      "https://challenge.cloudflare.com",
      "https://*.challenge.cloudflare.com",
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": [
      "'self'",
      "https://giscus.app",
      "https://vercel.live",
      "https://challenges.cloudflare.com",
      "https://*.challenges.cloudflare.com",
      "https://challenge.cloudflare.com",
      "https://*.challenge.cloudflare.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length ? `${key} ${values.join(" ")}` : key,
    )
    .join("; ");
}

/**
 * Constructs standard security headers including CSP, X-Content-Type-Options, and Referrer-Policy.
 *
 * @param csp - The serialized Content Security Policy string.
 * @returns Key-value header dictionary.
 */
function getSecurityHeaders(csp: string): Record<string, string> {
  return {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

/**
 * Calculates Cross-Origin Resource Sharing (CORS) headers based on an allowed origin whitelist.
 *
 * @param origin - The incoming Origin request header value.
 * @param allowed - List of permitted origins.
 * @returns CORS headers object containing Access-Control-Allow-Origin if permitted.
 */
function getCORSHeaders(
  origin: string,
  allowed: string[],
): Record<string, string> {
  return allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin }
    : {};
}

/**
 * Determines whether the portfolio security gate feature is enabled via environment variables.
 *
 * @returns True if gate authentication is active, otherwise false.
 */
export function isGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GATE_ENABLED !== "false";
}

/**
 * Verifies whether the request supplies a valid gate bypass secret header.
 *
 * @param request - The incoming NextRequest instance.
 * @returns True if request contains valid x-gate-bypass secret header.
 */
export function hasGateBypass(request: NextRequest): boolean {
  const secret = process.env.GATE_BYPASS_SECRET;
  if (!secret) return false;
  return request.headers.get("x-gate-bypass") === secret;
}

/**
 * Checks whether the incoming request possesses an authorized portfolio gate cookie.
 *
 * @param request - The incoming NextRequest instance.
 * @returns True if the portfolio_gate cookie exists and contains a value.
 */
export function hasGateCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get("portfolio_gate")?.value);
}

/**
 * Resolves redirection logic for protected routes (/gate and /terminal) based on gate authorization state and device type.
 *
 * @param request - The incoming NextRequest instance.
 * @returns A NextResponse redirect if navigation redirect is required, otherwise null.
 */
export function resolveGateRedirect(request: NextRequest): NextResponse | null {
  if (!isGateEnabled()) return null;
  if (hasGateBypass(request)) return null;

  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const isMobileUserAgent =
    /mobile|iphone|android|ipod/i.test(userAgent) &&
    !/ipad|tablet/i.test(userAgent);

  if (pathname === "/gate" || pathname.startsWith("/gate/")) {
    if (isMobileUserAgent) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (hasGateCookie(request)) {
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
  }

  if (pathname === "/terminal" || pathname.startsWith("/terminal/")) {
    if (!hasGateCookie(request)) {
      return NextResponse.redirect(new URL("/gate", request.url));
    }
  }

  return null;
}

/**
 * Primary edge proxy middleware executing security checks, rate limiting, gate routing,
 * device detection, caching policies, and performance logging.
 *
 * @param request - The incoming NextRequest instance.
 * @returns A NextResponse object with configured security headers, tracking headers, or redirect/error responses.
 */
export function proxy(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.toLowerCase() === "/resume.pdf") {
    return new NextResponse(
      "Direct access to resume.pdf is blocked. Please use the download verification on the site.",
      {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  const gateRedirect = resolveGateRedirect(request);
  if (gateRedirect) {
    return gateRedirect;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (ip !== "unknown" && !checkRateLimit(ip)) {
    edgeLogger.warn("Rate limit exceeded", { ip, path: request.nextUrl.pathname });
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  const requestId = crypto.randomUUID();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(isDevelopment);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("X-Request-ID", requestId);

  const securityHeaders = getSecurityHeaders(csp);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  if (isDevelopment) {
    return response;
  }

  const startTime = Date.now();

  const userAgentHeader = request.headers.get("user-agent") || "";
  const device = { type: "desktop" };
  const browser: BrowserInfo = { name: "unknown" };

  if (/mobile/i.test(userAgentHeader)) {
    device.type = "mobile";
  } else if (/tablet|ipad/i.test(userAgentHeader)) {
    device.type = "tablet";
  }

  if (/chrome/i.test(userAgentHeader) && !/edg/i.test(userAgentHeader)) {
    browser.name = "Chrome";
    const match = userAgentHeader.match(/Chrome\/(\d+)/i);
    if (match) browser.version = match[1];
  } else if (/firefox/i.test(userAgentHeader)) {
    browser.name = "firefox";
    const match = userAgentHeader.match(/Firefox\/(\d+)/i);
    if (match) browser.version = match[1];
  } else if (
    /safari/i.test(userAgentHeader) &&
    !/chrome/i.test(userAgentHeader)
  ) {
    browser.name = "safari";
    const match = userAgentHeader.match(/Version\/(\d+)/i);
    if (match) browser.version = match[1];
  } else if (/edg/i.test(userAgentHeader)) {
    browser.name = "edge";
    const match = userAgentHeader.match(/Edg(?:e|)\/(\d+)/i);
    if (match) browser.version = match[1];
  }

  const origin = request.headers.get("origin") || "";
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

  const corsHeaders = getCORSHeaders(origin, allowedOrigins);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  if (device.type === "mobile") {
    response.headers.set("X-Device-Type", "mobile");
    response.headers.set("Vary", "User-Agent");
  } else if (device.type === "tablet") {
    response.headers.set("X-Device-Type", "tablet");
    response.headers.set("Vary", "User-Agent");
  } else {
    response.headers.set("X-Device-Type", "desktop");
  }

  const suspiciousPatterns = [
    /\.\.\//,
    /<script/i,
    /union.*select/i,
    /javascript:/i,
  ];
  const url = request.url;

  if (
    suspiciousPatterns.some(
      (pattern) => pattern.test(url) || pattern.test(userAgentHeader),
    )
  ) {
    edgeLogger.warn("Suspicious request detected", {
      requestId,
      url,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: userAgentHeader,
    });
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  } else if (pathname.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else if (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/skills")
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
  }

  const country = (request as NextRequestWithGeo).geo?.country || "US";
  const region = (request as NextRequestWithGeo).geo?.region || "Unknown";
  response.headers.set("X-Geo-Country", country);
  response.headers.set("X-Geo-Region", region);

  const responseTime = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${responseTime}ms`);

  edgeLogger.info("http", {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    statusCode: response.status,
    responseTime,
    userAgent: userAgentHeader,
    referer: request.headers.get("referer"),
    deviceType: response.headers.get("X-Device-Type"),
  });

  if (responseTime > 1000) {
    edgeLogger.warn("Slow request detected", {
      requestId,
      url: request.url,
      method: request.method,
      responseTime,
      threshold: 1000,
    });
  }

  return response;
}

/**
 * Next.js middleware configuration specifying route matcher exclusions.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|theme-init.js).*)",
  ],
};
