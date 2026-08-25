import { NextRequest, NextResponse } from "next/server";
import { serverHandshake } from "@/lib/crypto/server";

/**
 * Handles ECDH key exchange cryptographic handshake requests from clients.
 *
 * @description
 * Accepts a base64-encoded client public key, performs the server-side ECDH key agreement
 * via {@link serverHandshake}, and returns the ephemeral server public key and derived session state.
 *
 * @param req - The incoming Next.js API request containing the JSON clientPublicKey body.
 * @returns A promise resolving to the NextResponse with the handshake payload or an error status.
 */
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
