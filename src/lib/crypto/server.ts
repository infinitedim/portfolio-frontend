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

/** Elliptic curve name used for ECDH key agreement. */
const CURVE = "prime256v1";
/** Symmetric cipher algorithm identifier for payload encryption. */
const AES_ALGO = "aes-256-gcm";
/** Initialization vector byte length for AES-GCM (12 bytes / 96 bits). */
const IV_LENGTH = 12;
/** Authentication tag byte length for AES-GCM (16 bytes / 128 bits). */
const TAG_LENGTH = 16;
/** Salt byte length for PBKDF2 key derivation. */
const PBKDF2_SALT_LENGTH = 16;

/** Session time-to-live in milliseconds before key material expires. */
const SESSION_TTL =
  parseInt(process.env.CRYPTO_SESSION_TTL ?? "", 10) || 15 * 60 * 1000;
/** Iteration count for PBKDF2-SHA256 key stretching. */
const PBKDF2_ITERATIONS =
  parseInt(process.env.CRYPTO_PBKDF2_ITERATIONS ?? "", 10) || 100_000;

/**
 * Server-side stored cryptographic session record holding derived symmetric keys.
 *
 * @interface CryptoSession
 * @property {Buffer} aesKey - 256-bit AES-GCM symmetric encryption key.
 * @property {Buffer} hmacKey - 256-bit HMAC-SHA256 signing key.
 * @property {number} expiresAt - Millisecond timestamp marking session expiry.
 */
interface CryptoSession {
  /** 32-byte AES-256 symmetric key. */
  aesKey: Buffer;
  /** 32-byte HMAC signing key. */
  hmacKey: Buffer;
  /** Expiration timestamp in milliseconds. */
  expiresAt: number;
}

/** In-memory registry of active server cryptographic sessions mapped by session ID. */
const sessions = new Map<string, CryptoSession>();

/**
 * Sweeps the in-memory session registry and deletes expired cryptographic sessions.
 *
 * @returns {void}
 */
function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(id);
  }
}

/**
 * Result payload returned from a successful server-side cryptographic handshake.
 *
 * @interface HandshakeResult
 * @property {string} sessionId - Unique hexadecimal session identifier.
 * @property {string} serverPublicKeyB64 - Base64-encoded server ECDH P-256 public key.
 * @property {string} pbkdf2Salt - Base64-encoded salt used for PBKDF2 key stretching.
 * @property {number} pbkdf2Iterations - Iteration count used for PBKDF2 derivation.
 * @property {number} expiresAt - Millisecond timestamp at which the session expires.
 */
export interface HandshakeResult {
  /** Generated unique session identifier. */
  sessionId: string;
  /** Server's public ECDH key encoded in Base64. */
  serverPublicKeyB64: string;
  /** Salt used in key derivation encoded in Base64. */
  pbkdf2Salt: string;
  /** Number of iterations used in PBKDF2. */
  pbkdf2Iterations: number;
  /** Expiration timestamp in milliseconds. */
  expiresAt: number;
}

/**
 * Handles the server side of an ECDH P-256 key exchange.
 * Generates an ephemeral ECDH keypair, derives a shared secret against the client's public key,
 * stretches the secret via PBKDF2 into AES and HMAC keys, registers the session, and returns handshake parameters.
 *
 * @param {string} clientPublicKeyB64 - The client's Base64-encoded ECDH public key.
 * @returns {HandshakeResult} Handshake parameters needed by the client to derive corresponding keys.
 */
export function serverHandshake(clientPublicKeyB64: string): HandshakeResult {
  pruneExpired();

  const clientPublicKeyBuf = Buffer.from(clientPublicKeyB64, "base64");

  const ecdh = createECDH(CURVE);
  ecdh.generateKeys();

  const sharedSecret = ecdh.computeSecret(clientPublicKeyBuf);

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

/**
 * Representation of an encrypted payload envelope transmitted to or received from the client.
 *
 * @interface EncryptedPayload
 * @property {string} iv - Base64-encoded 12-byte initialization vector.
 * @property {string} ciphertext - Base64-encoded encrypted data.
 * @property {string} tag - Base64-encoded 16-byte AES-GCM authentication tag.
 * @property {string} hmac - Base64-encoded HMAC-SHA256 signature.
 */
export interface EncryptedPayload {
  /** Base64-encoded initialization vector. */
  iv: string;
  /** Base64-encoded ciphertext. */
  ciphertext: string;
  /** Base64-encoded authentication tag. */
  tag: string;
  /** Base64-encoded HMAC-SHA256 integrity signature. */
  hmac: string;
}

/**
 * Encrypts a plaintext string for an active session using AES-256-GCM and attaches an HMAC-SHA256 signature.
 *
 * @param {string} sessionId - Identifier of the active cryptographic session.
 * @param {string} plaintext - Plaintext string to encrypt.
 * @returns {EncryptedPayload} Encrypted payload envelope containing IV, ciphertext, tag, and HMAC.
 * @throws {Error} If the session ID is unknown or expired.
 */
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

/**
 * Decrypts an encrypted payload envelope received from a client for a given session.
 * Validates the HMAC signature in constant time before decrypting the ciphertext via AES-256-GCM.
 *
 * @param {string} sessionId - Identifier of the active cryptographic session.
 * @param {EncryptedPayload} payload - The encrypted envelope to decrypt.
 * @returns {string} The decrypted UTF-8 plaintext string.
 * @throws {Error} If the session is unknown, expired, HMAC validation fails, or authentication tag mismatch occurs.
 */
export function serverDecrypt(
  sessionId: string,
  payload: EncryptedPayload,
): string {
  const session = getSession(sessionId);
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");

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

/**
 * Computes an HMAC-SHA256 digest over the sessionId, IV, ciphertext, and tag buffers.
 *
 * @param {Buffer} hmacKey - 32-byte HMAC key buffer.
 * @param {string} sessionId - Active session identifier string.
 * @param {Buffer} iv - Initialization vector buffer.
 * @param {Buffer} ciphertext - Ciphertext byte buffer.
 * @param {Buffer} tag - Authentication tag byte buffer.
 * @returns {string} Base64-encoded HMAC signature.
 */
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

/**
 * Retrieves a session from the internal registry, throwing an error if absent or expired.
 *
 * @param {string} sessionId - Identifier of the session to fetch.
 * @returns {CryptoSession} The active session record.
 * @throws {Error} If the session does not exist or has expired.
 */
function getSession(sessionId: string): CryptoSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Unknown crypto session: ${sessionId}`);
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    throw new Error(`Crypto session expired: ${sessionId}`);
  }
  return session;
}

/**
 * Verifies whether a valid, unexpired cryptographic session exists for the given session ID.
 * Automatically purges expired sessions encountered.
 *
 * @param {string} sessionId - Session identifier to check.
 * @returns {boolean} `true` if an active, unexpired session exists; otherwise `false`.
 */
export function hasSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

/**
 * Refreshes the expiration timestamp of an active cryptographic session.
 *
 * @param {string} sessionId - Identifier of the session to refresh.
 * @returns {void}
 */
export function refreshSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) session.expiresAt = Date.now() + SESSION_TTL;
}

/**
 * Computes a 16-character hexadecimal fingerprint hash from an IP address and User-Agent header.
 * Useful for client request correlation and fraud detection.
 *
 * @param {string} ip - Client IP address string.
 * @param {string} userAgent - Client User-Agent header string.
 * @returns {string} Truncated 16-character hexadecimal SHA-256 digest.
 */
export function fingerprintHash(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}

