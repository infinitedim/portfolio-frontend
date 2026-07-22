import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};

    const res = await fetch(`${getBackendUrl()}/api/analytics/pageview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": req.headers.get("x-forwarded-for") || "",
        "User-Agent": req.headers.get("user-agent") || "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream error", status: res.status },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true }, { status: res.status });
  } catch (err) {
    console.error("[/api/analytics/pageview] upstream fetch failed", err);
    return NextResponse.json(
      { error: "upstream unreachable" },
      { status: 502 },
    );
  }
}
