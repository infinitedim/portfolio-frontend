"use client";

/**
 * Represents an encrypted payload envelope transmitted between client and server.
 *
 * @interface EncryptedEnvelope
 * @property {string} iv - Base64-encoded 12-byte initialization vector used for AES-GCM encryption.
 * @property {string} ciphertext - Base64-encoded ciphertext produced by AES-GCM encryption.
 * @property {string} tag - Base64-encoded 16-byte authentication tag from AES-GCM.
 * @property {string} hmac - Base64-encoded HMAC-SHA256 signature validating sessionId, iv, ciphertext, and tag.
 * @property {string} sessionId - Identifier of the active cryptographic session established during handshake.
 */
export interface EncryptedEnvelope {
  /** Base64-encoded initialization vector. */
  iv: string;
  /** Base64-encoded ciphertext payload. */
  ciphertext: string;
  /** Base64-encoded authentication tag. */
  tag: string;
  /** Base64-encoded HMAC signature over the envelope components. */
  hmac: string;
  /** Active session identifier tied to the shared symmetric keys. */
  sessionId: string;
}

/**
 * Represents an active client cryptographic session containing derived symmetric keys and expiration timestamp.
 *
 * @interface ClientSession
 * @property {string} sessionId - Unique cryptographic session identifier established during handshake.
 * @property {CryptoKey} aesKey - AES-256-GCM symmetric CryptoKey used for payload encryption and decryption.
 * @property {CryptoKey} hmacKey - HMAC-SHA256 CryptoKey used for message authentication and integrity checks.
 * @property {number} expiresAt - Millisecond timestamp indicating when the session expires.
 */
interface ClientSession {
  /** Unique session identifier. */
  sessionId: string;
  /** Derived AES-GCM key for symmetric encryption/decryption. */
  aesKey: CryptoKey;
  /** Derived HMAC key for signing and verifying payload integrity. */
  hmacKey: CryptoKey;
  /** Unix epoch timestamp (in milliseconds) at which the session expires. */
  expiresAt: number;
}

/**
 * Converts an ArrayBuffer or Uint8Array binary buffer into a standard Base64 encoded string.
 *
 * @param {ArrayBuffer | Uint8Array} buffer - The binary buffer to encode.
 * @returns {string} The Base64 string representation of the binary buffer.
 */
function buf2b64(buffer: ArrayBuffer | Uint8Array): string {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...arr));
}

/**
 * Converts a Base64 encoded string into a Uint8Array byte array.
 *
 * @param {string} b64 - The Base64 string to decode.
 * @returns {Uint8Array} Decoded binary bytes as a Uint8Array.
 */
function b642buf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Slices a Uint8Array into a strict, isolated ArrayBuffer suitable for Web Cryptography API calls.
 * Ensures offsets and lengths are properly bound to avoid WebCrypto ArrayBufferView bounds issues.
 *
 * @param {Uint8Array} u8 - The Uint8Array view to extract the ArrayBuffer from.
 * @returns {ArrayBuffer} An isolated ArrayBuffer containing exactly the slice of bytes.
 */
function toStrictBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength,
  ) as ArrayBuffer;
}

/**
 * Computes an HMAC-SHA256 signature across concatenated envelope segments (sessionId, IV, ciphertext, and auth tag).
 *
 * @param {CryptoKey} hmacKey - Web Crypto HMAC key used for signing.
 * @param {string} sessionId - Active session identifier string.
 * @param {Uint8Array} iv - Initialization vector byte buffer.
 * @param {Uint8Array} ciphertext - Encrypted ciphertext byte buffer.
 * @param {Uint8Array} tag - Authentication tag byte buffer.
 * @returns {Promise<string>} Base64-encoded HMAC-SHA256 digest.
 */
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

/**
 * Compares two Uint8Array buffers in constant time to prevent timing attacks.
 *
 * @param {Uint8Array} a - First byte buffer to compare.
 * @param {Uint8Array} b - Second byte buffer to compare.
 * @returns {boolean} `true` if buffers have identical length and byte contents; otherwise `false`.
 */
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Derives symmetric AES-256-GCM and HMAC-SHA256 CryptoKeys from an ECDH P-256 key exchange
 * followed by PBKDF2-SHA256 key stretching using the provided salt and iteration count.
 *
 * @param {CryptoKey} clientPrivate - The client's ECDH private CryptoKey.
 * @param {Uint8Array} serverPublicRaw - Raw uncompressed bytes of the server's ECDH public key.
 * @param {Uint8Array} pbkdf2Salt - Salt bytes used for PBKDF2 derivation.
 * @param {number} pbkdf2Iterations - Number of PBKDF2 iterations.
 * @returns {Promise<{ aesKey: CryptoKey; hmacKey: CryptoKey }>} Derived AES and HMAC CryptoKeys.
 */
