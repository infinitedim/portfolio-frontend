import { describe, it, expect } from "bun:test";
import { NextRequest, NextResponse } from "next/server";
import { withEncryption } from "../with-encryption";
import { serverHandshake, serverDecrypt, serverEncrypt } from "../server";

describe("crypto/with-encryption", () => {
  it("should passthrough unencrypted request when x-encrypted header is missing", async () => {
    const handler = withEncryption(async (_req: Request) => {
      return NextResponse.json({ message: "Secret data payload" });
    });

    const request = new NextRequest("http://localhost:3000/api/test");
    const response = await handler(request, {});

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Secret data payload");
  });

  it("should return 401 when x-encrypted: 1 but session id is missing or invalid", async () => {
    const handler = withEncryption(async () => {
      return NextResponse.json({ message: "secret" });
    });

    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-encrypted": "1", "x-session-id": "invalid-session" },
    });
    const response = await handler(request, {});

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toContain("invalid or expired crypto session");
  });

  it("should return 400 when encrypted request body is invalid json or not an EncryptedPayload", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const handshake = serverHandshake(btoa(String.fromCharCode(...new Uint8Array(clientPubRaw))));

    const handler = withEncryption(async () => NextResponse.json({ ok: true }));

    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "x-encrypted": "1",
        "x-session-id": handshake.sessionId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ notAnEnvelope: true }),
    });

    const response = await handler(request, {});
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("body must be an EncryptedPayload when X-Encrypted: 1");
  });

  it("should decrypt incoming request body and encrypt outgoing response for valid session", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const handshake = serverHandshake(btoa(String.fromCharCode(...new Uint8Array(clientPubRaw))));

                                            
    const requestPayload = serverEncrypt(handshake.sessionId, JSON.stringify({ ping: "pong" }));

    const handler = withEncryption(async (req) => {
      const body = await req.json();
      expect(body.ping).toBe("pong");
      return NextResponse.json({ status: "success", received: body.ping });
    });

    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "x-encrypted": "1",
        "x-session-id": handshake.sessionId,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const response = await handler(request, {});
    expect(response.status).toBe(200);
    expect(response.headers.get("x-encrypted")).toBe("1");
    expect(response.headers.get("x-session-id")).toBe(handshake.sessionId);

    const encryptedResponseBody = await response.json();
    const decryptedResponseText = serverDecrypt(handshake.sessionId, encryptedResponseBody);
    const decryptedResponseJson = JSON.parse(decryptedResponseText);

    expect(decryptedResponseJson.status).toBe("success");
    expect(decryptedResponseJson.received).toBe("pong");
  });

  it("should return 500 when inner handler throws an exception", async () => {
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    );
    const clientPubRaw = await crypto.subtle.exportKey("raw", clientKeyPair.publicKey);
    const handshake = serverHandshake(btoa(String.fromCharCode(...new Uint8Array(clientPubRaw))));

    const handler = withEncryption(async () => {
      throw new Error("Internal route error");
    });

    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-encrypted": "1", "x-session-id": handshake.sessionId },
    });

    const response = await handler(request, {});
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("handler error");
    expect(json.detail).toBe("Internal route error");
  });
});
