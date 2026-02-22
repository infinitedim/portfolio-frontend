/**
 * encryptedFetch — drop-in replacement for fetch() for browser→Next.js calls.
 *
 * Transparently:
 *  1. Ensures an ECDH session exists (performs handshake if needed).
 *  2. Encrypts the request body (JSON only).
 *  3. Sends X-Encrypted: 1 + X-Session-ID headers.
 *  4. Decrypts the AES-GCM response envelope.
 *  5. Returns a synthetic Response with the plaintext body.
 *
 * Usage (identical to fetch):
 *   const data = await encryptedFetch<MyType>("/api/roadmap/dashboard");
 *   const result = await encryptedFetch<Result>("/api/auth/login", {
 *     method: "POST",
 *     body: JSON.stringify({ email, password }),
 *   });
 */

"use client";

import {
  clientEncrypt,
  clientDecrypt,
  resetClientSession,
  type EncryptedEnvelope,
} from "@/lib/crypto/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FetchOptions = Omit<RequestInit, "body"> & { body?: string };

interface EncryptedResponseEnvelope {
  iv: string;
  ciphertext: string;
  tag: string;
  hmac: string;
}

function isEncryptedEnvelope(v: unknown): v is EncryptedResponseEnvelope {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).iv === "string" &&
    typeof (v as Record<string, unknown>).ciphertext === "string" &&
    typeof (v as Record<string, unknown>).tag === "string" &&
    typeof (v as Record<string, unknown>).hmac === "string"
  );
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

const MAX_RETRY = 1; // retry once after session expiry

async function doFetch(
  url: string,
  options: FetchOptions = {},
  attempt = 0,
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody =
    method !== "GET" && method !== "HEAD" && options.body !== undefined;

  let envelope: EncryptedEnvelope | null = null;
  let sessionId: string | undefined;

  if (hasBody && typeof options.body === "string") {
    try {
      envelope = await clientEncrypt(options.body);
    } catch (e) {
      throw new Error(
        `[encryptedFetch] encrypt failed: ${(e as Error).message}`,
        { cause: e },
      );
    }
    sessionId = envelope.sessionId;
  } else {
    // For GET / body-less requests we still need a session ID so the server
    // can verify the caller. Trigger a handshake by calling encrypt on "{}".
    try {
      const dummy = await clientEncrypt("{}");
      sessionId = dummy.sessionId;
    } catch (e) {
      throw new Error(
        `[encryptedFetch] session init failed: ${(e as Error).message}`,
        { cause: e },
      );
    }
  }

  const headers = new Headers(options.headers);
  headers.set("x-encrypted", "1");
  headers.set("x-session-id", sessionId);

  if (hasBody) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body:
      hasBody && envelope
        ? JSON.stringify({
            iv: envelope.iv,
            ciphertext: envelope.ciphertext,
            tag: envelope.tag,
          })
        : undefined,
  });

  // ── Session expired → re-handshake once ────────────────────────────────
  if (res.status === 401 && attempt < MAX_RETRY) {
    resetClientSession();
    return doFetch(url, options, attempt + 1);
  }

  if (!res.ok && res.headers.get("x-encrypted") !== "1") {
    // Non-encrypted error response — return as-is
    return res;
  }

  // ── Decrypt response ────────────────────────────────────────────────────
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return res;
  }

  if (!isEncryptedEnvelope(json)) {
    // Server returned a non-encrypted error (e.g. 4xx before handler ran)
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  let plaintext: string;
  try {
    plaintext = await clientDecrypt(json);
  } catch (e) {
    // Decryption failure — re-handshake and retry
    if (attempt < MAX_RETRY) {
      resetClientSession();
      return doFetch(url, options, attempt + 1);
    }
    throw new Error(
      `[encryptedFetch] decrypt failed: ${(e as Error).message}`,
      { cause: e },
    );
  }

  return new Response(plaintext, {
    status: res.status,
    headers: {
      "content-type": "application/json",
      ...(res.headers.get("cache-control")
        ? { "cache-control": res.headers.get("cache-control")! }
        : {}),
    },
  });
}

/**
 * Encrypted fetch — JSON response automatically parsed.
 */
export async function encryptedFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const res = await doFetch(url, options);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `[encryptedFetch] ${options.method ?? "GET"} ${url} → ${res.status}: ${errText}`,
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Low-level variant that returns the raw Response (already decrypted).
 */
export async function encryptedFetchRaw(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  return doFetch(url, options);
}
