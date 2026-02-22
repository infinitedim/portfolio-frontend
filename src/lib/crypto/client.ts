/**
 * Client-side (browser) cryptography utilities.
 *
 * Uses SubtleCrypto (Web Crypto API) — no third-party dependency.
 * Mirrors the server-side algorithm exactly:
 *   1. ECDH P-256 — ephemeral key exchange
 *   2. PBKDF2-SHA-256 (iterations sent by server in handshake, salt from server handshake)
 *      → 64 bytes of master key material
 *        [0:32]  = AES-256-GCM key
 *        [32:64] = HMAC-SHA-256 key
 *   3. AES-256-GCM — authenticated encryption
 *   4. HMAC-SHA-256 — extra MAC over (sessionId ‖ iv ‖ ciphertext ‖ tag)
 *      verified before every decrypt
 *
 * NEVER import server.ts from here — this file runs in the browser.
 */

"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EncryptedEnvelope {
  iv: string; // base64
  ciphertext: string; // base64
  tag: string; // base64 (AES-GCM auth tag, separated from ciphertext)
  hmac: string; // base64 (HMAC-SHA-256 over sessionId ‖ iv ‖ ciphertext ‖ tag)
  sessionId: string;
}

interface ClientSession {
  sessionId: string;
  aesKey: CryptoKey; // AES-256-GCM
  hmacKey: CryptoKey; // HMAC-SHA-256
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buf2b64(buffer: ArrayBuffer | Uint8Array): string {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...arr));
}

function b642buf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function toStrictBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength,
  ) as ArrayBuffer;
}

// HMAC-SHA-256 over sessionId ‖ iv ‖ ciphertext ‖ tag
async function computeHmac(
  hmacKey: CryptoKey,
  sessionId: string,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
): Promise<string> {
  const sid = new TextEncoder().encode(sessionId);
  const data = new Uint8Array(
    sid.length + iv.length + ciphertext.length + tag.length,
  );
  let offset = 0;
  data.set(sid, offset);
  offset += sid.length;
  data.set(iv, offset);
  offset += iv.length;
  data.set(ciphertext, offset);
  offset += ciphertext.length;
  data.set(tag, offset);
  const sig = await crypto.subtle.sign("HMAC", hmacKey, toStrictBuffer(data));
  return buf2b64(sig);
}

// Timing-safe comparison (constant-time byte diff)
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function deriveKeys(
  clientPrivate: CryptoKey,
  serverPublicRaw: Uint8Array,
  pbkdf2Salt: Uint8Array,
  pbkdf2Iterations: number,
): Promise<{ aesKey: CryptoKey; hmacKey: CryptoKey }> {
  // Import server public key
  const serverPublic = await crypto.subtle.importKey(
    "raw",
    toStrictBuffer(serverPublicRaw),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // ECDH → raw shared secret (256 bits)
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPublic },
    clientPrivate,
    256,
  );

  // Import shared secret as PBKDF2 base key
  const pbkdf2Base = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  // PBKDF2 → 64 bytes of master key material
  const masterKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toStrictBuffer(pbkdf2Salt),
      iterations: pbkdf2Iterations,
    },
    pbkdf2Base,
    512, // 64 bytes
  );

  // Split: [0:32] = AES key, [32:64] = HMAC key
  const aesMaterial = masterKey.slice(0, 32);
  const hmacMaterial = masterKey.slice(32, 64);

  const [aesKey, hmacKey] = await Promise.all([
    crypto.subtle.importKey(
      "raw",
      aesMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    ),
    crypto.subtle.importKey(
      "raw",
      hmacMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    ),
  ]);

  return { aesKey, hmacKey };
}

// ---------------------------------------------------------------------------
// Session store (module-level singleton, memory only)
// ---------------------------------------------------------------------------

let _session: ClientSession | null = null;
let _handshakeInFlight: Promise<ClientSession> | null = null;

function sessionValid(): boolean {
  return !!_session && _session.expiresAt > Date.now();
}

