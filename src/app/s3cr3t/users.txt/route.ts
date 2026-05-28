import { getServerApiUrl } from "@/lib/api/get-api-url";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const response = await fetch(
    `${getServerApiUrl()}/api/gate/challenge/2/users.txt`,
    { cache: "no-store" },
  );

  const body = await response.text();

  if (!response.ok) {
    return new NextResponse(body || "Not found", { status: response.status });
  }

  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
