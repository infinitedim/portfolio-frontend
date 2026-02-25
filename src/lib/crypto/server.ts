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

const CURVE = "prime256v1";
const AES_ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PBKDF2_SALT_LENGTH = 16;

const SESSION_TTL =
  parseInt(process.env.CRYPTO_SESSION_TTL ?? "", 10) || 15 * 60 * 1000;
const PBKDF2_ITERATIONS =
  parseInt(process.env.CRYPTO_PBKDF2_ITERATIONS ?? "", 10) || 100_000;

interface CryptoSession {
  aesKey: Buffer;
  hmacKey: Buffer;
  expiresAt: number;
}

const sessions = new Map<string, CryptoSession>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(id);
  }
}

export interface HandshakeResult {
  sessionId: string;
  serverPublicKeyB64: string;
  pbkdf2Salt: string;
  pbkdf2Iterations: number;
  expiresAt: number;
}

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

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  tag: string;
  hmac: string;
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

export function fingerprintHash(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}
