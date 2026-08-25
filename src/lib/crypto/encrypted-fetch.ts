"use client";

import {
  clientEncrypt,
  clientDecrypt,
  resetClientSession,
  type EncryptedEnvelope,
} from "@/lib/crypto/client";

/**
 * Custom request options for encrypted fetch operations, constraining the request body to a string.
 */
type FetchOptions = Omit<RequestInit, "body"> & { body?: string };

/**
 * Shape of an encrypted response payload returned from the backend server.
 */
interface EncryptedResponseEnvelope {
  /** Base64-encoded initialization vector. */
  iv: string;
  /** Base64-encoded encrypted response body. */
  ciphertext: string;
  /** Base64-encoded AES-GCM authentication tag. */
  tag: string;
  /** Base64-encoded HMAC-SHA256 signature for integrity validation. */
  hmac: string;
}

/**
 * Type guard that validates if an unknown value satisfies the `EncryptedResponseEnvelope` interface.
 *
 * @param v - The value to test.
 * @returns `true` if the value has valid iv, ciphertext, tag, and hmac string properties.
 */
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

/**
 * Maximum number of automatic retries permitted upon receiving a 401 Unauthorized or decryption error.
 */
const MAX_RETRY = 1;

/**
 * Internal core execution engine for encrypted HTTP requests.
 * Automatically encrypts request bodies, attaches session identifiers, handles 401 retries with
 * handshake invalidation, and decrypts incoming encrypted response envelopes.
 *
 * @param url - Target URL endpoint for the fetch request.
 * @param options - HTTP fetch options including method, headers, and string body.
 * @param attempt - Current attempt index for retry recursion.
 * @returns A synthetic standard Response containing the decrypted plaintext payload.
 * @throws If request encryption fails, session initialization fails, or response decryption fails past max retries.
 */
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
            hmac: envelope.hmac,
          })
        : undefined,
  });

  if (
    res.status === 401 &&
    attempt < MAX_RETRY &&
    res.headers.get("x-encrypted") !== "1"
  ) {
    resetClientSession();
    return doFetch(url, options, attempt + 1);
  }

  if (!res.ok && res.headers.get("x-encrypted") !== "1") {
    return res;
  }

  let json: unknown;
  try {
    json = await res.clone().json();
  } catch {
    return res;
  }

  if (!isEncryptedEnvelope(json)) {
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  let plaintext: string;
  try {
    plaintext = await clientDecrypt(json);
  } catch (e) {
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
 * Performs an end-to-end encrypted HTTP request and parses the decrypted JSON response payload.
 * Transparently encrypts the outgoing body if present and decrypts the incoming encrypted response.
 *
 * @param url - Target endpoint URL.
 * @param options - Optional request parameters and configuration.
 * @returns Promise resolving to the parsed and typed decrypted JSON data.
 * @throws If the HTTP response status is not OK or if encryption/decryption fails.
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
 * Performs an end-to-end encrypted HTTP request and returns the raw synthetic `Response` object
 * containing the decrypted plaintext payload.
 *
 * @param url - Target endpoint URL.
 * @param options - Optional request parameters and configuration.
 * @returns Promise resolving to the raw Response object with decrypted body.
 */
export async function encryptedFetchRaw(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  return doFetch(url, options);
}

