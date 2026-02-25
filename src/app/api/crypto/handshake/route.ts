import { NextRequest, NextResponse } from "next/server";
import { serverHandshake } from "@/lib/crypto/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { clientPublicKey?: unknown };

    if (typeof body.clientPublicKey !== "string" || !body.clientPublicKey) {
      return NextResponse.json(
        { error: "clientPublicKey (base64 string) is required" },
        { status: 400 },
      );
    }

    const result = serverHandshake(body.clientPublicKey);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("[/api/crypto/handshake] error:", e);
    return NextResponse.json(
      { error: "handshake failed", detail: (e as Error).message },
      { status: 500 },
    );
  }
}
