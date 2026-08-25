/**
 * Result structure returned when serializing data into a binary buffer.
 *
 * @interface BinaryEncodeResult
 * @property {Uint8Array} buffer - The encoded binary byte buffer containing UTF-8 serialized JSON payload.
 * @property {number} byteLength - Total size of the encoded buffer in bytes.
 */
export interface BinaryEncodeResult {
  buffer: Uint8Array;
  byteLength: number;
}

/**
 * Encodes a JavaScript object or record into a binary `Uint8Array` using UTF-8 text encoding.
 *
 * @template T - Object structure extending a record with string keys and unknown values.
 * @param {T} data - The payload object to serialize into binary format.
 * @returns {BinaryEncodeResult} An object containing the binary `Uint8Array` buffer and its byte length.
 * @example
 * ```ts
 * const result = encodeBinaryMessage({ type: "ping", seq: 1 });
 * console.log(result.byteLength); // number of bytes
 * ```
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
 * Decodes a binary `Uint8Array` or `ArrayBuffer` back into its original typed JavaScript representation.
 *
 * @template T - The expected output data structure type.
 * @param {Uint8Array | ArrayBuffer} buffer - The binary buffer or raw array buffer to decode.
 * @returns {T} The parsed JavaScript data structure parsed from the decoded UTF-8 string.
 * @throws {SyntaxError} If the decoded UTF-8 string is not valid JSON.
 * @example
 * ```ts
 * const data = decodeBinaryMessage<{ type: string; seq: number }>(buffer);
 * console.log(data.type); // "ping"
 * ```
 */
export function decodeBinaryMessage<T = unknown>(buffer: Uint8Array | ArrayBuffer): T {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const jsonString = new TextDecoder().decode(bytes);
  return JSON.parse(jsonString) as T;
}

