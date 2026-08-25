import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { encryptedFetch, encryptedFetchRaw } from "../encrypted-fetch";
import { serverHandshake, serverEncrypt } from "../server";
import { resetClientSession } from "../client";

describe("crypto/encrypted-fetch", () => {
  beforeEach(() => {
    resetClientSession();
  });

  afterEach(() => {
    resetClientSession();
  });

  it("encryptedFetch should perform session handshake, encrypt request, and decrypt server response envelope", async () => {
    let serverSessionId = "";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/crypto/handshake")) {
        const { clientPublicKey } = JSON.parse(init?.body as string);
        const handshake = serverHandshake(clientPublicKey);
        serverSessionId = handshake.sessionId;
        return new Response(JSON.stringify(handshake), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

                              
      const headers = new Headers(init?.headers);
      expect(headers.get("x-encrypted")).toBe("1");
      expect(headers.get("x-session-id")).toBe(serverSessionId);

                                          
      const responseData = { result: "Success Data", count: 42 };
      const encryptedResponse = serverEncrypt(serverSessionId, JSON.stringify(responseData));

      return new Response(JSON.stringify(encryptedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    try {
      const data = await encryptedFetch<{ result: string; count: number }>("/api/test-data");
      expect(data.result).toBe("Success Data");
      expect(data.count).toBe(42);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("encryptedFetch should send encrypted POST body payload when body is provided", async () => {
    let serverSessionId = "";
    let receivedPayload: unknown;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/crypto/handshake")) {
        const { clientPublicKey } = JSON.parse(init?.body as string);
        const handshake = serverHandshake(clientPublicKey);
        serverSessionId = handshake.sessionId;
        return new Response(JSON.stringify(handshake), { status: 200 });
      }

      if (init?.method === "POST") {
        receivedPayload = JSON.parse(init.body as string);
        const encryptedResponse = serverEncrypt(serverSessionId, JSON.stringify({ ok: true }));
        return new Response(JSON.stringify(encryptedResponse), { status: 200 });
      }

      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    try {
      const res = await encryptedFetch<{ ok: boolean }>("/api/submit", {
        method: "POST",
        body: JSON.stringify({ input: "test" }),
      });
      expect(res.ok).toBe(true);
      expect(receivedPayload).toHaveProperty("iv");
      expect(receivedPayload).toHaveProperty("ciphertext");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("encryptedFetch should handle plain non-encrypted json response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/crypto/handshake")) {
        const { clientPublicKey } = JSON.parse(init?.body as string);
        return new Response(JSON.stringify(serverHandshake(clientPublicKey)), { status: 200 });
      }
      return new Response(JSON.stringify({ plain: "data" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    try {
      const data = await encryptedFetch<{ plain: string }>("/api/plain");
      expect(data.plain).toBe("data");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("encryptedFetchRaw should return raw Response object", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/crypto/handshake")) {
        const { clientPublicKey } = JSON.parse(init?.body as string);
        return new Response(JSON.stringify(serverHandshake(clientPublicKey)), { status: 200 });
      }
      return new Response("Raw response text", { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const res = await encryptedFetchRaw("/api/raw");
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("Raw response text");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("encryptedFetch should throw formatted error on non-200 HTTP response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/crypto/handshake")) {
        const { clientPublicKey } = JSON.parse(init?.body as string);
        return new Response(JSON.stringify(serverHandshake(clientPublicKey)), { status: 200 });
      }
      return new Response("Unauthorized resource access", { status: 403 });
    }) as unknown as typeof fetch;

    try {
      await expect(encryptedFetch("/api/forbidden")).rejects.toThrow(
        "[encryptedFetch] GET /api/forbidden → 403: Unauthorized resource access",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
