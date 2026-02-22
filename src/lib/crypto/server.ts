/**
 * Server-side cryptography utilities.
 *
 * Encryption layer: Browser ↔ Next.js API routes only.
 * Next.js → Rust backend: plaintext (server-to-server, trusted).
 * Logging (Loki / Prometheus / Grafana): always receives plaintext because
 * decryption happens BEFORE any logger is invoked inside API handlers.
 *
 * Algorithm:
 *   1. ECDH P-256  — ephemeral key exchange (forward secrecy)
 *   2. PBKDF2-SHA-256 (100 000 iterations, random per-session salt)
 *      → 64 bytes of master key material
 *        [0:32]  = AES-256-GCM key
 *        [32:64] = HMAC-SHA-256 key
 *   3. AES-256-GCM — authenticated encryption of every payload
 *   4. HMAC-SHA-256 — independent MAC over (sessionId ‖ iv ‖ ciphertext ‖ tag)
 *      verified with timingSafeEqual before every decrypt
 */

import {
  createECDH,
  createHash,
  createHmac,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
  pbkdf2Sync,
} from "crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURVE = "prime256v1"; // P-256 — fixed by WebCrypto spec, not configurable
const AES_ALGO = "aes-256-gcm"; // fixed by spec
const IV_LENGTH = 12; // bytes (96-bit for GCM — fixed by spec)
const TAG_LENGTH = 16; // bytes (128-bit auth tag — fixed by spec)
const PBKDF2_SALT_LENGTH = 16; // bytes (standard recommendation)

// Configurable via env — keeps security parameters out of source code
const SESSION_TTL =
  parseInt(process.env.CRYPTO_SESSION_TTL ?? "", 10) || 15 * 60 * 1000;
const PBKDF2_ITERATIONS =
  parseInt(process.env.CRYPTO_PBKDF2_ITERATIONS ?? "", 10) || 100_000;

// ---------------------------------------------------------------------------
// Session store (module-level; lives for the process lifetime)
// ---------------------------------------------------------------------------

interface CryptoSession {
  aesKey: Buffer; // 32-byte AES-256-GCM key  (from PBKDF2 output [0:32])
  hmacKey: Buffer; // 32-byte HMAC-SHA-256 key (from PBKDF2 output [32:64])
  expiresAt: number;
}

const sessions = new Map<string, CryptoSession>();

/** Purge expired sessions (called lazily on new sessions). */
function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(id);
  }
}

// ---------------------------------------------------------------------------
// ECDH key exchange
// ---------------------------------------------------------------------------

export interface HandshakeResult {
  sessionId: string;
  serverPublicKeyB64: string; // base64 P-256 uncompressed point
  pbkdf2Salt: string; // base64, random per-session salt
  pbkdf2Iterations: number; // sent to client so it never has to hardcode this
  expiresAt: number;
}

/**
 * Perform ECDH key agreement with the client's ephemeral public key.
 * Stores the derived AES session key and returns the server's ephemeral
 * public key so the browser can derive the same shared secret.
 */
export function serverHandshake(clientPublicKeyB64: string): HandshakeResult {
  pruneExpired();

  const clientPublicKeyBuf = Buffer.from(clientPublicKeyB64, "base64");

  const ecdh = createECDH(CURVE);
  ecdh.generateKeys();

  const sharedSecret = ecdh.computeSecret(clientPublicKeyBuf);

  // PBKDF2: stretch the ECDH shared secret into 64 bytes of key material.
  // A random per-session salt is sent to the client so it can derive the
  // same keys independently.
  const salt = randomBytes(PBKDF2_SALT_LENGTH);
  const keyMaterial = pbkdf2Sync(
    sharedSecret,
    salt,
    PBKDF2_ITERATIONS,
    64,
    "sha256",
  );

  const aesKey = keyMaterial.subarray(0, 32);
  const hmacKey = keyMaterial.subarray(32, 64);

  const sessionId = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL;

  sessions.set(sessionId, { aesKey, hmacKey, expiresAt });

  return {
    sessionId,
    serverPublicKeyB64: ecdh.getPublicKey("base64"),
    pbkdf2Salt: salt.toString("base64"),
    pbkdf2Iterations: PBKDF2_ITERATIONS,
    expiresAt,
  };
}

// ---------------------------------------------------------------------------
// AES-256-GCM encrypt / decrypt
// ---------------------------------------------------------------------------

export interface EncryptedPayload {
  iv: string; // base64
  ciphertext: string; // base64
  tag: string; // base64 (AES-GCM auth tag)
  hmac: string; // base64 (HMAC-SHA-256 over sessionId ‖ iv ‖ ciphertext ‖ tag)
}

export function serverEncrypt(
  sessionId: string,
  plaintext: string,
): EncryptedPayload {
  const session = getSession(sessionId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGO, session.aesKey, iv, {
    authTagLength: TAG_LENGTH,
  });

  const enc = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const hmac = computeServerHmac(session.hmacKey, sessionId, iv, enc, tag);

  return {
    iv: iv.toString("base64"),
    ciphertext: enc.toString("base64"),
    tag: tag.toString("base64"),
    hmac,
  };
}

export function serverDecrypt(
  sessionId: string,
  payload: EncryptedPayload,
): string {
  const session = getSession(sessionId);
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");

  // Verify HMAC BEFORE touching the ciphertext (fail-fast, timing-safe)
  const expectedHmac = computeServerHmac(
    session.hmacKey,
    sessionId,
    iv,
    ciphertext,
    tag,
  );
  const expectedBuf = Buffer.from(expectedHmac, "base64");
  const receivedBuf = Buffer.from(payload.hmac, "base64");

  if (
    expectedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    throw new Error("HMAC verification failed — payload may be tampered");
  }

  const decipher = createDecipheriv(AES_ALGO, session.aesKey, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

// ---------------------------------------------------------------------------
// HMAC helper
// ---------------------------------------------------------------------------

function computeServerHmac(
  hmacKey: Buffer,
  sessionId: string,
  iv: Buffer,
  ciphertext: Buffer,
  tag: Buffer,
): string {
  const mac = createHmac("sha256", hmacKey);
  mac.update(Buffer.from(sessionId, "utf8"));
  mac.update(iv);
  mac.update(ciphertext);
  mac.update(tag);
  return mac.digest("base64");
}

// ---------------------------------------------------------------------------
// Session utils
// ---------------------------------------------------------------------------

function getSession(sessionId: string): CryptoSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Unknown crypto session: ${sessionId}`);
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    throw new Error(`Crypto session expired: ${sessionId}`);
  }
  return session;
}

export function hasSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

export function refreshSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) session.expiresAt = Date.now() + SESSION_TTL;
}

// ---------------------------------------------------------------------------
// Fingerprint helper (used to bind session to client IP)
// ---------------------------------------------------------------------------

export function fingerprintHash(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}
