import { NextRequest, NextResponse } from "next/server";

interface BrowserInfo {
  name: string;
  version?: string;
}

interface NextRequestWithGeo extends NextRequest {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Edge-runtime safe logger. The full pino + file-rotation logger lives in
 * `src/lib/logger/server-logger.ts` but it imports `node:fs` and `node:path`,
 * which are unavailable in the Edge Runtime where this proxy runs. We keep
 * the proxy itself lean and emit JSON lines to stdout/stderr so they still
 * land in our log aggregator (Loki / Vercel logs).
 */
const edgeLogger = {
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

/** Origin only — no trailing slash; upgrade http→https for connect-src. */
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

function toWebSocketOrigin(httpOrigin: string): string {
  try {
    const parsed = new URL(httpOrigin);
    parsed.protocol = parsed.protocol === "http:" ? "ws:" : "wss:";
    return parsed.origin;
  } catch {
    return httpOrigin;
  }
}

function buildCsp(isDev: boolean, nonce: string): string {
  const apiOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https://va.vercel-scripts.com",
      "https://vercel.live",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": [
      "'self'",
      "blob:",
      "data:",
      "https://avatars.githubusercontent.com",
      "https://raw.githubusercontent.com",
      "https://infinitedim.dev",
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
      ...(isDev ? ["ws:", "wss:"] : []),
    ],
    "frame-src": ["'self'", "https://giscus.app", "https://vercel.live"],
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

function getSecurityHeaders(csp: string): Record<string, string> {
  return {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function getCORSHeaders(
  origin: string,
  allowed: string[],
): Record<string, string> {
  return allowed.includes(origin)
    ? { "Access-Control-Allow-Origin": origin }
    : {};
}

export function isGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GATE_ENABLED !== "false";
}

export function hasGateBypass(request: NextRequest): boolean {
  const secret = process.env.GATE_BYPASS_SECRET;
  if (!secret) return false;
  return request.headers.get("x-gate-bypass") === secret;
}

export function hasGateCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get("portfolio_gate")?.value);
}

export function resolveGateRedirect(request: NextRequest): NextResponse | null {
  if (!isGateEnabled()) return null;
  if (hasGateBypass(request)) return null;

  const { pathname } = request.nextUrl;

  if (pathname === "/gate" || pathname.startsWith("/gate/")) {
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

export function proxy(request: NextRequest): NextResponse {
  const gateRedirect = resolveGateRedirect(request);
  if (gateRedirect) {
    return gateRedirect;
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  const requestId = crypto.randomUUID();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(isDevelopment, nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("X-Request-ID", requestId);

  // Security headers (apply CSP in all environments — fail loud during dev).
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|theme-init.js).*)",
  ],
};
