import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

const ALLOWED = ["streak", "dashboard", "teams", "favourites"] as const;
type Endpoint = (typeof ALLOWED)[number];

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

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

export const GET = withEncryption(getHandler);
