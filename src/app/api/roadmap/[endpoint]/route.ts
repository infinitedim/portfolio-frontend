import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

/**
 * Allowlist of valid roadmap proxy endpoint identifiers.
 */
const ALLOWED = ["streak", "dashboard", "teams", "favourites"] as const;

/**
 * Union type representing allowed roadmap proxy endpoint paths.
 */
type Endpoint = (typeof ALLOWED)[number];

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
 * Handler for GET requests that proxies roadmap statistics and telemetry from the backend.
 *
 * @param _req - The incoming NextRequest instance.
 * @param context - The route context containing dynamic endpoint params.
 * @param context.params - Promise resolving to route parameters including endpoint name.
 * @returns A promise resolving to a NextResponse containing the roadmap JSON payload or error.
 */
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> },
): Promise<NextResponse> {
  const { endpoint } = await params;

  if (!ALLOWED.includes(endpoint as Endpoint)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/roadmap/${endpoint}`, {
      next: { revalidate: 300 },
    });

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
    console.error("[/api/roadmap] upstream fetch failed", err);
    return NextResponse.json(
      { error: "upstream unreachable" },
      { status: 502 },
    );
  }
}

/**
 * Encrypted route handler for GET requests to the roadmap proxy endpoints.
 */
export const GET = withEncryption(getHandler);