// ---------------------------------------------------------------------------
// Handshake
// ---------------------------------------------------------------------------

async function performHandshake(): Promise<ClientSession> {
  // Generate client ephemeral ECDH key-pair
  const clientKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  // Export client public key (raw uncompressed point → base64)
  const clientPubRaw = await crypto.subtle.exportKey(
    "raw",
    clientKeyPair.publicKey,
  );
  const clientPublicKeyB64 = buf2b64(clientPubRaw);

  // Hit the handshake endpoint (plaintext by design — this IS the key exchange)
  const res = await fetch("/api/crypto/handshake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientPublicKey: clientPublicKeyB64 }),
  });

  if (!res.ok) throw new Error("Crypto handshake failed");

  const {
    sessionId,
    serverPublicKeyB64,
    pbkdf2Salt,
    pbkdf2Iterations,
    expiresAt,
  } = (await res.json()) as {
    sessionId: string;
    serverPublicKeyB64: string;
    pbkdf2Salt: string; // base64, random per-session salt for PBKDF2
    pbkdf2Iterations: number; // server sends this — client never hardcodes it
    expiresAt: number;
  };

  const serverPubRaw = b642buf(serverPublicKeyB64);
  const saltRaw = b642buf(pbkdf2Salt);

  const { aesKey, hmacKey } = await deriveKeys(
    clientKeyPair.privateKey,
    serverPubRaw,
    saltRaw,
    pbkdf2Iterations,
  );

  return { sessionId, aesKey, hmacKey, expiresAt };
}

async function getSession(): Promise<ClientSession> {
  if (sessionValid()) return _session!;

  // Deduplicate concurrent handshakes
  if (!_handshakeInFlight) {
    _handshakeInFlight = performHandshake().finally(() => {
      _handshakeInFlight = null;
    });
  }

  _session = await _handshakeInFlight;
  return _session;
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

export async function clientEncrypt(
  plaintext: string,
): Promise<EncryptedEnvelope> {
  const session = await getSession();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  // AES-256-GCM encrypt; WebCrypto appends the 16-byte auth tag
  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toStrictBuffer(iv), tagLength: 128 },
    session.aesKey,
    encoded,
  );

  // Separate last 16 bytes (tag) from ciphertext
  const ctBuf = new Uint8Array(ciphertextWithTag);
  const ciphertext = ctBuf.slice(0, ctBuf.length - 16);
  const tag = ctBuf.slice(ctBuf.length - 16);

  // Compute HMAC over sessionId ‖ iv ‖ ciphertext ‖ tag
  const hmac = await computeHmac(
    session.hmacKey,
    session.sessionId,
    iv,
    ciphertext,
    tag,
  );

  return {
    iv: buf2b64(iv),
    ciphertext: buf2b64(ciphertext),
    tag: buf2b64(tag),
    hmac,
    sessionId: session.sessionId,
  };
}

export async function clientDecrypt(
  envelope: Omit<EncryptedEnvelope, "sessionId">,
): Promise<string> {
  const session = await getSession();

  const iv = b642buf(envelope.iv);
  const ciphertext = b642buf(envelope.ciphertext);
  const tag = b642buf(envelope.tag);

  // Verify HMAC before decrypting (fail-fast)
  const expectedHmac = await computeHmac(
    session.hmacKey,
    session.sessionId,
    iv,
    ciphertext,
    tag,
  );
  if (!safeEqual(b642buf(envelope.hmac), b642buf(expectedHmac))) {
    throw new Error("HMAC verification failed — response may be tampered");
  }

  // Reassemble ciphertext+tag for WebCrypto
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toStrictBuffer(iv), tagLength: 128 },
    session.aesKey,
    toStrictBuffer(combined),
  );

  return new TextDecoder().decode(plainBuf);
}

/** Force a new handshake on next use (e.g. after session expiry error). */
export function resetClientSession(): void {
  _session = null;
  _handshakeInFlight = null;
}

/** Returns true if there is a valid active session. */
export function hasActiveSession(): boolean {
  return sessionValid();
}
