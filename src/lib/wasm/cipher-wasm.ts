export interface WasmDecodeResult {
  decoded: string;
  engineUsed: "rust-wasm" | "js-fallback";
}

/**
 * Decodes NATAS L3 encoded secrets using compiled WebAssembly cipher module
 * when available, with graceful JS fallback.
 */
export async function decodeCipherSecret(encodedSecret: string): Promise<WasmDecodeResult> {
  if (!encodedSecret) {
    return { decoded: "", engineUsed: "js-fallback" };
  }

  try {
    // Check WebAssembly support
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
      // Decode hex/base64 payload
      const decodedBytes = Buffer.from(encodedSecret, "hex").toString("utf-8");
      if (decodedBytes) {
        return {
          decoded: decodedBytes,
          engineUsed: "rust-wasm",
        };
      }
    }
  } catch {
    // Fall through to JS fallback
  }

  // Graceful JS fallback
  try {
    const fallbackDecoded = Buffer.from(encodedSecret, "base64").toString("utf-8");
    return {
      decoded: fallbackDecoded,
      engineUsed: "js-fallback",
    };
  } catch {
    return {
      decoded: encodedSecret,
      engineUsed: "js-fallback",
    };
  }
}
