import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  clientEncrypt,
  clientDecrypt,
  resetClientSession,
  hasActiveSession,
} from "../client";

describe("crypto/client", () => {
  beforeEach(() => {
    resetClientSession();
  });

  afterEach(() => {
    resetClientSession();
  });

  it("hasActiveSession should return false initially or after reset", () => {
    expect(hasActiveSession()).toBe(false);
  });

  it("handshake failure should throw Error and clear in-flight promise", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ error: "Handshake refused" }), { status: 500 }),
    ) as unknown as typeof fetch;

    try {
      await expect(clientEncrypt("hello")).rejects.toThrow("Crypto handshake failed");
      expect(hasActiveSession()).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should complete ECDH handshake, encrypt plaintext, and decrypt envelope back", async () => {
                                                                     
    const serverKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const serverPubRaw = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
    const serverPublicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(serverPubRaw)));
    const pbkdf2Salt = btoa("0123456789abcdef");

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      expect(body.clientPublicKey).toBeDefined();

      return new Response(
        JSON.stringify({
          sessionId: "mock-session-123",
          serverPublicKeyB64,
          pbkdf2Salt,
          pbkdf2Iterations: 1000,
          expiresAt: Date.now() + 3600_000,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      const plaintext = "Hello Secret World 🚀";
      const envelope = await clientEncrypt(plaintext);

      expect(envelope.sessionId).toBe("mock-session-123");
      expect(envelope.iv).toBeDefined();
      expect(envelope.ciphertext).toBeDefined();
      expect(envelope.tag).toBeDefined();
      expect(envelope.hmac).toBeDefined();
      expect(hasActiveSession()).toBe(true);

                
      const decrypted = await clientDecrypt({
        iv: envelope.iv,
        ciphertext: envelope.ciphertext,
        tag: envelope.tag,
        hmac: envelope.hmac,
      });

      expect(decrypted).toBe(plaintext);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("clientDecrypt should throw HMAC verification error when tampered", async () => {
    const serverKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const serverPubRaw = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
    const serverPublicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(serverPubRaw)));

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            sessionId: "mock-session-tamper",
            serverPublicKeyB64,
            pbkdf2Salt: btoa("saltsaltsaltsalt"),
            pbkdf2Iterations: 1000,
            expiresAt: Date.now() + 3600_000,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    ) as unknown as typeof fetch;

    try {
      const envelope = await clientEncrypt("test-tamper");
      const tamperedHmac = btoa("bad-hmac-data-signature");

      await expect(
        clientDecrypt({
          iv: envelope.iv,
          ciphertext: envelope.ciphertext,
          tag: envelope.tag,
          hmac: tamperedHmac,
        }),
      ).rejects.toThrow("HMAC verification failed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
