export interface WasmDecodeResult {
  decoded: string;
  engineUsed: "rust-wasm" | "js-fallback";
}

   
                                                                            
                                             
   
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
