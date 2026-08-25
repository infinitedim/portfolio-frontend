export interface BinaryEncodeResult {
  buffer: Uint8Array;
  byteLength: number;
}

   
                                                                                  
                                         
   
export function encodeBinaryMessage<T extends Record<string, unknown>>(data: T): BinaryEncodeResult {
  const jsonString = JSON.stringify(data);
  const buffer = new TextEncoder().encode(jsonString);
  return {
    buffer,
    byteLength: buffer.byteLength,
  };
}

   
                                                                          
   
export function decodeBinaryMessage<T = unknown>(buffer: Uint8Array | ArrayBuffer): T {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const jsonString = new TextDecoder().decode(bytes);
  return JSON.parse(jsonString) as T;
}
