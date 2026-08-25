import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

/**
 * Resolves the backend service base URL from environment variables with local fallback.
 *
 * @returns The resolved backend base URL.
 */
function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

/**
 * Handler for GET requests that proxies roadmap progress data for a specified tech stack from the backend.
 *
 * @param _req - The incoming NextRequest instance.
 * @param context - The route context containing dynamic tech stack params.
 * @param context.params - Promise resolving to route parameters including tech stack identifier.
 * @returns A promise resolving to a NextResponse containing the roadmap progress JSON payload or error.
 */
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ techstack: string }> },
): Promise<NextResponse> {
  const { techstack } = await params;

  if (!techstack) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${getBackendUrl()}/api/roadmap/progress/${techstack}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream error", status: res.status },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error(
      `[/api/roadmap/progress/${techstack}] upstream fetch failed`,
      err,
    );
    return NextResponse.json(
      { error: "upstream unreachable" },
      { status: 502 },
    );
  }
}

/**
 * Encrypted route handler for GET requests to the roadmap progress endpoint.
 */
export const GET = withEncryption(getHandler);
