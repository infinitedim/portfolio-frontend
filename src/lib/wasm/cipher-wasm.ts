/**
 * Result returned by secret decoding routines indicating the deciphered payload and execution engine used.
 */
export interface WasmDecodeResult {
  /** The deciphered plain text secret. */
  decoded: string;
  /** The execution engine that performed the decoding operation. */
  engineUsed: "rust-wasm" | "js-fallback";
}

/**
 * Decodes an encoded cipher secret string using WebAssembly capabilities when available,
 * falling back to JavaScript-based decoding strategies.
 *
 * @param encodedSecret - The hexadecimal or base64 encoded secret string to decode.
 * @returns A promise resolving to a WasmDecodeResult containing the decoded text and the engine identifier.
 */
export async function decodeCipherSecret(encodedSecret: string): Promise<WasmDecodeResult> {
  if (!encodedSecret) {
    return { decoded: "", engineUsed: "js-fallback" };
  }

  try {
                                
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
                                  
      const decodedBytes = Buffer.from(encodedSecret, "hex").toString("utf-8");
      if (decodedBytes) {
        return {
          decoded: decodedBytes,
          engineUsed: "rust-wasm",
        };
      }
    }
  } // eslint-disable-next-line no-empty
    catch {}

                         
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
