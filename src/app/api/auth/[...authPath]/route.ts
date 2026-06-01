import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

async function handleAuthProxy(
  req: NextRequest,
  { params }: { params: Promise<{ authPath: string[] }> },
): Promise<NextResponse> {
  const { authPath } = await params;
  const subpath = authPath.join("/");
  const url = `${getBackendUrl()}/api/auth/${subpath}`;

  // Build upstream headers — only forward what the Rust backend needs
  const upstreamHeaders = new Headers();
  upstreamHeaders.set(
    "content-type",
    req.headers.get("content-type") ?? "application/json",
  );
  upstreamHeaders.set("accept", "application/json");

  // Forward cookies (HttpOnly refresh token lives here)
  const cookie = req.headers.get("cookie");
  if (cookie) upstreamHeaders.set("cookie", cookie);

  // Forward Authorization bearer if present
  const auth = req.headers.get("authorization");
  if (auth) upstreamHeaders.set("authorization", auth);

  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  let body: string | undefined;

  if (hasBody) {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(url, {
      method,
      headers: upstreamHeaders,
      body,
      cache: "no-store",
    });

    const data = await upstream.json();

    // Build response, preserving Set-Cookie from the Rust backend so the
    // browser stores the HttpOnly refresh-token cookie on this BFF origin.
    const resHeaders = new Headers();

    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    for (const sc of setCookies) {
      // Strip any Domain= attribute so the cookie is scoped to the BFF
      // origin (Vercel / localhost:3000), not the Cloud Run domain.
      const rehomed = sc.replace(/;\s*Domain=[^;]*/gi, "");
      resHeaders.append("set-cookie", rehomed);
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`[/api/auth/${subpath}] upstream proxy failed:`, err);
    return NextResponse.json(
      { error: "Auth service temporarily unavailable" },
      { status: 502 },
    );
  }
}

export const POST = withEncryption(handleAuthProxy);
