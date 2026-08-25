import { describe, it, expect } from "bun:test";
import {
  serverHandshake,
  serverEncrypt,
  serverDecrypt,
  hasSession,
  refreshSession,
  fingerprintHash,
} from "../server";
import { clientEncrypt, clientDecrypt, resetClientSession } from "../client";

describe("crypto/server", () => {
  it("fingerprintHash should produce 16-character hex hash", () => {
    const hash = fingerprintHash("127.0.0.1", "Mozilla/5.0");
    expect(hash).toHaveLength(16);
    expect(fingerprintHash("127.0.0.1", "Mozilla/5.0")).toBe(hash);
    expect(fingerprintHash("10.0.0.1", "Mozilla/5.0")).not.toBe(hash);
  });

  it("serverHandshake should generate session and server public key", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const clientPublicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(clientPubRaw)));

    const result = serverHandshake(clientPublicKeyB64);
    expect(result.sessionId).toBeDefined();
    expect(result.serverPublicKeyB64).toBeDefined();
    expect(result.pbkdf2Salt).toBeDefined();
    expect(hasSession(result.sessionId)).toBe(true);

    refreshSession(result.sessionId);
    expect(hasSession(result.sessionId)).toBe(true);
  });

  it("serverEncrypt and serverDecrypt round trip", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const clientPublicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(clientPubRaw)));

    const handshake = serverHandshake(clientPublicKeyB64);

    const message = "Server Secret Message 🛡️";
    const payload = serverEncrypt(handshake.sessionId, message);

    expect(payload.iv).toBeDefined();
    expect(payload.ciphertext).toBeDefined();
    expect(payload.tag).toBeDefined();
    expect(payload.hmac).toBeDefined();

    const decrypted = serverDecrypt(handshake.sessionId, payload);
    expect(decrypted).toBe(message);
  });

  it("serverDecrypt should throw error when payload is tampered", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const handshake = serverHandshake(btoa(String.fromCharCode(...new Uint8Array(clientPubRaw))));

    const payload = serverEncrypt(handshake.sessionId, "Authentic Text");
    const tampered = { ...payload, hmac: btoa("invalid-hmac-data") };

    expect(() => serverDecrypt(handshake.sessionId, tampered)).toThrow("HMAC verification failed");
  });

  it("serverEncrypt should throw error for unknown or expired session", () => {
    expect(() => serverEncrypt("non-existent-session-id", "test")).toThrow("Unknown crypto session");
    expect(hasSession("non-existent-session-id")).toBe(false);
  });

  it("interoperability: clientEncrypt decrypted by serverDecrypt & vice-versa", async () => {
    resetClientSession();

    // Mock fetch for client handshake to hit serverHandshake
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const { clientPublicKey } = JSON.parse(init?.body as string);
      const handshake = serverHandshake(clientPublicKey);
      return new Response(JSON.stringify(handshake), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    try {
      const clientMessage = "Client to Server Confidential Message";
      const clientEnvelope = await clientEncrypt(clientMessage);

      // Server decrypts client message
      const serverDecrypted = serverDecrypt(clientEnvelope.sessionId, {
        iv: clientEnvelope.iv,
        ciphertext: clientEnvelope.ciphertext,
        tag: clientEnvelope.tag,
        hmac: clientEnvelope.hmac,
      });
      expect(serverDecrypted).toBe(clientMessage);

      // Server encrypts response message
      const serverResponseText = "Server to Client Confidential Response";
      const serverEnvelope = serverEncrypt(clientEnvelope.sessionId, serverResponseText);

      // Client decrypts server response
      const clientDecrypted = await clientDecrypt({
        iv: serverEnvelope.iv,
        ciphertext: serverEnvelope.ciphertext,
        tag: serverEnvelope.tag,
        hmac: serverEnvelope.hmac,
      });
      expect(clientDecrypted).toBe(serverResponseText);
    } finally {
      globalThis.fetch = originalFetch;
      resetClientSession();
    }
  });
});
