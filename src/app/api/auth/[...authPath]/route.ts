import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

/**
 * Resolves the backend server base URL from environment variables with fallback to localhost.
 *
 * @returns The resolved backend base URL string.
 */
function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

/**
 * Proxies authentication requests to the backend API service, forwarding headers and re-homing session cookies.
 *
 * @param req - The incoming Next.js server request.
 * @param context - Route context object containing dynamic route parameters.
 * @param context.params - Promise resolving to path parameters with the authPath segment array.
 * @returns A promise resolving to the proxied NextResponse.
 */
async function handleAuthProxy(
  req: NextRequest,
  { params }: { params: Promise<{ authPath: string[] }> },
): Promise<NextResponse> {
  const { authPath } = await params;
  const subpath = authPath.join("/");
  const url = `${getBackendUrl()}/api/auth/${subpath}`;

                                                                      
  const upstreamHeaders = new Headers();
  upstreamHeaders.set(
    "content-type",
    req.headers.get("content-type") ?? "application/json",
  );
  upstreamHeaders.set("accept", "application/json");

                                                        
  const cookie = req.headers.get("cookie");
  if (cookie) upstreamHeaders.set("cookie", cookie);

                                            
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

                                                                         
                                                                           
    const resHeaders = new Headers();

    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    for (const sc of setCookies) {
                                                                       
                                                                    
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

/**
 * HTTP POST handler for authentication endpoints wrapped with end-to-end payload encryption.
 */
export const POST = withEncryption(handleAuthProxy);
