/**
 * Represents the outcome of a fast non-cryptographic hashing calculation.
 *
 * @interface HashResult
 * @property {string} hashHex - Hexadecimal encoded string representation of the computed hash digest.
 * @property {"bun-hash" | "web-crypto"} engineUsed - Identifier of the execution engine or algorithm utilized to compute the hash.
 */
export interface HashResult {
  /** The hexadecimal representation of the computed hash. */
  hashHex: string;
  /** The engine implementation used to compute the hash. */
  engineUsed: "bun-hash" | "web-crypto";
}

/**
 * Shape of Bun's native high-performance hash namespace exposed on the global object.
 *
 * @interface BunHashGlobal
 */
interface BunHashGlobal {
  /**
   * Computes a 64-bit Wyhash value for the specified input string using native Bun bindings.
   *
   * @param {string} input - The string to hash.
   * @returns {bigint | number} The 64-bit Wyhash integer value.
   */
  wyhash?(input: string): bigint | number;
  /**
   * Computes a 32-bit CRC32 checksum for the specified input string using native Bun bindings.
   *
   * @param {string} input - The string to hash.
   * @returns {number} The 32-bit integer checksum value.
   */
  crc32?(input: string): number;
}

/**
 * Computes a fast non-cryptographic string hash.
 * Prioritizes the native Bun Wyhash accelerator when executing within the Bun runtime,
 * and falls back gracefully to a 32-bit bitwise shift hash in standard browser or Node.js environments.
 *
 * @param {string} input - The input string to be hashed.
 * @returns {HashResult} An object containing the computed hexadecimal hash string and the engine identifier used.
 */
export function fastHashString(input: string): HashResult {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { hash?: BunHashGlobal }
    | undefined;

  if (bunGlobal && typeof bunGlobal.hash?.wyhash === "function") {
    try {
      const hashVal = bunGlobal.hash.wyhash(input);
      return {
        hashHex: hashVal.toString(16),
        engineUsed: "bun-hash",
      };
    } // eslint-disable-next-line no-empty
    catch {}
  }

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return {
    hashHex: Math.abs(hash).toString(16),
    engineUsed: "web-crypto",
  };
}

/**
 * Verifies whether an input string matches an expected hexadecimal hash digest.
 * Computes the hash using `fastHashString` and performs equality comparison against the expected value.
 *
 * @param {string} input - The raw input string to verify.
 * @param {string} expectedHashHex - The expected hexadecimal hash digest string to compare against.
 * @returns {boolean} `true` if the computed hash strictly matches the expected hash; otherwise `false`.
 */
export function fastVerifyHash(input: string, expectedHashHex: string): boolean {
  const result = fastHashString(input);
  return result.hashHex === expectedHashHex;
}