async function deriveKeys(
  clientPrivate: CryptoKey,
  serverPublicRaw: Uint8Array,
  pbkdf2Salt: Uint8Array,
  pbkdf2Iterations: number,
): Promise<{ aesKey: CryptoKey; hmacKey: CryptoKey }> {
  const serverPublic = await crypto.subtle.importKey(
    "raw",
    toStrictBuffer(serverPublicRaw),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPublic },
    clientPrivate,
    256,
  );

  const pbkdf2Base = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const masterKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toStrictBuffer(pbkdf2Salt),
      iterations: pbkdf2Iterations,
    },
    pbkdf2Base,
    512,
  );

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

let _session: ClientSession | null = null;
let _handshakeInFlight: Promise<ClientSession> | null = null;

/**
 * Validates whether the currently cached client cryptographic session is populated and unexpired.
 *
 * @returns {boolean} `true` if a valid unexpired session exists; otherwise `false`.
 */
function sessionValid(): boolean {
  return !!_session && _session.expiresAt > Date.now();
}

/**
 * Initiates and executes an ECDH P-256 handshake with the server's `/api/crypto/handshake` endpoint.
 * Generates an ephemeral ECDH key pair, exchanges public keys, derives shared secrets,
 * and constructs an active ClientSession.
 *
 * @returns {Promise<ClientSession>} The established client session containing keys and expiration info.
 * @throws {Error} If the server handshake request fails or returns a non-OK status.
 */
async function performHandshake(): Promise<ClientSession> {
  const clientKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const clientPubRaw = await crypto.subtle.exportKey(
    "raw",
    clientKeyPair.publicKey,
  );
  const clientPublicKeyB64 = buf2b64(clientPubRaw);

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
    pbkdf2Salt: string;
    pbkdf2Iterations: number;
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

/**
 * Retrieves the currently active client session, automatically initiating or reusing an in-flight
 * handshake promise if no valid session is currently cached.
 *
 * @returns {Promise<ClientSession>} The active client cryptographic session.
 */
async function getSession(): Promise<ClientSession> {
  if (sessionValid()) return _session!;

  if (!_handshakeInFlight) {
    _handshakeInFlight = performHandshake().finally(() => {
      _handshakeInFlight = null;
    });
  }

  _session = await _handshakeInFlight;
  return _session;
}

/**
 * Encrypts a plaintext string using the current active session's AES-256-GCM key and signs the
 * envelope with the session HMAC key.
 *
 * @param {string} plaintext - UTF-8 string payload to encrypt.
 * @returns {Promise<EncryptedEnvelope>} The encrypted envelope containing Base64 ciphertext, IV, tag, HMAC, and sessionId.
 */
export async function clientEncrypt(
  plaintext: string,
): Promise<EncryptedEnvelope> {
  const session = await getSession();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toStrictBuffer(iv), tagLength: 128 },
    session.aesKey,
    encoded,
  );

  const ctBuf = new Uint8Array(ciphertextWithTag);
  const ciphertext = ctBuf.slice(0, ctBuf.length - 16);
  const tag = ctBuf.slice(ctBuf.length - 16);

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

/**
 * Verifies the integrity of an encrypted envelope via HMAC-SHA256 and decrypts the ciphertext
 * using the active session's AES-256-GCM key.
 *
 * @param {Omit<EncryptedEnvelope, "sessionId">} envelope - Encrypted envelope containing IV, ciphertext, tag, and HMAC.
 * @returns {Promise<string>} The decrypted UTF-8 plaintext string.
 * @throws {Error} If HMAC verification fails or decryption fails.
 */
export async function clientDecrypt(
  envelope: Omit<EncryptedEnvelope, "sessionId">,
): Promise<string> {
  const session = await getSession();

  const iv = b642buf(envelope.iv);
  const ciphertext = b642buf(envelope.ciphertext);
  const tag = b642buf(envelope.tag);

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

/**
 * Clears the cached client session and resets any in-flight handshake promise, forcing the next
 * crypto operation to perform a fresh handshake.
 *
 * @returns {void}
 */
export function resetClientSession(): void {
  _session = null;
  _handshakeInFlight = null;
}

/**
 * Checks if there is a currently valid, active, and unexpired client cryptographic session.
 *
 * @returns {boolean} `true` if an unexpired session exists; otherwise `false`.
 */
export function hasActiveSession(): boolean {
  return sessionValid();
}

