/**
 * Higher-order function that wraps a Next.js API route handler with
 * AES-256-GCM decryption (request) + encryption (response).
 *
 * Non-encrypted requests (X-Encrypted header absent) are passed through
 * unchanged so the route still works from server-to-server calls, health
 * checks, and the Rust backend.
 *
 * Logging is NOT affected: decryption happens before any logger is called
 * inside the handler, so Loki / Prometheus always see plaintext.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  serverDecrypt,
  serverEncrypt,
  hasSession,
  refreshSession,
  type EncryptedPayload,
} from "./server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteHandler<C = unknown> = (
  req: NextRequest,
  context: C,
) => Promise<NextResponse> | NextResponse;

// ---------------------------------------------------------------------------
// withEncryption HOF
// ---------------------------------------------------------------------------

export function withEncryption<C = unknown>(
  handler: RouteHandler<C>,
): RouteHandler<C> {
  return async (req: NextRequest, context: C): Promise<NextResponse> => {
    const encrypted = req.headers.get("x-encrypted");

    // ── Pass-through for non-encrypted callers (server-to-server, SSR) ──
    if (!encrypted || encrypted !== "1") {
      return handler(req, context);
    }

    const sessionId = req.headers.get("x-session-id") ?? "";

    // ── Validate session ─────────────────────────────────────────────────
    if (!hasSession(sessionId)) {
      return NextResponse.json(
        { error: "invalid or expired crypto session — re-handshake required" },
        { status: 401 },
      );
    }

    // ── Decrypt request body ─────────────────────────────────────────────
    let decryptedBody: string | null = null;
    const contentType = req.headers.get("content-type") ?? "";
    const hasBody = req.method !== "GET" && req.method !== "HEAD";

    if (hasBody && contentType.includes("application/json")) {
      let rawBody: unknown;
      try {
        rawBody = await req.json();
      } catch {
        return NextResponse.json(
          { error: "invalid JSON body" },
          { status: 400 },
        );
      }

      if (isEncryptedPayload(rawBody)) {
        try {
          decryptedBody = serverDecrypt(sessionId, rawBody);
        } catch (e) {
          return NextResponse.json(
            { error: "decryption failed", detail: (e as Error).message },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "body must be an EncryptedPayload when X-Encrypted: 1" },
          { status: 400 },
        );
      }
    }

    // ── Build a synthetic Request with the decrypted body ────────────────
    const syntheticReq = new NextRequest(req.url, {
      method: req.method,
      headers: (() => {
        const h = new Headers(req.headers);
        // Remove encryption markers so the inner handler doesn't see them
        h.delete("x-encrypted");
        h.delete("x-session-id");
        if (decryptedBody !== null) {
          h.set("content-type", "application/json");
          h.set("content-length", String(Buffer.byteLength(decryptedBody)));
        }
        return h;
      })(),
      body: decryptedBody !== null ? decryptedBody : undefined,
    });

    // ── Call the inner handler ────────────────────────────────────────────
    let innerResponse: NextResponse;
    try {
      innerResponse = await handler(syntheticReq, context);
    } catch (e) {
      return NextResponse.json(
        { error: "handler error", detail: (e as Error).message },
        { status: 500 },
      );
    }

    // ── Encrypt the response ─────────────────────────────────────────────
    let responseText: string;
    try {
      responseText = await innerResponse.text();
    } catch {
      responseText = "";
    }

    let encryptedPayload: EncryptedPayload;
    try {
      refreshSession(sessionId);
      encryptedPayload = serverEncrypt(sessionId, responseText);
    } catch (_e) {
      // Session expired between request start and response — client must re-handshake
      return NextResponse.json(
        { error: "session expired during response encryption" },
        { status: 401 },
      );
    }

    return NextResponse.json(encryptedPayload, {
      status: innerResponse.status,
      headers: {
        "x-encrypted": "1",
        "x-session-id": sessionId,
        // Forward relevant response headers (e.g. Cache-Control)
        ...extractSafeHeaders(innerResponse.headers),
      },
    });
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEncryptedPayload(v: unknown): v is EncryptedPayload {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).iv === "string" &&
    typeof (v as Record<string, unknown>).ciphertext === "string" &&
    typeof (v as Record<string, unknown>).tag === "string" &&
    typeof (v as Record<string, unknown>).hmac === "string"
  );
}

const SAFE_RESPONSE_HEADERS = [
  "cache-control",
  "x-request-id",
  "x-response-time",
];

function extractSafeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of SAFE_RESPONSE_HEADERS) {
    const val = headers.get(name);
    if (val) out[name] = val;
  }
  return out;
}
