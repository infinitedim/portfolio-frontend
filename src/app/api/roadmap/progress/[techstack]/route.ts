import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "@/lib/crypto/with-encryption";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ techstack: string }> },
): Promise<NextResponse> {
  const { techstack } = await params;

  if (!techstack) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/roadmap/progress/${techstack}`, {
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
    console.error(`[/api/roadmap/progress/${techstack}] upstream fetch failed`, err);
    return NextResponse.json(
      { error: "upstream unreachable" },
      { status: 502 },
    );
  }
}

export const GET = withEncryption(getHandler);
