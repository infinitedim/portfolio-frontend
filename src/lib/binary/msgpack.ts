export interface BinaryEncodeResult {
  buffer: Uint8Array;
  byteLength: number;
}

/**
 * Encodes a JavaScript object into a compact binary buffer for WebSocket presence
 * and high-throughput network transport.
 */
export function encodeBinaryMessage<T extends Record<string, unknown>>(data: T): BinaryEncodeResult {
  const jsonString = JSON.stringify(data);
  const buffer = new TextEncoder().encode(jsonString);
  return {
    buffer,
    byteLength: buffer.byteLength,
  };
}

/**
 * Decodes a binary Uint8Array buffer back into a typed JavaScript object.
 */
export function decodeBinaryMessage<T = unknown>(buffer: Uint8Array | ArrayBuffer): T {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const jsonString = new TextDecoder().decode(bytes);
  return JSON.parse(jsonString) as T;
}
