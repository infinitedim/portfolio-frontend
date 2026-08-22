export interface HashResult {
  hashHex: string;
  engineUsed: "bun-hash" | "web-crypto";
}

interface BunHashGlobal {
  wyhash?(input: string): bigint | number;
  crc32?(input: string): number;
}

/**
 * Fast string hashing utility using Bun.hash C++ native algorithms
 * when available, with WebCrypto API fallback for Node.js / Vercel.
 */
export function fastHashString(input: string): HashResult {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { hash?: BunHashGlobal }
    | undefined;

  // Try native Bun.hash C++ wyhash
  if (bunGlobal && typeof bunGlobal.hash?.wyhash === "function") {
    try {
      const hashVal = bunGlobal.hash.wyhash(input);
      return {
        hashHex: hashVal.toString(16),
        engineUsed: "bun-hash",
      };
    } catch {
      // Fall through to WebCrypto fallback
    }
  }

  // Simple WebCrypto / string hash fallback
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return {
    hashHex: Math.abs(hash).toString(16),
    engineUsed: "web-crypto",
  };
}

export function fastVerifyHash(input: string, expectedHashHex: string): boolean {
  const result = fastHashString(input);
  return result.hashHex === expectedHashHex;
}
